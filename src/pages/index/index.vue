<template>
  <view class="page safe-area-bottom">
    <view class="header">
      <text class="header-title">传感器实时数据</text>
      <view class="header-actions">
        <navigator class="history-nav" url="/pages/nav/nav">
          返回上一级
        </navigator>
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

    <view class="empty" v-if="!loading && !filteredDataList.length">
      <text>暂无数据</text>
    </view>

    <view class="loading" v-if="loading">
      <text>加载中...</text>
    </view>

    <scroll-view class="list" scroll-y="true" v-if="filteredDataList.length">
      <view
        class="data-card"
        v-for="(item, idx) in filteredDataList"
        :key="idx"
      >
        <view class="item-row" v-for="[key, value] in visibleEntries(item, visibility)" :key="key">
          <text class="item-key">{{ key }}：</text>
          <text class="item-value">{{ formatValue(key, value) }}</text>
        </view>
      </view>
    </scroll-view>
	<view class="chart-section">
	  <LineBar :data="data" />
	</view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue"
import { onLoad, onPullDownRefresh } from "@dcloudio/uni-app"
import { sensorStore } from "../../stores/sensorStore"
import { displayStore } from "../../stores/displayStore"
import { shouldHideField, visibleEntries } from "../../utils/fieldVisibility"
import LineBar from '../../components/LineBar.vue'
const store = sensorStore()
const visibility = displayStore()
const loading = ref(false)
const selectedValue = ref("")
const hideDeviceSelector = computed(() => shouldHideField("设备编号ID", visibility))

const data=computed(()=>store.sensorData?.proccessData)
const sourceList = computed(() => {
  const val = store.sensorData?.proccessData
  return Array.isArray(val) ? val : []
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

const formatValue = (key, value) => {
  if (key === "创立时间" && value) {
    return new Date(value).toLocaleString("zh-CN", {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false   
    })
  }
  return String(value ?? "")
}

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
    await store.fetchData()
    initSelected()
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

const onPickChange = (event) => {
  const index = Number(event.detail.value || 0)
  const current = options.value[index]
  if (current) {
    selectedValue.value = current.value
  }
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
  background-color: #f5f8ff;
  padding: 24rpx;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.header-title {
  font-size: 36rpx;
  color: #1f2937;
  font-weight: 600;
}

.refresh-btn {
  margin: 0;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.history-nav {
  font-size: 24rpx;
  color: #2563eb;
  background: #eaf2ff;
  border: 2rpx solid #bfdbfe;
  border-radius: 12rpx;
  padding: 10rpx 16rpx;
  line-height: 1;
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

.list {
  max-height: calc(100vh - 260rpx);
}

.data-card {
  background: #ffffff;
  border: 2rpx solid #dbeafe;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
}

.item-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 2rpx dashed #edf2f7;
  padding: 14rpx 0;
}

.item-row:last-child {
  border-bottom: 0;
}

.item-key {
  color: #2563eb;
  font-size: 26rpx;
  margin-right: 20rpx;
}

.item-value {
  color: #374151;
  font-size: 26rpx;
  text-align: right;
  flex: 1;
}

.empty,
.loading {
  height: 240rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 28rpx;
}
.chart-section {
  width: 100%;
  min-height: 500rpx;
  display: block;
  clear: both;
}
</style>
