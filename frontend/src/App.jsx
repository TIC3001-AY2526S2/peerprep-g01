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
      .then((r) => r.json())
      .then((data) => {
        if (data.session?.matchId === matchId) {
          setStatus("authorized");
        } else {
          setStatus("unauthorized");
        }
      })
      .catch(() => setStatus("unauthorized"));
  }, [token, user, matchId]);

  if (status === "checking") return <p>Verifying session...</p>;
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
