
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databaseFolder = path.join(__dirname);
const databasePath = path.join(databaseFolder, "mis_finanzas.db");

if (!fs.existsSync(databaseFolder)) {
  fs.mkdirSync(databaseFolder, { recursive: true });
}

const db = new Database(databasePath);

// Configuración de SQLite
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'gasto'))
  );

  CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    categoria_id INTEGER,
    tipo TEXT NOT NULL CHECK(tipo IN ('ingreso', 'gasto')),
    descripcion TEXT NOT NULL,
    monto REAL NOT NULL CHECK(monto > 0),
    fecha TEXT NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
  );

  CREATE TABLE IF NOT EXISTS presupuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    monto REAL NOT NULL CHECK(monto > 0),
    mes TEXT NOT NULL,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
      REFERENCES usuarios(id)
      ON DELETE CASCADE,

    FOREIGN KEY (categoria_id)
      REFERENCES categorias(id),

    UNIQUE (usuario_id, categoria_id, mes)
  );
`);

// Insertar categorías iniciales
const insertCategory = db.prepare(`
  INSERT INTO categorias (nombre, tipo)
  SELECT ?, ?
  WHERE NOT EXISTS (
    SELECT 1 FROM categorias WHERE nombre = ? AND tipo = ?
  )
`);

const categories = [
  ["Salario", "ingreso"],
  ["Ventas", "ingreso"],
  ["Otros ingresos", "ingreso"],
  ["Alimentación", "gasto"],
  ["Transporte", "gasto"],
  ["Servicios", "gasto"],
  ["Entretenimiento", "gasto"],
  ["Salud", "gasto"],
  ["Otros", "gasto"]
];

const insertMany = db.transaction((items) => {
  for (const [name, type] of items) {
    insertCategory.run(name, type, name, type);
  }
});

insertMany(categories);

module.exports = db;