import { useEffect, useState } from "react";

export default function DisplayMatchLoading({ matchCriteria, onClose }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        setElapsed(0);
        const interval = setInterval(() => {
            setElapsed((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [matchCriteria]);

    if (!matchCriteria) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const complexityClass = matchCriteria.complexity?.toLowerCase();

    return (
        <div className="modal-overlay">
            <div className="display-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="display-header">
                    <h2 className="display-title">Searching for a Match...</h2>
                    <div className="category-tags">
                        <span className="category-tag">{matchCriteria.category}</span>
                    </div>
                    <div className="complexity-container">
                        <span className={`complexity-badge complexity-badge-${complexityClass}`}>
                            {matchCriteria.complexity}
                        </span>
                    </div>
                </div>

                {/* Timer */}
                <div className="display-section">
                    <p className="section-label">Time Elapsed</p>
                    <div className="description-content" style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, letterSpacing: "2px" }}>
                        {formatTime(elapsed)}
                    </div>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                    <button onClick={onClose} className="danger">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
