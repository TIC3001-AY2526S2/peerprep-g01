import { useState } from "react";
import QuestionForm from "./components/QuestionForm";
import QuestionList from "./components/QuestionList";
import EditQuestionModal from "./components/EditQuestionModal";
import DisplayQuestionModal from "./components/DisplayQuestionModal";
import Toast from "./components/Toast";

export default function App() {
  const [displayQuestion, setDisplayQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
  };

  const handleDisplay = (question) => {
    setDisplayQuestion(question);
  };

  const handleCreateSuccess = (message = "Question created successfully!", type = "success") => {
      setRefresh((prev) => !prev);
      showToast(message, type);
  };

  const handleUpdateSuccess = () => {
    setRefresh((prev) => !prev);
    setEditingQuestion(null);
    showToast("Question updated successfully!");
  };

  const handleDeleteSuccess = () => {
    setRefresh((prev) => !prev);
    showToast("Question deleted successfully!");
  };

  return (
    <div className="app-container">
      <h1>PeerPrep Question Manager</h1>

      {/* Create question form */}
      <QuestionForm onSuccess={handleCreateSuccess} />

      {/* Question list */}
      <QuestionList
        onDisplay={handleDisplay}
        onEdit={handleEdit}
        onDeleteSuccess={handleDeleteSuccess}
        refresh={refresh}
      />

      {/* Edit modal */}
      <EditQuestionModal
        question={editingQuestion}
        onClose={() => setEditingQuestion(null)}
        onSuccess={handleUpdateSuccess}
      />

      {/* Display modal */}
      <DisplayQuestionModal
        question={displayQuestion}
        onClose={() => setDisplayQuestion(null)}
      />

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
