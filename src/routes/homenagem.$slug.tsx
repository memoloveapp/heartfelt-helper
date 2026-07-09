import { createFileRoute } from "@tanstack/react-router";
import { HomenagemExperience } from "@/components/homenagem/HomenagemExperience";

const PAPER = "#F8F4EC";
const INK = "#2B2623";

export const Route = createFileRoute("/homenagem/$slug")({
  head: () => ({
    meta: [
      { title: "Uma memória eterna — MemoLove" },
      { name: "description", content: "Uma homenagem feita com tempo, carinho e amor." },
    ],
  }),
  component: HomenagemPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: PAPER, color: INK }}>
      <div><h1 className="text-2xl mb-2" style={{ fontStyle: "italic" }}>Um instante…</h1><p className="text-sm opacity-70">{error.message}</p></div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center" style={{ background: PAPER, color: INK }}>
      <p style={{ fontStyle: "italic" }}>Memória não encontrada.</p>
    </div>
  ),
  ssr: false,
});

function HomenagemPage() {
  const { slug } = Route.useParams();
  return <HomenagemExperience slug={slug} preview={false} />;
}
