const API_URL = "http://localhost:3000/api";

// Función central para realizar peticiones al backend
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("mis_finanzas_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensaje || "Error en la solicitud.");
  }

  return data;
}

// MOVIMIENTOS

export const obtenerMovimientos = () =>
  request("/movimientos");

export const crearMovimiento = (movimiento) =>
  request("/movimientos", {
    method: "POST",
    body: JSON.stringify(movimiento)
  });

export const actualizarMovimiento = (id, movimiento) =>
  request(`/movimientos/${id}`, {
    method: "PUT",
    body: JSON.stringify(movimiento)
  });

export const eliminarMovimiento = (id) =>
  request(`/movimientos/${id}`, {
    method: "DELETE"
  });

// CATEGORÍAS

export const obtenerCategorias = () =>
  request("/categorias");

// ESTADÍSTICAS

export const obtenerEstadisticasMensuales = (periodo = "6meses") =>
  request(`/estadisticas/mensuales?periodo=${periodo}`);

export const obtenerGastosPorCategoria = (periodo = "6meses") =>
  request(`/estadisticas/categorias?periodo=${periodo}`);

// PRESUPUESTOS

// Consultar presupuestos de un mes
export const obtenerPresupuestos = (mes) =>
  request(`/presupuestos?mes=${mes}`);

// Crear presupuesto
export const crearPresupuesto = (presupuesto) =>
  request("/presupuestos", {
    method: "POST",
    body: JSON.stringify(presupuesto)
  });

// Actualizar presupuesto
export const actualizarPresupuesto = (id, presupuesto) =>
  request(`/presupuestos/${id}`, {
    method: "PUT",
    body: JSON.stringify(presupuesto)
  });

// Eliminar presupuesto
export const eliminarPresupuesto = (id) =>
  request(`/presupuestos/${id}`, {
    method: "DELETE"
  });