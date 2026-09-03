# Navegação autenticada — o que está lento

Medição da issue [#403](https://github.com/mateus-vitor-ferreira-dev/so-mais-um-web/issues/403),
feita em 03/09/2026 contra a api em produção no commit `0bde6b0` (o `/health`
publica o commit, e é assim que se confere contra o que foi medido).

Os três documentos anteriores — [`PERFORMANCE-BASELINE.md`](PERFORMANCE-BASELINE.md),
[`#317`](PERFORMANCE-317-SEM-BARREL.md) e [`#318`](PERFORMANCE-318-GOOGLE-SOB-DEMANDA.md)
— medem **carregamento da tela pública**. Este mede outra coisa: **o custo de
cada requisição depois da sessão aberta**, que é o que se sente ao trocar de
tela dentro do painel.

Como os outros, **este documento mede; ele não otimiza.**

## Como reproduzir

- `curl` com **várias URLs na mesma invocação**, que é o que reaproveita a
  conexão TCP/TLS — sem isso todo número vira handshake e não navegação;
- 10 requisições por rota; a **primeira** fica separada porque paga o handshake,
  e a mediana e o p95 saem das outras nove;
- `%{time_starttransfer}` como tempo até o primeiro byte;
- rede doméstica em Lavras/MG, 03/09/2026, ~15h35 BRT.

```bash
args=""; for i in $(seq 1 10); do args="$args -o /dev/null https://api.so-mais-um.com/health"; done
curl -s -w "%{time_starttransfer}\n" $args
```

## O piso: 230 ms por requisição, e ele não é o banco

| Rota | 1ª (com handshake) | Mediana quente | p95 | Corpo |
|---|---:|---:|---:|---:|
| `/health` — não toca o banco | 791 ms | **230 ms** | 242 ms | 0,1 KiB |
| `/stats` — consulta agregada | 619 ms | **228 ms** | 234 ms | 0,1 KiB |
| `/review-tags` | 679 ms | 229 ms | 235 ms | 0,6 KiB |
| `/sports` | 631 ms | 226 ms | 231 ms | 2,6 KiB |
| `/tournament-formats` | 745 ms | 231 ms | 361 ms | 0,7 KiB |
| `/places` | 2.141 ms | **600 ms** | 633 ms | 0,0 KiB (lista vazia) |

**A linha que mata a hipótese do banco é a segunda.** O `/health` devolve um
objeto fixo sem tocar no Postgres. O `/stats` faz consulta agregada. Os dois
custam **o mesmo**, dentro do ruído. Se o banco fosse o gargalo, essas duas
linhas não poderiam empatar.

Decompondo uma requisição fria: DNS 139 ms · handshake TCP +133 ms · TLS
+147 ms · resposta +257 ms. O handshake TCP de 133 ms é **um RTT**. Numa conexão
já aberta sobram, então, ~130 ms de rede e ~100 ms de servidor.

## E não é a internet de quem reclamou

Mesma máquina, mesma rede, mesmo minuto:

| Destino | Mediana quente |
|---|---:|
| `app.so-mais-um.com` (front, Vercel) | **28 ms** |
| `api.so-mais-um.com` (api, Railway) | **230 ms** |

**Oito vezes.** O front sai de um edge perto; a api responde de outro lugar. A
conexão do usuário está bem — o que está longe é a api.

> Isto responde a pergunta que originou a issue, mas não a fecha: 230 ms por
> requisição só vira "o site está lento" quando a tela faz várias em série. É a
> seção seguinte.

## O multiplicador: a cascata do `placeId`

Cinco telas do painel do dono chamam `placesService.list()` **antes de qualquer
outra coisa**, para descobrir qual espaço mostrar:

`Turmas` · `Professores` · `Equipment` · `Inventory` · `Places`

E o padrão é sempre o mesmo:

```
placesService.list()        ← 1 requisição, sozinha
        ↓ só depois que ela volta é que existe placeId
Promise.all([ ... ])        ← as outras, em paralelo
```

Duas consequências, e a segunda é pior que a primeira.

**1. Todo carregamento paga dois níveis em série.** Em `Turmas` são
`placesService.list()` e depois `turmas` + `membros` + `quadras` em paralelo:
600 ms + 230 ms ≈ **830 ms** de rede antes de a tela ter conteúdo, e isso com
tudo funcionando.

**2. O primeiro nível não passa pelo cache.** O `queryClient` tem
`staleTime: 60_000` — o segundo nível é reaproveitado ao voltar para a tela
dentro de um minuto. Mas o `placesService.list()` mora num `useEffect` com
`useState`, **fora do react-query**, então ele é refeito **toda vez, em toda
tela, sem exceção**. É a requisição mais cara da api e a única que nunca é
cacheada.

E ela busca **todos** os espaços da plataforma para o cliente filtrar o dono em
JavaScript:

```ts
const meus = user?.role === 'ADMIN'
  ? resposta.data.data
  : resposta.data.data.filter((espaco) => espaco.ownerId === user?.id)
```

Hoje isso é barato porque produção tem zero espaço cadastrado — a lista volta
com 26 bytes. O `findAll()` do repositório não tem filtro, não tem paginação,
inclui o dono e conta as quadras de cada um. **O custo dessa rota cresce com a
plataforma inteira, e não com o tamanho de quem está olhando.**

## Requisições por tela do painel

| Tela | Nível 1 | Nível 2 | Níveis em série |
|---|---|---|---|
| Turmas | `places.list` | `turmas` · `membros` · `quadras` | 2 |
| Professores | `places.list` | 1 consulta | 2 |
| Equipment | `places.list` | `listItems` · `listLoans` · `listPartidas` | 2 |
| Inventory | `places.list` | (2 efeitos) | 2 |
| Places | `places.list` | — | 1 |
| Dashboard | `getStatus` · `getStats` em paralelo | — | 1 |
| Alunos | `turmas` · `matriculas` em paralelo | — | 1 |
| Chamada | `aulas` | `chamada` (depois de escolher a aula) | 1 + ação |
| Mensalidades | 1 consulta | — | 1 |

O `Dashboard` é o contraexemplo útil: ele já faz `Promise.all` de tudo que
precisa, num nível só. É o que as cinco de cima não fazem.

## Resposta à pergunta da issue

**Não é a internet, não é o banco e não é o código.**

Três medições sustentam cada negativa:

- **A internet está bem.** Da mesma máquina e no mesmo minuto, o front na Vercel
  responde em 28 ms e a api em 230 ms.
- **O banco não pesa.** O `/health`, que não o toca, e o `/stats`, que faz
  consulta agregada, empatam.
- **O código não pesa.** As mesmas rotas rodando local custam de 0,2 ms a
  3,2 ms — três ordens de grandeza abaixo.

O que sobra é **ambiente somado a arquitetura de tela**: ~230 ms por requisição
que não vêm do nosso código, multiplicados por dois níveis em série em cinco
telas do painel, com a requisição mais lenta (`/places`, 595 ms) na frente e
fora do cache.

## A api local, e o que ela prova

Mesma máquina, mesmo código, banco local. `npm run dev` na `develop` em
`bd1ba00`, medido do mesmo jeito.

| Rota | Local | Produção | Razão |
|---|---:|---:|---:|
| `/health` | **0,5 ms** | 230 ms | 460× |
| `/stats` | **0,4 ms** | 228 ms | 570× |
| `/sports` | **0,2 ms** | 226 ms | 1.130× |
| `/places` | **2,3 ms** | 595 ms | 259× |

E as autenticadas, que só dá para medir com token:

| Rota (local) | Mediana | p95 |
|---|---:|---:|
| `/places` — com **34 espaços** no banco | 1,6 ms | 1,8 ms |
| `/places/:id/turmas` | 3,0 ms | 5,2 ms |
| `/places/:id/members` | 3,2 ms | 4,2 ms |
| `/places/:id/courts` | 1,9 ms | 2,5 ms |

**O código não é o gargalo, e a diferença é de três ordens de grandeza.** O
`/places` local, devolvendo 34 espaços com dono e contagem de quadras, custa
2,3 ms. O mesmo `/places` em produção, devolvendo **zero**, custa 595 ms.

Isso reposiciona a rota mais lenta: ela não é lenta por causa da consulta. A
consulta é o que menos pesa nela.

## O que sobra sem explicação

**`/places` custa 2,6× o `/health` em produção, e não deveria.** Os dois
devolvem praticamente nada — 26 bytes contra 84 —, os dois passam pelo mesmo
proxy, e localmente a diferença entre eles é de 1,8 ms. Em produção é de 365 ms,
reprodutível em duas rodadas separadas (600 ms e 595 ms de mediana).

Não tenho a causa, e **inventar uma aqui seria pior que a lacuna** — fica
registrada como pergunta aberta para quem tiver acesso ao painel do Railway e do
Neon.

**O que dá para descartar:** não é volume de dados (zero linhas), não é a
consulta (2,3 ms local com 34 linhas) e não é instância fria, pela seção
seguinte.

## Cold start: não há sinal dele

A primeira requisição de cada série custa entre 619 ms e 989 ms, e é tentador
ler isso como instância dormindo. A decomposição não sustenta:

| Etapa | Custo |
|---|---:|
| DNS | 139 ms |
| Handshake TCP | +133 ms |
| TLS | +147 ms |
| Resposta | +257 ms |
| **Total frio** | **676 ms** |

Os 419 ms de handshake explicam a diferença para os 230 ms quentes por conta
própria, e o tempo de resposta da primeira (257 ms) é o mesmo das seguintes.
**Se a instância estivesse dormindo, essa última linha seria de segundos.**

## O que este documento ainda não tem

- **As mesmas rotas autenticadas medidas em produção.** As da tabela acima são
  locais; medir as de produção exige uma conta com espaço cadastrado, e hoje
  produção tem zero.
- **A causa dos 365 ms extras do `/places`**, registrada acima como pergunta
  aberta.

## Nota sobre o ambiente local

A medição local só rodou depois de descobrir que **o banco de desenvolvimento
estava 12 migrations atrás**, desde 28/08 — sem `PlaceMember`, sem `Turma`, sem
`Aula`, sem `Matricula`, sem `Mensalidade`, sem expediente.

O sintoma não foi um erro de partida: a api **sobe normalmente** e só quebra em
tempo de requisição, com `P2021 — The table public.PlaceMember does not exist`,
devolvendo **500** em três das rotas medidas. Corrigido com
`npx prisma migrate deploy`, que só aplica o pendente e não reseta nada.

Fica registrado porque é o mesmo formato do incidente que o manual da equipe
conta sobre o `OwnerInvite`: schema e banco divergem em silêncio, e a
divergência só aparece quando alguém tropeça nela.
