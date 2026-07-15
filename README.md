<div align="center">

<h1>🌐 Só+1 — Web App</h1>

<p><strong>Interface web da plataforma de organização de peladas amadoras</strong></p>

<p>
  <a href="https://app.so-mais-um.com" target="_blank">
    <img src="https://img.shields.io/badge/Acessar_App-app.so--mais--um.com-22C55E?style=for-the-badge&logo=vercel&logoColor=white" alt="App"/>
  </a>
</p>

<p>
  <img src="https://github.com/mateus-vitor-ferreira-dev/so-mais-um-web/actions/workflows/ci-cd.yml/badge.svg" alt="CI/CD"/>
  &nbsp;
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Styled_Components-DB7093?style=flat-square&logo=styled-components&logoColor=white" alt="Styled Components"/>
  <img src="https://img.shields.io/badge/deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

</div>

---

## 📋 Índice

- [Telas](#-telas)
- [Stack](#-stack)
- [Instalação local](#-instalação-local)
- [Rotas](#-rotas)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Requisitos cobertos](#-requisitos-cobertos)
- [Convenções](#-convenções)

---

## 📸 Telas

<div align="center">

**Descubra peladas abertas perto de você e entre com um clique**

![Home](docs/screenshots/home.png)

</div>

|  Quero Jogar  |  Criar Pelada (wizard)  |
| :-----------: | :---------------------: |
| ![Quero Jogar](docs/screenshots/quero-jogar.png) | ![Criar Pelada](docs/screenshots/criar-pelada.png) |
| **Minhas Peladas** | **Histórico** |
| ![Minhas Peladas](docs/screenshots/minhas-peladas.png) | ![Histórico](docs/screenshots/historico.png) |

<details>
<summary><strong>Mais telas</strong> — torneios, avaliações, perfil e login</summary>

<br/>

|  Torneios  |  Avaliações  |
| :--------: | :----------: |
| ![Torneios](docs/screenshots/torneios.png) | ![Avaliações](docs/screenshots/avaliacoes.png) |
| **Perfil** | **Login** |
| ![Perfil](docs/screenshots/perfil.png) | ![Login](docs/screenshots/login.jpg) |

</details>

---

## 🛠️ Stack

<table>
  <tbody>
    <tr>
      <td><strong>UI</strong></td>
      <td><img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black"/> <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white"/> <img src="https://img.shields.io/badge/Styled_Components-DB7093?style=flat-square&logo=styled-components&logoColor=white"/></td>
    </tr>
    <tr>
      <td><strong>Roteamento</strong></td>
      <td><img src="https://img.shields.io/badge/React_Router_v7-CA4245?style=flat-square&logo=react-router&logoColor=white"/></td>
    </tr>
    <tr>
      <td><strong>Formulários</strong></td>
      <td><img src="https://img.shields.io/badge/react--hook--form-EC5990?style=flat-square&logo=react-hook-form&logoColor=white"/> <img src="https://img.shields.io/badge/Yup-222222?style=flat-square"/></td>
    </tr>
    <tr>
      <td><strong>HTTP</strong></td>
      <td><img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white"/> (interceptors JWT + auto-logout em 401)</td>
    </tr>
    <tr>
      <td><strong>Mapas</strong></td>
      <td><img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white"/> (mapa de quadras em <code>/quero-jogar</code>)</td>
    </tr>
    <tr>
      <td><strong>Animações</strong></td>
      <td><img src="https://img.shields.io/badge/GSAP-88CE02?style=flat-square&logo=greensock&logoColor=black"/> (intro e transições)</td>
    </tr>
    <tr>
      <td><strong>Auth social</strong></td>
      <td><img src="https://img.shields.io/badge/Google_OAuth-4285F4?style=flat-square&logo=google&logoColor=white"/></td>
    </tr>
    <tr>
      <td><strong>Ícones</strong></td>
      <td><img src="https://img.shields.io/badge/Lucide-222222?style=flat-square"/></td>
    </tr>
    <tr>
      <td><strong>Deploy</strong></td>
      <td><img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white"/> (preview por PR · produção em <code>main</code>)</td>
    </tr>
  </tbody>
</table>

---

## 🚀 Instalação local

```bash
# 1. Clonar
git clone https://github.com/mateus-vitor-ferreira-dev/so-mais-um-web.git
cd so-mais-um-web

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
```

```ini
# .env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=<seu_google_client_id>
```

```bash
# 4. Iniciar em desenvolvimento
npm run dev
```

Interface disponível em `http://localhost:5173`

> A [API do Só+1](https://github.com/mateus-vitor-ferreira-dev/so-mais-um-api) deve estar rodando em `http://localhost:3000`.

---

## 🗺️ Rotas

### Públicas

| Rota | Descrição |
|---|---|
| `/` | Intro com animação GSAP |
| `/login` | Login e cadastro |
| `/register` | Cadastro direto |
| `/esqueci-senha` | Solicitar reset de senha |
| `/redefinir-senha` | Redefinir senha com token |
| `/seja-parceiro` | Portal de parceiros — onboarding de OWNER via convite |

### Jogador autenticado (`PLAYER`)

| Rota | Descrição |
|---|---|
| `/home` | Dashboard principal |
| `/perfil` | Editar dados e chave Pix |
| `/quero-jogar` | Buscar peladas (lista + mapa Leaflet) |
| `/criar-pelada` | Wizard 3 etapas para criar pelada |
| `/minhas-peladas` | Jogos criados e participações + sorteio de times |
| `/pelada/:eventId` | Detalhe completo da pelada |
| `/historico` | Partidas finalizadas + avaliar jogadores |
| `/avaliacoes` | Reputação recebida — nota média, tags e reviews |
| `/torneios` | Campeonatos com chaveamento visual |

### Admin (`/admin`)

| Rota | Descrição |
|---|---|
| `/admin/dashboard` | Visão geral da plataforma |
| `/admin/users` | Gestão de usuários, roles e convites de OWNER |
| `/admin/requests` | Solicitações de parceria |
| `/admin/places` | Gestão de espaços esportivos |

### Owner (`/owner`)

| Rota | Descrição |
|---|---|
| `/owner/dashboard` | Dashboard do proprietário |
| `/owner/places` | Gerenciar próprios locais e quadras |
| `/owner/requests` | Solicitações do local |

---

## 📁 Estrutura do projeto

```
src/
├── assets/
│   └── sports/             # Imagens das 11 modalidades
├── components/
│   ├── MainLayout/         # Sidebar + navegação responsiva
│   ├── AuthLayout/         # Layout de autenticação
│   ├── EventCard/          # Card de pelada reutilizável
│   ├── Map/                # Mapa Leaflet com marcadores
│   ├── SportSelect/        # Seletor de modalidades com imagens
│   ├── NotificationBell/   # Sino de notificações via SSE (EventSource)
│   ├── LogoSvg/            # SVG inline responsivo ao tema claro/escuro
│   └── ...
├── contexts/
│   └── AuthContext.jsx     # Estado global de autenticação (JWT + Google)
├── hooks/
│   ├── useCountries.js
│   └── useSports.js
├── pages/
│   ├── Auth/               # Intro, Login, Register, ForgotPassword, ResetPassword
│   ├── Home/               # Dashboard principal
│   ├── QueroJogar/         # Busca de peladas (lista + mapa) — filtros server-side
│   ├── CriarPelada/        # Wizard de criação (3 etapas)
│   ├── PeladaDetail/       # Detalhe da pelada (/pelada/:eventId)
│   ├── MinhasPeladas/      # Meus jogos + sorteio + finalizar/cancelar
│   ├── Historico/          # Histórico + modal de avaliação
│   ├── Avaliacoes/         # Reputação recebida
│   ├── Tournaments/        # Campeonatos + TournamentBracket
│   ├── OwnerAccess/        # Portal de parceiros (/seja-parceiro)
│   ├── Admin/              # Dashboard, Users, Requests, Places
│   └── Owner/              # Dashboard, Places, Requests
├── routes/
│   └── index.jsx           # Rotas com proteção por papel + Suspense com PageLoader
├── services/
│   ├── api.js              # Axios com interceptors JWT (auto-logout em 401)
│   ├── auth.js             # Login, registro, Google OAuth, owner invite
│   ├── events.js           # Peladas
│   ├── courts.js           # Quadras
│   ├── places.js           # Locais
│   ├── users.js            # Usuários
│   └── tournaments.js      # Campeonatos
└── styles/
    ├── theme.js            # Tema — cores, espaçamentos, tipografia (claro/escuro)
    └── global.js           # Estilos globais
```

---

## ✅ Requisitos cobertos

| RF | Funcionalidade | Status |
|---|---|---|
| RF01 | Cadastro de usuário | ✅ |
| RF02 | Login com JWT | ✅ |
| RF03 | Proteção de rotas por papel | ✅ |
| RF04 | Criar pelada | ✅ |
| RF05 | Listar e filtrar peladas | ✅ |
| RF06 | Entrar em uma pelada | ✅ |
| RF07 | Detalhe com vagas e valor | ✅ |
| RF08 | Histórico de participações | ✅ |
| RF09 | Sorteio de times | ✅ |
| RF10 | Avaliação de jogadores | ✅ |
| RF11 | Gerenciamento Admin | ✅ |
| RF12 | Login com Google OAuth | ✅ |
| RF13 | Recuperação de senha | ✅ |
| RF14 | Notificações em tempo real (SSE) | ✅ |
| RF15 | Descadastro de marketing | ✅ |
| RF16 | Módulo de Torneios | ✅ |
| RF17 | Gestão de Places e Courts (OWNER) | ✅ |
| RF18 | Portal de parceiros com convite por e-mail | ✅ |

---

## 📜 Scripts

```bash
npm run dev       # Desenvolvimento com HMR
npm run build     # Build de produção (output: dist/)
npm run preview   # Preview do build local
```

---

## 🔧 Convenções

| Item | Padrão |
|---|---|
| Branch principal | `main` — apenas releases estáveis |
| Branch de integração | `develop` |
| Branches de trabalho | `feature/<nome>` ou `fix/<nome>` a partir de `develop` |
| Commits | Conventional Commits em português |
| PRs | Build deve passar antes de abrir PR (`npm run build`) |

---

<div align="center">
  <sub>Parte do projeto <a href="https://github.com/mateus-vitor-ferreira-dev/tpes-2026-1-so-mais-um">Só+1</a> · Engenharia de Software · UFLA 2026/1</sub>
</div>
