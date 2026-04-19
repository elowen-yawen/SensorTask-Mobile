<template>
  <view class="page safe-area-bottom">
    <view class="header">
    </view>

    <view class="group">
      <text class="group-title">传感器数据</text>
      <navigator class="nav-item" url="/pages/index/index"
        >传感器实时数据</navigator
      >
      <navigator class="nav-item" url="/pages/historyInfo/historyInfo"
        >传感器历史数据</navigator
      >
    </view>
	
	<view class="group">
	  <text class="group-title">行为数据</text>
	  <navigator class="nav-item" url="/pages/behaviorRealTime/behaviorRealTime"
	    >行为实时数据</navigator
	  >
	  <navigator class="nav-item" url="/pages/behaviorInfo/behaviorInfo"
	    >行为历史数据</navigator
	  >
	  
	</view>

    <view class="group">
      <text class="group-title">设备数据</text>
      <navigator class="nav-item" url="/pages/deviceInfo/deviceInfo"
        >设备管理中心</navigator
      >
      <navigator class="nav-item" url="/pages/directPage/directPage"
        >指令配置中心</navigator
      >
    </view>
	<view class="group">
		<text class="group-title">故障管理</text>
		<navigator class="nav-item" url="/pages/errHistory/errHistory"
		  >故障历史记录</navigator
		>
	</view>
  </view>
  
</template>

<script setup>
const list = [
  { 创立时间: '2024-01-01 10:00', 温度: '23℃', 湿度: '50%' },
  { 创立时间: '2024-01-01 11:00', 温度: '25℃', 湿度: '55%' },
  { 创立时间: '2024-01-01 12:00', 温度: '28℃', 湿度: '60%' }
]

</script>
<style>
.page {
  min-height: 100vh;
  background: #f5f8ff;
  padding: 24rpx;
  box-sizing: border-box;
}

.header {
  margin-bottom: 20rpx;
}

.title {
  display: block;
  font-size: 38rpx;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #6b7280;
}

.group {
  background: #ffffff;
  border: 2rpx solid #dbeafe;
  border-radius: 20rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 20rpx;
}

.group-title {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 12rpx;
}

.nav-item {
  display: block;
  padding: 18rpx 16rpx;
  border-radius: 14rpx;
  background: #f8fbff;
  border: 2rpx solid #dbeafe;
  color: #2563eb;
  font-size: 28rpx;
  margin-bottom: 12rpx;
}

.nav-item:last-child {
  margin-bottom: 0;
}
</style>
