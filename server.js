const express = require("express");
const cors = require("cors");
const db = require("./db");
const PDFDocument = require("pdfkit");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 PRIMERO
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// 🔥 DESPUÉS
app.use(express.static("public"));


/* ================= SEMESTRES ================= */

// LISTAR
app.get("/semestres", (req, res) => {
    db.query("SELECT * FROM semestres", [], (err, data) => {
        if (err) {
            console.log(err);
            return res.json([]);
        }
        res.json(data);
    });
});

// CREAR
app.post("/semestres", (req, res) => {
    const { nombre } = req.body;

    db.query(
        "INSERT INTO semestres (nombre) VALUES (?)",
        [nombre],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ mensaje: "Error" });
            }
            res.json({ mensaje: "✅ Semestre creado" });
        }
    );
});

/* ================= estudiantes ================= */
app.post("/estudiantes", async (req, res) => {
    try {
        const { nombre, apellido, documento, telefono, semestre_id } = req.body;

        await db.query(
            "INSERT INTO estudiantes (nombre, apellido, documento, telefono, semestre_id) VALUES (?, ?, ?, ?, ?)",
            [nombre, apellido, documento, telefono, semestre_id]
        );

        res.json({ mensaje: "✅ Estudiante guardado" });

    } catch (err) {
        console.log("❌ ERROR POST estudiantes:", err);
        res.json({ mensaje: "Error al guardar" });
    }
});
app.get("/estudiantes", async (req, res) => {
    try {
        const data = await db.query(`
            SELECT e.*, s.nombre AS semestre
            FROM estudiantes e
            LEFT JOIN semestres s ON e.semestre_id = s.id
        `);

        res.json(data);

    } catch (err) {
        console.log("❌ ERROR GET estudiantes:", err);
        res.json([]);
    }
});
app.put("/estudiantes/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, documento, telefono, semestre_id } = req.body;

        await db.query(
            "UPDATE estudiantes SET nombre=?, apellido=?, documento=?, telefono=?, semestre_id=? WHERE id=?",
            [nombre, apellido, documento, telefono, semestre_id, id]
        );

        res.json({ mensaje: "Actualizado" });

    } catch (err) {
        console.log("❌ ERROR PUT estudiantes:", err);
        res.json({ mensaje: "Error" });
    }
});
app.delete("/estudiantes/:id", async (req, res) => {
    try {
        const { id } = req.params;

        await db.query("DELETE FROM notas WHERE estudiante_id=?", [id]);
        await db.query("DELETE FROM pagos WHERE estudiante_id=?", [id]);

        const result = await db.query("DELETE FROM estudiantes WHERE id=?", [id]);

        if (result.affectedRows === 0) {
            return res.json({ mensaje: "No existe" });
        }

        res.json({ mensaje: "✅ Eliminado" });

    } catch (err) {
        console.log("❌ ERROR DELETE estudiantes:", err);
        res.json({ mensaje: "Error eliminando" });
    }
});

/* ================= PROFESORES ================= */

app.post("/profesores", async (req, res) => {
    try {
        const { nombre, materia } = req.body;

        await db.query(
            "INSERT INTO profesores (nombre, materia) VALUES (?, ?)",
            [nombre, materia]
        );

        res.json({ mensaje: "Guardado" });

    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});

app.get("/profesores", async (req, res) => {
    try {
        const data = await db.query("SELECT * FROM profesores");
        res.json(data);
    } catch (err) {
        console.log(err);
        res.json([]);
    }
});

app.put("/profesores/:id", async (req, res) => {
    try {
        const { nombre, materia } = req.body;

        await db.query(
            "UPDATE profesores SET nombre=?, materia=? WHERE id=?",
            [nombre, materia, req.params.id]
        );

        res.json({ mensaje: "Actualizado" });

    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});

app.delete("/profesores/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM profesores WHERE id=?", [req.params.id]);
        res.json({ mensaje: "Eliminado" });
    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});


/* ================= NOTAS ================= */

app.post("/notas", async (req, res) => {
    try {
        const { estudiante_id, materia, nota, fecha } = req.body;

        if (!estudiante_id || !materia || !nota) {
            return res.json({ mensaje: "⚠️ Datos incompletos" });
        }

        await db.query(
            "INSERT INTO notas (estudiante_id, materia, nota, fecha) VALUES (?, ?, ?, ?)",
            [estudiante_id, materia, nota, fecha || null]
        );

        res.json({ mensaje: "✅ Nota guardada" });

    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});

app.get("/notas", async (req, res) => {
    try {
        const data = await db.query(`
            SELECT n.*, e.nombre, e.apellido
            FROM notas n
            JOIN estudiantes e ON n.estudiante_id = e.id
            ORDER BY n.id DESC
        `);

        res.json(data);

    } catch (err) {
        console.log(err);
        res.json([]);
    }
});

app.get("/notas-estudiante/:id", async (req, res) => {
    try {
        const data = await db.query(
            "SELECT materia, nota, fecha FROM notas WHERE estudiante_id=?",
            [req.params.id]
        );

        res.json(data);

    } catch (err) {
        console.log(err);
        res.json([]);
    }
});

app.put("/notas/:id", async (req, res) => {
    try {
        const { estudiante_id, materia, nota, fecha } = req.body;

        const result = await db.query(
            "UPDATE notas SET estudiante_id=?, materia=?, nota=?, fecha=? WHERE id=?",
            [estudiante_id, materia, nota, fecha || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.json({ mensaje: "❌ Nota no encontrada" });
        }

        res.json({ mensaje: "✅ Nota actualizada" });

    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});

app.delete("/notas/:id", async (req, res) => {
    try {
        const result = await db.query(
            "DELETE FROM notas WHERE id=?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.json({ mensaje: "❌ Nota no existe" });
        }

        res.json({ mensaje: "🗑️ Nota eliminada" });

    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});


/* ================= PAGOS ================= */

app.post("/pagos", async (req, res) => {
    try {
        const { estudiante_id, total, abono, fecha } = req.body;

        if (!estudiante_id || !total) {
            return res.json({ mensaje: "⚠️ Datos incompletos" });
        }

        const saldo = total - (abono || 0);

        await db.query(
            "INSERT INTO pagos (estudiante_id, total, abono, saldo, fecha) VALUES (?, ?, ?, ?, ?)",
            [estudiante_id, total, abono || 0, saldo, fecha || new Date()]
        );

        res.json({ mensaje: "💰 Pago registrado" });

    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});

app.get("/pagos", async (req, res) => {
    try {
        const data = await db.query(`
            SELECT p.*, e.nombre, e.apellido
            FROM pagos p
            JOIN estudiantes e ON p.estudiante_id = e.id
            ORDER BY p.id DESC
        `);

        res.json(data);

    } catch (err) {
        console.log(err);
        res.json([]);
    }
});

app.get("/pagos/:id", async (req, res) => {
    try {
        const data = await db.query(`
            SELECT p.*, e.nombre, e.apellido
            FROM pagos p
            JOIN estudiantes e ON p.estudiante_id = e.id
            WHERE p.id = ?
        `, [req.params.id]);

        res.json(data[0] || {});

    } catch (err) {
        console.log(err);
        res.json({});
    }
});

app.put("/pagos/:id", async (req, res) => {
    try {
        const { estudiante_id, total, abono, fecha } = req.body;

        const saldo = total - (abono || 0);

        await db.query(
            "UPDATE pagos SET estudiante_id=?, total=?, abono=?, saldo=?, fecha=? WHERE id=?",
            [estudiante_id, total, abono || 0, saldo, fecha || new Date(), req.params.id]
        );

        res.json({ mensaje: "Actualizado" });

    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});

app.delete("/pagos/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM pagos WHERE id=?", [req.params.id]);
        res.json({ mensaje: "Eliminado" });
    } catch (err) {
        console.log(err);
        res.json({ mensaje: "Error" });
    }
});

/* ================= ABONOS ================= */

app.post("/abonos", async (req, res) => {
    try {
        let { pago_id, monto, fecha } = req.body;

        // 🔥 Validaciones
        if (!pago_id || !monto) {
            return res.json({ mensaje: "⚠️ Datos incompletos" });
        }

        monto = Number(monto);

        if (isNaN(monto) || monto <= 0) {
            return res.json({ mensaje: "⚠️ Monto inválido" });
        }

        // 🔥 Obtener saldo actual
        const pago = await db.query(
            "SELECT saldo FROM pagos WHERE id=?",
            [pago_id]
        );

        if (!pago || pago.length === 0) {
            return res.json({ mensaje: "❌ No existe pago" });
        }

        const saldoActual = Number(pago[0].saldo);

        // 🔥 Validar que no supere el saldo
        if (monto > saldoActual) {
            return res.json({ mensaje: "❌ El abono supera el saldo" });
        }

        // 🔥 Insertar abono
        await db.query(
            "INSERT INTO abonos (pago_id, monto, fecha) VALUES (?, ?, ?)",
            [pago_id, monto, fecha || new Date()]
        );

        // 🔥 Actualizar saldo
        await db.query(
            "UPDATE pagos SET saldo = saldo - ? WHERE id=?",
            [monto, pago_id]
        );

        res.json({ mensaje: "💵 Abono registrado correctamente" });

    } catch (err) {
        console.log("❌ ERROR ABONO:", err);
        res.json({ mensaje: "❌ Error en servidor" });
    }
});
/* ================= GET ABONOS ================= */

app.get("/abonos/:pago_id", async (req, res) => {
    try {
        const data = await db.query(
            "SELECT * FROM abonos WHERE pago_id=? ORDER BY id DESC",
            [req.params.pago_id]
        );

        res.json(data);

    } catch (err) {
        console.log(err);
        res.json([]);
    }
});


/* ================= LOGIN ================= */

app.post("/login", async (req, res) => {
    try {
        const { usuario, password } = req.body;

        const result = await db.query(
            "SELECT * FROM usuarios WHERE usuario=? AND password=?",
            [usuario, password]
        );

        res.json({ ok: result.length > 0 });

    } catch (err) {
        console.log(err);
        res.json({ ok: false });
    }
});

// 🔥 REDIRIGIR AL LOGIN
app.get("/", (req, res) => {
    res.redirect("/login.html");
});
    
/* ================= SERVER ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
