import { useNavigate } from "react-router-dom";

export default function RejoinSession({ lastSession, onDismiss }) {
  const navigate = useNavigate();

  if (!lastSession) return null;

  const handleRejoin = () => {
    navigate(`/${lastSession.matchId}`, {
      state: {
        matchedWith: lastSession.matchedWith,
        question: lastSession.question,
        matchId: lastSession.matchId,
      },
    });
  };

  return (
    <div className="card" style={{ borderLeft: "3px solid #4a5dba" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2 style={{ marginBottom: "4px", fontSize: "15px" }}>
            Active Session
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            You have an unfinished session
            {lastSession.question?.title && (
              <>
                {" "}
                — <strong>{lastSession.question.title}</strong>
              </>
            )}
            {lastSession.matchedWith?.username && (
              <>
                {" "}
                with <strong>{lastSession.matchedWith.username}</strong>
              </>
            )}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexShrink: 0,
            marginLeft: "16px",
          }}
        >
          <button onClick={handleRejoin} style={rejoinBtnStyle}>
            Rejoin
          </button>
          <button onClick={onDismiss} style={dismissBtnStyle}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

const rejoinBtnStyle = {
  padding: "6px 16px",
  background: "#4a5dba",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
};

const dismissBtnStyle = {
  padding: "6px 16px",
  background: "transparent",
  color: "#64748b",
  border: "1.5px solid #dce3f3",
  borderRadius: "8px",
  fontWeight: 500,
  fontSize: "13px",
  cursor: "pointer",
};
