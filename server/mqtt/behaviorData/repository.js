const promisePool = require('../../config/promisepool')

async function saveBehaviorData(info) {
    const params = [
        info.mode ?? null,
        info.fan ?? null,
        info.fan_speed ?? null,
        info.air ?? null,
        info.air_power ?? null,
        info.led ?? null,
        info.led_power ?? null,
        info.c_time
    ]

    try {
        await promisePool.execute(
            `INSERT INTO t_behavior_data (mode, fan, fan_speed, air, air_power, led, led_power, c_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params
        )
        console.log('[BehaviorData] Data saved to database successfully')
        return true
    } catch (err) {
        console.error('[BehaviorData] Failed to save data:', err.message)
        throw err
    }
}

async function getBehaviorDataByDevice(limit = 100) {
    try {
        const [rows] = await promisePool.query(
            `SELECT * FROM t_behavior_data ORDER BY c_time DESC LIMIT ?`,
            [limit]
        )
        return rows
    } catch (err) {
        console.error('[BehaviorData] Failed to query data:', err.message)
        throw err
    }
}

module.exports = {
    saveBehaviorData,
    getBehaviorDataByDevice
}
