const API_BASE = "http://localhost:8000";

function getToken() {
  return sessionStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Request failed");
  return data;
}

//Auth service calls

export async function loginUser({ email, password }) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

export async function registerUser({
  username,
  email,
  password,
  role = "user",
}) {
  return request("/auth/register", {
    method: "POST",
    body: { username, email, password, role },
  });
}

export async function fetchProfile() {
  return request("/auth/profile", { auth: true });
}

export function logoutUser() {
  sessionStorage.removeItem("token");
}
