const { saveBehaviorData } = require('./repository')

const BEHAVIOR_TOPIC = 'behavioral_data'

function parsePayload(payload) {
    try {
        return JSON.parse(payload.toString())
    } catch (err) {
        console.error('[BehaviorData] Failed to parse JSON:', err.message)
        return null
    }
}

async function handleMessage(topic, payload) {
    if (topic !== BEHAVIOR_TOPIC) {
        return null
    }

    const info = parsePayload(payload)
    if (!info) {
        return null
    }

    info.c_time = new Date()

    console.log('[BehaviorData] Received message:', { topic, data: info })

    try {
        await saveBehaviorData(info)
        return info
    } catch (err) {
        console.error('[BehaviorData] Error processing message:', err.message)
        return null
    }
}

module.exports = {
    BEHAVIOR_TOPIC,
    handleMessage,
    parsePayload
}
