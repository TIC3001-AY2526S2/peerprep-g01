import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import LoginForm from "./components/LoginForm";
import HomePage from "./components/pages/HomePage";
import ProfilePage from "./components/pages/ProfilePage";
import CollabSession from "./components/pages/CollabSession";
import { useState, useEffect } from "react";

const COLLAB_URL = "http://localhost:3003";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/" replace />;
}

function CollabRoute() {
  const { token, user } = useAuth();
  const { matchId } = useParams();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    if (!token || !user) {
      setStatus("unauthorized");
      return;
    }

    fetch(`${COLLAB_URL}/session/user/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401 || r.status === 403) {
          setStatus("unauthorized");
          return;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.session?.matchId === matchId) {
          setStatus("authorized");
        } else if (data) {
          // Server responded but matchId doesn't match
          setStatus("unauthorized");
        }
      })
      .catch((e) => {
        // 1. Check if it's a Network Error (Connection Refused)
        if (e instanceof TypeError || e.message === "Failed to fetch") {
          console.warn("[!] Collab Service is offline. Pausing authorization check...");
          setStatus("offline"); // New state!
        } else {
          setStatus("unauthorized");
        }
      });
  }, [token, user, matchId]);

  // --- The Render Logic ---
  if (status === "checking") return <p>Verifying session...</p>;

  if (status === "offline") {
    return (
      <div className="app-container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Service Connection Lost</h2>
        <p>We can't reach the Collaboration Service right now.</p>
        <p style={{ color: '#7b8ab8' }}>Attempting to reconnect in the background... Please don't refresh.</p>
        {/* Optionally render the session anyway if you have location.state fallback */}
        <button onClick={() => window.location.reload()}>Retry Manually</button>
      </div>
    );
  }

  if (status === "unauthorized") return <Navigate to="/homepage" replace />;

  return <CollabSession />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route
        path="/homepage"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route 
        path="/:matchId" 
        element={
          <PrivateRoute>
            <CollabRoute />
            </PrivateRoute>
        } />

      {/* Catch-all: redirect unknown routes based on auth state */}
      <Route
        path="*"
        element={
          <PrivateRoute>
            <Navigate to="/homepage" replace />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
