export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <header style={{ maxWidth: "720px", margin: "0 auto" }}>
        <p
          style={{
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "var(--aether-cyan)",
            marginBottom: "1rem",
            fontWeight: 600,
          }}
        >
          Commercial Immersive 3D Showroom Platform
        </p>
        <h1
          style={{
            fontSize: "2.75rem",
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: "1.25rem",
            background: "linear-gradient(135deg, var(--pearl) 40%, var(--iris) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          RealmCanvas
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            lineHeight: 1.6,
            color: "rgba(231, 240, 255, 0.8)",
            marginBottom: "2rem",
          }}
        >
          Welcome to the foundation of RealmCanvas. Experience high-fidelity
          interactive product showrooms engineered for the modern web.
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "var(--slate)",
            borderRadius: "9999px",
            border: "1px solid rgba(55, 221, 235, 0.3)",
            fontSize: "0.875rem",
            color: "var(--pearl)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--aether-cyan)",
              display: "inline-block",
            }}
          />
          <span>RC-001 Baseline Ready</span>
        </div>
      </header>
    </main>
  );
}
