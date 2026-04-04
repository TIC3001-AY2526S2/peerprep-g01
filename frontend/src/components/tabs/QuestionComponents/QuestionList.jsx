import { useEffect, useState } from "react";
import { getQuestions, deleteQuestion } from "../../../services/questionService";

export default function QuestionList({
  onDisplay,
  onEdit,
  onDeleteSuccess,
  refresh,
  isAdmin,
}) {
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 5;

  const loadQuestions = async () => {
    try {
      const result = await getQuestions(currentPage, pageSize, search);
      setQuestions(result.data);

      if (result.total) {
        setTotalPages(Math.ceil(result.total / pageSize));
      } else if (result.totalPages) {
        setTotalPages(result.totalPages);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [refresh, search, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteQuestion(id);

      if (questions.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await loadQuestions();
      }

      onDeleteSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (question, e) => {
    e.stopPropagation();
    onEdit(question);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="card">
      <h2>Question List</h2>

      <input
        type="text"
        placeholder="Search questions by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-box"
      />

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

      {questions.length === 0 && <div>No questions in database</div>}

      {questions.map((q) => (
        <div
          key={q.id}
          onClick={() => onDisplay(q)}
          className="question-item"
          style={{ cursor: "pointer" }}
        >
          <div>
            <strong>{q.title}</strong>
          </div>

          <div>
            {isAdmin && (
              <>
                <button onClick={(e) => handleEdit(q, e)}>Edit</button>

                <button
                  className="danger"
                  onClick={(e) => handleDelete(q.id, e)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>

          <div className="pagination-numbers">
            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`pagination-number ${currentPage === page ? "active" : ""}`}
                >
                  {page}
                </button>
              ),
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
