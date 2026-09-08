import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function PoliticaPrivacidade() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', color: 'var(--text-main)' }}>
      <div style={{ marginBottom: '40px' }}>
        <Link 
          to="/" 
          style={{ color: 'var(--verde-escuro)', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}
        >
          &larr; VOLTAR PARA O INÍCIO
        </Link>
      </div>

      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', fontFamily: 'Playfair Display, serif', color: 'var(--verde-escuro)' }}>
        POLÍTICA DE PRIVACIDADE
      </h1>
      <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '40px' }}>
        Última atualização: 08 de setembro de 2026
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: '1.6', fontSize: '15px' }}>
        <p>
          A 5 Seasons, responsável pela organização e comercialização de experiências e expedições, valoriza a privacidade e a proteção dos dados pessoais de seus clientes, participantes e visitantes.
        </p>
        <p>
          Esta Política de Privacidade explica como os dados pessoais são coletados, utilizados, armazenados e compartilhados pela 5 Seasons, em conformidade com a Lei nº 13.709/2018, Lei Geral de Proteção de Dados Pessoais (LGPD).
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>1. QUAIS DADOS PODEM SER COLETADOS</h2>
        <p>Dependendo da relação estabelecida com a 5 Seasons e dos serviços contratados, poderão ser coletados dados como:</p>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>nome completo;</li>
          <li>CPF ou outro documento de identificação;</li>
          <li>data de nascimento;</li>
          <li>nacionalidade;</li>
          <li>endereço;</li>
          <li>telefone e WhatsApp;</li>
          <li>endereço de e-mail;</li>
          <li>informações necessárias para emissão de passagens, reservas e ingressos;</li>
          <li>dados relacionados à hospedagem e transporte;</li>
          <li>informações de contato para situações de emergência;</li>
          <li>informações necessárias para contratação de seguro viagem, quando aplicável;</li>
          <li>informações de pagamento e faturamento;</li>
          <li>informações fornecidas voluntariamente pelo participante para viabilizar a prestação dos serviços.</li>
        </ul>
        <p>
          A 5 Seasons buscará coletar apenas os dados necessários para as finalidades descritas nesta Política e para a adequada prestação dos serviços contratados.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>2. COMO UTILIZAMOS OS DADOS PESSOAIS</h2>
        <p>Os dados pessoais poderão ser utilizados para:</p>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>realizar reservas de hospedagem, transporte, passeios, experiências e demais serviços contratados;</li>
          <li>emitir ingressos, bilhetes, documentos e reservas necessários à viagem;</li>
          <li>organizar a logística e a execução das expedições;</li>
          <li>realizar comunicações relacionadas à viagem e aos serviços contratados;</li>
          <li>efetuar cobranças, pagamentos e procedimentos administrativos;</li>
          <li>contratar e administrar seguros de viagem, quando aplicável;</li>
          <li>atender solicitações, dúvidas e necessidades dos participantes;</li>
          <li>cumprir obrigações legais, regulatórias e contratuais;</li>
          <li>exercer regularmente direitos em processos judiciais, administrativos ou arbitrais;</li>
          <li>prevenir fraudes e proteger a segurança das operações;</li>
          <li>enviar comunicações e informações sobre novas experiências, produtos e serviços, quando permitido pela legislação e, quando necessário, mediante consentimento.</li>
        </ul>
        <p>
          O tratamento dos dados pessoais poderá ocorrer com fundamento nas hipóteses previstas na LGPD, incluindo a execução de contrato, cumprimento de obrigação legal ou regulatória, exercício regular de direitos, proteção da vida e outras bases legais aplicáveis ao caso.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>3. COMPARTILHAMENTO DE DADOS</h2>
        <p>Para viabilizar a prestação dos serviços, alguns dados pessoais poderão ser compartilhados, exclusivamente na medida necessária, com terceiros envolvidos na organização da viagem. Isso poderá incluir:</p>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>hotéis e demais meios de hospedagem;</li>
          <li>companhias aéreas, transportadoras e empresas de transporte;</li>
          <li>fornecedores de passeios e experiências;</li>
          <li>empresas de turismo e receptivos locais;</li>
          <li>seguradoras e empresas responsáveis por assistência ao viajante;</li>
          <li>fornecedores responsáveis por ingressos e reservas;</li>
          <li>prestadores de serviços necessários à execução da expedição;</li>
          <li>instituições financeiras e empresas responsáveis por processamento de pagamentos, quando necessário;</li>
          <li>autoridades públicas, quando houver obrigação legal ou regulatória.</li>
        </ul>
        <p>A 5 Seasons não comercializa dados pessoais dos participantes. Os dados serão compartilhados somente quando necessário para a prestação dos serviços, cumprimento de obrigações legais ou exercício regular de direitos, observadas as disposições da legislação aplicável.</p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>4. DADOS NECESSÁRIOS PARA A REALIZAÇÃO DA VIAGEM</h2>
        <p>
          Alguns dados pessoais são indispensáveis para a adequada execução dos serviços contratados. O fornecimento dessas informações poderá ser necessário para emissão de passagens e ingressos, realização de reservas, hospedagem, transportes, contratação de seguros, controle de embarque e demais procedimentos relacionados à expedição.
        </p>
        <p>
          A ausência de determinadas informações poderá impossibilitar ou limitar a prestação de determinados serviços quando esses dados forem efetivamente necessários para sua execução.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>5. DADOS PESSOAIS SENSÍVEIS</h2>
        <p>
          Em situações específicas, poderá ser necessário tratar dados pessoais sensíveis, especialmente quando indispensáveis para a segurança ou assistência do participante, contratação de determinados serviços ou atendimento a situações de emergência. Quando houver tratamento de dados pessoais sensíveis, a 5 Seasons adotará as medidas previstas na legislação aplicável e limitará o tratamento ao estritamente necessário para a finalidade correspondente.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>6. ARMAZENAMENTO E SEGURANÇA</h2>
        <p>
          A 5 Seasons adota medidas técnicas e administrativas razoáveis e compatíveis com a natureza dos dados tratados para proteger as informações pessoais contra acessos não autorizados, perda, destruição, alteração, divulgação ou qualquer forma de tratamento inadequado ou ilícito.
        </p>
        <p>
          Os dados pessoais serão mantidos pelo período necessário para cumprir as finalidades para as quais foram coletados, bem como para atender obrigações legais, regulatórias, contratuais e para o exercício regular de direitos. Após o término do período de retenção aplicável, os dados serão eliminados ou anonimizados, quando possível e permitido pela legislação.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>7. DIREITOS DOS TITULARES</h2>
        <p>Nos termos da LGPD, o titular dos dados pessoais poderá, observadas as hipóteses e limitações previstas na legislação:</p>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>confirmar a existência de tratamento de seus dados;</li>
          <li>solicitar acesso aos dados pessoais tratados;</li>
          <li>solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>solicitar informações sobre o compartilhamento de seus dados;</li>
          <li>solicitar a anonimização, bloqueio ou eliminação de dados tratados de forma inadequada ou desnecessária, quando cabível;</li>
          <li>solicitar a eliminação dos dados tratados com base no consentimento, ressalvadas as hipóteses legais de conservação;</li>
          <li>revogar o consentimento, quando essa for a base legal utilizada para o tratamento;</li>
          <li>solicitar informações sobre as consequências de não fornecer determinado consentimento, quando aplicável;</li>
          <li>exercer os demais direitos previstos na legislação aplicável.</li>
        </ul>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>8. COOKIES E TECNOLOGIAS SEMELHANTES</h2>
        <p>
          O site da 5 Seasons poderá utilizar cookies e tecnologias semelhantes para permitir o funcionamento adequado da página, melhorar a experiência de navegação, compreender a utilização do site e, quando aplicável, realizar ações de comunicação e publicidade. Quando necessário, serão solicitadas as permissões correspondentes ao usuário.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>9. USO DE IMAGEM, VOZ E CONTEÚDO</h2>
        <p>
          Durante as expedições, poderão ser realizadas fotografias, vídeos e outros registros audiovisuais dos participantes. A utilização desses registros para fins de divulgação da 5 Seasons, de suas experiências e de seus conteúdos promocionais será tratada por meio de autorização específica, quando aplicável.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>10. TRANSFERÊNCIA E COMPARTILHAMENTO COM FORNECEDORES NO EXTERIOR</h2>
        <p>
          Como algumas experiências da 5 Seasons poderão ocorrer fora do Brasil, poderá ser necessário compartilhar determinados dados pessoais com fornecedores, hotéis, empresas de turismo, transportadoras, seguradoras ou outros prestadores localizados no exterior. Quando aplicável, esse tratamento será realizado observando as disposições da LGPD relativas à transferência internacional de dados pessoais e as medidas de proteção cabíveis.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>11. CANAL PARA ASSUNTOS DE PRIVACIDADE</h2>
        <p>
          Para dúvidas, solicitações ou exercício dos direitos relacionados ao tratamento de dados pessoais, o titular poderá entrar em contato pelo e-mail:
        </p>
        <p style={{ fontWeight: 'bold' }}>
          5seasons.experience@gmail.com
        </p>
        <p>
          As solicitações serão analisadas de acordo com a legislação aplicável. Quando aplicável, a 5 Seasons poderá solicitar informações adicionais para confirmar a identidade do solicitante e proteger os dados pessoais contra acessos indevidos.
        </p>

        <h2 style={{ fontSize: '1.3rem', marginTop: '16px', color: 'var(--verde-escuro)', fontFamily: 'Playfair Display, serif' }}>12. ATUALIZAÇÕES DESTA POLÍTICA</h2>
        <p>
          Esta Política de Privacidade poderá ser atualizada periodicamente para refletir alterações na legislação, nos serviços oferecidos ou nas práticas de tratamento de dados da 5 Seasons. A versão mais recente estará sempre disponível nesta página.
        </p>
        <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '20px' }}>
          Última atualização: 08 de setembro de 2026
        </p>
      </div>
    </div>
  );
}