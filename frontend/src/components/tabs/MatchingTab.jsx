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

    // Use an AbortController to clean up if the component unmounts
    const controller = new AbortController();

    fetch(`${COLLAB_URL}/session/user/${currentUser.id}`, {
      signal: controller.signal
    })
      .then((r) => {
        // Check if response is actually okay (200-299)
        if (!r.ok) throw new Error(`Server responded with ${r.status}`);
        return r.json();
      })
      .then((data) => {
        // Only update if data exists
        if (data && data.session) {
          setLastSession(data.session);
        } else {
          setLastSession(null);
        }
      })
      .catch((e) => {
        // This catches container-down errors (Connection Refused)
        if (e.name === 'AbortError') return;

        console.warn("[!] Collaboration Service unreachable. User session check skipped.", e.message);
        // Explicitly set to null so the UI doesn't hang waiting
        setLastSession(null);
      });

    return () => controller.abort();
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

    // 1. Optimistically clear UI state first
    setLastSession(null);

    // 2. Attempt to notify the server in the background
    fetch(`${COLLAB_URL}/session/user/${currentUser.id}`, {
      method: "DELETE",
    }).catch((e) => {
      // If this fails, it's okay because the container is likely down.
      // The session in Redis will eventually expire on its own.
      console.warn("[!] Background session clear failed (Service offline).", e.message);
    });
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
