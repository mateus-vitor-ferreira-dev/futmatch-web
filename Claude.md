# Instruções para agentes de IA

## Idioma e comunicação

- Responda em português, salvo quando o usuário pedir outro idioma.
- Seja direto e informe claramente o que foi alterado, como foi validado e qualquer pendência.
- Não afirme que um comando passou sem tê-lo executado.

## Trabalho no repositório

- Antes de alterar código, entenda a estrutura e as convenções já usadas no projeto.
- Faça mudanças pequenas e focadas no pedido. Não refatore partes não relacionadas sem necessidade.
- Preserve alterações existentes do usuário e não reverta arquivos fora do escopo.
- Não inclua segredos, tokens, credenciais ou arquivos `.env` em commits.
- Ao mudar comportamento, crie ou atualize os testes correspondentes.

## Critério obrigatório antes de abrir MR/PR

Antes de abrir ou declarar uma MR/PR pronta, execute, nesta ordem:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

- Todos os comandos precisam terminar com sucesso.
- Se algum falhar, investigue e corrija a causa antes de abrir a MR/PR.
- Não ignore, desative ou enfraqueça lint, tipos ou testes apenas para deixar o pipeline verde.
- Se não for possível corrigir uma falha, não abra a MR/PR: descreva o erro, o que foi tentado e o bloqueio.
- Se um comando não puder ser executado por limitação do ambiente, informe isso explicitamente; não presuma sucesso.

## Entrega

- Resuma os arquivos e comportamentos alterados.
- Liste as validações executadas e seus resultados.
- Aponte riscos ou passos manuais restantes, quando houver.
