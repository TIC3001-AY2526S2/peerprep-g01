import React from "react";

const CATEGORIES = [
    "Algorithms",
    "Arrays",
    "Bit Manipulation",
    "Brain Teasers",
    "Databases",
    "Data Structures",
    "Recursions",
    "Shortest Path",
    "Sorting",
];

export default function CategorySelector({ selected, onSelect }) {
    return (
        <div className="category-section">
            <label className="complexity-label">Topic</label>
            <div className="category-buttons">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        className={`category-btn${selected === cat ? " active" : ""}`}
                        onClick={() => onSelect(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}
