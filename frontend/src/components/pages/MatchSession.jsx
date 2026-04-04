import { useParams, useLocation } from "react-router-dom";

export default function MatchSession() {
    const { matchId } = useParams();
    const { state } = useLocation();

    const { matchedWith, question } = state || {};

    return (
        <div>
            <h1>Match Session</h1>
            <p>Match ID: {matchId}</p>
            <p>Matched With: {matchedWith?.username}</p>
            <p>Question: {question?.title}</p>
            <p>{question?.description}</p>
        </div>
    );
}