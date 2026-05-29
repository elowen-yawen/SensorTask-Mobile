const { saveErrorMsg } = require('./repository')

const ERROR_TOPIC = 'abnormal_state'

function parsePayload(payload) {
    try {
        return JSON.parse(payload.toString())
    } catch (err) {
        console.error('[ErrorMsg] Failed to parse JSON:', err.message)
        return null
    }
}

async function handleMessage(topic, payload) {
    if (topic !== ERROR_TOPIC) {
        return null
    }

    const info = parsePayload(payload)
    if (!info) {
        return null
    }

    info.c_time = new Date()

    console.log('[ErrorMsg] Received message:', { topic, data: info })

    try {
        await saveErrorMsg(info)
        return info
    } catch (err) {
        console.error('[ErrorMsg] Error processing message:', err.message)
        return null
    }
}

module.exports = {
    ERROR_TOPIC,
    handleMessage,
    parsePayload
}
