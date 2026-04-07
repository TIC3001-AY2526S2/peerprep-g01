import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TIMEOUT_SECONDS = 60;
const AUTO_NAVIGATE_DELAY = 2000; // 2 seconds to see the "Match Found" screen

export default function DisplayMatchLoading({ matchCriteria, matchResult, onClose, onRetry, onTimeout }) {
    const navigate = useNavigate();
    const [elapsed, setElapsed] = useState(0);
    const [timedOut, setTimedOut] = useState(false);

    // --- EFFECT 1: Auto-navigation logic ---
    useEffect(() => {
        if (matchResult && matchResult.match_id) {
            const timer = setTimeout(() => {
                navigate(`/${matchResult.match_id}`, {
                    state: {
                        matchedWith: matchResult.matched_with,
                        question: matchResult.question,
                        matchId: matchResult.match_id,
                    },
                    replace: true // Replaces the matching screen in history
                });
            }, AUTO_NAVIGATE_DELAY);

            return () => clearTimeout(timer);
        }
    }, [matchResult, navigate]);

    // --- EFFECT 2: Timer logic ---
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
    }, [matchCriteria, matchResult, onTimeout]);

    if (!matchCriteria) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const complexityClass = matchCriteria.complexity?.toLowerCase();

    // Match found screen (Now just an informative view while the user waits for auto-nav)
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
                        <p className="section-label" style={{ marginTop: "1rem", color: "green" }}>
                            Navigating to Session...
                        </p>
                    </div>
                    <div className="modal-actions">
                        {/* We keep the button just in case someone is impatient, or remove it entirely */}
                        <button onClick={() => navigate(`/${matchResult.match_id}`, {
                            state: {
                                matchedWith: matchResult.matched_with,
                                question: matchResult.question,
                                matchId: matchResult.match_id,
                                }})
                            }>
                            Go Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Timeout screen remains the same...
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
                        <button onClick={onRetry}>Retry</button>
                        <button onClick={onClose} className="danger">Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    // Searching screen remains the same...
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
                    <button onClick={onClose} className="danger">Cancel</button>
                </div>
            </div>
        </div>
    );
}