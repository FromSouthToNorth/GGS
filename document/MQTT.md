# MQTT消息模块

## 概述

MQTT消息模块负责前端与后端的实时通信，采用WebSocket连接，支持消息发布订阅、策略分发、自动重连等功能。

## 核心文件

| 文件                          | 说明                       |
| ----------------------------- | -------------------------- |
| `RealTimeData.ts`             | MQTT客户端封装（单例模式） |
| `index.ts`                    | MQTT初始化入口             |
| `publish.ts`                  | 消息发布函数               |
| `strategies.ts`               | 消息策略分发处理           |
| `types.ts`                    | 消息类型定义               |
| `useGroupCompanyLevelMine.ts` | 矿井数据Hook               |

## 1. MQTT客户端 (`src/utils/mqtt/RealTimeData.ts`)

```typescript
// src/utils/mqtt/RealTimeData.ts
/**
 * MQTT 实时数据连接模块
 * 提供 MQTT 客户端的封装，支持连接、订阅、发布等功能
 */
import mqtt, { type MqttClient, type IClientOptions } from 'mqtt'
import { v4 as uuidv4 } from 'uuid'
import pako from 'pako'
import { mqttFun } from './strategies'
import { getToken, getMineDesc, getMineName } from '@/utils/cookie'

/** 事件处理器类型 */
type EventHandler = () => void
/** 错误处理器类型 */
type ErrorHandler = (error: Error) => void
/** 订阅回调类型 */
type SubscribeCallback = (err: Error | null) => void

/** MQTT 连接配置 */
const MQTT_CONNECT_OPTIONS = {
  /** 心跳间隔（秒） */
  keepalive: 60,
  /** 重连间隔（毫秒） */
  reconnectPeriod: 4000,
  /** 连接超时（毫秒） */
  connectTimeout: 4000,
}

/**
 * MQTT 实时数据客户端类
 * 单例模式，用于与 MQTT 服务器建立连接并进行消息收发
 */
class RealTimeData {
  /** 是否启用调试模式 */
  private isDebug: boolean
  /** 调用方标识 */
  private caller: string
  /** 煤矿描述/简称 */
  mineDesc: string | undefined
  /** 煤矿全称 */
  mineName: string | undefined
  /** 访问令牌 */
  token: string | undefined
  /** 客户端唯一标识 */
  clientId: string
  /** MQTT 客户端实例 */
  client: MqttClient | undefined

  /** 连接成功回调 */
  OnConnect: EventHandler | undefined
  /** 重连回调 */
  OnReconnect: EventHandler | undefined
  /** 连接关闭回调 */
  OnClose: EventHandler | undefined
  /** 错误回调 */
  OnError: ErrorHandler | undefined

  /** 连接状态 */
  isConnection = false

  /**
   * 构造函数
   * @param isDebug - 是否启用调试模式
   * @param caller - 调用方标识
   */
  constructor(isDebug: boolean, caller: string) {
    this.isDebug = isDebug
    this.caller = caller
    this.token = getToken()
    this.mineDesc = getMineDesc()
    this.mineName = getMineName()
    this.clientId = uuidv4()
  }

  /**
   * 初始化并连接 MQTT 服务器
   * @returns this
   */
  init(): this {
    const _this = this
    const { protocol } = window.location
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${wsProtocol}//${window.location.host}${import.meta.env.VITE_PUBLIC_PATH}/mqtt`

    if (_this.isDebug) {
      console.log('MQTT 连接地址:', url)
    }

    let client: MqttClient | undefined
    try {
      client = mqtt.connect(url, {
        clientId: _this.clientId,
        username: import.meta.env.VITE_MQTT_USERNAME || 'bowwell',
        password: import.meta.env.VITE_MQTT_PASSWORD || 'bowwell',
        keepalive: MQTT_CONNECT_OPTIONS.keepalive,
        reconnectPeriod: MQTT_CONNECT_OPTIONS.reconnectPeriod,
        connectTimeout: MQTT_CONNECT_OPTIONS.connectTimeout,
        will: {
          topic: `/${_this.mineDesc}/Get/${_this.clientId}/LastWill`,
          payload: JSON.stringify({
            type: 'LastWill',
            token: _this.token,
            clientId: _this.clientId,
            caller: _this.caller,
          }),
          qos: 0,
          retain: false,
        },
      } as IClientOptions)
    } catch (error) {
      console.error('MQTT 连接错误:', error)
    }

    _this.client = client

    // 连接成功事件
    client?.on('connect', function () {
      if (_this.isDebug) console.log(`MQTT 连接成功 [${new Date().toLocaleString()}]`)
      _this.isConnection = true
      if (typeof _this.OnConnect === 'function') {
        _this.OnConnect.apply(_this)
      }
      // 发送在线状态
      client!.publish(
        `/${_this.mineDesc}/Get/${_this.clientId}/LastWill`,
        JSON.stringify({
          type: 'Online',
          token: _this.token,
          clientId: _this.clientId,
          caller: _this.caller,
        }),
      )
    })

    // 重连事件
    client?.on('reconnect', function () {
      if (_this.isDebug) console.log(`MQTT 重新连接中... [${new Date().toLocaleString()}]`)
      if (typeof _this.OnReconnect === 'function') {
        _this.OnReconnect.apply(_this)
      }
    })

    // 连接关闭事件
    client?.on('close', function () {
      if (_this.isDebug) console.log(`MQTT 连接已关闭 [${new Date().toLocaleString()}]`)
      _this.isConnection = false
      if (typeof _this.OnClose === 'function') {
        _this.OnClose.apply(_this)
      }
    })

    // 错误事件
    client?.on('error', function (error: Error) {
      if (_this.isDebug) console.log(`MQTT 错误 [${new Date().toLocaleString()}]:`, error)
      if (typeof _this.OnError === 'function') {
        _this.OnError.apply(_this, [error])
      }
    })

    // 收到消息事件
    client?.on('message', function (topic: string, message: Buffer) {
      if (!message || message.length === 0) {
        console.error(`${topic}: 收到数据为空`)
        return
      }
      try {
        // 检测 gzip 压缩数据
        const isGzip = message.length >= 2 && message[0] === 0x1f && message[1] === 0x8b
        const msgStr = isGzip ? (pako.ungzip(message, { to: 'string' }) as string) : message.toString()
        const json = JSON.parse(msgStr)
        if (_this.isDebug) {
          console.log(`MQTT 收到消息 [${new Date().toLocaleString()}]:`, topic, json)
        }
        // 分发消息到策略处理器
        mqttFun(json.generalFunc, { ...json, topic })
      } catch (e) {
        console.error('MQTT 消息解析错误:', e)
      }
    })

    return this
  }

  /**
   * 订阅主题
   * @param topic - 主题或主题数组
   * @param callback - 订阅回调
   * @returns this
   */
  subscribe(topic: string | string[], callback?: SubscribeCallback): this {
    if (this.isDebug) console.log(`订阅主题 [${new Date().toLocaleString()}]:`, topic)
    this.client?.subscribe(topic, (err) => {
      if (typeof callback === 'function') {
        callback(err ?? null)
      }
    })
    return this
  }

  /**
   * 发布消息
   * @param topic - 主题
   * @param message - 消息内容
   * @param callback - 发布回调
   * @returns this
   */
  publish(topic: string, message: string | object, callback?: SubscribeCallback): this {
    if (this.isDebug) {
      console.log(`发布消息 [${new Date().toLocaleString()}]:`, topic, message)
    }
    const payload = typeof message === 'object' ? JSON.stringify(message) : message
    this.client?.publish(topic, payload, (err) => {
      if (typeof callback === 'function') {
        callback(err ?? null)
      }
    })
    return this
  }

  /**
   * 订阅通用主题（使用通配符）
   * @returns this
   */
  subscribeCommon(): this {
    this.subscribe(`/${this.mineDesc}/Data/${this.clientId}/#`)
    return this
  }

  /**
   * 断开连接
   * @returns this
   */
  end(): this {
    if (this.client) {
      this.client.end()
      this.isConnection = false
    }
    return this
  }
}

export { RealTimeData }
```

### 连接配置

| 参数            | 值      | 说明             |
| --------------- | ------- | ---------------- |
| username        | bowwell | MQTT用户名       |
| password        | bowwell | MQTT密码         |
| keepalive       | 60      | 心跳间隔（秒）   |
| reconnectPeriod | 4000    | 重连间隔（毫秒） |
| connectTimeout  | 4000    | 连接超时（毫秒） |

## 2. MQTT初始化 (`src/utils/mqtt/index.ts`)

```typescript
// src/utils/mqtt/index.ts
import { RealTimeData } from './RealTimeData'
import { setRealTimeData } from './publish'

export const mqtt: RealTimeData = new RealTimeData(true, 'BWGGS')

export function contextInit(): void {
  try {
    setRealTimeData(mqtt)
    mqtt.init()
    mqtt.subscribeCommon()

    console.debug('[MQTT] 上下文初始化完成', {
      clientId: mqtt.clientId,
      connected: mqtt.isConnection,
    })
  } catch (error) {
    console.error('[MQTT] 上下文初始化失败', error)
    throw error
  }
}
```

## 3. 消息类型定义 (`src/utils/mqtt/types.ts`)

```typescript
// src/utils/mqtt/types.ts

// ==================== 集团矿井相关 ====================

export const GROUP_COMPANY_LEVEL_MINE = 'groupCompanyLevelMine' as const;

export const DEFAULT_TYPE = 'defaultType' as const;

export const PROMPT_MESSAGE = 'promptMessage' as const;

// ==================== 公司运维界面功能 ====================

export const COMMON_ITEMS_STAT = 'commonItemsStat' as const;

export const GROUP_COMPANY_CONTEXTMENU_ITEMS = 'groupCompanyContextmenuItems' as const;

// ==================== 类型分组 ====================

export type MessageType =
  | typeof GROUP_COMPANY_LEVEL_MINE
  | typeof DEFAULT_TYPE
  | typeof PROMPT_MESSAGE
  | typeof COMMON_ITEMS_STAT
  | typeof GROUP_COMPANY_CONTEXTMENU_ITEMS;

export const ALL_MESSAGE_TYPES: MessageType[] = [
  GROUP_COMPANY_LEVEL_MINE,
  DEFAULT_TYPE,
  PROMPT_MESSAGE,
  COMMON_ITEMS_STAT,
  GROUP_COMPANY_CONTEXTMENU_ITEMS,
];

export const GROUP_COMPANY_TYPES: MessageType[] = [
  GROUP_COMPANY_LEVEL_MINE,
  GROUP_COMPANY_CONTEXTMENU_ITEMS,
];

export const OPERATION_TYPES: MessageType[] = [COMMON_ITEMS_STAT];

export const SYSTEM_TYPES: MessageType[] = [DEFAULT_TYPE, PROMPT_MESSAGE];

export function getTypeCategory(type: string): string {
  if (GROUP_COMPANY_TYPES.includes(type as MessageType)) return '集团矿井';
  if (OPERATION_TYPES.includes(type as MessageType)) return '运维功能';
  if (SYSTEM_TYPES.includes(type as MessageType)) return '系统消息';
  return '其他';
}

export function isValidMessageType(type: string): type is MessageType {
  return ALL_MESSAGE_TYPES.includes(type as MessageType);
}

export function getTypeDescriptions(): Record<MessageType, string> {
  return {
    [GROUP_COMPANY_LEVEL_MINE]: '集团矿井层级信息',
    [DEFAULT_TYPE]: '默认消息类型',
    [PROMPT_MESSAGE]: '提示消息',
    [COMMON_ITEMS_STAT]: '通用项目统计',
    [GROUP_COMPANY_CONTEXTMENU_ITEMS]: '集团公司上下文菜单项',
  };
}
```

### 消息类型说明

| 类型                         | 说明             | 用途               |
| ---------------------------- | ---------------- | ------------------ |
| groupCompanyLevelMine        | 集团矿井层级信息 | 获取矿井列表和位置 |
| commonItemsStat              | 通用项目统计     | 获取筛选统计数据   |
| groupCompanyContextmenuItems | 上下文菜单项     | 获取右键菜单内容   |
| promptMessage                | 提示消息         | 系统通知和警告     |
| defaultType                  | 默认类型         | 通用消息处理       |

## 4. 策略分发 (`src/utils/mqtt/strategies.ts`)

```typescript
// src/utils/mqtt/strategies.ts

import {
  GROUP_COMPANY_LEVEL_MINE,
  COMMON_ITEMS_STAT,
  DEFAULT_TYPE,
  PROMPT_MESSAGE,
  GROUP_COMPANY_CONTEXTMENU_ITEMS,
  getTypeCategory,
  isValidMessageType,
  getTypeDescriptions,
  type MessageType,
} from './types';
import { useGroupCompanyLevelMine } from '@/hooks/mines/useGroupCompanyLevelMine';
import { notification, Modal, message } from 'ant-design-vue';
import { h } from 'vue';
import { useSetting } from '@/hooks/setting/useSetting';

const { setPageLoading } = useSetting()

const {
  setCommonItemsStat,
  setGroupCompanyLevelMine,
  setContextmenuItems,
} = useGroupCompanyLevelMine()

interface MqttResult {
  params: Record<string, any>;
  topic: string;
  generalFunc?: string;
}

const messageStateCode: Array<{ type: string }> = [
  { type: 'info' },
  { type: 'success' },
  { type: 'warning' },
  { type: 'error' },
];

function extractStrategyId(topic: string): string {
  const topics = topic.split('/');
  return topics[topics.length - 1];
}

function verifyResponseData(result: MqttResult): boolean {
  const { params } = result;
  if (!params.data && !params.tab) {
    const id = extractStrategyId(result.topic);
    console.warn(`[MQTT Warning] ${id} 策略，没有查询到数据！`);
    return false;
  }
  return true;
}

type StrategyHandler = (result: MqttResult) => void;

export const mqttStrategyMap = new Map<string, StrategyHandler>();

function handleGroupCompanyContextmenuItems(result: MqttResult): void {
  if (!verifyResponseData(result)) return;
  setContextmenuItems(result.params as any);
}

function handleGroupCompanyLevelMine(result: MqttResult): void {
  if (!verifyResponseData(result)) return;

  const { params } = result;
  params.data = params.data.map((item: Record<string, any>) => ({
    ...item,
    id: `${item.MineDesc}${item.name}`,
  }));

  setGroupCompanyLevelMine(params);
}

function handleCommonItemsStat(result: MqttResult): void {
  if (!verifyResponseData(result)) return;
  setCommonItemsStat(result.params as any);
}

function handlePromptMessage(result: MqttResult): void {
  const { params } = result;
  const { mesg, mesgInfo } = params as { mesg: string; mesgInfo: any };

  console.debug('收到提示消息:', params);
  setPageLoading(false);

  if (!mesgInfo) {
    notification.error({ description: mesg, duration: 6 });
    return;
  }

  let { bwurl, level } = mesgInfo as { bwurl: any; level: number };
  level = level - 11 > 3 ? 3 : level - 11;

  const messageType = messageStateCode[level]?.type || 'error';
  (message as any)[messageType](mesg, 6);

  if (!bwurl) return;

  let urlInfo: { url: any };
  try {
    urlInfo = JSON.parse(bwurl);
  } catch (error) {
    console.error('链接信息解析失败:', error);
    return;
  }

  const { url } = urlInfo;

  (notification as any)[messageType]({
    description: mesg,
    duration: null,
    btn: () =>
      h(
        'a-button',
        {
          type: 'primary',
          size: 'small',
          onClick: () => { handleMessageLink(url, messageType); },
        },
        '查看链接'
      ),
  });
}

function handleMessageLink(url: string | [string, string], messageType: string): void {
  const origin = window.location.origin;

  if (Array.isArray(url)) {
    const [action, path] = url;

    switch (action) {
      case 'popup':
        (Modal as any)[messageType]({
          content: h('iframe', {
            src: origin + path,
            style: { width: '100%', height: '400px', border: 'none' },
          }),
          className: 'popup-modal',
          width: 800,
          maskClosable: true,
          destroyOnClose: true,
        });
        break;
      case 'newwindow':
        window.open(origin + path, '_blank');
        break;
      default:
        console.warn('未知的链接动作:', action);
        window.open(origin + path, '_blank');
    }
  } else {
    window.open(origin + url, '_blank');
  }
}

export function registerStrategy(type: string, handler: StrategyHandler): void {
  if (!isValidMessageType(type)) {
    console.warn(`尝试注册无效的消息类型: ${type}`);
    return;
  }
  mqttStrategyMap.set(type, handler);
  console.debug(`策略注册成功: ${type} -> ${handler.name}`);
}

export function registerStrategies(strategies: Array<[string, StrategyHandler]>): void {
  strategies.forEach(([type, handler]) => {
    registerStrategy(type, handler);
  });
}

registerStrategies([
  [GROUP_COMPANY_LEVEL_MINE, handleGroupCompanyLevelMine],
  [COMMON_ITEMS_STAT, handleCommonItemsStat],
  [PROMPT_MESSAGE, handlePromptMessage],
  [DEFAULT_TYPE, handlePromptMessage],
  [GROUP_COMPANY_CONTEXTMENU_ITEMS, handleGroupCompanyContextmenuItems],
]);

export function processMqttMessage(type: string, result: MqttResult): boolean {
  if (!isValidMessageType(type)) {
    console.error(`无效的消息类型: ${type}`, {
      validTypes: getTypeDescriptions(),
      topic: result.topic,
    });
    return false;
  }

  const handler = mqttStrategyMap.get(type);

  if (!handler) {
    const strategyId = extractStrategyId(result.topic);
    console.error(`未找到消息类型对应的处理器: ${type}`, {
      strategyId,
      category: getTypeCategory(type),
      topic: result.topic,
    });
    return false;
  }

  try {
    console.debug(`处理 MQTT 消息: ${type}`, {
      category: getTypeCategory(type),
      topic: result.topic,
      hasParams: !!result.params,
    });
    handler(result);
    return true;
  } catch (error) {
    console.error(`消息处理失败: ${type}`, {
      error: (error as Error).message,
      stack: (error as Error).stack,
      topic: result.topic,
    });
    return false;
  }
}

export function getRegisteredStrategyCount(): number {
  return mqttStrategyMap.size;
}

export function getRegisteredStrategyTypes(): string[] {
  return Array.from(mqttStrategyMap.keys());
}

export function isStrategyRegistered(type: string): boolean {
  return mqttStrategyMap.has(type);
}

export const mqttFun = processMqttMessage;
export const mqttFunMap = mqttStrategyMap;
```

## 5. 消息发布 (`src/utils/mqtt/publish.ts`)

```typescript
// src/utils/mqtt/publish.ts
import type { RealTimeData } from './RealTimeData'

interface StrategyParam {
  name: string
  value: string
}

interface PublishPayload {
  code: number
  strategyParams: StrategyParam[]
  token?: string
  caller?: string
  mineDesc?: string
  mineName?: string
  clientId?: string
  noLink?: boolean
}

let realTimeData: RealTimeData | null = null

export function setRealTimeData(instance: RealTimeData): void {
  realTimeData = instance
}

export function objectToStrategyParams(params: Record<string, string>): StrategyParam[] {
  if (!params || typeof params !== 'object') {
    return []
  }

  return Object.entries(params).map(([key, value]) => ({
    name: key,
    value,
  }))
}

function publish(payload: PublishPayload): void {
  if (!realTimeData) {
    console.warn('MQTT 实例未初始化')
    return
  }
  const token = realTimeData.token
  const mineDesc = realTimeData.mineDesc
  const mineName = realTimeData.mineName
  const clientId = realTimeData.clientId
  const caller = import.meta.env.VITE_PRODUCT_CODE

  realTimeData.publish(
    `/${realTimeData.mineDesc}/Get/${realTimeData.clientId}`,
    {
      ...payload,
      token,
      caller,
      mineDesc,
      mineName,
      clientId,
      noLink: false,
    }
  )
}

export function groupCompanyLevelMine(parameter: Record<string, string>): void {
  publish({
    code: 4694,
    strategyParams: objectToStrategyParams(parameter),
  })
}

export function mineMenuItemsPublisher(mineName: string): void {
  publish({
    code: 7594,
    strategyParams: [
      {
        name: 'MineName',
        value: mineName,
      },
    ],
  })
}

export function commonItemsStat(parameter: Record<string, string>): void {
  publish({
    code: 5062,
    strategyParams: objectToStrategyParams(parameter),
  })
}
```

### 发布消息类型

| 函数                   | code | 用途                 |
| ---------------------- | ---- | -------------------- |
| groupCompanyLevelMine  | 4694 | 获取所有矿井数据     |
| mineMenuItemsPublisher | 7594 | 获取右键菜单项       |
| commonItemsStat        | 5062 | 获取筛选统计数据     |
| groupCompanyLevelMine  | 4694 | 获取筛选后的矿井数据 |

## 6. 数据Hook (`src/hooks/mines/useGroupCompanyLevelMine.ts`)

```typescript
// src/hooks/mines/useGroupCompanyLevelMine.ts
import { computed, ref, unref } from 'vue'
import type { ComputedRef } from 'vue'
import type { FilterCategory, ColumnConfig } from '@/types/filter'
import { fun } from './fun'

export interface CommonItemsStatData {
  data: FilterCategory[]
  columns: ColumnConfig[]
  key: string
}

export interface MenuItem {
  operation: string | ((...args: any[]) => void)
  [key: string]: any
}

export interface MenuData {
  menu: MenuItem[]
  [key: string]: any
}

export interface ContextmenuValue {
  menuItems: MenuData[]
  type: string
}

const groupCompanyLevelMine = ref<Record<string, any> | undefined>(undefined)
const commonItemsStat = ref<CommonItemsStatData | undefined>(undefined)
const contextmenuItems = ref<ContextmenuValue | undefined>(undefined)

export function useGroupCompanyLevelMine(): {
  setGroupCompanyLevelMine: (val: Record<string, any>) => void
  setCommonItemsStat: (data: CommonItemsStatData) => void
  setContextmenuItems: (val: { data: MenuData[]; type: string }) => void
  getGroupCompanyLevelMine: ComputedRef<Record<string, any> | undefined>
  getCommonItemsStat: ComputedRef<CommonItemsStatData | undefined>
  getContextmenuItems: ComputedRef<ContextmenuValue | undefined>
} {
  function setGroupCompanyLevelMine(val: Record<string, any>): void {
    groupCompanyLevelMine.value = val
  }

  function setCommonItemsStat(data: CommonItemsStatData): void {
    commonItemsStat.value = data
  }

  function setContextmenuItems(val: { data: MenuData[]; type: string }): void {
    const { data, type } = val
    const menuItems: MenuData[] = [...data]
    menuItems.forEach((e) => {
      const { menu } = e;
      menu.forEach((t) => {
        t.operation = fun[t.operation as unknown as string];
      });
    });
    contextmenuItems.value = { menuItems, type }
  }

  const getGroupCompanyLevelMine = computed(() => unref(groupCompanyLevelMine))
  const getCommonItemsStat = computed(() => unref(commonItemsStat))
  const getContextmenuItems = computed(() => unref(contextmenuItems))

  return {
    setGroupCompanyLevelMine,
    setCommonItemsStat,
    setContextmenuItems,
    getGroupCompanyLevelMine,
    getCommonItemsStat,
    getContextmenuItems,
  }
}
```

## 7. 右键菜单功能绑定 (`src/hooks/mines/fun.ts`)

```typescript
// src/hooks/mines/fun.ts

interface ClickEvent {
  field: string;
  type: string;
  [key: string]: any;
}

export const fun: Record<string, (e: ClickEvent) => void> = {
  onClick,
};

function onClick(e: ClickEvent): void {
  const { field, type } = e;
  if (!e[field]) {
    console.warn(`字段 ${field} 不存在或为空`);
    return;
  }

  const url = e[field] as string;
  switchWindow(type, url);
}

function switchWindow(type: string, url: string): void {
  try {
    switch (type) {
      case 'newWindow':
        window.open(url, '_blank', 'noopener,noreferrer');
        break;
      default:
        console.warn(`未知的窗口类型: ${type}`);
    }
  } catch (error) {
    console.error('打开窗口时发生错误:', error);
  }
}
```

## 8. 消息数据格式

### 矿井数据 (groupCompanyLevelMine)
```typescript
interface MineItem {
  MineName: string;
  name: string;
  MineDesc: string;
  ProvinceID: string;
  B: number;
  L: number;
  x: number;
  y: number;
  z: number;
  isonline: 0 | 1;
  color: 'GREEN' | 'RED' | 'GRAY' | string;
  icon: 'onlineMine' | 'offlineMine' | string;
  isalarm: 0 | 1;
  httpurl: string;
  vpnurl: string;
  '所属城市:': string;
  '项目名称:': string;
  [key: string]: any;
}
```

### 筛选数据 (commonItemsStat)
```typescript
interface FilterCategory {
  id: string;
  name: string;
  dataSource: FilterOption[];
}

interface FilterOption {
  id: string | number;
  name: string;
  field: string;
}
```

### 右键菜单 (groupCompanyContextmenuItems)
```typescript
interface MenuGroup {
  title: string;
  menu: SubMenuItem[];
}

interface SubMenuItem {
  title: string;
  field: 'url';
  url: string;
  type: 'newWindow';
}
```

## 相关文档

- [架构文档](./ARCHITECTURE.md) - 整体架构说明
- [Cesium模块](./CESIUM.md) - 地图功能详细文档
- [组件文档](./COMPONENTS.md) - UI组件说明
