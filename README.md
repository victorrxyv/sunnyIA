# sunny.ia — React + Vite

Site (tema escuro, verde-menta) com uma IA acolhedora para conversar e desabafar. React + Vite com React Router DOM no frontend, Node no backend e Gemini (Google) como modelo, com plano gratuito.

## Estrutura

```
api/
 └── chat.js                        → Função da Vercel (POST /api/chat)
server/
 ├── server.js                      → API local para o npm run dev
 ├── gemini.js                      → Chamadas à API do Gemini
 ├── prompt.js                      → Personalidade e limites da Sunny
 ├── risk.js                        → Triagem de crise
 └── messages.js                    → Validação das mensagens
public/img/sunny/                   → icon.png (favicon e logo) e bot.png
src/
 ├── components/
 │   ├── Composer.jsx / .css        → Campo de mensagem do chat
 │   ├── Header.jsx / .css          → Topo da tela inicial
 │   └── Robot.jsx / .css           → Ícone da Sunny (logo e avatar)
 ├── pages/
 │   ├── HomePage.jsx / .css        → Tela inicial
 │   ├── SobrePage.jsx / .css       → Saiba mais
 │   └── ChatPage.jsx / .css        → Chat (sem histórico salvo)
 ├── styles/
 │   └── global.css                 → Variáveis CSS, reset, .page e .btn
 ├── App.jsx                        → Rotas
 └── main.jsx                       → Entry point
```

## Rotas

| Rota      | Página        |
|-----------|---------------|
| `/`       | Home          |
| `/sobre`  | Saiba mais    |
| `/chat`   | Chat          |

## Rodando local

1. `npm install`
2. Copie `.env.example` para `.env` e coloque sua `GEMINI_API_KEY` (grátis em aistudio.google.com/apikey)
3. `npm run dev` (site em http://localhost:5173, API em :3001)

## Como funciona

`POST /api/chat` valida a conversa, aplica rate limit, faz a triagem de risco (palavras-chave + modelo leve) e responde em streaming. Em caso de risco, mostra CVV 188 e SAMU 192 antes da resposta.

`api/chat.js` é a função da Vercel. `server/server.js` é usado só no `npm run dev` (e no `npm start`).

## Deploy na Vercel

1. Suba o projeto para o GitHub (sem o `.env`).
2. Na Vercel, importe o repositório (preset Vite).
3. Em **Settings > Environment Variables**, adicione `GEMINI_API_KEY` (obrigatória) e, opcionalmente, `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (limite de 6 mensagens por minuto e 100 por dia por IP).
4. Faça um **Redeploy** depois de salvar as variáveis.

O `vercel.json` redireciona as rotas do React Router (`/chat`, `/sobre`) para o `index.html`, sem afetar `/api`.

## Atenção

- No plano gratuito do Gemini, o Google pode usar o conteúdo enviado para melhorar seus produtos. Avise isso aos usuários numa política de privacidade.
- O limite gratuito vale para o projeto inteiro. Com muita gente usando, as respostas falham e vale migrar para um plano pago.
