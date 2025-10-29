# 🎯 Configuração do MongoDB Atlas no Vercel

## ✅ Migração Concluída!

Seus dados foram migrados com sucesso para o MongoDB Atlas!

---

## 📋 Próximos Passos - Configure no Vercel:

### 1️⃣ Acesse o Vercel Dashboard
https://vercel.com/dashboard

### 2️⃣ Selecione seu projeto
Clique no projeto que você acabou de fazer deploy

### 3️⃣ Vá em Settings → Environment Variables
No menu lateral: **Settings** → **Environment Variables**

### 4️⃣ Adicione a Variável MONGO_URL

**Clique em "Add New"** e preencha:

- **Key (Nome da variável)**:
  ```
  MONGO_URL
  ```

- **Value (Valor)**:
  ```
  mongodb+srv://easemind_admin:7Sb6d2HAP9Da4W7K@easemind-cluster.5jd1ohc.mongodb.net/easemind?retryWrites=true&w=majority
  ```

- **Environment**: Selecione **TODAS** as opções:
  - ☑️ Production
  - ☑️ Preview
  - ☑️ Development

- **Clique em "Save"**

### 5️⃣ Redeploy o Projeto

1. Vá em: **Deployments** (menu lateral)
2. Encontre o último deploy (o mais recente no topo)
3. Clique nos **3 pontinhos (⋮)** ao lado do deploy
4. Clique em **"Redeploy"**
5. Confirme clicando em **"Redeploy"** novamente

### 6️⃣ Aguarde o Deploy (2-3 minutos)

Você verá o status mudando:
- Building... ⚙️
- Deploying... 🚀
- Ready ✅

---

## 🎉 Teste o Dashboard Admin

Após o deploy completar:

1. Acesse: **https://easemind.io/admin**
2. Senha: **easemind2025**
3. Você deve ver todos os seus dados reais! 📊

---

## 📊 Dados Migrados:

- ✅ 17 usuários
- ✅ 48 conversas com Luna
- ✅ 2 entradas de diário
- ✅ 1 registro de humor
- ✅ 1 sessão guiada completada
- ✅ 1 evento SOS
- ✅ 48 memórias da IA
- ✅ 2 eventos de risco

---

## ⚠️ Importante:

A variável `MONGO_URL` que você vai adicionar no Vercel já tem o nome do banco (`/easemind`) no final. Copie exatamente como está acima!

---

## 🆘 Se algo der errado:

1. Verifique se copiou a URL completa corretamente
2. Verifique se selecionou todos os ambientes (Production, Preview, Development)
3. Verifique se fez o Redeploy após adicionar a variável
4. Aguarde 2-3 minutos após o redeploy

---

**Me avise quando terminar de configurar no Vercel para eu testar com você!** ✅
