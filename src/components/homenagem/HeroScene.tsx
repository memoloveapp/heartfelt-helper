export function HeroScene({ name, photo }: { name: string; photo: string; ready?: boolean }) {
  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "100vh",
        backgroundImage: photo ? `url(${photo})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#111",
      }}
      aria-label="Abertura"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "#fff",
          padding: "0 24px",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, letterSpacing: ".3em", textTransform: "uppercase", opacity: 0.85 }}>
          Para
        </p>
        <h1
          style={{
            margin: "16px 0 0",
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontWeight: 500,
            fontSize: "clamp(48px, 9vw, 96px)",
            lineHeight: 1.05,
          }}
        >
          {name || "você"}
        </h1>
      </div>
    </section>
  );
}
