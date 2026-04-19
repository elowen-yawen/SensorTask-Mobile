<template>
  <view class="chart-wrapper">
    <view id="myLineChart" class="chart-container"></view>
  </view>
</template>

<script setup>
import { onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: { type: Array, default: () => [] },
  pageSize: { type: Number, default: 5 }
})

let mychart = null


const updateChart = (source) => {
  if (!mychart) return
  try {
    const json = source?.slice(0, props.pageSize) || []
    if (json.length === 0) {
      mychart.clear()
      return
    }

    const times = json.map(item => {
      let rawTime = item['创立时间'] || item['采集时间'];
      if (rawTime) {
        let formattedTime = rawTime.replace('T', ' ').replace(/\..+/, '').replace('Z', '');
        formattedTime = formattedTime.replace(/-/g, '/');
        
        const date = new Date(formattedTime);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('zh-CN', {
			year:'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
      }
      return '未知';
    });

    const elemKeys = Object.keys(json[0])
    const exclude = ['id', '设备编号', '数据类型', '创立时间', '采集时间']
    const fields = elemKeys.filter(k => !exclude.includes(k))

    const series = fields.map(field => ({
      name: field,
      type: 'line',
      smooth: true,
      data: json.map(item => {
        const raw = item[field]
        if (raw === undefined || raw === null) return 0
        // 正则提取数字，如 "12 ℃" -> 12
        const num = parseFloat(raw.toString().replace(/[^\d.-]/g, ''))
        return isNaN(num) ? 0 : num
      })
    }))

    mychart.setOption({
      tooltip: {
        show: true,
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        backgroundColor: 'rgba(50, 50, 50, 0.7)',
        borderColor: '#333',
        borderWidth: 1,
        padding: 10,
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        confine: true
      },
      legend: { data: fields, bottom:'-10px',left:'center' },
      grid: { 
        left: '3%', 
        right: '5%', 
        bottom: '15%', 
        top: '18%', 
        containLabel: true 
      },
	 toolbox: {
	     show: true, 
	     orient: 'horizontal', 
	     itemSize: 15,
	     itemGap: 10, 
	     right: '5%', 
	     top: '0',    
	     feature: {
	         magicType: { 
	             show: true, 
	             type: ['line', 'bar'] 
	         },
	         restore: { show: true }, // 重置
	         dataView: { show: true, readOnly: false }, // 数据视图
	         saveAsImage: { show: true }, // ✅ 建议加上这个，测试点击是否有反应
	     }
	 },
      xAxis: {
        type: 'category',
        data: times,
        axisLabel: { rotate: 25, fontSize: 10, interval: 0 }
      },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      series
    }, true)
  } catch (err) {
    console.error('图表更新失败:', err)
  }
}

const initChart = () => {
  echarts.env.touchEventsSupported = true
  echarts.env.wxa = false
  echarts.env.svgSupported = true
  echarts.env.canvasSupported = true
  echarts.env.domSupported = true

  const chartDom = document.getElementById('myLineChart')
  if (!chartDom) return

  if (mychart) {
    mychart.dispose()
  }

  mychart = echarts.init(chartDom)
  
  window.addEventListener('resize', () => mychart?.resize())
  
  updateChart(props.data)
}

watch(() => [props.data, props.pageSize], () => {
  updateChart(props.data)
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    setTimeout(initChart, 100)
  })
})

onBeforeUnmount(() => {
  if (mychart) {
    mychart.dispose()
    mychart = null
  }
})
</script>

<style scoped>
.chart-wrapper {
  width: 100%;
  padding: 20rpx;
  box-sizing: border-box;
}

.chart-container {
  width: 100%;
  height: 550rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}
</style>