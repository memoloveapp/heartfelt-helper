import type { ReactNode } from "react";

/**
 * ExperienceSection
 * ------------------------------------------------------------------
 * Único wrapper responsável pelo BACKGROUND compartilhado das cenas
 * MusicScene · MemoryScene · EndingScene.
 *
 * Contém, em um só lugar:
 *   • preto profundo (cor base sólida)
 *   • textura sutil
 *   • grão
 *   • vinheta elegante (escopada ao viewport, sem faixas horizontais)
 *   • iluminação dourada extremamente discreta
 *
 * As cenas filhas devem usar `background: transparent` para revelar
 * este fundo — nunca declarar background próprio de cena.
 * Halos e feixes locais (player, fotos, feixe do ending) podem existir
 * como overlays internos, mas nunca substituem este fundo.
 */
export function ExperienceSection({ children }: { children: ReactNode }) {
  return (
    <section className="experience-section" aria-label="Experiência">
      {children}
      <style>{`
        .experience-section {
          position: relative;
          overflow: hidden;
          /* 1. Cor base sólida — mesma tonalidade em toda a extensão. */
          background: #0a0705;
        }

        /* 2. Textura + grão sutis — uniformes em toda a altura. */
        .experience-section::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(118deg, rgba(255,240,210,0.015) 0 1px, transparent 1px 4px),
            repeating-linear-gradient(62deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 5px);
          mix-blend-mode: overlay;
          opacity: 0.5;
          pointer-events: none;
          z-index: 1;
        }

        /* 3. Vinheta + brilho dourado ESCOPADOS AO VIEWPORT (fixed) —
              acompanham o scroll, então cada cena recebe o mesmo
              tratamento cinematográfico e nunca surge uma faixa
              horizontal marcando o início/fim de uma cena. */
        .experience-section::after {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(60% 40% at 50% 30%, rgba(201,161,90,0.05), transparent 70%),
            radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* Cenas filhas ficam acima do fundo e nunca sobrescrevem-no. */
        .experience-section > section {
          position: relative;
          z-index: 2;
          background: transparent !important;
        }
      `}</style>
    </section>
  );
}
