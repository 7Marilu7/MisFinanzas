const express = require("express");
const router = express.Router();
const db = require("../database/db");
const verificarToken = require("../middleware/verificarToken");

// Todas las estadísticas requieren autenticación
router.use(verificarToken);

// Obtener la fecha local en formato YYYY-MM-DD
function obtenerFechaLocal(fecha) {
  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0")
  ].join("-");
}

// Obtener el periodo solicitado
function obtenerRango(periodo, usuarioId) {
  const hoy = new Date();

  let fechaInicio;

  switch (periodo) {
    case "mes":
      fechaInicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      );
      break;

    case "3meses":
      fechaInicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - 2,
        1
      );
      break;

    case "6meses":
      fechaInicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - 5,
        1
      );
      break;

    case "anio":
      fechaInicio = new Date(
        hoy.getFullYear(),
        0,
        1
      );
      break;

    case "todo": {
      const primerMovimiento = db.prepare(`
        SELECT MIN(fecha) AS fecha
        FROM movimientos
        WHERE usuario_id = ?
      `).get(usuarioId);

      if (primerMovimiento?.fecha) {
        const partes = primerMovimiento.fecha.split("-");

        fechaInicio = new Date(
          Number(partes[0]),
          Number(partes[1]) - 1,
          1
        );
      } else {
        fechaInicio = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          1
        );
      }

      break;
    }

    default:
      return null;
  }

  return {
    inicio: obtenerFechaLocal(fechaInicio),
    fin: obtenerFechaLocal(hoy),
    fechaInicio
  };
}

// Obtener estadísticas mensuales
router.get("/mensuales", (req, res) => {
  try {
    const periodo = req.query.periodo || "6meses";
    const rango = obtenerRango(periodo, req.usuario.id);

    if (!rango) {
      return res.status(400).json({
        mensaje: "El periodo seleccionado no es válido."
      });
    }

    const resultados = db.prepare(`
      SELECT
        strftime('%Y-%m', fecha) AS mes,
        SUM(
          CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END
        ) AS ingresos,
        SUM(
          CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END
        ) AS gastos
      FROM movimientos
      WHERE fecha >= ?
        AND fecha <= ?
        AND usuario_id = ?
      GROUP BY strftime('%Y-%m', fecha)
      ORDER BY mes ASC
    `).all(
      rango.inicio,
      rango.fin,
      req.usuario.id
    );

    const meses = [];
    const hoy = new Date();

    let fechaActual = new Date(
      rango.fechaInicio.getFullYear(),
      rango.fechaInicio.getMonth(),
      1
    );

    while (
      fechaActual.getFullYear() < hoy.getFullYear() ||
      (
        fechaActual.getFullYear() === hoy.getFullYear() &&
        fechaActual.getMonth() <= hoy.getMonth()
      )
    ) {
      const clave = [
        fechaActual.getFullYear(),
        String(fechaActual.getMonth() + 1).padStart(2, "0")
      ].join("-");

      const nombreMes = fechaActual.toLocaleDateString("es-MX", {
        month: "short"
      });

      const registro = resultados.find(
        (item) => item.mes === clave
      );

      let nombre = nombreMes.charAt(0).toUpperCase() +
        nombreMes.slice(1).replace(".", "");

      // En todo el historial mostramos el año para distinguir meses
      if (periodo === "todo") {
        nombre += ` ${fechaActual.getFullYear()}`;
      }

      meses.push({
        mes: nombre,
        ingresos: Number(registro?.ingresos || 0),
        gastos: Number(registro?.gastos || 0)
      });

      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }

    res.json(meses);

  } catch (error) {
    console.error("Error en estadísticas mensuales:", error);

    res.status(500).json({
      mensaje: "No se pudieron obtener las estadísticas mensuales."
    });
  }
});

// Obtener gastos por categoría
router.get("/categorias", (req, res) => {
  try {
    const periodo = req.query.periodo || "6meses";
    const rango = obtenerRango(periodo, req.usuario.id);

    if (!rango) {
      return res.status(400).json({
        mensaje: "El periodo seleccionado no es válido."
      });
    }

    const resultados = db.prepare(`
      SELECT
        c.id,
        c.nombre AS nombre,
        SUM(m.monto) AS total
      FROM movimientos m
      INNER JOIN categorias c
        ON m.categoria_id = c.id
      WHERE m.tipo = 'gasto'
        AND m.fecha >= ?
        AND m.fecha <= ?
        AND m.usuario_id = ?
      GROUP BY c.id, c.nombre
      ORDER BY total DESC
    `).all(
      rango.inicio,
      rango.fin,
      req.usuario.id
    );

    const totalGastos = resultados.reduce(
      (sum, item) => sum + Number(item.total),
      0
    );

    const colores = [
      "#A78BFA",
      "#E9A8CC",
      "#F5C2A8",
      "#B8C5F2",
      "#A8DCC5",
      "#F2D18B",
      "#B7A3E8"
    ];

    const categorias = resultados.map((item, index) => ({
      name: item.nombre,
      total: Number(item.total),
      value: totalGastos > 0
        ? Number(
            (
              (Number(item.total) / totalGastos) * 100
            ).toFixed(1)
          )
        : 0,
      color: colores[index % colores.length]
    }));

    res.json(categorias);

  } catch (error) {
    console.error("Error en gastos por categoría:", error);

    res.status(500).json({
      mensaje: "No se pudieron obtener los gastos por categoría."
    });
  }
});

module.exports = router;