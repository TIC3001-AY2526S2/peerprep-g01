import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import css from "./auth/authStyles";

function InnerApp() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState("login");

  useEffect(() => {
    if (user) navigate("/homepage", { replace: true });
  }, [user]);

  return page === "login" ? (
    <LoginPage onSwitch={() => setPage("register")} />
  ) : (
    <RegisterPage onSwitch={() => setPage("login")} />
  );
}

export default function LoginForm() {
  return (
    <>
      <style>{css}</style>
      <InnerApp />
    </>
  );
}
