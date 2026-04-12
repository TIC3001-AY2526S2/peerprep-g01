import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { loginUser } from "../../services/userService";

export default function LoginPage({ onSwitch }) {
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setApiError(null);
    setLoading(true);
    try {
      const data = await loginUser(form.email, form.password);
      saveAuth(data);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="layout">
      <div className="card fade-in">
        <div className="logo">
          <span className="logo-dot" /> PeerPrep
        </div>
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your account to continue</p>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && (
              <div className="field-error">{errors.password}</div>
            )}
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign in"}
          </button>
        </form>

        <div className="switch-link">
          Don't have an account?
          <button onClick={onSwitch}>Register</button>
        </div>
      </div>
    </div>
  );
}
