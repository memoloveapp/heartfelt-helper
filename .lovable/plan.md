## Visão

Uma página que se comporta como um livro de luxo folheado devagar. Sem títulos de seção, sem "capítulos", sem cards. Apenas fotografia, tipografia e silêncio — costurados por scroll suave. O usuário nunca sente que navega; sente que atravessa uma lembrança.

## Sistema visual

**Paleta (off-white quente, sem branco puro nem preto puro):**
- Fundo base: `#F6F1E7` (creme papel)
- Fundo secundário respirado: `#EEE7D8`
- Tinta primária texto: `#1F1A14` (grafite quente, nunca #000)
- Tinta suave: `#5C534A`
- Fio/detalhe: `#B8A98E` (a 40% de opacidade)

**Tipografia (duas famílias, editorial):**
- Display serif: **Fraunces** (200–400, italic disponível) — títulos e frases
- Sans auxiliar: **Inter** (300–400, tracking largo em uppercase pequenas) — legendas, indicações

Escala: tamanhos generosos, line-height 1.5–1.7, letter-spacing negativo suave em display.

**Ritmo:** cada "momento" ocupa 100vh mínimo. Máximo 1 ideia por tela. Margens laterais generosas (mobile 24px, desktop 8–12vw).

**Motion (Motion for React):** fade + translateY leve (24px, 900ms, ease [.16,.84,.24,1]). Nada rápido, nada com bounce. Ken Burns quase imperceptível nas fotos (28s loop). Blur decrescente na entrada (blur 8→0).

## Estrutura da narrativa (fluxo do scroll)

```
┌───────────────────────────────────────┐
│  1. ABERTURA CINEMÁTICA               │
│     foto full-bleed do pai            │
│     overlay inteligente adaptativo    │
│     "para o meu"                      │
│     Pai.  (display grande centrado)   │
│     ─ ♡ ─                             │
│     "meu maior exemplo"               │
│     ↓ (indicação discreta)            │
├───────────────────────────────────────┤
│  2. TRANSIÇÃO SUAVE                   │
│     foto fica em position:sticky      │
│     creme sobe por cima gradualmente  │
│     (sem corte, sem separador)        │
├───────────────────────────────────────┤
│  3. PRÓLOGO ÍNTIMO                    │
│     uma frase italic centralizada     │
│     em ~40vw, muito espaço            │
│     ex: "há coisas que só um pai      │
│     ensina em silêncio."              │
├───────────────────────────────────────┤
│  4. CARTA (a página vira papel)       │
│     fundo levemente mais quente       │
│     textura papel invisível           │
│     coluna 560px máx, centrada        │
│     tipografia impressa (Fraunces)    │
│     drop cap sutil na 1ª letra        │
│     assinatura em italic no final     │
├───────────────────────────────────────┤
│  5. ÁLBUM (uma foto por tela)         │
│     foto centralizada, respirando     │
│     legenda curta em italic abaixo    │
│     scroll → nova foto, nova frase    │
│     lazy load, ken burns leve         │
│     sem grid, sem carrossel           │
├───────────────────────────────────────┤
│  6. MÚSICA (aparece no seu tempo)     │
│     bloco minimalista centrado        │
│     [▷] Nome da música — Artista      │
│     ────────●──────────  (fio)        │
│     nenhuma capa grande, nenhum bg    │
├───────────────────────────────────────┤
│  7. DESACELERAÇÃO                     │
│     muito espaço vazio                │
│     uma frase final                   │
│     "com amor, {sender}"              │
├───────────────────────────────────────┤
│  8. SELO                              │
│     "memolove" pequeno, letter-spaced │
│     grafite suave, sem link marcado   │
└───────────────────────────────────────┘
```

## Regras não-negociáveis

- Sem `card`, sem `border`, sem `shadow-lg`, sem gradiente colorido, sem glass, sem ícone além de coração e chevron.
- Sem títulos "Carta", "Música", "Galeria" — a experiência se apresenta pelo conteúdo.
- Sem números romanos, sem "capítulo".
- Fotos com radius 0 ou 2px, nunca moldura.
- Todo texto tem sombra adaptativa só na abertura (via veil gradient), nunca no restante.

## Técnico

**Arquivo:** `src/routes/homenagem.$slug.tsx` reescrito do zero.

**Dependências:** `motion` (já presumido/instalar `bun add motion`), fontes carregadas via `<link>` no `__root.tsx` (Fraunces + Inter — Cormorant/Dancing/Playfair serão removidos deste route).

**Componentes internos (não exportados):**
- `Opening` — hero full-bleed com veil adaptativo
- `StickyPhotoTransition` — foto sticky que se dissolve no creme
- `Whisper` — frase italic centralizada em espaço amplo
- `LetterPage` — a página inteira vira papel
- `AlbumFrame` — uma foto + legenda por tela, com scroll reveal
- `QuietPlayer` — player minimalista (play/pause + progresso fio)
- `Farewell` — desaceleração final
- `Seal` — selo memolove

**Motion:**
- `useInView` do `motion/react` com `once: true, margin: "-15%"`
- Fade+rise: `initial={{opacity:0, y:24, filter:"blur(8px)"}}` → `animate={{opacity:1, y:0, filter:"blur(0)"}}` transição 1.1s cubic-bezier(.16,.84,.24,1)
- Parallax leve na abertura via `useScroll` + `useTransform` (foto: y 0→-80, escala 1→1.06)

**Performance:**
- `loading="lazy"` em toda foto exceto hero (`loading="eager" fetchPriority="high"`)
- `sizes` explícito, `width`/`height` para evitar CLS
- Fontes com `display=swap`, preconnect
- `content-visibility: auto` nas seções abaixo da dobra
- Áudio: `preload="none"`, single instance via `stopAllAudio()`

**Responsivo (mobile-first):**
- Base: padding 24px, tipo hero clamp(72px, 22vw, 140px)
- ≥720px: padding 6vw, hero clamp(120px, 14vw, 220px)
- ≥1200px: coluna carta 620px, álbum foto max 78vh

**Acessibilidade:**
- Semântica: `<main>`, `<section>`, `<article>` na carta, `<figure>/<figcaption>` no álbum
- `prefers-reduced-motion`: substitui todos os transforms por fade curto
- Contraste AA garantido em creme (texto grafite `#1F1A14` sobre `#F6F1E7`)
- Áudio com `<audio controls>` acessível escondido + botão custom

## Fora de escopo

- Editar `/criar` ou schema Supabase (dados vêm iguais)
- Novo asset — reaproveita `letter-paper.jpg` apenas como fallback opcional (provavelmente removido)
- Lightbox de galeria (fora do fluxo pedido; se necessário depois, click abre foto em full-bleed)

## Aprovação

Após aprovado, implemento o arquivo inteiro em uma passada, valido no preview em mobile 375px e desktop 1440px, e ajusto ritmo/espaçamento onde a experiência quebrar.
