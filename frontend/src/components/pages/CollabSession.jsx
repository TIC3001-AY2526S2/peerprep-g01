import { useParams, useLocation } from "react-router-dom";
import React, { useEffect, useRef } from 'react';
import { socket } from "../../services/collaborationService";
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

export default function CollabSession() {
  const { matchId } = useParams();
  const location = useLocation();
  const { question } = location.state || {};
  const editorRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    if (!matchId) {
      console.error("CRITICAL: matchId is missing in CollabSession");
      return;
    }

    console.log("Attempting to join room:", matchId);
    socket.connect();
    socket.emit('join_room', { matchId });

    const view = new EditorView({
      doc: "// Welcome to your session\n",
      extensions: [
        basicSetup,
        javascript(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const content = update.state.doc.toString();
            socket.emit('code_update', { matchId, content });
          }
        }),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;

    socket.on('code_received', (data) => {
        const current = view.state.doc.toString();
        if (data.content !== current) {
          view.dispatch({
            changes: { from: 0, to: current.length, insert: data.content }
          });
        }
    });

    return () => {
      socket.off('code_received');
      view.destroy();
    };
  }, [matchId]);

  return (
    <div style={{ padding: '20px', background: 'white', minHeight: '100vh' }}>
      <h2 style={{ color: 'black' }}>Session ID: {matchId || "NONE"}</h2>
      <div
        ref={editorRef}
        style={{ border: '2px solid red', height: '500px', color: 'black' }}
      />
    </div>
  );
}
