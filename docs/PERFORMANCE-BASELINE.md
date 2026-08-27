# Linha de base de carregamento do web

Medição da issue #226, feita em 20/08/2026 sobre `develop` no commit
`ee23f71b56662071d131d440300960f9cd9895b3`, depois da remoção da intro e do
GSAP (#225). Esta linha de base mede; ela não inclui otimizações.

## Como reproduzir

- Node 22.23.2, Vite 8.0.12 e Chrome 138;
- build de produção com `npm run build -- --manifest`;
- três execuções do Lighthouse na raiz do `vite preview`;
- perfil mobile (412 x 823), CPU 4x mais lenta e rede simulada com RTT de 150 ms
  e download de 1.474,56 Kbit/s;
- tamanhos gzip calculados sobre os arquivos finais de `dist/assets`;
- dependências somadas pelo `renderedLength` dos módulos reportados pelo Rollup,
  antes da minificação. Esses números servem para comparar participação no
  bundle e não devem ser somados aos tamanhos finais dos chunks.

## Resultado da primeira tela útil

Foi usada a mediana das três execuções. A raiz sem sessão mostra a tela de
cadastro; o LCP representa o momento em que essa primeira tela está útil.

| Métrica | Mediana |
|---|---:|
| Performance | 91/100 |
| First Contentful Paint | 2,42 s |
| Largest Contentful Paint / tela útil | 3,08 s |
| Speed Index | 2,42 s |
| Time to Interactive | 3,08 s |
| Total Blocking Time | 3,5 ms |
| Cumulative Layout Shift | 0 |
| Transferência total da página | 354,65 KiB |
| JavaScript potencialmente não usado | 162,08 KiB |

Os três LCPs foram 3,08 s, 3,62 s e 3,04 s. A variação fica registrada para não
tratar uma única execução local como precisão absoluta.

## Peso do build

| Conjunto | Arquivos | Bruto | Gzip |
|---|---:|---:|---:|
| JavaScript total, incluindo rotas lazy | 71 | 1.100,67 KiB | 341,16 KiB |
| CSS total | 1 | 14,74 KiB | 6,22 KiB |
| Todos os assets do build, incluindo imagens | 86 | 2.099,71 KiB | 1.322,85 KiB |
| Entrada estática antes do chunk da rota | 7 | 417,55 KiB | 135,25 KiB |

Os dez maiores chunks JavaScript do build:

| Chunk | Bruto | Gzip |
|---|---:|---:|
| `index-BJY4d0Sg.js` | 333,33 KiB | 102,72 KiB |
| `components-BCUgPj3X.js` | 172,49 KiB | 50,73 KiB |
| `api-D1Tsc30f.js` | 77,13 KiB | 29,35 KiB |
| `index.esm-CzzEdDUg.js` | 41,40 KiB | 12,95 KiB |
| `Tournaments-DDjapzkA.js` | 37,89 KiB | 7,50 KiB |
| `PeladaDetail-DW2_wVFm.js` | 30,14 KiB | 7,86 KiB |
| `index.esm-B8hLbUPk.js` | 27,29 KiB | 9,89 KiB |
| `Equipment-C4XueRTB.js` | 19,42 KiB | 5,45 KiB |
| `Inventory-CisMt_VP.js` | 18,17 KiB | 5,29 KiB |
| `TournamentBracket-BA-Sb4fk.js` | 15,83 KiB | 4,50 KiB |

## Dez maiores dependências

Tamanho renderizado pelo Rollup antes da minificação:

| Dependência | Tamanho |
|---|---:|
| `react-dom` | 447,96 KiB |
| `leaflet` | 236,50 KiB |
| `react-router` | 89,01 KiB |
| `axios` | 83,57 KiB |
| `react-hook-form` | 65,78 KiB |
| `@tanstack/query-core` | 65,45 KiB |
| `yup` | 60,88 KiB |
| `sonner` | 50,52 KiB |
| `lucide-react` | 27,70 KiB |
| `styled-components` | 27,24 KiB |

## O que entra cedo demais

O `leaflet` não está lazy. Ele está dentro de `components-BCUgPj3X.js`, que a
tela de cadastro baixa na primeira navegação. A causa é o barrel
`src/components/index.ts`: `Register` importa três campos pelo barrel, e o mesmo
arquivo exporta `Map`, chaveamento, sorteio, placar e outros componentes de
rotas autenticadas. Na medição, esse chunk transferiu 51,13 KiB e o Lighthouse
classificou 39,09 KiB (77%) dele como não usados na primeira tela.

A consequência é maior que o mapa: a raiz também pediu chunks de torneio,
sorteio, requisitos e placar antes de o usuário autenticar. O `leaflet` deve ser
carregado somente nas telas que renderizam `Map`, e componentes de autenticação
devem usar imports diretos em vez do barrel amplo.

O script externo do Google Identity Services transferiu 96,30 KiB e respondeu
por 80,72 KiB do JavaScript potencialmente não usado. Ele oferece o login Google
na própria tela de autenticação, portanto removê-lo não é automático; vale medir
o impacto de carregá-lo após interação ou quando o botão entra na viewport.

O chunk principal transferiu 103,16 KiB e teve 42,28 KiB apontados como não
usados. Depois de separar o barrel, uma nova medição deve mostrar quanto desse
valor era consequência da árvore compartilhada e quanto pertence de fato aos
providers globais.

## Próximos passos

- ~~separar o barrel e deixar `Map`/Leaflet e componentes autenticados fora da
  primeira tela~~ — feito na #317; a comparação está em
  [`PERFORMANCE-317-SEM-BARREL.md`](PERFORMANCE-317-SEM-BARREL.md);
- ~~medir o carregamento sob demanda do Google Identity Services sem prejudicar
  o botão de login~~ — feito na #318; a comparação está em
  [`PERFORMANCE-318-GOOGLE-SOB-DEMANDA.md`](PERFORMANCE-318-GOOGLE-SOB-DEMANDA.md);
- repetir exatamente este procedimento após cada mudança e comparar LCP,
  transferência inicial e JavaScript não usado.
