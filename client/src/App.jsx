import { useState, useEffect } from "react";

import {
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Target,
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  LogOut,
  X,
  Pencil,
  Trash2,
  CircleAlert,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";

import {
  obtenerMovimientos,
  obtenerCategorias,
  crearMovimiento,
  actualizarMovimiento,
  eliminarMovimiento,
  obtenerEstadisticasMensuales,
  obtenerGastosPorCategoria,
  obtenerPresupuestos,
  crearPresupuesto,
  actualizarPresupuesto,
  eliminarPresupuesto
} from "./services/api";

import "./App.css";
import Auth from "./components/Auth";

// Secciones del menú
const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Movimientos", icon: ArrowLeftRight },
  { name: "Estadísticas", icon: ChartNoAxesCombined },
  { name: "Presupuestos", icon: Target }
];

// Formato de moneda mexicana
const money = (value) =>
  Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2
  });

// Formato de fechas
function formatDate(date) {
  if (!date) return "";

  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// Fecha local en formato YYYY-MM-DD
function getTodayDate() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
}

// Mes local en formato YYYY-MM
function getCurrentMonth() {
  return getTodayDate().slice(0, 7);
}

// Nombre del mes
function formatMonth(month) {
  if (!month) return "";

  const [year, monthNumber] = month.split("-");

  return new Date(Number(year), Number(monthNumber) - 1, 1)
    .toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric"
    });
}

function App() {
  // Usuario autenticado
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem("mis_finanzas_token");
      const savedUser = localStorage.getItem("mis_finanzas_usuario");

      return token && savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const handleAuthenticated = (data) => {
    localStorage.setItem("mis_finanzas_token", data.token);
    localStorage.setItem("mis_finanzas_usuario", JSON.stringify(data.usuario));
    setCurrentUser(data.usuario);
  };

  // Datos provenientes del backend
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Datos de las gráficas del Dashboard
  const [chartData, setChartData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);

  // Datos de la página de Estadísticas
  const [statsChartData, setStatsChartData] = useState([]);
  const [statsExpenseData, setStatsExpenseData] = useState([]);
  const [statsPeriod, setStatsPeriod] = useState("6meses");
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsReload, setStatsReload] = useState(0);

  // Datos de Presupuestos
  const [budgets, setBudgets] = useState([]);
  const [budgetMonth, setBudgetMonth] = useState(getCurrentMonth());
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [budgetReload, setBudgetReload] = useState(0);
  const [budgetSaving, setBudgetSaving] = useState(false);

  // Navegación y modales
  const [activePage, setActivePage] = useState("Dashboard");
  const [showModal, setShowModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingBudgetId, setEditingBudgetId] = useState(null);

  // Formulario de movimientos
  const [form, setForm] = useState({
    description: "",
    category_id: "",
    amount: "",
    type: "gasto",
    date: getTodayDate()
  });

  // Formulario de presupuestos
  const [budgetForm, setBudgetForm] = useState({
    categoria_id: "",
    monto: "",
    mes: getCurrentMonth()
  });

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("mis_finanzas_token");
    localStorage.removeItem("mis_finanzas_usuario");

    setCurrentUser(null);
    setTransactions([]);
    setCategories([]);
    setChartData([]);
    setExpenseData([]);
    setStatsChartData([]);
    setStatsExpenseData([]);
    setBudgets([]);
    setActivePage("Dashboard");
  };

  // Consultar nuevamente movimientos y categorías
  const recargarDatos = async () => {
    const [
      movimientosData,
      categoriasData,
      estadisticasData,
      gastosCategoriaData
    ] = await Promise.all([
      obtenerMovimientos(),
      obtenerCategorias(),
      obtenerEstadisticasMensuales(),
      obtenerGastosPorCategoria()
    ]);

    setTransactions(movimientosData);
    setCategories(categoriasData);
    setChartData(estadisticasData);
    setExpenseData(gastosCategoriaData);
  };

  // Carga inicial
  useEffect(() => {
    async function cargarDatos() {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await recargarDatos();
      } catch (error) {
        console.error("Error al cargar datos:", error);
        alert("No se pudieron cargar los datos del servidor.");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [currentUser]);

  // Cargar estadísticas
  useEffect(() => {
    if (!currentUser || activePage !== "Estadísticas") {
      return;
    }

    let cancelado = false;

    async function cargarEstadisticas() {
      try {
        setStatsLoading(true);
        setStatsError("");

        const [
          datosMensuales,
          datosCategorias
        ] = await Promise.all([
          obtenerEstadisticasMensuales(statsPeriod),
          obtenerGastosPorCategoria(statsPeriod)
        ]);

        if (!cancelado) {
          setStatsChartData(datosMensuales);
          setStatsExpenseData(datosCategorias);
        }
      } catch (error) {
        console.error("Error al cargar estadísticas:", error);

        if (!cancelado) {
          setStatsError(
            error.message || "No se pudieron cargar las estadísticas."
          );
        }
      } finally {
        if (!cancelado) {
          setStatsLoading(false);
        }
      }
    }

    cargarEstadisticas();

    return () => {
      cancelado = true;
    };
  }, [currentUser, activePage, statsPeriod, statsReload]);

  // Cargar presupuestos al abrir la sección o cambiar de mes
  useEffect(() => {
    if (!currentUser || activePage !== "Presupuestos") {
      return;
    }

    let cancelado = false;

    async function cargarPresupuestos() {
      try {
        setBudgetLoading(true);
        setBudgetError("");

        const datos = await obtenerPresupuestos(budgetMonth);

        if (!cancelado) {
          setBudgets(datos);
        }
      } catch (error) {
        console.error("Error al cargar presupuestos:", error);

        if (!cancelado) {
          setBudgetError(
            error.message || "No se pudieron cargar los presupuestos."
          );
        }
      } finally {
        if (!cancelado) {
          setBudgetLoading(false);
        }
      }
    }

    cargarPresupuestos();

    return () => {
      cancelado = true;
    };
}, [currentUser, activePage, budgetMonth, budgetReload]);

  // Recargar presupuestos manualmente
  const recargarPresupuestos = async () => {
    const datos = await obtenerPresupuestos(budgetMonth);
    setBudgets(datos);
  };

  // Calcular ingresos
  const income = transactions
    .filter((t) => t.tipo === "ingreso")
    .reduce((sum, t) => sum + Number(t.monto), 0);

  // Calcular gastos
  const expenses = transactions
    .filter((t) => t.tipo === "gasto")
    .reduce((sum, t) => sum + Number(t.monto), 0);

  // Calcular balance
  const balance = income - expenses;

  // Totales de Estadísticas
  const statsIncome = statsChartData.reduce(
    (sum, item) => sum + Number(item.ingresos || 0),
    0
  );

  const statsExpenses = statsChartData.reduce(
    (sum, item) => sum + Number(item.gastos || 0),
    0
  );

  const statsBalance = statsIncome - statsExpenses;

  const statsSavingsPercentage = statsIncome > 0
    ? ((statsBalance / statsIncome) * 100).toFixed(1)
    : "0.0";

  const periodLabel = {
    mes: "Este mes",
    "3meses": "Últimos 3 meses",
    "6meses": "Últimos 6 meses",
    anio: "Este año",
    todo: "Todo el historial"
  };

  // Obtener las tres categorías con mayor gasto
  const topCategories = [...statsExpenseData]
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 3);

  // Totales de Presupuestos
  const totalBudget = budgets.reduce(
    (sum, item) => sum + Number(item.monto || 0),
    0
  );

  const totalBudgetSpent = budgets.reduce(
    (sum, item) => sum + Number(item.gastado || 0),
    0
  );

  const totalBudgetAvailable = totalBudget - totalBudgetSpent;

  const budgetPercentage = totalBudget > 0
    ? (totalBudgetSpent / totalBudget) * 100
    : 0;

  // Categorías de gasto
  const expenseCategories = categories.filter(
    (category) => category.tipo === "gasto"
  );

  // Categorías que todavía no tienen presupuesto en el mes seleccionado
  const availableBudgetCategories = expenseCategories.filter(
    (category) =>
      !budgets.some(
        (budget) =>
          Number(budget.categoria_id) === Number(category.id) &&
          budget.id !== editingBudgetId
      )
  );

  // Abrir formulario para un movimiento nuevo
  const openModal = () => {
    setEditingId(null);

    const primeraCategoria = categories.find(
      (category) => category.tipo === "gasto"
    );

    setForm({
      description: "",
      category_id: primeraCategoria ? String(primeraCategoria.id) : "",
      amount: "",
      type: "gasto",
      date: getTodayDate()
    });

    setShowModal(true);
  };

  // Abrir formulario para editar movimiento
  const openEditModal = (movimiento) => {
    setEditingId(movimiento.id);

    setForm({
      description: movimiento.descripcion || "",
      category_id: String(movimiento.categoria_id || ""),
      amount: String(movimiento.monto ?? ""),
      type: movimiento.tipo,
      date: movimiento.fecha || getTodayDate()
    });

    setShowModal(true);
  };

  // Cerrar formulario de movimientos
  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
  };

  // Cambiar tipo de movimiento
  const changeType = (type) => {
    const firstCategory = categories.find(
      (category) => category.tipo === type
    );

    setForm((previous) => ({
      ...previous,
      type,
      category_id: firstCategory ? String(firstCategory.id) : ""
    }));
  };

  // Crear o actualizar movimiento
  const saveTransaction = async (e) => {
    e.preventDefault();

    if (
      !form.description.trim() ||
      !form.category_id ||
      !form.amount ||
      Number(form.amount) <= 0 ||
      !form.date
    ) {
      alert("Completa todos los campos correctamente.");
      return;
    }

    const movimiento = {
      descripcion: form.description.trim(),
      categoria_id: Number(form.category_id),
      tipo: form.type,
      monto: Number(form.amount),
      fecha: form.date
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await actualizarMovimiento(editingId, movimiento);
      } else {
        await crearMovimiento(movimiento);
      }

      await recargarDatos();

      // Si se está consultando Presupuestos, actualizar sus gastos
      if (activePage === "Presupuestos") {
        await recargarPresupuestos();
      }

      setShowModal(false);
      setEditingId(null);

      setForm({
        description: "",
        category_id: "",
        amount: "",
        type: "gasto",
        date: getTodayDate()
      });

      alert(
        editingId !== null
          ? "Movimiento actualizado correctamente."
          : "Movimiento registrado correctamente."
      );
    } catch (error) {
      console.error("Error al guardar movimiento:", error);
      alert(error.message || "No se pudo guardar el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar movimiento
  const deleteTransaction = async (id) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    try {
      await eliminarMovimiento(id);
      await recargarDatos();

      if (activePage === "Presupuestos") {
        await recargarPresupuestos();
      }

      alert("Movimiento eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar movimiento:", error);
      alert(error.message || "No se pudo eliminar el movimiento.");
    }
  };

  // Abrir formulario de presupuesto nuevo
  const openBudgetModal = () => {
    setEditingBudgetId(null);

    const primeraCategoria = expenseCategories.find(
      (category) =>
        !budgets.some(
          (budget) =>
            Number(budget.categoria_id) === Number(category.id)
        )
    );

    setBudgetForm({
      categoria_id: primeraCategoria ? String(primeraCategoria.id) : "",
      monto: "",
      mes: budgetMonth
    });

    setShowBudgetModal(true);
  };

  // Abrir formulario para editar presupuesto
  const openEditBudgetModal = (budget) => {
    setEditingBudgetId(budget.id);

    setBudgetForm({
      categoria_id: String(budget.categoria_id),
      monto: String(budget.monto),
      mes: budget.mes
    });

    setShowBudgetModal(true);
  };

  // Cerrar formulario de presupuesto
  const closeBudgetModal = () => {
    if (budgetSaving) return;

    setShowBudgetModal(false);
    setEditingBudgetId(null);
  };

  // Guardar presupuesto
  const saveBudget = async (e) => {
    e.preventDefault();

    if (
      !budgetForm.categoria_id ||
      !budgetForm.monto ||
      Number(budgetForm.monto) <= 0 ||
      !budgetForm.mes
    ) {
      alert("Completa todos los campos correctamente.");
      return;
    }

    const presupuesto = {
      categoria_id: Number(budgetForm.categoria_id),
      monto: Number(budgetForm.monto),
      mes: budgetForm.mes
    };

    try {
      setBudgetSaving(true);

      if (editingBudgetId !== null) {
        await actualizarPresupuesto(editingBudgetId, presupuesto);
      } else {
        await crearPresupuesto(presupuesto);
      }

      // Actualizar el mes seleccionado si se editó el periodo
      setBudgetMonth(budgetForm.mes);

      const datos = await obtenerPresupuestos(budgetForm.mes);
      setBudgets(datos);

      setShowBudgetModal(false);
      setEditingBudgetId(null);

      alert(
        editingBudgetId !== null
          ? "Presupuesto actualizado correctamente."
          : "Presupuesto creado correctamente."
      );
    } catch (error) {
      console.error("Error al guardar presupuesto:", error);
      alert(error.message || "No se pudo guardar el presupuesto.");
    } finally {
      setBudgetSaving(false);
    }
  };

  // Eliminar presupuesto
  const deleteBudget = async (id) => {
    const confirmar = window.confirm(
      "¿Estás segura de que deseas eliminar este presupuesto?"
    );

    if (!confirmar) return;

    try {
      await eliminarPresupuesto(id);
      await recargarPresupuestos();

      alert("Presupuesto eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar presupuesto:", error);
      alert(error.message || "No se pudo eliminar el presupuesto.");
    }
  };

  // Icono según el tipo de movimiento
  const getTransactionIcon = (type) =>
    type === "ingreso" ? Wallet : ShoppingBag;

  // Estado visual del presupuesto
  const getBudgetStatus = (percentage) => {
    if (percentage >= 100) {
      return {
        className: "danger",
        label: "Presupuesto superado",
        icon: AlertTriangle
      };
    }

    if (percentage >= 80) {
      return {
        className: "warning",
        label: "Estás cerca del límite",
        icon: CircleAlert
      };
    }

    return {
      className: "normal",
      label: "Dentro del presupuesto",
      icon: CheckCircle2
    };
  };

  if (!currentUser) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="app-container">
      {/* BARRA LATERAL */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Wallet size={23} />
          </div>

          <span>
            Mis <strong>Finanzas</strong>
          </span>
        </div>

        <p className="menu-label">MENÚ PRINCIPAL</p>

        <nav className="nav-menu">
          {navigation.map(({ name, icon: Icon }) => (
            <button key={name} className={`nav-item ${activePage === name ? "active" : ""}`} onClick={() => setActivePage(name)}>
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">✦</div>
            <strong>¡Pequeños pasos!</strong>
            <p>Organizar tu dinero hoy te acerca a tus metas de mañana.</p>
          </div>

          <div className="profile">
            <div className="avatar">
              {(currentUser.nombre || "MF").slice(0, 2).toUpperCase()}
            </div>

            <div className="profile-info">
              <strong>{currentUser.nombre}</strong>
              <small>{currentUser.correo}</small>
            </div>

            <button type="button" className="logout-btn" onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="date-label">
              {new Date()
                .toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                })
                .toUpperCase()}
            </span>

            <h1>
              {activePage === "Dashboard"
                ? "¡Hola! Bienvenid@ 👋"
                : activePage}
            </h1>

            <p className="subtitle">
              {activePage === "Dashboard"
                ? "Aquí tienes el resumen de tus finanzas."
                : activePage === "Movimientos"
                ? "Administra tus ingresos y gastos registrados."
                : activePage === "Presupuestos"
                ? "Planifica tus gastos y mantén tus finanzas bajo control."
                : "Consulta y organiza tu información financiera."}
            </p>
          </div>

          <div className="top-actions">
            {activePage === "Presupuestos" ? (
              <button className="primary-btn" onClick={openBudgetModal} type="button" disabled={availableBudgetCategories.length === 0 && editingBudgetId === null}> <Plus size={18} />Nuevo presupuesto</button>
            ) : (
              <button className="primary-btn" onClick={openModal} type="button"> <Plus size={18} />Nuevo movimiento</button>
            )}
          </div>
        </header>

        {/* DASHBOARD */}
        {activePage === "Dashboard" ? (
          <>
            <section className="summary-grid">

              <article className="summary-card balance-card">
                <div className="card-top">
                  <span>Balance total</span>
                  <div className="card-icon purple">
                    <Wallet size={20} />
                  </div>
                </div>

                <h2>{money(balance)}</h2>
                <p className="card-note">Ingresos menos gastos registrados</p>
              </article>

              <article className="summary-card">
                <div className="card-top">
                  <span>Ingresos</span>
                  <div className="card-icon green">
                    <TrendingUp size={20} />
                  </div>
                </div>

                <h2>{money(income)}</h2>
                <p className="card-note">Total de ingresos registrados</p>
              </article>

              <article className="summary-card">
                <div className="card-top">
                  <span>Gastos</span>
                  <div className="card-icon pink">
                    <TrendingDown size={20} />
                  </div>
                </div>

                <h2>{money(expenses)}</h2>
                <p className="card-note">Total de gastos registrados</p>
              </article>
            </section>

            <section className="charts-grid">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Resumen financiero</h3>
                    <p>Comparación de ingresos y gastos</p>
                  </div>

                  <span className="period-tag">Últimos 6 meses</span>
                </div>

                <div className="chart-container">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barGap={7}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EAF4"/>
                        <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "#9890A5", fontSize: 12 }}/>
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9890A5", fontSize: 11 }}/>
                        <Tooltip formatter={(value) => money(value)}/>
                        <Bar dataKey="ingresos" name="Ingresos" fill="#A78BFA" radius={[5, 5, 0, 0]}/>
                        <Bar dataKey="gastos" name="Gastos" fill="#E9B8D5" radius={[5, 5, 0, 0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>No hay información mensual disponible.</p>
                  )}
                </div>

                <div className="chart-legend">
                  <span> <i className="legend-dot lavender"></i>Ingresos</span>
                  <span><i className="legend-dot rose"></i>Gastos</span>
                </div>
              </article>

              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Gastos por categoría</h3>
                    <p>Distribución de tus gastos</p>
                  </div>
                </div>

                <div className="pie-container">
                  {expenseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={57} outerRadius={82} paddingAngle={4}>
                          {expenseData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>

                        <Tooltip formatter={(value) => `${value}%`}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p>Todavía no tienes gastos registrados.</p>
                  )}
                </div>

                <div className="category-list">
                  {expenseData.map((item) => (
                    <div className="category-row" key={item.name}>
                      <span>
                        <i style={{ background: item.color }}></i>
                        {item.name}
                      </span>

                      <strong>{item.value}%</strong>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="panel transactions-panel">
              <div className="panel-heading">
                <div>
                  <h3>Movimientos recientes</h3>
                  <p>Consulta tus últimos ingresos y gastos</p>
                </div>

                <button className="text-btn" onClick={() => setActivePage("Movimientos")} type="button"> Ver todos →</button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>CONCEPTO</th>
                      <th>CATEGORÍA</th>
                      <th>FECHA</th>
                      <th>MONTO</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4">Cargando movimientos...</td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan="4">Todavía no tienes movimientos registrados.</td>
                      </tr>
                    ) : (
                      transactions.slice(0, 3).map((item) => {
                        const Icon = getTransactionIcon(item.tipo);

                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="transaction-name">
                                <div className={`transaction-icon ${item.tipo}`}>
                                  <Icon size={17} />
                                </div>
                                <strong>{item.descripcion}</strong>
                              </div>
                            </td>

                            <td>{item.categoria}</td>
                            <td>{formatDate(item.fecha)}</td>

                            <td className={ item.tipo === "ingreso" ? "amount-income" : "amount-expense"}> {item.tipo === "ingreso" ? "+" : "-"} {money(item.monto)} </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : activePage === "Movimientos" ? (
          /* PÁGINA DE MOVIMIENTOS */
          <section className="panel transactions-panel">
            <div className="panel-heading">
              <div>
                <h3>Todos tus movimientos</h3>
                <p>
                  {transactions.length}{" "}
                  {transactions.length === 1
                    ? "movimiento registrado"
                    : "movimientos registrados"}
                </p>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>CONCEPTO</th>
                    <th>TIPO</th>
                    <th>CATEGORÍA</th>
                    <th>FECHA</th>
                    <th>MONTO</th>
                    <th>ACCIONES</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6">Cargando movimientos...</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6">Todavía no tienes movimientos registrados.</td>
                    </tr>
                  ) : (
                    transactions.map((item) => {
                      const Icon = getTransactionIcon(item.tipo);

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="transaction-name">
                              <div className={`transaction-icon ${item.tipo}`}> <Icon size={17} /></div>
                              <strong>{item.descripcion}</strong>
                            </div>
                          </td>

                          <td>{item.tipo === "ingreso" ? "Ingreso" : "Gasto"}</td>
                          <td>{item.categoria}</td>
                          <td>{formatDate(item.fecha)}</td>

                          <td className={item.tipo === "ingreso" ? "amount-income": "amount-expense"}> {item.tipo === "ingreso" ? "+" : "-"} {money(item.monto)}</td>

                          <td>
                            <div className="movement-actions">
                              <button type="button"className="action-btn edit-btn" title="Editar movimiento" aria-label={`Editar ${item.descripcion}`} onClick={() => openEditModal(item)}>
                                <Pencil size={17} />
                              </button>

                              <button type="button" className="action-btn delete-btn" title="Eliminar movimiento" aria-label={`Eliminar ${item.descripcion}`} onClick={() => deleteTransaction(item.id)}>
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : activePage === "Estadísticas" ? (
          /* PÁGINA DE ESTADÍSTICAS */
          <section className="statistics-page">
            <div className="panel statistics-filter-panel">
              <div className="panel-heading">
                <div>
                  <h3>Análisis financiero</h3>
                  <p>Explora el comportamiento de tus ingresos y gastos.</p>
                </div>

                <select
                  value={statsPeriod}
                  onChange={(e) => setStatsPeriod(e.target.value)}
                  className="stats-period-select"
                  aria-label="Seleccionar periodo de estadísticas">
                  <option value="mes">Este mes</option>
                  <option value="3meses">Últimos 3 meses</option>
                  <option value="6meses">Últimos 6 meses</option>
                  <option value="anio">Este año</option>
                  <option value="todo">Todo el historial</option>
                </select>
              </div>
            </div>

            {statsError ? (
              <div className="panel statistics-message">
                <p>{statsError}</p>

                <button type="button" className="primary-btn" onClick={() => setBudgetReload((value) => value + 1)}> Reintentar </button>
              </div>
            ) : statsLoading ? (
              <div className="panel statistics-message">
                <p>Cargando estadísticas...</p>
              </div>
            ) : (
              <>
                <section className="summary-grid">
                  <article className="summary-card">
                    <div className="card-top">
                      <span>Ingresos del periodo</span>
                      <div className="card-icon green">
                        <TrendingUp size={20} />
                      </div>
                    </div>

                    <h2>{money(statsIncome)}</h2>
                    <p className="card-note">
                      Total de dinero recibido
                    </p>
                  </article>

                  <article className="summary-card">
                    <div className="card-top">
                      <span>Gastos del periodo</span>
                      <div className="card-icon pink">
                        <TrendingDown size={20} />
                      </div>
                    </div>

                    <h2>{money(statsExpenses)}</h2>
                    <p className="card-note">
                      Total de dinero gastado
                    </p>
                  </article>

                  <article className="summary-card balance-card">
                    <div className="card-top">
                      <span>Balance del periodo</span>
                      <div className="card-icon purple">
                        <Wallet size={20} />
                      </div>
                    </div>

                    <h2>{money(statsBalance)}</h2>
                    <p className="card-note">
                      Ingresos menos gastos
                    </p>
                  </article>
                </section>

                <section className="panel statistics-insight">
                  <div>
                    <h3>Resumen de tu periodo</h3>
                    <p>{periodLabel[statsPeriod]}</p>
                  </div>

                  <div className="statistics-insight-value">
                    <span>Porcentaje de balance respecto a ingresos</span>
                    <strong>{statsSavingsPercentage}%</strong>
                  </div>

                  <p className="card-note">
                    {statsIncome === 0
                      ? "Registra ingresos para conocer este indicador."
                      : statsBalance >= 0
                      ? "Tus ingresos son mayores o iguales a tus gastos en este periodo."
                      : "Tus gastos superan tus ingresos en este periodo."}
                  </p>
                </section>

                <section className="charts-grid">
                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Ingresos vs. gastos</h3>
                        <p>Comparación mensual de tus movimientos</p>
                      </div>
                    </div>

                    <div className="chart-container">
                      {statsChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsChartData} barGap={7}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EAF4"/>
                            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: "#9890A5", fontSize: 12}}/>
                            <YAxis axisLine={false} tickLine={false}tick={{ fill: "#9890A5", fontSize: 11}}/>
                            <Tooltip formatter={(value) => money(value)}/>
                            <Bar dataKey="ingresos" name="Ingresos" fill="#A78BFA" radius={[5, 5, 0, 0]}/>
                            <Bar dataKey="gastos" name="Gastos" fill="#E9B8D5" radius={[5, 5, 0, 0]}/>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p>No hay información disponible para este periodo.</p>
                      )}
                    </div>

                    <div className="chart-legend">
                      <span>
                        <i className="legend-dot lavender"></i>Ingresos</span>

                      <span><i className="legend-dot rose"></i>Gastos</span>
                    </div>
                  </article>

                  <article className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Gastos por categoría</h3>
                        <p>Distribución de tus gastos</p>
                      </div>
                    </div>

                    <div className="pie-container">
                      {statsExpenseData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={statsExpenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={57} outerRadius={82} paddingAngle={4}>
                              {statsExpenseData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>

                            <Tooltip formatter={(value, name, props) => [`${money(props.payload.total)} (${value}%)`, name]}/>
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p>No tienes gastos registrados en este periodo.</p>
                      )}
                    </div>

                    <div className="category-list">
                      {statsExpenseData.map((item) => (
                        <div className="category-row" key={item.name}>
                          <span>
                            <i style={{ background: item.color }}></i>
                            {item.name}
                          </span>

                          <strong>
                            {money(item.total)} · {item.value}%
                          </strong>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>

                <section className="panel top-categories-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Top 3 categorías de gasto</h3>
                      <p>
                        Tus categorías con mayor gasto en{" "}
                        {periodLabel[statsPeriod].toLowerCase()}.
                      </p>
                    </div>
                  </div>

                  {topCategories.length > 0 ? (
                    <div className="top-categories-list">
                      {topCategories.map((item, index) => (
                        <div className="top-category-row" key={item.name}>
                          <div className="top-category-rank">
                            {index + 1}
                          </div>

                          <div className="top-category-details">
                            <div className="top-category-info">
                              <div className="top-category-name">
                                <span className="top-category-dot" style={{ backgroundColor: item.color }}/>

                                <strong>{item.name}</strong>
                              </div>

                              <div className="top-category-amount">
                                <strong>{money(item.total)}</strong>
                                <span>
                                  {Number(item.value).toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            <div className="top-category-progress">
                              <div className="top-category-progress-fill" style={{width: `${Math.min(100, Math.max(0, Number(item.value) || 0) )}%`, backgroundColor: item.color}}/>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="statistics-message">
                      No hay gastos registrados en este periodo.
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        ) : activePage === "Presupuestos" ? (
          /* PÁGINA DE PRESUPUESTOS */
          <section className="budgets-page">
            {/* SELECTOR DE MES */}
            <section className="panel budget-filter-panel">
              <div className="budget-filter-content">
                <div>
                  <h3>Mis presupuestos</h3>
                  <p>Consulta y administra tus límites de gasto.</p>
                </div>

                <div className="budget-month-control">
                  <label htmlFor="budget-month">Periodo</label>
                  <input id="budget-month" type="month" value={budgetMonth} onChange={(e) => setBudgetMonth(e.target.value)}/>
                </div>
              </div>

              <p className="budget-selected-month">
                Mostrando presupuestos de{" "}
                <strong>{formatMonth(budgetMonth)}</strong>
              </p>
            </section>

            {budgetError ? (
              <section className="panel budget-message">
                <p>{budgetError}</p>

                <button type="button" className="primary-btn" onClick={() => setBudgetMonth((month) => month)}> Reintentar</button>
              </section>
            ) : budgetLoading ? (
              <section className="panel budget-message">
                <p>Cargando tus presupuestos...</p>
              </section>
            ) : (
              <>
                {/* RESUMEN GENERAL */}
                <section className="summary-grid budget-summary-grid">
                  <article className="summary-card">
                    <div className="card-top">
                      <span>Presupuesto total</span>
                      <div className="card-icon purple">
                        <Target size={20} />
                      </div>
                    </div>

                    <h2>{money(totalBudget)}</h2>
                    <p className="card-note">
                      Suma de tus límites de gasto
                    </p>
                  </article>

                  <article className="summary-card">
                    <div className="card-top">
                      <span>Total gastado</span>
                      <div className="card-icon pink">
                        <TrendingDown size={20} />
                      </div>
                    </div>

                    <h2>{money(totalBudgetSpent)}</h2>
                    <p className="card-note"> Gastos acumulados del periodo</p>
                  </article>

                  <article className="summary-card">
                    <div className="card-top">
                      <span>Disponible</span>
                      <div className="card-icon green">
                        <Wallet size={20} />
                      </div>
                    </div>

                    <h2 className={totalBudgetAvailable < 0 ? "negative-amount" : ""}>
                      {money(totalBudgetAvailable)}
                    </h2>
                    <p className="card-note">
                      Dinero restante de tus presupuestos
                    </p>
                  </article>
                </section>

                {/* PROGRESO GENERAL */}
                {budgets.length > 0 && (
                  <section className="panel budget-overview-panel">
                    <div className="budget-overview-heading">
                      <div>
                        <h3>Uso de tus presupuestos</h3>
                        <p>
                          Has utilizado el{" "}
                          <strong>{budgetPercentage.toFixed(1)}%</strong>{" "}
                          del total asignado.
                        </p>
                      </div>

                      <span className="budget-overview-percentage">
                        {budgetPercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="budget-progress-track general-progress">
                      <div
                        className={`budget-progress-fill ${
                          budgetPercentage >= 100
                            ? "danger"
                            : budgetPercentage >= 80
                            ? "warning"
                            : "normal"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, budgetPercentage))}%`
                        }}
                      />
                    </div>
                  </section>
                )}

                {/* LISTADO DE PRESUPUESTOS */}
                <section className="budget-list-section">
                  <div className="budget-section-heading">
                    <div>
                      <h3>Presupuestos por categoría</h3>
                      <p>
                        {budgets.length}{" "}
                        {budgets.length === 1
                          ? "presupuesto registrado"
                          : "presupuestos registrados"}
                      </p>
                    </div>
                  </div>

                  {budgets.length === 0 ? (
                    <div className="panel budget-empty-state">
                      <div className="budget-empty-icon">
                        <Target size={30} />
                      </div>

                      <h3>Aún no tienes presupuestos</h3>
                      <p>Establece un límite de gasto para tus categorías y comienza a organizar mejor tu dinero.</p>

                      <button type="button" className="primary-btn" onClick={openBudgetModal} disabled={expenseCategories.length === 0}><Plus size={17} />Crear mi primer presupuesto</button>

                      {expenseCategories.length === 0 && (
                        <p className="budget-empty-note">
                          No hay categorías de gasto disponibles.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="budget-cards-grid">
                      {budgets.map((budget) => {
                        const spent = Number(budget.gastado || 0);
                        const limit = Number(budget.monto || 0);
                        const available = Number(budget.disponible || 0);
                        const percentage = limit > 0
                          ? (spent / limit) * 100
                          : 0;

                        const status = getBudgetStatus(percentage);
                        const StatusIcon = status.icon;

                        return (
                          <article className="panel budget-card" key={budget.id}>
                            <div className="budget-card-top">
                              <div className="budget-category-icon">
                                <ShoppingBag size={19} />
                              </div>

                              <div className="budget-card-actions">
                                <button type="button" className="action-btn edit-btn" title="Editar presupuesto" aria-label={`Editar presupuesto de ${budget.categoria}`} onClick={() => openEditBudgetModal(budget)}> <Pencil size={16} /></button>

                                <button type="button" className="action-btn delete-btn" title="Eliminar presupuesto" aria-label={`Eliminar presupuesto de ${budget.categoria}`} onClick={() => deleteBudget(budget.id)}> <Trash2 size={16} /></button>
                              </div>
                            </div>

                            <h3>{budget.categoria}</h3>

                            <div className="budget-card-status">
                              <span className={`budget-status ${status.className}`}>
                                <StatusIcon size={14} />
                                {status.label}
                              </span>
                            </div>

                            <div className="budget-card-amounts">
                              <div>
                                <span>Gastado</span>
                                <strong>{money(spent)}</strong>
                              </div>

                              <div className="budget-limit-amount">
                                <span>Presupuesto</span>
                                <strong>{money(limit)}</strong>
                              </div>
                            </div>

                            <div className="budget-progress-track">
                              <div
                                className={`budget-progress-fill ${status.className}`}
                                style={{
                                  width: `${Math.min(100, Math.max(0, percentage))}%`
                                }}
                              />
                            </div>

                            <div className="budget-progress-label">
                              <span>{percentage.toFixed(1)}% utilizado</span>
                              <span>
                                {percentage > 100
                                  ? `${(percentage - 100).toFixed(1)}% excedido`
                                  : `${Math.max(0, 100 - percentage).toFixed(1)}% restante`}
                              </span>
                            </div>

                            <div className={`budget-available ${
                              available < 0 ? "over-budget" : ""
                            }`}>
                              <span>
                                {available < 0 ? "Excedente" : "Disponible"}
                              </span>

                              <strong>
                                {money(Math.abs(available))}
                              </strong>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        ) : null}
      </main>

      {/* MODAL PARA NUEVO O EDITAR MOVIMIENTO */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <form className="modal" onSubmit={saveTransaction} onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>
                  {editingId !== null
                    ? "Editar movimiento"
                    : "Nuevo movimiento"}
                </h2>

                <p>
                  {editingId !== null
                    ? "Modifica los datos de tu movimiento."
                    : "Registra un ingreso o un gasto."}
                </p>
              </div>

              <button type="button" className="close-btn" onClick={closeModal} disabled={saving} aria-label="Cerrar formulario"> <X size={20} /></button>
            </div>

            <label>Tipo de movimiento</label>

            <div className="type-selector">
              <button type="button" className={form.type === "ingreso" ? "selected income" : ""} onClick={() => changeType("ingreso")}> Ingreso </button>
              <button type="button" className={form.type === "gasto" ? "selected expense" : ""} onClick={() => changeType("gasto")}>Gasto</button>
            </div>

            <label htmlFor="description">Descripción</label>

            <input id="description" type="text" required maxLength="150" placeholder="Ej. Compra de despensa" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}/>
            <label htmlFor="category">Categoría</label>

            <select id="category" value={form.category_id} required onChange={(e) => setForm({...form, category_id: e.target.value})}>
              <option value="">Selecciona una categoría</option>

              {categories
                .filter((category) => category.tipo === form.type)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
            </select>

            <label htmlFor="amount">Monto (MXN)</label>
            <input id="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})}/>
            <label htmlFor="date">Fecha</label>
            <input id="date" type="date" required value={form.date || ""} onChange={(e) => setForm({...form, date: e.target.value})}/>
            <button type="submit" className="primary-btn submit-btn" disabled={saving || loading}>
              {saving
                ? "Guardando..."
                : editingId !== null
                ? "Guardar cambios"
                : "Agregar movimiento"}
            </button>
          </form>
        </div>
      )}

      {/* MODAL PARA NUEVO O EDITAR PRESUPUESTO */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={closeBudgetModal}>
          <form className="modal" onSubmit={saveBudget} onClick={(e) => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>
                  {editingBudgetId !== null
                    ? "Editar presupuesto"
                    : "Nuevo presupuesto"}
                </h2>
                <p>Establece cuánto deseas gastar en esta categoría.</p>
              </div>

              <button type="button" className="close-btn" onClick={closeBudgetModal} disabled={budgetSaving} aria-label="Cerrar formulario"><X size={20} /></button>
            </div>

            <label htmlFor="budget-category">Categoría de gasto</label>

            <select
              id="budget-category"
              value={budgetForm.categoria_id}
              required
              onChange={(e) =>
                setBudgetForm({
                  ...budgetForm,
                  categoria_id: e.target.value
                })
              }
            >
              <option value="">Selecciona una categoría</option>

              {(editingBudgetId !== null
                ? expenseCategories
                : availableBudgetCategories
              ).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>

            <label htmlFor="budget-amount">Monto máximo (MXN)</label>

            <input
              id="budget-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Ej. 2000.00"
              value={budgetForm.monto}
              onChange={(e) =>
                setBudgetForm({
                  ...budgetForm,
                  monto: e.target.value
                })
              }
            />

            <label htmlFor="budget-form-month">Mes del presupuesto</label>

            <input id="budget-form-month" type="month" required value={budgetForm.mes} onChange={(e) =>
                setBudgetForm({
                  ...budgetForm,
                  mes: e.target.value
                })
              }
            />

            <p className="budget-modal-note">
              Los gastos de esta categoría se calcularán automáticamente
              durante el mes seleccionado.
            </p>

            <button type="submit" className="primary-btn submit-btn" disabled={budgetSaving}>
              {budgetSaving
                ? "Guardando..."
                : editingBudgetId !== null
                ? "Guardar cambios"
                : "Crear presupuesto"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;