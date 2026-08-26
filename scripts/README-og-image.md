# A imagem de prévia do link (`public/og-image.png`)

É o cartão que aparece quando um link do app é colado no WhatsApp, no Telegram
ou no Slack. Ela é **a mesma para todas as partidas** — o que muda por partida é o
título e a descrição, que o `api/partida.js` monta na hora.

Por que não é a `logo.svg` direto: rastreador de mensageiro não renderiza SVG.
O `og:image` precisa ser PNG ou JPEG, e o formato esperado é 1200×630.

Por que o fundo é escuro: o "1" da marca é branco. Sobre o verde claro do app
ele quase some; sobre o verde escuro ele é a parte que mais salta.

## Como gerar de novo

O `og-image.html` é a fonte. Renderize com Chromium headless, do mesmo jeito
que o repositório de marketing já faz:

```bash
chromium --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --screenshot=public/og-image.png --window-size=1200,630 \
  "file://$PWD/scripts/og-image.html"
```

Não há dependência de build nisso: o PNG é versionado, e este passo só roda
quando a marca ou a frase mudarem.
