# 矿井地质保障系统 - 开发计划（完整参考文档）

**文档版本**: 1.0.0

**最后更新**: 2026年3月18日20:14:29

> **注意**: 此文档已拆分为多个模块化文档，便于查阅和维护。
> 
> **模块化文档索引：**
> - [README](./README.md) - 项目概述和快速开始
> - [ARCHITECTURE](./ARCHITECTURE.md) - 系统架构和模块说明
> - [CESIUM](./CESIUM.md) - Cesium地图模块详细文档
> - [MQTT](./MQTT.md) - MQTT消息通信详细文档
> - [COMPONENTS](./COMPONENTS.md) - UI组件说明
> - [API](./API.md) - 环境变量和代理配置
> - [TURF](./TURF.md) - 地理空间分析工具

---

## 产品概述

矿井地质保障系统用于监控和管理矿井各系统的实时在线状态和地质信息的一体化管理平台。系统采用左右分栏布局，左侧筛选面板，右侧显示矿井位置图标。

## 核心功能

### 统一单点登录
- 集成BW统一认证SDK，通过SSO实现用户认证，无需独立登录页面。

### 地图交互
- **Cesium配置地图瓦片**：在线/离线/在线不运维状态统计、图表展示、数据刷新机制。
- **左键矿井图标详情组件**：矿井详情展示气泡框，包含矿井属性信息、统计数据、操作按钮等内容。
- **右键矿井图标菜单组件**：右键菜单menuItems动态内容渲染，点击交互操作（如跳转链接）。
- **右键菜单及气泡框对话**：支持跟随地图缩放和旋转进行位置调整。
- **矿井位置聚合**：对矿井位置进行聚合展示，提高地图加载性能。

### 数据交互
- **左侧筛选面板**：矿井列表、矿井详情、矿井属性展示，支持按省份、集成商、集团、年份、在线/离线/在线不运维组合筛选，与右侧地图联动。
- **地图展示**：右侧地图显示矿井位置，支持点击图标查看矿井详情。
- **MQTT数据交互**：发布订阅收到实时数据更新。
- **动态主题切换**：支持通过URL参数动态切换主题样式。
- **移动端适配**：支持在移动设备上良好显示和操作。

## 技术栈

| 技术分类           | 技术选型                      | 版本建议 | 选择理由                                               |
| ------------------ | ----------------------------- | -------- | ------------------------------------------------------ |
| 包管理器           | pnpm                          | ^10.28.0 | 用户指定，更快的安装速度，节省磁盘空间，严格的依赖解析 |
| 构建工具           | Vite                          | ^7.3.1   | 现代化构建工具，开发体验优秀，构建速度快               |
| 前端框架           | Vue3                          | ^3.5.30  | 用户指定，Composition API适合复杂业务逻辑              |
| 地图框架           | Cesium                        | ^1.139.1 | 支持3D地理数据可视化、大规模数据渲染优化景             |
| 地理空间分析引擎   | @turf/turf                    | ^7.3.4   | Turf 是一个用 JavaScript 编写的模块化地理空间分析引擎  |
| 开发语言           | TypeScript                    | ^5.9.3   | 用户指定，提供类型安全，提升代码质量                   |
| UI组件库           | Ant Design Vue                | ^4.2.6   | 用户指定，企业级设计规范，组件丰富                     |
| 图标库             | @ant-design/icons-vue         | ^7.0.1   | @ant 设计/vue 图标                                     |
| 状态管理           | Pinia                         | ^3.0.4   | Vue3官方推荐，轻量且TypeScript友好                     |
| 路由管理           | vue-router                    | ^4.6.4   | Vue生态标准方案                                        |
| MQTT客户端         | mqtt.js                       | ^5.15.0  | 自动重连的WebSocket封装                                |
| less               | less                          | ^4.6.3   | It's CSS, with just a little more.                     |
| vite-plugin-cesium | vite-plugin-cesium            | ^1.2.23  | Cesium + Vite集成优                                    |
| SSO SDK            | bw.sso.sdk.js                 | 外部引入 | BW统一单点登录SDK                                      |
| Cookie管理         | 项目根目录cookie.ts（见下文） | -        | 支持Cookie和localStorage双存储                         |

## 项目架构

项目采用前后端分离架构，前端基于Vue 3 + Vite，后端提供RESTful API与MQTT消息服务。主要模块之间通过事件与状态管理（Pinia）解耦。

## 模块划分

1. **布局模块**：主布局组件、左侧菜单组件（一级+二级菜单树表）。
2. **Cesium地图模块**：地图初始化、图层管理、位置定位、矿井图标展示、使用 `Entity Clustering` 聚合功能。
3. **右键菜单**：发布MQTT消息订阅消息获取矿井菜单项
4. **MQTT封装模块**：连接管理、消息发布、数据订阅、实时更新。
5. **统一认证模块**：SSO SDK集成、登录/登出、Token管理、权限控制、路由页面跳转控制。
6. **主题管理模块**：动态主题加载、主题切换、主题持久化。
7. **通用工具模块**：HTTP封装、本地存储。
8. **错误页面模块**：统一错误处理和展示。

## TypeScript 配置

### tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### tsconfig.app.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "#/*": ["types/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue", "vite.config.ts"]
}
```

### tsconfig.node.json
```json
{
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vite-config/**/*.ts"]
}
```

**配置说明**：
- **tsconfig.json**: 项目根配置，使用 `references` 引用应用和 Node 配置
- **tsconfig.app.json**: 应用代码配置，编译 src 目录下的代码
- **tsconfig.node.json**: Node 环境配置，编译 vite.config.ts 和 vite-config 目录
- **路径别名**: `@/*` 指向 `src/*`，`#/*` 指向 `types/*`

## package.json

```json
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
```

## 开发环境变量
```bash
VITE_PUBLIC_PATH=/BWGGS
VITE_API_BASE_URL=http://192.168.133.110:33382
VITE_MQTT_HOST=192.168.133.110
VITE_MQTT_PORT=33382
VITE_MQTT_USERNAME=bowwell
VITE_MQTT_PASSWORD=bowwell
VITE_MAP_TILE_KEY=pk.eyJ1IjoiY3VzX2JrMW02aTdwIi...
VITE_CESIUM_ION_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_TITLE=矿井地质保障系统
```

## 代理地址
| 代理路径       | 目标地址                        | 说明               |
| -------------- | ------------------------------- | ------------------ |
| `/net`         | `http://192.168.133.110:33382/` | 后端API接口代理    |
| `/BWGGS/mqtt`  | `ws://192.168.133.110:33382`    | MQTT WebSocket代理 |
| `/cas/`        | `http://192.168.133.110:33382`  | 认证地址           |
| `/BwMap`       | `http://192.168.133.110:33382/` | Cesium瓦片代理     |
| `/bwmes-boot/` | `http://192.168.133.110:33382/` | 其他API接口代理    |


## vite-config

### plugins
#### cesium
```typescript
// vite-config/plugins/cesium.ts
import cesium from 'vite-plugin-cesium'
import type { Plugin } from 'vite'

export function configCesiumPlugin(): Plugin {
  return cesium()
}
```
#### html
```typescript
// vite-config/plugins/html.ts
import { createHtmlPlugin } from 'vite-plugin-html'
import type { Plugin } from 'vite'

interface HtmlPluginOptions {
  isBuild: boolean
}

/**
 * Plugin to minimize and use ejs template syntax in index.html.
 * https://github.com/anncwb/vite-plugin-html
 */
export function configHtmlPlugin({ isBuild }: HtmlPluginOptions): Plugin | Plugin[] {
  const htmlPlugin = createHtmlPlugin({
    minify: isBuild,
  })
  return htmlPlugin
}
```

#### index
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

  // vite-plugin-html
  vitePlugins.push(configHtmlPlugin({ isBuild }))
  vitePlugins.push(configCesiumPlugin())

  return vitePlugins
}

export { createPlugins }
```
### application
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
      // base: VITE_PUBLIC_PATH,
      resolve: {
        alias: [
          // @/xxxx => src/xxxx
          {
            find: /@\//,
            replacement: `${pathResolve('src')}/`,
          },
          // #/xxxx => types/xxxx
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
            // 入口文件名
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

### common
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
        // TODO: Prevent memory overflow
        maxParallelFileOps: 3,
      },
    },
  }
}
```
### vite.config.ts
```typescript
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
          // rewrite: path => path.replace(/^\/BwMap/, ''),
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
      open: true, // 项目启动后，自动打开
      hmr: true,
      warmup: {
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
    },
  },
})
```

## APP.vue

### Application.vue
```vue
// src/components/Application/index.vue
<script lang="ts">
import { contextInit } from '@/utils/mqtt'
export default {
  name: 'AppProvider',
  inheritAttrs: false,
  setup(_props, { slots }) {
    contextInit(); // 初始化MQTT
    return () => slots.default?.()
  },
}
</script>
```

### App.vue
```vue
<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue/lib'
import AppProvider from '@/components/Application/index.vue'
</script>

<template>
  <ConfigProvider>
    <AppProvider>
      <RouterView />
    </AppProvider>
  </ConfigProvider>
</template>

<style scoped></style>
```

## layouts

### default

#### content

##### index
```vue
// src/layouts/default/content/index.vue
<script lang="ts" setup>
import { Layout } from 'ant-design-vue'
import PageLayout from '@/layouts/page/index.vue'
import { useSetting } from '@/hooks/setting/useSetting'

defineOptions({ name: 'LayoutContent' })

const { getPageLoading } = useSetting()
</script>

<template>
  <Layout ref="content" v-loading="getPageLoading">
    <PageLayout ref="content" />
  </Layout>
</template>
```
#### index
```vue
// src/layouts/default/index.vue
<script lang="ts" setup>
import { Layout } from 'ant-design-vue'
import LayoutContent from './content/index.vue'

</script>

<template>
  <Layout>
    <Layout :class="`bw-main`">
      <LayoutContent />
    </Layout>
  </Layout>
</template>
```
#### page
```vue
// src/layouts/page/index.vue
<template>
  <RouterView>
    <template #default="{ Component, route }">
      <component :is="Component" :key="route.fullPath" />
    </template>
  </RouterView>
</template>
```

## Pinia 配置

### store 入口
```typescript
// src/store/index.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import type { App } from 'vue'

let app: ReturnType<typeof createApp> | null = null

export function setupStore(appInstance: App): void {
  app = appInstance
  app.use(createPinia())
}
```

### cesium 
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

## turf 地理空间分析引擎
```typescript
// src/utils/turf/index.ts
/**
 * Turf.js 地理空间分析工具封装
 * 提供常用的地理空间数据转换和处理功能
 */
import { bbox, featureCollection, point, polygon, multiPolygon } from '@turf/turf'
import { isArray, isObject } from '@/utils/is'

/** 坐标类型别名 */
type Coordinates = number[] | number[][] | number[][][] | number[][][][]

/**
 * 为 GeoJSON 要素设置 ID
 * @param item - 源数据对象
 * @param geo - 目标 GeoJSON 对象
 */
function setId(item: Record<string, any>, geo: any): void {
  if (item?.id !== undefined) {
    geo.id = item.id
  }
}

/**
 * 验证多边形坐标格式是否有效
 * @param coordinates - 坐标数据
 * @returns 是否为有效的 Polygon 或 MultiPolygon 坐标
 */
function isValidPolygonCoordinates(coordinates: Coordinates): boolean {
  if (!isArray(coordinates) || coordinates.length === 0) return false
  
  const first = coordinates[0]
  if (!isArray(first)) return false
  
  const second = first[0]
  if (!isArray(second)) return false
  
  // 四层嵌套表示 MultiPolygon [[lng, lat], ...]
  if (isArray(second[0])) {
    return (coordinates as number[][][][]).every(
      (p) => isArray(p) && p.length > 0 && p.every((r) => isArray(r) && r.length >= 4),
    )
  }
  // 三层嵌套表示 Polygon [[lng, lat], ...]
  return first.length >= 4
}

/**
 * 创建 Polygon 或 MultiPolygon 要素
 * @param item - 包含 coordinates 属性的对象
 * @returns GeoJSON Polygon/MultiPolygon 要素
 * @throws 坐标格式无效时抛出错误
 */
export function turfPolygon(item: Record<string, any>): any {
  if (!item) throw new Error('无效数据：item 不能为空')
  
  // 尝试从多个位置获取坐标
  const coordinates = item.coordinates || item.geometry?.coordinates
  if (!coordinates) throw new Error('无效数据：缺少 coordinates 属性')

  // 验证坐标格式
  if (!isValidPolygonCoordinates(coordinates as Coordinates)) {
    throw new Error('无效坐标：必须是有效的 Polygon 或 MultiPolygon 格式')
  }

  // 判断是 MultiPolygon 还是 Polygon
  const isMulti = isArray((coordinates as number[][][])[0][0][0])
  const poly = isMulti
    ? multiPolygon(coordinates as number[][][][], { ...item })
    : polygon(coordinates as number[][][], { ...item })

  setId(item, poly)
  return poly
}

/**
 * 计算 GeoJSON 对象的边界框
 * @param items - GeoJSON 对象
 * @returns [minX, minY, maxX, maxY] 边界框坐标
 */
export function turfBbox(items: any): [number, number, number, number] {
  if (!items) throw new Error('无效输入')
  return bbox(items) as [number, number, number, number]
}

/**
 * 从对象中提取经纬度坐标
 * 支持多种格式：{L, B} / {lng, lat} / [lng, lat]
 * @param item - 坐标数据
 * @returns [lng, lat, z?] 经纬度和可选高度
 */
function extractCoordinates(item: number[] | Record<string, any>): [number, number, number?] {
  // 数组格式 [lng, lat] 或 [lng, lat, z]
  if (isArray(item)) return [item[0] as number, item[1] as number, item[2] as number]
  
  // 对象格式 {L, B} 或 {lng, lat}
  if (!isObject(item)) throw new Error('无效数据格式')
  const rec = item as Record<string, any>
  
  // 尝试多种可能的经度字段名
  const lng = rec.L ?? rec.lng ?? rec.lon ?? rec.longitude
  // 尝试多种可能的纬度字段名
  const lat = rec.B ?? rec.lat ?? rec.latitude
  const z = rec.z ?? rec.Z

  if (lng === undefined || lat === undefined) {
    throw new Error('缺少经度或纬度字段')
  }
  return [lng, lat, z]
}

/**
 * 创建 Point 要素
 * 支持多种输入格式：数组、对象、带边界的数据
 * @param item - 点数据 [lng, lat] 或 {L, B, ...}
 * @returns GeoJSON Point 要素
 */
export function turfPoint(item: number[] | Record<string, any>): any {
  if (!item) throw new Error('无效数据：item 不能为空')

  const [lng, lat, z] = extractCoordinates(item)
  const props: Record<string, any> = { ...item }

  // 如果数据包含 boundary 字段，自动转换为多边形并附加到属性
  const itemObj = item as Record<string, any>
  if ('boundary' in itemObj && isArray(itemObj.boundary) && itemObj.boundary.length) {
    props.boundaryGeo = turfPolygon({ coordinates: itemObj.boundary, ...item })
  }

  // 根据是否有高度值创建 2D 或 3D 坐标
  const coords: number[] = z !== undefined ? [lng, lat, z] : [lng, lat]
  const pt = point(coords, props)
  setId(item, pt)
  return pt
}

/**
 * 创建 FeatureCollection 要素集合
 * 自动识别输入类型并进行相应转换
 * @param items - 要素数组或单个要素
 * @returns GeoJSON FeatureCollection
 */
export function turfFeatureCollection(items: unknown): any {
  if (isArray(items)) {
    // 空数组直接返回空集合
    if (items.length === 0) return featureCollection([])
    
    const first = items[0]
    // 如果已经是 GeoJSON 格式（包含 type 字段），直接使用
    if (first && typeof first === 'object' && 'type' in (first as any)) {
      return featureCollection(items as any[])
    }
    
    // 否则将数据转换为 Point 要素
    try {
      const features = items.map((it: any) => {
        // 已经是要素的直接返回，否则创建 Point
        if (it && typeof it === 'object' && 'type' in it) {
          return it
        }
        return turfPoint(it)
      })
      return featureCollection(features as any[])
    } catch (e) {
      console.error('创建要素集合失败:', e)
    }
    return featureCollection([])
  }

  // 非数组输入返回空集合
  return featureCollection([])
}
```

## 系统设置钩子
```typescript
// src/hooks/setting/useSetting.ts
import { computed, ref, unref } from 'vue';
import type { ComputedRef } from 'vue';

const pageLoading = ref<boolean>(false);

export function useSetting(): {
  setPageLoading: (loading: boolean) => void;
  getPageLoading: ComputedRef<boolean>;
} {
  function setPageLoading(loading: boolean): void {
    pageLoading.value = loading;
  }

  const getPageLoading = computed(() => unref(pageLoading));

  return {
    setPageLoading,
    getPageLoading,
  };
}
```

## Cesium 配置

### 自定义瓦片
| key        | 值                                                                                                                            | 说明      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- | --------- |
| url        | `/BwMap/tiles/{z}/{x}/{y}.png?access_token=${mapTileKey}`                                                                     | 瓦片地址  |
| mapTileKey | pk.eyJ1IjoiY3VzX2JrMW02aTdwIiwiYSI6IjRocW0wc2Q2ZTU4YmQ0OGE0YzAxZ3JpMXkiLCJ0Ijo0fQ.Q7HSLvVSwAvopYRcvaViOyeiV42zf9Lheydl_L2edWs | 瓦片token |

### Cesium ION TOKEN
| key      | 值                                                                                                                                                                                    | 说明              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ionToken | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNGNkZmExNi1iNGFjLTRmMWQtYTk0YS1kZDA0YThjODg0YWEiLCJpZCI6MTIzMzI5LCJpYXQiOjE3NTI2NTYwMDV9.AGrRQMfnLy7_rqCkCqt0ESx3NX3ulhfOZLv-sDZB-vA | Cesium icon token |

### 初始化 Cesium Viewer
```typescript
// src/utils/cesium/index.ts
import { ref, toRaw, unref } from 'vue';
import type { Ref } from 'vue';
import {
  Ion,
  Viewer,
  ImageryLayer,
  UrlTemplateImageryProvider,
  WebMercatorTilingScheme,
  Terrain,
} from 'cesium';

import { useCesiumStore } from '@/store/modules/cesiumStore';
import { leftClick, rightClick } from './on';
import { groupCompanyLevelMine } from '@/utils/mqtt/publish';

const viewerRef = ref<Viewer | null>(null);
const terrainRef = ref<Terrain | null>(null);

const MAP_CONFIG = {
  ION_TOKEN: import.meta.env.VITE_CESIUM_ION_TOKEN as string,
  MAP_TILE_KEY: import.meta.env.VITE_MAP_TILE_KEY as string,
};

Ion.defaultAccessToken = MAP_CONFIG.ION_TOKEN;

function handleTerrainReady(): void {
  const terrain = toRaw(unref(terrainRef));
  if (!terrain?.readyEvent) return;

  terrain.readyEvent.addEventListener(() => {
    groupCompanyLevelMine();
  });
}

export function initializeCesium(refEl: HTMLElement): Ref<Viewer | null> {
  viewerRef.value = new Viewer(refEl, {
    timeline: false,
    animation: false,
    shouldAnimate: true,
    baseLayerPicker: true,
  });

  const viewer = toRaw(unref(viewerRef));
  if (!viewer) {
    throw new Error('Cesium Viewer 初始化失败');
  }

  const scene = viewer.scene;
  terrainRef.value = Terrain.fromWorldTerrain();
  scene.setTerrain(toRaw(unref(terrainRef))!);

  scene.globe.translucency.enabled = true;
  scene.globe.depthTestAgainstTerrain = true;

  const tileProvider = new UrlTemplateImageryProvider({
    url: `/BwMap/tiles/{z}/{x}/{y}.png?access_token=${MAP_CONFIG.MAP_TILE_KEY}`,
    tilingScheme: new WebMercatorTilingScheme(),
    maximumLevel: 16,
  });

  viewer.imageryLayers.add(new ImageryLayer(tileProvider));

  useCesiumStore().setViewer(viewer);
  handleTerrainReady();
  leftClick();
  rightClick();

  return viewerRef;
}

/**
 * 销毁 Cesium Viewer 实例
 * 该函数负责安全地销毁 Cesium Viewer 实例并清理相关资源
 * @returns {void}
 */
export function destroyCesium() {
  const viewer = toRaw(unref(viewerRef));
  console.log('Destroying Cesium viewer: ', viewer);

  if (!viewer) return;

  // 防止重复销毁
  if (viewer.isDestroyed?.()) {
    viewerRef.value = null;
    return;
  }

  try {
    viewer.isDestroyed() || viewer.destroy();
  } catch (e) {
    console.warn('Cesium destroy 过程出现异常:', e);
  } finally {
    viewerRef.value = null;
    console.log('Cesium Viewer destroyed');
  }
}
```

### Cesium Hook 与
```typescript
// src/hooks/cesium/useCesium.ts
import { computed } from 'vue';
import type { ComputedRef } from 'vue';
import type { Viewer } from 'cesium';
import { useCesiumStore } from '@/store/modules/cesiumStore';

export function useCesium(): { viewerRef: ComputedRef<Viewer | null> } {
  const cesiumStore = useCesiumStore();
  const viewerRef = computed(() => cesiumStore.viewer);

  return { viewerRef };
}
```

### Cesium active entity
```typescript
import { computed, ref } from 'vue'
import {
  Model,
  Entity,
  Cartesian3,
} from 'cesium'

export interface EntityInfo {
  position: Cartesian3 | null
  entity?: Entity
  sourceTarget?: Record<string, any> | null
  type: 'popup' | 'operate' | 'rightClickMenu' | 'modelSlider'
  title?: string
  content?: string | null
  model?: Model
  show?: boolean,
  offset?: number[],
}

const activeEntityRef = ref<EntityInfo | null>(null)

export function useActiveEntity() {

  const getActiveEntity = computed(() => activeEntityRef.value)

  const setActiveEntity = (entity: EntityInfo | null): void => {
    activeEntityRef.value = entity
  }

  return {
    getActiveEntity,
    setActiveEntity,
  }
}
```

### cesium helpers 帮手
```typescript
// src/utils/cesium/helpers.ts
import { toRaw, unref } from 'vue';
import type { Viewer } from 'cesium';
import { useCesium } from '@/hooks/cesium/useCesium';

/**
 * 获取 Cesium viewer 实例
 * @returns Cesium viewer 实例
 */
export function getViewer(): Viewer | null {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}
```

### 聚类配置 
```typescript
// src/utils/cesium/constants.ts
import { Color as CesiumColor } from 'cesium';

interface CountThreshold {
  threshold: number;
  color: CesiumColor;
}

interface ClusterConfig {
  PIXEL_RANGE: number;
  MINIMUM_CLUSTER_SIZE: number;
  ENABLED: boolean;
  COUNT_THRESHOLDS: CountThreshold[];
  PIN_SIZES: [number, number];
}

// 聚类配置
export const CLUSTER_CONFIG: ClusterConfig = {
  PIXEL_RANGE: 15,
  MINIMUM_CLUSTER_SIZE: 3,
  ENABLED: true,
  COUNT_THRESHOLDS: [
    { threshold: 100, color: CesiumColor.RED },
    { threshold: 60, color: CesiumColor.YELLOW },
    { threshold: 0, color: CesiumColor.GREEN },
  ],
  PIN_SIZES: [48, 32],
};
```

```typescript
// src/utils/cesium/clustering.ts
import {
  PinBuilder,
  Color as CesiumColor,
  VerticalOrigin,
  Rectangle,
  GeoJsonDataSource,
} from 'cesium'
import { turfBbox } from '@/utils/turf'
import { CLUSTER_CONFIG } from './constants'
import { flyTo } from './on'
import { entitiesToGeoJSON } from './geojson'

const PIN_SIZES: [number, number] = [48, 32]

function getClusterImage(pinBuilder: PinBuilder, count: number): string {
  for (const config of CLUSTER_CONFIG.COUNT_THRESHOLDS) {
    if (count >= config.threshold) {
      return pinBuilder.fromText(String(count), config.color, PIN_SIZES[1]).toDataURL()
    }
  }
  return pinBuilder.fromText(String(count), CesiumColor.GREEN, PIN_SIZES[1]).toDataURL()
}

export function setupClustering(dataSource: GeoJsonDataSource): void {
  if (!dataSource || !dataSource.clustering) {
    console.error('Invalid dataSource or missing clustering property')
    return
  }

  const pinBuilder = new PinBuilder()

  dataSource.clustering.enabled = CLUSTER_CONFIG.ENABLED
  dataSource.clustering.pixelRange = CLUSTER_CONFIG.PIXEL_RANGE
  dataSource.clustering.minimumClusterSize = CLUSTER_CONFIG.MINIMUM_CLUSTER_SIZE

  function applyCustomStyle(): void {
    dataSource.clustering.clusterEvent.addEventListener(
      function (clusteredEntities: any[], cluster: any) {
        if (!cluster || !clusteredEntities) return

        cluster.label.show = false
        cluster.billboard.show = true
        cluster.billboard.id = cluster.label.id
        cluster.billboard.verticalOrigin = VerticalOrigin.BOTTOM

        const count = clusteredEntities.length
        const image = getClusterImage(pinBuilder, count)
        cluster.billboard.image = image
      },
    )

    const pixelRange = dataSource.clustering.pixelRange
    dataSource.clustering.pixelRange = 0
    dataSource.clustering.pixelRange = pixelRange
  }

  applyCustomStyle()
}

export function clusteringZoom(dataSource: any[]): void {
  if (!dataSource || dataSource.length === 0) {
    console.warn('No entities found for clustering zoom')
    return
  }

  try {
    // 将实体转换为 GeoJSON
    const geojson = entitiesToGeoJSON(dataSource);

    const padding = 0.2
    const bbox = turfBbox(geojson)

    if (!bbox || bbox.length !== 4) return

    const destination = Rectangle.fromDegrees(
      bbox[0] - padding,
      bbox[1] - padding,
      bbox[2] + padding,
      bbox[3] + padding,
    )

    flyTo(destination)
  } catch (error) {
    console.error('Error in clusteringZoom:', error)
  }
}
```

### icon 配置
```typescript
// src/utils/cesium/labelConfig.ts
import {
  NearFarScalar,
  DistanceDisplayCondition,
  Cartesian2,
  LabelStyle,
  Color as CesiumColor,
} from 'cesium';

/**
 * Label 配置系统
 * 提供统一、优雅的标签配置管理，支持预设类型和自定义配置
 */

// ==================== 常量定义 ====================

/** 标签预设类型枚举 */
export const LABEL_PRESETS = {
  /** 主要矿点标签（如 MinePoint）：始终可见，不随距离变化 */
  MINE_POINT: 'minePoint',
  /** 普通标签（如隧道、设备点）：远距离逐渐透明，最远隐藏 */
  NORMAL: 'normal',
  /** 深度标签（如钻孔深度）：更遥远才隐藏，支持近距离缩放 */
  DEPTH: 'depth',
  /** 水域标签：中等可见范围，远距离半透明 */
  WATER: 'water',
  /** 小尺寸标签：用于小图标或次要信息 */
  SMALL: 'small',
  /** 大尺寸标签：用于重要标题或突出显示 */
  LARGE: 'large',
} as const;

export type LabelPresetType = typeof LABEL_PRESETS[keyof typeof LABEL_PRESETS];

// 图标配置
export const ICON_CONFIG = {
  DEFAULT_URL: '/src/assets/markerIcon/ICON.svg',
  DEFAULT_SIZE: 36,
  DEFAULT_COLOR: 'WHITE',
  DEFAULT_NAME: '',
  LABEL_OFFSET: new Cartesian2(0, -56),
  BACKGROUND_PADDING: new Cartesian2(8, 6),
} as const;

/**
 * 距离控制参数配置
 * 统一管理所有距离相关的参数，便于全局调整
 */
export const DISTANCE_CONFIG = {
  SCALE: {
    NEAR_DISTANCE: 1200,
    NEAR_SCALE: 1.2,
    FAR_DISTANCE: 6000,
    FAR_SCALE: 0.35,
  },
  TRANSLUCENCY: {
    NEAR_DISTANCE: 2000,
    NEAR_ALPHA: 1.0,
    FAR_DISTANCE: 8000,
    FAR_ALPHA: 0.0,
  },
  DISPLAY_CONDITION: {
    NEAR_DISTANCE: 0,
    FAR_DISTANCE: 10000,
  },
  ADJUSTMENTS: {
    DEPTH: {
      FAR_SCALE: 0.3,
    },
    WATER: {
      FAR_SCALE: 0.8,
      FAR_ALPHA: 0.6,
    },
    MINE_POINT: {},
  },
} as const;

/**
 * 基础样式配置
 */
const BASE_STYLES = {
  COMMON: {
    fillColor: CesiumColor.WHITE,
    style: LabelStyle.FILL_AND_OUTLINE,
  },
  OUTLINE: {
    NORMAL: {
      outlineColor: CesiumColor.DIMGRAY,
      outlineWidth: 2,
    },
    BOLD: {
      outlineColor: CesiumColor.BLACK,
      outlineWidth: 6,
    },
  },
  FONT: {
    SMALL: '10px sans-serif',
    NORMAL: '12px sans-serif',
    BOLD: 'bold 12px Microsoft YaHei, sans-serif',
    LARGE: '14px sans-serif',
  },
} as const;

interface DistanceAdjustments {
  farScale?: number;
  farAlpha?: number;
}

interface DistanceControlConfig {
  scaleByDistance: NearFarScalar;
  translucencyByDistance: NearFarScalar;
  distanceDisplayCondition: DistanceDisplayCondition;
}

/**
 * 预设配置生成器
 */
const PRESET_GENERATORS = {
  /**
   * 生成距离控制配置
   * @param adjustments - 距离调整参数
   */
  createDistanceControl(adjustments: DistanceAdjustments = {}): DistanceControlConfig {
    const {
      farScale = DISTANCE_CONFIG.SCALE.FAR_SCALE,
      farAlpha = DISTANCE_CONFIG.TRANSLUCENCY.FAR_ALPHA,
    } = adjustments;

    return {
      scaleByDistance: new NearFarScalar(
        DISTANCE_CONFIG.SCALE.NEAR_DISTANCE,
        DISTANCE_CONFIG.SCALE.NEAR_SCALE,
        DISTANCE_CONFIG.SCALE.FAR_DISTANCE,
        farScale
      ),
      translucencyByDistance: new NearFarScalar(
        DISTANCE_CONFIG.TRANSLUCENCY.NEAR_DISTANCE,
        DISTANCE_CONFIG.TRANSLUCENCY.NEAR_ALPHA,
        DISTANCE_CONFIG.TRANSLUCENCY.FAR_DISTANCE,
        farAlpha
      ),
      distanceDisplayCondition: new DistanceDisplayCondition(
        DISTANCE_CONFIG.DISPLAY_CONDITION.NEAR_DISTANCE,
        DISTANCE_CONFIG.DISPLAY_CONDITION.FAR_DISTANCE
      ),
    };
  },

  /**
   * 生成无距离控制的配置
   */
  createNoDistanceControl(): Record<string, never> {
    return {};
  },
};

// ==================== 预设配置 ====================

const PRESET_CONFIGS: Record<LabelPresetType, Record<string, any>> = {
  [LABEL_PRESETS.MINE_POINT]: {
    font: BASE_STYLES.FONT.BOLD,
    ...BASE_STYLES.COMMON,
    ...BASE_STYLES.OUTLINE.BOLD,
    pixelOffset: new Cartesian2(0, -48),
    ...PRESET_GENERATORS.createNoDistanceControl(),
  },
  [LABEL_PRESETS.NORMAL]: {
    font: BASE_STYLES.FONT.NORMAL,
    ...BASE_STYLES.COMMON,
    ...BASE_STYLES.OUTLINE.NORMAL,
    ...PRESET_GENERATORS.createDistanceControl(),
  },
  [LABEL_PRESETS.DEPTH]: {
    font: BASE_STYLES.FONT.SMALL,
    ...BASE_STYLES.COMMON,
    ...BASE_STYLES.OUTLINE.NORMAL,
    ...PRESET_GENERATORS.createDistanceControl({
      farScale: DISTANCE_CONFIG.ADJUSTMENTS.DEPTH.FAR_SCALE,
    }),
  },
  [LABEL_PRESETS.WATER]: {
    font: BASE_STYLES.FONT.NORMAL,
    ...BASE_STYLES.COMMON,
    ...BASE_STYLES.OUTLINE.NORMAL,
    ...PRESET_GENERATORS.createDistanceControl({
      farScale: DISTANCE_CONFIG.ADJUSTMENTS.WATER.FAR_SCALE,
      farAlpha: DISTANCE_CONFIG.ADJUSTMENTS.WATER.FAR_ALPHA,
    }),
  },
  [LABEL_PRESETS.SMALL]: {
    font: BASE_STYLES.FONT.SMALL,
    ...BASE_STYLES.COMMON,
    ...BASE_STYLES.OUTLINE.NORMAL,
    ...PRESET_GENERATORS.createDistanceControl({
      farScale: 0.25,
    }),
  },
  [LABEL_PRESETS.LARGE]: {
    font: BASE_STYLES.FONT.LARGE,
    ...BASE_STYLES.COMMON,
    ...BASE_STYLES.OUTLINE.BOLD,
    ...PRESET_GENERATORS.createDistanceControl({
      farScale: 0.5,
      farAlpha: 0.3,
    }),
  },
};

// ==================== 工具函数 ====================

function isValidLabelType(type: string): type is LabelPresetType {
  return Object.values(LABEL_PRESETS).includes(type as LabelPresetType);
}

function isValidCustomConfig(config: unknown): config is Record<string, any> {
  return config !== null && typeof config === 'object' && !Array.isArray(config);
}

// ==================== 主要 API ====================

/**
 * 获取标签配置
 * @param type - 标签类型，使用 LABEL_PRESETS 中的值
 * @param customConfig - 自定义配置，将与预设合并
 */
export function getLabelConfig(
  type: LabelPresetType = LABEL_PRESETS.NORMAL,
  customConfig: Record<string, any> = {}
): Record<string, any> {
  if (!isValidLabelType(type)) {
    console.warn(`无效的标签类型: ${type}，将使用默认类型: ${LABEL_PRESETS.NORMAL}`);
    type = LABEL_PRESETS.NORMAL;
  }

  if (!isValidCustomConfig(customConfig)) {
    throw new Error('customConfig 必须是一个有效的对象');
  }

  const baseConfig = PRESET_CONFIGS[type] || PRESET_CONFIGS[LABEL_PRESETS.NORMAL];

  return {
    ...baseConfig,
    ...customConfig,
  };
}

/**
 * 为已有标签添加距离控制
 * @param labelConfig - 已有的标签配置对象
 * @param type - 标签类型预设
 */
export function enhanceLabelWithDistanceControl(
  labelConfig: Record<string, any> = {},
  type: LabelPresetType = LABEL_PRESETS.NORMAL
): Record<string, any> {
  if (!isValidCustomConfig(labelConfig)) {
    throw new Error('labelConfig 必须是一个有效的对象');
  }

  const distanceConfig = getLabelConfig(type);

  return {
    ...labelConfig,
    scaleByDistance: distanceConfig.scaleByDistance,
    translucencyByDistance: distanceConfig.translucencyByDistance,
    distanceDisplayCondition: distanceConfig.distanceDisplayCondition,
  };
}

interface CustomLabelOptions {
  enableDistanceControl?: boolean;
  distanceType?: LabelPresetType;
  [key: string]: any;
}

/**
 * 创建自定义标签配置
 * @param baseConfig - 基础配置
 * @param options - 自定义选项
 */
export function createCustomLabelConfig(
  baseConfig: Record<string, any> = {},
  options: CustomLabelOptions = {}
): Record<string, any> {
  const {
    enableDistanceControl = true,
    distanceType = LABEL_PRESETS.NORMAL,
    ...otherOptions
  } = options;

  let config = { ...baseConfig, ...otherOptions };

  if (enableDistanceControl) {
    config = enhanceLabelWithDistanceControl(config, distanceType);
  }

  return config;
}

/** 获取所有可用的标签预设类型 */
export function getAvailableLabelTypes(): LabelPresetType[] {
  return Object.values(LABEL_PRESETS);
}

/**
 * 获取标签配置的默认值
 * @param property - 配置属性名
 */
export function getLabelDefault(property: string): any {
  const defaults: Record<string, any> = {
    font: BASE_STYLES.FONT.NORMAL,
    fillColor: CesiumColor.WHITE,
    outlineColor: CesiumColor.DIMGRAY,
    outlineWidth: 2,
    style: LabelStyle.FILL_AND_OUTLINE,
  };

  return defaults[property];
}
```

```typescript
// src/utils/cesium/icon.ts
import {
  Color as CesiumColor,
  PinBuilder,
  Entity,
} from 'cesium';

import { getLabelConfig, LABEL_PRESETS, ICON_CONFIG } from './labelConfig';

const ICON_URL: string = ICON_CONFIG.DEFAULT_URL;
const DEFAULT_ICON_SIZE: number = ICON_CONFIG.DEFAULT_SIZE;
const DEFAULT_COLOR: string = ICON_CONFIG.DEFAULT_COLOR;
const DEFAULT_NAME: string = ICON_CONFIG.DEFAULT_NAME;
const LABEL_OFFSET = ICON_CONFIG.LABEL_OFFSET;
const BACKGROUND_PADDING = ICON_CONFIG.BACKGROUND_PADDING;

/**
 * 获取标记图标URL
 * @param key - 图标键
 * @returns 图标URL
 */
function getMarkerIcon(key: string): string {
  return ICON_URL.replace('ICON', key);
}

/**
 * 验证颜色值，返回有效颜色或默认颜色
 * @param {string} color - 颜色名称
 * @returns {Object} Cesium颜色对象
 */
function validateColor(color) {
  if (!color || !CesiumColor[color]) {
    console.warn(`Invalid color: ${color}, using default color: ${DEFAULT_COLOR}`);
    return CesiumColor[DEFAULT_COLOR];
  }
  return CesiumColor[color];
}

/**
 * 创建图标标记
 * @param entity - Cesium 实体对象
 * @param key - 图标/数据源名称
 */
export async function createIconMarker(entity: Entity, key: string): Promise<void> {
  try {
    if (!entity || !entity.properties) {
      console.warn('Invalid entity or missing properties');
      return;
    }

    const properties = entity.properties.getValue(undefined as any);

    if (!properties) {
      console.warn('Entity properties is null or undefined');
      return;
    }

    const { color, icon, name, label } = properties as Record<string, any>;
    const _label: string = label || name;

    if (!icon) {
      console.warn('Icon property is missing');
      return;
    }

    const validColor: CesiumColor = validateColor(color);
    const iconURL: string = getMarkerIcon(icon as string);

    if (!iconURL) {
      console.warn('Invalid icon URL');
      return;
    }

    const pinBuilder = new PinBuilder();

    try {
      const result = await pinBuilder.fromUrl(iconURL, validColor, DEFAULT_ICON_SIZE);
      (entity.billboard as any) = entity.billboard || {};
      (entity.billboard as any).image = result.toDataURL();
      (entity as any).label = buildLabel(_label || DEFAULT_NAME, key);
    } catch (error) {
      console.error('Failed to create icon from URL:', error);
    }
  } catch (error) {
    console.error('Error in createIconMarker:', error);
  }
}

/**
 * 构建标签配置
 * @param name - 标签名称
 * @param key - 标签所属类型
 * @returns 标签配置对象
 */
export function buildLabel(name: string | null | undefined, key: string): Record<string, any> {
  // 参数验证
  if (typeof name !== 'string' && name != null) {
    throw new TypeError('name must be a string or null/undefined');
  }
  if (typeof key !== 'string') {
    throw new TypeError('key must be a string');
  }

  const baseConfig = {
    text: name || DEFAULT_NAME,
  };

  // MinePoint 类型使用完整背景样式，不需要距离控制
  if (key === 'MinePoint') {
    return {
      ...baseConfig,
      ...getLabelConfig(LABEL_PRESETS.MINE_POINT),
    };
  }

  // 其他类型使用普通标签配置，自动包含视距控制
  return {
    ...baseConfig,
    ...getLabelConfig(LABEL_PRESETS.NORMAL),
  };
}

```

### 数据渲染
```typescript
// src/utils/cesium/render.ts
/**
 * Cesium GeoJSON 数据渲染工具
 * 提供 GeoJSON 数据加载、渲染、聚类等功能
 */
import { GeoJsonDataSource, DataSource } from 'cesium'
import { getViewer } from './helpers'
import { setupClustering } from './clustering'
import { createIconMarker } from './icon'

/**
 * 加载 GeoJSON 点数据到 Cesium 场景
 * @param geojson - GeoJSON 格式的点数据
 * @param name - 数据源名称
 * @param options - 加载选项
 * @param callback - 加载完成回调
 * 
 * @example
 * const geojson = { type: 'FeatureCollection', features: [] }
 * geoJSONPointLoad(geojson, '矿井', { isSetupClustering: true })
 */
export function geoJSONPointLoad(
  geojson: object,
  name: string,
  options: { isSetupClustering?: boolean; isCreateIcon?: boolean } = {},
  callback?: (err: Error | null, dataSource?: GeoJsonDataSource) => void,
): void {
  const viewer = getViewer()
  removeDataSource(name)
  if (!viewer) {
    const error = new Error('Cesium Viewer 未初始化')
    console.error('Error loading GeoJSON point data:', error)
    if (typeof callback === 'function') {
      callback(error)
    }
    return
  }

  GeoJsonDataSource.load(geojson)
    .then((data) => {
      data.name = name
      return viewer.dataSources.add(data)
    })
    .then((dataSource: DataSource) => {
      console.log('GeoJSON 数据加载成功:', geojson)

      // 配置聚类
      if (options.isSetupClustering && dataSource instanceof GeoJsonDataSource) {
        setupClustering(dataSource)
      }

      // 为每个实体创建图标标记
      if (options.isCreateIcon !== false && dataSource instanceof GeoJsonDataSource) {
        dataSource.entities.values.forEach((point) => {
          createIconMarker(point, name)
        })
      }

      if (typeof callback === 'function') {
        callback(null, dataSource as GeoJsonDataSource)
      }
    })
    .catch((error: Error) => {
      console.error('加载 GeoJSON 点数据失败:', error)
      if (typeof callback === 'function') {
        callback(error)
      }
    })
}

/**
 * 清除指定数据源
 * @param dataSourceName - 数据源名称
 */
export function removeDataSource(dataSourceName: string): void {
  const viewer = getViewer()
  if (!viewer) return

  const dataSource = viewer.dataSources.getByName(dataSourceName)
  if (dataSource && dataSource.length > 0) {
    dataSource.forEach((ds) => {
      viewer.dataSources.remove(ds)
    })
  }
}

/**
 * 清除所有数据源
 */
export function clearAllDataSources(): void {
  const viewer = getViewer()
  if (!viewer) return
  viewer.dataSources.removeAll()
}
```

### cesium 工具
```typescript
// src/utils/cesium/geojson.ts
import {
  Entity,
  EntityCollection,
  JulianDate,
  Cartographic,
  Math as CesiumMath,
  Color as CesiumColor,
} from 'cesium';
import { isArray } from '@/utils/is';

interface GeoJSONFeature {
  type: 'Feature';
  geometry: Record<string, any> | null;
  properties: Record<string, any> | null;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * 将 Cesium Entity 数组或 EntityCollection 转换为 GeoJSON FeatureCollection
 * @param entities - 要转换的实体
 * @param includeProperties - 是否包含自定义属性
 * @returns GeoJSON FeatureCollection 对象
 */
export function entitiesToGeoJSON(
  entities: Entity[] | EntityCollection,
  includeProperties = true
): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = [];

  const entityArray: Entity[] = isArray(entities)
    ? (entities as Entity[])
    : (entities as EntityCollection).values;
  const now = JulianDate.now();

  entityArray.forEach((entity) => {
    const feature: GeoJSONFeature = {
      type: 'Feature',
      geometry: null,
      properties: includeProperties ? {} : null,
    };

    let geometrySet = false;

    if (entity.position) {
      const cartesian = entity.position.getValue(now);
      if (cartesian) {
        const cartographic = Cartographic.fromCartesian(cartesian);
        feature.geometry = {
          type: 'Point',
          coordinates: [
            CesiumMath.toDegrees(cartographic.longitude),
            CesiumMath.toDegrees(cartographic.latitude),
            cartographic.height || 0,
          ],
        };
        geometrySet = true;
      }
    } else if (entity.polyline && entity.polyline.positions) {
      const positions = entity.polyline.positions.getValue(now);
      if (positions && positions.length > 1) {
        const coords = positions.map((pos: any) => {
          const c = Cartographic.fromCartesian(pos);
          return [
            CesiumMath.toDegrees(c.longitude),
            CesiumMath.toDegrees(c.latitude),
            c.height || 0,
          ];
        });
        feature.geometry = { type: 'LineString', coordinates: coords };
        geometrySet = true;
      }
    } else if (entity.polygon && entity.polygon.hierarchy) {
      const hierarchy = entity.polygon.hierarchy.getValue(now);
      if (hierarchy && hierarchy.positions.length >= 3) {
        const positions = hierarchy.positions;
        const coords = positions.map((pos: any) => {
          const c = Cartographic.fromCartesian(pos);
          return [CesiumMath.toDegrees(c.longitude), CesiumMath.toDegrees(c.latitude)];
        });
        coords.push(coords[0]);
        feature.geometry = { type: 'Polygon', coordinates: [coords] };
        geometrySet = true;
      }
    }

    if (!geometrySet) return;

    if (includeProperties && feature.properties) {
      const props = feature.properties;

      if (entity.properties) {
        const propValue = entity.properties.getValue(now);
        if (propValue && typeof propValue === 'object') {
          Object.assign(props, propValue);
        }
      }

      if (entity.name) props.name = entity.name;
      if (entity.description) {
        const desc = entity.description.getValue(now);
        if (desc) props.description = desc;
      }

      if (entity.billboard && entity.billboard.image) {
        const image = entity.billboard.image.getValue(now);
        if (image) props.icon = image;
      }

      if (entity.label && entity.label.text) {
        const text = entity.label.text.getValue(now);
        if (text) props.label = text;
      }

      if (entity.billboard && entity.billboard.scale) {
        props.scale = entity.billboard.scale.getValue(now);
      }
    }

    features.push(feature);
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}
```

### 点击事件
```typescript
// src/utils/cesium/on.ts
import {
  ScreenSpaceEventType,
  Entity,
  defined,
  Cartesian3,
  Rectangle,
} from 'cesium'
import { getViewer } from './helpers'
import { isArray } from '@/utils/is'
import { mineMenuItemsPublisher } from '@/utils/mqtt/publish'
import { turfBbox, turfPolygon } from '@/utils/turf'
import { clusteringZoom } from './clustering'
import { useActiveEntity } from '@/hooks/cesium/useActiveEntity'

const { setActiveEntity } = useActiveEntity()

const FLY_TO_CONFIG = {
  DEFAULT_PAD: 0.5,
  DEFAULT_HEIGHT: 1_000_000,
  DEFAULT_DURATION: 3,
} as const

/**
 * 创建拾取特征的描述HTML表格
 * @param {Object} pickedFeature - 拾取的特征对象
 * @returns {string|undefined} HTML表格字符串或undefined
 */
function createPickedFeatureDescription(pickedFeature: Record<string, any>): string | undefined {
  if (!pickedFeature || !pickedFeature.columns) {
    return undefined;
  }

  try {
    const columns = pickedFeature.columns;
    if (!Array.isArray(columns)) {
      return undefined;
    }

    const rows = columns.map(({ title, dataIndex }) => {
      const value = pickedFeature[dataIndex];
      if (value === undefined || value === null || value === '') {
        return '';
      }
      return `<tr><th>${title}</th><td>${value}</td></tr>`;
    }).filter(row => row !== '');

    if (rows.length === 0) {
      return undefined;
    }

    return `<table class="cesium-infoBox-defaultTable">${rows.join('')}</table>`;
  } catch (error) {
    console.error('Error creating feature description:', error);
    return undefined;
  }
}

export function flyTo(destination: Rectangle | Cartesian3, complete?: () => void): void {
  const viewer = getViewer()
  if (!viewer) {
    console.warn('Cesium viewer not available for flyTo')
    return
  }
  viewer.camera.flyTo({
    destination,
    duration: FLY_TO_CONFIG.DEFAULT_DURATION,
    complete,
  })
}

export function flyToBoundary(options: {
  boundary?: Array<[number, number]>
  L?: number
  B?: number
  pad?: number
  orientation?: Record<string, any>
}, complete?: () => void): void {
  const { boundary, L, B, pad, orientation } = options
  const viewer = getViewer()
  if (!viewer) return

  let destination: Rectangle | Cartesian3

  if (isArray(boundary) && boundary!.length > 0) {
    const _pad = pad ?? FLY_TO_CONFIG.DEFAULT_PAD
    const bboxResult = turfBbox(turfPolygon([[...boundary!, boundary![0]]]))
    destination = Rectangle.fromDegrees(
      bboxResult[0] - _pad,
      bboxResult[1] - _pad,
      bboxResult[2] + _pad,
      bboxResult[3] + _pad,
    )
  }
  else {
    destination = Cartesian3.fromDegrees(L!, B!, FLY_TO_CONFIG.DEFAULT_HEIGHT)
  }

  viewer.camera.flyTo({
    destination,
    duration: FLY_TO_CONFIG.DEFAULT_DURATION,
    orientation,
    complete,
  })
}

function getPos(entity: Entity | null, pickPosition: Cartesian3): Cartesian3 {
  if (!entity) return pickPosition
  try {
    if (entity.position && typeof entity.position.getValue === 'function') {
      const position = entity.position.getValue(undefined as any)
      if (position) return position
    }
    return pickPosition
  } catch {
    return pickPosition
  }
}

export function leftClick(): void {
  const viewer = getViewer()
  if (!viewer) return

  const scene = viewer.scene

  viewer.screenSpaceEventHandler.setInputAction(function (movement: any) {
    try {
      setActiveEntity(null)
      const pickedObject = scene.pick(movement.position)
      if (!defined(pickedObject)) return

      if (pickedObject.id instanceof Array && pickedObject.id[0] instanceof Entity) {
        clusteringZoom(pickedObject.id)
        return
      }

      if (pickedObject.id instanceof Entity) {
        const entity = pickedObject.id
        if (entity.properties) {
          const propertyValues = entity.properties.getValue
            ? entity.properties.getValue(undefined as any)
            : entity.properties
          const position = getPos(entity, scene.pickPosition(movement.position))
          setActiveEntity({
            position,
            entity,
            sourceTarget: propertyValues,
            type: 'popup',
            content: createPickedFeatureDescription(propertyValues),
          })
        }
      }
    } catch (error) {
      console.error('Error in left click handler:', error)
      setActiveEntity(null)
    }
  }, ScreenSpaceEventType.LEFT_CLICK)
}

export function rightClick(): void {
  const viewer = getViewer()
  if (!viewer) return

  const scene = viewer.scene

  viewer.screenSpaceEventHandler.setInputAction(function (movement: any) {
    try {
      setActiveEntity(null)
      const pickedObject = scene.pick(movement.position)
      const position: Cartesian3 = scene.pickPosition(movement.position)

      if (!defined(pickedObject)) return

      if (pickedObject.id instanceof Entity) {
        const entity = pickedObject.id
        if (entity.properties) {
          const propertyValues = entity.properties.getValue
            ? entity.properties.getValue(undefined as any)
            : entity.properties
          const { name, MineName } = propertyValues || {}
          if (name && MineName) {
            mineMenuItemsPublisher(name as string)
            setActiveEntity({
              position,
              entity,
              sourceTarget: propertyValues,
              title: name as string,
              type: 'rightClickMenu',
            })
          }
        }
      }
    } catch (error) {
      console.error('Error in right click handler:', error)
      setActiveEntity(null)
    }
  }, ScreenSpaceEventType.RIGHT_CLICK)
}
```

### cesium views
```vue
// src/views/minesMap/index.vue
<script setup lang="ts">
import { ref } from 'vue'
import Map from './src/Map.vue'
import Sidebar from './src/Sidebar.vue'

const mapPane = ref<boolean>(false)

function openClick(e: boolean): void {
  mapPane.value = e
}
</script>

<template>
  <div class="mines-map-container">
    <Sidebar @openClick="openClick" />
    <Map />
  </div>
</template>

<style lang="css" scoped>
.mines-map-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
```


### MinesMap
```vue
// src/components/MinesMap/index.vue
<script setup lang="ts">
import { ref } from 'vue';
import Map from './src/Map.vue';
import Sidebar from './src/Sidebar.vue';

const mapPane = ref<boolean>(false);

function openClick(e: boolean): void {
  console.log('openClick', e);
  mapPane.value = e;
}
</script>

<template>
  <div class=" mines-map-containerr">
    <Sidebar @openClick="openClick" />
    <Map />
  </div>
</template>

<style lang="css" scoped>
.mines-map-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
```

#### Map.vue
```vue
<template>
  <div ref="cesiumContainer" id="cesiumContainer">
    <!-- 矿井搜索框 -->
    <div class="select-search">
      <Select v-model:value="searchValue" show-search placeholder="输入矿井名称搜索" :disabled="selDisabled"
        :filter-option="false" :not-found-content="null" :options="nameOptions" @search="handleSearch"
        @change="handleSelect" style="width: 100%">
        <Select.Option v-for="option in nameOptions" :key="option.value">
          {{ option.value }}
        </Select.Option>
      </Select>
    </div>
    <CesiumPopup ref="popupRef" v-if="cesiumPopup.show" :position="cesiumPopup.position" :title="cesiumPopup.title"
      :content="cesiumPopup.content" :offset="cesiumPopup.offset" @close="clearPopup" />
    <CesiumContextMenu ref="contextMenuRef" :visible="contentmenu.visible" :position="contentmenu.position"
      :menuItems="contentmenu.menuItems" />
  </div>
</template>

<script setup lang="ts">
/**
 * 矿井地图组件
 * 使用 Cesium 展示矿井位置，提供搜索和交互功能
 */
import { onMounted, onUnmounted, ref, unref, watch } from 'vue'
import { Select } from 'ant-design-vue'
import { Camera, Rectangle, Cartesian3 } from 'cesium'

import { isAlphabetic } from '@/utils/is'
import CesiumPopup from '@/components/Popup/index.vue'
import CesiumContextMenu from '@/components/Menu/index.vue'
import { useGroupCompanyLevelMine, ContextmenuValue } from '@/hooks/mines/useGroupCompanyLevelMine'
import { flyTo, flyToBoundary } from '@/utils/cesium'
import { useSetting } from '@/hooks/setting/useSetting'
import { initializeCesium, destroyCesium } from '@/utils/cesium'
import { geoJSONPointLoad } from '@/utils/cesium/render'
import { turfFeatureCollection, turfBbox } from '@/utils/turf'
import { getViewer } from '@/utils/cesium/helpers'
import { useActiveEntity, EntityInfo } from '@/hooks/cesium/useActiveEntity'

const { getActiveEntity } = useActiveEntity()

/** 搜索选项接口 */
export interface NameOption {
  /** 选项值 */
  value: string
  /** 显示标签 */
  label: string
}

// 组合式函数
const { getGroupCompanyLevelMine, getContextmenuItems } = useGroupCompanyLevelMine()
const { setPageLoading } = useSetting()

// 响应式状态
/** 搜索选项列表 */
const nameOptions = ref<NameOption[]>([])
/** GeoJSON 数据 */
const geojsonPoints = ref<any>()
/** Cesium 容器引用 */
const cesiumContainer = ref<HTMLElement | null>(null)
/** 搜索输入值 */
const searchValue = ref<string>('')
/** 搜索框是否禁用 */
const selDisabled = ref<boolean>(true)

/** 搜索防抖定时器 */
let searchTimer: ReturnType<typeof setTimeout> | null = null

const cesiumPopup = ref<EntityInfo>({} as EntityInfo);

const contentmenu = ref<any>({
  position: null as Cartesian3 | null,
  menuItems: [],
  visible: false,
  containerSelector: '#cesiumContainer',
})

function clearPopup() {
  cesiumPopup.value.show = false;
  contentmenu.value.visible = false;
}

function buildCesiumPopup(e: EntityInfo) {
  const { position, sourceTarget, content, title } = e;
  cesiumPopup.value.position = position;
  cesiumPopup.value.sourceTarget = sourceTarget;
  cesiumPopup.value.title = title;
  cesiumPopup.value.content = content;
  cesiumPopup.value.offset = [0, -25];
  cesiumPopup.value.show = true;
}

watch(() => unref(getActiveEntity), (newVal) => {
  console.log('getActiveEntity: ', newVal);
  clearPopup();
  if (!newVal) {
    return;
  }
  const { type, position } = newVal;
  switch (type) {
    case 'popup':
      buildCesiumPopup(newVal);
      break;
    case 'rightClickMenu':
      contentmenu.value.position = position;
      break;
  }
});

/**
 * 处理矿井选择
 * @param value - 选中的矿井名称
 */
function handleSelect(value: string): void {
  const viewer = getViewer()
  const entities = viewer?.dataSources?.get(0)?.entities?.values || []
  // 查找匹配的矿井
  const target = entities.find(e => e?.properties?.getValue()?.name === value)

  if (!target) {
    searchValue.value = ''
    return
  }

  const properties = target.properties
  const { B, L } = properties?.getValue() || {}

  // 飞行到目标位置
  flyToBoundary({ B, L }, () => {
    searchValue.value = ''
  })
}

/**
 * 处理搜索输入
 * @param value - 搜索关键词
 */
function handleSearch(value: string): void {
  // 防抖处理
  if (searchTimer !== null) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    const keyword = String(value || '').trim()

    if (!keyword) {
      nameOptions.value = []
      return
    }

    const viewer = getViewer()
    const entities = viewer?.dataSources?.get(0)?.entities?.values || []

    // 过滤匹配的矿井
    const matches = entities.filter((layer) => {
      const properties = layer?.properties?.getValue?.() || {}
      // 中文搜索按名称匹配，英文搜索按 MineDesc 匹配
      if (isAlphabetic(keyword)) {
        return String(properties.MineDesc || '').toUpperCase().includes(keyword.toUpperCase())
      }
      return String(properties.name || '').includes(keyword)
    })

    // 生成搜索选项
    nameOptions.value = matches.map((e) => {
      const properties = e.properties?.getValue()
      return {
        value: properties.name as string,
        label: properties.name as string,
      }
    })
  }, 180)
}

// 组件挂载时初始化 Cesium
onMounted(() => {
  if (!cesiumContainer.value) return
  initializeCesium(cesiumContainer.value)
})

// 监听矿井数据变化
watch(() => unref(getGroupCompanyLevelMine), (newVal) => {
  if (!newVal) return

  const { data } = newVal
  console.log('收到矿井数据:', newVal)

  // 转换为 GeoJSON 格式
  geojsonPoints.value = turfFeatureCollection(data)

  // 计算边界框
  const bbox = turfBbox(geojsonPoints.value)

  // 设置默认视图区域
  const destination = Rectangle.fromDegrees(
    bbox[0] - 6,
    bbox[1] - 6,
    bbox[2] + 6,
    bbox[3] + 6
  )
  Camera.DEFAULT_VIEW_RECTANGLE = destination

  // 飞行到目标区域并加载数据
  flyTo(destination, () => {
    geoJSONPointLoad(geojsonPoints.value, 'MinePoint', { isSetupClustering: true })
    selDisabled.value = false
    setPageLoading(false)
  })
})

/*** 监听右键菜单项变化 */
watch(() => unref(getContextmenuItems), (newVal: ContextmenuValue | undefined) => {
  const { menuItems } = newVal || {};
  contentmenu.value.menuItems = menuItems;
  contentmenu.value.visible = true;
});

// 组件卸载时销毁 Cesium
onUnmounted(() => {
  destroyCesium()
})
</script>

<style scoped lang="less">
#cesiumContainer {
  display: flex;
  width: 100%;
  height: 100%;
  background: #222;

  .select-search {
    width: 200px;
    position: absolute;
    z-index: 9999;
    left: 6px;
    top: 6px;
  }
}
</style>
```

### Popup 组件
```vue
// src/components/Popup/index.vue
<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div v-if="visible" ref="popupRef" class="cesium-popup" :style="popupStyle" @click.stop>
        <div class="cesium-popup-content-wrapper">
          <slot name="header">
            <div class="cesium-popup-header">
              <span class="cesium-popup-title">{{ title }}</span>
              <span class="cesium-popup-close" @click="handleClose">×</span>
            </div>
          </slot>
          <div class="cesium-popup-content">
            <slot>
              <span v-html="content" />
            </slot>
          </div>
        </div>
        <div class="cesium-popup-tip" :style="tipStyle" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
  shallowRef,
} from 'vue'

import {
  SceneTransforms,
  Cartesian3,
  Matrix4,
} from 'cesium'
import { getViewer } from '@/utils/cesium/helpers'

defineOptions({ name: 'CesiumPopup' })

interface Props {
  position: Cartesian3 | [number, number, number]
  title?: string
  content?: string
  offset?: [number, number]
  tipOffset?: number
  closeOnEsc?: boolean
  closeOnClickOutside?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '信息',
  content: '',
  offset: () => [0, 0],
  tipOffset: 0,
  closeOnEsc: true,
  closeOnClickOutside: true
})

const emit = defineEmits<{
  close: []
  show: []
}>()

const visible = ref(false)
const popupRef = ref<HTMLElement | null>(null)
const screenPosition = ref<{ x: number; y: number } | null>(null)

const lastViewMatrix = shallowRef<Matrix4 | null>(null)

const viewer = computed(() => getViewer())

const popupStyle = computed(() => {
  if (!visible.value || !screenPosition.value) {
    return { display: 'none' }
  }

  const [offsetX, offsetY] = props.offset
  const { x, y } = screenPosition.value

  return {
    left: `${x + offsetX}px`,
    top: `${y + offsetY}px`,
    transform: `translate(-50%, -100%)`,
    display: 'block'
  }
})

const tipStyle = computed(() => {
  const [offsetX] = props.offset
  const left = 50 + offsetX + props.tipOffset
  return {
    left: `${left}%`
  }
})

const updatePosition = () => {
  const v = viewer.value
  if (!v?.scene || !props.position) {
    visible.value = false
    return
  }

  let cartesian: Cartesian3
  if (Array.isArray(props.position)) {
    cartesian = Cartesian3.fromDegrees(props.position[0], props.position[1], props.position[2])
  } else {
    cartesian = props.position
  }

  try {
    const pos = SceneTransforms.worldToWindowCoordinates(v.scene, cartesian as any)
    if (!pos) {
      visible.value = false
      return
    }

    const x = Math.round(pos.x)
    const y = Math.round(pos.y)

    screenPosition.value = { x, y }
    visible.value = true

    if (v.scene) {
      lastViewMatrix.value = Matrix4.clone(v.scene.camera.viewMatrix)
    }
  } catch (e) {
    console.warn('CesiumPopup: 坐标转换失败', e)
    visible.value = false
  }
}

const onPostUpdate = () => {
  const v = viewer.value
  if (!v?.scene) return

  const currentMatrix = v.scene.camera.viewMatrix

  if (lastViewMatrix.value && !Matrix4.equalsEpsilon(currentMatrix, lastViewMatrix.value, 0.0001)) {
    lastViewMatrix.value = Matrix4.clone(currentMatrix)
    updatePosition()
  }
}

const handleClose = () => {
  visible.value = false
  emit('close')
}

const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.closeOnEsc && visible.value) {
    handleClose()
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (props.closeOnClickOutside && visible.value && popupRef.value) {
    if (!popupRef.value.contains(e.target as Node)) {
      handleClose()
    }
  }
}

const handleResize = () => {
  if (visible.value) {
    updatePosition()
  }
}

let postRenderRemove: (() => void) | null = null

const bindEvents = () => {
  const v = viewer.value
  if (v?.scene?.postRender) {
    postRenderRemove = v.scene.postRender.addEventListener(onPostUpdate)
  }
}

const unbindEvents = () => {
  if (postRenderRemove) {
    postRenderRemove()
    postRenderRemove = null
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEsc)
  window.addEventListener('resize', handleResize)
  bindEvents()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  window.removeEventListener('resize', handleResize)
  unbindEvents()
})

watch(
  () => props.position,
  () => updatePosition(),
  { immediate: true }
)

watch(visible, (val) => {
  if (val) emit('show')
})

defineExpose({
  show() {
    visible.value = true
    updatePosition()
  },
  hide() {
    visible.value = false
  },
  updatePosition
})
</script>

<style scoped>
.cesium-popup {
  position: fixed;
  z-index: 9999;
  pointer-events: auto;
}

.cesium-popup-content-wrapper {
  background: linear-gradient(135deg, rgba(28, 42, 66, 0.95), rgba(16, 25, 40, 0.98));
  color: #e8eaed;
  border-radius: 8px;
  padding: 14px 18px;
  min-width: 200px;
  max-width: 380px;
  font-size: 13px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

.cesium-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.cesium-popup-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.cesium-popup-close {
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  color: #9aa0a6;
  transition: color 0.2s;
}

.cesium-popup-close:hover {
  color: #ff6b6b;
}

.cesium-popup-content {
  line-height: 1.6;
}

.cesium-popup-tip {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(28, 42, 66, 0.95);
}

.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-100% + 8px));
}
</style>
```

**组件特性**:
- **Teleport 渲染**：使用 Vue Teleport 将弹窗渲染到 body，确保 z-index 正确
- **淡入淡出动画**：通过 Transition 组件实现平滑过渡效果
- **相机同步**：监听 postRender 事件，在地图缩放/旋转时自动更新位置
- **多坐标格式支持**：支持 Cartesian3 或 `[lng, lat, alt]` 数组格式
- **键盘交互**：支持 ESC 键关闭弹窗
- **窗口自适应**：监听 resize 事件自动调整位置
- **插槽支持**：提供 header 插槽和默认插槽，支持自定义内容

**使用示例**:
```vue
<template>
  <CesiumPopup
    :position="[116.397, 39.908, 0]"
    title="矿井详情"
    :offset="[0, 10]"
    @close="handleClose"
  >
    <template #header>
      <div class="custom-header">自定义标题</div>
    </template>
    <div class="mine-info">
      <p>矿井名称: xxx</p>
      <p>状态: 在线</p>
    </div>
  </CesiumPopup>
</template>

<script setup>
import { ref } from 'vue'
import CesiumPopup from '@/components/Popup/index.vue'

const handleClose = () => {
  console.log('弹窗关闭')
}
</script>
```

### cesium 右键菜单

```vue
// src/components/Menu/index.vue
<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div v-if="visible" ref="menuRef" class="cesium-context-menu" :style="menuStyle" @click.stop>
        <template v-for="item in menuItems" :key="item.title">
          <div v-if="isDropdown(item)" class="menu-item dropdown" :class="{ disabled: item.disabled }"
            @mouseenter="showDropdown($event, item)" @mouseleave="hideDropdown">
            <div class="menu-item-content">
              <span>{{ item.title }}</span>
              <span class="dropdown-arrow">▶</span>
            </div>
            <div class="menu-dropdown-content" :style="dropdownStyle">
              <button v-for="subItem in item.menu" :key="subItem.title" class="dropdown-item"
                :class="{ disabled: subItem.disabled }"
                :data-tooltip="subItem.url && subItem.url.length > 80 ? subItem.url.substring(0, 80) + '...' : subItem.url"
                @click="handleClick(subItem, $event)">
                {{ subItem.title }}
              </button>
            </div>
          </div>
          <div v-else class="menu-item" :class="{ disabled: item.disabled }"
            :data-tooltip="item.url && item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url"
            @click="handleClick(item, $event)">
            <div class="menu-item-content">{{ item.title }}</div>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  shallowRef,
} from 'vue'
import {
  SceneTransforms,
  Matrix4,
  type Cartesian3
} from 'cesium'
import { getViewer } from '@/utils/cesium/helpers'

defineOptions({ name: 'CesiumContextMenu' })

interface MenuItemBase {
  title: string
  url?: string
  disabled?: boolean
  operation?: (item: MenuItem) => void
  sourceTarget?: Record<string, unknown>
  originEvent?: MouseEvent
  [key: string]: unknown
}

interface DropdownMenuItem extends MenuItemBase {
  menu: MenuItemBase[]
}

type MenuItem = MenuItemBase | DropdownMenuItem

interface Props {
  position: Cartesian3 | null
  menuItems: MenuItem[]
  visible: boolean
  containerSelector?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  containerSelector: '#cesiumContainer'
})

const emit = defineEmits<{
  close: []
}>()

const menuRef = ref<HTMLElement | null>(null)
const screenPosition = ref<{ x: number; y: number } | null>(null)
const dropdownVisible = ref(false)
const dropdownPosition = ref<{ left: string; top: string }>({ left: '100%', top: '0' })

const lastViewMatrix = shallowRef<Matrix4 | null>(null)
let postRenderRemove: (() => void) | null = null

const viewer = computed(() => getViewer())

const isDropdown = (item: MenuItem): item is DropdownMenuItem => {
  return 'menu' in item && Array.isArray(item.menu)
}

const menuStyle = computed(() => {
  if (!screenPosition.value) return { display: 'none' }

  const { x, y } = screenPosition.value
  const menuWidth = 150
  const menuHeight = props.menuItems.length * 32 + 8
  const container = document.querySelector(props.containerSelector) as HTMLElement
  const rect = container?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight }

  let left = x + 10
  let top = y

  if (x + 10 + menuWidth > rect.width) {
    left = x - menuWidth - 10
  }

  if (y + menuHeight > rect.height - 25) {
    top = rect.height - menuHeight - 25
  }

  return {
    left: `${left}px`,
    top: `${top}px`
  }
})

const dropdownStyle = computed(() => dropdownPosition.value)

const updatePosition = () => {
  const v = viewer.value
  if (!v?.scene || !props.position) {
    screenPosition.value = null
    return
  }

  try {
    const pos = SceneTransforms.worldToWindowCoordinates(v.scene, props.position as any)
    if (!pos) {
      screenPosition.value = null
      return
    }

    screenPosition.value = { x: Math.round(pos.x), y: Math.round(pos.y) }

    if (v.scene) {
      lastViewMatrix.value = Matrix4.clone(v.scene.camera.viewMatrix)
    }
  } catch (e) {
    console.warn('CesiumContextMenu: 坐标转换失败', e)
    screenPosition.value = null
  }
}

const onPostUpdate = () => {
  const v = viewer.value
  if (!v?.scene) return

  const currentMatrix = v.scene.camera.viewMatrix
  if (
    lastViewMatrix.value &&
    !Matrix4.equalsEpsilon(currentMatrix, lastViewMatrix.value, 0.0001)
  ) {
    lastViewMatrix.value = Matrix4.clone(currentMatrix)
    updatePosition()
  }
}

const showDropdown = (event: MouseEvent, item: DropdownMenuItem) => {
  if (item.disabled) return
  dropdownVisible.value = true

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const menuRect = menuRef.value?.getBoundingClientRect()

  if (menuRect) {
    let left = '100%'
    let top = '0'

    if (rect.right + 150 > window.innerWidth) {
      left = '-100%'
    }

    dropdownPosition.value = { left, top }
  }
}

const hideDropdown = () => {
  dropdownVisible.value = false
}

const handleClick = (item: MenuItemBase, event: MouseEvent) => {
  event.stopPropagation()
  console.log('handleClick:', item);

  if (item.disabled) return

  if (typeof item.operation === 'function') {
    item.sourceTarget = props.menuItems[0]?.sourceTarget
    item.originEvent = event
    item.operation(item)
  }

  close()
}

const close = () => {
  dropdownVisible.value = false
  emit('close')
}

const handleDocumentClick = () => {
  if (props.visible) {
    close()
  }
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) {
    close()
  }
}

const bindEvents = () => {
  const v = viewer.value
  if (v?.scene?.postRender) {
    postRenderRemove = v.scene.postRender.addEventListener(onPostUpdate)
  }
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
}

const unbindEvents = () => {
  if (postRenderRemove) {
    postRenderRemove()
    postRenderRemove = null
  }
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
}

watch(
  () => props.position,
  () => updatePosition()
)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      updatePosition()
      bindEvents()
    } else {
      unbindEvents()
    }
  }
)

onMounted(() => {
  if (props.visible) {
    bindEvents()
  }
})

onUnmounted(() => {
  unbindEvents()
})

defineExpose({
  close,
  updatePosition
})
</script>

<style scoped>
.cesium-context-menu {
  position: fixed;
  z-index: 10000;
  background: linear-gradient(135deg, rgba(28, 42, 66, 0.98), rgba(16, 25, 40, 0.99));
  border-radius: 8px;
  padding: 4px 0;
  min-width: 120px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}

.menu-item {
  position: relative;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  color: #e8eaed;
  font-size: 13px;
}

.menu-item:hover:not(.disabled) {
  background-color: rgba(66, 133, 244, 0.2);
}

.menu-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.dropdown-arrow {
  font-size: 10px;
  opacity: 0.7;
}

.menu-dropdown-content {
  display: none;
  position: absolute;
  left: 100%;
  top: 0;
  background: linear-gradient(135deg, rgba(28, 42, 66, 0.98), rgba(16, 25, 40, 0.99));
  border-radius: 8px;
  padding: 4px 0;
  min-width: 140px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.menu-item.dropdown:hover .menu-dropdown-content {
  display: block;
}

.dropdown-item {
  display: block;
  width: 100%;
  height: 32px;
  padding: 0 12px;
  border: none;
  background: none;
  color: #e8eaed;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s;
}

.dropdown-item:hover:not(.disabled) {
  background-color: rgba(66, 133, 244, 0.2);
}

.dropdown-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

[data-tooltip] {
  position: relative;
}

[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  bottom: -30px;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10001;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
```

**组件特性**:
- **Teleport 渲染**：使用 Vue Teleport 将菜单渲染到 body
- **淡入淡出动画**：通过 Transition 组件实现平滑过渡
- **相机同步**：监听 postRender 事件，在地图缩放/旋转时自动更新位置
- **下拉菜单支持**：支持嵌套下拉菜单
- **智能定位**：自动检测边界，避免超出视口
- **键盘交互**：支持 ESC 键关闭菜单
- **Tooltip 显示**：URL 过长时自动显示 tooltip

**使用示例**:
```vue
<template>
  <CesiumContextMenu
    :position="position"
    :menu-items="menuItems"
    :visible="menuVisible"
    @close="handleClose"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CesiumContextMenu from '@/components/Menu/index.vue'
import type { Cartesian3 } from 'cesium'

const position = ref<Cartesian3 | null>(null)
const menuVisible = ref(false)

const menuItems = [
  { title: '查看详情', operation: (item) => console.log('查看详情', item.sourceTarget) },
  { title: '跳转链接', url: 'https://example.com' },
  { 
    title: '更多操作', 
    menu: [
      { title: '操作1', operation: (item) => console.log('操作1') },
      { title: '操作2', disabled: true }
    ]
  }
]

const handleClose = () => {
  menuVisible.value = false
}
</script>
```


## index.html
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

## Cookie工具

### Cookie工具函数：

- src/utils/cookie.ts
- 自定义Cookie工具，支持Cookie和localStorage双存储
- 构建时从项目根目录cookie.ts移动到此位置
读取: document/cookie.ts

### 特性说明：
- 支持Cookie和localStorage双存储，当Cookie不可用时自动回退到localStorage
- 支持过期时间设置
- 支持命名空间前缀，避免键名冲突
- 自动JSON序列化/反序列化


## SSO SDK集成

### HTML中引入SDK

需要使用vite 使用transformIndexHtml插件引入此外部文件

```html
<!-- index.html -->
<script src="/net/Content/Resource/SDK/bw.sso.sdk.js"></script>
```

### 登录集成示例
```typescript
// src/utils/sso.ts
export function getUrlParam(name: string): string | null {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
  const r = window.location.search.substr(1)
    .match(reg);
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

  // 检查BW_SSO_SDK是否存在
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

### 在main.ts中使用
```typescript
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import 'ant-design-vue/dist/reset.css'

import { setupStore } from './store'
import { router, setupRouter } from './router'
import { setupRouterGuard } from './router/guard'
import { setupGlobDirectives } from './directives';
import { initSSO } from './utils/sso';

// 先进行SSO登录，成功后再渲染Vue应用
initSSO(() => {
  const app = createApp(App);
    // Configure store
  // 配置 store
  setupStore(app)

  // Configure routing
  // 配置路由
  setupRouter(app)

  setupRouterGuard(router)

  setupGlobDirectives(app)

  app.mount('#app');
});
```

## 指令

### 加载指令
#### 加载组件
```typescript
// src/components/Loading/src/createLoading.ts
import { createVNode, defineComponent, h, reactive, render } from 'vue'
import type { App } from 'vue'
import Loading from './Loading.vue'

interface LoadingProps {
  tip?: string
  loading?: boolean
  size?: 'default' | 'small' | 'large'
  absolute?: boolean
  background?: string
  theme?: string
}

interface LoadingOptions {
  target?: HTMLElement
  props?: LoadingProps
}

interface LoadingInstance {
  vm: ReturnType<typeof createVNode>
  close: () => void
  open: (target?: HTMLElement) => void
  destroy: () => void
  setTip: (tip: string) => void
  setLoading: (loading: boolean) => void
  readonly loading: boolean
  readonly $el: Element | null
}

export function createLoading(
  props: LoadingProps | LoadingOptions,
  target?: HTMLElement,
  wait = false
): LoadingInstance {
  let vm: ReturnType<typeof createVNode> | null = null
  const data = reactive<LoadingProps>({
    tip: '',
    loading: true,
    ...props,
  })

  const LoadingWrap = defineComponent({
    render() {
      return h(Loading, { ...data })
    },
  })

  vm = createVNode(LoadingWrap)

  let container: HTMLElement | null = null
  if (wait) {
    setTimeout(() => {
      render(vm!, (container = document.createElement('div')))
    }, 0)
  }
  else {
    render(vm, (container = document.createElement('div')))
  }

  function close(): void {
    if (vm?.el && vm.el.parentNode)
      vm.el.parentNode.removeChild(vm.el)
  }

  function open(target: HTMLElement = document.body): void {
    if (!vm || !vm.el)
      return

    target.appendChild(vm.el as Node)
  }

  function destroy(): void {
    container && render(null, container)
    container = vm = null
  }

  if (target)
    open(target)

  return {
    vm,
    close,
    open,
    destroy,
    setTip: (tip: string): void => {
      data.tip = tip
    },
    setLoading: (loading: boolean): void => {
      data.loading = loading
    },
    get loading(): boolean {
      return !!data.loading
    },
    get $el(): Element | null {
      return vm?.el as Element | null ?? null
    },
  }
}
```

```vue
// src/components/Loading/src/Loading.vue
<script setup lang="ts">
import { Spin } from 'ant-design-vue'

defineOptions({ name: 'Loading' })

interface Props {
  tip?: string;
  size?: 'default' | 'small' | 'large';
  absolute?: boolean;
  loading?: boolean;
  background?: string;
  theme?: string;
}

withDefaults(defineProps<Props>(), {
  tip: '',
  size: 'large',
  absolute: false,
  loading: false,
})
</script>

<template>
  <section v-show="loading" class="full-loading" :class="{ absolute, [`${theme}`]: !!theme }"
    :style="[background ? `background-color: ${background}` : '']">
    <Spin v-bind="$attrs" :tip="tip" :size="size" :spinning="loading" />
  </section>
</template>

<style lang="less" scoped>
.full-loading {
  display: flex;
  position: fixed;
  z-index: 300;
  top: 0;
  left: 0;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(240 242 245 / 40%);

  &.absolute {
    position: absolute;
    z-index: 400;
    top: 0;
    left: 0;
  }
}
</style>
```

```typescript
// src/components/Loading/src/useLoading.ts
import { ref, unref } from 'vue'
import type { Ref } from 'vue'
import { createLoading } from './createLoading'

interface UseLoadingProps {
  tip?: string
  loading?: boolean
  size?: 'default' | 'small' | 'large'
  absolute?: boolean
  background?: string
  theme?: string
}

interface UseLoadingOptions {
  target?: HTMLElement | Ref<HTMLElement | undefined>
  props?: UseLoadingProps
}

export function useLoading(
  opt: UseLoadingProps | UseLoadingOptions
): [() => void, () => void, (tip: string) => void] {
  let props: UseLoadingProps
  let target: HTMLElement | Ref<HTMLElement | undefined> = document.body

  if (Reflect.has(opt, 'target') || Reflect.has(opt, 'props')) {
    const options = opt as UseLoadingOptions
    props = options.props || {}
    target = options.target || document.body
  }
  else {
    props = opt as UseLoadingProps
  }

  const instance = createLoading(props, undefined, true)

  const open = (): void => {
    const t = unref(target)
    if (!t)
      return
    instance.open(t)
  }

  const close = (): void => {
    instance.close()
  }

  const setTip = (tip: string): void => {
    instance.setTip(tip)
  }

  return [open, close, setTip]
}
```
```typescript
// src/components/Loading/index.ts
import Loading from './src/Loading.vue'

export { Loading }
export { useLoading } from './src/useLoading'
export { createLoading } from './src/createLoading'
```

#### 全局指令

```typescript
// src/directives/loading.ts
import type { App, DirectiveBinding } from 'vue'
import { createLoading } from '@/components/Loading'

interface LoadingElement extends HTMLElement {
  instance?: ReturnType<typeof createLoading>
}

const loadingDirective = {
  mounted(el: LoadingElement, binding: DirectiveBinding<boolean>): void {
    const tip = el.getAttribute('loading-tip') ?? ''
    const background = el.getAttribute('loading-background') ?? ''
    const size = el.getAttribute('loading-size') as 'default' | 'small' | 'large' | null
    const fullscreen = !!binding.modifiers.fullscreen
    const instance = createLoading(
      {
        tip,
        background,
        size: size || 'large',
        loading: !!binding.value,
        absolute: !fullscreen,
      },
      fullscreen ? document.body : el,
    )
    el.instance = instance
  },
  updated(el: LoadingElement, binding: DirectiveBinding<boolean>): void {
    const instance = el.instance
    if (!instance)
      return
    instance.setTip(el.getAttribute('loading-tip') ?? '')
    if (binding.oldValue !== binding.value)
      instance.setLoading?.(binding.value && !instance.loading)
  },
  unmounted(el: LoadingElement): void {
    el?.instance?.close()
  },
}

export function setupLoadingDirective(app: App): void {
  app.directive('loading', loadingDirective)
}

export default loadingDirective
```

```typescript
// src/directives/index.ts
import type { App } from 'vue'
import { setupLoadingDirective } from './loading'

export function setupGlobDirectives(app: App): void {
  setupLoadingDirective(app)
}
```

## 路由设计

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

export const RootRoute: RouteRecordRaw = {
  path: '/',
  name: 'Root',
  redirect: '/minesMap',
  meta: { title: 'Root' },
}

export const IndexRoute: RouteRecordRaw = {
  path: '/',
  name: 'Index',
  component: () => import('@/layouts/default/index.vue'),
  redirect: '/minesMap',
  meta: { title: 'Index' },
  children: [
    {
      path: '/minesMap',
      name: 'minesMap',
      component: () => import('@/views/minesMap/index.vue'),
      meta: {
        title: '矿井地图',
        requiresAuth: true,
      },
    },
  ],
}

export const basicRoutes: RouteRecordRaw[] = [RootRoute, IndexRoute]

export const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH as string),
  routes: basicRoutes,
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

// config router
// 配置路由器
export function setupRouter(app: App): void {
  app.use(router)
}
```

### 路由守卫
```typescript
// src/router/guard.ts
import type { Router } from 'vue-router';
import { initSSO } from '@/utils/sso';
import { getAccessToken } from '@/utils/cookie';

export function setupRouterGuard(router: Router): void {
  router.beforeEach((to, _from, next) => {
    if (!to.meta.requiresAuth) {
      next();
      return;
    }

    const token = getAccessToken();
    if (token) {
      next();
      return;
    }

    try {
      initSSO(() => {
        next();
      });
    } catch (error) {
      console.error('SSO 鉴权失败:', error);
      next(false);
    }
  });
}
```

## 左侧筛选面板组件
### 结构
- 省份
  - 省份名称表格
- 集成商
  - 集成商名称表格 
- 年份
  - 年份表格
- 在线离线
  - 在线
  - 离线
  - 在线不运维
- 集团
  - 集团名称表格

### 右侧树形菜单数据

```json
{
    "params": {
        "columns": [
            {
                "dataIndex": "name",
                "title": "名称",
                "ellipsis": true,
                "width": 120
            }
        ],
        "key": "id",
        "data": [
            {
                "id": "1222B542-3989-4ECE-B894-5310FB079DFD",
                "name": "省份",
                "dataSource": [
                    {
                        "id": "130000",
                        "name": "河北省(1)",
                        "field": "pid"
                    },
                    {
                        "id": "140000",
                        "name": "山西省(22)",
                        "field": "pid"
                    },
                    {
                        "id": "150000",
                        "name": "内蒙古自治区(44)",
                        "field": "pid"
                    },
                    {
                        "id": "230000",
                        "name": "黑龙江省(2)",
                        "field": "pid"
                    },
                    {
                        "id": "320000",
                        "name": "江苏省(2)",
                        "field": "pid"
                    },
                    {
                        "id": "340000",
                        "name": "安徽省(2)",
                        "field": "pid"
                    },
                    {
                        "id": "350000",
                        "name": "福建省(1)",
                        "field": "pid"
                    },
                    {
                        "id": "370000",
                        "name": "山东省(5)",
                        "field": "pid"
                    },
                    {
                        "id": "410000",
                        "name": "河南省(1)",
                        "field": "pid"
                    },
                    {
                        "id": "440000",
                        "name": "广东省(1)",
                        "field": "pid"
                    },
                    {
                        "id": "510000",
                        "name": "四川省(3)",
                        "field": "pid"
                    },
                    {
                        "id": "520000",
                        "name": "贵州省(13)",
                        "field": "pid"
                    },
                    {
                        "id": "530000",
                        "name": "云南省(3)",
                        "field": "pid"
                    },
                    {
                        "id": "610000",
                        "name": "陕西省(8)",
                        "field": "pid"
                    },
                    {
                        "id": "620000",
                        "name": "甘肃省(6)",
                        "field": "pid"
                    },
                    {
                        "id": "630000",
                        "name": "青海省(2)",
                        "field": "pid"
                    },
                    {
                        "id": "640000",
                        "name": "宁夏回族自治区(19)",
                        "field": "pid"
                    },
                    {
                        "id": "650000",
                        "name": "新疆维吾尔自治区(5)",
                        "field": "pid"
                    }
                ]
            },
            {
                "id": "C9BF25A3-9EF1-45E5-A8DB-6D5FB55C0C43",
                "name": "集成商",
                "dataSource": [
                    {
                        "id": "37721445-2660-432A-A758-7CAD76A26287",
                        "name": "北京国电智深控制技术有限公司(3)",
                        "field": "iid"
                    },
                    {
                        "id": "157E95B7-4007-478A-9FA6-82CB73E90082",
                        "name": "北京中博云创科技有限公司(2)",
                        "field": "iid"
                    },
                    {
                        "id": "463C8E32-E7D6-4EA7-BB38-02D4A8AACCFC",
                        "name": "成都博威智慧科技有限公司(4)",
                        "field": "iid"
                    },
                    {
                        "id": "EC5B9144-C207-423E-B517-D36720AF49AF",
                        "name": "成都博威自动化工程有限公司(7)",
                        "field": "iid"
                    },
                    {
                        "id": "9EF61A7E-693D-408A-A29A-CF91B32C0FA6",
                        "name": "成都中嵌科技有限公司(9)",
                        "field": "iid"
                    },
                    {
                        "id": "084B0332-11F3-4FE3-9A0C-2FA6812904DA",
                        "name": "鄂尔多斯市千吉联矿山设备有限公司(34)",
                        "field": "iid"
                    },
                    {
                        "id": "1ED66D58-E871-4C4C-A4A5-F48B04D1932E",
                        "name": "煤炭科学技术研究院有限公司(20)",
                        "field": "iid"
                    },
                    {
                        "id": "1983069600353415169",
                        "name": "山西人工智能矿山创新实验室(1)",
                        "field": "iid"
                    },
                    {
                        "id": "BDCF5C23-D73E-4FCD-997B-1EA2463FE448",
                        "name": "四川阳烁科技有限公司(1)",
                        "field": "iid"
                    },
                    {
                        "id": "70318B48-7593-464C-9310-0D71E9BEBE88",
                        "name": "应急管理部信息研究院(1)",
                        "field": "iid"
                    },
                    {
                        "id": "18402AE2-CD45-4004-B098-E3DA7422D564",
                        "name": "中煤科工集团重庆研究院有限公司(44)",
                        "field": "iid"
                    },
                    {
                        "id": "52042F8E-EE1F-425D-978D-9D05BA7B09B2",
                        "name": "中煤智能科技有限公司(2)",
                        "field": "iid"
                    },
                    {
                        "id": "47E12978-148D-4881-B492-EF49E8387ABB",
                        "name": "中信重工开诚智能装备有限公司(10)",
                        "field": "iid"
                    },
                    {
                        "id": "1735194996180058114",
                        "name": "重庆三迪吉斯科技有限公司(2)",
                        "field": "iid"
                    }
                ]
            },
            {
                "id": "18A373F2-7954-447C-BBFD-15CFB82CCEEE",
                "name": "年份",
                "dataSource": [
                    {
                        "id": "2026",
                        "name": "2026(1)",
                        "field": "year"
                    },
                    {
                        "id": "2025",
                        "name": "2025(3)",
                        "field": "year"
                    },
                    {
                        "id": "2024",
                        "name": "2024(9)",
                        "field": "year"
                    },
                    {
                        "id": "2023",
                        "name": "2023(8)",
                        "field": "year"
                    },
                    {
                        "id": "2022",
                        "name": "2022(23)",
                        "field": "year"
                    },
                    {
                        "id": "2021",
                        "name": "2021(36)",
                        "field": "year"
                    },
                    {
                        "id": "2020",
                        "name": "2020(37)",
                        "field": "year"
                    },
                    {
                        "id": "2019",
                        "name": "2019(12)",
                        "field": "year"
                    },
                    {
                        "id": "2018",
                        "name": "2018(6)",
                        "field": "year"
                    },
                    {
                        "id": "2017",
                        "name": "2017(3)",
                        "field": "year"
                    },
                    {
                        "id": "2016",
                        "name": "2016(1)",
                        "field": "year"
                    },
                    {
                        "id": "2014",
                        "name": "2014(1)",
                        "field": "year"
                    }
                ]
            },
            {
                "id": "E7BE63D4-9E70-4587-9C7E-F9738101B37B",
                "name": "在线离线",
                "dataSource": [
                    {
                        "id": 1,
                        "field": "ol",
                        "name": "在线(51)"
                    },
                    {
                        "id": 0,
                        "field": "ol",
                        "name": "离线(89)"
                    },
                    {
                        "id": 2,
                        "field": "ol",
                        "name": "在线不运维(18)"
                    }
                ]
            },
            {
                "id": "0488D2A9-549A-4A7F-9E86-19A8631226F7",
                "name": "集团",
                "dataSource": [
                    {
                        "id": "A04",
                        "name": "大运华盛集团(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A51",
                        "name": "沈阳焦煤(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A50",
                        "name": "中煤华利能源控股有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A02",
                        "name": "乌海能源(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A03",
                        "name": "伊泰煤炭(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A05",
                        "name": "中煤新集(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A06",
                        "name": "皂卫矿业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A08",
                        "name": "陕煤集团(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A09",
                        "name": "神达能源集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A11",
                        "name": "东江煤业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A12",
                        "name": "汇能煤电(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A13",
                        "name": "窑街煤电(6)",
                        "field": "gid"
                    },
                    {
                        "id": "A14",
                        "name": "玉井煤业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A16",
                        "name": "鄂尔多斯能源局(19)",
                        "field": "gid"
                    },
                    {
                        "id": "A18",
                        "name": "晋能集团(3)",
                        "field": "gid"
                    },
                    {
                        "id": "A21",
                        "name": "鄂托克前旗能源局(4)",
                        "field": "gid"
                    },
                    {
                        "id": "A22",
                        "name": "山西煤炭运销集团(3)",
                        "field": "gid"
                    },
                    {
                        "id": "A23",
                        "name": "国能江苏电力有限公司(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A24",
                        "name": "国能内蒙古能源发电有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A25",
                        "name": "永煤集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A26",
                        "name": "大雁矿业集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A29",
                        "name": "华夏煤业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A31",
                        "name": "东方电气集团(3)",
                        "field": "gid"
                    },
                    {
                        "id": "A32",
                        "name": "中煤建筑安装工程集团有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A33",
                        "name": "榆林神华能源有限责任公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A34",
                        "name": "青海能源(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A35",
                        "name": "内蒙古电投能源(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A36",
                        "name": "蒲白矿业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A37",
                        "name": "鹤岗矿业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A38",
                        "name": "山西中煤顺通煤业有限责任公司 (1)",
                        "field": "gid"
                    },
                    {
                        "id": "A39",
                        "name": "中国神华能源股份有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A40",
                        "name": "山西平遥县兴盛煤化有限责任公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A41",
                        "name": "贵州盘江精煤股份有限公司(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A42",
                        "name": "山西普大煤业集团有限公司(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A43",
                        "name": "云南天力煤化有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A44",
                        "name": "河南能源(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A45",
                        "name": "山西阳城阳泰集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A48",
                        "name": "山西华润联盛能源投资有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A66",
                        "name": "国能广东电力(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A67",
                        "name": "中煤平朔集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A68",
                        "name": "福建永安煤业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A69",
                        "name": "千树塔矿业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A70",
                        "name": "南煤集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A27",
                        "name": "中煤能源股份公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A72",
                        "name": "兰花集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A52",
                        "name": "水矿集团(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A55",
                        "name": "中泰集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A54",
                        "name": "昆钢集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A53",
                        "name": "集团(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A01",
                        "name": "济矿集团(6)",
                        "field": "gid"
                    }
                ]
            }
        ]
    },
    "generalFunc": "commonItemsStat"
}
```

```typescript
// src/types/filter.ts
/**
 * 单个筛选选项（例如：河北省(1)、2024(9) ……）
 */
export interface FilterOption {
  /** ID，通常是字符串（如行政区划码、年份、UUID）或数字 */
  id: string | number;

  /** 显示名称，通常带统计数量，如 "河北省(1)" */
  name: string;

  /** 对应的查询字段名，如 "pid"、"year"、"gid"、"iid"、"ol" */
  field: string;
}

/**
 * 一个筛选维度 / 分类（如 “省份”、“年份”、“集团”）
 */
export interface FilterCategory {
  /** 分类唯一标识（UUID） */
  id: string;

  /** 分类名称，如 "省份"、"集成商"、"年份" */
  name: string;

  /** 该分类下的所有可选筛选项 */
  dataSource: FilterOption[];
}

/**
 * 表格列配置（目前只有一个列，但保留数组结构以便扩展）
 */
export interface ColumnConfig {
  dataIndex: string;
  title: string;
  ellipsis: boolean;
  width: number;
}

/**
 * 整个筛选数据的响应结构
 */
export interface CommonItemsStatResponse {
  /** 核心筛选参数 */
  params: {
    /** 列定义（目前用于渲染筛选列表的表头） */
    columns: ColumnConfig[];

    /** 数据项的主键字段名，固定为 "id" */
    key: string;

    /** 所有筛选维度分类 */
    data: FilterCategory[];
  };

  /** 函数/接口标识，固定值 */
  generalFunc: "commonItemsStat";
}

// 如果你想更严格一点，可以这样写（推荐在实际项目中使用）
export type CommonItemsStatApiResponse = CommonItemsStatResponse;
```

### 矿井数据类型
```typescript
// src/types/mine.ts
export interface MineItem {
  MineName: string
  name: string
  MineDesc: string
  ProvinceID: string
  B: number
  L: number
  x: number
  y: number
  z: number
  isonline: 0 | 1 | 2
  color: string
  icon: string
  isalarm: 0 | 1
  httpurl: string
  vpnurl: string
  [key: string]: any
}

export interface ContextMenuItem {
  text: string
  methodName: string
  type: string
  field: string
}

export interface MineMapParams {
  data: MineItem[]
  contextmenuItems: ContextMenuItem[]
  total: string
  online: number
  zoom: number
  maxZoom: number
  minZoom: number
}

export interface MineConfig {
  params: MineMapParams
  generalFunc: 'groupCompanyLevelMine'
}
```

### 类型入口文件
```typescript
// src/types/index.ts
export * from './filter'
export * from './mine'
```

### 左侧菜单组件
```vue
// src/components/MinesMap/src/Sidebar.vue
<script setup lang="ts">
import { ref, unref, onMounted, watch } from 'vue'
import { Button, Tag, Collapse, Table } from 'ant-design-vue'
import type { TablePaginationConfig } from 'ant-design-vue'
import { RightOutlined, LeftOutlined } from '@ant-design/icons-vue'
import { groupCompanyLevelMine, commonItemsStat } from '@/utils/mqtt/publish'
import { useGroupCompanyLevelMine } from '@/hooks/mines/useGroupCompanyLevelMine'
import { isArray } from '@/utils/is'
import type { FilterCategory, ColumnConfig } from '@/types/filter'

interface TagItem {
  value: string
  label: string
  name?: string
  id?: string | number
}

interface Parameter {
  year: string
  ol: string
  pid: string
  gid: string
  iid: string
  [key: string]: string
}

const { getCommonItemsStat } = useGroupCompanyLevelMine()
const emit = defineEmits<{ (e: 'openClick', open: boolean): void }>()

const mapPane = ref<boolean>(false)
const selectTagArray = ref<TagItem[]>([])
const commonItemsStatPen = ref<{
  data: FilterCategory[]
  key: string
  columns: ColumnConfig[]
}>({
  data: [],
  key: 'Id',
  columns: [],
})

const paging = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  pageSizeOptions: ['10', '20', '50', '200', '1000'],
  showTotal: (total: number, range: [number, number]) => {
    return `${range[0]}-${range[1]} 共${total}条`
  },
  showQuickJumper: true,
  showSizeChanger: true,
  total: 0,
})

const TAGS: TagItem[] = [
  { value: 'year', label: '年份' },
  { value: 'ol', label: '是否在线' },
  { value: 'pid', label: '省份' },
  { value: 'gid', label: '集团' },
  { value: 'iid', label: '集成商' },
]

const parameter: Parameter = {
  year: '',
  ol: '',
  pid: '',
  gid: '',
  iid: '',
}
const tagMap = new Map<string, Array<{ id: string | number; name: string }>>()
const tagSet = new Set<TagItem>()

onMounted(() => {
  commonItemsStat(parameter)
})

watch(
  () => unref(getCommonItemsStat),
  (newVal) => {
    if (!newVal) return
    commonItemsStatPen.value.data = newVal.data
    commonItemsStatPen.value.columns = newVal.columns
    commonItemsStatPen.value.key = newVal.key
  },
)

function openClick(): void {
  mapPane.value = !mapPane.value
  emit('openClick', mapPane.value)
}

function rowOn(record: { id: string | number; field: string; name: string }) {
  return {
    onClick: () => {
      const { id, field, name } = record
      const values = tagMap.get(field)
      if (isArray(values) && !values.some((v) => v.id === id)) {
        values.push({ id, name })
      }
      else {
        tagMap.set(field, [{ id, name }])
      }
      parameter[field] = String(id)
      const tag = TAGS.find((t) => t.value === field)
      if (tag) {
        tag.name = name
        tag.id = id
        tagSet.add(tag)
        selectTagArray.value = [...tagSet]
      }
      groupCompanyLevelMine(parameter)
    },
  }
}

function tagClose(tag: TagItem): void {
  parameter[tag.value] = ''
  tagSet.forEach((e) => {
    if (e.value === tag.value) {
      tagSet.delete(e)
    }
  })
  selectTagArray.value = [...tagSet]
  groupCompanyLevelMine(parameter)
}

function handleTableChange(
  pagination: TablePaginationConfig,
  _filters: Record<string, any>,
  tableSorter: Record<string, any>,
): void {
  if (Object.keys(tableSorter).length > 0) {
    paging.value.current = tableSorter.current
    paging.value.pageSize = tableSorter.pageSize
  }
  paging.value = pagination
}
</script>

<template>
  <div class="sidebar" :style="{
    marginLeft: mapPane ? '' : '-320px',
    width: mapPane ? '320px' : '0',
  }">
    <Button :class="mapPane ? '' : 'menu-collapse-btn-close'" class="menu-collapse-btn" @click="openClick">
      <template #icon>
        <LeftOutlined v-if="mapPane" />
        <RightOutlined v-else />
      </template>
    </Button>
    <div class="inspector-body sep-top">
      <div :style="{ margin: '0 12px', marginTop: '36px' }">
        <Tag v-for="tag in selectTagArray" :key="tag.value" class="tag" closable @close="tagClose(tag)">
          <span class="tag-label">{{ tag.label }}</span>
          :
          <span class="tag-name">{{ tag.name }}</span>
        </Tag>
      </div>
      <Collapse accordion>
        <Collapse.Panel v-for="item in commonItemsStatPen.data" :key="item.id" :header="item.name">
          <Table ref="table" :key="commonItemsStatPen.key" :size="'small'" :columns="commonItemsStatPen.columns"
            :row-key="commonItemsStatPen.key" :data-source="item.dataSource" :custom-row="rowOn" :pagination="paging"
            @change="handleTableChange" />
        </Collapse.Panel>
      </Collapse>
    </div>
  </div>
</template>

<style lang="less">
.sidebar {
  height: 100%;
  position: fixed;
  z-index: 1000;
  padding-bottom: 60px;
  transition: all 0.45s;
  border: 1px solid #ccc;
  border-right-width: 0;
  background: #f6f6f6;
}

.inspector-body {
  position: relative;
  flex: 1 1 100%;
  max-height: 800px;
  padding: 4px;
  overflow-x: hidden;
  overflow-y: scroll;
}

.menu-collapse-btn {
  position: fixed;
  top: 80px;
  left: 332px;
}

.menu-collapse-btn-close {
  left: 12px;
}

.tag {
  margin-bottom: 2px;

  .tag-label {
    color: #2db7f5;
    font-weight: bold;
  }
}
</style>
```

## is 工具
```typescript
// src/utils/is.ts
export {
  isArguments,
  isArrayBuffer,
  isArrayLike,
  isArrayLikeObject,
  isBuffer,
  isBoolean,
  isDate,
  isElement,
  isEmpty,
  isEqual,
  isEqualWith,
  isError,
  isFunction,
  isFinite,
  isLength,
  isMap,
  isMatch,
  isMatchWith,
  isNative,
  isNil,
  isNumber,
  isNull,
  isObjectLike,
  isPlainObject,
  isRegExp,
  isSafeInteger,
  isSet,
  isString,
  isSymbol,
  isTypedArray,
  isUndefined,
  isWeakMap,
  isWeakSet,
} from 'lodash-es'

const toString = Object.prototype.toString

export function is(val: unknown, type: string): boolean {
  return toString.call(val) === `[object ${type}]`
}

export function isDef<T>(val: T): val is NonNullable<T> {
  return typeof val !== 'undefined'
}

// TODO 此处 isObject 存在歧义
export function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && is(val, 'Object')
}

// TODO 此处 isArray 存在歧义
export function isArray<T = unknown>(val: unknown): val is T[] {
  return Array.isArray(val)
}

export function isWindow(val: unknown): val is Window {
  return typeof window !== 'undefined' && is(val, 'Window')
}

export const isServer: boolean = typeof window === 'undefined'

export const isClient: boolean = !isServer

export function isHttpUrl(path: string): boolean {
  const reg = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?/
  return reg.test(path)
}

export function isPascalCase(str: string): boolean {
  const regex = /^[A-Z][A-Za-z]*$/
  return regex.test(str)
}

export function isAlphabetic(str: string): boolean {
  return /^([A-Za-z]+)?$/.test(str)
}

export function isChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str)
}
```

## MQTT配置

### 单例模式
在整个应用中只创建一个MQTT客户端实例，用于订阅和发布消息。

### 连接信息
| 参数     | 值        | 说明   |
| -------- | --------- | ------ |
| username | `bowwell` | 用户名 |
| password | `bowwell` | 密码   |

### mqtt 封装


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

```typescript
// src/utils/mqtt/index.ts
import { RealTimeData } from './RealTimeData'
import { setRealTimeData } from './publish'

/**
 * MQTT 客户端单例实例
 * 默认启用调试模式
 */
export const mqtt: RealTimeData = new RealTimeData(true, 'BWGGS')

// ==================== 初始化函数 ====================

/**
 * 初始化 MQTT 上下文
 * 创建连接并订阅通用主题
 * 会在连接成功后自动订阅
 * @throws {Error} 当初始化失败时抛出错误
 */
export function contextInit(): void {
  try {
    // 注入单例到 publish 模块
    setRealTimeData(mqtt)

    // 初始化 MQTT 连接
    mqtt.init()

    // 订阅通用主题（使用通配符）
    // 如果连接未建立，会自动在连接成功后的 connect 事件中订阅
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

### 存储 Mqtt 响应数据
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

### MQTT 消息类型常量定义
```typescript
// src/utils/mqtt/types.ts

// ==================== 集团矿井相关 ====================

/** 集团矿井层级信息 */
export const GROUP_COMPANY_LEVEL_MINE = 'groupCompanyLevelMine' as const;

/** 默认消息类型 */
export const DEFAULT_TYPE = 'defaultType' as const;

/** 提示消息 */
export const PROMPT_MESSAGE = 'promptMessage' as const;

// ==================== 公司运维界面功能 ====================

/** 通用项目统计 */
export const COMMON_ITEMS_STAT = 'commonItemsStat' as const;

/** 集团公司上下文菜单项 */
export const GROUP_COMPANY_CONTEXTMENU_ITEMS = 'groupCompanyContextmenuItems' as const;

// ==================== 类型分组 ====================

export type MessageType =
  | typeof GROUP_COMPANY_LEVEL_MINE
  | typeof DEFAULT_TYPE
  | typeof PROMPT_MESSAGE
  | typeof COMMON_ITEMS_STAT
  | typeof GROUP_COMPANY_CONTEXTMENU_ITEMS;

/** 所有消息类型的数组 */
export const ALL_MESSAGE_TYPES: MessageType[] = [
  GROUP_COMPANY_LEVEL_MINE,
  DEFAULT_TYPE,
  PROMPT_MESSAGE,
  COMMON_ITEMS_STAT,
  GROUP_COMPANY_CONTEXTMENU_ITEMS,
];

/** 集团矿井相关消息类型 */
export const GROUP_COMPANY_TYPES: MessageType[] = [
  GROUP_COMPANY_LEVEL_MINE,
  GROUP_COMPANY_CONTEXTMENU_ITEMS,
];

/** 运维功能相关消息类型 */
export const OPERATION_TYPES: MessageType[] = [COMMON_ITEMS_STAT];

/** 系统消息类型 */
export const SYSTEM_TYPES: MessageType[] = [DEFAULT_TYPE, PROMPT_MESSAGE];

/**
 * 根据消息类型获取分类
 * @param type - 消息类型
 * @returns 分类名称
 */
export function getTypeCategory(type: string): string {
  if (GROUP_COMPANY_TYPES.includes(type as MessageType)) return '集团矿井';
  if (OPERATION_TYPES.includes(type as MessageType)) return '运维功能';
  if (SYSTEM_TYPES.includes(type as MessageType)) return '系统消息';
  return '其他';
}

/**
 * 验证消息类型是否有效
 * @param type - 消息类型
 * @returns 是否有效
 */
export function isValidMessageType(type: string): type is MessageType {
  return ALL_MESSAGE_TYPES.includes(type as MessageType);
}

/**
 * 获取所有消息类型的描述映射
 * @returns 类型描述映射表
 */
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

### MQTT 策略执行分发
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

// ==================== 消息状态码配置 ====================

interface MqttResult {
  params: Record<string, any>;
  topic: string;
  generalFunc?: string;
}

/**
 * 消息状态码映射表
 */
const messageStateCode: Array<{ type: string }> = [
  { type: 'info' },    // 状态码: 11
  { type: 'success' }, // 状态码: 12
  { type: 'warning' }, // 状态码: 13
  { type: 'error' },   // 状态码: >13
];

/**
 * 从主题中提取策略 ID
 * @param topic - MQTT 主题
 * @returns 策略 ID
 */
function extractStrategyId(topic: string): string {
  const topics = topic.split('/');
  return topics[topics.length - 1];
}

/**
 * 验证响应数据是否有效
 * @param result - 响应结果
 * @returns 数据是否有效
 */
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

/** MQTT 策略处理器映射表 */
export const mqttStrategyMap = new Map<string, StrategyHandler>();

// ==================== 具体策略处理器 ====================

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

/**
 * 处理消息中的链接
 * @param url - 链接信息（字符串或数组）
 * @param messageType - 消息类型
 */
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

// ==================== 策略注册 ====================

/**
 * 注册策略处理器
 * @param type - 消息类型
 * @param handler - 处理函数
 */
export function registerStrategy(type: string, handler: StrategyHandler): void {
  if (!isValidMessageType(type)) {
    console.warn(`尝试注册无效的消息类型: ${type}`);
    return;
  }
  mqttStrategyMap.set(type, handler);
  console.debug(`策略注册成功: ${type} -> ${handler.name}`);
}

/**
 * 批量注册策略处理器
 * @param strategies - 策略数组，每个元素为 [类型, 处理函数]
 */
export function registerStrategies(strategies: Array<[string, StrategyHandler]>): void {
  strategies.forEach(([type, handler]) => {
    registerStrategy(type, handler);
  });
}

// 注册所有内置策略
registerStrategies([
  [GROUP_COMPANY_LEVEL_MINE, handleGroupCompanyLevelMine],
  [COMMON_ITEMS_STAT, handleCommonItemsStat],
  [PROMPT_MESSAGE, handlePromptMessage],
  [DEFAULT_TYPE, handlePromptMessage],
  [GROUP_COMPANY_CONTEXTMENU_ITEMS, handleGroupCompanyContextmenuItems],
]);

/**
 * MQTT 消息处理主函数
 * @param type - 消息类型
 * @param result - 消息结果
 * @returns 是否成功处理
 */
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

/** 获取已注册的策略数量 */
export function getRegisteredStrategyCount(): number {
  return mqttStrategyMap.size;
}

/** 获取所有已注册的策略类型 */
export function getRegisteredStrategyTypes(): string[] {
  return Array.from(mqttStrategyMap.keys());
}

/**
 * 检查策略是否已注册
 * @param type - 消息类型
 */
export function isStrategyRegistered(type: string): boolean {
  return mqttStrategyMap.has(type);
}

// 向后兼容的别名
export const mqttFun = processMqttMessage;
export const mqttFunMap = mqttStrategyMap;
```

### MQTT发布消息格式
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

#### MQTT发布消息类型
```typescript
// ====================== 类型定义 ======================

/**
 * 策略参数项（key-value 结构）
 * - name 和 value 通常都是字符串，但允许空值
 */
interface StrategyParam {
  name: string;
  value: string;
}

/**
 * 请求体整体结构（用于煤矿/矿井相关接口调用）
 */
interface MineApiRequestBody {
  /** 业务编码 / 接口标识（例如 4694 可能代表某个特定查询或操作） */
  code: number;

  /** 策略参数列表（动态键值对，可为空数组） */
  strategyParams: StrategyParam[];

  /** 身份验证令牌（JWT、Session Token 等） */
  token: string;

  /** 调用方系统标识（固定值示例：BWGGS） */
  caller: string;

  /** 煤矿描述 / 简称（例如 YJHSWMK） */
  mineDesc: string;

  /** 煤矿全称 / 显示名称 */
  MineName: string;

  /** 客户端唯一标识（用于追踪、设备指纹等） */
  clientId: string;
}

// ====================== 字面量类型增强版（更严格） ======================

// 如果 caller 只有少数固定值，可以用联合类型限制
type KnownCaller = 'BWGGS' | 'OtherSystem' | 'MobileApp';

// 增强版接口（可选）
interface StrictMineApiRequestBody extends MineApiRequestBody {
  caller: KnownCaller;  // 可选：收紧 caller 的可能值
}

// ====================== 示例数据（符合你提供的结构） ======================

export const exampleRequestBody: MineApiRequestBody = {
  code: 4694,
  strategyParams: [
    {
      name: "queryType",
      value: "realtime"
    },
    {
      name: "timeRange",
      value: "last24h"
    }
  ],
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  caller: "BWGGS",
  mineDesc: "YJHSWMK",
  MineName: "窑街海石湾煤矿",
  clientId: "client-uuid-123e4567-e89b-12d3-a456-426614174000"
} as const;
```

#### MQTT订阅消息
根据通配符 `#` 订阅
具体查看 `subscribeCommon`

### 右键下拉菜单数据
```json
{
    "params": {
        "columns": [
            {
                "dataIndex": "name",
                "title": "名称",
                "ellipsis": true,
                "width": 120
            }
        ],
        "key": "id",
        "data": [
            {
                "id": "CD9A179F-3CF7-4AF0-8664-89F532610DBC",
                "name": "省份",
                "dataSource": [
                    {
                        "id": "130000",
                        "name": "河北省(1)",
                        "field": "pid"
                    },
                    {
                        "id": "140000",
                        "name": "山西省(22)",
                        "field": "pid"
                    },
                    {
                        "id": "150000",
                        "name": "内蒙古自治区(44)",
                        "field": "pid"
                    },
                    {
                        "id": "230000",
                        "name": "黑龙江省(2)",
                        "field": "pid"
                    },
                    {
                        "id": "320000",
                        "name": "江苏省(2)",
                        "field": "pid"
                    },
                    {
                        "id": "340000",
                        "name": "安徽省(2)",
                        "field": "pid"
                    },
                    {
                        "id": "350000",
                        "name": "福建省(1)",
                        "field": "pid"
                    },
                    {
                        "id": "370000",
                        "name": "山东省(5)",
                        "field": "pid"
                    },
                    {
                        "id": "410000",
                        "name": "河南省(1)",
                        "field": "pid"
                    },
                    {
                        "id": "440000",
                        "name": "广东省(1)",
                        "field": "pid"
                    },
                    {
                        "id": "510000",
                        "name": "四川省(3)",
                        "field": "pid"
                    },
                    {
                        "id": "520000",
                        "name": "贵州省(13)",
                        "field": "pid"
                    },
                    {
                        "id": "530000",
                        "name": "云南省(3)",
                        "field": "pid"
                    },
                    {
                        "id": "610000",
                        "name": "陕西省(8)",
                        "field": "pid"
                    },
                    {
                        "id": "620000",
                        "name": "甘肃省(6)",
                        "field": "pid"
                    },
                    {
                        "id": "630000",
                        "name": "青海省(2)",
                        "field": "pid"
                    },
                    {
                        "id": "640000",
                        "name": "宁夏回族自治区(19)",
                        "field": "pid"
                    },
                    {
                        "id": "650000",
                        "name": "新疆维吾尔自治区(5)",
                        "field": "pid"
                    }
                ]
            },
            {
                "id": "F61EE69D-B1FC-474A-AAEA-0400D313C309",
                "name": "集成商",
                "dataSource": [
                    {
                        "id": "37721445-2660-432A-A758-7CAD76A26287",
                        "name": "北京国电智深控制技术有限公司(3)",
                        "field": "iid"
                    },
                    {
                        "id": "157E95B7-4007-478A-9FA6-82CB73E90082",
                        "name": "北京中博云创科技有限公司(2)",
                        "field": "iid"
                    },
                    {
                        "id": "463C8E32-E7D6-4EA7-BB38-02D4A8AACCFC",
                        "name": "成都博威智慧科技有限公司(4)",
                        "field": "iid"
                    },
                    {
                        "id": "EC5B9144-C207-423E-B517-D36720AF49AF",
                        "name": "成都博威自动化工程有限公司(7)",
                        "field": "iid"
                    },
                    {
                        "id": "9EF61A7E-693D-408A-A29A-CF91B32C0FA6",
                        "name": "成都中嵌科技有限公司(9)",
                        "field": "iid"
                    },
                    {
                        "id": "084B0332-11F3-4FE3-9A0C-2FA6812904DA",
                        "name": "鄂尔多斯市千吉联矿山设备有限公司(34)",
                        "field": "iid"
                    },
                    {
                        "id": "1ED66D58-E871-4C4C-A4A5-F48B04D1932E",
                        "name": "煤炭科学技术研究院有限公司(20)",
                        "field": "iid"
                    },
                    {
                        "id": "1983069600353415169",
                        "name": "山西人工智能矿山创新实验室(1)",
                        "field": "iid"
                    },
                    {
                        "id": "BDCF5C23-D73E-4FCD-997B-1EA2463FE448",
                        "name": "四川阳烁科技有限公司(1)",
                        "field": "iid"
                    },
                    {
                        "id": "70318B48-7593-464C-9310-0D71E9BEBE88",
                        "name": "应急管理部信息研究院(1)",
                        "field": "iid"
                    },
                    {
                        "id": "18402AE2-CD45-4004-B098-E3DA7422D564",
                        "name": "中煤科工集团重庆研究院有限公司(44)",
                        "field": "iid"
                    },
                    {
                        "id": "52042F8E-EE1F-425D-978D-9D05BA7B09B2",
                        "name": "中煤智能科技有限公司(2)",
                        "field": "iid"
                    },
                    {
                        "id": "47E12978-148D-4881-B492-EF49E8387ABB",
                        "name": "中信重工开诚智能装备有限公司(10)",
                        "field": "iid"
                    },
                    {
                        "id": "1735194996180058114",
                        "name": "重庆三迪吉斯科技有限公司(2)",
                        "field": "iid"
                    }
                ]
            },
            {
                "id": "8ADD3B10-8AF2-461A-9506-94F434F9FD45",
                "name": "年份",
                "dataSource": [
                    {
                        "id": "2026",
                        "name": "2026(1)",
                        "field": "year"
                    },
                    {
                        "id": "2025",
                        "name": "2025(3)",
                        "field": "year"
                    },
                    {
                        "id": "2024",
                        "name": "2024(9)",
                        "field": "year"
                    },
                    {
                        "id": "2023",
                        "name": "2023(8)",
                        "field": "year"
                    },
                    {
                        "id": "2022",
                        "name": "2022(23)",
                        "field": "year"
                    },
                    {
                        "id": "2021",
                        "name": "2021(36)",
                        "field": "year"
                    },
                    {
                        "id": "2020",
                        "name": "2020(37)",
                        "field": "year"
                    },
                    {
                        "id": "2019",
                        "name": "2019(12)",
                        "field": "year"
                    },
                    {
                        "id": "2018",
                        "name": "2018(6)",
                        "field": "year"
                    },
                    {
                        "id": "2017",
                        "name": "2017(3)",
                        "field": "year"
                    },
                    {
                        "id": "2016",
                        "name": "2016(1)",
                        "field": "year"
                    },
                    {
                        "id": "2014",
                        "name": "2014(1)",
                        "field": "year"
                    }
                ]
            },
            {
                "id": "3D65F6A8-482E-4CF4-B6AB-937B1EAA0793",
                "name": "在线离线",
                "dataSource": [
                    {
                        "id": 1,
                        "field": "ol",
                        "name": "在线(0)"
                    },
                    {
                        "id": 0,
                        "field": "ol",
                        "name": "离线(140)"
                    },
                    {
                        "id": 2,
                        "field": "ol",
                        "name": "在线不运维(0)"
                    }
                ]
            },
            {
                "id": "EF4DB9E1-A13E-43CB-8234-2E8CEF2533B2",
                "name": "集团",
                "dataSource": [
                    {
                        "id": "A04",
                        "name": "大运华盛集团(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A51",
                        "name": "沈阳焦煤(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A50",
                        "name": "中煤华利能源控股有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A02",
                        "name": "乌海能源(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A03",
                        "name": "伊泰煤炭(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A05",
                        "name": "中煤新集(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A06",
                        "name": "皂卫矿业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A08",
                        "name": "陕煤集团(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A09",
                        "name": "神达能源集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A11",
                        "name": "东江煤业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A12",
                        "name": "汇能煤电(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A13",
                        "name": "窑街煤电(6)",
                        "field": "gid"
                    },
                    {
                        "id": "A14",
                        "name": "玉井煤业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A16",
                        "name": "鄂尔多斯能源局(19)",
                        "field": "gid"
                    },
                    {
                        "id": "A18",
                        "name": "晋能集团(3)",
                        "field": "gid"
                    },
                    {
                        "id": "A21",
                        "name": "鄂托克前旗能源局(4)",
                        "field": "gid"
                    },
                    {
                        "id": "A22",
                        "name": "山西煤炭运销集团(3)",
                        "field": "gid"
                    },
                    {
                        "id": "A23",
                        "name": "国能江苏电力有限公司(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A24",
                        "name": "国能内蒙古能源发电有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A25",
                        "name": "永煤集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A26",
                        "name": "大雁矿业集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A29",
                        "name": "华夏煤业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A31",
                        "name": "东方电气集团(3)",
                        "field": "gid"
                    },
                    {
                        "id": "A32",
                        "name": "中煤建筑安装工程集团有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A33",
                        "name": "榆林神华能源有限责任公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A34",
                        "name": "青海能源(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A35",
                        "name": "内蒙古电投能源(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A36",
                        "name": "蒲白矿业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A37",
                        "name": "鹤岗矿业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A38",
                        "name": "山西中煤顺通煤业有限责任公司 (1)",
                        "field": "gid"
                    },
                    {
                        "id": "A39",
                        "name": "中国神华能源股份有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A40",
                        "name": "山西平遥县兴盛煤化有限责任公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A41",
                        "name": "贵州盘江精煤股份有限公司(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A42",
                        "name": "山西普大煤业集团有限公司(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A43",
                        "name": "云南天力煤化有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A44",
                        "name": "河南能源(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A45",
                        "name": "山西阳城阳泰集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A48",
                        "name": "山西华润联盛能源投资有限公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A66",
                        "name": "国能广东电力(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A67",
                        "name": "中煤平朔集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A68",
                        "name": "福建永安煤业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A69",
                        "name": "千树塔矿业(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A70",
                        "name": "南煤集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A27",
                        "name": "中煤能源股份公司(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A72",
                        "name": "兰花集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A52",
                        "name": "水矿集团(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A55",
                        "name": "中泰集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A54",
                        "name": "昆钢集团(1)",
                        "field": "gid"
                    },
                    {
                        "id": "A53",
                        "name": "集团(2)",
                        "field": "gid"
                    },
                    {
                        "id": "A01",
                        "name": "济矿集团(6)",
                        "field": "gid"
                    }
                ]
            }
        ]
    },
    "generalFunc": "commonItemsStat"
}
```

```typescript
// ====================== 类型定义 ======================

/** 子菜单项（每个具体链接） */
interface SubMenuItem {
  title: string;
  field: 'url';                    // 当前所有都是 url，可根据需要扩展
  url: string;
  type: 'newWindow';               // 字面量类型，增强类型安全
}

/** 一级菜单组 */
interface MenuGroup {
  title: string;
  menu: SubMenuItem[];
}

/** dropdown 参数 */
interface DropdownParams {
  type: 'dropdown';
  data: MenuGroup[];
}

/** 完整菜单配置（最外层） */
interface MenuConfig {
  params: DropdownParams;
  generalFunc: 'groupCompanyContextmenuItems'; // 字面量类型
}

// ====================== 配置对象 ======================

export const groupCompanyMenuConfig: MenuConfig = {
  params: {
    type: 'dropdown',
    data: [
      {
        title: '仅现场',
        menu: [
          {
            title: '现场视频',
            field: 'url',
            url: 'http://192.163.32.19:33382/bwhls/index',
            type: 'newWindow',
          },
          {
            title: 'NATROS',
            field: 'url',
            url: 'http://192.163.32.19:3200',
            type: 'newWindow',
          },
        ],
      },
      {
        title: '现场',
        menu: [
          {
            title: '统一门户',
            field: 'url',
            url: '',
            type: 'newWindow',
          },
        ],
      },
      {
        title: '云平台',
        menu: [
          {
            title: '统一门户',
            field: 'url',
            url: 'http://',
            type: 'newWindow',
          },
          {
            title: '信息平台',
            field: 'url',
            url: 'http://',
            type: 'newWindow',
          },
        ],
      },
    ],
  },
  generalFunc: 'groupCompanyContextmenuItems',
} as const;   // 使用 as const 让 TypeScript 推断最严格的字面量类型
```



### 矿井数据
```typescript
// ====================== 类型定义 ======================

/** 单个矿井（煤矿）数据项 */
interface MineItem {
  MineName: string;
  name: string;                    // 通常与 MineName 相同
  MineDesc: string;                // 简称/编码，如 "YJHSWMK"
  ProvinceID: string;              // 省份
  B: number;                       // 纬度 (Latitude)
  L: number;                       // 经度 (Longitude)
  x: number;                       // 投影坐标 X (可能是高斯-克吕格或其它投影)
  y: number;                       // 投影坐标 Y
  z: number;                       // 海拔高度 (米)
  isonline: 0 | 1;                 // 是否在线
  color: 'GREEN' | 'RED' | 'GRAY' | string;  // 状态颜色
  icon: 'onlineMine' | 'offlineMine' | string;
  isalarm: 0 | 1;                  // 是否有报警
  httpurl: string;                 // 公网/HTTP 访问地址（可能为空）
  vpnurl: string;                  // VPN 内网地址
  // 以下为带冒号的中文键（建议未来规范化，但保留原样）
  '所属城市:': string;
  '项目名称:': string;
  '编号:': string;
  '连接方式:': string;
  'VPN地址:': string;
  '网站加密:': string;
  '公网地址:': string;
  '注册时间:': string;
  '响应时间:': string;
  '在线时间:': string;
  // 表格列配置
  columns: Array<{
    title: string;
    dataIndex: string;             // 对应上面的带冒号键 或 "z"
  }>;
}

/** 右键菜单项（context menu） */
interface ContextMenuItem {
  text: string;                    // 显示文本，如 "综合管控平台"
  methodName: 'onClick' | string;
  type: 'newWindow' | string;
  field: 'httpurl' | 'vpnurl' | string;  // 指向 MineItem 中的哪个字段作为 URL
}

/** params 核心参数 */
interface MineMapParams {
  data: MineItem[];                // 矿井列表（当前示例只有1条）
  contextmenuItems: ContextMenuItem[];
  total: string;                   // HTML 格式的统计描述
  online: number;
  zoom: number;                    // 默认地图缩放级别
  maxZoom: number;
  minZoom: number;
}

/** 完整配置对象 */
interface MineConfig {
  params: MineMapParams;
  generalFunc: 'groupCompanyLevelMine';  // 字面量，可能是地图初始化/渲染函数
}

// ====================== 数据常量（已修复转义） ======================

export const groupCompanyMineConfig: MineConfig = {
  params: {
    data: [
      {
        MineName: '窑街海石湾煤矿',
        name: '窑街海石湾煤矿',
        MineDesc: 'YJHSWMK',
        ProvinceID: '甘肃省',
        B: 36.3751522,
        L: 102.8939847,
        x: 34580222.4372,
        y: 4027541.6824,
        z: 1982,
        isonline: 1,
        color: 'GREEN',
        icon: 'onlineMine',
        isalarm: 0,
        httpurl: '',
        vpnurl: 'http://192.163.32.213:3200',
        '所属城市:': '甘肃省-兰州市-红古区',
        '项目名称:': '窑街海石湾煤矿-YJHSWMK',
        '编号:': 'E02',
        '连接方式:': 'ovpn',
        'VPN地址:': '192.163.32.213',
        '网站加密:': 'HTTP',
        '公网地址:': '117.157.76.13',
        '注册时间:': '2022-05-23 01:35:26',
        '响应时间:': '2026-03-12 17:05:13',
        '在线时间:': '11h34m',
        columns: [
          { title: '所属城市:', dataIndex: '所属城市:' },
          { title: '项目名称:', dataIndex: '项目名称:' },
          { title: '编号:', dataIndex: '编号:' },
          { title: '连接方式:', dataIndex: '连接方式:' },
          { title: 'VPN地址:', dataIndex: 'VPN地址:' },
          { title: '网站加密:', dataIndex: '网站加密:' },
          { title: '公网地址:', dataIndex: '公网地址:' },
          { title: '注册时间:', dataIndex: '注册时间:' },
          { title: '响应时间:', dataIndex: '响应时间:' },
          { title: '在线时间:', dataIndex: '在线时间:' },
          { title: '海拔:', dataIndex: 'z' },
        ],
      },
    ],
    contextmenuItems: [
      {
        text: '综合管控平台',
        methodName: 'onClick',
        type: 'newWindow',
        field: 'httpurl',
      },
      {
        text: 'NATOS',
        methodName: 'onClick',
        type: 'newWindow',
        field: 'vpnurl',
      },
    ],
    total: '仅显示设置为监控或者在线的项目,总数:<span style="font-weight:bold;">1</span>,在线数:<span style="font-weight:bold;">1</span>,在线无坐标数:<span style="font-weight:bold;">0</span>',
    online: 1,
    zoom: 5,
    maxZoom: 18,
    minZoom: 4,
  },
  generalFunc: 'groupCompanyLevelMine',
} as const;
```



### 右键菜单绑定方法
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

/**
 * 处理点击事件，根据类型打开窗口
 * @param e - 事件对象
 */
function onClick(e: ClickEvent): void {
  const { field, type } = e;
  if (!e[field]) {
    console.warn(`字段 ${field} 不存在或为空`);
    return;
  }

  const url = e[field] as string;
  switchWindow(type, url);
}

/**
 * 根据类型切换窗口
 * @param type - 窗口类型
 * @param url - 要打开的URL
 */
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
