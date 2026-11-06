const express = require("express");
const router = express.Router();
const db = require("../database/db");
const verificarToken = require("../middleware/verificarToken");

// Todas las rutas de este archivo requieren autenticación
router.use(verificarToken);

// Consultar únicamente los movimientos del usuario autenticado
router.get("/", (req, res) => {
  try {
    const movimientos = db.prepare(`
      SELECT
        m.id,
        m.descripcion,
        m.tipo,
        m.monto,
        m.fecha,
        m.categoria_id,
        c.nombre AS categoria
      FROM movimientos m
      LEFT JOIN categorias c ON m.categoria_id = c.id
      WHERE m.usuario_id = ?
      ORDER BY m.fecha DESC, m.id DESC
    `).all(req.usuario.id);

    res.json(movimientos);

  } catch (error) {
    console.error("Error al consultar movimientos:", error);

    res.status(500).json({
      mensaje: "Error al consultar movimientos."
    });
  }
});

// Registrar un movimiento para el usuario autenticado
router.post("/", (req, res) => {
  try {
    const { descripcion, categoria_id, tipo, monto, fecha } = req.body;

    if (
      typeof descripcion !== "string" ||
      !descripcion.trim() ||
      !["ingreso", "gasto"].includes(tipo) ||
      !Number.isFinite(monto) ||
      monto <= 0 ||
      !Number.isInteger(categoria_id) ||
      typeof fecha !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
      return res.status(400).json({
        mensaje: "Verifica los datos del movimiento."
      });
    }

    const categoria = db.prepare(`
      SELECT id
      FROM categorias
      WHERE id = ? AND tipo = ?
    `).get(categoria_id, tipo);

    if (!categoria) {
      return res.status(400).json({
        mensaje: "La categoría no corresponde al tipo de movimiento."
      });
    }

    const resultado = db.prepare(`
      INSERT INTO movimientos
      (usuario_id, descripcion, categoria_id, tipo, monto, fecha)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.usuario.id,
      descripcion.trim(),
      categoria_id,
      tipo,
      monto,
      fecha
    );

    const movimiento = db.prepare(`
      SELECT
        m.id,
        m.descripcion,
        m.categoria_id,
        m.tipo,
        m.monto,
        m.fecha,
        c.nombre AS categoria
      FROM movimientos m
      LEFT JOIN categorias c ON m.categoria_id = c.id
      WHERE m.id = ? AND m.usuario_id = ?
    `).get(resultado.lastInsertRowid, req.usuario.id);

    res.status(201).json(movimiento);

  } catch (error) {
    console.error("Error al registrar movimiento:", error);

    res.status(500).json({
      mensaje: "Error al registrar el movimiento."
    });
  }
});

// Actualizar únicamente movimientos del usuario autenticado
router.put("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { descripcion, categoria_id, tipo, monto, fecha } = req.body;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      typeof descripcion !== "string" ||
      !descripcion.trim() ||
      !["ingreso", "gasto"].includes(tipo) ||
      !Number.isFinite(monto) ||
      monto <= 0 ||
      !Number.isInteger(categoria_id) ||
      typeof fecha !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
      return res.status(400).json({
        mensaje: "Datos inválidos."
      });
    }

    const categoria = db.prepare(`
      SELECT id
      FROM categorias
      WHERE id = ? AND tipo = ?
    `).get(categoria_id, tipo);

    if (!categoria) {
      return res.status(400).json({
        mensaje: "Categoría inválida."
      });
    }

    const resultado = db.prepare(`
      UPDATE movimientos
      SET
        descripcion = ?,
        categoria_id = ?,
        tipo = ?,
        monto = ?,
        fecha = ?
      WHERE id = ? AND usuario_id = ?
    `).run(
      descripcion.trim(),
      categoria_id,
      tipo,
      monto,
      fecha,
      id,
      req.usuario.id
    );

    if (!resultado.changes) {
      return res.status(404).json({
        mensaje: "Movimiento no encontrado."
      });
    }

    const actualizado = db.prepare(`
      SELECT
        m.id,
        m.descripcion,
        m.categoria_id,
        m.tipo,
        m.monto,
        m.fecha,
        c.nombre AS categoria
      FROM movimientos m
      LEFT JOIN categorias c ON m.categoria_id = c.id
      WHERE m.id = ? AND m.usuario_id = ?
    `).get(id, req.usuario.id);

    res.json(actualizado);

  } catch (error) {
    console.error("Error al actualizar movimiento:", error);

    res.status(500).json({
      mensaje: "Error al actualizar el movimiento."
    });
  }
});

// Eliminar únicamente movimientos del usuario autenticado
router.delete("/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: "Identificador inválido."
      });
    }

    const resultado = db.prepare(`
      DELETE FROM movimientos
      WHERE id = ? AND usuario_id = ?
    `).run(id, req.usuario.id);

    if (!resultado.changes) {
      return res.status(404).json({
        mensaje: "Movimiento no encontrado."
      });
    }

    res.json({
      mensaje: "Movimiento eliminado correctamente."
    });

  } catch (error) {
    console.error("Error al eliminar movimiento:", error);

    res.status(500).json({
      mensaje: "Error al eliminar el movimiento."
    });
  }
});

module.exports = router;