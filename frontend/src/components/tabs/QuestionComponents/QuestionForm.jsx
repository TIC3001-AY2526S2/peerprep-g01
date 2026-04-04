import { useState } from "react";
import {createQuestion, uploadQuestions} from "../../../services/questionService"

export default function QuestionForm({ onSuccess }) {
  // State Management - This function is used to store the user input.
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    complexity: "",
  });

  const [error, setError] = useState("");
  const [file, setFile] = useState(null);

  // When a user types (input change), this function is triggered.
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleComplexitySelect = (complexity) => {
    setForm((prev) => ({
      ...prev,
      complexity: complexity,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Forms the payload for backend
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category.split(",").map((c) => c.trim()),
        complexity: form.complexity,
      };
      // createQuestion - declared in questionService.js
      await createQuestion(payload);

      // Reset form after successful creation
      setForm({
        title: "",
        description: "",
        category: "",
        complexity: "",
      });

      // Clear any existing errors
      setError("");

      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create question");
      console.error(err);
    }
  };

  const handleFileUpload = async () => {
      if (file === null) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
          const result = await uploadQuestions(formData);

          setFile(null);
          document.querySelector('input[type="file"]').value = "";

          // Pass both the message and type up to App.jsx
          if (result.status_code === 200) {
              onSuccess(result.message, "success");
          } else if (result.status_code === 207) {
              onSuccess(result.message, "info");  // partial success
          } else {
              setError(result.message || "Upload failed");
          }
      } catch (err) {
          setError(err.message || "Failed to upload JSON file");
      }
  };

  return (
    <div className="card">
      <h2>Create Question</h2>

      {error && (
        <div className="error">
          <span>{error}</span>
          <button
            className="error-close"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />

        <input
          name="category"
          placeholder="Category (comma separated)"
          value={form.category}
          onChange={handleChange}
          required
        />

        <div className="complexity-section">
          <label className="complexity-label">Complexity *</label>
          <div className="complexity-buttons">
            <button
              type="button"
              className={`complexity-btn complexity-easy ${form.complexity === "Easy" ? "active" : ""}`}
              onClick={() => handleComplexitySelect("Easy")}
            >
              Easy
            </button>
            <button
              type="button"
              className={`complexity-btn complexity-medium ${form.complexity === "Medium" ? "active" : ""}`}
              onClick={() => handleComplexitySelect("Medium")}
            >
              Medium
            </button>
            <button
              type="button"
              className={`complexity-btn complexity-hard ${form.complexity === "Hard" ? "active" : ""}`}
              onClick={() => handleComplexitySelect("Hard")}
            >
              Hard
            </button>
          </div>
        </div>

        <button type="submit" disabled={!form.complexity}>
          Create Question
        </button>

        <h2>Upload Questions via JSON</h2>

        <input type="file" accept=".json" onChange={handleFileChange} />

        <button
          type="button"
          onClick={handleFileUpload}
          disabled={!file}
        >
          Upload JSON
        </button>
      </form>
    </div>
  );
}
