import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { verifyToken, updateUser } from "../../services/userService";

export default function ProfileTab({ showToast }) {
  const { user, token, saveAuth } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    verifyToken()
      .then((d) => {
        setProfile(d.user);
        setForm({ username: d.user.username, password: "" });
      })
      .catch((e) => showToast(e.message, "error"))
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
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSaving(true);
    try {
      const updates = { username: form.username };
      if (form.password) updates.password = form.password;
      const res = await updateUser(displayUser.id, updates);
      saveAuth({ access_token: token, user: { ...displayUser, username: res.data.username } });
      setProfile(res.data);
      setForm({ username: res.data.username, password: "" });
      setEditing(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setFormErrors({});
    setForm({ username: displayUser?.username || "", password: "" });
  }

  if (loading) return <p style={{ color: "white", padding: "1rem" }}>Loading profile...</p>;

  return (
    <div className="card profile-card">

      {/* Avatar + name header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {displayUser?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="profile-name">{displayUser?.username}</div>
          <div className="profile-email">{displayUser?.email}</div>
          <span
            className={`role-badge ${displayUser?.isAdmin ? "admin" : "user"}`}
            style={{ marginTop: "4px", display: "inline-block" }}
          >
            {displayUser?.isAdmin ? "Admin" : "User"}
          </span>
        </div>
      </div>

      {/* Fields */}
      <div className="profile-fields">
        <div className="profile-row">
          <span className="profile-key">Username</span>
          {editing ? (
            <div className="profile-edit-field">
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={{ width: "200px", marginBottom: 0 }}
              />
              {formErrors.username && (
                <span style={{ color: "#e74c3c", fontSize: "12px" }}>{formErrors.username}</span>
              )}
            </div>
          ) : (
            <span className="profile-val">{displayUser?.username}</span>
          )}
        </div>

        <div className="profile-row">
          <span className="profile-key">Email</span>
          <span className="profile-val">{displayUser?.email}</span>
        </div>

        <div className="profile-row">
          <span className="profile-key">Password</span>
          {editing ? (
            <div className="profile-edit-field">
              <input
                type="password"
                placeholder="new password (optional)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ width: "200px", marginBottom: 0 }}
              />
              {formErrors.password && (
                <span style={{ color: "#e74c3c", fontSize: "12px" }}>{formErrors.password}</span>
              )}
            </div>
          ) : (
            <span className="profile-val">••••••••</span>
          )}
        </div>

        <div className="profile-row">
          <span className="profile-key">Proficiency</span>
          <span className="profile-val" style={{ color: "#9ca3b8", fontStyle: "italic" }}>
            Coming soon
          </span>
        </div>

        <div className="profile-row">
          <span className="profile-key">Role</span>
          <span className="profile-val">{displayUser?.isAdmin ? "Admin" : "User"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="profile-actions">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button className="secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}>Edit profile</button>
        )}
      </div>
    </div>
  );
}
