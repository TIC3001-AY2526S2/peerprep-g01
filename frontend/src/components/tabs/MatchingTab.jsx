import { useState, useEffect, useRef } from "react";
import RejoinSession from "./MatchingComponents/RejoinSession";
import DisplayMatchLoading from "./MatchingComponents/DisplayMatchLoading";
import MatchSelector from "./MatchingComponents/MatchSelector";
import {
  createMatchingSocket,
  sendMatchRequest,
  closeMatchingSocket,
} from "../../services/matchingService";

const COLLAB_URL = import.meta.env.VITE_COLLAB_URL || "http://localhost:3003";

export default function MatchingTab({ showToast, currentUser }) {
  const [error, setError] = useState("");
  const [displayLoading, setLoading] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [payload, setPayload] = useState(null);
  const [lastSession, setLastSession] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${COLLAB_URL}/session/user/${currentUser.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.session) setLastSession(data.session);
      })
      .catch((e) => console.error("[!] Failed to fetch user session:", e));
  }, [currentUser?.id]);

  useEffect(() => {
    if (matchResult?.match_id) {
      setLastSession({
        matchId: matchResult.match_id,
        matchedWith: matchResult.matched_with,
        question: matchResult.question,
        userId: currentUser.id,
      });
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
    if (!currentUser?.id) return;
    fetch(`${COLLAB_URL}/session/user/${currentUser.id}`, {
      method: "DELETE",
    }).catch((e) => console.error("[!] Failed to clear user session:", e));
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
        onTimeout={() => closeMatchingSocket(wsRef.current)}
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
