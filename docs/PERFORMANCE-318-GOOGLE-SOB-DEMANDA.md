# Medição da #318 — o Google Identity Services sob demanda

Comparação contra [`PERFORMANCE-BASELINE.md`](PERFORMANCE-BASELINE.md), feita em
27/08/2026 sobre `perf/318-google-identity-sob-demanda`, tendo `develop` já com
a [#317](PERFORMANCE-317-SEM-BARREL.md) como o lado "antes".

## O que mudou no código

O `GoogleOAuthProvider` do `@react-oauth/google` injeta
`https://accounts.google.com/gsi/client` no `useEffect` de montagem, sem
condição. Ele morava no `App`, ou seja, no casco do aplicativo: o script era
baixado em **toda** rota, inclusive nas autenticadas, onde não existe botão do
Google em lugar nenhum.

O provider desceu para `src/components/LoginComGoogle`, que só é renderizado
pelas telas de autenticação e só monta o provider depois de um sinal de
intenção sobre o botão — `pointerenter`, `focus` ou `pointerdown`.

## Como reproduzir

Mesmo procedimento da linha de base: build de produção com
`npm run build -- --manifest`, três execuções do Lighthouse na raiz do
`vite preview`, perfil mobile padrão (412 x 823, CPU 4x mais lenta, RTT de
150 ms, download de 1.474,56 Kbit/s), mediana das três. Chrome 149.

O Lighthouse não interage com a página, então a coluna "depois" mede
exatamente o caso de quem abre a tela e não vai usar o Google.

## Primeira tela útil

| Métrica | Antes | Depois | Diferença |
|---|---:|---:|---:|
| Transferência total da página | 285,27 KiB | **187,00 KiB** | −98,27 KiB |
| JavaScript potencialmente não usado | 124,74 KiB | **42,25 KiB** | −82,49 KiB |
| Requisições de rede | 21 | **20** | −1 |
| Requisições a `accounts.google.com` | 1 | **0** | −1 |
| Performance | 97/100 | 96/100 | −1 |
| First Contentful Paint (simulado) | 2,03 s | 2,11 s | +0,08 s |
| Largest Contentful Paint (simulado) | 2,26 s | 2,41 s | +0,15 s |
| First / Largest Contentful Paint (observado) | 374 ms | 375 ms | +1 ms |

O JavaScript não usado caiu para um terço. Dos 124,74 KiB de antes, 82,35 KiB
eram o próprio script do Google — era o maior item isolado da lista desde a
linha de base da #226, e some inteiro para quem não clica no botão.

## Sobre os 150 ms de LCP

A tabela acima mostra o LCP **simulado** subindo 150 ms enquanto o LCP
**observado** fica onde estava (374 → 375 ms). Isso não é o script: é um degrau
do simulador do Lighthouse em função do tamanho do chunk do `Register`, que
cresceu 1,3 KiB com o componente novo.

Foi conferido com um experimento de controle. Sobre o `develop` **sem nenhuma
mudança de arquitetura**, foram acrescentados 1,9 KB de texto inerte e
incompressível ao chunk do `Register` — um `<div hidden>` com uma string:

| | LCP simulado | FCP simulado |
|---|---:|---:|
| `develop` | 2.263 ms | 2.033 ms |
| `develop` + 1,9 KB inertes no `Register` | 2.413 ms | 2.108 ms |
| esta branch | 2.414 ms | 2.109 ms |

O enchimento reproduz o número da branch quase exatamente. O degrau é de uma
volta de rede (os 150 ms de RTT da simulação) e dispara em algum limiar entre
4,2 e 5,2 KiB transferidos naquele chunk — vale para qualquer quilobyte que
entre ali, venha ele de onde vier. Medições repetidas do `develop` na mesma
sessão bateram 2.263 e 2.264 ms, então não é ruído.

Registrado por honestidade, não como vitória: o número que o Lighthouse publica
piorou. O que não piorou foi o carregamento de verdade — 98 KiB a menos na
rede, tempo de pintura observado idêntico.

## Estratégias comparadas

A issue pediu para comparar a carga atual com uma carga por interação ou por
entrada do botão na viewport. As três foram medidas, e uma quarta apareceu no
caminho.

| Estratégia | Transferência | JS não usado | Requisições | LCP simulado |
|---|---:|---:|---:|---:|
| **Hoje** — provider no `App` | 285,27 KiB | 124,74 KiB | 21 | 2.263 ms |
| **Viewport** — provider na tela, script na primeira pintura | 285,89 KiB | 124,51 KiB | 21 | 2.413 ms |
| **Interação** — script no primeiro sinal de intenção ✅ | 187,00 KiB | 42,25 KiB | 20 | 2.414 ms |
| **Interação + chunk próprio** — o lado do GIS por `import()` | 187,98 KiB | 42,28 KiB | 22 | 2.565 ms |

**Viewport não serve.** O botão fica acima da dobra na tela de cadastro, então
"entrar na viewport" acontece na primeira pintura: o script desce igual, e a
transferência não muda. A estratégia só teria valor para um botão abaixo da
dobra — e mesmo o ganho que ela traria em rota autenticada já vem de graça de
mover o provider para dentro do componente.

**Chunk próprio saiu pior, contra a intuição.** Separar o lado que importa o
`@react-oauth/google` num `import()` deveria tirar também a biblioteca da
primeira tela. Só que o botão e os estilos são usados dos dois lados do corte, e
o Rollup extraiu esses pedaços em **dois chunks compartilhados a mais** — 22
requisições em vez de 20, e 1 KiB a mais na rede. A biblioteca é pequena
(1,3 KiB transferidos, junto com o componente); o script externo, que é o que
pesa, já sai sem precisar do split.

**Interação foi a escolha.** É a única que muda a ordem de grandeza.

## A decisão, e o que ela custa

O script passa a descer no primeiro entre `pointerenter`, `focus` e
`pointerdown` do botão. Os três existem para cobrir mouse, teclado e toque; o
`pointerdown` é o que salva o toque, porque chega antes do `click`.

O risco desta escolha é o clique que chega antes do script — teclado, rede
ruim. O pedido fica pendente e dispara sozinho quando o script chega, e aí o
popup do Google nasce de um gesto que já passou: **o browser pode bloqueá-lo.**
O GIS avisa quando isso acontece (`popup_failed_to_open`, pelo
`onNonOAuthError`) e o botão pede o segundo clique, em vez de deixar a pessoa
olhando para um botão que não fez nada.

Esse "não fez nada" era, aliás, o comportamento anterior em caso de script
bloqueado: `useGoogleLogin` devolve uma função que chama
`clientRef.current?.requestAccessToken()`, e sem script `clientRef.current` é
`undefined` — o clique não fazia efeito nenhum e nada era dito. Agora a falha
de carga tem estado próprio: o botão sai do ar dizendo "Google indisponível —
use seu e-mail", e o formulário de e-mail continua inteiro.

## O que impede a volta

`scripts/verifica-primeira-tela.mjs` ganhou uma regra: `@react-oauth/google`
pode ser alcançado pelas telas de autenticação, mas **não pela entrada estática
do app**. É o que barra o provider voltar para o casco, que é a forma como o
problema nasceu. Conferido que reprova, devolvendo o import ao `App.tsx`.

A cobertura está em `src/components/LoginComGoogle/index.test.tsx` e no bloco
"Login — com o Google" de `src/pages/Register/index.test.tsx`: o script não
desce sem intenção, desce no mouse, no foco e no toque, é pedido uma vez só, o
token chega à API, o cadastro pela mesma porta funciona, e script bloqueado não
impede o login por e-mail.
