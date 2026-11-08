# 5 Seasons Experience - Plataforma Web

Este repositório contém o código-fonte do site público e do painel administrativo da agência **5 Seasons Experience**. O projeto é construído com **React** (Vite) no frontend e **Supabase** como backend (BaaS).

## 🚀 Como rodar o projeto localmente

### 1. Pré-requisitos
Certifique-se de ter instalado em sua máquina:
* **Node.js** (versão 18 ou superior)
* **npm** (o projeto possui um `package-lock.json`)
* **Supabase CLI** (para gerenciar o banco de dados via terminal)

### 2. Instalação das Dependências
Abra o terminal na pasta raiz do projeto (`5seasons-dev`) e execute o comando para baixar todos os pacotes necessários:
\`\`\`bash
npm install
\`\`\`

### 3. Configuração das Variáveis de Ambiente
O projeto precisa das credenciais do Supabase para conseguir ler e gravar dados.
1. Localize o arquivo `.env.example` na raiz do projeto.
2. Crie uma cópia exata desse arquivo e renomeie-a para `.env`.
3. Abra o arquivo `.env` e preencha com as credenciais reais de produção/desenvolvimento do seu projeto no Supabase:
\`\`\`env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
\`\`\`

### 4. Executando o Servidor de Desenvolvimento
Para iniciar a aplicação localmente e visualizar suas alterações em tempo real, rode:
\`\`\`bash
npm run dev
\`\`\`
O terminal exibirá a URL local (geralmente `http://localhost:5173`). 
* **Site Público:** Acesse a raiz (`/`).
* **Painel Administrativo:** Acesse a rota `/admin`.

---

## 🗄️ Banco de Dados e Migrations (Supabase)

Toda a estrutura do banco de dados (tabelas, colunas, políticas) é versionada em código através da pasta `supabase/migrations/`.

**Para aplicar as migrations locais no banco de dados remoto:**
\`\`\`bash
npx supabase db push
\`\`\`

**Para criar uma nova migration (quando precisar alterar a estrutura de uma tabela):**
\`\`\`bash
npx supabase migration new nome_da_sua_alteracao
\`\`\`
*Isso criará um arquivo `.sql` em branco na pasta de migrations para você escrever os comandos `ALTER TABLE`.*

---

## 📁 Estrutura Principal do Projeto

* `src/pages/public/` - Interface, páginas e componentes visíveis para os clientes finais.
* `src/pages/admin/` - Sistema interno (CMS) para gestão de expedições, pacotes, clientes e reservas.
* `src/services/` - Configurações de conexão com APIs e o cliente do Supabase.
* `public/` - Arquivos estáticos gerais (Logos da 5 Seasons, QR Code do Cadastur, ícones).
* `supabase/migrations/` - Arquivos `.sql` que contêm o histórico de evolução do banco de dados.