# 🚀 DEPLOY EASEMIND - OPÇÃO C (TUDO EM UM DOMÍNIO)

## ✅ ARQUIVOS CRIADOS:

```
/app/
├── Procfile                  ← Emergent usa este para iniciar
├── start-production.sh       ← Script que inicia os 3 serviços + Nginx
├── nginx.conf                ← Configuração do proxy reverso
├── backend/                  ← FastAPI (porta 8001)
├── frontend/                 ← Expo (porta 3000)
└── website/                  ← Express (porta 9000)
```

---

## 🎯 ARQUITETURA FINAL:

```
easemind.io/         → Website Institucional (Express, porta 9000)
easemind.io/app      → App Mobile (Expo, porta 3000)
easemind.io/api/*    → Backend API (FastAPI, porta 8001)
```

**Nginx (porta 8080)** faz o roteamento de TODAS as requisições.

---

## 📋 PASSO A PASSO PARA REDEPLOY:

### 1. **Commit das Mudanças (Se Usar Git)**

Se seu código está em um repositório Git:
```bash
git add Procfile start-production.sh nginx.conf
git commit -m "Add unified domain configuration"
git push
```

### 2. **Fazer Redeploy no Emergent**

**Opção A: Via UI**
1. Acesse: https://app.emergent.sh
2. Vá em **Deployments**
3. Clique no seu deployment **"mental-buddy-20"**
4. Clique em **"Redeploy"** ou **"Rebuild"**
5. Aguarde 5-10 minutos

**Opção B: Automatic Deploy**
- Se conectou com GitHub, o deploy acontece automaticamente após push

### 3. **O Que Acontece no Deploy:**

O Emergent vai:
1. ✅ Ler o `Procfile`
2. ✅ Executar `start-production.sh`
3. ✅ Iniciar Backend (8001), Frontend (3000), Website (9000)
4. ✅ Iniciar Nginx (8080) que faz o roteamento
5. ✅ Expor apenas a porta 8080 publicamente

### 4. **Verificar Funcionamento:**

Após deploy, teste na URL do Emergent:
```
https://easemind-mobile.preview.emergentagent.com/
   ↓
   Deve mostrar: Website Institucional (Home do EaseMind)

https://easemind-mobile.preview.emergentagent.com/app
   ↓
   Deve mostrar: App Mobile (Expo)

https://easemind-mobile.preview.emergentagent.com/api/health
   ↓
   Deve retornar: 200 OK
```

---

## 🌐 CONFIGURAR DOMÍNIO easemind.io

### Passo A: DNS no Porkbun

1. Acesse: https://porkbun.com
2. Vá em **Domain Management** → **easemind.io**
3. Clique em **DNS Records**
4. Adicione (ou verifique se já existe):

```
Type: A
Host: @
Answer: 34.57.15.54
TTL: 300
```

5. Clique **Save**

### Passo B: Custom Domain no Emergent

1. No deployment, procure **"Custom Domain"**
2. Clique **"Link Domain"**
3. Digite: **easemind.io**
4. Clique **"Verify"**
5. Aguarde status: ✅ **Verified** (2-15 min)
6. SSL será configurado automaticamente

### Passo C: Testar Domínio

Após verificação:
```
https://easemind.io/           → Website ✅
https://easemind.io/app        → App ✅
https://easemind.io/api/health → Backend ✅
https://easemind.io/sitemap.xml → Sitemap ✅
```

---

## 🔧 TROUBLESHOOTING

### Problema 1: "503 Service Unavailable"
**Causa:** Algum serviço não iniciou
**Solução:**
1. Vá em Logs do deployment
2. Verifique qual serviço falhou
3. Corrija e faça redeploy

### Problema 2: "Website não aparece na raiz"
**Causa:** Nginx não está roteando corretamente
**Solução:**
1. Verifique se `nginx.conf` está no `/app`
2. Verifique se `start-production.sh` está executando
3. Veja logs: `/tmp/logs/nginx.log`

### Problema 3: "/app retorna 404"
**Causa:** Frontend não está rodando ou Nginx não configurado
**Solução:**
1. Verifique logs: `/tmp/logs/frontend.log`
2. Confirme que porta 3000 está ativa

### Problema 4: "/api/* retorna 404"
**Causa:** Backend não está rodando
**Solução:**
1. Verifique logs: `/tmp/logs/backend.log`
2. Confirme que porta 8001 está ativa
3. Teste: `curl http://localhost:8001/api/health`

---

## 📊 VERIFICAÇÃO FINAL

Após deploy bem-sucedido, você deve ter:

- [ ] Website carrega em `easemind.io/`
- [ ] App carrega em `easemind.io/app`
- [ ] Backend responde em `easemind.io/api/health`
- [ ] Sitemap acessível: `easemind.io/sitemap.xml`
- [ ] Robots acessível: `easemind.io/robots.txt`
- [ ] SSL/HTTPS ativo (cadeado verde)
- [ ] Todas as páginas do website funcionam
- [ ] Traduções PT/EN/ES funcionam
- [ ] Formulário de contato funciona

---

## 💰 CUSTO

```
✅ Redeploy:          0 créditos (GRÁTIS)
✅ Domínio:           0 créditos (Incluído)
✅ SSL:               0 créditos (Automático)
✅ Nginx:             0 créditos (Incluído)
───────────────────────────────────────────
   TOTAL:             50 créditos/mês
```

Apenas 1 deployment, tudo integrado! 🎉

---

## 🆘 PRECISA DE AJUDA?

Se algo não funcionar:
1. Tire print do erro
2. Copie os logs do deployment
3. Me envie que vou ajudar!

---

## 🚀 PRÓXIMO PASSO AGORA:

**👉 FAÇA O REDEPLOY! 👈**

1. Vá em https://app.emergent.sh
2. Clique em "Redeploy"
3. Aguarde 10 minutos
4. Teste as URLs

Depois me conte como foi! 😊
