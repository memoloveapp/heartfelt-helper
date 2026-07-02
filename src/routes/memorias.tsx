import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/memorias")({
  head: () => ({
    meta: [
      { title: "Memórias — MemoLove" },
      {
        name: "description",
        content:
          "Explore memórias criadas na MemoLove: homenagens emocionais eternizadas com fotos, música e dedicatória.",
      },
      { property: "og:title", content: "Memórias — MemoLove" },
      {
        property: "og:description",
        content: "Explore homenagens emocionais criadas na MemoLove.",
      },
    ],
    links: [
      { rel: "stylesheet", href: "css/tokens.css" },
      { rel: "stylesheet", href: "css/base.css" },
    ],
  }),
  component: MemoriasPage,
});

type Memoria = {
  slug: string;
  titulo: string;
  dedicatoria: string;
  imagem: string;
};

const MEMORIAS: Memoria[] = [
  {
    slug: "3bdc08bc4b",
    titulo: "Para o Pai",
    dedicatoria: "Uma vida inteira de gratidão em uma só página.",
    imagem:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80",
  },
  {
    slug: "9bf40a922c",
    titulo: "Reinaldo, com amor",
    dedicatoria: "Do Renan, para eternizar o que palavras não alcançam.",
    imagem:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  },
];

function MemoriasPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F5F1EA",
        color: "#1A1A1A",
        padding: "6rem 1.5rem",
        fontFamily: "'Fraunces', Georgia, serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              opacity: 0.6,
              marginBottom: "1rem",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            MemoLove
          </p>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Memórias
          </h1>
          <p
            style={{
              marginTop: "1.5rem",
              fontSize: "1.125rem",
              opacity: 0.7,
              maxWidth: "560px",
              margin: "1.5rem auto 0",
              lineHeight: 1.6,
            }}
          >
            Homenagens reais criadas para eternizar quem amamos.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2rem",
          }}
        >
          {MEMORIAS.map((m) => (
            <Link
              key={m.slug}
              to="/homenagem/$slug"
              params={{ slug: m.slug }}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                background: "#fff",
                borderRadius: "4px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                transition: "transform 0.4s ease, box-shadow 0.4s ease",
              }}
            >
              <div
                style={{
                  aspectRatio: "4/5",
                  overflow: "hidden",
                  background: "#e5e5e5",
                }}
              >
                <img
                  src={m.imagem}
                  alt={m.titulo}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div style={{ padding: "1.75rem" }}>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 500,
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {m.titulo}
                </h2>
                <p
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.95rem",
                    opacity: 0.65,
                    lineHeight: 1.5,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {m.dedicatoria}
                </p>
              </div>
            </Link>
          ))}
        </section>

        <div style={{ textAlign: "center", marginTop: "5rem" }}>
          <Link
            to="/criar"
            style={{
              display: "inline-block",
              padding: "1rem 2.5rem",
              background: "#1A1A1A",
              color: "#F5F1EA",
              textDecoration: "none",
              fontSize: "0.8rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              borderRadius: "2px",
            }}
          >
            Criar minha memória
          </Link>
        </div>
      </div>
    </main>
  );
}
