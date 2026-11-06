const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../database/db");

const router = express.Router();

// Registrar un usuario
router.post("/registro", (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios."
      });
    }

    const nombreLimpio = nombre.trim();
    const correoLimpio = correo.trim().toLowerCase();

    if (!nombreLimpio || !correoLimpio) {
      return res.status(400).json({
        mensaje: "El nombre y el correo son obligatorios."
      });
    }

    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(correoLimpio)) {
      return res.status(400).json({
        mensaje: "Ingresa un correo electrónico válido."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres."
      });
    }

    const usuarioExistente = db.prepare(
      "SELECT id FROM usuarios WHERE correo = ?"
    ).get(correoLimpio);

    if (usuarioExistente) {
      return res.status(409).json({
        mensaje: "Este correo ya está registrado."
      });
    }

    const passwordHash = bcrypt.hashSync(password, 12);

    const resultado = db.prepare(`
      INSERT INTO usuarios (nombre, correo, password)
      VALUES (?, ?, ?)
    `).run(nombreLimpio, correoLimpio, passwordHash);

    const usuario = {
      id: Number(resultado.lastInsertRowid),
      nombre: nombreLimpio,
      correo: correoLimpio
    };

    if (!process.env.JWT_SECRET) {
      console.error("Falta configurar JWT_SECRET en el archivo .env");

      return res.status(500).json({
        mensaje: "Error de configuración del servidor."
      });
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      mensaje: "Cuenta creada correctamente.",
      usuario,
      token
    });

  } catch (error) {
    console.error("Error al registrar usuario:", error);

    return res.status(500).json({
      mensaje: "No fue posible registrar el usuario."
    });
  }
});

// Iniciar sesión
router.post("/login", (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: "Ingresa tu correo y contraseña."
      });
    }

    const correoLimpio = correo.trim().toLowerCase();

    const usuario = db.prepare(`
      SELECT id, nombre, correo, password
      FROM usuarios
      WHERE correo = ?
    `).get(correoLimpio);

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos."
      });
    }

    const passwordValida = bcrypt.compareSync(
      password,
      usuario.password
    );

    if (!passwordValida) {
      return res.status(401).json({
        mensaje: "Correo o contraseña incorrectos."
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("Falta configurar JWT_SECRET en el archivo .env");

      return res.status(500).json({
        mensaje: "Error de configuración del servidor."
      });
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      mensaje: "Inicio de sesión correcto.",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo
      },
      token
    });

  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      mensaje: "No fue posible iniciar sesión."
    });
  }
});

module.exports = router;