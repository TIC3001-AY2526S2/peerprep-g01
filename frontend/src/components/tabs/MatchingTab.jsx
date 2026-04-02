import { useState } from "react";
import DisplayMatchLoading from "../DisplayMatchLoading";
import MatchSelector from "../MatchSelector";

export default function MatchingTab({ showToast, currentUser }) {
    const [error, setError] = useState("");
    const [displayLoading, setLoading] = useState(null);
    const [payload, setPayload] = useState(null);

    return (
        <>
            <MatchSelector
                currentUser={currentUser}
                setPayload={setPayload}
                setLoading={setLoading}
                setError={setError}
                error={error}
            />
            <DisplayMatchLoading
                matchCriteria={payload}
                onClose={() => setPayload(null)}
            />
        </>
    );
}
