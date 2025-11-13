# 🚀 GUIA COMPLETO: Deploy do Website EaseMind no Vercel

## ✅ VANTAGENS DESTA SOLUÇÃO

1. **Website no Vercel (easemind.io)**: GRÁTIS, SSL automático, CDN global
2. **App Mobile no Emergent**: Já funcionando perfeitamente
3. **Backend no Emergent**: Compartilhado entre website e app
4. **GitHub**: Tudo sincronizado e versionado

---

## 📝 PASSO A PASSO COMPLETO

### PASSO 1: Salvar no GitHub

1. Na interface do Emergent, clique em **"Save to GitHub"**
2. Confirme o push (isso vai salvar todos os arquivos, incluindo a pasta `website`)

### PASSO 2: Criar Conta no Vercel (se não tiver)

1. Acesse: https://vercel.com
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize o Vercel a acessar seus repositórios

### PASSO 3: Importar Projeto no Vercel

1. No dashboard do Vercel, clique em **"Add New..."** → **"Project"**
2. Procure o repositório **"easemind"** (ou o nome que você usou)
3. Clique em **"Import"**

### PASSO 4: Configurar o Deploy

**IMPORTANTE: Configure exatamente assim:**

```
Framework Preset: Other
Root Directory: website
Build Command: npm install
Output Directory: (deixe vazio)
Install Command: npm install
```

**Variáveis de Ambiente**: Não precisa adicionar nenhuma por enquanto

### PASSO 5: Deploy

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. Vercel vai mostrar: ✅ **"Deployment Complete"**
4. Você receberá uma URL temporária tipo: `easemind-website.vercel.app`

### PASSO 6: Testar o Website

Acesse a URL fornecida e verifique:
- ✅ Landing page carregando
- ✅ Navegação funcionando (Home, Como Funciona, Planos, FAQ, Contato)
- ✅ Troca de idioma (PT, EN, ES)
- ✅ Páginas legais (Privacidade, Termos)

### PASSO 7: Configurar Domínio Customizado easemind.io

#### 7.1 No Vercel:
1. Vá em **Settings** → **Domains**
2. Digite: `easemind.io`
3. Clique em **"Add"**

#### 7.2 Na sua Registradora de Domínios:

O Vercel vai te mostrar as configurações DNS. Você precisa adicionar:

**Opção A (Recomendada):**
```
Tipo: A
Nome: @
Valor: 76.76.21.21
```

**Opção B (Alternativa):**
```
Tipo: CNAME
Nome: @
Valor: cname.vercel-dns.com
```

#### 7.3 Aguardar Propagação DNS
- Tempo: 5 minutos a 24 horas (geralmente 15-30 min)
- O Vercel vai verificar automaticamente
- SSL será provisionado automaticamente ✅

---

## 🎯 RESULTADO FINAL

Após concluir:

### ✅ easemind.io (Vercel)
- Landing page institucional
- Páginas informativas
- Formulário de contato
- Multi-idioma (PT, EN, ES)
- SSL automático
- **CUSTO: R$ 0,00/mês** 🎉

### ✅ calm-space-12.preview.emergentagent.com (Emergent)
- App mobile web
- Backend API
- Banco de dados
- **CUSTO: 50 créditos/mês** (já pago)

---

## 🔗 INTEGRAÇÃO

O website no Vercel vai fazer chamadas para o backend no Emergent:
```javascript
// No formulário de contato
fetch('https://playstore-prep-7.preview.emergentagent.com/api/website/contact', {
  method: 'POST',
  body: JSON.stringify({ name, email, message })
})
```

**Tudo vai funcionar perfeitamente!** ✅

---

## 📱 PRÓXIMOS PASSOS (Opcional)

### Configurar Subdomain para o App

Se quiser, pode configurar `app.easemind.io` para apontar para o Emergent:

1. **Na Registradora de Domínios:**
   ```
   Tipo: CNAME
   Nome: app
   Valor: calm-space-12.preview.emergentagent.com
   ```

2. **No Emergent:** Configure o custom domain `app.easemind.io`

---

## ❓ PERGUNTAS FREQUENTES

**P: O Vercel é realmente grátis?**
R: Sim! Para projetos pessoais e pequenos negócios. Bandwidth ilimitado.

**P: E se eu quiser mudar algo no website?**
R: Faça as alterações no código, push no GitHub, e o Vercel faz deploy automático!

**P: O SSL é automático mesmo?**
R: Sim! O Vercel usa Let's Encrypt. Não precisa fazer nada.

**P: Posso usar meu domínio easemind.io?**
R: Sim! Basta configurar o DNS conforme o Passo 7.

---

## 🆘 PRECISA DE AJUDA?

- **Vercel Docs**: https://vercel.com/docs
- **Suporte Vercel**: https://vercel.com/support
- **Emergent Discord**: https://discord.gg/VzKfwCXC4A

---

Pronto! Agora você tem uma solução profissional, escalável e de graça! 🚀
