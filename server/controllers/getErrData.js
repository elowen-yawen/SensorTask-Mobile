const promisePool = require('../config/promisepool')

const buildWhere = (query) => {
    const keyword = query.keyword?.trim() || "";
    const startTime = query.startTime || "";
    const endTime = query.endTime || "";
    const conditions = [];
    const params = [];

    if (keyword) {
        conditions.push('(d_no LIKE ? OR e_msg LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (startTime) {
        conditions.push('c_time >= ?');
        params.push(startTime);
    }

    if (endTime) {
        conditions.push('c_time <= ?');
        params.push(endTime);
    }

    return {
        whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
        params,
    };
};

module.exports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 5;
        const offset = (page - 1) * pageSize;
        const { whereClause, params } = buildWhere(req.query);

        const [rows] = await promisePool.query(
            `   SELECT id, d_no AS '设备编号', e_msg AS '故障信息', c_time AS '报错时间',type as '故障类型'
                FROM t_error_msg
                ${whereClause}
                ORDER BY c_time desc
                LIMIT ? OFFSET ?
                `,
            [...params, pageSize, offset]
        );

        const countSql = `
      SELECT COUNT(*) AS total
      FROM t_error_msg
      ${whereClause}
    `;
        const [countResult] = await promisePool.query(
            countSql,
            params
        );
        const total = countResult[0].total;

        res.json({
            success: true,
            data: {
                list: rows,
                total,
                page,
                size: pageSize,
            },
        });
    } catch (err) {
        console.error("err表查询出错：", err);
        res.status(500).json({
            success: false,
            message: "错误数据查询失败",
        });
    }
};
