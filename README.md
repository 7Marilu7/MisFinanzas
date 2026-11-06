# Mis Finanzas

Aplicación web para la administración de finanzas personales, desarrollada con React, Node.js, Express y SQLite.

## Descripción

Mis Finanzas es una aplicación web diseñada para facilitar el control y la organización de las finanzas personales. Permite administrar ingresos y gastos, consultar movimientos registrados, visualizar estadísticas financieras y establecer presupuestos mensuales por categoría.

La aplicación cuenta con un sistema de autenticación que permite a cada usuario acceder a su propia información financiera. Además, incorpora un dashboard con indicadores y gráficas que facilitan la comprensión de los ingresos, gastos y comportamiento financiero.

Su desarrollo busca ofrecer una herramienta práctica para llevar un mejor seguimiento del dinero, identificar hábitos de gasto y mantener un control organizado de los presupuestos personales.

## Funcionalidades

- Registro de usuarios e inicio de sesión.
- Autenticación mediante tokens JWT.
- Gestión de movimientos financieros (ingresos y gastos).
- Registro, edición y eliminación de movimientos.
- Clasificación de movimientos mediante categorías.
- Dashboard con resumen de ingresos, gastos y balance disponible.
- Visualización de movimientos recientes.
- Gráficas para consultar el comportamiento de ingresos y gastos.
- Estadísticas financieras por diferentes periodos.
- Distribución de gastos por categoría.
- Visualización de las principales categorías de gasto (Top 3).
- Creación, edición y eliminación de presupuestos mensuales.
- Asignación de presupuestos por categoría de gasto.
- Cálculo automático de gastos acumulados y saldo disponible.
- Indicadores visuales del porcentaje de presupuesto utilizado.
- Identificación de presupuestos próximos a alcanzar o que superan el límite establecido.
- Separación de la información financiera de cada usuario.

## Tecnologías utilizadas

**Frontend**
- React
- Vite
- JavaScript
- HTML5
- CSS3
- Recharts
- Lucide React

**Backend**
- Node.js
- Express
- JavaScript
- JSON Web Token (JWT)
- bcryptjs
- better-sqlite3
- CORS
- dotenv

**Base de datos**
- SQLite

## Estructura del proyecto

```text
MisFinanzas/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── services/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── server/
│   ├── database/
│   ├── middleware/
│   ├── routes/
├── .gitignore
└── README.md
```

## Instalación local

1. Instala Node.js y npm.

2. Clona este repositorio:

```bash
git clone https://github.com/7Marilu7/MisFinanzas.git
```

3. Accede a la carpeta principal del proyecto:

```bash
cd MisFinanzas
```

4. Instala las dependencias del frontend:

```bash
cd client
npm install
```

5. Instala las dependencias del backend:

```bash
cd ../server
npm install
```

6. Crea un archivo `.env` dentro de la carpeta `server` y configura la clave secreta para JWT:

```env
JWT_SECRET=tu_clave_secreta_segura
```

7. Inicia el servidor backend desde la carpeta `server`:

```bash
npm run dev
```

8. Abre una segunda terminal, accede a la carpeta `client` e inicia el frontend:

```bash
cd client
npm run dev
```

9. Abre en tu navegador la dirección que proporciona Vite, normalmente:

`http://localhost:5173`

## Base de datos

El proyecto utiliza SQLite mediante la biblioteca better-sqlite3 para almacenar la información financiera.

La base de datos se inicializa automáticamente al ejecutar el servidor backend. Se crean las tablas necesarias para administrar:

- Usuarios.
- Categorías de ingresos y gastos.
- Movimientos financieros.
- Presupuestos mensuales.

Cada movimiento y presupuesto se relaciona con el usuario correspondiente, permitiendo mantener separada la información de cada cuenta.

## Seguridad

- Contraseñas protegidas mediante hash con bcryptjs.
- Autenticación mediante tokens JWT.
- Protección de rutas del backend mediante middleware.
- Consultas de movimientos y presupuestos limitadas al usuario autenticado.
- Variables de entorno para almacenar la clave secreta de autenticación.

## Estado del proyecto

Proyecto desarrollado como parte de un portafolio personal para demostrar conocimientos en desarrollo web full-stack, gestión de bases de datos, autenticación de usuarios y visualización de información financiera.

## Autoría

Desarrollado por **María Guadalupe Cruz Paz**.

[GitHub](https://github.com/7Marilu7)
