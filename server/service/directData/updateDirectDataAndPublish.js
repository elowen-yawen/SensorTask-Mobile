const promisePool = require('../../config/promisepool')
const mqttClient = require('../../mqtt')
const { saveDirectData } = require('./saveDirectData')

const DEFAULT_DIRECT_TOPIC = 'control'

const configIdMapping = {
   0: 'mode',          // 控制模式 
   1: 'air',             // 空调开关 (Air Conditioner Switch) 
   2: 'fan',            // 风机开关 
   3: 'speed_fan',             // 风机功率 
   4: 'acMode',               // 空调模式  
   5: 'power_air',              // 空调功率 
   6: 'TG',       // 温差 (Temperature Difference) 
   7: 'TinDH',     // 温度上限阈值 
   8: 'TinDL',    // 温度下限阈值 
   9: 'led', // 可调灯开关 
   10: 'LXD',     // 光照阈值 (Lux/Illuminance) 
   11: 'bright_led',           // 亮度 (Brightness) 
   12: 'TBegin',                // 时间 (Time) 
   13: 'TEnd'               // 时间 (Time) 
}

const SWITCH_TYPES = [0, 1, 2, 4, 9]

const VALUE_MAPPING = {
    'on': 'open',
    'off': 'close'
}

function mapSwitchValue(value) {
    if (VALUE_MAPPING[value] !== undefined) {
        return VALUE_MAPPING[value]
    }
    return value
}

const getDirectConfig = async (configId) => {
    try {
        const [[config]] = await promisePool.query(
            `SELECT id, t_name, f_type, topic, preffix FROM t_direct_config WHERE id = ? LIMIT 1`,
            [configId]
        )
        return config || null
    } catch (err) {
        console.warn('Query direct config metadata failed, using defaults:', err.message)
        return null
    }
}

const buildMessage = (status) => {
    if (status === 'queued') return '配置保存成功，设备离线，消息已排队。'
    if (status === 'failed') return '配置保存成功，MQTT发送失败。'
    return '配置保存成功。'
}

module.exports = async (req, res) => {
    try {
        const { config_id, value, d_no } = req.body

        if (config_id === undefined || config_id === null || config_id === '') {
            return res.status(400).json({ success: false, message: 'config_id必填' })
        }

        console.log('[Direct Update] Saving config:', { config_id, value, d_no })

        const saveResult = await saveDirectData({ config_id, value, d_no })
        const config = await getDirectConfig(config_id)
        const topic = DEFAULT_DIRECT_TOPIC
        const isGlobalConfig = saveResult.d_no === null
        const mode = isGlobalConfig ? 1 : 0

        const propertyName = configIdMapping[config_id] || `unknown_${config_id}`
        const isSwitchType = SWITCH_TYPES.includes(Number(config_id))
        const mappedValue = isSwitchType ? mapSwitchValue(value) : value
        
        console.log('[Direct Update] Value mapping debug:', {
            config_id,
            isSwitchType,
            originalValue: value,
            mappedValue
        })
        
        const payload = {
            [propertyName]: mappedValue
        }

        console.log('[Direct Update] Publish MQTT:', {
            topic,
            d_no: saveResult.d_no,
            payload,
            isConnected: mqttClient.isConnected
        })

        try {
            const publishResult = await mqttClient.publishJsonToDevice(
                saveResult.d_no,
                topic,
                payload,
                { qos: 1, retain: false }
            )

            console.log('[Direct Update] MQTT publish SUCCESS:', {
                topic,
                status: publishResult.status,
                deviceId: publishResult.deviceId,
                queueLength: publishResult.queueLength || 0
            })

            return res.json({
                success: true,
                message: buildMessage(publishResult.status),
                data: {
                    db: saveResult,
                    mqtt: publishResult
                }
            })
        } catch (err) {
            console.error('[Direct Update] MQTT publish failed:', err.message)
            return res.json({
                success: true,
                message: buildMessage('failed'),
                data: {
                    db: saveResult,
                    mqtt: { status: 'failed', reason: err.message }
                }
            })
        }
    } catch (err) {
        console.error('[Direct Update] Server error:', err)
        return res.status(500).json({
            success: false,
            message: err.message || '保存配置失败'
        })
    }
}
