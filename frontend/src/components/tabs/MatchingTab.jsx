import { useState, useEffect, useRef } from "react";
import DisplayMatchLoading from "./MatchingComponents/DisplayMatchLoading";
import MatchSelector from "./MatchingComponents/MatchSelector";
import { createMatchingSocket, sendMatchRequest, closeMatchingSocket } from "../../services/matchingService";


export default function MatchingTab({ showToast, currentUser }) {
    const [error, setError] = useState("");
    const [displayLoading, setLoading] = useState(null);
    const [matchResult, setMatchResult] = useState(null);
    const [payload, setPayload] = useState(null);
    const wsRef = useRef(null);

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
            }
        });

        ws.onopen = () => {
            sendMatchRequest(ws, payload);
        };

        wsRef.current = ws;

        return () => closeMatchingSocket(wsRef.current);
    }, [payload]);

    return (
        <>
            <MatchSelector
                currentUser={currentUser}
                setPayload={(p) => { setMatchResult(null); setPayload(p); }}
                setLoading={setLoading}
                setError={setError}
                error={error}
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
