⚽ FutMatch Web

Interface web do FutMatch — plataforma para organização de eventos esportivos.

🚀 Tecnologias
React 19
Vite
styled-components
React Router DOM
react-hook-form + Yup
Axios
GSAP
Google OAuth (@react-oauth/google)

📦 Pré-requisitos (OBRIGATÓRIO)

Antes de começar, você precisa instalar:

1. Node.js

https://nodejs.org

Após instalar, verifique:

node -v
npm -v

2. Git

https://git-scm.com/

Verifique:

git --version

3. FutMatch API rodando

A interface depende da API para funcionar. Certifique-se de que ela está no ar em:

http://localhost:3000

📥 Como baixar o projeto
Opção 1 — Clonar com Git (RECOMENDADO)

git clone https://github.com/mateus-vitor-ferreira-dev/futmatch-web.git

cd futmatch-web

Opção 2 — Baixar ZIP
Clique em "Code"
Clique em "Download ZIP"
Extraia
Abra a pasta no terminal

⚙️ Configuração do projeto

1. Instalar dependências

npm install

2. Criar arquivo .env

Crie um arquivo chamado .env na raiz do projeto com o seguinte conteúdo:

VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=COLE_AQUI_O_VALOR_ENVIADO_NO_WHATSAPP

⚠️ O valor do VITE_GOOGLE_CLIENT_ID será enviado pelo Mateus via WhatsApp.
Nunca compartilhe esse arquivo nem o commite no repositório — ele já está no .gitignore.

▶️ Rodando o projeto

npm run dev

A interface estará em:

http://localhost:5173

🏗️ Build de produção

npm run build

Os arquivos gerados ficam na pasta dist/ (não versionada).

🧠 Estrutura do projeto

src/
├── assets/
│   └── sports/         # Imagens das modalidades
├── components/
│   ├── AuthLayout/     # Layout da tela de autenticação
│   ├── MainLayout/     # Layout principal com sidebar
│   └── SportSelect/    # Seletor de modalidades
├── config/
│   └── env.js          # Variáveis de ambiente
├── contexts/
│   └── AuthContext.jsx # Contexto global de autenticação
├── hooks/
│   └── useSports.js    # Hook de modalidades
├── pages/
│   ├── Home/           # Página inicial (autenticada)
│   ├── Intro/          # Animação de entrada
│   └── Register/       # Login e cadastro
├── routes/
│   └── index.jsx       # Rotas com proteção pública/privada
├── services/
│   ├── api.js          # Cliente HTTP (Axios)
│   ├── auth.js         # Serviços de autenticação
│   └── sports.js       # Serviços de modalidades
└── styles/
    ├── global.js       # Estilos globais
    └── theme.js        # Tema (cores, fontes, espaçamentos)

🌱 Fluxo de trabalho (GIT)
Nunca trabalhe direto na main

Criar branch:

git checkout develop
git pull
git checkout -b feat/nome-da-feature

Fazer commit

git add .
git commit -m "feat: add home page"

Enviar para GitHub

git push origin feat/nome-da-feature

Criar Pull Request
Vá no GitHub
Clique em "Compare & pull request"
Base: develop
Enviar

📌 Conventional Commits

Formato:

tipo: descrição

Tipos principais:

feat → nova funcionalidade
fix → correção de bug
chore → configuração
docs → documentação
refactor → melhoria interna
test → testes

Exemplos

feat: add match listing page
fix: correct login redirect after Google OAuth
chore: remove Vite boilerplate assets
docs: update readme
refactor: extract auth logic to context

🚫 Regras importantes
NÃO fazer push na main
NÃO commitar .env
SEMPRE usar branch
SEMPRE usar commit padrão
TESTAR antes de subir

🧪 Comandos úteis

Rodar em desenvolvimento:
npm run dev

Gerar build de produção:
npm run build

Pré-visualizar build:
npm run preview

🧠 Dicas

Sempre rode npm install após atualizar o projeto

Se der erro:

rm -rf node_modules
npm install

A pasta dist/ é gerada automaticamente no build e não deve ser versionada.

👥 Colaboração

Projeto com padrão profissional:

arquitetura em camadas
componentes reutilizáveis
separação entre UI e lógica de negócio
boas práticas

🚀 Futuro
responsividade mobile
tema escuro
página de perfil do usuário
listagem e criação de eventos
histórico de partidas
notificações em tempo real

🔥 Em caso de dúvida, pergunte antes de alterar código.
