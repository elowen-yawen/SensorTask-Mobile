import { defineStore } from "pinia"
import { ref } from "vue"

const STORAGE_KEY = "fieldVisibilitySettings"

const loadSettings = () => {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    return saved && typeof saved === "object" ? saved : {}
  } catch (error) {
    return {}
  }
}

export const displayStore = defineStore("displayStore", () => {
  const saved = loadSettings()
  const hideId = ref(!!saved.hideId)
  const hideNumber = ref(!!saved.hideNumber)

  const persist = () => {
    try {
      uni.setStorageSync(STORAGE_KEY, {
        hideId: hideId.value,
        hideNumber: hideNumber.value,
      })
    } catch (error) {
      console.error("保存显示设置失败:", error)
    }
  }

  const toggleHideId = () => {
    hideId.value = !hideId.value
    persist()
  }

  const toggleHideNumber = () => {
    hideNumber.value = !hideNumber.value
    persist()
  }

  return {
    hideId,
    hideNumber,
    toggleHideId,
    toggleHideNumber,
  }
})
