import { useState } from "react";
import { Wallet, Eye, EyeOff, ArrowRight } from "lucide-react";
import "./Auth.css";

const AUTH_URL = "http://localhost:3000/api/auth";

function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nombre: "", correo: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setForm({ nombre: "", correo: "", password: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isRegister && form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${AUTH_URL}/${isRegister ? "registro" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isRegister ? { nombre: form.nombre.trim() } : {}),
          correo: form.correo.trim(),
          password: form.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || "No fue posible completar la solicitud.");
      }

      onAuthenticated(data);
    } catch (requestError) {
      setError(
        requestError.message === "Failed to fetch"
          ? "No se pudo conectar con el servidor. Verifica que el backend esté encendido."
          : requestError.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-decoration">
        <div className="auth-brand">
          <span className="auth-brand-icon"><Wallet size={25} /></span>
          <span>Mis <strong>Finanzas</strong></span>
        </div>

        <div className="auth-message">
          <span className="auth-eyebrow">TU TRANQUILIDAD FINANCIERA</span>
          <h1>Organiza tu dinero, construye tus metas.</h1>
          <p>Un espacio sencillo para tener tus ingresos, gastos y objetivos en un solo lugar.</p>
          <div className="auth-orbit orbit-one"></div>
          <div className="auth-orbit orbit-two"></div>
          <div className="auth-orbit orbit-three"></div>
          <div className="auth-floating-card">
            <span>✦</span>
            <div><strong>Pequeños pasos</strong><small>También construyen grandes cambios.</small></div>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-icon"><Wallet size={23} /></span>
            <span>Mis <strong>Finanzas</strong></span>
          </div>

          <div className="auth-heading">
            <span className="auth-kicker">{isRegister ? "COMIENZA HOY" : "QUÉ BUENO TENERTE DE VUELTA"}</span>
            <h2>{isRegister ? "Crea tu cuenta" : "Bienvenida de nuevo"}</h2>
            <p>{isRegister ? "Regístrate para comenzar a organizar tus finanzas." : "Ingresa tus datos para continuar."}</p>
          </div>

          <div className="auth-tabs">
            <button type="button" className={!isRegister ? "active" : ""} onClick={() => changeMode("login")}>Iniciar sesión</button>
            <button type="button" className={isRegister ? "active" : ""} onClick={() => changeMode("register")}>Crear cuenta</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label>
                Nombre
                <input type="text" placeholder="Tu nombre" autoComplete="name" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required maxLength={100}/>
              </label>
            )}

            <label>
              Correo electrónico
              <input type="email" placeholder="correo@ejemplo.com" autoComplete="email" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} required/>
            </label>

            <label>
              Contraseña
              <div className="auth-password-wrap">
                <input type={showPassword ? "text" : "password"} placeholder={isRegister ? "Mínimo 8 caracteres" : "Ingresa tu contraseña"} autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={isRegister ? 8 : undefined}/>
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Procesando..." : isRegister ? "Crear mi cuenta" : "Iniciar sesión"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? "¿Ya tienes una cuenta?" : "¿Todavía no tienes una cuenta?"}{" "}
            <button type="button" onClick={() => changeMode(isRegister ? "login" : "register")}>
              {isRegister ? "Inicia sesión" : "Regístrate"}
            </button>
          </p>
          <p className="auth-security">Tus datos de acceso se utilizan para proteger tu cuenta.</p>
        </div>
      </section>
    </main>
  );
}

export default Auth;