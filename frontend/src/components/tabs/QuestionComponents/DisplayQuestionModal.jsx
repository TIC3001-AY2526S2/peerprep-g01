export default function DisplayQuestionModal({ question, onClose }) {
    if (!question) return null;

    const getComplexityClass = (complexity) => {
        switch (complexity?.toLowerCase()) {
            case 'easy':
                return 'complexity-badge-easy';
            case 'medium':
                return 'complexity-badge-medium';
            case 'hard':
                return 'complexity-badge-hard';
            default:
                return 'complexity-badge-medium';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="display-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header Section */}
                <div className="display-header">
                    <h2 className="display-title">{question.title}</h2>

                    {/* Category Tags */}
                    <div className="category-tags">
                        {Array.isArray(question.category) ? (
                            question.category.map((cat, index) => (
                                <span key={index} className="category-tag">
                                    {cat}
                                </span>
                            ))
                        ) : (
                            <span className="category-tag">{question.category}</span>
                        )}
                    </div>

                    {/* Complexity Badge */}
                    <div className="complexity-container">
                        <span className={`complexity-badge ${getComplexityClass(question.complexity)}`}>
                            {question.complexity}
                        </span>
                    </div>
                </div>

                {/* Description Section */}
                <div className="display-section">
                    <h3 className="section-label">Description</h3>
                    <div className="description-content">
                        {question.description}
                    </div>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                    <button onClick={onClose} className="secondary">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
