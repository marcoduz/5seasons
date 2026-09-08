import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PERGUNTAS = [
  {
    pergunta: "Como faço para reservar minha vaga?",
    resposta: "A reserva é feita diretamente com a nossa equipe. Você pode manifestar interesse clicando no botão 'Quero me inscrever' na página da expedição, que o redirecionará para o nosso WhatsApp. Lá, enviaremos os dados para pagamento e o contrato."
  },
  {
    pergunta: "Quais são as formas de pagamento aceitas?",
    resposta: "Aceitamos pagamentos via Pix (à vista com desconto), transferência bancária, boleto parcelado (mediante análise) ou cartão de crédito em até 12x (com acréscimo da operadora)."
  },
  {
    pergunta: "As passagens aéreas estão inclusas?",
    resposta: "Como recebemos viajantes de diversas partes do Brasil e do mundo, os voos até o destino inicial da expedição não costumam estar inclusos no pacote. Mas não se preocupe: nossa equipe sempre oferece suporte e indica os melhores voos para o grupo chegar junto!"
  },
  {
    pergunta: "Vou viajar sozinho(a). Posso ir mesmo assim?",
    resposta: "Com certeza! A maioria dos nossos clientes viaja solo. É uma oportunidade incrível para fazer novas amizades. Você pode optar por pagar o suplemento para ficar em um quarto individual (Single) ou compartilhar o quarto com outra pessoa do mesmo gênero (Quarto Duplo)."
  },
  {
    pergunta: "Preciso ter muito preparo físico?",
    resposta: "Isso depende de cada destino. Algumas expedições (como Patagônia) exigem um preparo físico moderado para trilhas longas, enquanto outras são mais contemplativas e focadas em conforto. Recomendamos sempre ler a aba 'Observações' na página de cada roteiro."
  },
  {
    pergunta: "Qual é a política de cancelamento?",
    resposta: "Nossa política varia de acordo com a proximidade da viagem e os fornecedores locais. Ao fechar o pacote, você recebe um contrato detalhado com as cláusulas de cancelamento e reembolso. Recomendamos sempre a contratação de um seguro viagem que cubra cancelamentos."
  }
];

export function Duvidas() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function toggleAccordion(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', color: 'var(--text-main)' }}>
      
      {/* Botão para voltar (Igual ao da Política) */}
      <div style={{ marginBottom: '40px' }}>
        <Link 
          to="/" 
          style={{ color: 'var(--verde-escuro)', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}
        >
          &larr; VOLTAR PARA O INÍCIO
        </Link>
      </div>

      {/* Título (Igual ao da Política) */}
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontFamily: 'Playfair Display, serif', color: 'var(--verde-escuro)', textTransform: 'uppercase' }}>
        Perguntas Frequentes
      </h1>
      <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '40px' }}>
        Reunimos aqui as dúvidas mais comuns sobre nossas expedições e experiências.
      </p>

      {/* Lista de Dúvidas - Estilo Clean / Flat */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {PERGUNTAS.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              style={{ 
                borderBottom: '1px solid var(--beje-claro)', 
                overflow: 'hidden'
              }}
            >
              <button 
                onClick={() => toggleAccordion(index)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '24px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--verde-escuro)',
                  fontFamily: 'Playfair Display, serif'
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>
                  {item.pergunta}
                </span>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: 'var(--verde-escuro)',
                    flexShrink: 0,
                    marginLeft: '16px'
                  }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              
              <div 
                style={{ 
                  maxHeight: isOpen ? '500px' : '0', 
                  opacity: isOpen ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease-in-out',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                  fontSize: '15px'
                }}
              >
                <div style={{ paddingBottom: '24px' }}>
                  {item.resposta}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé da página de dúvidas */}
      <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--beje-claro)' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '15px' }}>
          Não encontrou o que procurava? Fique à vontade para nos chamar!
        </p>
        <a 
          href="https://wa.me/5554996468737?text=Olá!%20Dei%20uma%20olhada%20no%20FAQ%20mas%20ainda%20tenho%20uma%20dúvida." 
          target="_blank" 
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--verde-escuro)',
            color: 'var(--branco-gelo)',
            padding: '12px 24px',
            borderRadius: '99px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.015c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
          </svg>
          Falar com a Equipe
        </a>
      </div>
    </div>
  );
}