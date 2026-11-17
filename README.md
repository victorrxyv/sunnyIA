# sunny.ia

Site (tema escuro, verde-menta) com uma IA acolhedora para conversar e desabafar. React + Vite no frontend, Node + Express no backend, Claude via API.

## Rodando

1. `npm install`
2. Copie `.env.example` para `.env` e coloque sua `ANTHROPIC_API_KEY`
3. `npm run dev` (site em http://localhost:5173, API em :3001)

Produção: `npm run build && npm start` (o Express serve a pasta `dist`).

## Como funciona

`POST /api/chat` valida a conversa, aplica rate limit, faz uma triagem de risco com o modelo leve, e responde em streaming com o modelo principal. Em caso de risco, mostra CVV 188 e SAMU 192 antes da resposta.

- `prompt.js`: personalidade e limites da Sunny
- `risk.js`: triagem de crise
- `App.jsx`: chat (sem histórico salvo, a conversa vive só na aba)

## Próximos passos

- Login opcional e histórico com opt-in (Supabase)
- Política de privacidade (LGPD) e botão de apagar conversas
- Limite diário de mensagens por pessoa
- Deploy (Vercel/Render) com a chave só em variável de ambiente

## Deploy na Vercel

O projeto já está pronto: `api/chat.js` é a função da Vercel (o `server.js` só é usado no `npm run dev` e em hospedagens com servidor, como Render ou Replit).

1. Suba o projeto para o GitHub (confira que o `.env` não foi junto).
2. Na Vercel, **Add New > Project**, importe o repositório. O preset Vite é detectado sozinho.
3. Em **Settings > Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` (obrigatória)
   - `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (rate limit: 20 mensagens por minuto e 200 por dia por IP; sem elas o limite fica desligado)
4. Faça o deploy. A cada commit no GitHub, ele atualiza sozinho.

## Estrutura

Tudo fica na raiz do repositório. A única pasta é `api/` (com `chat.js`), exigida pela Vercel. Ao subir para o GitHub, confira que `main.jsx`, `App.jsx`, `styles.css` e `index.html` estão na raiz e que `api/chat.js` está dentro da pasta `api`.
