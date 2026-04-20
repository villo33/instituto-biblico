const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect()
    .then(() => console.log("✅ Conectado a Supabase PostgreSQL"))
    .catch(err => console.log("❌ Error conexión", err));

function convertirQuery(sql, params = []) {
    let index = 0;

    const newSql = sql.replace(/\?/g, () => {
        index++;
        return `$${index}`;
    });

    return { text: newSql, values: params };
}

module.exports = {
    query: async (sql, params = [], callback) => {
        try {
            const { text, values } = convertirQuery(sql, params);

            const result = await pool.query(text, values);

            // 🔥 VALIDACIÓN CLAVE
            if (!result) {
                throw new Error("Query no devolvió resultado");
            }

            const data = result.rows || [];
            data.affectedRows = result.rowCount || 0;

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
                return []; // 🔥 evita que tumbe el server
            }
        }
    }
};