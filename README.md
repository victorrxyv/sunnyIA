# sunny.ia

Site (tema escuro, verde-menta) com uma IA acolhedora para conversar e desabafar. React + Vite no frontend, Node no backend, Gemini (Google) como modelo, com plano gratuito.

## Rodando local

1. `npm install`
2. Copie `.env.example` para `.env` e coloque sua `GEMINI_API_KEY` (grátis em aistudio.google.com/apikey)
3. `npm run dev` (site em http://localhost:5173, API em :3001)

## Como funciona

`POST /api/chat` valida a conversa, aplica rate limit, faz a triagem de risco (palavras-chave + modelo leve) e responde em streaming. Em caso de risco, mostra CVV 188 e SAMU 192 antes da resposta.

- `prompt.js`: personalidade e limites da Sunny
- `risk.js`: triagem de crise
- `gemini.js`: chamadas à API do Gemini
- `App.jsx`: chat (sem histórico salvo)
- `api/chat.js`: função da Vercel. `server.js` é usado só no `npm run dev`

## Deploy na Vercel

1. Suba o projeto para o GitHub (sem o `.env`).
2. Na Vercel, importe o repositório (preset Vite).
3. Em **Settings > Environment Variables**, adicione `GEMINI_API_KEY` (obrigatória) e, opcionalmente, `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (limite de 6 mensagens por minuto e 100 por dia por IP).
4. Faça um **Redeploy** depois de salvar as variáveis.

## Atenção

- No plano gratuito do Gemini, o Google pode usar o conteúdo enviado para melhorar seus produtos. Avise isso aos usuários numa política de privacidade.
- O limite gratuito vale para o projeto inteiro. Com muita gente usando, as respostas falham e vale migrar para um plano pago.
- Tudo na raiz do repositório. A única pasta é `api/` (com `chat.js`).
