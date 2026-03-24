# 系统架构文档

## 1. 项目架构

项目采用前后端分离架构，前端基于Vue 3 + Vite，后端提供RESTful API与MQTT消息服务。主要模块之间通过事件与状态管理（Pinia）解耦。

```
┌─────────────────────────────────────────────────────────────┐
│                      前端应用                                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Vue3       │  │   Pinia      │  │  vue-router  │     │
│  │   视图层     │  │   状态管理    │  │   路由管理    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Cesium     │  │   MQTT       │  │   SSO SDK    │     │
│  │   地图模块   │  │   消息通信    │  │   统一认证    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                      HTTP / WebSocket                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端服务                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   REST API   │  │   MQTT       │  │   SSO        │     │
│  │   接口       │  │   Broker     │  │   认证服务    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 2. 目录结构

```
src/
├── assets/                    # 静态资源
│   └── markerIcon/           # 地图标记图标
├── components/               # 公共组件
│   ├── Application/          # 应用初始化组件
│   ├── Loading/             # 加载组件
│   ├── MinesMap/            # 矿井地图组件
│   └── Popup/               # 弹窗组件
├── directives/               # 自定义指令
│   └── loading.ts          # v-loading指令
├── hooks/                    # 组合式函数
│   ├── cesium/              # Cesium相关钩子
│   │   └── useCesium.ts       # Cesium初始化
│   │   └── useActiveEntity.ts # Cesium active entity
│   ├── mines/               # 矿井相关钩子
│   │   ├── fun.ts
│   │   └── useGroupCompanyLevelMine.ts
│   └── setting/             # 设置相关钩子
│       └── useSetting.ts
├── layouts/                  # 布局组件
│   ├── default/            # 默认布局
│   │   ├── content/
│   │   └── index.vue
│   └── page/               # 页面布局
├── router/                  # 路由配置
│   ├── guard.ts            # 路由守卫
│   └── index.ts
├── store/                   # Pinia状态管理
│   └── modules/
│       └── cesiumStore.ts
├── types/                   # TypeScript类型定义
│   └── filter.ts
├── utils/                   # 工具函数
│   ├── cesium/             # Cesium工具
│   │   ├── clustering.ts   # 聚类功能
│   │   ├── constants.ts   # 常量配置
│   │   ├── geojson.ts     # GeoJSON转换
│   │   ├── helpers.ts     # 辅助函数
│   │   ├── icon.ts        # 图标处理
│   │   ├── index.ts       # 初始化
│   │   ├── labelConfig.ts # 标签配置
│   │   ├── on.ts          # 点击事件
│   │   └── render.ts      # 数据渲染
│   ├── mqtt/              # MQTT消息
│   │   ├── index.ts       # MQTT初始化
│   │   ├── publish.ts     # 消息发布
│   │   ├── RealTimeData.ts # MQTT客户端
│   │   ├── strategies.ts  # 策略分发
│   │   └── types.ts       # 消息类型
│   ├── cookie.ts          # Cookie工具
│   ├── is.ts              # 类型判断
│   ├── menu.ts            # 右键菜单
│   ├── sso.ts             # SSO认证
│   └── turf/              # 地理空间分析
├── views/                   # 页面视图
│   └── minesMap/          # 矿井地图页面
├── App.vue                 # 根组件
└── main.ts                 # 入口文件
```

## 3. 模块依赖关系

```
┌────────────────────────────────────────────────────────────┐
│                        main.ts                            │
│              (初始化SSO、路由、Store、指令)                   │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                        App.vue                             │
│                   (配置Provider组件)                        │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                   Application/index.vue                     │
│                  (初始化MQTT连接)                           │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      Router                                │
│                 (路由守卫+SSO认证)                          │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    MinesMap/index.vue                       │
│                      矿井地图页面                            │
└────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Sidebar.vue   │ │    Map.vue       │ │  Cesium模块     │
│   左侧筛选面板   │ │   地图容器       │ │  地图交互       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   MQTT订阅      │ │   MQTT订阅      │ │   MQTT订阅      │
│   筛选数据      │ │   矿井数据      │ │   菜单数据      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## 4. 核心模块说明

### 4.1 Cesium地图模块 (`src/utils/cesium/`)

负责地图的初始化、矿井图标展示、聚类功能、点击事件处理。

**核心文件：**
- `index.ts` - Cesium初始化和销毁
- `on.ts` - 左右键点击事件
- `clustering.ts` - 聚类功能
- `render.ts` - GeoJSON数据渲染
- `labelConfig.ts` - 标签样式配置
- `icon.ts` - 图标标记处理

**详细文档：** [Cesium模块](./CESIUM.md)

### 4.2 MQTT消息模块 (`src/utils/mqtt/`)

负责WebSocket连接管理、消息发布订阅、策略分发。

**核心文件：**
- `RealTimeData.ts` - MQTT客户端封装
- `index.ts` - MQTT初始化
- `publish.ts` - 消息发布
- `strategies.ts` - 消息策略分发
- `types.ts` - 消息类型定义

**详细文档：** [MQTT模块](./MQTT.md)

### 4.3 Pinia状态管理 (`src/store/`)

```typescript
// src/store/modules/cesiumStore.ts
import { defineStore } from 'pinia';
import type { Viewer } from 'cesium';

export const useCesiumStore = defineStore('cesium', {
  state: () => ({
    viewer: null as Viewer | null,
  }),
  actions: {
    setViewer(viewer: Viewer): void {
      this.viewer = viewer;
    },
    getViewer(): Viewer | null {
      if (!this.viewer) {
        console.warn('Cesium Viewer 未初始化');
        return null;
      }
      return this.viewer;
    },
    clearViewer(): void {
      if (this.viewer) {
        this.viewer.destroy();
      }
      this.viewer = null;
    },
  },
});
```

### 4.4 SSO认证 (`src/utils/sso.ts`)

集成BW统一认证SDK，实现单点登录。

```typescript
// src/utils/sso.ts
export function getUrlParam(name: string): string | null {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  const r = window.location.search.substr(1).match(reg);
  if (r != null) return decodeURIComponent(r[2]);
  return null;
}

export function initSSO(callback: () => void): void {
  const MINE_KEY_PARAM = 'mine_key';
  const { hostname, port } = window.location;
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get(MINE_KEY_PARAM)) {
    callback();
    return;
  }

  if (typeof BW_SSO_SDK === 'undefined' || typeof BW_SSO_SDK.SSOLogin !== 'function') {
    console.warn('BW_SSO_SDK not available');
    return;
  }

  BW_SSO_SDK.SSOLogin(hostname, port, (data: any) => {
    if (!data) {
      console.warn('SSO login failed: no data returned');
      return;
    }
    callback();
  });
}
```

## 5. 数据流

### 5.1 矿井数据加载流程

```
1. MinesMap组件挂载
        │
        ▼
2. Cesium初始化 (initializeCesium)
        │
        ▼
3. Terrain加载完成触发 groupCompanyLevelMine()
        │
        ▼
4. MQTT发布消息 (code: 4694)
        │
        ▼
5. 订阅响应 groupCompanyLevelMine
        │
        ▼
6. 策略处理 handleGroupCompanyLevelMine
        │
        ▼
7. 存储到Pinia (setGroupCompanyLevelMine)
        │
        ▼
8. 渲染GeoJSON数据 (geoJSONPointLoad)
        │
        ▼
9. 聚类配置 (setupClustering)
```

### 5.2 筛选数据流程

```
1. Sidebar组件挂载
        │
        ▼
2. 调用 commonItemsStat(parameter)
        │
        ▼
3. MQTT发布消息 (code: 5062)
        │
        ▼
4. 订阅响应 commonItemsStat
        │
        ▼
5. 策略处理 handleCommonItemsStat
        │
        ▼
6. 存储筛选数据 (setCommonItemsStat)
        │
        ▼
7. 用户选择筛选条件
        │
        ▼
8. 触发 groupCompanyLevelMine(parameter)
        │
        ▼
9. 更新矿井数据
```

### 5.3 右键菜单流程

```
1. 用户右键点击矿井图标
        │
        ▼
2. rightClick事件处理
        │
        ▼
3. 调用 mineMenuItemsPublisher(mineName)
        │
        ▼
4. MQTT发布消息 (code: 7594)
        │
        ▼
5. 订阅响应 groupCompanyContextmenuItems
        │
        ▼
6. 策略处理 handleGroupCompanyContextmenuItems
        │
        ▼
7. 存储菜单数据 (setContextmenuItems)
        │
        ▼
8. 渲染右键菜单 (utilMenu)
```

## 6. 相关文档

- [Cesium模块](./CESIUM.md) - 地图功能详细文档
- [MQTT模块](./MQTT.md) - 消息通信详细文档
- [组件文档](./COMPONENTS.md) - UI组件说明
- [API配置](./API.md) - 接口和环境配置
