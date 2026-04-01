import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { verifyToken } from "../../services/userService";
import CategorySelector from "../CategorySelector";


export default function MatchingTab({ showToast, currentUser, saveAuth }) {

    const [error, setError] = useState("");

    const [form, setForm] = useState({
        category: "",
        complexity: "",
    });

    const handleCategorySelect = (category) => {
        setForm((prev) => ({
            ...prev,
            category: category,
        }));
    };

    const handleComplexitySelect = (complexity) => {
        setForm((prev) => ({
            ...prev,
            complexity: complexity,
        }));
    };

    const handleSubmit = (e) => {
        try {
            const payload = {
                category: form.category,
                complexity: form.complexity,
            };
            console.log(payload)
            showToast("Yeay", "success"); //probably needs to get deleted
        } catch (err) {
            setError(err.message || "Failed to Match");
            console.error(err);
        }
    };

    return (
        <div className="card">
            <h2>Match with a Collaborator</h2>
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
            <CategorySelector
                selected={form.category}
                onSelect={handleCategorySelect}
            />


            <div className="complexity-section">
                <label className="complexity-label">Complexity</label>
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
            <button
                type="submit"
                onClick={() => handleSubmit()}
                disabled={!form.complexity || !form.category}
            >
                Match
            </button>

        </div>
    );
}
