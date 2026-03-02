import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose, duration = 5000 }) {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-content">
                <span className="toast-icon">
                    {type === "success" && "✓"}
                    {type === "error" && "✕"}
                    {type === "info" && "ℹ"}
                </span>
                <span className="toast-message">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose}>
                ×
            </button>
        </div>
    );
}
