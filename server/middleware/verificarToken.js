const jwt = require("jsonwebtoken");
const db = require("../database/db");

function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        mensaje: "Debes iniciar sesión para continuar."
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("Falta configurar JWT_SECRET.");

      return res.status(500).json({
        mensaje: "Error de configuración del servidor."
      });
    }

    const datosToken = jwt.verify(token, process.env.JWT_SECRET);

    // Comprobar que el usuario todavía exista
    const usuario = db.prepare(`
      SELECT id, nombre, correo
      FROM usuarios
      WHERE id = ?
    `).get(datosToken.id);

    if (!usuario) {
      return res.status(401).json({
        mensaje: "La cuenta asociada a esta sesión ya no existe."
      });
    }

    req.usuario = usuario;

    next();

  } catch (error) {
    return res.status(401).json({
      mensaje: "La sesión no es válida o ha expirado. Inicia sesión nuevamente."
    });
  }
}

module.exports = verificarToken;