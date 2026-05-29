const promisePool = require('../../config/promisepool')

async function saveSensorData(info) {
    const params = [
        info.VID ?? null,
        info.PID1 ?? null,
        info.PID2 ?? null,
        info.Tin ?? null,
        info.Tout ?? null,
        info.LXin ?? null,
        info.Time ?? null,
        info.c_time
    ]

    try {
        await promisePool.execute(
            `INSERT INTO t_sensor_data (VID, PID1, PID2, Tin, Tout, LXin, Time, c_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            params
        )
        console.log('[SensorData] Data saved to database successfully')
        return true
    } catch (err) {
        console.error('[SensorData] Failed to save data:', err.message)
        throw err
    }
}

async function getSensorDataByDevice(limit = 100) {
    try {
        const [rows] = await promisePool.query(
            `SELECT * FROM t_sensor_data ORDER BY c_time DESC LIMIT ?`,
            [limit]
        )
        return rows
    } catch (err) {
        console.error('[SensorData] Failed to query data:', err.message)
        throw err
    }
}

module.exports = {
    saveSensorData,
    getSensorDataByDevice
}
