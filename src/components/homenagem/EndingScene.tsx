export function EndingScene({ sender }: { sender: string }) {
  return (
    <section
      style={{
        width: "100%",
        background: "#111",
        color: "#fff",
        padding: "160px 24px",
        textAlign: "center",
      }}
      aria-label="Encerramento"
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <p
          style={{
            margin: 0,
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontStyle: "italic",
            fontSize: "clamp(24px, 4vw, 40px)",
            lineHeight: 1.3,
          }}
        >
          Que essa memória viva com você, sempre.
        </p>
        <p
          style={{
            marginTop: 56,
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 18,
            opacity: 0.8,
          }}
        >
          Com amor, <em>{sender || "quem te ama"}</em>
        </p>
        <p
          style={{
            marginTop: 96,
            fontSize: 10,
            letterSpacing: ".55em",
            textTransform: "uppercase",
            opacity: 0.5,
          }}
        >
          memolove
        </p>
      </div>
    </section>
  );
}
