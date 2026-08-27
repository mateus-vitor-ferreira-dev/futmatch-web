# Medição da #317 — o barrel de componentes fora da primeira tela

Comparação contra [`PERFORMANCE-BASELINE.md`](PERFORMANCE-BASELINE.md), feita em
27/08/2026 sobre `refactor/317-barrel-fora-da-primeira-tela`, tendo `develop` no
commit `6e15047` como o lado "antes".

## O que mudou no código

`src/components/index.ts` exportava dezoito componentes, e três telas
(`Register`, `ResetPassword`, `Profile`) importavam campos de formulário por
ele. Como o barrel entra inteiro, o Rollup criava um chunk compartilhado
`components-*.js` que a raiz sem sessão baixava antes de qualquer login.

As três telas passaram a importar cada componente pelo caminho dele, e o barrel
foi removido. Ninguém mais o importava.

## Como reproduzir

Mesmo procedimento da linha de base: build de produção com
`npm run build -- --manifest`, três execuções do Lighthouse na raiz do
`vite preview`, perfil mobile padrão (412 x 823, CPU 4x mais lenta, RTT de
150 ms, download de 1.474,56 Kbit/s), mediana das três.

**Uma diferença de ambiente:** a linha de base usou Chrome 138 e esta medição
usou Chrome 149. Por isso as duas colunas abaixo foram **medidas na mesma
sessão**, uma logo depois da outra, em vez de comparar com os números
publicados na linha de base. A coluna "antes" reproduziu a linha de base de
perto — 91/100, FCP 2,41 s, LCP 3,02 s contra os 91/100, 2,42 s e 3,08 s de
20/08 —, o que dá confiança de que a troca de Chrome não move o resultado.

## Primeira tela útil

| Métrica | Antes | Depois | Diferença |
|---|---:|---:|---:|
| Performance | 91/100 | 97/100 | +6 |
| First Contentful Paint | 2,41 s | 2,04 s | −0,38 s |
| Largest Contentful Paint | 3,02 s | 2,27 s | −0,75 s |
| Speed Index | 2,41 s | 2,04 s | −0,38 s |
| Total Blocking Time | 0 ms | 0 ms | — |
| Cumulative Layout Shift | 0 | 0 | — |
| Transferência total da página | 359,41 KiB | 285,27 KiB | −74,14 KiB |
| JavaScript potencialmente não usado | 163,81 KiB | 124,64 KiB | −39,17 KiB |
| Pedidos de rede | 35 | 21 | −14 |

Os três LCPs do "depois" foram 2,27 s, 3,62 s e 2,26 s. A execução do meio é
um ponto fora da curva de ambiente — nenhuma outra métrica dela se moveu — e
fica registrada em vez de descartada, como manda a linha de base.

## Peso do build

| Conjunto | Antes | Depois | Diferença |
|---|---:|---:|---:|
| Primeira tela, bruto | 753,97 KiB | 531,80 KiB | −222,17 KiB |
| Primeira tela, gzip | 242,90 KiB | 174,66 KiB | −68,24 KiB |
| Arquivos da primeira tela | 29 | 15 | −14 |
| JavaScript total do build, bruto | 1.138,64 KiB | 988,33 KiB | −150,31 KiB |
| JavaScript total do build, gzip | 351,78 KiB | 305,87 KiB | −45,91 KiB |

"Primeira tela" é o chunk de entrada mais tudo que ele importa estaticamente,
mais o chunk do `Register` e as importações estáticas dele — o conjunto que o
`.vite/manifest.json` mostra o browser baixando na raiz sem sessão.

O chunk `components-*.js` (172,63 KiB bruto / 50,57 KiB gzip) deixou de existir.
Os componentes que ele agrupava foram para os chunks das rotas que realmente os
usam: `Profile` foi de 22,36 para 32,86 KiB, `Tournaments` de 37,89 para
40,72 KiB. O total do build ainda cai porque nada é mais baixado duas vezes e
três componentes deixaram de ser empacotados (abaixo).

## O que saiu da raiz sem sessão

Estes chunks eram pedidos antes do login e não são mais:

`components-*.js` · `components-*.css` · `TournamentBracket` ·
`TournamentRegistrations` · `SorteioDeTimes` · `PartidasParaApitar` ·
`RequisitosDaPartida` · `StatCard` · `RoleBadge` · `events` · `teams` ·
`playerService` · `requisitos` · `flag` · `trash-2`.

O `components-*.css` era o `leaflet/dist/leaflet.css`, o único CSS que o build
emitia em arquivo — o resto do estilo é styled-components, injetado em tempo de
execução. Sem o Leaflet, o build não emite mais nenhum `.css`.

Duas fronteiras de chunk se moveram sem que nada saísse da rede: `PhoneInput` e
`PasswordInput` viraram chunks próprios, compartilhados pelas telas que os usam,
e o `AuthLayout` deixou de ter chunk próprio e passou a viajar dentro do
`styles-*.js` que as telas de autenticação já baixavam. Os dois continuam na
primeira tela, como devem: são o formulário e a moldura do login.

## Leaflet

O `leaflet` (236,50 KiB renderizados, a segunda maior dependência do projeto)
**saiu inteiro do build** — não mudou de chunk: sumiu.

A causa é mais forte do que a issue supunha. `Map` não é renderizado por
nenhuma página: o único lugar do projeto que o mencionava era o próprio barrel.
O mesmo vale para `EventCard` e `SearchFilters`. Os três componentes continuam
no repositório, agora sem nada os alcançando, e por isso fora do bundle.

Isso deixa duas pontas para outra issue, fora do escopo desta: apagar os três
componentes órfãos e tirar `leaflet`, `react-leaflet` e `@types/leaflet` do
`package.json` — ou, se o mapa vai voltar, reintroduzi-lo por `import()` na
tela que o mostrar.

## O que a linha de base perguntou e agora tem resposta

> Depois de separar o barrel, uma nova medição deve mostrar quanto desse valor
> era consequência da árvore compartilhada e quanto pertence de fato aos
> providers globais.

Nenhum. O JavaScript não usado do chunk principal foi de 42,28 KiB para
42,29 KiB: ele pertence todo aos providers globais, e não sobrava do barrel.

Dos 124,64 KiB de JavaScript não usado que restam na primeira tela, 82,35 KiB
são do script externo do Google Identity Services — que é a
[#318](https://github.com/mateus-vitor-ferreira-dev/so-mais-um-web/issues/318),
e agora responde por dois terços do que sobrou.

## O que impede a volta

`scripts/verifica-primeira-tela.mjs` percorre os imports estáticos a partir da
entrada e das telas sem sessão, parando em cada `import()` — que é onde o
bundler corta o chunk — e falha se o alcance incluir Leaflet, um componente de
rota autenticada ou um barrel amplo em `src/components`. Roda no CI logo depois
do `readme:check`, pelo `npm run primeira-tela:check`.

Foi conferido que ele reprova de verdade: restaurando o barrel e um import por
ele, a conferência acusa os três pontos.

Ele nasceu como teste de suíte e não ficou lá, por dois motivos que valem
registro. Ler os fontes com `import.meta.glob('?raw')` **mente na cobertura**:
o módulo que o Vite gera para cada `?raw` é uma linha executada, e o v8 a
mapeia de volta para o arquivo original — a suíte pulava de 61% para 74% de
linhas sem nenhum teste novo, e o README anuncia esse número. Ler com `node:fs`
exigiria `@types/node`, que é justamente o que o projeto evita para continuar
tipado só para o browser. Fora do pipeline do Vite, nenhum dos dois aparece.
