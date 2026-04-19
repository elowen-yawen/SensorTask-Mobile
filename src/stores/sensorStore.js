import { defineStore } from "pinia"
import { ref } from "vue"
import { get } from "../utils/request"

export const sensorStore = defineStore("sensorStore", () => {
  const sensorData = ref({})

  const sensorValue = () => sensorData.value

  const fetchData = async () => {
    const response = await get("http://localhost:3000/data")

    console.log("接口数据:", response.data)

    sensorData.value = response.data  
  }

  return { sensorData, fetchData, sensorValue }
})