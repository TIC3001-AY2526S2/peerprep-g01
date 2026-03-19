import { createContext, useContext, useState } from "react";
import { logoutUser } from "../../services/userService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));

  function saveAuth(data) {
    sessionStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }

  function logout() {
    logoutUser();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, saveAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
