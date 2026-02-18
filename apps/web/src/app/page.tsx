"use client";

import { useState } from "react";
import { userSchema, type User } from "@repo/validators";

// ─── Sample Data ────────────────────────────────────────
const VALID_USER = {
  name: "John Doe",
  email: "john@example.com",
  age: 25,
};

const INVALID_USER = {
  name: "J",            // too short (min 2)
  email: "not-an-email", // invalid email
  age: -5,              // negative number
};

export default function HomePage() {
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function validate(data: unknown, label: string) {
    const parsed = userSchema.safeParse(data);

    if (parsed.success) {
      setIsError(false);
      setResult(
        `✅ "${label}" is valid!\n\n` +
        JSON.stringify(parsed.data, null, 2)
      );
    } else {
      setIsError(true);
      const errors = parsed.error.flatten().fieldErrors;
      setResult(
        `❌ "${label}" has validation errors:\n\n` +
        JSON.stringify(errors, null, 2)
      );
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔗 Shared Validator Demo</h1>
        <p style={styles.subtitle}>
          This page uses the <strong>same Zod schema</strong> as the Express API.
          <br />
          Package: <code>@repo/validators</code>
        </p>

        <div style={styles.buttonRow}>
          <button
            onClick={() => validate(VALID_USER, "Valid User")}
            style={{ ...styles.button, ...styles.buttonSuccess }}
          >
            ✅ Validate Good Data
          </button>
          <button
            onClick={() => validate(INVALID_USER, "Invalid User")}
            style={{ ...styles.button, ...styles.buttonDanger }}
          >
            ❌ Validate Bad Data
          </button>
        </div>

        {result && (
          <pre style={{
            ...styles.result,
            borderColor: isError ? "#ef4444" : "#22c55e",
            backgroundColor: isError ? "#fef2f2" : "#f0fdf4",
          }}>
            {result}
          </pre>
        )}

        <div style={styles.info}>
          <h3>📦 How this works</h3>
          <ul>
            <li><code>@repo/validators</code> lives in <code>packages/validators/</code></li>
            <li>This Next.js app imports it via <code>workspace:*</code></li>
            <li>The Express API uses the <strong>exact same schema</strong></li>
            <li>One schema, two apps, zero duplication ✨</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

// ─── Inline Styles (keeping it simple) ─────────────────
const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: "2rem",
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "2.5rem",
    maxWidth: "600px",
    width: "100%",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    margin: "0 0 0.5rem 0",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#64748b",
    lineHeight: 1.6,
    margin: "0 0 1.5rem 0",
  },
  buttonRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  button: {
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "none",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "transform 0.1s",
    color: "#ffffff",
  },
  buttonSuccess: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
  },
  buttonDanger: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
  },
  result: {
    padding: "1rem",
    borderRadius: "8px",
    border: "2px solid",
    fontSize: "0.85rem",
    fontFamily: "'Courier New', Courier, monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    marginBottom: "1.5rem",
    overflow: "auto",
  },
  info: {
    padding: "1rem 1.25rem",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "0.9rem",
    color: "#475569",
  },
};
