import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { registerUser } from "../../services/userService";

export default function RegisterPage({ onSwitch }) {
  const { saveAuth } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.username || form.username.trim().length < 2)
      e.username = "Min 2 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Valid email required";
    if (!form.password || form.password.length < 8)
      e.password = "Min 8 characters";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setApiError(null);
    setLoading(true);
    try {
      const data = await registerUser(form.username, form.email, form.password);
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
        <h1>Create account</h1>
        <p className="subtitle">Join to get started</p>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Username</label>
            <input
              placeholder="johndoe"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            {errors.username && (
              <div className="field-error">{errors.username}</div>
            )}
          </div>
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
              placeholder="min 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && (
              <div className="field-error">{errors.password}</div>
            )}
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Create account"}
          </button>
        </form>

        <div className="switch-link">
          Already have an account?
          <button onClick={onSwitch}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
