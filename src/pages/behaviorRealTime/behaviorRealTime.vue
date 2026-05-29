<template>
  <view class="page safe-area-bottom">
    <view class="header">
      <text class="title">行为实时数据</text>
      <view class="header-actions">
        <navigator class="jump-link" url="/pages/nav/nav">返回上一级</navigator>
        <button
          class="refresh-btn"
          type="primary"
          size="mini"
          @click="reloadData"
        >
          刷新
        </button>
      </view>
    </view>

    <view class="picker-row" v-if="options.length && !hideDeviceSelector">
      <text class="picker-label">设备编号</text>
      <picker
        class="picker"
        mode="selector"
        :range="options"
        range-key="label"
        :value="selectedIndex"
        @change="onPickChange"
      >
        <view class="picker-value">
          <text>{{ selectedLabel }}</text>
        </view>
      </picker>
    </view>

    <view class="state" v-if="loading">
      <text>加载中...</text>
    </view>
    <view class="state" v-else-if="!filteredDataList.length">
      <text>暂无行为数据</text>
    </view>

    <scroll-view class="list" scroll-y="true" v-else>
      <view
        class="data-card"
        v-for="(item, idx) in filteredDataList"
        :key="idx"
      >
        <view class="row" v-for="[key, value] in visibleEntries(item, visibility)" :key="key">
          <text class="key">{{ key }}：</text>
          <text class="value">{{ renderText(value) }}</text>
        </view>
      </view>
    </scroll-view>
	<view class="chart-section">
	    <LineBar :data="store.paginationData||[]"/>
	</view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue"
import { onLoad, onPullDownRefresh } from "@dcloudio/uni-app"
import { paginationStore } from "../../stores/paginationStore"
import { displayStore } from "../../stores/displayStore"
import { shouldHideField, visibleEntries } from "../../utils/fieldVisibility"
import LineBar from "../../components/LineBar.vue"
const store = paginationStore()
const visibility = displayStore()
const loading = ref(false)
const selectedValue = ref("")
const hideDeviceSelector = computed(() => shouldHideField("设备编号ID", visibility))

const sourceList = computed(() => {
  return Array.isArray(store.paginationData) ? store.paginationData : []
})

const options = computed(() => {
  if (!sourceList.value.length) return []
  const firstKey = Object.keys(sourceList.value[0])[0]
  return sourceList.value.map((item) => ({
    value: item[firstKey],
    label: String(item[firstKey]),
  }))
})

const selectedIndex = computed(() => {
  if (!options.value.length) return 0
  const index = options.value.findIndex(
    (item) => item.value === selectedValue.value,
  )
  return index >= 0 ? index : 0
})

const selectedLabel = computed(() => {
  if (!options.value.length) return "请选择"
  return options.value[selectedIndex.value]?.label || "请选择"
})

const filteredDataList = computed(() => {
  if (!sourceList.value.length) return []
  const firstKey = Object.keys(sourceList.value[0])[0]
  const selected = selectedValue.value || sourceList.value[0][firstKey]
  return sourceList.value.filter((item) => item[firstKey] === selected)
})

const initSelected = () => {
  if (!sourceList.value.length) {
    selectedValue.value = ""
    return
  }
  const firstKey = Object.keys(sourceList.value[0])[0]
  selectedValue.value = sourceList.value[0][firstKey]
}

const reloadData = async () => {
  loading.value = true
  try {
    await store.fetchPaginationData({
      type: "behavior",
      currentPage: 1,
      pageSize: 20,
    })
    initSelected()
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

const onPickChange = (event) => {
  const index = Number(event.detail.value || 0)
  const current = options.value[index]
  if (current) selectedValue.value = current.value
}

const renderText = (val) => {
  if (val === null || val === undefined) return ""
  return String(val)
}

onLoad(async () => {
  await reloadData()
})

onPullDownRefresh(async () => {
  await reloadData()
})
</script>

<style>
.page {
  min-height: 100vh;
  background: #f5f8ff;
  padding: 24rpx;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.jump-link {
  font-size: 24rpx;
  color: #2563eb;
  background: #eaf2ff;
  border: 2rpx solid #bfdbfe;
  border-radius: 12rpx;
  padding: 10rpx 16rpx;
  line-height: 1;
}

.refresh-btn {
  margin: 0;
  line-height: 1.6;
}

.picker-row {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  gap: 20rpx;
}

.picker-label {
  color: #4b5563;
  font-size: 28rpx;
}

.picker {
  flex: 1;
}

.picker-value {
  height: 76rpx;
  border-radius: 16rpx;
  background: #ffffff;
  border: 2rpx solid #dbeafe;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  color: #1f2937;
}

.state {
  height: 220rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #9ca3af;
  font-size: 28rpx;
}

.list {
  max-height: calc(100vh - 280rpx);
}

.data-card {
  background: #ffffff;
  border: 2rpx solid #dbeafe;
  border-radius: 20rpx;
  padding: 18rpx 22rpx;
  margin-bottom: 16rpx;
}

.row {
  display: flex;
  justify-content: space-between;
  border-bottom: 2rpx dashed #edf2f7;
  padding: 12rpx 0;
}

.row:last-child {
  border-bottom: 0;
}

.key {
  font-size: 26rpx;
  color: #2563eb;
  margin-right: 16rpx;
}

.value {
  flex: 1;
  text-align: right;
  font-size: 26rpx;
  color: #374151;
}
</style>
