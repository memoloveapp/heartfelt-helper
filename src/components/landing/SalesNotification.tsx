import { useEffect, useState } from "react";

type Sale = { name: string; city: string; time: string };

const NAMES = [
  "Ana C.", "Camila R.", "Juliana M.", "Mariana S.", "Beatriz L.", "Larissa F.",
  "Fernanda A.", "Carla D.", "Rafaela P.", "Patrícia N.", "Lucas M.", "Rodrigo T.",
  "Gabriel S.", "Thiago R.", "Bruno A.", "Felipe C.", "Pedro H.", "Rafael B.",
  "Vinícius O.", "Amanda G.", "Bianca V.",
];
const CITIES = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre",
  "Salvador", "Fortaleza", "Recife", "Brasília", "Florianópolis", "Goiânia",
  "Manaus", "Campinas", "Vitória", "Natal",
];
const TIMES = [
  "agora mesmo", "há 1 min", "há 2 min", "há 4 min", "há 7 min", "há 11 min",
];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const nextSale = (): Sale => ({ name: pick(NAMES), city: pick(CITIES), time: pick(TIMES) });

export default function SalesNotification() {
  const [sale, setSale] = useState<Sale | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: number | undefined;
    let nextTimer: number | undefined;

    const show = () => {
      setSale(nextSale());
      setVisible(true);
      hideTimer = window.setTimeout(() => {
        setVisible(false);
        nextTimer = window.setTimeout(show, 12000 + Math.random() * 8000);
      }, 6000);
    };

    const initial = window.setTimeout(show, 5000);

    return () => {
      window.clearTimeout(initial);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (nextTimer) window.clearTimeout(nextTimer);
    };
  }, []);

  return (
    <>
      <style>{`
        .sales-toast {
          position: fixed;
          left: 20px;
          bottom: 22px;
          z-index: 90;
          display: flex;
          align-items: center;
          gap: 14px;
          max-width: 340px;
          padding: 14px 20px 14px 14px;
          background: rgba(255, 253, 250, 0.92);
          backdrop-filter: blur(18px) saturate(1.2);
          -webkit-backdrop-filter: blur(18px) saturate(1.2);
          border: 1px solid rgba(215, 205, 190, 0.55);
          border-radius: 16px;
          box-shadow:
            0 20px 48px -20px rgba(60, 45, 30, 0.22),
            0 4px 12px -4px rgba(60, 45, 30, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          transform: translateY(24px) scale(0.96);
          opacity: 0;
          transition: opacity .5s cubic-bezier(0.22,0.61,0.36,1), transform .5s cubic-bezier(0.22,0.61,0.36,1);
          pointer-events: none;
        }
        .sales-toast.is-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .sales-toast__avatar {
          position: relative;
          flex: none;
          width: 42px; height: 42px;
          border-radius: 999px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, #F3DDD2 0%, #E8C9B4 100%);
          color: #A65E44;
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: 17px;
          letter-spacing: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5);
        }
        .sales-toast__avatar::after {
          content: "";
          position: absolute;
          right: -1px; bottom: -1px;
          width: 12px; height: 12px;
          background: #7BB27A;
          border: 2px solid #FFFDFA;
          border-radius: 999px;
          box-shadow: 0 0 0 0 rgba(123, 178, 122, 0.6);
          animation: sales-pulse 2.2s ease-out infinite;
        }
        @keyframes sales-pulse {
          0% { box-shadow: 0 0 0 0 rgba(123,178,122,0.55); }
          70% { box-shadow: 0 0 0 8px rgba(123,178,122,0); }
          100% { box-shadow: 0 0 0 0 rgba(123,178,122,0); }
        }
        .sales-toast__body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .sales-toast__eyebrow {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #A65E44;
          opacity: 0.85;
        }
        .sales-toast__title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 14.5px;
          font-weight: 500;
          color: #2C2A27;
          line-height: 1.35;
          letter-spacing: -0.005em;
        }
        .sales-toast__title strong { font-weight: 600; }
        .sales-toast__meta {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px;
          color: #7A736A;
          line-height: 1.3;
          margin-top: 2px;
        }
        .sales-toast__meta span.dot {
          width: 2px; height: 2px; border-radius: 999px;
          background: currentColor; opacity: 0.5;
        }
        @media (max-width: 480px) {
          .sales-toast { left: 12px; right: 12px; bottom: 14px; max-width: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sales-toast { transition: opacity .3s ease; transform: none; }
          .sales-toast__avatar::after { animation: none; }
        }
      `}</style>
      <div
        className={`sales-toast${visible ? " is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <div className="sales-toast__avatar" aria-hidden>
          {sale?.name?.charAt(0) ?? "♥"}
        </div>
        <div className="sales-toast__body">
          <div className="sales-toast__eyebrow">Nova homenagem</div>
          <div className="sales-toast__title">
            <strong>{sale?.name ?? ""}</strong> criou a dela
          </div>
          <div className="sales-toast__meta">
            <span>{sale?.city ?? ""}</span>
            <span className="dot" aria-hidden />
            <span>{sale?.time ?? ""}</span>
          </div>
        </div>
      </div>
    </>
  );
}
