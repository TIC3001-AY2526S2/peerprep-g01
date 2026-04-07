import { useParams, useLocation } from "react-router-dom";
import React, { useEffect, useRef, useMemo } from 'react'; // Added useMemo
import { socket } from "../../services/collaborationService";
import { EditorView, basicSetup } from 'codemirror';
import { debounce } from 'lodash';
import { python } from "@codemirror/lang-python";
import { Annotation } from "@codemirror/state";

const ExternalUpdate = Annotation.define();

export default function CollabSession() {
  const { matchId } = useParams();
  const location = useLocation();
  const { question } = location.state || {};
  const editorRef = useRef(null);
  const viewRef = useRef(null);

  // 1. Create the stable debounced function
  const debouncedEmit = useMemo(
    () =>
      debounce((id, content) => {
        socket.emit("code_update", { matchId: id, content });
        console.log("Debounced sync sent to Redis");
      }, 500),
    []
  );

  useEffect(() => {
    if (!matchId) return;

    socket.connect();
    socket.emit('join_room', { matchId });

    const view = new EditorView({
      doc: "// Welcome to your session\n",
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
        // data.content or data depending on your backend structure
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
    <div style={{ padding: '20px', background: 'white', minHeight: '100vh' }}>
      <h2 style={{ color: 'black' }}>Session ID: {matchId || "NONE"}</h2>
      <div
        ref={editorRef}
        style={{ border: '1px solid #ccc', height: '500px', color: 'black' }}
      />
    </div>
  );
}