# ORG.AI v2 — Organizador Inteligente com IA

## Funcionalidades

- **⚡ Captura rápida** — digita ou cola qualquer texto, IA classifica
- **🎤 Captura por voz** — fala entre pacientes, transcreve automaticamente
- **📲 Compartilhar de qualquer app** — WhatsApp, email, navegador → ORG.AI
- **🎯 Foco do Dia (Top 3)** — mostra só os 3 itens mais urgentes
- **✅ Revisão diária** — ritual de revisão com edição item a item
- **🔥 Streak** — conta dias consecutivos de revisão
- **🔔 Notificações push** — avisa sobre vencimentos e revisão diária
- **📧 Webhook de email** — emails chegam na triagem (aprovar/descartar)
- **⚡ Cache inteligente** — abre instantaneamente, funciona offline
- **📊 Notificações escalonadas** — 7d, 3d, 1d, hoje, atrasado

## Deploy no Vercel (gratuito)

### Opção 1: CLI (mais rápido)
```bash
npm i -g vercel
cd org-ai-pwa
vercel --prod
```

### Opção 2: GitHub
1. Suba no GitHub
2. vercel.com → New Project → selecione o repo
3. Root Directory: deixe como está (raiz)
4. Deploy

## Instalação no Celular

1. Abra o link no navegador do celular
2. **Android:** Menu (⋮) → "Adicionar à tela inicial"
3. **iPhone:** Compartilhar (⬆) → "Adicionar à Tela de Início"

## Configuração do Webhook de Email

No Zapier ou Make, crie uma automação:
- **Trigger:** Novo email no Gmail (com filtro se quiser)
- **Action:** POST para `https://seu-app.vercel.app/api/capture`
- **Body:**
```json
{
  "text": "{{assunto}} — {{corpo_resumido}}",
  "source": "email",
  "from": "{{remetente}}"
}
```

Os emails chegam na **Triagem** do app — você aprova ou descarta.
Para persistência server-side, configure o Vercel KV (gratuito até 256MB).

## Estrutura
```
public/           → Arquivos estáticos (PWA)
  index.html      → App completo
  manifest.json   → Config PWA + Share Target
  sw.js           → Service Worker
  icon-*.svg      → Ícones
api/              → Serverless functions
  capture.js      → Webhook POST (recebe emails)
  triagem.js      → GET (lista itens pendentes)
vercel.json       → Config de deploy + rotas
```
