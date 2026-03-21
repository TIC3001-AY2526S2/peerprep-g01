const API_BASE = "http://localhost:3000";

//  Helpers
async function handleResponse(res) {
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || data.message || "Request failed");
  }
  return res.json();
}

function getToken() {
  return sessionStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

//  Auth
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await handleResponse(res);

  // Backend returns: { message, data: { accessToken, id, username, email, isAdmin, createdAt } }
  // LoginForm.jsx expects: { access_token, user }
  const { accessToken, ...user } = json.data;
  return { access_token: accessToken, user };
}

export async function verifyToken() {
  const res = await fetch(`${API_BASE}/auth/verify-token`, {
    method: "GET",
    headers: authHeaders(),
  });
  const json = await handleResponse(res);

  // Backend returns: { message, data: { id, username, email, isAdmin } }
  // Normalise to { user }
  return { user: json.data };
}

// Users
export async function registerUser(username, email, password) {
  // POST /users/ does not return a token — login immediately after
  const res = await fetch(`${API_BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  await handleResponse(res);

  // Login to get a token and return the normalised { access_token, user }
  return loginUser(email, password);
}

export async function getUser(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getAllUsers() {
  const res = await fetch(`${API_BASE}/users/`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function updateUser(userId, fields) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(fields),
  });
  return handleResponse(res);
}

export async function updateUserPrivilege(userId, isAdmin) {
  const res = await fetch(`${API_BASE}/users/${userId}/privilege`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ isAdmin }),
  });
  return handleResponse(res);
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export function logoutUser() {
  sessionStorage.removeItem("token");
}
