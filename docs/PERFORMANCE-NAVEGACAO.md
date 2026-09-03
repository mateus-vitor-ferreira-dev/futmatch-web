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

**Não é a internet, e não é o banco.**

São duas coisas somadas: cada requisição à api custa ~230 ms, quase tudo
distância de rede — contra 28 ms até o front, da mesma máquina —, e cinco telas
do painel multiplicam isso por dois níveis em série, com a requisição mais cara
e mais lenta (`/places`, 600 ms) na frente e fora do cache.

## O que este documento ainda não tem

Registrado como furo, e não omitido:

- **Rotas autenticadas medidas uma a uma.** As da tabela são públicas. As de
  `/places/:id/turmas`, `/me/turmas` e afins exigem token, e a medição delas
  precisa de uma conta.
- **A coluna "api local".** É ela que separa "servidor lento" de "servidor
  longe": se local responder em milissegundos, os ~100 ms de servidor são do
  ambiente, não do código.
- **Cold start isolado.** A primeira requisição custa de 619 ms a 2.141 ms, mas
  isso é handshake somado a possível instância fria. Separar os dois exige
  medir depois de ociosidade longa e controlada.
