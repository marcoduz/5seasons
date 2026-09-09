import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PERGUNTAS = [
  {
    pergunta: "Como funciona uma expedição da 5 Seasons?",
    resposta: `Uma expedição 5 Seasons é uma experiência cuidadosamente planejada para que você possa viajar, explorar e viver cada destino com tranquilidade, sabendo que terá uma equipe ao seu lado durante toda a jornada.

    Desde a chegada ao destino até o último dia da viagem, você contará com o acompanhamento de um representante da 5 Seasons, responsável por orientar o grupo, acompanhar a programação, organizar os momentos da experiência e oferecer suporte sempre que necessário.

    Por trás de cada expedição existe também uma rede de parceiros e fornecedores selecionados, que participam da execução de diferentes serviços, como hospedagem, transportes, experiências e atividades.

    Você não precisa se preocupar em coordenar cada detalhe. Nós cuidamos da organização para que você possa se concentrar no que realmente importa: aproveitar a viagem, conhecer lugares incríveis e viver a experiência junto com o grupo.`
  },
  {
    pergunta: "Por que viajar com a 5 Seasons?",
    resposta: "Porque acreditamos que viajar pode ser muito mais do que visitar um lugar. Cada expedição é pensada para unir destinos especiais, experiências cuidadosamente escolhidas e a tranquilidade de ter alguém acompanhando você ao longo da jornada. Você não precisa passar meses organizando cada detalhe ou descobrir tudo sozinho. Nós cuidamos da experiência para que você possa simplesmente viver a viagem."
  },
  {
    pergunta: "Como são escolhidos os destinos e experiências?",
    resposta: "Cada destino é escolhido, após visita presencial prévia e cuidadosa, proporcionando uma curadoria capaz de pensar não apenas nos lugares que vamos conhecer, mas na experiência que queremos proporcionar. Buscamos combinar paisagens especiais, cultura, gastronomia, hospedagens e experiências que façam sentido dentro da proposta de cada expedição."
  },
  {
    pergunta: "O que está incluído em cada expedição?",
    resposta: "Cada expedição possui uma programação e inclusões próprias, que são apresentadas antes da contratação. O participante recebe informações detalhadas sobre hospedagem, transportes, experiências, alimentação e demais serviços incluídos no valor da viagem."
  },
  {
    pergunta: "O que não está incluído no valor da expedição?",
    resposta: "As inclusões variam conforme cada expedição. De forma geral, despesas pessoais, passagens aéreas, seguros, refeições, atividades opcionais ou outros serviços não expressamente indicados na programação podem não estar incluídos. Todas as inclusões e exclusões são informadas antes da contratação."
  },
  {
    pergunta: "Quantas pessoas participam de cada expedição?",
    resposta: "O tamanho dos grupos varia conforme o destino e a proposta de cada experiência. Trabalhamos com grupos planejados para proporcionar uma experiência mais próxima, organizada e confortável. O número de participantes de cada expedição é informado na apresentação da viagem."
  },
  {
    pergunta: "Quem acompanha o grupo durante a viagem?",
    resposta: "As expedições contam com o acompanhamento de um representante da 5 Seasons durante a jornada, responsável por acompanhar a programação, orientar os participantes e oferecer suporte ao grupo. Alguns serviços e atividades são realizados por parceiros e fornecedores locais especializados."
  },
  {
    pergunta: "Posso participar de uma expedição mesmo viajando sozinho(a)?",
    resposta: `Nossos grupos são formados por pessoas que compartilham o desejo de conhecer novos destinos e viver experiências especiais. Você chega sozinho(a), mas não precisa viver a viagem sozinho(a).
     Caso prefira um quarto individual, é possível consultar a 5 Seasons sobre essa possibilidade antes da contratação. A acomodação individual está sujeita à disponibilidade e poderá ter um custo adicional.`
  },
  {
    pergunta: "Preciso falar outro idioma também para participar?",
    resposta: "Não. Você não precisa falar inglês, espanhol ou qualquer outro idioma, além do português, para participar das nossas expedições. Sempre que necessário, a 5 Seasons oferece orientações e suporte para facilitar a comunicação durante a viagem. A necessidade de acompanhamento ou suporte adicional pode variar conforme o destino e a programação de cada expedição."
  },
  {
    pergunta: "Quem é responsável pela documentação da viagem?",
    resposta: "O viajante é responsável por providenciar e manter válidos os documentos necessários para embarque, entrada, permanência e retorno. A 5 Seasons fornece as orientações pertinentes."
  },
  {
    pergunta: "Como faço para reservar minha vaga?",
    resposta: "A reserva é feita diretamente com a nossa equipe. Você pode manifestar interesse clicando no botão 'Quero me inscrever' na página da expedição, que o redirecionará para o nosso WhatsApp. Lá, enviaremos os dados para pagamento e o contrato, ou clicar no botão do whats flutuante e informar qual expedição deseja se inscrever"
  },
  {
    pergunta: "Quais são as formas de pagamento aceitas?",
    resposta: "Aceitamos pagamentos via Pix (à vista com desconto), transferência bancária, boleto parcelado (mediante análise) ou cartão de crédito em até 12x (com acréscimo da operadora)."
  },
  {
    pergunta: "Posso cancelar minha viagem?",
    resposta: "Sim. Existe o direito de arrependimento de 7 dias. Após esse período, as condições dependem da expedição contratada e do prazo entre a solicitação e o início da viagem."
  },
  {
    pergunta: "Posso transferir minha reserva para outra pessoa?",
    resposta: "A possibilidade de transferência existe conforme as condições estabelecidas no contrato de cada expedição, incluindo prazo, disponibilidade e regras dos fornecedores."
  },
  {
    pergunta: "Meus dados pessoais são compartilhados?",
    resposta: "Podem ser compartilhados com hotéis, transportadoras, fornecedores de experiências, seguradoras e demais prestadores envolvidos na execução da viagem, apenas na medida necessária para a prestação dos serviços e conforme a LGPD."
  },
  {
    pergunta: "A 5 Seasons utiliza fotos e vídeos dos participantes?",
    resposta: "O contrato prevê autorização para captação e utilização de imagem, voz, nome e participação em conteúdos relacionados à expedição, à marca e às futuras experiências, respeitados os limites estabelecidos no contrato."
  },
  {
    pergunta: "Como funciona o contato em caso de emergência?",
    resposta: "O participante fornece os dados de uma pessoa de confiança para contato durante a expedição."
  },
  {
    pergunta: "A 5 Seasons pode alterar um passeio durante a viagem?",
    resposta: "Sim, quando necessário para segurança, viabilidade operacional ou continuidade da expedição. Em situações que exigem decisão imediata, a alteração pode ocorrer sem comunicação prévia, sendo os participantes informados assim que possível."
  },
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
      
      {/* Botão para voltar */}
      <div style={{ marginBottom: '40px' }}>
        <Link 
          to="/" 
          style={{ color: 'var(--verde-escuro)', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}
        >
          &larr; VOLTAR PARA O INÍCIO
        </Link>
      </div>

      {/* Título */}
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontFamily: 'Playfair Display, serif', color: 'var(--verde-escuro)', textTransform: 'uppercase' }}>
        Perguntas Frequentes
      </h1>
      <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '40px' }}>
        Reunimos aqui as dúvidas mais comuns sobre nossas expedições e experiências.
      </p>

      {/* Lista de Dúvidas */}
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
                  maxHeight: isOpen ? '1000px' : '0', /* Aumentado para acomodar respostas longas */
                  opacity: isOpen ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.4s ease-in-out',
                  color: 'var(--text-main)',
                  lineHeight: 1.7,
                  fontSize: '15px'
                }}
              >
                <div style={{ paddingBottom: '24px', whiteSpace: 'pre-line' }}>
                  {item.resposta}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé da página de dúvidas */}
      <div style={{ marginTop: '10px', paddingTop: '10px', }}>
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