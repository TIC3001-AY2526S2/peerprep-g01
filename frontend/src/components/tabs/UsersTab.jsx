import { useState, useEffect } from "react";
import { getAllUsers, updateUserPrivilege, deleteUser } from "../../services/userService";

export default function UsersTab({ showToast, currentUser, saveAuth }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleToggleAdmin(user) {
    try {
      await updateUserPrivilege(user.id, !user.isAdmin);
      showToast(`Updated privileges for ${user.username}`);
      if (currentUser && user.id === currentUser.id) {
        saveAuth({
          access_token: sessionStorage.getItem("token"),
          user: { ...currentUser, isAdmin: !user.isAdmin },
        });
      }
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(user.id);
      showToast(`Deleted user ${user.username}`);
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (loading) return <p style={{ color: "white", padding: "1rem" }}>Loading users...</p>;
  if (error) return <p style={{ color: "#f87171", padding: "1rem" }}>{error}</p>;

  return (
    <div className="user-manager">
      <h2>User Management</h2>
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <span className={`role-badge ${user.isAdmin ? "admin" : "user"}`}>
                  {user.isAdmin ? "Admin" : "User"}
                </span>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="user-actions">
                <button className="btn-promote" onClick={() => handleToggleAdmin(user)}>
                  {user.isAdmin ? "Demote" : "Promote"}
                </button>
                <button className="btn-delete" onClick={() => handleDelete(user)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
