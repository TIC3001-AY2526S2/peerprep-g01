import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/LoginForm";
import LoginForm from "./components/LoginForm";
import QuestionManager from "./components/QuestionManager";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route
        path="/questions"
        element={
          <PrivateRoute>
            <QuestionManager />
          </PrivateRoute>
        }
      />
      {/* Catch-all: redirect unknown routes based on auth state */}
      <Route
        path="*"
        element={
          <PrivateRoute>
            <Navigate to="/questions" replace />
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
