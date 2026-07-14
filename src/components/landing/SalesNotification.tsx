import { useEffect, useState } from "react";

type Sale = { name: string; city: string; time: string };

const NAMES = [
  "Ana", "Camila", "Juliana", "Mariana", "Beatriz", "Larissa", "Fernanda",
  "Carla", "Rafaela", "Patrícia", "Lucas", "Rodrigo", "Gabriel", "Thiago",
  "Bruno", "Felipe", "Pedro", "Rafael", "Vinícius", "Amanda", "Bianca",
];
const CITIES = [
  "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR",
  "Porto Alegre, RS", "Salvador, BA", "Fortaleza, CE", "Recife, PE",
  "Brasília, DF", "Florianópolis, SC", "Goiânia, GO", "Manaus, AM",
  "Campinas, SP", "Vitória, ES", "Natal, RN",
];
const TIMES = ["há poucos segundos", "há 1 minuto", "há 2 minutos", "há 4 minutos", "há 6 minutos", "há 9 minutos"];

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
        nextTimer = window.setTimeout(show, 9000 + Math.random() * 6000);
      }, 5500);
    };

    const initial = window.setTimeout(show, 4000);

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
          left: 16px;
          bottom: 20px;
          z-index: 90;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 320px;
          padding: 12px 14px 12px 12px;
          background: #FFFFFF;
          border: 1px solid #EBE3D5;
          border-radius: 14px;
          box-shadow: 0 12px 32px -12px rgba(60,45,30,0.18), 0 2px 6px rgba(60,45,30,0.06);
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          transform: translateY(20px);
          opacity: 0;
          transition: opacity .35s ease, transform .35s ease;
          pointer-events: none;
        }
        .sales-toast.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .sales-toast__icon {
          flex: none;
          width: 38px; height: 38px;
          border-radius: 999px;
          display: grid; place-items: center;
          background: linear-gradient(135deg,#F3DDD2,#F0E6D0);
          color: #A65E44;
          font-size: 18px;
        }
        .sales-toast__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .sales-toast__title {
          font-size: 13px; font-weight: 600; color: #2C2A27;
          line-height: 1.3;
        }
        .sales-toast__title strong { font-weight: 700; }
        .sales-toast__meta {
          font-size: 11px; color: #7A736A; line-height: 1.3;
        }
        @media (max-width: 480px) {
          .sales-toast { left: 12px; right: 12px; bottom: 14px; max-width: none; }
        }
      `}</style>
      <div
        className={`sales-toast${visible ? " is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <div className="sales-toast__icon" aria-hidden>♥</div>
        <div className="sales-toast__body">
          <div className="sales-toast__title">
            <strong>{sale?.name ?? ""}</strong> acabou de criar uma homenagem
          </div>
          <div className="sales-toast__meta">
            {sale?.city ?? ""} · {sale?.time ?? ""}
          </div>
        </div>
      </div>
    </>
  );
}
