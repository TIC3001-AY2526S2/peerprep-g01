const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0a0a0f;
    --surface:   #111118;
    --border:    #1e1e2e;
    --accent:    #6ee7b7;
    --accent2:   #818cf8;
    --danger:    #f87171;
    --text:      #e2e8f0;
    --muted:     #64748b;
    --card-bg:   #13131d;
    --radius:    14px;
    --font-head: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    min-height: 100vh;
  }

  .layout {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background:
      radial-gradient(ellipse 80% 60% at 50% -20%, rgba(110,231,183,.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(129,140,248,.07) 0%, transparent 60%),
      var(--bg);
  }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    width: 100%;
    max-width: 420px;
    padding: 2.5rem 2.5rem 2rem;
    box-shadow: 0 0 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.03);
  }

  .logo {
    font-family: var(--font-head);
    font-weight: 800;
    font-size: 1.1rem;
    letter-spacing: .12em;
    color: var(--accent);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: .5rem;
    margin-bottom: 2rem;
  }

  .logo-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); display: inline-block; }

  h1 {
    font-family: var(--font-head);
    font-weight: 700;
    font-size: 1.65rem;
    color: var(--text);
    margin-bottom: .35rem;
    line-height: 1.2;
  }

  .subtitle {
    font-size: .8rem;
    color: var(--muted);
    margin-bottom: 2rem;
    letter-spacing: .04em;
  }

  .field { margin-bottom: 1.2rem; }

  label {
    display: block;
    font-size: .72rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: .5rem;
  }

  input, select {
    width: 100%;
    padding: .75rem 1rem;
    background: rgba(255,255,255,.03);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-family: var(--font-mono);
    font-size: .88rem;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    appearance: none;
  }

  input:focus, select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(110,231,183,.1);
  }

  input::placeholder { color: var(--muted); }

  .field-error {
    font-size: .72rem;
    color: var(--danger);
    margin-top: .4rem;
    letter-spacing: .04em;
  }

  .btn {
    width: 100%;
    padding: .85rem;
    margin-top: .4rem;
    background: var(--accent);
    color: #0a0a0f;
    border: none;
    border-radius: 8px;
    font-family: var(--font-head);
    font-weight: 700;
    font-size: .9rem;
    letter-spacing: .06em;
    cursor: pointer;
    transition: opacity .2s, transform .15s;
    position: relative;
    overflow: hidden;
  }

  .btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
  .btn:disabled { opacity: .5; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    color: var(--accent2);
    border: 1px solid var(--border);
    margin-top: .8rem;
  }

  .btn-ghost:hover:not(:disabled) { border-color: var(--accent2); background: rgba(129,140,248,.06); }

  .alert {
    padding: .75rem 1rem;
    border-radius: 8px;
    font-size: .8rem;
    margin-bottom: 1.2rem;
    letter-spacing: .03em;
  }

  .alert-error { background: rgba(248,113,113,.08); border: 1px solid rgba(248,113,113,.2); color: var(--danger); }
  .alert-success { background: rgba(110,231,183,.08); border: 1px solid rgba(110,231,183,.2); color: var(--accent); }

  .switch-link {
    text-align: center;
    margin-top: 1.5rem;
    font-size: .78rem;
    color: var(--muted);
  }

  .switch-link button {
    background: none; border: none; color: var(--accent2);
    cursor: pointer; font-family: var(--font-mono); font-size: .78rem;
    text-decoration: underline; padding: 0; margin-left: .3rem;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .avatar {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-head); font-weight: 800; font-size: 1.2rem;
    color: #0a0a0f; flex-shrink: 0;
  }

  .profile-name { font-family: var(--font-head); font-weight: 700; font-size: 1.2rem; }
  .profile-email { font-size: .78rem; color: var(--muted); margin-top: .2rem; }

  .badge {
    display: inline-flex; align-items: center; gap: .3rem;
    padding: .25rem .6rem;
    border-radius: 20px;
    font-size: .72rem;
    font-weight: 500;
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-top: .4rem;
  }

  .badge-admin { background: rgba(129,140,248,.15); color: var(--accent2); border: 1px solid rgba(129,140,248,.3); }
  .badge-user  { background: rgba(110,231,183,.10); color: var(--accent);  border: 1px solid rgba(110,231,183,.25); }
  .badge-guest { background: rgba(100,116,139,.15); color: var(--muted);   border: 1px solid rgba(100,116,139,.3); }

  .info-grid { display: flex; flex-direction: column; gap: .8rem; margin-bottom: 2rem; }

  .info-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: .75rem 1rem;
    background: rgba(255,255,255,.025);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .info-key { font-size: .72rem; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }
  .info-val { font-size: .85rem; color: var(--text); }

  .permissions {
    padding: 1rem;
    background: rgba(255,255,255,.02);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .permissions h3 {
    font-family: var(--font-head); font-size: .8rem; letter-spacing: .1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: .75rem;
  }

  .perm-list { display: flex; flex-wrap: wrap; gap: .4rem; }

  .perm-tag {
    padding: .25rem .6rem; border-radius: 4px; font-size: .72rem;
    background: rgba(110,231,183,.07); color: var(--accent);
    border: 1px solid rgba(110,231,183,.15);
  }

  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(0,0,0,.3);
    border-top-color: #0a0a0f;
    border-radius: 50%;
    animation: spin .6s linear infinite;
    display: inline-block; vertical-align: middle;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .fade-in { animation: fadeIn .35s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .btn-logout {
    padding: .4rem .9rem;
    background: transparent;
    color: var(--danger);
    border: 1px solid var(--danger);
    border-radius: 8px;
    cursor: pointer;
    font-size: .82rem;
    font-family: var(--font-mono);
    transition: background .2s;
  }

  .btn-logout:hover {
    background: rgba(248, 113, 113, .1);
  }
`;

export default css;
