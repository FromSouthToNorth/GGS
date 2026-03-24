# 组件文档

## 概述

本文档描述系统中的UI组件结构和功能。

## 组件结构

```
src/components/
├── Application/          # 应用初始化组件
│   └── index.vue        # MQTT初始化
├── Loading/             # 加载组件
│   ├── index.ts
│   └── src/
│       ├── Loading.vue
│       ├── createLoading.ts
│       └── useLoading.ts
└── MinesMap/            # 矿井地图组件
    └── src/
        ├── Map.vue      # Cesium地图容器
        └── Sidebar.vue  # 左侧筛选面板
```

## 1. 应用初始化组件

### Application/index.vue
```vue
// src/components/Application/index.vue
<script lang="ts">
import { contextInit } from '@/utils/mqtt'
export default {
  name: 'AppProvider',
  inheritAttrs: false,
  setup(_props, { slots }) {
    contextInit();
    return () => slots.default?.()
  },
}
</script>
```

## 2. 加载组件

### Loading.vue
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

### createLoading.ts
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
  let vm: ReturnType<typeof createVNode> | null = null;
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

  let container: HTMLElement | null = null;
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

### useLoading.ts
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

### loading指令
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

## 3. 矿井地图组件

### MinesMap/index.vue
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

### Map.vue
```vue
// src/components/MinesMap/src/Map.vue
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
    <div class="right-bottom">
      <div class="" v-html="totalHtml" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 矿井地图组件
 * 使用 Cesium 展示矿井位置，提供搜索和交互功能
 */
import { onMounted, onUnmounted, ref, toRaw, unref, watch } from 'vue'
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

const totalHtml = ref<string>('');

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
  const viewer = getViewer()
  viewer?.camera.moveEnd.addEventListener(() => {
    clearPopup();
  })
})

// 监听矿井数据变化
watch(() => unref(getGroupCompanyLevelMine), (newVal) => {
  if (!newVal) return

  const { data, total } = newVal

  totalHtml.value = total

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

  .right-bottom {
    font-size: 12px;
    position: absolute;
    z-index: 999;
    right: 32px;
    bottom: 2px;
    padding: 6px;
    border-radius: 4px;
    background: #fff;

    .online {
      color: #0F9E5E;
      font-weight: 600;
    }
  }

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

### Sidebar.vue
```vue
// src/components/MinesMap/src/Sidebar.vue
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
            :row-key="commonItemsStatPen.key" :data-source="item.dataSource" :customRow="rowOn" :pagination="paging"
            @change="handleTableChange" />
        </Collapse.Panel>
      </Collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, unref, onMounted, watch } from 'vue';
import type { Ref } from 'vue';
import { Button, Tag, Collapse, Table } from 'ant-design-vue';
import type { TablePaginationConfig } from 'ant-design-vue';
import { RightOutlined, LeftOutlined } from '@ant-design/icons-vue';
import { groupCompanyLevelMine, commonItemsStat } from '@/utils/mqtt/publish';
import { useGroupCompanyLevelMine } from '@/hooks/mines/useGroupCompanyLevelMine';
import { isArray } from '@/utils/is';
import type { FilterCategory, ColumnConfig } from '@/types/filter';

interface TagItem {
  value: string;
  label: string;
  name?: string;
  id?: string | number;
}

interface Parameter {
  year: string;
  ol: string;
  pid: string;
  gid: string;
  iid: string;
  [key: string]: string;
}

const { getCommonItemsStat } = useGroupCompanyLevelMine();
const emit = defineEmits<{ (e: 'openClick', open: boolean): void }>();

const mapPane = ref<boolean>(false);
const selectTagArray = ref<TagItem[]>([]);
const commonItemsStatPen = ref<{
  data: FilterCategory[];
  key: string;
  columns: ColumnConfig[];
}>({
  data: [],
  key: 'Id',
  columns: [],
});
const paging = ref<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  pageSizeOptions: ['10', '20', '50', '200', '1000'],
  showTotal: (total: number, range: [number, number]) => {
    return `${range[0]}-${range[1]} 共${total}条`;
  },
  showQuickJumper: true,
  showSizeChanger: true,
  total: 0,
});

const TAGS: TagItem[] = [
  { value: 'year', label: '年份' },
  { value: 'ol', label: '是否在线' },
  { value: 'pid', label: '省份' },
  { value: 'gid', label: '集团' },
  { value: 'iid', label: '集成商' },
];

const parameter: Parameter = {
  year: '',
  ol: '',
  pid: '',
  gid: '',
  iid: '',
};
const tagMap = new Map<string, Array<{ id: string | number; name: string }>>();
const tagSet = new Set<TagItem>();

onMounted(() => {
  commonItemsStat(parameter);
});

watch(
  () => unref(getCommonItemsStat),
  (newVal) => {
    if (!newVal) return;
    commonItemsStatPen.value.data = newVal.data;
    commonItemsStatPen.value.columns = newVal.columns;
    commonItemsStatPen.value.key = newVal.key;
  }
);

function openClick(): void {
  mapPane.value = !mapPane.value;
  emit('openClick', mapPane.value);
}

function rowOn(record: { id: string | number; field: string; name: string }) {
  return {
    onClick: () => {
      const { id, field, name } = record;
      const values = tagMap.get(field);
      if (isArray(values) && !values.some((v) => v.id === id)) {
        values.push({ id, name });
      } else {
        tagMap.set(field, [{ id, name }]);
      }
      parameter[field] = String(id);
      const tag = TAGS.find((t) => t.value === field);
      if (tag) {
        tag.name = name;
        tag.id = id;
        tagSet.add(tag);
        selectTagArray.value = [...tagSet];
      }
      groupCompanyLevelMine(parameter);
    },
  };
}

function tagClose(tag: TagItem): void {
  parameter[tag.value] = '';
  tagSet.forEach((e) => {
    if (e.value === tag.value) {
      tagSet.delete(e);
    }
  });
  selectTagArray.value = [...tagSet];
  groupCompanyLevelMine(parameter);
}

function handleTableChange(
  pagination: TablePaginationConfig,
  _filters: Record<string, any>,
  tableSorter: Record<string, any>
): void {
  if (Object.keys(tableSorter).length > 0) {
    paging.value = pagination;
  }
}
</script>

<style lang="less">
.sidebar {
  height: 100%;
  position: fixed;
  z-index: 1000;
  padding-bottom: 60px;
  transition: all .45s;
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
  left: 12px
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

## 4. 右键菜单组件 (`src/components/Menu/index.vue`)

```vue
// src/components/Menu/index.vue
<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div
        v-if="visible"
        ref="menuRef"
        class="cesium-context-menu"
        :style="menuStyle"
        @click.stop
      >
        <template v-for="item in menuItems" :key="item.title">
          <div
            v-if="isDropdown(item)"
            class="menu-item dropdown"
            :class="{ disabled: item.disabled }"
            @mouseenter="showDropdown($event, item)"
            @mouseleave="hideDropdown"
          >
            <div class="menu-item-content">
              <span>{{ item.title }}</span>
              <span class="dropdown-arrow">▶</span>
            </div>
            <div class="menu-dropdown-content" :style="dropdownStyle">
              <button
                v-for="subItem in item.menu"
                :key="subItem.title"
                class="dropdown-item"
                :class="{ disabled: subItem.disabled }"
                :data-tooltip="subItem.url && subItem.url.length > 80 ? subItem.url.substring(0, 80) + '...' : subItem.url"
                @click="handleClick(subItem, $event)"
              >
                {{ subItem.title }}
              </button>
            </div>
          </div>
          <div
            v-else
            class="menu-item"
            :class="{ disabled: item.disabled }"
            :data-tooltip="item.url && item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url"
            @click="handleClick(item, $event)"
          >
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
  type ShallowRef
} from 'vue'
import {
  SceneTransforms,
  Matrix4,
  type Viewer,
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
    const pos = SceneTransforms.wtc(v.scene, props.position as any)
    if (!pos) {
      screenPosition.value = null
      return
    }

    screenPosition.value = { x: Math.round(pos.x), y: Math.round(pos.y) }

    if (v.scene) {
      lastViewMatrix.value = Matrix4.clone(v.scene.camera.viewMatrix)
    }
  } catch {
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

## 相关文档

- [架构文档](./ARCHITECTURE.md) - 整体架构说明
- [Cesium模块](./CESIUM.md) - 地图功能详细文档
- [MQTT模块](./MQTT.md) - 消息通信详细文档
- [API配置](./API.md) - 接口和环境配置
