<div align="center">

# 🌐 Só+1 — Web App

### Descubra peladas perto de você, entre com um clique e sorteie os times na hora.

Frontend da plataforma **Só+1** — do rachão da várzea ao torneio organizado, tudo em um lugar. Interface para **três perfis** (Jogador, Admin e Dono de quadra), com notificações em **tempo real** e reputação entre jogadores.

<p>
  <a href="https://app.so-mais-um.com"><img src="https://img.shields.io/badge/▶_Abrir_o_app-app.so--mais--um.com-22C55E?style=for-the-badge&logo=googlechrome&logoColor=white" alt="App"/></a>
  <a href="https://so-mais-um.com"><img src="https://img.shields.io/badge/Landing-so--mais--um.com-3B82F6?style=for-the-badge&logo=vercel&logoColor=white" alt="Landing"/></a>
</p>

<p>
  <img src="https://github.com/mateus-vitor-ferreira-dev/so-mais-um-web/actions/workflows/ci-cd.yml/badge.svg" alt="CI/CD"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8"/>
  <img src="https://img.shields.io/badge/styled--components-DB7093?style=flat-square&logo=styled-components&logoColor=white" alt="Styled Components"/>
  <img src="https://img.shields.io/badge/deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

<sub>🟢 <strong>Em produção</strong> &nbsp;•&nbsp; 👥 <strong>3</strong> perfis (Jogador · Admin · Dono) &nbsp;•&nbsp; ✅ <strong>18</strong> requisitos funcionais &nbsp;•&nbsp; 🔔 tempo real (SSE)</sub>

<br/><br/>

![Só+1 Web App — navegação](docs/screenshots/app.webp)

<sub><i>Navegação real do app (login → descobrir → criar pelada → histórico), rodando localmente com dados de demonstração.</i></sub>

</div>

---

## 📋 Índice

- [Destaques de engenharia](#-destaques-de-engenharia)
- [Telas](#-telas)
- [Stack](#-stack)
- [Instalação local](#-instalação-local)
- [Rotas](#-rotas)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Requisitos cobertos](#-requisitos-cobertos)
- [Convenções](#-convenções)

---

## ✨ Destaques de engenharia

O que este frontend demonstra além de telas bonitas:

- 🔔 **Notificações em tempo real** — `EventSource`/SSE alimentando o sino de notificações, sem polling.
- 🔐 **Autenticação por papel** — JWT + Google OAuth, com **interceptors Axios** (injeção de token + **auto-logout em 401**) e **rotas protegidas por perfil** (Jogador · Admin · Owner) via `Suspense` + `PageLoader`.
- 🎲 **Regras de produto ricas** — sorteio de times, **sistema de reputação** (nota média, tags e reviews entre jogadores) e **chaveamento de torneios** (`TournamentBracket`).
- 🗺️ **Busca georreferenciada** — lista + **mapa Leaflet** de quadras em `/quero-jogar`, com filtros server-side por modalidade e localização.
- 🎨 **Tema claro/escuro** e SVGs responsivos ao tema, styled-components + transições GSAP.
- 🚀 **CI/CD** — GitHub Actions (lint + build) e deploy contínuo na Vercel (preview por PR, produção em `main`).

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
      <td><img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black"/> <img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white"/> <img src="https://img.shields.io/badge/styled--components-DB7093?style=flat-square&logo=styled-components&logoColor=white"/></td>
    </tr>
    <tr>
      <td><strong>Roteamento</strong></td>
      <td><img src="https://img.shields.io/badge/React_Router_v7-CA4245?style=flat-square&logo=react-router&logoColor=white"/> (proteção por papel)</td>
    </tr>
    <tr>
      <td><strong>Formulários</strong></td>
      <td><img src="https://img.shields.io/badge/react--hook--form-EC5990?style=flat-square&logo=react-hook-form&logoColor=white"/> <img src="https://img.shields.io/badge/Yup-222222?style=flat-square"/></td>
    </tr>
    <tr>
      <td><strong>HTTP / Tempo real</strong></td>
      <td><img src="https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white"/> (interceptors JWT + auto-logout 401) · <img src="https://img.shields.io/badge/SSE-EventSource-FF6C37?style=flat-square"/></td>
    </tr>
    <tr>
      <td><strong>Mapas</strong></td>
      <td><img src="https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white"/> (mapa de quadras)</td>
    </tr>
    <tr>
      <td><strong>Auth social</strong></td>
      <td><img src="https://img.shields.io/badge/Google_OAuth-4285F4?style=flat-square&logo=google&logoColor=white"/></td>
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
git clone https://github.com/mateus-vitor-ferreira-dev/so-mais-um-web.git
cd so-mais-um-web
npm install
cp .env.example .env      # defina VITE_API_URL e VITE_GOOGLE_CLIENT_ID
npm run dev               # http://localhost:5173
```

```ini
# .env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=<seu_google_client_id>
```

> A [API do Só+1](https://github.com/mateus-vitor-ferreira-dev/so-mais-um-api) precisa estar rodando (padrão `http://localhost:3000`).

---

## 🗺️ Rotas

### Públicas

| Rota | Descrição |
|---|---|
| `/` | Intro com animação GSAP |
| `/login` · `/register` | Login e cadastro |
| `/esqueci-senha` · `/redefinir-senha` | Fluxo de reset de senha |
| `/seja-parceiro` | Onboarding de OWNER via convite |

### Jogador autenticado (`PLAYER`)

| Rota | Descrição |
|---|---|
| `/home` | Dashboard principal |
| `/quero-jogar` | Buscar peladas (lista + mapa Leaflet) |
| `/criar-pelada` | Wizard de 3 etapas |
| `/minhas-peladas` | Jogos criados e participações + sorteio de times |
| `/pelada/:eventId` | Detalhe completo da pelada |
| `/historico` | Partidas finalizadas + avaliar jogadores |
| `/avaliacoes` | Reputação recebida (nota, tags, reviews) |
| `/torneios` | Campeonatos com chaveamento visual |
| `/perfil` | Editar dados e chave Pix |

### Admin (`/admin/*`) e Owner (`/owner/*`)

Dashboards e gestão dedicados — usuários/roles/convites e solicitações de parceria (Admin); locais, quadras e solicitações (Owner).

---

## 📁 Estrutura do projeto

```
src/
├── components/     # MainLayout (sidebar), EventCard, Map (Leaflet), NotificationBell (SSE)…
├── contexts/       # AuthContext (JWT + Google)
├── pages/          # Home, QueroJogar, CriarPelada, PeladaDetail, MinhasPeladas,
│                   # Historico, Avaliacoes, Tournaments, Admin/*, Owner/*
├── routes/         # index.jsx — rotas com proteção por papel + Suspense
├── services/       # api.js (Axios + interceptors), auth, events, courts, tournaments…
└── styles/         # theme.js (claro/escuro) + global.js
```

---

## ✅ Requisitos cobertos (18 RFs)

Cadastro/login (JWT + Google) · proteção de rotas por papel · criar/listar/filtrar/entrar em peladas · detalhe com vagas e valor · histórico · **sorteio de times** · **avaliação de jogadores** · gestão Admin · recuperação de senha · **notificações em tempo real (SSE)** · descadastro de marketing · **módulo de torneios** · gestão de Places/Courts (OWNER) · **portal de parceiros com convite por e-mail**.

<details>
<summary>Tabela completa (RF01–RF18)</summary>

| RF | Funcionalidade | RF | Funcionalidade |
|----|----------------|----|----------------|
| RF01 | Cadastro de usuário | RF10 | Avaliação de jogadores |
| RF02 | Login com JWT | RF11 | Gerenciamento Admin |
| RF03 | Proteção de rotas por papel | RF12 | Login com Google OAuth |
| RF04 | Criar pelada | RF13 | Recuperação de senha |
| RF05 | Listar e filtrar peladas | RF14 | Notificações em tempo real (SSE) |
| RF06 | Entrar em uma pelada | RF15 | Descadastro de marketing |
| RF07 | Detalhe com vagas e valor | RF16 | Módulo de Torneios |
| RF08 | Histórico de participações | RF17 | Gestão de Places/Courts (OWNER) |
| RF09 | Sorteio de times | RF18 | Portal de parceiros (convite e-mail) |

</details>

---

## 🔧 Convenções

`main` (produção) ← `develop` ← `feature/*` · `fix/*` · Conventional Commits (pt-BR) · build deve passar antes do PR.

---

<div align="center">
  <sub>Parte do produto <strong>Só+1</strong> · <a href="https://app.so-mais-um.com">app</a> · <a href="https://github.com/mateus-vitor-ferreira-dev/so-mais-um-api">API</a> · <a href="https://so-mais-um.com">landing</a> — Engenharia de Software, UFLA 2026/1</sub>
</div>
