require("dotenv").config();

const express = require("express");
const cors = require("cors");


// Inicializar base de datos
require("./database/db");

const movimientosRoutes = require("./routes/movimientos");
const categoriasRoutes = require("./routes/categorias");
const estadisticasRoutes = require("./routes/estadisticas");
const authRoutes = require("./routes/auth");
const presupuestosRoutes = require("./routes/presupuestos");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "API de Mis Finanzas funcionando correctamente 💜"
  });
});

app.use("/api/movimientos", movimientosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/estadisticas", estadisticasRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/presupuestos", presupuestosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});