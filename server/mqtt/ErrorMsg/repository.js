const promisePool = require('../../config/promisepool')

async function saveErrorMsg(info) {
    const params = [
        info.humi_warn ?? null,
        info.smog_warn ?? null,
        info.fan_warn ?? null,
        info.air_warn ?? null,
        info.outage_overtime ?? null,
        info.c_time
    ]

    try {
        await promisePool.execute(
            `INSERT INTO t_error_msg (humi_warn, smog_warn, fan_warn, air_warn, outage_overtime, c_time) VALUES (?, ?, ?, ?, ?, ?)`,
            params
        )
        console.log('[ErrorMsg] Data saved to database successfully')
        return true
    } catch (err) {
        console.error('[ErrorMsg] Failed to save data:', err.message)
        throw err
    }
}

async function getErrorMsgByDevice(limit = 100) {
    try {
        const [rows] = await promisePool.query(
            `SELECT * FROM t_error_msg ORDER BY c_time DESC LIMIT ?`,
            [limit]
        )
        return rows
    } catch (err) {
        console.error('[ErrorMsg] Failed to query data:', err.message)
        throw err
    }
}

module.exports = {
    saveErrorMsg,
    getErrorMsgByDevice
}
