const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1003645363", // 👈 TU CONTRASEÑA
    database: "mision_celestial"
});

db.connect((err) => {
    if (err) {
        console.log("❌ Error de conexión a MySQL:");
        console.log(err);
        return;
    }
    console.log("✅ MySQL conectado correctamente");
});

module.exports = db;