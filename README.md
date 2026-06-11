# ⚽ FutMatch Web

![CI](https://github.com/mateus-vitor-ferreira-dev/futmatch-web/actions/workflows/ci-cd.yml/badge.svg)

Interface web do **FutMatch** — plataforma para organização de peladas amadoras.

**App:** https://futmatch-web.vercel.app  
**API:** https://futmatch-api-production.up.railway.app

## Stack

- **React 19** + **Vite 8**
- **styled-components** (tema centralizado com ThemeProvider)
- **React Router v7** (rotas protegidas por papel)
- **react-hook-form** + **Yup** (formulários)
- **Axios** (HTTP + interceptors JWT)
- **Lucide React** (ícones)
- **Leaflet** (mapa de quadras em `/quero-jogar`)
- **GSAP** (animação de intro)
- **Google OAuth** (`@react-oauth/google`)

## Pré-requisitos

- **Node.js 20+** — https://nodejs.org
- **FutMatch API** rodando em `http://localhost:3000`

## Instalação e configuração

```bash
# 1. Clonar
git clone https://github.com/mateus-vitor-ferreira-dev/futmatch-web.git
cd futmatch-web

# 2. Instalar dependências
npm install

# 3. Criar .env
```

Conteúdo do `.env`:

```ini
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=<seu_google_client_id>
```

```bash
# 4. Iniciar em desenvolvimento
npm run dev
```

Interface disponível em `http://localhost:5173`

## Scripts

```bash
npm run dev      # Desenvolvimento com HMR
npm run build    # Build de produção (output: dist/)
npm run preview  # Preview do build local
```

## Rotas

### Públicas
| Rota | Descrição |
|---|---|
| `/` | Intro com animação GSAP |
| `/login` | Login / Cadastro |
| `/register` | Cadastro direto |
| `/esqueci-senha` | Solicitar reset de senha |
| `/redefinir-senha` | Redefinir senha com token |

### Jogador autenticado (PLAYER)
| Rota | Descrição |
|---|---|
| `/home` | Dashboard principal |
| `/perfil` | Perfil — editar dados e chave PIX |
| `/quero-jogar` | Buscar peladas (lista + mapa Leaflet) |
| `/criar-pelada` | Wizard 3 etapas para criar pelada |
| `/minhas-peladas` | Jogos criados e participações + **sorteio de times** |
| `/historico` | Partidas finalizadas + **avaliar jogadores** |
| `/avaliacoes` | Reputação recebida — nota média, tags e reviews |
| `/torneios` | Campeonatos com chaveamento visual |

### Admin (`/admin`)
| Rota | Descrição |
|---|---|
| `/admin/dashboard` | Visão geral |
| `/admin/users` | Gestão de usuários e papéis |
| `/admin/requests` | Solicitações de parceria |
| `/admin/places` | Gestão de locais |

### Owner (`/owner`)
| Rota | Descrição |
|---|---|
| `/owner/dashboard` | Dashboard do proprietário |
| `/owner/places` | Gerenciar próprios locais |
| `/owner/requests` | Ver solicitações do local |

## Estrutura do projeto

```
src/
├── assets/
│   └── sports/         # Imagens das 11 modalidades
├── components/
│   ├── MainLayout/     # Sidebar + navegação responsiva
│   ├── AuthLayout/     # Layout de autenticação
│   ├── EventCard/      # Card de pelada reutilizável
│   ├── Map/            # Mapa Leaflet com marcadores
│   ├── SportSelect/    # Seletor de modalidades com imagens
│   ├── RoleBadge/      # Badge de papel (PLAYER/OWNER/ADMIN)
│   ├── PasswordInput/  # Input com toggle de visibilidade
│   └── PhoneInput/     # Input com máscara de telefone
├── config/
│   └── env.js          # Variáveis de ambiente validadas
├── contexts/
│   └── AuthContext.jsx # Estado global de autenticação (JWT + Google)
├── hooks/
│   ├── useCountries.js
│   └── useSports.js
├── pages/
│   ├── Auth/           # Intro, Register, ForgotPassword, ResetPassword
│   ├── Home/           # Dashboard principal
│   ├── Profile/        # Perfil do jogador
│   ├── QueroJogar/     # Busca de peladas (lista + mapa)
│   ├── CriarPelada/    # Wizard de criação (3 etapas)
│   ├── MinhasPeladas/  # Meus jogos + modal de sorteio
│   ├── Historico/      # Histórico + modal de avaliação
│   ├── Avaliacoes/     # Reputação recebida
│   ├── Tournaments/    # Campeonatos
│   ├── Admin/          # Dashboard, Users, Requests, Places
│   └── Owner/          # Dashboard, Places, Requests
├── routes/
│   └── index.jsx       # Rotas com proteção por papel
├── services/
│   ├── api.js          # Axios com interceptors JWT (auto-logout em 401)
│   ├── playerService.js # Todas as chamadas de peladas, sorteio, reviews
│   ├── auth.js         # Login, registro, Google OAuth
│   ├── events.js       # Eventos públicos
│   ├── courts.js       # Quadras
│   ├── places.js       # Locais
│   ├── users.js        # Usuários
│   └── tournaments.js  # Campeonatos
└── styles/
    ├── theme.js        # Tema (cores, espaçamentos, tipografia)
    └── global.js       # Estilos globais
```

## Status dos requisitos funcionais (MVP)

| RF | Funcionalidade | Status |
|---|---|---|
| RF01 | Cadastro de usuário | ✅ |
| RF02 | Login com JWT | ✅ |
| RF03 | Proteção de rotas por papel | ✅ |
| RF04 | Criar pelada | ✅ |
| RF05 | Listar + filtrar peladas | ✅ |
| RF06 | Entrar em uma pelada | ✅ |
| RF07 | Detalhe com vagas/valor | ✅ |
| RF08 | Histórico de participações | ✅ |
| RF09 | Sorteio de times | ✅ |
| RF10 | Avaliação de jogadores | ✅ |
| RF11 | Gerenciamento admin | ✅ |

## Fluxo de branches (Git)

```
main        ← releases estáveis
develop     ← integração
feat/<nome> ← desenvolvimento
fix/<nome>  ← correções
```

## Convenção de commits (português)

```
feat: adiciona página de avaliações recebidas
fix: corrige mapeamento de tags no modal de avaliação
style: ajusta espaçamento do card de pelada
refactor: extrai componente DrawModal
docs: atualiza README com rotas atuais
```

## Regras

- Não commitar `.env`
- Sempre usar branch
- Build deve passar antes de abrir PR (`npm run build`)
