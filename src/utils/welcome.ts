export const welcome = () => {
  const date = new Date(Date.now());
  const hours = date.getHours();
  const projectName = process.env.PROJECT_NAME || "BradMarquis Backend";
  let greeting = "";

  // Time-based greeting
  if (hours < 12) {
    greeting = "Good morning. The system is ready.";
  } else if (hours < 18) {
    greeting = "Good afternoon. Everything is running smoothly.";
  } else {
    greeting = "Good evening. Services are online.";
  }

  return `
      <main class="status-shell">
        <section class="status-card">
          <p class="eyebrow">PROJECT STATUS</p>
          <h1>${projectName}</h1>
          <p class="subtitle">${greeting}</p>

          <div class="pill-row">
            <span class="pill">API: ONLINE</span>
            <span class="pill">ENV: PRODUCTION</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <p class="label">Server Time</p>
              <p class="value">${date.toUTCString()}</p>
            </div>
            <div class="meta-item">
              <p class="label">Base Route</p>
              <p class="value">/api/v1</p>
            </div>
          </div>

          <p class="hint">If this page loads, deployment is successful and the backend is reachable.</p>
        </section>
      </main>

      <style>
        :root {
          --bg-1: #0b1f3a;
          --bg-2: #12355b;
          --card: #ffffff;
          --text: #0f172a;
          --muted: #475569;
          --accent: #0ea5e9;
          --accent-2: #22c55e;
          --border: #dbe3ef;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          background: radial-gradient(circle at 15% 20%, #1d4ed8 0%, transparent 45%),
            radial-gradient(circle at 85% 0%, #0ea5e9 0%, transparent 38%),
            linear-gradient(140deg, var(--bg-1), var(--bg-2));
          color: var(--text);
          min-height: 100vh;
        }

        .status-shell {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .status-card {
          width: min(820px, 100%);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22);
          animation: riseIn 460ms ease-out;
        }

        .eyebrow {
          margin: 0 0 10px;
          font-size: 12px;
          letter-spacing: 0.12em;
          font-weight: 700;
          color: var(--accent);
        }

        h1 {
          margin: 0;
          font-size: clamp(28px, 5vw, 44px);
          line-height: 1.1;
        }

        .subtitle {
          margin: 12px 0 18px;
          color: var(--muted);
          font-size: clamp(15px, 2.4vw, 20px);
        }

        .pill-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .pill {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          border: 1px solid #bae6fd;
          background: #f0f9ff;
          color: #0369a1;
          padding: 7px 10px;
          border-radius: 999px;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .meta-item {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px;
          background: #fafcff;
        }

        .label {
          margin: 0 0 6px;
          color: var(--muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .value {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          word-break: break-word;
        }

        .hint {
          margin: 16px 0 0;
          color: #166534;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .status-card {
            padding: 20px;
          }

          .meta-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    `;
};
