import { useEffect } from "react";
import { Link } from "react-router-dom";

export function NossaHistoria() {
  // Garante que a página inicie no topo
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ backgroundColor: "var(--branco-gelo)" }}>
      <style>{`
        .sobre-hero {
          position: relative;
          min-height: 70vh;
          display: flex;
          align-items: center;
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: white;
        }
        .sobre-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(38, 51, 47, 0.9) 0%, rgba(38, 51, 47, 0.3) 100%);
        }
        .sobre-hero-content {
          position: relative;
          z-index: 2;
          max-width: 600px;
        }
        
        .sobre-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .sobre-img-wrapper {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }
        .sobre-img-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
          border-top: 1px solid var(--beje-claro);
          padding-top: 60px;
        }
        .feature-card {
          text-align: center;
        }
        .feature-icon {
          color: var(--beje-escuro);
          margin-bottom: 16px;
        }
        .feature-title {
          color: var(--verde-escuro);
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 12px;
        }
        .feature-desc {
          color: var(--text-muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .sobre-banner-middle {
          position: relative;
          background-size: cover;
          background-position: center 70%;
          padding: 120px 0;
          color: white;
          margin: 60px 0;
        }
        .sobre-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(38, 51, 47, 0.85) 0%, rgba(38, 51, 47, 0.4) 100%);
        }

        .btn-gold {
          display: inline-block;
          background-color: var(--beje-escuro);
          color: white;
          padding: 14px 28px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 4px;
          letter-spacing: 1px;
          font-size: 13px;
          text-transform: uppercase;
          transition: background-color 0.2s;
        }
        .btn-gold:hover {
          background-color: #bfa18a;
        }

        p{
          text-align: justify;
        }

        @media (max-width: 900px) {
          .sobre-grid-2 { grid-template-columns: 1fr; gap: 40px; }
          .features-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
          .sobre-hero-content h1 { font-size: 2.5rem !important; }
        }
      `}</style>

      {/* 1. HERO SECTION */}
      <section
        className="sobre-hero"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2021)",
        }}
      >
        <div className="sobre-hero-overlay"></div>
        <div className="container sobre-hero-content">
          <div
            className="eyebrow"
            style={{ color: "var(--beje-claro)", marginBottom: "16px" }}
          >
            Nossa História
          </div>
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "3.5rem",
              fontWeight: 600,
              lineHeight: 1.1,
              marginBottom: "24px",
            }}
          >
            Viajar transforma a forma como enxergamos o mundo.
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              color: "rgba(255,255,255,0.85)",
              lineHeight: 1.6,
            }}
          >
            A 5 Seasons nasceu para criar viagens que não terminam quando a mala
            volta para casa.
          </p>
        </div>
      </section>

      {/* 2. NOSSA ESSÊNCIA */}
      <section className="container" style={{ padding: "80px 24px" }}>
        <div className="sobre-grid-2">
          <div>
            <div
              className="eyebrow"
              style={{ color: "var(--beje-escuro)", marginBottom: "16px" }}
            >
              Nossa Essência
            </div>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "2.5rem",
                color: "var(--verde-escuro)",
                margin: "0 0",
                lineHeight: 1.2,
              }}
            >
              Mais que viagens,
            </h2>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "2.5rem",
                color: "var(--verde-escuro)",
                margin: "0 0 24px",
                lineHeight: 1.2,
              }}
            >
              conexões reais.
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.7,
                fontSize: "15px",
                marginBottom: "16px",
              }}
            >
              Acreditamos que viajar é mais do que estar longe. É transformar
              experiências em memórias, conhecer diferentes culturas e criar
              conexões que vão além do destino. Cada viagem é uma oportunidade
              de se reconectar com o mundo e com novas histórias.
            </p>
            {/* <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '15px' }}>
              Desde o dia um, nosso propósito sempre foi tirar os viajantes do óbvio. Queremos que você sinta a cultura local, respire novos ares e volte para casa transformado por cada destino que curamos com tanto cuidado.
            </p> */}
          </div>
          <div className="sobre-img-wrapper" style={{ height: "400px" }}>
            <img
              src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&q=80&w=800"
              alt="Viajante olhando a paisagem"
            />
          </div>
        </div>
      </section>

      {/* 3. OS 4 PILARES (Ícones) */}
      <section className="container" style={{ padding: "0 24px 80px" }}>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="feature-title">Grupos pequenos</div>
            <div className="feature-desc">
              Mais liberdade, mais conexão e experiências para aproveitar.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div className="feature-title">Experiências exclusivas</div>
            <div className="feature-desc">
              Viver cada destino em boa companhia torna tudo diferente.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div className="feature-title">Planejamento cuidadoso</div>
            <div className="feature-desc">
              Tudo organizado para você viajar sem preocupações.
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </div>
            <div className="feature-title">Acompanhamento</div>
            <div className="feature-desc">
              Você acompanha com quem entende e cuida de cada etapa da viagem.
            </div>
          </div>
        </div>
      </section>

      {/* 4. BANNER DO MEIO */}
      <section
        className="sobre-banner-middle"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=2000)",
        }}
      >
        <div className="sobre-banner-overlay"></div>
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "3rem",
              margin: "0 0 16px",
              maxWidth: "700px",
              lineHeight: 1.1,
            }}
          >
            Viagens que se transformam em histórias.
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(255,255,255,0.8)",
              maxWidth: "500px",
              lineHeight: 1.6,
            }}
          >
            Mais do que conhecer lugares, queremos proporcionar experiências que
            ficam para sempre. Destinos únicos e momentos que merecem ser
            vividos.
          </p>
        </div>
      </section>

      {/* 5. QUEM VAI TE ACCOMPANHAR */}
      <section
        className="container"
        style={{
          padding: "80px 24px",
          borderBottom: "1px solid var(--beje-claro)",
        }}
      >
        <div className="sobre-grid-2">
          <div className="sobre-img-wrapper" style={{ height: "600px" }}>
            <img
              src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&q=80&w=800"
              alt="Viajante olhando a paisagem"
            />
          </div>
          <div>
            <div
              className="eyebrow"
              style={{ color: "var(--beje-escuro)", marginBottom: "16px" }}
            >
              Quem vai te acompanhar
            </div>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "2.5rem",
                color: "var(--verde-escuro)",
                margin: "0 0",
                lineHeight: 1.2,
              }}
            >
              Bruna Duz
            </h2>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "2.5rem",
                color: "var(--verde-escuro)",
                margin: "0 0 24px",
                lineHeight: 1.2,
              }}
            >
              Host{" "}
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.85em",
                  verticalAlign: "middle",
                }}
              >
                &amp;
              </span>{" "}
              Fundadora
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.7,
                fontSize: "15px",
                marginBottom: "16px",
              }}
            >
              Sou médica, empreendedora e, acima de tudo, apaixonada por viajar.
              Com o tempo, descobri que os lugares que conhecemos se tornam
              ainda mais especiais quando temos com quem compartilhá-los. Vivi
              isso ao proporcionar momentos inesquecíveis para minha família e
              também nas amizades que trouxe de viagens pelo mundo. Em uma
              delas, inclusive, encontrei o amor da minha vida.
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.7,
                fontSize: "15px",
                marginBottom: "16px",
              }}
            >
              E foi daí que nasceu o sonho de poder proporcionar isso também a
              outras pessoas. Criar viagens em que você não apenas conheça
              lugares incríveis, mas volte para casa com histórias para contar,
              momentos para guardar e pessoas que talvez se tornem parte da sua
              vida.
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.7,
                fontSize: "15px",
                marginBottom: "16px",
              }}
            >
              Nesta expedição, estarei com vocês do primeiro ao último dia,
              vivendo cada momento de perto. Espero que, ao final, você sinta
              que levou para casa muito mais do que uma viagem.
            </p>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.25rem",
                color: "var(--verde-escuro)",
                marginTop: "28px",
              }}
            >
              Nos vemos nessa aventura.
            </p>
          </div>
        </div>
      </section>

      {/* 6. POR QUE EXISTIMOS & CALL TO ACTION */}
      <section className="container" style={{ padding: "40px 24px 100px" }}>
        <div className="sobre-grid-2">
          <div>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "2.5rem",
                color: "var(--verde-escuro)",
                margin: "0 0 24px",
              }}
            >
              Por que existimos.
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.7,
                fontSize: "15px",
              }}
            >
              Porque acreditamos que o mundo é um lugar para ser vivido,
              explorado e compartilhado. Criamos viagens para quem quer conhecer
              novos lugares, novas culturas e viver experiências especiais.
            </p>

            <div
              style={{
                marginTop: "48px",
                borderTop: "1px solid var(--beje-claro)",
                paddingTop: "40px",
              }}
            >
              <h3
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.8rem",
                  color: "var(--verde-escuro)",
                  margin: "0 0 24px",
                }}
              >
                O Mundo Espera por Você
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  fontSize: "15px",
                }}
              >
                Lugares incríveis estão esperando para serem explorados. Confira
                nossos destinos disponíveis agora e embarque nessa jornada com a
                gente."
              </p>
              <Link to="/" className="btn-gold">
                Conhecer Viagens &rarr;
              </Link>
            </div>
          </div>
          <div className="sobre-img-wrapper" style={{ height: "500px" }}>
            <img
              src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800"
              alt="Paisagem deslumbrante na natureza"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
