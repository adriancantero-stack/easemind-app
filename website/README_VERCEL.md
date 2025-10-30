# EaseMind Website - Deploy no Vercel

Este diretório contém o website institucional do EaseMind para deploy no Vercel.

## 🚀 Deploy no Vercel - INSTRUÇÕES CORRETAS

### Passo 1: Conectar com GitHub
1. Faça push do código para o GitHub (use a interface do Emergent: "Save to GitHub")
2. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
3. Clique em "New Project"
4. Importe o repositório do EaseMind

### Passo 2: Configurar o Projeto ⚠️ IMPORTANTE!

**Na tela de configuração do projeto:**

```
Framework Preset: Other
Root Directory: website
Build Command: (deixe vazio ou npm install)
Output Directory: (deixe vazio - IMPORTANTE!)
Install Command: npm install
```

**NÃO configure Output Directory como "public"!** Isso é para sites estáticos. Estamos usando Node.js server.

### Passo 3: Configurações do Projeto (Settings)

Se o deploy falhar com erro "No Output Directory named 'public'":

1. Vá em **Settings** → **General**
2. **Output Directory**: Deixe **VAZIO** ou coloque apenas um ponto `.`
3. **Framework Preset**: `Other`
4. Salve as configurações
5. Em **Deployments**, faça **Redeploy** da última versão

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. Website estará no ar! 🎉

### Passo 5: Configurar Domínio Customizado
1. No dashboard do Vercel, vá em "Settings" → "Domains"
2. Adicione `easemind.io`
3. Configure o DNS:
   - Tipo: `A`
   - Nome: `@`
   - Valor: (IP fornecido pelo Vercel - geralmente 76.76.21.21)
   
   OU
   
   - Tipo: `CNAME`
   - Nome: `@`
   - Valor: `cname.vercel-dns.com`

4. SSL é automático e grátis! ✅

## 📁 Estrutura

```
website/
├── server.js           # Servidor Express (Node.js)
├── package.json        # Dependências
├── vercel.json        # Config Vercel (@vercel/node)
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
- **Web Preview**: `https://easemind-profile.preview.emergentagent.com`

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

## ❓ Troubleshooting

**Erro: "No Output Directory named 'public'"**
- Solução: Vá em Settings → General → Output Directory → Deixe VAZIO → Salve → Redeploy

**Erro: "Build failed"**
- Verifique se Root Directory está como `website`
- Verifique se vercel.json existe no diretório `website/`
- Verifique se package.json tem as dependências corretas
