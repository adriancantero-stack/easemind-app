# 🚀 GUIA COMPLETO - UPDATE GRATUITO + DOMÍNIO easemind.io

## ✅ TUDO ESTÁ PRONTO PARA DEPLOY!

---

## 📋 PARTE 1: FAZER UPDATE DO DEPLOYMENT (GRÁTIS)

### Passo 1: Acessar o Deployment Atual
1. Vá para: https://app.emergent.sh
2. Clique em **"Deployments"** no menu lateral
3. Você verá seu deployment atual (ex: "mental-buddy-20" ou similar)
4. **Clique no nome do deployment**

### Passo 2: Fazer Redeploy/Update
Na página do deployment:

**OPÇÃO A: Botão "Redeploy"**
- Procure o botão **"Redeploy"** ou **"Rebuild"**
- Clique nele
- Confirme "Yes, redeploy"
- ✅ GRÁTIS - Não cobra novos créditos!

**OPÇÃO B: Botão "Settings" → "Redeploy"**
- Clique em **"Settings"** (⚙️ ícone)
- Procure **"Redeploy"** ou **"Trigger Deploy"**
- Clique e confirme
- ✅ GRÁTIS!

### Passo 3: Aguardar Build
- O Emergent vai:
  1. ⏳ Puxar todo o código novo de `/app`
  2. ⏳ Instalar dependências
  3. ⏳ Iniciar Backend (8001), Frontend (3000), Website (9000)
  4. ✅ Deploy completo!
- Tempo estimado: 5-10 minutos

### Passo 4: Verificar se Funcionou
Após o deploy, você receberá uma URL tipo:
- `https://seu-app.emergent.host`

Teste:
```
https://seu-app.emergent.host/          → Website
https://seu-app.emergent.host/app       → Frontend
https://seu-app.emergent.host/api/health → Backend
```

**Se alguma rota NÃO funcionar**, anote qual e me avise!

---

## 🌐 PARTE 2: CONFIGURAR DOMÍNIO easemind.io

### Passo 1: Verificar DNS no Porkbun (JÁ FEITO?)

Acesse: https://porkbun.com/account/domainsSpeedy
1. Clique em **easemind.io**
2. Vá em **"DNS Records"**
3. Verifique se tem:

```
Type: A
Host: @
Answer: 34.57.15.54
TTL: 300
```

**Se NÃO tiver, adicione agora:**
- Clique **"Add"**
- Type: **A**
- Host: **@**
- Answer: **34.57.15.54**
- TTL: **300**
- Clique **"Save"**

### Passo 2: Linkar Domínio no Emergent

Na página do seu deployment:
1. Procure a seção **"Custom Domain"** ou **"Domain Settings"**
2. Clique em **"Link Domain"** ou **"Add Domain"**
3. Digite: **easemind.io**
4. Clique **"Next"** ou **"Add"**

### Passo 3: Verificar Status

O Emergent vai mostrar:
```
Domain: easemind.io
Status: ⏳ Verifying...
Required DNS: A → 34.57.15.54
```

Clique em **"Check Status"** ou **"Verify"**

Aguarde até aparecer:
```
Status: ✅ Verified
SSL: ✅ Active (HTTPS enabled)
```

**Tempo de verificação:** 2-15 minutos

### Passo 4: Testar Domínio

Abra no navegador:
```
https://easemind.io/           → Website Institucional ✅
https://easemind.io/app        → App Mobile ✅
https://easemind.io/api/health → Backend API ✅
```

---

## 🎯 CONFIGURAÇÕES IMPORTANTES

### Variáveis de Ambiente (Se Pedir)

Se o Emergent pedir para configurar variáveis de ambiente:

**Backend:**
```
MONGO_URL=<sua_mongo_url_atual>
OPENAI_API_KEY=<sua_key> OU EMERGENT_LLM_KEY=<sua_key>
```

**Frontend:**
```
EXPO_PUBLIC_BACKEND_URL=/api
```

**Website:**
(Nenhuma necessária)

### Portas Configuradas

O deployment deve rodar:
```
Backend:  porta 8001
Frontend: porta 3000
Website:  porta 9000
```

Isso já está configurado automaticamente! ✅

---

## ⚠️ TROUBLESHOOTING

### Problema 1: "Website não aparece"
**Solução:**
- Website pode estar rodando só internamente
- Tente acessar: `https://seu-app.emergent.host:9000`
- Se funcionar, significa que Nginx não está roteando
- **SOLUÇÃO:** Me avise, vou ajustar config

### Problema 2: "App não carrega em /app"
**Solução:**
- O Emergent pode não estar roteando `/app` automaticamente
- Acesse: `https://seu-app.emergent.host` (raiz)
- **SOLUÇÃO:** Ajustar nginx.conf ou usar subdomínio

### Problema 3: "Backend retorna 404 em /api/*"
**Solução:**
- Verificar se backend está rodando
- Verificar logs: Clique em "Logs" no deployment
- **SOLUÇÃO:** Me envie os logs

### Problema 4: "Domínio não resolve"
**Solução:**
- Verificar DNS: `nslookup easemind.io`
- Aguardar propagação (até 24h globalmente)
- Testar em: https://dnschecker.org
- **SOLUÇÃO:** Confirmar IP está correto (34.57.15.54)

---

## 📊 CHECKLIST FINAL

Após o deploy, você deve ter:

- [ ] Backend funcionando em `easemind.io/api/*`
- [ ] Website funcionando em `easemind.io/`
- [ ] Frontend funcionando em `easemind.io/app` ou `easemind.io`
- [ ] SSL/HTTPS ativo (cadeado verde)
- [ ] Sitemap acessível: `easemind.io/sitemap.xml`
- [ ] Robots.txt acessível: `easemind.io/robots.txt`
- [ ] Todas as páginas carregam (Home, Planos, FAQ, etc.)
- [ ] Formulário de contato funciona
- [ ] Traduções PT/EN/ES funcionam

---

## 💰 CUSTO TOTAL

```
✅ Update/Redeploy:        0 créditos (GRÁTIS)
✅ Domínio easemind.io:    0 créditos (Incluído)
✅ SSL/HTTPS:              0 créditos (Automático)
✅ Atualizações futuras:   0 créditos (Ilimitadas)
───────────────────────────────────────────────
   TOTAL:                  0 créditos novos! ✅
```

Você continua pagando apenas os **50 créditos/mês** que já paga!

---

## 🆘 PRECISA DE AJUDA?

**Durante o processo:**
1. Se encontrar algum erro, tire print
2. Me envie o print ou descrição do erro
3. Envie os logs do deployment (se tiver)

**Estou aqui para ajudar! 😊**

---

## 🚀 PRÓXIMO PASSO AGORA:

**👉 VAI LÁ E CLICA EM "REDEPLOY"! 👈**

Depois me avisa:
- ✅ "Redeploy iniciou com sucesso"
- ❌ "Deu erro X"

Boa sorte! 🍀
