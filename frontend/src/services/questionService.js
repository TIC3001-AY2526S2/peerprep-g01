const API_BASE = "http://localhost:8000/questions";

async function handleResponse(res) {
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Request failed");
    }
    return res.json();
}

export async function getQuestions(page = 1, limit = 10, search = "") {
    let url = `http://localhost:8000/questions?page=${page}&limit=${limit}`;

    if (search)
        url += `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url);

    if (!res.ok)
        throw new Error("Failed to fetch");

    return res.json();
}

export async function createQuestion(question) {
    const res = await fetch(`${API_BASE}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
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
        },
        body: JSON.stringify(question),
    });
    return handleResponse(res);
}

export async function deleteQuestion(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
    });
    return handleResponse(res);
}

export async function uploadQuestions(formData) {
    const response = await fetch(`${API_BASE}/upload_questions`, {
        method: "POST",
        body: formData
    });
    return handleResponse(response);
}
