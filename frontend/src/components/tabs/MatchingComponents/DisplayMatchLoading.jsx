import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TIMEOUT_SECONDS = 120;

export default function DisplayMatchLoading({ matchCriteria, matchResult, onClose, onRetry, onTimeout }) {
    const navigate = useNavigate();

    const [elapsed, setElapsed] = useState(0);
    const [timedOut, setTimedOut] = useState(false);

    useEffect(() => {
        setElapsed(0);
        setTimedOut(false);
        if (!matchCriteria || matchResult) return;

        const interval = setInterval(() => {
            setElapsed((prev) => {
                if (prev + 1 >= TIMEOUT_SECONDS) {
                    clearInterval(interval);
                    setTimedOut(true);
                    onTimeout?.();
                    return TIMEOUT_SECONDS;
                }
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [matchCriteria, matchResult]);

    if (!matchCriteria) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const complexityClass = matchCriteria.complexity?.toLowerCase();

    // Match found screen
    if (matchResult) {
        return (
            <div className="modal-overlay">
                <div className="display-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="display-header">
                        <h2 className="display-title">Match Found!</h2>
                        <div className="category-tags">
                            <span className="category-tag">{matchCriteria.category}</span>
                        </div>
                        <div className="complexity-container">
                            <span className={`complexity-badge complexity-badge-${complexityClass}`}>
                                {matchCriteria.complexity}
                            </span>
                        </div>
                    </div>
                    <div className="display-section">
                        <p className="section-label">Matched With</p>
                        <div className="description-content" style={{ textAlign: "center", fontSize: "1.25rem", fontWeight: 600 }}>
                            {matchResult.matched_with?.username || "Unknown User"}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button onClick={() => navigate(`/${matchResult.match_id}`, {
                            state: {
                                matchedWith: matchResult.matched_with,
                                question: matchResult.question,
                                matchId: matchResult.match_id,
                                }})
                            }>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Timeout screen
    if (timedOut) {
        return (
            <div className="modal-overlay">
                <div className="display-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="display-header">
                        <h2 className="display-title">No Match Found</h2>
                        <div className="description-content" style={{ textAlign: "center", fontSize: "0.9rem", fontWeight: 600  }}>
                            Seems like nobody is matching with your criteria right now. :(
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button onClick={onRetry}>
                            Retry
                        </button>
                        <button onClick={onClose} className="danger">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Searching screen
    return (
        <div className="modal-overlay">
            <div className="display-modal" onClick={(e) => e.stopPropagation()}>
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
                <div className="display-section">
                    <p className="section-label">Time Elapsed</p>
                    <div className="description-content" style={{ textAlign: "center", fontSize: "2rem", fontWeight: 700, letterSpacing: "2px" }}>
                        {formatTime(elapsed)}
                    </div>
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="danger">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}