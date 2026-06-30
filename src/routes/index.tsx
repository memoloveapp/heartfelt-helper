import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QR Love" },
      {
        name: "description",
        content:
          "Crie em 5 minutos uma página exclusiva com contador de relacionamento em tempo real, fotos e a música de vocês. Entregue por QR Code. Perfeito para o Dia dos Namorados.",
      },
    ],
    links: [
      { rel: "apple-touch-icon", href: "images/love-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500;1,9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: "css/tokens.css" },
      { rel: "stylesheet", href: "css/base.css" },
      { rel: "stylesheet", href: "css/components.css" },
      { rel: "stylesheet", href: "css/landing.css" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    const intervals: number[] = [];

    // Urgency bar countdown
    const elDays = document.getElementById("cdDays");
    const elHours = document.getElementById("cdHours");
    const elMins = document.getElementById("cdMins");
    const elSecs = document.getElementById("cdSecs");
    if (elDays && elHours && elMins && elSecs) {
      // Dia dos Pais (Brasil): 2º domingo de agosto
      const fathersDay = (y: number) => {
        const d = new Date(y, 7, 1);
        const firstSun = 1 + ((7 - d.getDay()) % 7);
        return new Date(y, 7, firstSun + 7);
      };
      const year = new Date().getFullYear();
      let deadline = fathersDay(year);
      if (new Date() > deadline) deadline = fathersDay(year + 1);
      const pad = (n: number) => String(n).padStart(2, "0");
      const tick = () => {
        const diff = deadline.getTime() - Date.now();
        if (diff <= 0) {
          elDays.textContent = elHours.textContent = elMins.textContent = elSecs.textContent = "00";
          return;
        }
        elDays.textContent = String(Math.floor(diff / 86400000));
        elHours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
        elMins.textContent = pad(Math.floor((diff % 3600000) / 60000));
        elSecs.textContent = pad(Math.floor((diff % 60000) / 1000));
      };
      tick();
      intervals.push(window.setInterval(tick, 1000));
    }

    // Photo crossfade
    const imgs = document.querySelectorAll<HTMLElement>(".mkp-photos__img");
    const dots = document.querySelectorAll<HTMLElement>(".mkp-photos__dot");
    if (imgs.length > 1) {
      let current = 0;
      intervals.push(
        window.setInterval(() => {
          imgs[current].classList.remove("mkp-photos__img--active");
          dots[current]?.classList.remove("mkp-photos__dot--active");
          current = (current + 1) % imgs.length;
          imgs[current].classList.add("mkp-photos__img--active");
          dots[current]?.classList.add("mkp-photos__dot--active");
        }, 3000),
      );
    }

    // Mockup live counter
    const start = new Date(2022, 9, 13, 14, 22, 0);
    const els = {
      anos: document.getElementById("mk-anos"),
      meses: document.getElementById("mk-meses"),
      dias: document.getElementById("mk-dias"),
      horas: document.getElementById("mk-horas"),
      mins: document.getElementById("mk-mins"),
      segs: document.getElementById("mk-segs"),
    };
    if (els.anos) {
      const pad = (n: number) => String(n).padStart(2, "0");
      const tick = () => {
        const now = new Date();
        let anos = now.getFullYear() - start.getFullYear();
        let meses = now.getMonth() - start.getMonth();
        let dias = now.getDate() - start.getDate();
        let horas = now.getHours() - start.getHours();
        let mins = now.getMinutes() - start.getMinutes();
        let segs = now.getSeconds() - start.getSeconds();
        if (segs < 0) { segs += 60; mins--; }
        if (mins < 0) { mins += 60; horas--; }
        if (horas < 0) { horas += 24; dias--; }
        if (dias < 0) { meses--; dias += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
        if (meses < 0) { meses += 12; anos--; }
        els.anos!.textContent = String(anos);
        els.meses!.textContent = String(meses);
        els.dias!.textContent = String(dias);
        els.horas!.textContent = pad(horas);
        els.mins!.textContent = pad(mins);
        els.segs!.textContent = pad(segs);
      };
      tick();
      intervals.push(window.setInterval(tick, 1000));
    }

    // Testimonials carousel
    const track = document.querySelector<HTMLElement>(".testimonials-track");
    const tdots = document.querySelectorAll<HTMLElement>(".testimonials-dot");
    if (track && tdots.length) {
      const getCardWidth = () =>
        (track.firstElementChild as HTMLElement).offsetWidth +
        parseInt(getComputedStyle(track).gap || "0");
      const handlers: Array<() => void> = [];
      tdots.forEach((dot) => {
        const h = () => {
          const idx = Number(dot.dataset.index);
          track.scrollTo({ left: getCardWidth() * idx, behavior: "smooth" });
          tdots.forEach((d, i) => {
            d.classList.toggle("testimonials-dot--active", i === idx);
            d.setAttribute("aria-selected", i === idx ? "true" : "false");
          });
        };
        dot.addEventListener("click", h);
        handlers.push(() => dot.removeEventListener("click", h));
      });
      let scrollTimer: number | undefined;
      const onScroll = () => {
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(() => {
          const active = Math.round(track.scrollLeft / getCardWidth());
          tdots.forEach((d, i) => {
            d.classList.toggle("testimonials-dot--active", i === active);
            d.setAttribute("aria-selected", i === active ? "true" : "false");
          });
        }, 80);
      };
      track.addEventListener("scroll", onScroll);
      handlers.push(() => track.removeEventListener("scroll", onScroll));
      return () => {
        intervals.forEach(clearInterval);
        handlers.forEach((fn) => fn());
      };
    }

    return () => intervals.forEach(clearInterval);
  }, []);

  return (
    <>
      <div className="landing-blob landing-blob--1" aria-hidden="true"></div>
      <div className="landing-blob landing-blob--2" aria-hidden="true"></div>
      <div className="landing-blob landing-blob--3" aria-hidden="true"></div>

      <header className="site-header">
        <div className="site-header__inner">
          <a href="index.html" className="site-header__brand brand-logo" aria-label="MemoLove — Eternizando lembranças">
            <svg className="brand-logo__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z" />
            </svg>
            <span className="brand-logo__text">
              <span className="brand-logo__name">
                <span className="brand-logo__memo">Memo</span><span className="brand-logo__love">Love</span>
              </span>
              
            </span>
          </a>
          <a href="criar.html" className="btn-ghost">Começar</a>
        </div>
      </header>

      <div className="urgency-bar" role="status">
        <span className="urgency-bar__emoji" aria-hidden="true">💝</span>
        <span className="urgency-bar__text">
          <strong>Dia dos Pais</strong> em{" "}
          <span className="urgency-bar__countdown" aria-label="contador regressivo">
            <span className="urgency-bar__unit"><span id="cdDays">--</span><em>d</em></span>
            <span className="urgency-bar__unit"><span id="cdHours">--</span><em>h</em></span>
            <span className="urgency-bar__unit"><span id="cdMins">--</span><em>m</em></span>
            <span className="urgency-bar__unit"><span id="cdSecs">--</span><em>s</em></span>
          </span>
          {" "}· Crie hoje e receba na hora.
        </span>
      </div>

      <main className="landing-main">
        <section className="hero">
          <h1 className="hero__headline">
            Uma homenagem que guarda<br />
            <em>aquilo que o tempo jamais apaga.</em>
          </h1>




          <p className="hero__subtitle">
            Reúna suas melhores fotos, escreva uma declaração emocionante e escolha uma música especial. Receba uma página exclusiva para emocionar seu pai, acessível por QR Code e link.
          </p>
        </section>

        <div className="product-mockup" aria-hidden="true">
          <div className="product-mockup__frame">
            <div className="product-mockup__placeholder">
              <div className="mkp-music">
                <span className="mkp-music__note" aria-hidden="true">♪</span>
                <span className="mkp-music__title">Perfect — Ed Sheeran</span>
                <span className="mkp-music__wave" aria-hidden="true">
                  <span></span><span></span><span></span><span></span>
                </span>
              </div>

              <div className="mkp-photos">
                <img src="images/casal-photo2.jpg" alt="" className="mkp-photos__img mkp-photos__img--active" />
                <img src="images/casal-photo1.jpg" alt="" className="mkp-photos__img" />
                <img src="images/casal-photo3.jpg" alt="" className="mkp-photos__img" />
              </div>

              <div className="mkp-content">
                <div className="mkp-photos__dots" aria-hidden="true">
                  <span className="mkp-photos__dot mkp-photos__dot--active"></span>
                  <span className="mkp-photos__dot"></span>
                  <span className="mkp-photos__dot"></span>
                </div>
                <p className="mkp-names">Julia &amp; Pedro</p>
                <div className="mkp-grid">
                  <div className="mkp-cell"><span id="mk-anos">3</span><em>Anos</em></div>
                  <div className="mkp-cell"><span id="mk-meses">7</span><em>Meses</em></div>
                  <div className="mkp-cell"><span id="mk-dias">14</span><em>Dias</em></div>
                  <div className="mkp-cell"><span id="mk-horas">09</span><em>Horas</em></div>
                  <div className="mkp-cell"><span id="mk-mins">42</span><em>Min</em></div>
                  <div className="mkp-cell"><span id="mk-segs">38</span><em>Seg</em></div>
                </div>
                <p className="mkp-message">
                  &ldquo;Você me ensinou que o amor não é um destino — é cada segundo vivido ao seu lado. Obrigado por cada um deles, meu amor.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-cta">
          <a href="criar.html" className="btn-primary btn-primary--cta">Criar minha homenagem →</a>
        </div>

        <section className="social-proof" id="depoimentos" aria-label="Depoimentos">
          <h2 className="social-proof__title">Depoimentos de quem viveu essa experiência</h2>
          <div className="testimonials-carousel">
            <div className="testimonials-track" role="list">
              {[
                {
                  t: '"Meu pai ficou sem palavras quando abriu a homenagem. Ele leu a mensagem inteira, ouviu a música e se emocionou de verdade. Foi muito mais especial do que qualquer presente material."',
                  n: "Ana Paula M. — São Paulo/SP",
                },
                {
                  t: '"Achei que seria só uma página com fotos, mas ficou muito melhor do que imaginei. A experiência ficou linda e meu pai adorou. Valeu cada centavo."',
                  n: "Rafael C. — Belo Horizonte/MG",
                },
                {
                  t: '"Foi muito fácil de criar. Em poucos minutos consegui montar tudo e, quando meu pai escaneou o QR Code, ficou emocionado. Recomendo demais!"',
                  n: "Juliana S. — Curitiba/PR",
                },
                {
                  t: '"A qualidade da homenagem me surpreendeu. As fotos, a mensagem e a música deixaram tudo muito especial. Minha família inteira elogiou."',
                  n: "Lucas A. — Recife/PE",
                },
                {
                  t: '"Queria fazer algo diferente neste Dia dos Pais e encontrei a MemoLove. Foi a melhor escolha. Meu pai disse que foi o presente mais emocionante que já recebeu."',
                  n: "Fernanda R. — Rio de Janeiro/RJ",
                },
              ].map((d, i) => (
                <blockquote key={i} className="testimonial card" role="listitem">
                  <p className="testimonial__text">{d.t}</p>
                  <footer className="testimonial__author">
                    <span className="testimonial__stars" aria-label="5 estrelas" aria-hidden="true">★★★★★</span>
                    <cite className="testimonial__name">{d.n}</cite>
                  </footer>
                </blockquote>
              ))}
            </div>
            <div className="testimonials-dots" role="tablist" aria-label="Navegar depoimentos">
              {[0, 1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  className={`testimonials-dot${i === 0 ? " testimonials-dot--active" : ""}`}
                  data-index={i}
                  role="tab"
                  aria-selected={i === 0 ? "true" : "false"}
                  aria-label={`Depoimento ${i + 1}`}
                ></button>
              ))}
            </div>
          </div>
        </section>

        <section className="how-it-works">
          <h2 className="how-it-works__title">❤️ Em 3 passos,<br />uma homenagem<br />inesquecível</h2>
          <div className="how-it-works__steps">
            <div className="step-card card">
              <span className="step-card__icon">📷</span>
              <div>
                <p className="step-card__title">Reúna suas melhores lembranças</p>
                <p className="step-card__desc">
                  Escolha as fotos, escreva uma mensagem com o coração e selecione uma música especial.
                </p>
              </div>
            </div>
            <div className="step-card card">
              <span className="step-card__icon">✨</span>
              <div>
                <p className="step-card__title">Nós preparamos tudo para você</p>
                <p className="step-card__desc">
                  Em poucos segundos sua homenagem ganha vida. Visualize uma prévia e desbloqueie a versão completa com apenas um clique.
                </p>
              </div>
            </div>
            <div className="step-card card">
              <span className="step-card__icon">🎁</span>
              <div>
                <p className="step-card__title">Entregue uma emoção, não apenas um presente</p>
                <p className="step-card__desc">
                  Compartilhe o QR Code ou o link exclusivo. Ao abrir, seu pai viverá uma experiência única com suas fotos, sua declaração e a música escolhida especialmente para ele.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="faq">
          <h2 className="faq__title">Perguntas frequentes</h2>
          <div className="faq__list">
            <details className="faq__item">
              <summary className="faq__question">Como funciona a homenagem?</summary>
              <p className="faq__answer">
                É muito simples! Você envia as fotos, escreve uma mensagem especial, escolhe a trilha sonora e, em poucos segundos, sua homenagem é criada. Antes de finalizar, você ainda poderá visualizar uma prévia. Após a confirmação do pagamento, ela é liberada instantaneamente com um QR Code e um link exclusivo.
              </p>
            </details>
            <details className="faq__item">
              <summary className="faq__question">Meu pai precisa instalar algum aplicativo?</summary>
              <p className="faq__answer">
                Não. Basta escanear o QR Code ou abrir o link enviado. A homenagem funciona diretamente no navegador de qualquer celular, seja Android ou iPhone.
              </p>
            </details>
            <details className="faq__item">
              <summary className="faq__question">Quando recebo minha homenagem?</summary>
              <p className="faq__answer">
                Assim que o pagamento for confirmado, sua homenagem é liberada automaticamente. Você receberá acesso imediato através de um QR Code e também de um link exclusivo para compartilhar.
              </p>
            </details>
            <details className="faq__item">
              <summary className="faq__question">Posso confiar? E se eu não gostar?</summary>
              <p className="faq__answer">
                Sua homenagem é criada antes mesmo do pagamento, e você poderá visualizar uma prévia antes de decidir desbloqueá-la. Assim, você sabe exatamente o que irá receber antes de concluir sua compra.
              </p>
            </details>
            <details className="faq__item">
              <summary className="faq__question">Posso compartilhar a homenagem com outras pessoas?</summary>
              <p className="faq__answer">
                Sim! Além do QR Code, você também receberá um link exclusivo que pode ser enviado pelo WhatsApp, Instagram, e-mail ou qualquer outro aplicativo, permitindo que toda a família participe desse momento especial.
              </p>
            </details>
          </div>
        </section>

        <section className="final-cta">
          <h2 className="final-cta__headline">
            O presente mais emocionante<br />
            <em>é aquele que será lembrado para sempre.</em>
          </h2>
          <p className="final-cta__subtitle">
            Crie uma homenagem exclusiva para o seu pai em menos de cinco minutos.
          </p>
          <a href="criar.html" className="btn-primary btn-primary--cta">Criar minha homenagem →</a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <span className="site-footer__brand">MemoLove</span>
          <span className="site-footer__copy">MemoLove © 2026 Todos os direitos reservados.</span>
        </div>
      </footer>
    </>
  );
}
