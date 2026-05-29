<template>
  <view class="page safe-area-bottom">
    <view class="header">
      <text class="title">设备管理中心</text>
      <navigator class="jump-link" url="/pages/nav/nav">返回上一级</navigator>
    </view>

    <view class="filter-card">
      <view class="filter-row">
        <text class="label">关键字</text>
        <input
          class="input"
          v-model="keyword"
          placeholder="输入电车编号id或者设备名称"
          confirm-type="search"
          @confirm="handleSearch"
        />
      </view>

      <view class="action-row">
        <button
          class="btn"
          type="primary"
          size="mini"
          @click="handleSearch"
          :disabled="store.loading"
        >
          查询
        </button>
        <button class="btn" type="default" size="mini" @click="openAdd">
          新增设备
        </button>
      </view>
    </view>

    <view class="state" v-if="store.loading">
      <text>加载中...</text>
    </view>
    <view class="state" v-else-if="!deviceList.length">
      <text>暂无数据</text>
    </view>

    <scroll-view class="list" scroll-y="true" v-else>
      <view class="data-card" v-for="(item, index) in deviceList" :key="index">
        <view class="row" v-for="[key, value] in visibleEntries(item, visibility)" :key="key">
          <text class="key">{{ key }}：</text>
          <text class="value">{{ renderText(value) }}</text>
        </view>

        <view class="card-actions">
          <button class="card-btn" size="mini" @click="openEdit(item)">
            修改
          </button>
          <button
            class="card-btn danger"
            size="mini"
            @click="confirmDelete(item)"
          >
            删除
          </button>
        </view>
      </view>
    </scroll-view>

    <view class="pagination">
      <button
        class="page-btn"
        size="mini"
        :disabled="currentPage <= 1 || store.loading"
        @click="prevPage"
      >
        上一页
      </button>
      <text class="page-text">第 {{ currentPage }} 页</text>
      <button
        class="page-btn"
        size="mini"
        :disabled="!hasNextPage || store.loading"
        @click="nextPage"
      >
        下一页
      </button>
    </view>

    <view
      class="modal-mask"
      v-if="showAdd || showEdit"
      @click="closeModal"
    ></view>

    <view class="modal" v-if="showAdd || showEdit">
      <view class="modal-header">
        <text class="modal-title">{{ showAdd ? "新增设备" : "修改设备" }}</text>
        <text class="close" @click="closeModal">×</text>
      </view>

      <view class="form-row" v-for="label in visibleLabels" :key="label">
        <text class="form-label">{{ label }}</text>
        <input
          class="form-input"
          v-model="activeForm[label]"
          :disabled="label === 'id' && showEdit"
        />
      </view>

      <view class="modal-actions">
        <button class="btn" size="mini" @click="closeModal">取消</button>
        <button class="btn" type="primary" size="mini" @click="submitForm">
          提交
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from "vue"
import { onLoad, onPullDownRefresh } from "@dcloudio/uni-app"
import { deviceStore } from "../../stores/deviceStore"
import { displayStore } from "../../stores/displayStore"
import { shouldHideField, visibleEntries } from "../../utils/fieldVisibility"

const store = deviceStore()
const visibility = displayStore()

const labels = ["id", "设备名称", "电车编号id", "备注"]
const visibleLabels = computed(() => labels.filter((label) => !shouldHideField(label, visibility)))
const hideDeviceSelector = computed(() => shouldHideField("电车编号id", visibility))
const keyword = ref("")
const currentPage = ref(1)
const pageSize = ref(5)

const showAdd = ref(false)
const showEdit = ref(false)
const formData = ref({})
const editData = ref({})
const oldId = ref(null)

const activeForm = computed(() =>
  showEdit.value ? editData.value : formData.value,
)

const deviceList = computed(() => {
  return Array.isArray(store.deviceData) ? store.deviceData : []
})

const hasNextPage = computed(() => {
  return deviceList.value.length >= pageSize.value
})

const initForm = (target) => {
  labels.forEach((label) => {
    target[label] = ""
  })
}

const buildParams = (page = 1) => {
  return {
    currentPage: page,
    pageSize: pageSize.value,
    input: keyword.value,
    searchMode: visibility.hideNumber ? "deviceName" : "all",
  }
}

const fetchList = async (page = 1) => {
  currentPage.value = page
  await store.fetchDeviceData(buildParams(page))
}

const handleSearch = async () => {
  await fetchList(1)
}

const prevPage = async () => {
  if (currentPage.value <= 1) return
  await fetchList(currentPage.value - 1)
}

const nextPage = async () => {
  if (!hasNextPage.value) return
  await fetchList(currentPage.value + 1)
}

const openAdd = () => {
  showEdit.value = false
  showAdd.value = true
  initForm(formData.value)
}

const openEdit = (item) => {
  showAdd.value = false
  showEdit.value = true
  editData.value = { ...item, id: Number(item.id) }
  oldId.value = Number(item.id)
}

const closeModal = () => {
  showAdd.value = false
  showEdit.value = false
}

const validateForm = (form) => {
  if (!form.id || Number.isNaN(Number(form.id))) {
    uni.showToast({ title: "id不能为空且必须为数字", icon: "none" })
    return false
  }
  if (!form["设备名称"]) {
    uni.showToast({ title: "设备名称不能为空", icon: "none" })
    return false
  }
  if (!form["电车编号id"]) {
    uni.showToast({ title: "电车编号id不能为空", icon: "none" })
    return false
  }

  const conflict = store.deviceData.some(
    (item) =>
      Number(item.id) === Number(form.id) &&
      Number(form.id) !== Number(oldId.value),
  )
  if (conflict) {
    uni.showToast({ title: "id已存在", icon: "none" })
    return false
  }

  return true
}

const submitForm = async () => {
  const form = activeForm.value
  if (!validateForm(form)) return

  if (showAdd.value) {
    const payload = {
      ...form,
      id: Number(form.id),
      创立时间: new Date().toLocaleString("zh-CN", { hour12: false }),
    }
    const res = await store.handleAdd(payload)
    if (res.data?.success) {
      uni.showToast({ title: "添加成功", icon: "success" })
      closeModal()
      await fetchList(currentPage.value)
    } else {
      uni.showToast({ title: res.data?.message || "添加失败", icon: "none" })
    }
    return
  }

  const updatePayload = {
    ...form,
    oldId: oldId.value,
    id: Number(form.id),
    备注: form["备注"] ?? null,
    设备名称: form["设备名称"] ?? "",
    电车编号id: form["电车编号id"] ?? "",
  }
  const res = await store.handleUpdate(updatePayload)
  if (res.data?.success) {
    uni.showToast({ title: "修改成功", icon: "success" })
    closeModal()
    await fetchList(currentPage.value)
  } else {
    uni.showToast({ title: res.data?.message || "修改失败", icon: "none" })
  }
}

const confirmDelete = async (item) => {
  const confirm = await new Promise((resolve) => {
    uni.showModal({
      title: "确认删除",
      content: "你真的要删除吗？",
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    })
  })

  if (!confirm) return

  const res = await store.handleDelete(Number(item.id))
  if (res.data?.success) {
    uni.showToast({ title: "删除成功", icon: "success" })
    await fetchList(currentPage.value)
  } else {
    uni.showToast({ title: res.data?.message || "删除失败", icon: "none" })
  }
}

const renderText = (val) => {
  if (val === null || val === undefined) return ""
  return String(val)
}

onLoad(async () => {
  initForm(formData.value)
  await fetchList(1)
})

onPullDownRefresh(async () => {
  await fetchList(currentPage.value)
  uni.stopPullDownRefresh()
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

.jump-link {
  font-size: 24rpx;
  color: #2563eb;
  background: #eaf2ff;
  border: 2rpx solid #bfdbfe;
  border-radius: 12rpx;
  padding: 10rpx 16rpx;
  line-height: 1;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1f2937;
}

.filter-card {
  background: #ffffff;
  border-radius: 20rpx;
  border: 2rpx solid #dbeafe;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.filter-row {
  margin-bottom: 16rpx;
}

.label {
  display: block;
  font-size: 26rpx;
  color: #4b5563;
  margin-bottom: 10rpx;
}

.input,
.form-input {
  height: 76rpx;
  background: #ffffff;
  border: 2rpx solid #dbeafe;
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #1f2937;
}

.action-row,
.modal-actions {
  display: flex;
  gap: 20rpx;
}

.btn {
  margin: 0;
  flex: 1;
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
  max-height: calc(100vh - 500rpx);
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

.card-actions {
  margin-top: 16rpx;
  display: flex;
  gap: 16rpx;
}

.card-btn {
  margin: 0;
  flex: 1;
}

.card-btn.danger {
  color: #ef4444;
}

.pagination {
  margin-top: 14rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-btn {
  margin: 0;
  width: 180rpx;
}

.page-text {
  font-size: 26rpx;
  color: #4b5563;
}

.modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
}

.modal {
  position: fixed;
  left: 40rpx;
  right: 40rpx;
  top: 180rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  z-index: 1000;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
}

.close {
  font-size: 44rpx;
  line-height: 1;
  color: #9ca3af;
}

.form-row {
  margin-bottom: 14rpx;
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #4b5563;
  margin-bottom: 8rpx;
}
</style>
