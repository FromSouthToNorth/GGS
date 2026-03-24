# Turf地理空间分析工具

## 概述

Turf.js是一个用JavaScript编写的模块化地理空间分析引擎，本项目使用@turf/turf进行边界计算、要素转换等操作。

## 核心文件

| 文件                      | 说明         |
| ------------------------- | ------------ |
| `src/utils/turf/index.ts` | Turf工具封装 |

## 源码 (`src/utils/turf/index.ts`)

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

## 功能说明

### 1. turfBbox - 计算边界框

计算GeoJSON对象的边界框，返回包含最小和最大经纬度的数组。

**参数：**
- `items`: GeoJSON对象（可以是Point、Polygon、FeatureCollection等）

**返回值：**
- `[minX, minY, maxX, maxY]` - 边界框坐标数组

**使用示例：**
```typescript
import { turfBbox } from '@/utils/turf';

// 计算矿井数据的边界框
const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [102.8939847, 36.3751522]
      },
      properties: { name: '矿井1' }
    }
  ]
};

const bbox = turfBbox(geojson);
// bbox: [102.8939847, 36.3751522, 102.8939847, 36.3751522]
```

### 2. turfFeatureCollection - 创建要素集合

将数组或对象转换为GeoJSON FeatureCollection格式。

**参数：**
- `items`: 要素数组或对象

**返回值：**
- `FeatureCollection` - GeoJSON要素集合

**使用示例：**
```typescript
import { turfFeatureCollection } from '@/utils/turf';

// 从矿井数据创建FeatureCollection
const mineData = [
  { coordinates: [102.8939847, 36.3751522], name: '矿井1' },
  { coordinates: [103.1234567, 36.4567890], name: '矿井2' }
];

const featureCollection = turfFeatureCollection(mineData);
// 自动将坐标数组转换为Point要素
```

## 与Cesium集成

在Cesium模块中使用Turf进行边界计算：

```typescript
import { turfBbox } from '@/utils/turf';
import { Rectangle } from 'cesium';

// 飞行到矿井区域
export function clusteringZoom(dataSource: any[]): void {
  const geojson = entitiesToGeoJSON(dataSource);
  const bbox = turfBbox(geojson);
  
  const padding = 0.2;
  const destination = Rectangle.fromDegrees(
    bbox[0] - padding,
    bbox[1] - padding,
    bbox[2] + padding,
    bbox[3] + padding
  );
  
  flyTo(destination);
}
```

## 相关文档

- [Cesium模块](./CESIUM.md) - 地图功能详细文档
- [架构文档](./ARCHITECTURE.md) - 整体架构说明
