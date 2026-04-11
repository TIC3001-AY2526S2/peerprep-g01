import { useParams, useLocation, useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useMemo, useState } from "react";
import { socket } from "../../services/collaborationService";
import { basicSetup } from "codemirror";
import { debounce } from "lodash";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { Annotation, StateEffect, StateField } from "@codemirror/state";
import { WidgetType, EditorView, Decoration } from "@codemirror/view";
import { useAuth } from "../auth/AuthContext";


const ExternalUpdate = Annotation.define();

const setRemoteCursor = StateEffect.define();

// A widget that renders the cursor line + label
class RemoteCursorWidget extends WidgetType {
  constructor(username) { super(); this.username = username; }
  toDOM() {
    const wrap = document.createElement("span");
      wrap.style.cssText = `
        border-left: 2px solid #f97316;
        margin-left: -1px;
        position: relative;
        display: inline-block;
        height: 1em;
        vertical-align: text-bottom;
        pointer-events: auto;
        cursor: default;
      `;
      const label = document.createElement("span");
      label.textContent = this.username;
      label.style.cssText = `
        position: absolute;
        top: -18px;
        left: 0;
        background: #f97316;
        color: white;
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 3px;
        white-space: nowrap;
        font-family: sans-serif;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
      `;
      wrap.appendChild(label);

      wrap.addEventListener("mouseenter", () => { label.style.opacity = "1"; });
      wrap.addEventListener("mouseleave", () => { label.style.opacity = "0"; });

      return wrap;
    }
  eq(other) { return other.username === this.username; }
  ignoreEvent() { return true; }
}

// StateField holds the DecorationSet for remote cursors
const remoteCursorField = StateField.define({
  create() { return Decoration.none; },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes); // shift positions with edits
    for (const effect of tr.effects) {
      if (effect.is(setRemoteCursor)) {
        const { index, username } = effect.value;
        const clamped = Math.min(index, tr.state.doc.length);
        const deco = Decoration.widget({
          widget: new RemoteCursorWidget(username),
          side: 1,
        }).range(clamped);
        decorations = Decoration.set([deco]);
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const COLLAB_URL = import.meta.env.VITE_COLLAB_URL || "http://localhost:3003";

const LANGUAGES = [
  {
    id: 1,
    name: "Python 3",
    language: "python",
    version: "3.10.0",
    mode: "python",
  },
  {
    id: 2,
    name: "JavaScript",
    language: "node",
    version: "18.15.0",
    mode: "javascript",
  },
  {
    id: 3,
    name: "TypeScript",
    language: "typescript",
    version: "5.0.3",
    mode: "javascript",
  },
  { id: 4, name: "Java", language: "java", version: "15.0.2", mode: "java" },
  { id: 5, name: "C++", language: "gcc", version: "10.2.0", mode: "cpp" },
  { id: 6, name: "C", language: "gcc", version: "10.2.0", mode: "cpp" },
  { id: 7, name: "C#", language: "mono", version: "6.12.0", mode: "java" },
  { id: 8, name: "Go", language: "go", version: "1.16.2", mode: "cpp" },
  { id: 9, name: "Rust", language: "rust", version: "1.50.0", mode: "cpp" },
  { id: 10, name: "Ruby", language: "ruby", version: "3.0.1", mode: "python" },
];

const getExtension = (mode) => {
  switch (mode) {
    case "javascript":
      return javascript();
    case "java":
      return java();
    case "cpp":
      return cpp();
    default:
      return python();
  }
};

export default function CollabSession() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [sessionData, setSessionData] = useState({
    question: location.state?.question || null,
    matchedWith: location.state?.matchedWith || null,
  });
  const [loadingSession, setLoadingSession] = useState(
    !location.state?.question,
  );
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [unreadCount, setUnreadCount] = useState(0);

  // Language + execution
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [stdin, setStdin] = useState("");
  const [execResult, setExecResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const chatEndRef = useRef(null);
  const langRef = useRef(LANGUAGES[0]);

  const partnerName = sessionData.matchedWith?.username || "Partner";
  const question = sessionData.question;

  useEffect(() => {
    if (sessionData.question) return;

    fetch(`${COLLAB_URL}/session/${matchId}`)
      .then((r) => r.json())
      .then((data) => {
        setSessionData((prev) => ({
          ...prev,
          question: data.question || null,
        }));
      })
      .catch((e) => console.error("[!] Failed to recover session:", e))
      .finally(() => setLoadingSession(false));
  }, [matchId, sessionData.question]);

  const debouncedEmit = useMemo(
    () =>
      debounce((id, content) => {
        socket.emit("code_update", { matchId: id, content });
      }, 500),
    [],
  );

  // --- Save code permanently ---
  const handleSave = async () => {
    if (!viewRef.current) return;
    const content = viewRef.current.state.doc.toString();
    setSaveStatus("saving");
    try {
      const res = await fetch(`${COLLAB_URL}/session/${matchId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, userId: user?.id }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  };

  const rebuildEditor = (lang) => {
    if (!editorRef.current) return;
    const currentContent = viewRef.current?.state.doc.toString() || "";
    viewRef.current?.destroy();
    const view = new EditorView({
      doc: currentContent,
      extensions: [
        basicSetup,
        getExtension(lang.mode),
        remoteCursorField,
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            !update.transactions.some((tr) => tr.annotation(ExternalUpdate))
          ) {
            debouncedEmit(matchId, update.state.doc.toString());
          }

          //cursor update
          if (update.selectionSet) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            socket.emit("cursor_update", {
              matchId,
              userId: user?.id,
              username: user?.username || "Partner",
              position: {
                index: head,
                line: line.number,
                col: head - line.from,
              },
            });
          }
        }),
      ],
      parent: editorRef.current,
    });
    viewRef.current = view;
  };

  const handleLanguageChange = (e) => {
    const lang = LANGUAGES.find((l) => l.id === Number(e.target.value));
    if (!lang) return;
    setSelectedLang(lang);
    langRef.current = lang;
    rebuildEditor(lang);
    socket.emit("language_change", {
      matchId,
      languageId: lang.id,
      language: lang.language,
      version: lang.version,
    });
  };

  const handleRun = async () => {
    if (!viewRef.current) return;
    setRunning(true);
    setExecResult(null);
    try {
      const res = await fetch(`${COLLAB_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: viewRef.current.state.doc.toString(),
          language: selectedLang.language,
          version: selectedLang.version,
          stdin,
        }),
      });
      setExecResult(await res.json());
    } catch (e) {
      setExecResult({ status: "Error", stderr: e.message });
    } finally {
      setRunning(false);
    }
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to leave the session?")) {
      socket.emit("leave_room", { matchId });
      socket.disconnect();
      navigate("/homepage");
    }
  };

  const handleSendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    socket.emit("chat_message", {
      matchId,
      message: msg,
      sender: user?.username || "Me",
      senderId: user?.id,
    });
    setChatMessages((prev) => [
      ...prev,
      { sender: "Me", message: msg, self: true },
    ]);
    setChatInput("");
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!matchId) return;
    
    socket.auth = { token: sessionStorage.getItem("token") };
    socket.connect();
    socket.emit("join_room", { matchId });
    socket.emit("request_history", { matchId });

    const view = new EditorView({
      doc: "# Start collaborating...\n",
      extensions: [
        basicSetup,
        getExtension(langRef.current.mode),
        remoteCursorField,
        EditorView.updateListener.of((update) => {
          if (
            update.docChanged &&
            !update.transactions.some((tr) => tr.annotation(ExternalUpdate))
          ) {
            const content = update.state.doc.toString();
            debouncedEmit(matchId, content);
          }
          if (update.selectionSet) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            socket.emit("cursor_update", {
              matchId,
              userId: user?.id,
              username: user?.username || "Partner",
              position: { index: head, line: line.number, col: head - line.from },
            });
          }
        }),
      ],
      parent: editorRef.current,
    });

    viewRef.current = view;

    socket.on("code_received", (data) => {
      if (viewRef.current) {
        const current = viewRef.current.state.doc.toString();
        const newContent = typeof data === "string" ? data : data.content;
        if (newContent !== current) {
          viewRef.current.dispatch({
            changes: { from: 0, to: current.length, insert: newContent },
            annotations: ExternalUpdate.of(true),
          });
        }
      }
    });

    socket.on("chat_message", (data) => {
      setChatMessages((prev) => [
        ...prev,
        { sender: data.sender, message: data.message, self: false },
      ]);
      if (!chatOpen) setUnreadCount((n) => n + 1);
    });

    socket.on("language_change", (data) => {
      const lang = LANGUAGES.find((l) => l.id === data.languageId);
      if (lang) {
        setSelectedLang(lang);
        langRef.current = lang;
        rebuildEditor(lang);
      }
    });

    socket.on("cursor_update", (data) => {
      if (data.userId === user?.id) return; // ignore own echo (shouldn't happen, but safe)
      if (viewRef.current) {
        viewRef.current.dispatch({
          effects: setRemoteCursor.of({
            index: data.position.index,
            username: data.username,
          }),
        });
      }
    });

    return () => {
      socket.off("code_received");
      socket.off("chat_message");
      socket.off("language_change");
      socket.off("cursor_update");
      view.destroy();
      debouncedEmit.cancel();
    };
  }, [matchId, debouncedEmit]);

  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  if (loadingSession) {
    return (
      <div
        className="app-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <p style={{ color: "#7b8ab8", fontFamily: "monospace" }}>
          Rejoining session...
        </p>
      </div>
    );
  }

  const saveLabel = {
    idle: "Save",
    saving: "Saving...",
    saved: "Saved ✓",
    error: "Error",
  }[saveStatus];
  const saveCls =
    saveStatus === "saved" ? "success" : saveStatus === "error" ? "danger" : "";

  return (
    <div
      className="app-container"
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      {/* Header */}
      <div className="tab-row">
        <h1 style={{ margin: 0 }}>Collaboration</h1>
        <div
          className="tab-actions"
          style={{ display: "flex", alignItems: "center", gap: "16px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "2px",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "13px",
                fontFamily: "monospace",
              }}
            >
              ROOM: {matchId?.slice(0, 8)}
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "13px",
                fontFamily: "monospace",
              }}
            >
              Partner: {partnerName}
            </span>
          </div>
          <button
            className={`btn-save ${saveCls}`}
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            style={saveBtnStyle(saveStatus)}
          >
            {saveLabel}
          </button>
          <button
            onClick={() => setChatOpen((o) => !o)}
            style={chatToggleStyle}
          >
            Chat{" "}
            {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
          </button>
          <button className="danger" onClick={handleExit}>
            Exit Session
          </button>
        </div>
      </div>

      {/* Main layout: editor + optional chat panel */}
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        {/* Left column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0,
          }}
        >
          {/* Question card */}
          <div className="card">
            <div className="display-title-row">
              <h2
                className="display-title"
                style={{ color: "#4a5dba", marginBottom: 0 }}
              >
                {question?.title || "Coding Task"}
              </h2>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                {question?.category && (
                  <div style={{ display: "flex", gap: "5px" }}>
                    {[].concat(question.category).map((cat, i) => (
                      <span
                        key={i}
                        className="category-tag"
                        style={{
                          background: "#4a5dba",
                          color: "white",
                          border: "none",
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {question?.complexity && (
                  <span
                    className={`complexity-badge complexity-badge-${question.complexity.toLowerCase()}`}
                  >
                    {question.complexity}
                  </span>
                )}
              </div>
            </div>
            <div className="description-content">
              {question?.description || "No description provided."}
            </div>
          </div>

          {/* Editor */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: "hidden",
              border: "2px solid #e0e4f0",
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                background: "#fafbff",
                borderBottom: "1px solid #e0e4f0",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <p className="profile-key" style={{ margin: 0 }}>
                Code Editor
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "12px", color: "#7b8ab8" }}>
                  Auto-sync enabled
                </span>
                <select
                  value={selectedLang.id}
                  onChange={handleLanguageChange}
                  style={langSelectStyle}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div ref={editorRef} style={{ minHeight: "450px" }} />
          </div>

          {/* Run panel */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleRun}
                disabled={running}
                style={runBtnStyle}
              >
                {running ? " Running..." : "▶ Run Code"}
              </button>
              <button
                onClick={() => setShowInput((s) => !s)}
                style={stdinToggleStyle}
              >
                {showInput ? "Hide stdin" : "Add stdin"}
              </button>
              {execResult && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    marginLeft: "auto",
                    color:
                      execResult.status === "Accepted"
                        ? "#16a34a"
                        : execResult.stderr || execResult.compile_output
                          ? "#dc2626"
                          : "#1e293b",
                  }}
                >
                  {execResult.status}
                  {execResult.time && (
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#64748b",
                        marginLeft: "8px",
                      }}
                    >
                      {execResult.time}s
                    </span>
                  )}
                  {execResult.memory && (
                    <span
                      style={{
                        fontWeight: 400,
                        color: "#64748b",
                        marginLeft: "4px",
                      }}
                    >
                      {Math.round(execResult.memory / 1024)}MB
                    </span>
                  )}
                </span>
              )}
            </div>
            {showInput && (
              <textarea
                value={stdin}
                onChange={(e) => {
                  setStdin(e.target.value);
                  socket.emit("stdin_update", {
                    matchId,
                    stdin: e.target.value,
                  });
                }}
                placeholder="stdin (optional)"
                rows={3}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  resize: "vertical",
                  border: "1.5px solid #dce3f3",
                  borderRadius: "8px",
                  padding: "8px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            )}
            {execResult && (
              <div style={outputPanelStyle}>
                {execResult.compile_output && (
                  <>
                    <p style={outputLabelStyle}>Compile Output</p>
                    <pre style={{ ...outputPreStyle, color: "#f87171" }}>
                      {execResult.compile_output}
                    </pre>
                  </>
                )}
                {execResult.stderr && (
                  <>
                    <p style={outputLabelStyle}>Stderr</p>
                    <pre style={{ ...outputPreStyle, color: "#f87171" }}>
                      {execResult.stderr}
                    </pre>
                  </>
                )}
                {execResult.stdout !== null &&
                  execResult.stdout !== undefined && (
                    <>
                      <p style={outputLabelStyle}>Output</p>
                      <pre style={outputPreStyle}>
                        {execResult.stdout || "(no output)"}
                      </pre>
                    </>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div style={chatPanelStyle}>
            <div style={chatHeaderStyle}>
              <span style={{ fontWeight: 600, fontSize: "14px" }}>Chat</span>
              <button onClick={() => setChatOpen(false)} style={chatCloseStyle}>
                ×
              </button>
            </div>

            <div style={chatBodyStyle}>
              {chatMessages.length === 0 && (
                <p
                  style={{
                    color: "#9ca3b8",
                    fontSize: "12px",
                    textAlign: "center",
                    marginTop: "20px",
                  }}
                >
                  No messages yet
                </p>
              )}
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: m.self ? "flex-end" : "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#9ca3b8",
                      marginBottom: "3px",
                    }}
                  >
                    {m.self ? "You" : m.sender}
                  </span>
                  <div style={bubbleStyle(m.self)}>{m.message}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div style={chatInputAreaStyle}>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Type a message... (Enter to send)"
                rows={2}
                style={chatTextareaStyle}
              />
              <button
                onClick={handleSendChat}
                style={chatSendStyle}
                disabled={!chatInput.trim()}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Inline styles ---
const saveBtnStyle = (status) => ({
  padding: "6px 16px",
  borderRadius: "8px",
  border: "1.5px solid",
  borderColor:
    status === "saved"
      ? "#86efac"
      : status === "error"
        ? "#fca5a5"
        : "rgba(255,255,255,0.4)",
  background:
    status === "saved"
      ? "rgba(34,197,94,0.15)"
      : status === "error"
        ? "rgba(239,68,68,0.15)"
        : "transparent",
  color:
    status === "saved"
      ? "#86efac"
      : status === "error"
        ? "#fca5a5"
        : "rgba(255,255,255,0.9)",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  transition: "all 0.2s",
});

const chatToggleStyle = {
  padding: "6px 16px",
  borderRadius: "8px",
  border: "1.5px solid rgba(255,255,255,0.4)",
  color: "rgba(255,255,255,0.9)",
  background: "transparent",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const badgeStyle = {
  background: "#ef4444",
  color: "white",
  borderRadius: "50%",
  width: "18px",
  height: "18px",
  fontSize: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
};

const chatPanelStyle = {
  width: "300px",
  flexShrink: 0,
  background: "#fff",
  border: "1.5px solid #e0e4f0",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  height: "600px",
  boxShadow: "0 4px 24px rgba(79,110,247,.08)",
};

const chatHeaderStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #e0e4f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fafbff",
  borderRadius: "12px 12px 0 0",
};

const chatCloseStyle = {
  background: "none",
  border: "none",
  fontSize: "18px",
  cursor: "pointer",
  color: "#9ca3b8",
  lineHeight: 1,
};

const chatBodyStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "12px 16px",
  display: "flex",
  flexDirection: "column",
};

const chatInputAreaStyle = {
  padding: "10px",
  borderTop: "1px solid #e0e4f0",
  display: "flex",
  gap: "8px",
  alignItems: "flex-end",
};

const chatTextareaStyle = {
  flex: 1,
  resize: "none",
  border: "1.5px solid #dce3f3",
  borderRadius: "8px",
  padding: "8px",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
};

const chatSendStyle = {
  padding: "8px 14px",
  background: "#4f6ef7",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
};

const langSelectStyle = {
  padding: "4px 10px",
  borderRadius: "6px",
  border: "1.5px solid #dce3f3",
  background: "#fff",
  color: "#1e293b",
  fontSize: "12px",
  fontFamily: "inherit",
  cursor: "pointer",
  outline: "none",
};

const runBtnStyle = {
  padding: "8px 20px",
  borderRadius: "8px",
  border: "none",
  background: "#4a5dba",
  color: "white",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
};

const stdinToggleStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1.5px solid #dce3f3",
  background: "transparent",
  color: "#4a5dba",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
};

const outputPanelStyle = {
  marginTop: "14px",
  background: "#0f172a",
  borderRadius: "8px",
  padding: "14px 16px",
  maxHeight: "260px",
  overflowY: "auto",
};

const outputLabelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#64748b",
  marginBottom: "6px",
  marginTop: "8px",
};

const outputPreStyle = {
  fontFamily: "monospace",
  fontSize: "13px",
  color: "#e2e8f0",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  margin: 0,
};

const bubbleStyle = (self) => ({
  background: self ? "#4f6ef7" : "#f0f4ff",
  color: self ? "white" : "#1e293b",
  padding: "8px 12px",
  borderRadius: self ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
  fontSize: "13px",
  maxWidth: "220px",
  wordBreak: "break-word",
  lineHeight: 1.4,
});
