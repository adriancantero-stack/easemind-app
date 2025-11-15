# Instruções para Configurar o Painel Admin no Vercel

## ⚠️ IMPORTANTE: Configuração Necessária

O painel admin precisa se conectar ao backend FastAPI para buscar as métricas. Você precisa configurar uma variável de ambiente no Vercel.

## 🔧 Passos para Configurar:

### 1. Acesse as Configurações do Projeto no Vercel

1. Vá para https://vercel.com
2. Selecione o projeto `easemind` (website)
3. Clique em "Settings" (Configurações)
4. Clique em "Environment Variables" no menu lateral

### 2. Adicione a Variável BACKEND_URL

Adicione uma nova variável de ambiente:

**Nome:** `BACKEND_URL`  
**Valor:** URL do seu backend FastAPI em produção

**Opções possíveis:**

#### Opção 1: Backend já deployado no Vercel/Railway/outro serviço
```
BACKEND_URL=https://seu-backend.vercel.app
```

#### Opção 2: Backend na mesma aplicação (Kubernetes/Docker)
```
BACKEND_URL=http://localhost:8001
```

#### Opção 3: Backend separado no mesmo domínio
```
BACKEND_URL=https://api.easemind.io
```

### 3. Redeploy a Aplicação

Após adicionar a variável:
1. Vá para "Deployments"
2. Clique nos 3 pontinhos (...) no último deployment
3. Clique em "Redeploy"

## 🧪 Como Testar Localmente

Para testar localmente antes de fazer deploy:

1. Certifique-se de que o backend FastAPI está rodando em http://localhost:8001
2. Acesse http://localhost:9000/admin
3. Faça login com a senha: `easemind2025`
4. O dashboard deve carregar todas as métricas

## 📊 Endpoints que o Admin Usa

O admin precisa acessar esses endpoints do backend:

- `GET /api/admin/stats` - Estatísticas gerais
- `GET /api/admin/popular-sessions` - Sessões populares
- `GET /api/admin/mood-distribution` - Distribuição de humor
- `GET /api/list_users` - Lista de usuários

## 🔍 Verificando se Está Funcionando

Depois de configurar:

1. Acesse https://easemind.io/admin
2. Faça login
3. Abra o Console do Navegador (F12)
4. Procure por logs de erro
5. Se aparecer erro 500, verifique:
   - A variável `BACKEND_URL` está configurada?
   - O backend está acessível na URL configurada?
   - O backend está rodando e respondendo?

## 🆘 Solução de Problemas

### Erro: "Failed to fetch stats"

**Causa:** O backend não está acessível ou a URL está incorreta

**Solução:**
1. Verifique se `BACKEND_URL` está configurado corretamente
2. Teste a URL manualmente: `curl https://sua-url/api/admin/stats`
3. Verifique se o backend está rodando

### Erro: "Unauthorized"

**Causa:** Sessão expirou ou não está logado

**Solução:**
1. Faça logout
2. Faça login novamente
3. Se persistir, limpe os cookies do navegador

### Dados aparecem zerados

**Causa:** Isso é normal se ainda não há usuários usando o app

**Status:** O admin está funcionando corretamente!

## 🎯 Próximos Passos

Depois de configurar o `BACKEND_URL` no Vercel:
1. Faça o **Save to GitHub**
2. Aguarde o Vercel fazer o redeploy automático
3. Acesse https://easemind.io/admin
4. Faça login e veja suas métricas!

---

**Nota:** Para segurança adicional, considere:
- Mudar a senha do admin (`ADMIN_PASSWORD` env var)
- Implementar 2FA
- Adicionar logs de auditoria
