import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { verifyToken, updateUser } from "../../services/userService";
import Logout from "../Logout";

export default function ProfilePage() {
  const { user, token, saveAuth } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (!token) {
      setError("No session token found. Please log in again.");
      setLoading(false);
      return;
    }
    verifyToken()
      .then((d) => {
        setProfile(d.user);
        setForm({ username: d.user.username, password: "" });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const displayUser = profile || user;

  function validate() {
    const e = {};
    if (!form.username || form.username.trim().length < 2)
      e.username = "Min 2 characters";
    if (form.password && form.password.length < 8)
      e.password = "Min 8 characters";
    return e;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    setSaveError(null);
    setSaving(true);
    try {
      const updates = { username: form.username };
      if (form.password) updates.password = form.password;

      const res = await updateUser(displayUser.id, updates);

      saveAuth({
        access_token: token,
        user: { ...displayUser, username: res.data.username },
      });

      setProfile(res.data);
      setForm({ username: res.data.username, password: "" });
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setFormErrors({});
    setSaveError(null);
    setForm({ username: displayUser?.username || "", password: "" });
  }

  if (loading)
    return (
      <div className="layout">
        <div className="card fade-in">
          <div className="alert alert-success">Loading profile…</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="layout">
        <div className="card fade-in">
          <div className="alert alert-error">{error}</div>
        </div>
      </div>
    );

  return (
    <div className="layout">
      <div className="card fade-in" style={{ maxWidth: 460 }}>
        {/* Header */}
        <div className="logo">
          <span className="logo-dot" /> PeerPrep
        </div>

        {/* Avatar + name */}
        <div className="profile-header">
          <div className="avatar">
            {displayUser?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="profile-name">{displayUser?.username}</div>
            <div className="profile-email">{displayUser?.email}</div>
            <span
              className={`badge ${displayUser?.isAdmin ? "badge-admin" : "badge-user"}`}
            >
              ⬡ {displayUser?.isAdmin ? "admin" : "user"}
            </span>
          </div>
        </div>

        {/* Success / error alerts */}
        {saveSuccess && (
          <div className="alert alert-success">
            Profile updated successfully!
          </div>
        )}
        {saveError && <div className="alert alert-error">{saveError}</div>}

        {/* Profile fields */}
        <div className="info-grid">
          {/* Username — editable */}
          <div className="info-row">
            <span className="info-key">Username</span>
            {editing ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".3rem",
                  alignItems: "flex-end",
                }}
              >
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  style={{
                    width: "180px",
                    padding: ".4rem .6rem",
                    fontSize: ".85rem",
                  }}
                />
                {formErrors.username && (
                  <span className="field-error">{formErrors.username}</span>
                )}
              </div>
            ) : (
              <span className="info-val">{displayUser?.username}</span>
            )}
          </div>

          {/* Email — read only */}
          <div className="info-row">
            <span className="info-key">Email</span>
            <span className="info-val">{displayUser?.email}</span>
          </div>

          {/* Password — editable, never shown in plain text */}
          <div className="info-row">
            <span className="info-key">Password</span>
            {editing ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".3rem",
                  alignItems: "flex-end",
                }}
              >
                <input
                  type="password"
                  placeholder="new password (optional)"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  style={{
                    width: "180px",
                    padding: ".4rem .6rem",
                    fontSize: ".85rem",
                  }}
                />
                {formErrors.password && (
                  <span className="field-error">{formErrors.password}</span>
                )}
              </div>
            ) : (
              <span className="info-val">••••••••</span>
            )}
          </div>

          {/* Proficiency — placeholder */}
          <div className="info-row">
            <span className="info-key">Proficiency</span>
            <span
              className="info-val"
              style={{ color: "var(--muted)", fontStyle: "italic" }}
            >
              Coming soon
            </span>
          </div>
        </div>

        {/* Action buttons */}
        {editing ? (
          <div style={{ display: "flex", gap: ".75rem" }}>
            <button className="btn" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : "Save changes"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        )}

        <Logout />
      </div>
    </div>
  );
}
