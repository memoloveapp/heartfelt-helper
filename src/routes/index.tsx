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
          <a href="index.html" className="site-header__brand">MemoLove</a>
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
                  t: '"Nunca imaginei que ia chorar abrindo um QR Code. Ele escondeu dentro do buquê — quando eu escaniei, tocou nossa música e apareceu a foto do nosso primeiro dia juntos. Não existe presente melhor."',
                  n: "Camila R. — São Paulo, SP",
                },
                {
                  t: '"Montei em menos de 5 minutos, mas quando ela abriu e viu o contador marcando 4 anos, 2 meses e 17 dias exatos, ficou sem fala. O QR Code ficou colado na capa do diário dela até hoje."',
                  n: "Felipe M. — Belo Horizonte, MG",
                },
                {
                  t: '"Dei de presente pro meu marido no aniversário de 6 anos juntos. Ele é daqueles que não demonstra emoção, mas dessa vez os olhos ficaram marejados. Valeu cada centavo — e foi baratíssimo."',
                  n: "Beatriz A. — Curitiba, PR",
                },
                {
                  t: '"A ideia de colocar nossa música favorita foi o que me convenceu. Quando ela abriu no restaurante e a música começou a tocar pelo celular, todo mundo na mesa perguntou o que era. Super recomendo."',
                  n: "Rafael & Letícia — Rio de Janeiro, RJ",
                },
                {
                  t: '"Imprimi o QR Code num cartãozinho artesanal e escondi dentro do presente. Quando ela escaneou e viu o contador com os segundos passando ao vivo... disse que foi o presente mais criativo que já recebeu na vida."',
                  n: "Bruno T. — Recife, PE",
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
          <h2 className="how-it-works__title">Pronto em 3 passos. Inesquecível pra sempre.</h2>
          <div className="how-it-works__steps">
            <div className="step-card card">
              <span className="step-card__icon">📝</span>
              <div>
                <p className="step-card__title">Você monta a página</p>
                <p className="step-card__desc">
                  Nomes, data que começaram o relacionamento, fotos do casal e a mensagem que sempre quis escrever.
                </p>
              </div>
            </div>
            <div className="step-card card">
              <span className="step-card__icon">📱</span>
              <div>
                <p className="step-card__title">Recebe seu QR Code</p>
                <p className="step-card__desc">
                  Depois do pagamento, o QR Code chega no seu e-mail. Imprime, cola num cartão, esconde num buquê — você decide a surpresa.
                </p>
              </div>
            </div>
            <div className="step-card card">
              <span className="step-card__icon">💕</span>
              <div>
                <p className="step-card__title">A surpresa acontece</p>
                <p className="step-card__desc">
                  Ao escanear, a página abre com a música tocando, as fotos passando e o contador marcando há quanto tempo vocês são vocês.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="faq">
          <h2 className="faq__title">Perguntas frequentes</h2>
          <div className="faq__list">
            <details className="faq__item">
              <summary className="faq__question">A página fica no ar pra sempre?</summary>
              <p className="faq__answer">
                Sim. Depois de criada, a página do casal fica disponível sem prazo de expiração. O contador continua marcando o tempo de vocês 24/7.
              </p>
            </details>
            <details className="faq__item">
              <summary className="faq__question">Funciona em qualquer celular?</summary>
              <p className="faq__answer">
                Funciona. Basta apontar a câmera do celular pro QR Code — Android ou iPhone — e a página abre direto no navegador, sem precisar baixar nada.
              </p>
            </details>
            <details className="faq__item">
              <summary className="faq__question">Quanto tempo demora pra receber?</summary>
              <p className="faq__answer">
                Na hora. Assim que o pagamento é confirmado, o QR Code é gerado e enviado pro seu e-mail automaticamente.
              </p>
            </details>
            <details className="faq__item">
              <summary className="faq__question">Que tipo de música posso usar?</summary>
              <p className="faq__answer">
                Qualquer música que esteja no buscador. É só selecionar e confirmar.
              </p>
            </details>
          </div>
        </section>

        <section className="final-cta">
          <h2 className="final-cta__headline">
            O presente mais bonito<br />
            <em>é o que dura pra sempre.</em>
          </h2>
          <p className="final-cta__subtitle">
            Crie agora a página do amor de vocês — leva menos de 5 minutos.
          </p>
          <a href="criar.html" className="btn-primary btn-primary--cta">Criar minha homenagem →</a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <span className="site-footer__brand">QR Love</span>
          <span className="site-footer__copy">© 2025 QR Love. Todos os direitos reservados.</span>
        </div>
      </footer>
    </>
  );
}
