const mqtt = require('mqtt')
const EventEmitter = require('events')
const promisePool = require('../config/promisepool')
const { handleMessage: handleSensorData, SENSOR_TOPIC } = require('./sensorData/index')
const { handleMessage: handleBehaviorData, BEHAVIOR_TOPIC } = require('./behaviorData/index')
const { handleMessage: handleErrorData, ERROR_TOPIC } = require('./ErrorMsg/index')

class MqttClient extends EventEmitter {
    static defaultSetting = {
        url: 'mqtt://localhost:1883',
        option: {
            clientId: 'mqtt-client'
        },
        subscribeTopics: [
            { topic: 'testTopic/#', qos: 1 },
            { topic: '/isAlive/#', qos: 1 }
        ]
    }

    constructor(config = {}) {
        super()
        this.config = {
            url: config.url || MqttClient.defaultSetting.url,
            option: { ...MqttClient.defaultSetting.option, ...config.option },
            subscribeTopics: config.subscribeTopics || MqttClient.defaultSetting.subscribeTopics
        }
        this.client = null
        this.isConnected = false
        this.timer = {}
        this.aliveDeviceIds = new Set()
        this.offlineMessageQueues = new Map()
        this.initClient()
    }

    initClient() {
        this.client = mqtt.connect(this.config.url, this.config.option)
        this.bindClientEvents()
    }

    bindClientEvents() {
        this.client.on('connect', () => {
            this.isConnected = true
            console.log('MQTT connected')
            this.subscribeAllTopics()
        })

        this.client.on('error', (err) => {
            console.error('MQTT connection error:', err.message)
        })

        this.client.on('offline', () => {
            this.isConnected = false
            console.log('MQTT client offline')
        })

        this.client.on('close', () => {
            this.isConnected = false
        })

        this.client.on('reconnect', () => {
            console.log('MQTT reconnecting...')
        })

        this.client.on('message', (topic, payload) => {
            const normalizedTopic = topic.replace(/^\/+/, '')

            if (normalizedTopic.startsWith('isAlive/')) {
                const id = normalizedTopic.split('/').pop()
                this.markDeviceAlive(id)
                return
            }

            let info
            try {
                info = JSON.parse(payload.toString())
            } catch (err) {
                console.error('MQTT message parse failed:', err)
                return
            }

            if (topic === SENSOR_TOPIC) {
                const result = handleSensorData(topic, payload)
                if (result) {
                    this.emit('message', topic, result)
                }
            }

            if (topic === BEHAVIOR_TOPIC) {
                const result = handleBehaviorData(topic, payload)
                if (result) {
                    this.emit('message', topic, result)
                }
            }

            if (topic === ERROR_TOPIC) {
                const result = handleErrorData(topic, payload)
                if (result) {
                    this.emit('message', topic, result)
                }
            }

        })
    }

    subscribeAllTopics() {
        const topics = this.config.subscribeTopics.reduce((acc, item) => {
            acc[item.topic] = { qos: item.qos }
            return acc
        }, {})

        this.client.subscribe(topics, (err) => {
            if (err) {
                console.error('MQTT subscribe failed:', err.message)
            } else {
                console.log('MQTT subscribe success')
            }
        })
    }

    publishJson(topic, payload, options = {}) {
        return this.publish(topic, JSON.stringify(payload), options)
    }

    async publishJsonToDevice(deviceId, topic, payload, options = {}) {
        const finalDeviceId = this.normalizeDeviceId(deviceId)

        const message = {
            topic,
            payload: JSON.stringify(payload),
            options,
            queuedAt: new Date().toISOString()
        }

        let publishResult
        try {
            publishResult = await this.publish(topic, message.payload, options)
            console.log(`[MQTT] 消息已发布到主题 ${topic}`)
        } catch (err) {
            console.error(`[MQTT] 发布失败 ${topic}:`, err.message)
            publishResult = { error: err.message }
        }

        if (finalDeviceId !== null && !this.isDeviceAlive(finalDeviceId)) {
            this.enqueueOfflineMessage(finalDeviceId, message)
            return {
                status: 'queued',
                deviceId: finalDeviceId,
                queueLength: this.getOfflineQueueLength(finalDeviceId),
                mqtt: publishResult
            }
        }

        return {
            status: 'published',
            deviceId: finalDeviceId,
            mqtt: publishResult
        }
    }

    normalizeDeviceId(id) {
        if (id === undefined || id === null || id === '' || id === 'null') {
            return null
        }
        return String(id)
    }

    isDeviceAlive(id) {
        const finalDeviceId = this.normalizeDeviceId(id)
        return finalDeviceId !== null && this.aliveDeviceIds.has(finalDeviceId)
    }

    enqueueOfflineMessage(id, message) {
        const finalDeviceId = this.normalizeDeviceId(id)
        if (finalDeviceId === null) return

        const queue = this.offlineMessageQueues.get(finalDeviceId) || []
        queue.push(message)
        this.offlineMessageQueues.set(finalDeviceId, queue)
        console.log(`Device ${finalDeviceId} is offline, queued MQTT message. queue length: ${queue.length}`)
    }

    getOfflineQueueLength(id) {
        const finalDeviceId = this.normalizeDeviceId(id)
        if (finalDeviceId === null) return 0
        return this.offlineMessageQueues.get(finalDeviceId)?.length || 0
    }

    markDeviceAlive(id) {
        const finalDeviceId = this.normalizeDeviceId(id)
        if (finalDeviceId === null) return

        clearTimeout(this.timer[finalDeviceId])
        delete this.timer[finalDeviceId]
        this.aliveDeviceIds.add(finalDeviceId)
        console.log(`${finalDeviceId} device is alive`)
        this.flushOfflineQueue(finalDeviceId)
    }

    markDeviceOffline(id) {
        const finalDeviceId = this.normalizeDeviceId(id)
        if (finalDeviceId === null) return

        this.aliveDeviceIds.delete(finalDeviceId)
        console.log(`${finalDeviceId} device heartbeat timeout`)
    }

    async flushOfflineQueue(id) {
        const finalDeviceId = this.normalizeDeviceId(id)
        const queue = this.offlineMessageQueues.get(finalDeviceId)
        if (!queue || queue.length === 0) return

        this.offlineMessageQueues.delete(finalDeviceId)

        for (let index = 0; index < queue.length; index += 1) {
            const message = queue[index]
            try {
                await this.publish(message.topic, message.payload, message.options)
            } catch (err) {
                const remainingMessages = queue.slice(index)
                this.offlineMessageQueues.set(finalDeviceId, remainingMessages)
                console.error(`Flush offline queue failed for device ${finalDeviceId}:`, err.message)
                return
            }
        }

        console.log(`Flushed offline MQTT queue for device ${finalDeviceId}, count: ${queue.length}`)
    }

    waitUntilConnected(timeout = 5000) {
        if (this.client && this.isConnected) {
            return Promise.resolve()
        }

        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new Error('MQTT client is not initialized'))
                return
            }

            const cleanup = () => {
                clearTimeout(timer)
                this.client.off('connect', handleConnect)
                this.client.off('error', handleError)
            }

            const handleConnect = () => {
                cleanup()
                resolve()
            }

            const handleError = (err) => {
                cleanup()
                reject(err)
            }

            const timer = setTimeout(() => {
                cleanup()
                reject(new Error('MQTT client connect timeout'))
            }, timeout)

            this.client.once('connect', handleConnect)
            this.client.once('error', handleError)
        })
    }

    async publish(topic, payload, options = {}) {
        if (!this.client) {
            throw new Error('MQTT client is not initialized')
        }

        if (!this.isConnected) {
            console.warn(`[MQTT] 客户端未连接，尝试连接...`)
            try {
                await this.waitUntilConnected(10000)
                console.log(`[MQTT] 客户端连接成功`)
            } catch (err) {
                console.error(`[MQTT] 客户端连接失败:`, err.message)
                throw err
            }
        }

        return new Promise((resolve, reject) => {
            let firstPublished = false
            let secondPublished = false
            let hasRejected = false

            const handlePublish = (err) => {
                if (hasRejected) return
                if (err) {
                    hasRejected = true
                    console.error(`[MQTT] 发布失败 ${topic}:`, err.message)
                    reject(err)
                    return
                }

                firstPublished = true
                if (secondPublished) {
                    console.log(`[MQTT] 发布成功 ${topic}:`, payload.substring(0, 100))
                    resolve({ topic, payload })
                }
            }

            const handleSecondPublish = (err) => {
                if (hasRejected) return
                if (err) {
                    hasRejected = true
                    console.error(`[MQTT] 第二发布失败 ${topic}:`, err.message)
                    reject(err)
                    return
                }

                secondPublished = true
                if (firstPublished) {
                    console.log(`[MQTT] 发布成功 ${topic}:`, payload.substring(0, 100))
                    resolve({ topic, payload })
                }
            }

            this.client.publish(topic, payload, options, handlePublish)
            setTimeout(() => {
                this.client.publish(topic, payload, options, handleSecondPublish)
            }, 100)
        })
    }

    checkIfAlive(id) {
        const finalDeviceId = this.normalizeDeviceId(id)
        if (finalDeviceId === null) return

        setInterval(() => {
            const heartbeatPayload = `${Date.now()} check alive`
            this.client.publish(`checkIfAlive/${finalDeviceId}`, heartbeatPayload, { qos: 1, retain: false }, err => {
                if (err) {
                    console.error('Check alive publish failed:', err.message)
                }
            })

            if (this.timer[finalDeviceId]) clearTimeout(this.timer[finalDeviceId])
            this.timer[finalDeviceId] = setTimeout(() => {
                this.markDeviceOffline(finalDeviceId)
            }, 3000)
        }, 10000)
    }
}

module.exports = MqttClient