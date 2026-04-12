import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <button className="btn-logout" onClick={handleLogout}>
      Sign out
    </button>
  );
}
