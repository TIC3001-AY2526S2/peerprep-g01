import { useState, useEffect } from "react";
import { useAuth } from "./auth/AuthContext";
import QuestionForm from "./QuestionForm";
import QuestionList from "./QuestionList";
import EditQuestionModal from "./EditQuestionModal";
import DisplayQuestionModal from "./DisplayQuestionModal";
import Toast from "./Toast";
import Logout from "./Logout";
import {
  getAllUsers,
  updateUserPrivilege,
  deleteUser,
} from "../services/userService";

// User Management Table (admin only)
function UserManager({ showToast }) {
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

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleToggleAdmin(user) {
    try {
      await updateUserPrivilege(user.id, !user.isAdmin);
      showToast(`Updated privileges for ${user.username}`);
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleDelete(user) {
    if (
      !window.confirm(`Delete user "${user.username}"? This cannot be undone.`)
    )
      return;
    try {
      await deleteUser(user.id);
      showToast(`Deleted user ${user.username}`);
      fetchUsers();
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

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
                <span
                  className={`role-badge ${user.isAdmin ? "admin" : "user"}`}
                >
                  {user.isAdmin ? "Admin" : "User"}
                </span>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td className="user-actions">
                <button
                  className="btn-promote"
                  onClick={() => handleToggleAdmin(user)}
                >
                  {user.isAdmin ? "Demote" : "Promote"}
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(user)}
                >
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

// Question Manager
export default function QuestionManager() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;

  const [activeTab, setActiveTab] = useState("questions");
  const [displayQuestion, setDisplayQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleEdit = (question) => setEditingQuestion(question);
  const handleDisplay = (question) => setDisplayQuestion(question);

  const handleCreateSuccess = (
    message = "Question created successfully!",
    type = "success",
  ) => {
    setRefresh((prev) => !prev);
    showToast(message, type);
  };

  const handleUpdateSuccess = () => {
    setRefresh((prev) => !prev);
    setEditingQuestion(null);
    showToast("Question updated successfully!");
  };

  const handleDeleteSuccess = () => {
    setRefresh((prev) => !prev);
    showToast("Question deleted successfully!");
  };

  return (
    <div className="app-container">
      <h1>PeerPrep</h1>
      <Logout />

      {/* Tab switcher — Users tab only visible to admins */}
      <div className="tab-switcher">
        <button
          className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
          onClick={() => setActiveTab("questions")}
        >
          Questions
        </button>
        {isAdmin && (
          <button
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
        )}
      </div>

      {/* Questions tab */}
      {activeTab === "questions" && (
        <>
          {/* Create form — admin only */}
          {isAdmin && <QuestionForm onSuccess={handleCreateSuccess} />}

          {/* Question list — pass isAdmin so it can show/hide edit+delete */}
          <QuestionList
            onDisplay={handleDisplay}
            onEdit={isAdmin ? handleEdit : undefined}
            onDeleteSuccess={isAdmin ? handleDeleteSuccess : undefined}
            refresh={refresh}
            isAdmin={isAdmin}
          />

          <EditQuestionModal
            question={editingQuestion}
            onClose={() => setEditingQuestion(null)}
            onSuccess={handleUpdateSuccess}
          />

          <DisplayQuestionModal
            question={displayQuestion}
            onClose={() => setDisplayQuestion(null)}
          />
        </>
      )}

      {/* Users tab — admin only */}
      {activeTab === "users" && isAdmin && (
        <UserManager showToast={showToast} />
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
