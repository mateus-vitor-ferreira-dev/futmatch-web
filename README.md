<div align="center">

# ⚽ Só+1 — Web App

### Encontre peladas abertas, entre com um clique e sorteie os times na hora.

**SaaS para organizar futebol amador** — do rachão da várzea ao torneio, sem grupo de WhatsApp. Web app para **jogadores, donos de quadra e admins**, com notificações em tempo real e reputação entre jogadores.

<p>
  <a href="https://app.so-mais-um.com"><img src="https://img.shields.io/badge/▶_Abrir_o_app-app.so--mais--um.com-22C55E?style=for-the-badge&logo=googlechrome&logoColor=white" alt="App"/></a>
  <a href="https://so-mais-um.com"><img src="https://img.shields.io/badge/Site-so--mais--um.com-3B82F6?style=for-the-badge&logo=vercel&logoColor=white" alt="Site"/></a>
</p>

<p>
  <img src="https://github.com/mateus-vitor-ferreira-dev/so-mais-um-web/actions/workflows/ci-cd.yml/badge.svg" alt="CI/CD"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8"/>
  <img src="https://img.shields.io/badge/styled--components-DB7093?style=flat-square&logo=styled-components&logoColor=white" alt="styled-components"/>
  <img src="https://img.shields.io/badge/deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

<sub>🟢 <strong>Em produção</strong> &nbsp;•&nbsp; 🚧 evoluindo como SaaS &nbsp;•&nbsp; 👥 <strong>3</strong> perfis &nbsp;•&nbsp; 🔔 tempo real (SSE)</sub>

<br/><br/>

![Só+1 Web App — navegação](docs/screenshots/app.webp)

</div>

---

## 💡 O produto

Organizar pelada hoje é um caos: grupos de WhatsApp sem controle de vagas, times definidos na hora e nenhum histórico. O **Só+1** cobre o ciclo completo — **descobrir → entrar → jogar → avaliar** — e conecta três lados do mercado:

- 🎮 **Jogador** — encontra e entra em peladas, sorteia times, constrói reputação.
- 🏟️ **Dono de quadra** — cadastra espaços, recebe reservas e assina o plano.
- 🛠️ **Admin** — modera a plataforma, usuários e parcerias.

## ✨ Funcionalidades

🔎 Descobrir peladas por perto (lista **+ mapa**) · ➕ criar pelada em wizard e gerenciar vagas · 🎲 **sorteio equilibrado de times** · ⭐ **reputação** (notas, tags e badges) · 🏆 **torneios com chaveamento** · 🔔 **notificações em tempo real** · 🔐 login com e-mail ou Google.

## 🛠️ Destaques técnicos

- 🔔 **Tempo real com SSE** (`EventSource`) alimentando o sino de notificações — sem polling.
- 🔐 **Autenticação por papel** — JWT + Google OAuth, **interceptors Axios** (token + **auto-logout em 401**) e rotas protegidas por perfil (Jogador · Dono · Admin).
- 🗺️ **Busca georreferenciada** — lista + **mapa Leaflet**, com filtros server-side por modalidade e localização.
- 🎨 **Tema claro/escuro**, styled-components e transições GSAP.
- 🚀 **CI/CD** — GitHub Actions + deploy contínuo na Vercel (preview por PR).

## 📸 Telas

<div align="center">

**Descubra peladas abertas perto de você e entre com um clique**

![Home](docs/screenshots/home.png)

</div>

|  Quero Jogar  |  Criar Pelada  |
| :-----------: | :------------: |
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

## 🧱 Stack

**React 19** · **Vite 8** · **styled-components** · React Router v7 (proteção por papel) · react-hook-form + Yup · **Axios** (interceptors JWT) · **Leaflet** · **SSE** · Google OAuth · **Vercel**

## 🚀 Rodando localmente

```bash
git clone https://github.com/mateus-vitor-ferreira-dev/so-mais-um-web.git
cd so-mais-um-web && npm install
cp .env.example .env        # VITE_API_URL + VITE_GOOGLE_CLIENT_ID
npm run dev                 # http://localhost:5173
```

> Requer a [API do Só+1](https://github.com/mateus-vitor-ferreira-dev/so-mais-um-api) rodando.

---

<div align="center">
<sub><strong>Só+1</strong> · <a href="https://app.so-mais-um.com">app</a> · <a href="https://github.com/mateus-vitor-ferreira-dev/so-mais-um-api">API</a> · <a href="https://so-mais-um.com">landing</a></sub>
</div>
