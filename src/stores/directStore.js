import { defineStore } from "pinia"
import { ref } from "vue"
import { get, post } from "../utils/request"

export const directStore = defineStore("directStore", () => {
  const data = ref([])
  const renderData = ref([])

  const fetchDirectData = async () => {
    try {
      const res = await get("http://localhost:3000/directData")
      if (res.data.success) {
        data.value = res.data.data
      }
    } catch (err) {
      console.error("[Store] fetchDirectData 结构数据加载失败:", err)
    }
  }

  const handleRender = async (d_no = "null") => {
    try {
      const response = await get("http://localhost:3000/directRender", {
        data: { d_no },
      })

      if (response.data.success) {
        renderData.value = response.data.data || []
        return response.data.data || []
      }
      return []
    } catch (err) {
      console.error("[Store] handleRender 渲染数据请求失败:", err)
      return []
    }
  }

  const handleUpdateData = async ({ id, value, d_no = "null" }) => {
    try {
      const payload = {
        config_id: id,
        value,
        d_no,
      }
      const response = await post("http://localhost:3000/directData/update", payload)
      return response
    } catch (err) {
      console.error("[Store] handleUpdateData 更新失败:", err)
      throw err
    }
  }

  return { data, renderData, fetchDirectData, handleUpdateData, handleRender }
})
