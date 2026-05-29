const promisePool = require('../config/promisepool')

const buildDeviceQuery = (searchMode, keywordLike, useCollate = false) => {
    if (searchMode === 'deviceName') {
        return {
            where: useCollate
                ? 'device_name COLLATE utf8mb4_general_ci LIKE ?'
                : 'device_name LIKE ?',
            params: [keywordLike]
        }
    }

    return {
        where: useCollate
            ? 'number LIKE ? OR device_name COLLATE utf8mb4_general_ci LIKE ?'
            : 'number LIKE ? OR device_name LIKE ?',
        params: [keywordLike, keywordLike]
    }
}

module.exports = async (req, res) => {
    try {
        const input = (req.query.input || '').trim()
        const searchMode = req.query.searchMode || 'all'
        const keywordLike = `%${input}%`
        console.log('getDeviceManageData params (no pagination):', { input, keywordLike, searchMode })

        const queryFields = buildDeviceQuery(searchMode, keywordLike)
        let [deviceData] = await promisePool.query(
            `SELECT id, number AS '鐢佃溅缂栧彿id', device_name AS '璁惧鍚嶇О',
                    remarks AS '澶囨敞', ctime AS '鍒涘缓鏃堕棿'
             FROM t_device
             WHERE ${queryFields.where}
             ORDER BY id`,
            queryFields.params
        )

        if ((!deviceData || deviceData.length === 0) && /\D/.test(input)) {
            console.log('no results with default LIKE, trying COLLATE fallback for input:', input)
            const fallbackFields = buildDeviceQuery(searchMode, keywordLike, true)
            ;[deviceData] = await promisePool.query(
                `SELECT id, device_name AS '璁惧鍚嶇О', remarks AS '澶囨敞',
                        number AS '鐢佃溅缂栧彿id', ctime AS '鍒涘缓鏃堕棿'
                 FROM t_device
                 WHERE ${fallbackFields.where}
                 ORDER BY id`,
                fallbackFields.params
            )
        }

        let diagnostics = null
        if ((!deviceData || deviceData.length === 0) && input) {
            try {
                const [samples] = await promisePool.query(
                    `SELECT id, device_name, HEX(device_name) AS name_hex, CHAR_LENGTH(device_name) AS name_len
                     FROM t_device
                     ORDER BY id
                     LIMIT 10`
                )
                diagnostics = samples
                console.log('device name samples for diagnostics:', samples)
            } catch (diagErr) {
                console.warn('failed to fetch diagnostics samples:', diagErr.message)
            }
        }

        const total = Array.isArray(deviceData) ? deviceData.length : 0

        const responsePayload = {
            success: true,
            data: {
                list: deviceData,
                total
            }
        }

        if (req.query.debug === '1') {
            try {
                const inputHex = Buffer.from(input || '').toString('hex')
                responsePayload.receivedInput = input
                responsePayload.receivedInputHex = inputHex
                if (diagnostics) responsePayload.diagnostics = diagnostics
            } catch (hexErr) {
                console.warn('failed to compute input hex:', hexErr.message)
            }
        }

        res.json(responsePayload)
    } catch (err) {
        console.error('璁惧鏌ヨ澶辫触:', err)
        res.status(500).json({
            success: false,
            message: '璁惧鏁版嵁鏌ヨ澶辫触',
            error: err.message
        })
    }
}
