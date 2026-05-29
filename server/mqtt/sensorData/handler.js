const { saveSensorData } = require('./repository')

const SENSOR_TOPIC = 'sensor_data'

function parsePayload(payload) {
    try {
        return JSON.parse(payload.toString())
    } catch (err) {
        console.error('[SensorData] Failed to parse JSON:', err.message)
        return null
    }
}

async function handleMessage(topic, payload) {
    if (topic !== SENSOR_TOPIC) {
        return null
    }

    const info = parsePayload(payload)
    if (!info) {
        return null
    }

    info.c_time = new Date()

    console.log('[SensorData] Received message:', { topic, data: info })

    try {
        await saveSensorData(info)
        return info
    } catch (err) {
        console.error('[SensorData] Error processing message:', err.message)
        return null
    }
}

module.exports = {
    SENSOR_TOPIC,
    handleMessage,
    parsePayload
}
