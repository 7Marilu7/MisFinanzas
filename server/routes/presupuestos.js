const express = require("express");
const router = express.Router();
const db = require("../database/db");
const verificarToken = require("../middleware/verificarToken");

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Validar formato YYYY-MM
function mesValido(mes) {
  return (
    typeof mes === "string" &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)
  );
}

// Obtener los datos de un presupuesto y calcular sus gastos
function obtenerPresupuesto(id, usuarioId) {
  return db.prepare(`
    SELECT
      p.id,
      p.categoria_id,
      c.nombre AS categoria,
      p.monto,
      p.mes,

      COALESCE(SUM(m.monto), 0) AS gastado,

      p.monto - COALESCE(SUM(m.monto), 0) AS disponible,

      ROUND(
        COALESCE(SUM(m.monto), 0) * 100.0 / p.monto,
        2
      ) AS porcentaje

    FROM presupuestos p

    INNER JOIN categorias c
      ON p.categoria_id = c.id

    LEFT JOIN movimientos m
      ON m.usuario_id = p.usuario_id
      AND m.categoria_id = p.categoria_id
      AND m.tipo = 'gasto'
      AND m.fecha >= p.mes || '-01'
      AND m.fecha < date(p.mes || '-01', '+1 month')

    WHERE p.id = ?
      AND p.usuario_id = ?

    GROUP BY p.id
  `).get(id, usuarioId);
}

// Consultar presupuestos de un mes
router.get("/", (req, res) => {
  try {
    const mes = req.query.mes ||
      new Date().toISOString().slice(0, 7);

    if (!mesValido(mes)) {
      return res.status(400).json({
        mensaje: "El mes debe tener el formato YYYY-MM."
      });
    }

    const presupuestos = db.prepare(`
      SELECT
        p.id,
        p.categoria_id,
        c.nombre AS categoria,
        p.monto,
        p.mes,

        COALESCE(SUM(m.monto), 0) AS gastado,

        p.monto - COALESCE(SUM(m.monto), 0) AS disponible,

        ROUND(
          COALESCE(SUM(m.monto), 0) * 100.0 / p.monto,
          2
        ) AS porcentaje

      FROM presupuestos p

      INNER JOIN categorias c
        ON p.categoria_id = c.id

      LEFT JOIN movimientos m
        ON m.usuario_id = p.usuario_id
        AND m.categoria_id = p.categoria_id
        AND m.tipo = 'gasto'
        AND m.fecha >= p.mes || '-01'
        AND m.fecha < date(p.mes || '-01', '+1 month')

      WHERE p.usuario_id = ?
        AND p.mes = ?

      GROUP BY p.id

      ORDER BY c.nombre ASC
    `).all(req.usuario.id, mes);

    res.json(presupuestos);

  } catch (error) {
    console.error("Error al consultar presupuestos:", error);

    res.status(500).json({
      mensaje: "Error al consultar los presupuestos."
    });
  }
});

// Crear un presupuesto
router.post("/", (req, res) => {
  try {
    const { categoria_id, monto, mes } = req.body;

    if (
      !Number.isInteger(categoria_id) ||
      categoria_id <= 0 ||
      !Number.isFinite(monto) ||
      monto <= 0 ||
      !mesValido(mes)
    ) {
      return res.status(400).json({
        mensaje: "Verifica la categoría, el monto y el mes del presupuesto."
      });
    }

    const categoria = db.prepare(`
      SELECT id
      FROM categorias
      WHERE id = ? AND tipo = 'gasto'
    `).get(categoria_id);

    if (!categoria) {
      return res.status(400).json({
        mensaje: "Debes seleccionar una categoría de gasto válida."
      });
    }

    const resultado = db.prepare(`
      INSERT INTO presupuestos
        (usuario_id, categoria_id, monto, mes)
      VALUES (?, ?, ?, ?)
    `).run(
      req.usuario.id,
      categoria_id,
      monto,
      mes
    );

    const presupuesto = obtenerPresupuesto(
      resultado.lastInsertRowid,
      req.usuario.id
    );

    res.status(201).json(presupuesto);

  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        mensaje: "Ya existe un presupuesto para esta categoría y este mes."
      });
    }

    console.error("Error al crear presupuesto:", error);

    res.status(500).json({
      mensaje: "Error al crear el presupuesto."
    });
  }
});

// Actualizar un presupuesto
router.put("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { categoria_id, monto, mes } = req.body;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !Number.isInteger(categoria_id) ||
      categoria_id <= 0 ||
      !Number.isFinite(monto) ||
      monto <= 0 ||
      !mesValido(mes)
    ) {
      return res.status(400).json({
        mensaje: "Verifica los datos del presupuesto."
      });
    }

    const categoria = db.prepare(`
      SELECT id
      FROM categorias
      WHERE id = ? AND tipo = 'gasto'
    `).get(categoria_id);

    if (!categoria) {
      return res.status(400).json({
        mensaje: "Debes seleccionar una categoría de gasto válida."
      });
    }

    const resultado = db.prepare(`
      UPDATE presupuestos
      SET
        categoria_id = ?,
        monto = ?,
        mes = ?
      WHERE id = ?
        AND usuario_id = ?
    `).run(
      categoria_id,
      monto,
      mes,
      id,
      req.usuario.id
    );

    if (!resultado.changes) {
      return res.status(404).json({
        mensaje: "Presupuesto no encontrado."
      });
    }

    const actualizado = obtenerPresupuesto(id, req.usuario.id);

    res.json(actualizado);

  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({
        mensaje: "Ya existe un presupuesto para esta categoría y este mes."
      });
    }

    console.error("Error al actualizar presupuesto:", error);

    res.status(500).json({
      mensaje: "Error al actualizar el presupuesto."
    });
  }
});

// Eliminar un presupuesto
router.delete("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: "Identificador inválido."
      });
    }

    const resultado = db.prepare(`
      DELETE FROM presupuestos
      WHERE id = ?
        AND usuario_id = ?
    `).run(id, req.usuario.id);

    if (!resultado.changes) {
      return res.status(404).json({
        mensaje: "Presupuesto no encontrado."
      });
    }

    res.json({
      mensaje: "Presupuesto eliminado correctamente."
    });

  } catch (error) {
    console.error("Error al eliminar presupuesto:", error);

    res.status(500).json({
      mensaje: "Error al eliminar el presupuesto."
    });
  }
});

module.exports = router;