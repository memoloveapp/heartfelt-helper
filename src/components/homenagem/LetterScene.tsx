export function LetterScene({ message, sender }: { message: string; sender: string }) {
  const paragraphs = (message ?? "")
    .split(/\n\s*\n|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section
      style={{
        width: "100%",
        background: "#F8F4EC",
        color: "#2B2623",
        padding: "96px 24px 120px",
      }}
      aria-label="Carta"
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              margin: "0 0 28px",
              fontFamily: '"EB Garamond", "Cormorant Garamond", Georgia, serif',
              fontSize: 20,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {p}
          </p>
        ))}
        {sender && (
          <p
            style={{
              marginTop: 56,
              textAlign: "right",
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontStyle: "italic",
              fontSize: 22,
            }}
          >
            — {sender}
          </p>
        )}
      </div>
    </section>
  );
}
