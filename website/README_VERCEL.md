# EaseMind Website - Deploy no Vercel

Este diretório contém o website institucional do EaseMind para deploy no Vercel.

## 🚀 Deploy no Vercel

### Passo 1: Conectar com GitHub
1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
3. Clique em "New Project"
4. Importe o repositório do EaseMind

### Passo 2: Configurar o Projeto
- **Root Directory**: Defina como `website`
- **Framework Preset**: `Other`
- **Build Command**: `npm install`
- **Output Directory**: deixe vazio (usa o padrão)

### Passo 3: Deploy
- Clique em "Deploy"
- Aguarde alguns minutos
- Website estará no ar! 🎉

### Passo 4: Configurar Domínio Customizado
1. No dashboard do Vercel, vá em "Settings" → "Domains"
2. Adicione `easemind.io`
3. Configure o DNS:
   - Tipo: `A`
   - Nome: `@`
   - Valor: (IP fornecido pelo Vercel)
   
   OU
   
   - Tipo: `CNAME`
   - Nome: `@`
   - Valor: `cname.vercel-dns.com`

4. SSL é automático e grátis! ✅

## 📁 Estrutura

```
website/
├── server.js           # Servidor Express
├── package.json        # Dependências
├── vercel.json        # Config Vercel
├── locales/           # Traduções (PT, EN, ES)
│   ├── pt-BR.json
│   ├── en.json
│   ├── es.json
│   ├── privacy-*.md
│   └── terms-*.md
└── styles/            # CSS
    └── main.css
```

## 🔗 Integração com App

O website terá links para o app:
- **App Store**: `https://apps.apple.com/app/easemind` (quando publicar)
- **Google Play**: `https://play.google.com/store/apps/details?id=io.easemind`
- **Web Preview**: `https://calm-space-12.preview.emergentagent.com`

## 💰 Custo

**GRÁTIS** no Vercel! ✅
- Hosting gratuito
- SSL automático
- Deploy contínuo do GitHub
- Bandwidth ilimitado para projetos pessoais

## ⚡ Performance

- CDN global
- Edge Functions
- Cache automático
- 99.99% uptime
