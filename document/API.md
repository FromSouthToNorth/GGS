# API配置文档

## 概述

本文档描述系统中的环境变量配置、代理设置、Vite配置等内容。

## 1. 环境变量

### 开发环境变量 (.env.development)
```bash
VITE_PUBLIC_PATH=/BWGGS/
VITE_PRODUCT_CODE=BWGGS
VITE_API_BASE_URL=http://192.168.133.110:33382
VITE_MQTT_HOST=192.168.133.110
VITE_MQTT_PORT=33382
VITE_MQTT_USERNAME=bowwell
VITE_MQTT_PASSWORD=bowwell
VITE_MAP_TILE_KEY=pk.eyJ1IjoiY3VzX2JrMW02aTdwIi...
VITE_CESIUM_ION_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_TITLE=矿井地质保障系统
```

### 生产环境变量 (.env.production)
```bash
VITE_PUBLIC_PATH=/BWGGS/
VITE_PRODUCT_CODE=BWGGS
VITE_API_BASE_URL=https://production-api.example.com
VITE_MQTT_HOST=production-mqtt.example.com
VITE_MQTT_PORT=443
VITE_MQTT_USERNAME=bowwell
VITE_MQTT_PASSWORD=bowwell
VITE_MAP_TILE_KEY=pk.eyJ1IjoiY3VzX2JrMW02aTdwIi...
VITE_CESIUM_ION_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_TITLE=矿井地质保障系统
```

### 环境变量说明

| 变量名                | 说明               | 示例值                       |
| --------------------- | ------------------ | ---------------------------- |
| VITE_PUBLIC_PATH      | 应用基础路径       | /BWGGS/                      |
| VITE_PRODUCT_CODE     | 产品代码           | BWGGS                        |
| VITE_API_BASE_URL     | API基础地址        | http://192.168.133.110:33382 |
| VITE_MQTT_HOST        | MQTT服务器地址     | 192.168.133.110              |
| VITE_MQTT_PORT        | MQTT服务器端口     | 33382                        |
| VITE_MQTT_USERNAME    | MQTT用户名         | bowwell                      |
| VITE_MQTT_PASSWORD    | MQTT密码           | bowwell                      |
| VITE_MAP_TILE_KEY     | 地图瓦片访问令牌   | pk.eyJ1...                   |
| VITE_CESIUM_ION_TOKEN | Cesium Ion访问令牌 | eyJhbGci...                  |
| VITE_APP_TITLE        | 应用标题           | 矿井地质保障系统             |

## 2. 代理配置 (vite.config.ts)

```typescript
// vite.config.ts
import { defineApplicationConfig } from './vite-config/application'

export default defineApplicationConfig({
  overrides: {
    server: {
      proxy: {
        '/net': {
          target: 'http://192.168.133.110:33382/',
          changeOrigin: true,
        },
        '/gis': {
          target: 'http://192.168.133.110:33382',
        },
        '/bwmes-boot/': {
          target: 'http://192.168.133.110:33382/',
          changeOrigin: true,
        },
        '/BwMap': {
          target: 'http://192.168.133.110:33382/',
        },
        '/bwmes': {
          target: 'http://192.168.133.110:33382/',
        },
        '/Home': {
          target: 'http://192.168.133.110:33382/',
        },
        '/bwportal': {
          target: 'http://192.168.133.110:33382',
        },
        '/bwoffice': {
          target: 'http://192.168.133.110:33382',
        },
        '/BWGGS/mqtt': {
          target: 'ws://192.168.133.110:33382',
          ws: true,
          rewrite: path => path.replace(/^\/BWGGS\/mqtt/, '/mqtt'),
        },
        '/cas/': {
          target: 'http://192.168.133.110:33382',
          ws: true,
        },
        '/BwDeviceManage': {
          target: 'http://192.168.133.110:33382',
          ws: true,
        },
      },
      open: true,
      hmr: true,
      warmup: {
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
    },
  },
})
```

### 代理说明

| 代理路径        | 目标地址                      | 说明               |
| --------------- | ----------------------------- | ------------------ |
| /net            | http://192.168.133.110:33382/ | 后端API接口代理    |
| /gis            | http://192.168.133.110:33382  | GIS接口代理        |
| /bwmes-boot/    | http://192.168.133.110:33382/ | MES Boot接口代理   |
| /BwMap          | http://192.168.133.110:33382/ | Cesium瓦片代理     |
| /bwmes          | http://192.168.133.110:33382/ | MES接口代理        |
| /Home           | http://192.168.133.110:33382/ | 首页接口代理       |
| /bwportal       | http://192.168.133.110:33382  | Portal接口代理     |
| /bwoffice       | http://192.168.133.110:33382  | Office接口代理     |
| /BWGGS/mqtt     | ws://192.168.133.110:33382    | MQTT WebSocket代理 |
| /cas/           | http://192.168.133.110:33382  | CAS认证代理        |
| /BwDeviceManage | http://192.168.133.110:33382  | 设备管理代理       |

## 3. Vite配置详解

### vite-config/plugins/cesium.ts
```typescript
// vite-config/plugins/cesium.ts
import cesium from 'vite-plugin-cesium'
import type { Plugin } from 'vite'

export function configCesiumPlugin(): Plugin {
  return cesium()
}
```

### vite-config/plugins/html.ts
```typescript
// vite-config/plugins/html.ts
import { createHtmlPlugin } from 'vite-plugin-html'
import type { Plugin } from 'vite'

interface HtmlPluginOptions {
  isBuild: boolean
}

export function configHtmlPlugin({ isBuild }: HtmlPluginOptions): Plugin | Plugin[] {
  const htmlPlugin = createHtmlPlugin({
    minify: isBuild,
  })
  return htmlPlugin
}
```

### vite-config/plugins/index.ts
```typescript
// vite-config/plugins/index.ts
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import type { Plugin } from 'vite'
import { configHtmlPlugin } from './html'
import { configCesiumPlugin } from './cesium'

interface PluginOptions {
  isBuild: boolean
  root?: string
  compress?: string
}

async function createPlugins({ isBuild }: PluginOptions): Promise<(Plugin | Plugin[])[]> {
  const vitePlugins: (Plugin | Plugin[])[] = [vue(), vueJsx()]

  vitePlugins.push(configHtmlPlugin({ isBuild }))
  vitePlugins.push(configCesiumPlugin())

  return vitePlugins
}

export { createPlugins }
```

### vite-config/application.ts
```typescript
// vite-config/application.ts
import { resolve } from 'node:path'

import dayjs from 'dayjs'
import { readPackageJSON } from 'pkg-types'
import { defineConfig, loadEnv, mergeConfig, type UserConfig } from 'vite'

import { commonConfig } from './common'
import { createPlugins } from './plugins'

interface ApplicationConfigOptions {
  overrides?: UserConfig
}

function defineApplicationConfig(defineOptions: ApplicationConfigOptions = {}) {
  const { overrides = {} } = defineOptions

  return defineConfig(async ({ command, mode }) => {
    const root = process.cwd()
    const isBuild = command === 'build'
    const { VITE_BUILD_COMPRESS } = loadEnv(mode, root)

    const plugins = await createPlugins({ isBuild, root, compress: VITE_BUILD_COMPRESS })

    const defineData = await createDefineData(root)

    const pathResolve = (pathname: string): string => resolve(root, '.', pathname)
    const timestamp = new Date().getTime()
    const applicationConfig: UserConfig = {
      resolve: {
        alias: [
          {
            find: /@\//,
            replacement: `${pathResolve('src')}/`,
          },
          {
            find: /#\//,
            replacement: `${pathResolve('types')}/`,
          },
        ],
      },
      define: {
        'process.env': {},
        ...defineData,
      },
      build: {
        target: 'es2015',
        cssTarget: 'chrome80',
        rollupOptions: {
          output: {
            entryFileNames: `assets/entry/[name]-[hash]-${timestamp}.js`,
            manualChunks: {
              vue: ['vue', 'pinia', 'vue-router'],
              antd: ['ant-design-vue', '@ant-design/icons-vue'],
            },
          },
        },
      },
      css: {
        preprocessorOptions: {
          less: {
            javascriptEnabled: true,
          },
        },
      },
      plugins,
    }

    const mergedConfig = mergeConfig(commonConfig(mode), applicationConfig)

    return mergeConfig(mergedConfig, overrides)
  })
}

async function createDefineData(root: string): Promise<Record<string, string>> {
  try {
    const pkgJson = await readPackageJSON(root)
    const { dependencies, devDependencies, name, version } = pkgJson

    const __APP_INFO__ = {
      pkg: { dependencies, devDependencies, name, version },
      lastBuildTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }
    return {
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    }
  }
  catch (error) {
    return {}
  }
}

export { defineApplicationConfig }
```

### vite-config/common.ts
```typescript
// vite-config/common.ts
import type { UserConfig } from 'vite'

export function commonConfig(mode: string): UserConfig {
  return {
    server: {
      host: true,
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        maxParallelFileOps: 3,
      },
    },
  }
}
```

## 4. package.json

```json
{
  "dependencies": {
    "@ant-design/icons-vue": "^7.0.1",
    "@turf/turf": "^7.3.4",
    "@vueuse/core": "^14.2.1",
    "ant-design-vue": "^4.2.6",
    "axios": "^1.13.6",
    "cesium": "^1.139.1",
    "crypto-js": "^4.2.0",
    "d3": "^7.9.0",
    "dayjs": "^1.11.20",
    "lodash-es": "^4.17.23",
    "mqtt": "^5.15.0",
    "pako": "^2.1.0",
    "pinia": "^3.0.4",
    "rbush": "^4.0.1",
    "uuid": "^13.0.0",
    "vue": "^3.5.30",
    "vue-router": "^5.0.3",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.5",
    "@vitejs/plugin-vue-jsx": "^5.1.5",
    "less": "^4.6.3",
    "pkg-types": "^2.3.0",
    "vite": "^7.3.1",
    "vite-plugin-cesium": "^1.2.23",
    "vite-plugin-html": "^3.2.2",
    "vite-svg-loader": "^5.1.1"
  }
}
```

### 依赖说明

| 包名                  | 版本     | 说明                 |
| --------------------- | -------- | -------------------- |
| vue                   | ^3.5.30  | Vue3核心框架         |
| vue-router            | ^5.0.3   | Vue路由管理          |
| pinia                 | ^3.0.4   | Vue状态管理          |
| ant-design-vue        | ^4.2.6   | Ant Design Vue组件库 |
| @ant-design/icons-vue | ^7.0.1   | Ant Design图标库     |
| cesium                | ^1.139.1 | 3D地理可视化         |
| @turf/turf            | ^7.3.4   | 地理空间分析引擎     |
| mqtt                  | ^5.15.0  | MQTT客户端           |
| d3                    | ^7.9.0   | 数据可视化           |
| lodash-es             | ^4.17.23 | 工具库               |
| axios                 | ^1.13.6  | HTTP客户端           |
| dayjs                 | ^1.11.20 | 日期处理             |
| vite                  | ^7.3.1   | Vite构建工具         |
| vite-plugin-cesium    | ^1.2.23  | Cesium Vite插件      |
| vite-plugin-html      | ^3.2.2   | HTML处理插件         |

## 5. 入口文件配置

### index.html
```html
<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="/bwmes/favicon.png">
  <title>
    <%= VITE_PUBLIC_PATH %>
  </title>
</head>

<body>
  <div id="app"></div>
  <script src='/net/Content/Resource/SDK/bw.sso.sdk.js'></script>
  <script type="module" src="/src/main.js"></script>
</body>

</html>
```

## 6. Cookie工具 (`src/utils/cookie.ts`)

- 根目录：document/cookie.ts

## 7. 类型定义 (`src/types/filter.ts`)

```typescript
// src/types/filter.ts

export interface FilterOption {
  id: string | number;
  name: string;
  field: string;
}

export interface FilterCategory {
  id: string;
  name: string;
  dataSource: FilterOption[];
}

export interface ColumnConfig {
  dataIndex: string;
  title: string;
  ellipsis: boolean;
  width: number;
}

export interface CommonItemsStatResponse {
  params: {
    columns: ColumnConfig[];
    key: string;
    data: FilterCategory[];
  };
  generalFunc: "commonItemsStat";
}
```

## 相关文档

- [架构文档](./ARCHITECTURE.md) - 整体架构说明
- [Cesium模块](./CESIUM.md) - 地图功能详细文档
- [MQTT模块](./MQTT.md) - 消息通信详细文档
- [组件文档](./COMPONENTS.md) - UI组件说明
