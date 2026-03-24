type CookiesOptions = {
    expires?: number;
    path?: string;
    secure?: boolean;
    nulltoremove?: boolean;
    autojson?: boolean;
    autoencode?: boolean;
    encode?: (val: string) => string;
    decode?: (val: string) => string;
    fallback?: (data: string, options: CookiesOptions) => any | undefined;
    namespace?: string;
    domain?: string;
    test?: (cookie: string) => void;
    [key: string]: any;  // 允许通过 string 动态访问属性
};

type CookieData = Record<string, string | number | boolean | object | undefined>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Cookies {
    (data?: string | CookieData, opt?: CookiesOptions): any; // This is the function signature
    get(key: string): any;
    set(key: string, value: any, attributes?: CookiesOptions): void;
    remove(key: string): void;
}

export function Cookies(window: Window): Cookies {
    "use strict";

    // Initialize a default options object, not the cookies function itself.
    const defaultOptions: CookiesOptions = {
        expires: 365 * 24 * 3600,
        path: "/",
        secure: window.location.protocol === "https:",
        nulltoremove: true,
        autojson: true,
        autoencode: true,
        encode: (val: string) => encodeURIComponent(val),
        decode: (val: string) => decodeURIComponent(val),
        fallback: undefined,
        namespace: 'pro__',
    };

    // Initialize the cookies function
    const cookies: Cookies = (data?: string | CookieData, opt?: CookiesOptions): any => {
        function defaults(obj: CookiesOptions | undefined, defs: CookiesOptions): CookiesOptions {
            obj = obj || {};
            for (const key in defs) {
                if (obj[key] === undefined) {
                    obj[key] = defs[key];
                }
            }
            return obj;
        }

        opt = defaults(opt, defaultOptions);

        function _expires(time: number): Date {
            const _expires = getDate();
            _expires.setTime(_expires.getTime() + time * 1e3);
            return _expires
        }

        function expires(time: number): string {
            return _expires(time).toUTCString();
        }

        function getDate(): Date {
            return new Date();
        }

        if (typeof data === "string") {
            const decodeFn = opt.decode || function (d: string) { return d; };
            let value = document.cookie.split(/;\s*/).map(decodeFn)
                .map(function (part: string) {
                    return part.split("=");
                }).reduce(function (parts: Record<string, string>, part: string[]) {
                    parts[part[0]] = part.splice(1).join("=");
                    return parts;
                }, {})[data];

            // cookie 获取为空，则尝试从 localStorage 获取
            if (typeof value === "undefined" && localStorage) {
                const _temp = opt.namespace + data;
                let _value: any = localStorage.getItem(_temp);
                if (typeof _value !== "undefined" && _value !== null) {
                    try {
                        _value = JSON.parse(_value);
                        if (!_value.expire) {
                            value = _value.value;
                        } else if (_value.expire >= getDate().getTime()) {
                            value = _value.value;
                        } else {
                            localStorage.removeItem(_temp);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }

            if (!opt.autojson) return value;
            let real;
            try {
                real = JSON.parse(value);
            } catch (e) {
                real = value;
            }
            if (typeof real === "undefined" && opt.fallback) real = opt.fallback(data, opt);
            return real;
        }

        for (const key in data) {
            const val = data[key];
            const expired = typeof val === "undefined" || (opt.nulltoremove && val === null);
            const str = opt.autojson && typeof val !== "string" ? JSON.stringify(val) : val;
            let encoded = opt.autoencode ? opt.encode!(str as string) : str;
            if (expired) encoded = "";
            const res = opt.encode!(key) + "=" + encoded + (opt.expires ? ";expires=" + expires(expired ? -1e4 : opt.expires) : "") + ";path=" + opt.path + (opt.domain ? ";domain=" + opt.domain : "") + (opt.secure ? ";secure" : "");
            if (opt.test) opt.test(res);
            document.cookie = res;

            if (localStorage) {
                const __temp = opt.namespace + key;
                localStorage.setItem(__temp, JSON.stringify({ value: val, expire: _expires(opt.expires!).getTime() }));
            }
        }
        return cookies;
    };

    cookies.get = function (key: string): any {
        return cookies(key);
    };

    cookies.set = function (key: string, value: any, attributes?: CookiesOptions): void {
        const _temp: CookieData = {};
        _temp[key] = value;
        cookies(_temp, attributes);
    };

    cookies.remove = function (key: string): void {
        const _temp: CookieData = {};
        _temp[key] = '';
        cookies(_temp, { expires: -(1 * 24 * 3600) });
    };

    return cookies;
}
