import { useState } from "react";
import { createQuestion } from "../services/questionService";

export default function QuestionForm({ onSuccess }) {
    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
        complexity: "",
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleComplexitySelect = (complexity) => {
        setForm(prev => ({
            ...prev,
            complexity: complexity
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                title: form.title,
                description: form.description,
                category: form.category
                    .split(",")
                    .map(c => c.trim()),
                complexity: form.complexity
            };

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
            </form>
        </div>
    );
}
