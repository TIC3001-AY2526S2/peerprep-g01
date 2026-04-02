import { useState } from "react";
import CategorySelector from "./CategorySelector";

export default function MatchSelector({ currentUser, setPayload, setLoading, setError, error, showToast }) { // fixed: added missing opening brace + destructure new props
    const [form, setForm] = useState({
        category: "",
        complexity: "",
    });

    const handleCategorySelect = (category) => {
        setForm((prev) => ({ ...prev, category }));
    };

    const handleComplexitySelect = (complexity) => {
        setForm((prev) => ({ ...prev, complexity }));
    };

    const handleSubmit = () => {
        try {
            const newPayload = {
                user: currentUser,
                category: form.category,
                complexity: form.complexity,
            };
            setPayload(newPayload);
            console.log(newPayload);
            setLoading(newPayload);
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
                    {["Easy", "Medium", "Hard"].map((level) => (  // minor refactor: avoid repetition
                        <button
                            key={level}
                            type="button"
                            className={`complexity-btn complexity-${level.toLowerCase()} ${form.complexity === level ? "active" : ""}`}
                            onClick={() => handleComplexitySelect(level)}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>
            <button
                type="submit"
                onClick={handleSubmit}
                disabled={!form.complexity || !form.category}
            >
                Match
            </button>
        </div>
    );
}
