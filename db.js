const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // 🔥 Supabase
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err) => {
    if (err) {
        console.log("❌ Error de conexión:");
        console.log(err);
        return;
    }
    console.log("✅ Conectado a Supabase PostgreSQL");
});

/* 🔥 ADAPTADOR PARA QUE TU SERVER NO CAMBIE */
function convertirQuery(sql, params = []) {
    let index = 0;

    const newSql = sql.replace(/\?/g, () => {
        index++;
        return `$${index}`;
    });

    return { text: newSql, values: params };
}

module.exports = {
    query: async (sql, params, callback) => {
        try {
            const { text, values } = convertirQuery(sql, params);

            const result = await pool.query(text, values);

            // 🔥 Simular MySQL
            const data = result.rows;
            data.affectedRows = result.rowCount;

            if (callback) {
                callback(null, data);
            } else {
                return data;
            }

        } catch (err) {
            console.log("❌ ERROR DB:", err);

            if (callback) {
                callback(err, null);
            } else {
                throw err;
            }
        }
    }
};