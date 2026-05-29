import { defineStore } from "pinia"
import { ref } from "vue"
import { get, post } from "../utils/request"

export const deviceStore = defineStore("deviceStore", () => {
  const deviceData = ref([])
  const loading = ref(false)
  const total = ref(5)
  const ids = ref([])

  const fetchDeviceData = async (params = {}) => {
    loading.value = true
    try {
      const response = await get("http://localhost:3000/deviceData", {
        data: {
          currentPage: params.currentPage || 1,
          pageSize: params.pageSize || 5,
          input: params.input || "",
          searchMode: params.searchMode || "all",
        },
      })

      if (response.data.success) {
        const fullList = Array.isArray(response.data.data.list)
          ? response.data.data.list
          : []
        ids.value = []
        const rawIds = []

        fullList.forEach((item) => {
          rawIds.push(item["电车编号id"])
          if (item["创建时间"]) {
            try {
              item["创建时间"] = new Date(item["创建时间"]).toLocaleString(
                "zh-CN",
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                },
              )
            } catch (e) {
              console.error("日期格式化错误:", e)
            }
          }
        })

        ids.value = [...new Set(rawIds)]
        deviceData.value = fullList
      }
    } finally {
      loading.value = false
    }
  }

  const handleDelete = async (id) => {
    return await post("http://localhost:3000/deviceData/delete", { id })
  }

  const handleAdd = async (item) => {
    return await post("http://localhost:3000/deviceData/add", item)
  }

  const handleUpdate = async (item) => {
    return await post("http://localhost:3000/deviceData/update", item)
  }

  return {
    deviceData,
    fetchDeviceData,
    total,
    loading,
    handleDelete,
    handleAdd,
    handleUpdate,
    ids,
  }
})
