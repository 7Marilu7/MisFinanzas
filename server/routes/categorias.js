const express = require("express");
const router = express.Router();
const db = require("../database/db");

router.get("/", (req, res) => {
  try {
    const categorias = db.prepare(`
      SELECT id, nombre, tipo
      FROM categorias
      ORDER BY tipo, nombre
    `).all();

    res.json(categorias);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al consultar las categorías."
    });
  }
});

module.exports = router;