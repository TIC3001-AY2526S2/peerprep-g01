import { Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import QuestionManager from "./components/QuestionManager";

function PrivateRoute({ children }) {
  const token = sessionStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
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
    </Routes>
  );
}
