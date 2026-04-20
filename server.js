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
    db.query("SELECT * FROM semestres", (err, data) => {
        if (err) return res.json([]);
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
            if (err) return res.json(err);
            res.json({ mensaje: "Semestre creado" });
        }
    );
});


/* ================= ESTUDIANTES ================= */

app.post("/estudiantes", (req, res) => {
    const { nombre, apellido, documento, telefono, semestre_id } = req.body;

    db.query(
        "INSERT INTO estudiantes (nombre, apellido, documento, telefono, semestre_id) VALUES (?, ?, ?, ?, ?)",
        [nombre, apellido, documento, telefono, semestre_id],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ mensaje: "Error al guardar" });
            }
            res.json({ mensaje: "✅ Estudiante guardado" });
        }
    );
});

app.get("/estudiantes", (req, res) => {
    db.query(`
        SELECT e.*, s.nombre AS semestre
        FROM estudiantes e
        LEFT JOIN semestres s ON e.semestre_id = s.id
    `, (err, data) => {
        if (err) return res.json([]);
        res.json(data);
    });
});

app.put("/estudiantes/:id", (req, res) => {
    const { id } = req.params;
    const { nombre, apellido, documento, telefono, semestre_id } = req.body;

    db.query(
        "UPDATE estudiantes SET nombre=?, apellido=?, documento=?, telefono=?, semestre_id=? WHERE id=?",
        [nombre, apellido, documento, telefono, semestre_id, id],
        (err) => {
            if (err) return res.json(err);
            res.json({ mensaje: "Actualizado" });
        }
    );
});

app.delete("/estudiantes/:id", (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM notas WHERE estudiante_id=?", [id], () => {
        db.query("DELETE FROM pagos WHERE estudiante_id=?", [id], () => {
            db.query("DELETE FROM estudiantes WHERE id=?", [id], (err, result) => {
                if (result.affectedRows === 0) {
                    return res.json({ mensaje: "No existe" });
                }
                res.json({ mensaje: "✅ Eliminado" });
            });
        });
    });
});


/* ================= PROFESORES ================= */

app.post("/profesores", (req, res) => {
    const { nombre, materia } = req.body;

    db.query(
        "INSERT INTO profesores (nombre, materia) VALUES (?, ?)",
        [nombre, materia],
        () => res.json({ mensaje: "Guardado" })
    );
});

app.get("/profesores", (req, res) => {
    db.query("SELECT * FROM profesores", (err, data) => {
        res.json(data);
    });
});

app.put("/profesores/:id", (req, res) => {
    const { nombre, materia } = req.body;

    db.query(
        "UPDATE profesores SET nombre=?, materia=? WHERE id=?",
        [nombre, materia, req.params.id],
        () => res.json({ mensaje: "Actualizado" })
    );
});

app.delete("/profesores/:id", (req, res) => {
    db.query("DELETE FROM profesores WHERE id=?", [req.params.id], () => {
        res.json({ mensaje: "Eliminado" });
    });
});


/* ================= NOTAS ================= */

app.post("/notas", (req, res) => {
    const { estudiante_id, materia, nota, fecha } = req.body;

    if (!estudiante_id || !materia || !nota) {
        return res.json({ mensaje: "⚠️ Datos incompletos" });
    }

    db.query(
        "INSERT INTO notas (estudiante_id, materia, nota, fecha) VALUES (?, ?, ?, ?)",
        [estudiante_id, materia, nota, fecha || null],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ mensaje: "❌ Error al guardar nota" });
            }

            res.json({ mensaje: "✅ Nota guardada" });
        }
    );
});

app.get("/notas", (req, res) => {
    db.query(`
        SELECT n.*, e.nombre, e.apellido
        FROM notas n
        JOIN estudiantes e ON n.estudiante_id = e.id
        ORDER BY n.id DESC
    `, (err, data) => {
        if (err) {
            console.log(err);
            return res.json([]);
        }
        res.json(data);
    });
});

app.get("/notas-estudiante/:id", (req, res) => {
    const { id } = req.params;

    db.query(`
        SELECT materia, nota, fecha
        FROM notas
        WHERE estudiante_id = ?
    `, [id], (err, data) => {
        if (err) return res.json([]);
        res.json(data);
    });
});

app.put("/notas/:id", (req, res) => {
    const { id } = req.params;
    const { estudiante_id, materia, nota, fecha } = req.body;

    db.query(
        "UPDATE notas SET estudiante_id=?, materia=?, nota=?, fecha=? WHERE id=?",
        [estudiante_id, materia, nota, fecha || null, id],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ mensaje: "❌ Error al actualizar" });
            }

            if (result.affectedRows === 0) {
                return res.json({ mensaje: "❌ Nota no encontrada" });
            }

            res.json({ mensaje: "✅ Nota actualizada" });
        }
    );
});

app.delete("/notas/:id", (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM notas WHERE id=?", [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.json({ mensaje: "❌ Error al eliminar" });
        }

        if (result.affectedRows === 0) {
            return res.json({ mensaje: "❌ Nota no existe" });
        }

        res.json({ mensaje: "🗑️ Nota eliminada" });
    });
});


/* ================= PAGOS ================= */

app.post("/pagos", (req, res) => {
    const { estudiante_id, total, abono, fecha } = req.body;

    if (!estudiante_id || !total) {
        return res.json({ mensaje: "⚠️ Datos incompletos" });
    }

    const saldo = total - (abono || 0);

    db.query(
        "INSERT INTO pagos (estudiante_id, total, abono, saldo, fecha) VALUES (?, ?, ?, ?, ?)",
        [estudiante_id, total, abono || 0, saldo, fecha || new Date()],
        (err) => {
            if (err) {
                console.log(err);
                return res.json({ mensaje: "❌ Error al registrar pago" });
            }
            res.json({ mensaje: "💰 Pago registrado correctamente" });
        }
    );
});

app.get("/pagos", (req, res) => {
    db.query(`
        SELECT p.*, e.nombre, e.apellido
        FROM pagos p
        JOIN estudiantes e ON p.estudiante_id = e.id
        ORDER BY p.id DESC
    `, (err, data) => {
        if (err) {
            console.log(err);
            return res.json([]);
        }
        res.json(data);
    });
});

/* 🔥 ESTE ES EL FIX */
app.get("/pagos/:id", (req, res) => {
    const { id } = req.params;

    db.query(`
        SELECT p.*, e.nombre, e.apellido
        FROM pagos p
        JOIN estudiantes e ON p.estudiante_id = e.id
        WHERE p.id = ?
    `, [id], (err, data) => {
        if (err || data.length === 0) {
            return res.json({});
        }
        res.json(data[0]);
    });
});

app.put("/pagos/:id", (req, res) => {
    const { id } = req.params;
    const { estudiante_id, total, abono, fecha } = req.body;

    const saldo = total - (abono || 0);

    db.query(
        "UPDATE pagos SET estudiante_id=?, total=?, abono=?, saldo=?, fecha=? WHERE id=?",
        [estudiante_id, total, abono || 0, saldo, fecha || new Date(), id],
        () => res.json({ mensaje: "✅ Pago actualizado" })
    );
});

app.delete("/pagos/:id", (req, res) => {
    db.query("DELETE FROM pagos WHERE id=?", [req.params.id], () => {
        res.json({ mensaje: "🗑️ Pago eliminado" });
    });
});


/* ================= ABONOS ================= */

app.post("/abonos", (req, res) => {
    const { pago_id, monto, fecha } = req.body;

    if (!pago_id || !monto) {
        return res.json({ mensaje: "⚠️ Datos incompletos" });
    }

    const montoNum = Number(monto);

    if (isNaN(montoNum) || montoNum <= 0) {
        return res.json({ mensaje: "⚠️ Monto inválido" });
    }

    db.query("SELECT saldo FROM pagos WHERE id=?", [pago_id], (err, result) => {

        if (err) {
            console.log(err);
            return res.json({ mensaje: "❌ Error en BD" });
        }

        if (!result || result.length === 0) {
            return res.json({ mensaje: "❌ Pago no existe" });
        }

        const saldoActual = Number(result[0].saldo);

        if (montoNum > saldoActual) {
            return res.json({ mensaje: "❌ El abono supera el saldo" });
        }

        db.query(
            "INSERT INTO abonos (pago_id, monto, fecha) VALUES (?, ?, ?)",
            [pago_id, montoNum, fecha || new Date()],
            (err) => {

                if (err) {
                    console.log(err);
                    return res.json({ mensaje: "❌ Error al guardar abono" });
                }

                db.query(
                    "UPDATE pagos SET saldo = saldo - ? WHERE id = ?",
                    [montoNum, pago_id],
                    (err) => {

                        if (err) {
                            console.log(err);
                            return res.json({ mensaje: "❌ Error actualizando saldo" });
                        }

                        res.json({ mensaje: "💵 Abono registrado correctamente" });
                    }
                );
            }
        );
    });
});

app.get("/abonos/:pago_id", (req, res) => {

    db.query(
        "SELECT * FROM abonos WHERE pago_id=? ORDER BY id DESC",
        [req.params.pago_id],
        (err, data) => {

            if (err) {
                console.log(err);
                return res.json([]);
            }

            res.json(data || []);
        }
    );
});

app.delete("/abonos/:id", (req, res) => {

    db.query("SELECT * FROM abonos WHERE id=?", [req.params.id], (err, result) => {

        if (err) {
            console.log(err);
            return res.json({ mensaje: "❌ Error BD" });
        }

        if (!result || result.length === 0) {
            return res.json({ mensaje: "❌ No existe" });
        }

        const abono = result[0];

        db.query(
            "UPDATE pagos SET saldo = saldo + ? WHERE id = ?",
            [abono.monto, abono.pago_id],
            (err) => {
                if (err) console.log(err);
            }
        );

        db.query("DELETE FROM abonos WHERE id=?", [req.params.id], (err) => {

            if (err) {
                console.log(err);
                return res.json({ mensaje: "❌ Error eliminando" });
            }

            res.json({ mensaje: "🗑️ Abono eliminado correctamente" });
        });
    });
});
app.post("/login", async (req, res) => {
    const { usuario, password } = req.body;

    try {
        const result = await db.query(
            "SELECT * FROM usuarios WHERE usuario = $1 AND password = $2",
            [usuario, password]
        );

        if (result.rows.length > 0) {
            res.json({ ok: true });
        } else {
            res.json({ ok: false });
        }

    } catch (err) {
        console.log(err);
        res.json({ ok: false });
    }
});
/* ================= PDF ESTUDIANTE PRO ================= */

function formatoCOP(num){
    return Number(num).toLocaleString("es-CO");
}

app.get("/reporte-estudiante/:id", (req, res) => {

    const { id } = req.params;

    db.query(`
        SELECT e.*, s.nombre AS semestre
        FROM estudiantes e
        LEFT JOIN semestres s ON e.semestre_id = s.id
        WHERE e.id = ?
    `, [id], (err, estudiante) => {

        if (!estudiante || estudiante.length === 0) {
            return res.send("No existe estudiante");
        }

        const est = estudiante[0];

        db.query("SELECT * FROM notas WHERE estudiante_id=?", [id], (err, notas) => {

            db.query(`
                SELECT a.*, p.total, p.saldo
                FROM abonos a
                JOIN pagos p ON a.pago_id = p.id
                WHERE p.estudiante_id = ?
                ORDER BY a.id DESC
            `, [id], (err, abonos) => {

                const doc = new PDFDocument({ margin: 60 });

                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", `inline; filename=reporte_${est.nombre}.pdf`);

                doc.pipe(res);

                /* ===== HEADER ===== */
                doc.image("public/logo.jpg", 60, 40, { width: 70 });

                doc.fontSize(16).fillColor("#111")
                    .text("Instituto Bíblico Misión Celestial", 150, 50);

                doc.fontSize(10).fillColor("gray")
                    .text("Reporte académico del estudiante", 150, 70);

                doc.moveDown(4);

                /* ===== TITULO ===== */
                doc.fontSize(14).fillColor("#000")
                    .text("REPORTE DEL ESTUDIANTE", { align: "center" });

                doc.moveDown(2);

                /* ===== DATOS ===== */
                doc.fontSize(11).fillColor("#333");

                doc.text(`Nombre: ${est.nombre} ${est.apellido}`);
                doc.text(`Documento: ${est.documento}`);
                doc.text(`Teléfono: ${est.telefono}`);
                doc.text(`Semestre: ${est.semestre || "N/A"}`);

                doc.moveDown(2);

                /* ===== NOTAS ===== */
                doc.fontSize(13).text("Notas Académicas");
                doc.moveDown(0.7);

                doc.fontSize(11).fillColor("#444");

                doc.text("Materia", 60, doc.y);
                doc.text("Nota", 300, doc.y);
                doc.text("Fecha", 400, doc.y);

                doc.moveDown(0.3);

                doc.moveTo(60, doc.y).lineTo(520, doc.y).strokeColor("#ccc").stroke();
                doc.moveDown(0.5);

                doc.fillColor("#000");

                if (!notas || notas.length === 0) {
                    doc.text("No hay notas registradas");
                } else {
                    notas.forEach(n => {
                        const y = doc.y;

                        doc.text(n.materia, 60, y);
                        doc.text(Number(n.nota).toFixed(2), 300, y);
                        doc.text(
                            n.fecha ? new Date(n.fecha).toLocaleDateString("es-CO") : "",
                            400,
                            y
                        );

                        doc.moveDown(0.5);
                    });
                }

                doc.moveDown(2);

                /* ===== PAGOS ===== */
                doc.fontSize(13).text("Historial de Pagos");
                doc.moveDown(0.7);

                doc.fontSize(11).fillColor("#444");

                doc.text("Fecha", 60, doc.y);
                doc.text("Abono", 220, doc.y);
                doc.text("Saldo", 380, doc.y);

                doc.moveDown(0.3);

                doc.moveTo(60, doc.y).lineTo(520, doc.y).strokeColor("#ccc").stroke();
                doc.moveDown(0.5);

                doc.fillColor("#000");

                let totalPagado = 0;

                if (!abonos || abonos.length === 0) {
                    doc.text("No hay pagos registrados");
                } else {

                    abonos.forEach(a => {

                        totalPagado += Number(a.monto);

                        const y = doc.y;

                        doc.text(
                            a.fecha ? new Date(a.fecha).toLocaleDateString("es-CO") : "",
                            60,
                            y
                        );

                        doc.text("$" + formatoCOP(a.monto), 220, y);
                        doc.text("$" + formatoCOP(a.saldo), 380, y);

                        doc.moveDown(0.5);
                    });

                    doc.moveDown(1);

                    /* ===== TOTAL ===== */
                    doc.fontSize(12).fillColor("#000")
                        .text(`Total abonado: $${formatoCOP(totalPagado)}`, { align: "right" });
                }

                doc.moveDown(3);

                /* ===== FIRMA ===== */
                doc.text("______________________________", { align: "right" });
                doc.text("Firma autorizada", { align: "right" });

                doc.moveDown(2);

                /* ===== FOOTER ===== */
                doc.fontSize(9).fillColor("gray")
                    .text("Documento generado automáticamente - Sistema de Gestión", {
                        align: "center"
                    });

                doc.end();
            });
        });
    });
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
