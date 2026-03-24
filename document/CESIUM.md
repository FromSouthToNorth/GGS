# Cesium地图模块

## 概述

Cesium地图模块负责矿井地理位置的可视化展示，包括地图初始化、矿井图标渲染、聚类功能、点击事件处理等功能。

## 核心文件

| 文件             | 说明               |
| ---------------- | ------------------ |
| `index.ts`       | Cesium初始化和销毁 |
| `on.ts`          | 左右键点击事件处理 |
| `clustering.ts`  | 聚类功能实现       |
| `render.ts`      | GeoJSON数据渲染    |
| `labelConfig.ts` | 标签样式配置系统   |
| `icon.ts`        | 图标标记处理       |
| `constants.ts`   | 聚类常量配置       |
| `helpers.ts`     | 辅助函数           |
| `geojson.ts`     | GeoJSON转换工具    |

## 1. Cesium初始化 (`src/utils/cesium/index.ts`)

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

export function destroyCesium() {
  const viewer = toRaw(unref(viewerRef));

  if (!viewer) return;

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

### 配置说明

| 配置项       | 环境变量                     | 说明               |
| ------------ | ---------------------------- | ------------------ |
| ION_TOKEN    | VITE_CESIUM_ION_TOKEN        | Cesium Ion访问令牌 |
| MAP_TILE_KEY | VITE_MAP_TILE_KEY            | 地图瓦片访问令牌   |
| 瓦片URL      | /BwMap/tiles/{z}/{x}/{y}.png | 地图瓦片服务地址   |

## 2. 点击事件 (`src/utils/cesium/on.ts`)

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

## 3. 聚类配置 (`src/utils/cesium/constants.ts`)

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

### 聚类配置说明

| 配置项               | 说明             | 可选值     |
| -------------------- | ---------------- | ---------- |
| PIXEL_RANGE          | 聚类像素范围     | 数字       |
| MINIMUM_CLUSTER_SIZE | 最小聚类数量     | 数字       |
| ENABLED              | 是否启用聚类     | true/false |
| COUNT_THRESHOLDS     | 数量阈值颜色配置 | 数组       |
| PIN_SIZES            | 图钉尺寸         | [大, 小]   |

## 4. 聚类功能 (`src/utils/cesium/clustering.ts`)

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

## 5. 标签配置 (`src/utils/cesium/labelConfig.ts`)

```typescript
// src/utils/cesium/labelConfig.ts
import {
  NearFarScalar,
  DistanceDisplayCondition,
  Cartesian2,
  LabelStyle,
  Color as CesiumColor,
} from 'cesium';

export const LABEL_PRESETS = {
  MINE_POINT: 'minePoint',
  NORMAL: 'normal',
  DEPTH: 'depth',
  WATER: 'water',
  SMALL: 'small',
  LARGE: 'large',
} as const;

export type LabelPresetType = typeof LABEL_PRESETS[keyof typeof LABEL_PRESETS];

export const ICON_CONFIG = {
  DEFAULT_URL: '/src/assets/markerIcon/ICON.svg',
  DEFAULT_SIZE: 36,
  DEFAULT_COLOR: 'WHITE',
  DEFAULT_NAME: '',
  LABEL_OFFSET: new Cartesian2(0, -56),
  BACKGROUND_PADDING: new Cartesian2(8, 6),
} as const;

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

const PRESET_GENERATORS = {
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

  createNoDistanceControl(): Record<string, never> {
    return {};
  },
};

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

function isValidLabelType(type: string): type is LabelPresetType {
  return Object.values(LABEL_PRESETS).includes(type as LabelPresetType);
}

function isValidCustomConfig(config: unknown): config is Record<string, any> {
  return config !== null && typeof config === 'object' && !Array.isArray(config);
}

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

export function getAvailableLabelTypes(): LabelPresetType[] {
  return Object.values(LABEL_PRESETS);
}

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

### 标签预设类型

| 类型       | 说明                 | 距离控制     |
| ---------- | -------------------- | ------------ |
| MINE_POINT | 矿井点标签，始终可见 | 无           |
| NORMAL     | 普通标签             | 有           |
| DEPTH      | 深度标签             | 有，更远隐藏 |
| WATER      | 水域标签             | 有           |
| SMALL      | 小尺寸标签           | 有           |
| LARGE      | 大尺寸标签           | 有           |

## 6. 图标处理 (`src/utils/cesium/icon.ts`)

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

function getMarkerIcon(key: string): string {
  return ICON_URL.replace('ICON', key);
}

function validateColor(color) {
  if (!color || !CesiumColor[color]) {
    console.warn(`Invalid color: ${color}, using default color: ${DEFAULT_COLOR}`);
    return CesiumColor[DEFAULT_COLOR];
  }
  return CesiumColor[color];
}

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

export function buildLabel(name: string | null | undefined, key: string): Record<string, any> {
  if (typeof name !== 'string' && name != null) {
    throw new TypeError('name must be a string or null/undefined');
  }
  if (typeof key !== 'string') {
    throw new TypeError('key must be a string');
  }

  const baseConfig = {
    text: name || DEFAULT_NAME,
  };

  if (key === 'MinePoint') {
    return {
      ...baseConfig,
      ...getLabelConfig(LABEL_PRESETS.MINE_POINT),
    };
  }

  return {
    ...baseConfig,
    ...getLabelConfig(LABEL_PRESETS.NORMAL),
  };
}
```

## 7. 数据渲染 (`src/utils/cesium/render.ts`)

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

## 8. Cesium Hook (`src/hooks/cesium/useCesium.ts`)

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

## 9. Cesium active entity (`src/hooks/cesium/useActiveEntity.ts`)
```typescript
// src/hooks/cesium/useActiveEntity.ts
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


## 10. Helper函数 (`src/utils/cesium/helpers.ts`)

```typescript
// src/utils/cesium/helpers.ts
import { toRaw, unref } from 'vue';
import type { Viewer } from 'cesium';
import { useCesium } from '@/hooks/cesium/useCesium';

export function getViewer(): Viewer | null {
  const { viewerRef } = useCesium();
  return toRaw(unref(viewerRef));
}
```

## 11. GeoJSON工具 (`src/utils/cesium/geojson.ts`)

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

## 相关文档

- [架构文档](./ARCHITECTURE.md) - 整体架构说明
- [MQTT模块](./MQTT.md) - 消息通信详细文档
- [组件文档](./COMPONENTS.md) - UI组件说明
