# EaseMind - Guia de Deploy para Railway

## 📋 Pré-requisitos

1. Conta no Railway (https://railway.app) - GRÁTIS
2. Conta no MongoDB Atlas (https://cloud.mongodb.com) - GRÁTIS (se não usar Railway MongoDB)

## 🚀 Passo a Passo

### ETAPA 1: Criar Conta no Railway

1. Acesse: https://railway.app
2. Clique em "Start a New Project"
3. Login com GitHub (recomendado)

### ETAPA 2: Criar Novo Projeto

1. No Railway Dashboard, clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Conecte sua conta do GitHub
4. Selecione o repositório "easemind"

### ETAPA 3: Configurar MongoDB

**Opção A: Railway MongoDB (Mais Simples)**
1. No projeto, clique em "+ New"
2. Selecione "Database" → "Add MongoDB"
3. Railway cria automaticamente e fornece a URL

**Opção B: MongoDB Atlas (Recomendado para Produção)**
1. Vá para: https://cloud.mongodb.com
2. Crie cluster gratuito (M0)
3. Copie a connection string

### ETAPA 4: Configurar Variáveis de Ambiente

No Railway, vá em "Variables" e adicione:

```
MONGO_URL=mongodb://[sua-url-do-mongo]
OPENAI_API_KEY=[sua-chave-openai]
GOOGLE_APPLICATION_CREDENTIALS_JSON=[credenciais-firebase]
PORT=8001
```

### ETAPA 5: Deploy!

1. Railway detecta automaticamente os arquivos
2. Faz build automático
3. Aguarde 2-5 minutos
4. URL de produção aparece no dashboard!

### ETAPA 6: Conectar Frontend

1. Copie a URL do Railway (ex: easemind-production.up.railway.app)
2. No Emergent, atualize o `.env` do frontend:
   ```
   EXPO_PUBLIC_BACKEND_URL=https://easemind-production.up.railway.app
   ```
3. Salve no GitHub
4. Pronto! ✅

## 💰 Custos

- **Railway**: $5 USD de crédito grátis/mês
- **MongoDB Atlas**: Cluster M0 gratuito para sempre
- **Total Inicial**: GRÁTIS! 🎉

## 🔄 Atualizações Futuras

1. Faça mudanças no Emergent
2. Clique em "Save to GitHub"
3. Railway detecta e atualiza automaticamente
4. Sem comandos complexos!

## 📞 Suporte

Se tiver problemas:
- Discord Railway: https://discord.gg/railway
- Documentação: https://docs.railway.app
