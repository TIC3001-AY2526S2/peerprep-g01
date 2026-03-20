const API_BASE = "http://localhost:8000/questions";

async function handleResponse(res) {
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.detail || "Request failed");
  }
  return res.json();
}

function getToken() {
  return sessionStorage.getItem("token");
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function getQuestions(page = 1, limit = 10, search = "") {
  let url = `http://localhost:8000/questions?page=${page}&limit=${limit}`;

  if (search) url += `&search=${encodeURIComponent(search)}`;

  const res = await fetch(url, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function createQuestion(question) {
  const res = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(question),
  });
  return handleResponse(res);
}

export async function updateQuestion(id, question) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(question),
  });
  return handleResponse(res);
}

export async function deleteQuestion(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function uploadQuestions(formData) {
  const response = await fetch(`${API_BASE}/upload_questions`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(response);
}
