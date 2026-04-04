import EditQuestionForm from "./EditQuestionForm";

export default function EditQuestionModal({ question, onClose, onSuccess }) {
    if (!question) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <EditQuestionForm
                    question={question}
                    onSuccess={() => {
                        onSuccess();
                        onClose();
                    }}
                    onClose={onClose}
                />
            </div>
        </div>
    );
}
