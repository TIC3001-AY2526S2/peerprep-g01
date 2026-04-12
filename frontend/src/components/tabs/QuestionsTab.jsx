import { useState } from "react";
import QuestionForm from "./QuestionComponents/QuestionForm";
import QuestionList from "./QuestionComponents/QuestionList";
import EditQuestionModal from "./QuestionComponents/EditQuestionModal";
import DisplayQuestionModal from "./QuestionComponents/DisplayQuestionModal";

export default function QuestionsTab({ isAdmin, showToast }) {
  const [displayQuestion, setDisplayQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [refresh, setRefresh] = useState(false);

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
    <>
      {isAdmin && <QuestionForm onSuccess={handleCreateSuccess} />}

      <QuestionList
        onDisplay={setDisplayQuestion}
        onEdit={isAdmin ? setEditingQuestion : undefined}
        onDeleteSuccess={isAdmin ? handleDeleteSuccess : undefined}
        refresh={refresh}
        isAdmin={isAdmin}
      />

      <EditQuestionModal
        question={editingQuestion}
        onClose={() => setEditingQuestion(null)}
        onSuccess={handleUpdateSuccess}
      />

      <DisplayQuestionModal
        question={displayQuestion}
        onClose={() => setDisplayQuestion(null)}
      />
    </>
  );
}
