import { useParams, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useMemo } from 'react';
import { socket } from "../../services/collaborationService";
import { EditorView, basicSetup } from 'codemirror';
import { debounce } from 'lodash';
import { python } from "@codemirror/lang-python";
import { Annotation } from "@codemirror/state";

const ExternalUpdate = Annotation.define();

export default function CollabSession() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { question } = location.state || {};
  const editorRef = useRef(null);
  const viewRef = useRef(null);
    console.log("Current question data:", question);
  const debouncedEmit = useMemo(
    () =>
      debounce((id, content) => {
        socket.emit("code_update", { matchId: id, content });
        console.log("Debounced sync sent to Redis");
      }, 500),
    []
  );

  const handleExit = () => {
    if (window.confirm("Are you sure you want to leave the session?")) {
      socket.emit('leave_room', { matchId });
      socket.disconnect();
      navigate("/");
    }
  };

  useEffect(() => {
    if (!matchId) return;

    socket.connect();
    socket.emit('join_room', { matchId });

    const view = new EditorView({
      doc: "# Start collaborating...\n",
      extensions: [
        basicSetup,
        python(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !update.transactions.some(tr => tr.annotation(ExternalUpdate))) {
            const content = update.state.doc.toString();
            debouncedEmit(matchId, content);
          }
        }),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;

    socket.on('code_received', (data) => {
      if (viewRef.current) {
        const current = viewRef.current.state.doc.toString();
        const newContent = typeof data === 'string' ? data : data.content;

        if (newContent !== current) {
          viewRef.current.dispatch({
            changes: { from: 0, to: current.length, insert: newContent },
            annotations: ExternalUpdate.of(true)
          });
        }
      }
    });

    return () => {
      socket.off('code_received');
      view.destroy();
      debouncedEmit.cancel();
    };
  }, [matchId, debouncedEmit]);

return (
    <div className="app-container">
      {/* Header Area */}
      <div className="tab-row">
        <h1 style={{ margin: 0 }}>Collaboration</h1>
        <div className="tab-actions">
           <span style={{ color: 'white'}}>Room: {matchId?.slice(0, 8)}</span>
           <button className="danger" onClick={handleExit}>Exit Session</button>
        </div>
      </div>

      {/* Question Info Card */}
      <div className="card">
        <div className="display-title-row">
          <h2 className="display-title" style={{ color: '#4a5dba', marginBottom: '0' }}>
            {question?.title || "Coding Task"}
          </h2>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Category Tags */}
            {question?.category && (
              <div style={{ display: 'flex', gap: '5px' }}>
                {/* Force it into an array just in case it's a string, then map */}
                {[].concat(question.category).map((cat, index) => (
                  <span
                    key={index}
                    className="category-tag"
                    style={{ background: '#4a5dba', color: 'white', border: 'none' }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Complexity Badge */}
            {question?.complexity && (
              <span className={`complexity-badge complexity-badge-${question.complexity.toLowerCase()}`}>
                {question.complexity}
              </span>
            )}
          </div>
        </div>

        <div className="description-content">
          {question?.description || "No description provided."}
        </div>
      </div>

      {/* Editor Section */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', border: '2px solid #e0e4f0' }}>
        <div style={{ padding: '12px 20px', background: '#fafbff', borderBottom: '1px solid #e0e4f0', display: 'flex', justifyContent: 'space-between' }}>
            <p className="profile-key" style={{ margin: 0 }}>Code Editor</p>
            <span style={{ fontSize: '12px', color: '#7b8ab8' }}>Auto-sync enabled</span>
        </div>
        <div ref={editorRef} style={{ minHeight: '450px' }} />
      </div>
    </div>
  );
}