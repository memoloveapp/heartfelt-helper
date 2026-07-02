/**
 * Utilitário global de áudio.
 *
 * Garante que nenhuma prévia de música continue tocando após navegação,
 * troca de música ou avanço de etapa. Cobre tanto elementos <audio> no DOM
 * quanto instâncias criadas programaticamente (registradas via registerAudio).
 */

const registered = new Set<HTMLAudioElement>();

/** Registra uma instância de áudio criada fora do DOM (ex.: new Audio()). */
export function registerAudio(audio: HTMLAudioElement): void {
  registered.add(audio);
}

/** Remove uma instância do registro global. */
export function unregisterAudio(audio: HTMLAudioElement): void {
  registered.delete(audio);
}

/** Pausa e reseta TODO áudio ativo — DOM e instâncias registradas. */
export function stopAllAudio(): void {
  if (typeof document !== "undefined") {
    document.querySelectorAll("audio").forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // elemento pode estar em estado inválido; ignorar com segurança
      }
    });
  }
  registered.forEach((audio) => {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    } catch {
      // ignorar
    }
  });
  registered.clear();
}
