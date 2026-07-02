export function MemoryScene({ photos }: { photos: string[] }) {
  const items = photos.filter(Boolean);
  if (items.length === 0) return null;

  return (
    <section
      style={{
        width: "100%",
        background: "#F8F4EC",
        padding: "96px 24px",
      }}
      aria-label="Memórias"
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((src, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "3 / 4",
                overflow: "hidden",
                background: "#e6ddc9",
              }}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
