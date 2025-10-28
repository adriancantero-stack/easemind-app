# 🚀 Deploy do Dashboard Admin no Vercel

Este guia mostra como fazer deploy das APIs serverless do admin para o Vercel.

## 📋 Pré-requisitos

1. **Conta no Vercel** (https://vercel.com)
2. **MongoDB Atlas** (banco de dados cloud - grátis 500MB)
3. **Repositório no GitHub** com o código

## 🗂️ Estrutura de Arquivos Criados

```
/api/
├── admin_stats.py          # GET /api/admin_stats - Estatísticas globais
├── mood_distribution.py    # GET /api/mood_distribution - Distribuição de humor
├── popular_sessions.py     # GET /api/popular_sessions - Sessões populares
└── requirements.txt        # Dependências Python (pymongo)
```

## 🔧 Passo 1: Configurar MongoDB Atlas

1. Acesse: https://www.mongodb.com/cloud/atlas
2. Crie uma conta gratuita
3. Crie um novo cluster (**FREE Tier - M0**)
4. Em "Database Access", crie um usuário:
   - Username: `easemind_admin`
   - Password: (gere uma senha forte)
   - Database User Privileges: **Read and write to any database**

5. Em "Network Access", adicione IP:
   - Clique em "Add IP Address"
   - Selecione **"Allow Access from Anywhere"** (0.0.0.0/0)
   
6. Em "Database", clique em **"Connect"**:
   - Escolha "Connect your application"
   - Driver: **Python** / Version: **3.12 or later**
   - Copie a connection string, exemplo:
     ```
     mongodb+srv://easemind_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - **Substitua `<password>` pela senha do usuário**

7. **Migrar dados do MongoDB local para Atlas** (opcional):
   ```bash
   # Exportar do MongoDB local
   mongodump --uri="mongodb://localhost:27017/easemind" --out=backup
   
   # Importar para MongoDB Atlas
   mongorestore --uri="mongodb+srv://easemind_admin:SENHA@cluster0.xxxxx.mongodb.net/easemind" backup/easemind
   ```

## 🚀 Passo 2: Fazer Deploy no Vercel

### Opção A: Via GitHub (Recomendado)

1. **Fazer commit e push dos arquivos**:
   ```bash
   cd /app
   git add api/
   git commit -m "Add admin API serverless functions"
   git push
   ```

2. **No Vercel Dashboard**:
   - Acesse: https://vercel.com/dashboard
   - Vá no projeto **easemind** (que já está deployado)
   - Vá em **Settings** → **Environment Variables**
   
3. **Adicionar variável de ambiente**:
   - Key: `MONGO_URL`
   - Value: `mongodb+srv://easemind_admin:SUA_SENHA@cluster0.xxxxx.mongodb.net/easemind?retryWrites=true&w=majority`
   - Environment: **Production, Preview, Development** (marque todos)
   - Clique em **Save**

4. **Fazer Redeploy**:
   - Vá em **Deployments**
   - Clique nos 3 pontinhos da última versão
   - Clique em **"Redeploy"**
   - Aguarde 2-3 minutos

### Opção B: Via Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
cd /app
vercel --prod

# Configurar variável de ambiente
vercel env add MONGO_URL production
# Cole a string de conexão do MongoDB Atlas quando solicitado
```

## ✅ Passo 3: Testar as APIs

Depois do deploy, teste as APIs:

```bash
# Testar stats
curl https://easemind.io/api/admin_stats

# Testar mood distribution
curl https://easemind.io/api/mood_distribution

# Testar popular sessions
curl https://easemind.io/api/popular_sessions
```

## 🔄 Passo 4: Atualizar Website para Usar Novas APIs

O `admin.html` já está configurado para chamar:
- `/api/admin/stats` → vai para `/api/admin_stats`
- `/api/admin/mood-distribution` → vai para `/api/mood_distribution`
- `/api/admin/popular-sessions` → vai para `/api/popular_sessions`

**Precisa atualizar o server.js** para redirecionar corretamente:

Edite `/app/website/server.js`:

```javascript
// Proxy para APIs serverless (admin)
app.get('/api/admin/stats', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // No Vercel, as funções estão em /api/
  res.redirect(307, '/api/admin_stats');
});

app.get('/api/admin/mood-distribution', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.redirect(307, '/api/mood_distribution');
});

app.get('/api/admin/popular-sessions', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.redirect(307, '/api/popular_sessions');
});
```

## 📊 Resultado Final

Depois de seguir todos os passos:

✅ Dashboard admin em https://easemind.io/admin  
✅ Senha: `easemind2025`  
✅ APIs serverless funcionando  
✅ MongoDB Atlas conectado  
✅ Dados reais exibidos  
✅ Gráficos e métricas atualizados  

## 🔐 Segurança

Para alterar a senha do admin, adicione no Vercel:
- Key: `ADMIN_PASSWORD`
- Value: sua_senha_segura

## 💰 Custo

- **Vercel**: GRÁTIS (plano Hobby)
- **MongoDB Atlas**: GRÁTIS (tier M0 - 500MB)
- **Total**: **R$ 0,00/mês** 🎉

## ❓ Troubleshooting

**Erro: "Cannot connect to MongoDB"**
- Verifique se a variável `MONGO_URL` está correta
- Verifique se o IP 0.0.0.0/0 está permitido no Atlas

**Erro: "Function timeout"**
- Vercel Free tem limite de 10s por request
- Otimize as queries do MongoDB

**APIs não funcionam**
- Verifique se os arquivos estão na pasta `/api/` na raiz do projeto
- Verifique se `requirements.txt` foi incluído no commit
