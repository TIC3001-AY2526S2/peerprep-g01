const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #f0f4ff;
    --surface:   #ffffff;
    --border:    #dce3f3;
    --accent:    #4f6ef7;
    --accent2:   #7c3aed;
    --danger:    #ef4444;
    --success:   #22c55e;
    --text:      #1e293b;
    --muted:     #64748b;
    --card-bg:   #ffffff;
    --radius:    12px;
    --font:      'Inter', sans-serif;
    --shadow:    0 4px 24px rgba(79,110,247,.08), 0 1px 4px rgba(0,0,0,.06);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    min-height: 100vh;
  }

  /* ── Layout ── */
  .layout {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,110,247,.12) 0%, transparent 60%),
      var(--bg);
  }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    width: 100%;
    max-width: 420px;
    padding: 2.5rem 2.5rem 2rem;
    box-shadow: var(--shadow);
  }

  /* ── Logo ── */
  .logo {
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: .04em;
    color: var(--accent);
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: .5rem;
    margin-bottom: 2rem;
  }

  .logo-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--accent);
    display: inline-block;
  }

  /* ── Typography ── */
  h1 {
    font-weight: 700;
    font-size: 1.6rem;
    color: var(--text);
    margin-bottom: .3rem;
    line-height: 1.2;
  }

  h2 {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--text);
    margin-bottom: 1rem;
  }

  .subtitle {
    font-size: .85rem;
    color: var(--muted);
    margin-bottom: 2rem;
  }

  /* ── Form fields ── */
  .field { margin-bottom: 1.1rem; }

  label {
    display: block;
    font-size: .75rem;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: .4rem;
  }

  input, select {
    width: 100%;
    padding: .7rem 1rem;
    background: #f8faff;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-family: var(--font);
    font-size: .9rem;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    appearance: none;
  }

  input:focus, select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(79,110,247,.12);
    background: #ffffff;
  }

  input::placeholder { color: #b0bdd6; }

  .field-error {
    font-size: .75rem;
    color: var(--danger);
    margin-top: .35rem;
  }

  /* ── Buttons ── */
  .btn {
    width: 100%;
    padding: .8rem;
    margin-top: .4rem;
    background: var(--accent);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-family: var(--font);
    font-weight: 600;
    font-size: .9rem;
    cursor: pointer;
    transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 2px 8px rgba(79,110,247,.25);
  }

  .btn:hover:not(:disabled) {
    background: #3b55e0;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79,110,247,.35);
  }

  .btn:disabled { opacity: .55; cursor: not-allowed; }

  .btn-ghost {
    background: transparent;
    color: var(--accent);
    border: 1.5px solid var(--border);
    box-shadow: none;
    margin-top: .8rem;
  }

  .btn-ghost:hover:not(:disabled) {
    border-color: var(--accent);
    background: rgba(79,110,247,.05);
    box-shadow: none;
  }

  .btn-logout {
    padding: .4rem .9rem;
    background: transparent;
    color: var(--danger);
    border: 1.5px solid #fecaca;
    border-radius: 8px;
    cursor: pointer;
    font-size: .82rem;
    font-family: var(--font);
    font-weight: 500;
    transition: background .2s, border-color .2s;
  }

  .btn-logout:hover {
    background: #fef2f2;
    border-color: var(--danger);
  }

  .btn-profile {
    padding: .4rem .9rem;
    background: transparent;
    color: var(--text);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    font-size: .82rem;
    font-family: var(--font);
    font-weight: 500;
    transition: all .2s;
  }

  .btn-profile:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(79,110,247,.05);
  }

  /* ── Alerts ── */
  .alert {
    padding: .75rem 1rem;
    border-radius: 8px;
    font-size: .82rem;
    margin-bottom: 1.2rem;
  }

  .alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .alert-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
  }

  /* ── Switch link ── */
  .switch-link {
    text-align: center;
    margin-top: 1.5rem;
    font-size: .82rem;
    color: var(--muted);
  }

  .switch-link button {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    font-family: var(--font);
    font-size: .82rem;
    font-weight: 600;
    text-decoration: underline;
    padding: 0;
    margin-left: .3rem;
  }

  /* ── Profile ── */
  .profile-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .avatar {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 1.2rem;
    color: #fff; flex-shrink: 0;
  }

  .profile-name { font-weight: 700; font-size: 1.1rem; color: var(--text); }
  .profile-email { font-size: .8rem; color: var(--muted); margin-top: .15rem; }

  .badge {
    display: inline-flex; align-items: center; gap: .3rem;
    padding: .2rem .6rem;
    border-radius: 20px;
    font-size: .7rem;
    font-weight: 600;
    letter-spacing: .04em;
    text-transform: uppercase;
    margin-top: .35rem;
  }

  .badge-admin {
    background: rgba(124,58,237,.1);
    color: var(--accent2);
    border: 1px solid rgba(124,58,237,.25);
  }

  .badge-user {
    background: rgba(79,110,247,.1);
    color: var(--accent);
    border: 1px solid rgba(79,110,247,.25);
  }

  .badge-guest {
    background: rgba(100,116,139,.1);
    color: var(--muted);
    border: 1px solid rgba(100,116,139,.25);
  }

  /* ── Info grid ── */
  .info-grid {
    display: flex;
    flex-direction: column;
    gap: .6rem;
    margin-bottom: 1.5rem;
  }

  .info-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: .75rem 1rem;
    background: #f8faff;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .info-key {
    font-size: .72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--muted);
  }

  .info-val {
    font-size: .88rem;
    color: var(--text);
    font-weight: 500;
  }

  /* ── Permissions ── */
  .permissions {
    padding: 1rem;
    background: #f8faff;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .permissions h3 {
    font-size: .72rem;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: .75rem;
  }

  .perm-list { display: flex; flex-wrap: wrap; gap: .4rem; }

  .perm-tag {
    padding: .2rem .6rem;
    border-radius: 4px;
    font-size: .72rem;
    font-weight: 500;
    background: rgba(79,110,247,.08);
    color: var(--accent);
    border: 1px solid rgba(79,110,247,.2);
  }

  /* ── Tab row ── */
  .tab-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    border-bottom: 1.5px solid var(--border);
    padding-bottom: .75rem;
  }

  .tab-switcher {
    display: flex;
    gap: .4rem;
  }

  .tab-btn {
    padding: .4rem 1.1rem;
    background: transparent;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    color: var(--muted);
    font-family: var(--font);
    font-size: .82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all .2s;
  }

  .tab-btn.active {
    background: var(--accent);
    color: #ffffff;
    border-color: var(--accent);
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(79,110,247,.25);
  }

  .tab-btn:hover:not(.active) {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(79,110,247,.05);
  }

  .tab-actions {
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  /* ── User manager table ── */
  .user-manager { margin-top: 1rem; }

  .user-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .85rem;
  }

  .user-table th {
    text-align: left;
    padding: .6rem 1rem;
    font-size: .72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--muted);
    border-bottom: 1.5px solid var(--border);
    background: #f8faff;
  }

  .user-table td {
    padding: .75rem 1rem;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    vertical-align: middle;
  }

  .user-table tr:last-child td { border-bottom: none; }
  .user-table tr:hover td { background: #f8faff; }

  .role-badge {
    display: inline-block;
    padding: .2rem .6rem;
    border-radius: 20px;
    font-size: .7rem;
    font-weight: 600;
  }

  .role-badge.admin {
    background: rgba(124,58,237,.1);
    color: var(--accent2);
    border: 1px solid rgba(124,58,237,.25);
  }

  .role-badge.user {
    background: rgba(79,110,247,.1);
    color: var(--accent);
    border: 1px solid rgba(79,110,247,.25);
  }

  .user-actions { display: flex; gap: .4rem; }

  .btn-promote {
    padding: .3rem .75rem;
    border-radius: 6px;
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--accent);
    font-size: .78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all .2s;
  }

  .btn-promote:hover {
    background: rgba(79,110,247,.08);
    border-color: var(--accent);
  }

  .btn-delete {
    padding: .3rem .75rem;
    border-radius: 6px;
    border: 1.5px solid #fecaca;
    background: transparent;
    color: var(--danger);
    font-size: .78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all .2s;
  }

  .btn-delete:hover {
    background: #fef2f2;
    border-color: var(--danger);
  }

  /* ── Spinner ── */
  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin .6s linear infinite;
    display: inline-block;
    vertical-align: middle;
  }

  /* ── Animations ── */
  @keyframes spin { to { transform: rotate(360deg); } }

  .fade-in { animation: fadeIn .3s ease; }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default css;
