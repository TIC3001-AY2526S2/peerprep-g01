import { useState, useEffect, useRef } from "react";
import RejoinSession from "./MatchingComponents/RejoinSession";
import DisplayMatchLoading from "./MatchingComponents/DisplayMatchLoading";
import MatchSelector from "./MatchingComponents/MatchSelector";
import { useNavigate } from "react-router-dom";
import {
  createMatchingSocket,
  sendMatchRequest,
  closeMatchingSocket,
} from "../../services/matchingService";

const LAST_SESSION_KEY = "lastSession";

export default function MatchingTab({ showToast, currentUser }) {
  const [error, setError] = useState("");
  const [displayLoading, setLoading] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [payload, setPayload] = useState(null);
  const [lastSession, setLastSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem(LAST_SESSION_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // only restore if it belongs to the current user
      return parsed.userId === currentUser?.id ? parsed : null;
    } catch {
      return null;
    }
  });
  const wsRef = useRef(null);

  useEffect(() => {
    if (matchResult?.match_id) {
      const session = {
        matchId: matchResult.match_id,
        matchedWith: matchResult.matched_with,
        question: matchResult.question,
        userId: currentUser.id,
      };
      sessionStorage.setItem(LAST_SESSION_KEY, JSON.stringify(session));
      setLastSession(session);
    }
  }, [matchResult]);

  useEffect(() => {
    if (!payload) return;

    const ws = createMatchingSocket({
      onMessage: (data) => {
        if (data.status === "matched") {
          setLoading(false);
          showToast?.("Match found!");
          setMatchResult(data);
        }
      },
      onError: () => {
        setError("Connection error. Please try again.");
        setLoading(false);
      },
      onClose: () => {
        setLoading(false);
      },
    });

    ws.onopen = () => {
      sendMatchRequest(ws, payload);
    };

    wsRef.current = ws;

    return () => closeMatchingSocket(wsRef.current);
  }, [payload]);

  const handleDismissSession = () => {
    sessionStorage.removeItem(LAST_SESSION_KEY);
    setLastSession(null);
  };

  return (
    <>
      <MatchSelector
        currentUser={currentUser}
        setPayload={(p) => {
          setMatchResult(null);
          setPayload(p);
        }}
        setLoading={setLoading}
        setError={setError}
        error={error}
        hasActiveSession={!!lastSession}
      />

      <RejoinSession
        lastSession={lastSession}
        onDismiss={handleDismissSession}
      />

      <DisplayMatchLoading
        matchCriteria={payload}
        matchResult={matchResult}
        onTimeout={() => {
          closeMatchingSocket(wsRef.current);
        }}
        onClose={() => {
          closeMatchingSocket(wsRef.current);
          setPayload(null);
        }}
        onRetry={() => {
          closeMatchingSocket(wsRef.current);
          setMatchResult(null);
          setPayload({ ...payload });
        }}
      />
    </>
  );
}
