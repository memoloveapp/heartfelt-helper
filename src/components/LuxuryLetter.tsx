/**
 * LuxuryLetter — carta impressa diretamente na página (sem card, sem caixa).
 */

type LuxuryLetterProps = {
  message?: string | null;
  senderName?: string | null;
};

export function LuxuryLetter({ message, senderName }: LuxuryLetterProps) {
  const body = (message ?? "").trim();
  const signature = (senderName ?? "").trim();

  const paragraphs = body
    ? body.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Inter:wght@400&family=Cormorant+Garamond:ital,wght@1,500&display=swap');

        .ll-section {
          max-width: 100%;
          padding: 96px 24px;
          background: #F6F0E7;
          display: flex;
          justify-content: center;
        }
        .ll-letter {
          width: 100%;
          max-width: 720px;
          background: transparent;
          padding: 0;
          margin: 0 auto;
        }
        .ll-header {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          letter-spacing: 6px;
          text-transform: uppercase;
          text-align: center;
          color: #C79A72;
          margin-bottom: 48px;
        }
        .ll-header .ll-heart {
          display: block;
          margin-top: 12px;
          font-size: 14px;
          letter-spacing: 0;
        }
        .ll-title {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 600;
          line-height: 1.1;
          margin: 0 0 36px 0;
          color: #2B2522;
        }
        .ll-body {
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          line-height: 1.9;
          color: #3A322D;
          text-align: left;
          max-width: 620px;
        }
        .ll-body p { margin: 0 0 1.2em 0; }
        .ll-body p:last-child { margin-bottom: 0; }
        .ll-footer {
          margin-top: 56px;
          display: flex;
          justify-content: flex-end;
          font-size: 34px;
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          color: #D0A37D;
        }
        @media (max-width: 640px) {
          .ll-section { padding: 72px 20px; }
          .ll-title { font-size: 36px; }
          .ll-body { font-size: 17px; line-height: 1.85; }
          .ll-footer { font-size: 30px; margin-top: 44px; }
          .ll-header { letter-spacing: 5px; margin-bottom: 36px; }
        }
      `}</style>

      <section className="ll-section">
        <div className="ll-letter">
          <div className="ll-header">
            CARTA PARA VOCÊ
            <span className="ll-heart">♥</span>
          </div>

          <h2 className="ll-title">Meu pai,</h2>

          <div className="ll-body">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>Uma mensagem especial em breve.</p>
            )}
          </div>

          {signature && (
            <footer className="ll-footer">
              {signature} ♥
            </footer>
          )}
        </div>
      </section>
    </>
  );
}

export default LuxuryLetter;
