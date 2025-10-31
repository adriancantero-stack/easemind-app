# 🚀 EaseMind - Guia de Publicação no Google Play Store

## ✅ CONFIGURAÇÃO JÁ FEITA

Todos os arquivos de configuração já foram criados:
- ✅ `eas.json` - Configuração de build
- ✅ `app.json` - Configuração Android atualizada
- ✅ `.env` - URL do backend em produção

---

## 📦 PASSO 1: Preparar seu MacBook

### Instalar ferramentas necessárias:

```bash
# 1. Instalar Homebrew (se não tiver)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instalar Node.js
brew install node

# 3. Instalar Git
brew install git

# 4. Instalar Expo CLI e EAS CLI
npm install -g eas-cli expo-cli

# 5. Verificar instalação
node --version
npm --version
eas --version
```

---

## 📥 PASSO 2: Baixar o Projeto

```bash
# 1. Abrir Terminal e ir para Documents
cd ~/Documents

# 2. Clonar repositório do GitHub
git clone https://github.com/adriancantero-stack/easemind-app.git

# 3. Entrar na pasta do frontend
cd easemind-app/frontend

# 4. Instalar dependências (vai demorar 2-5 minutos)
npm install

# 5. Verificar se tudo está OK
ls -la
# Você deve ver: app.json, eas.json, package.json, etc.
```

---

## 🔑 PASSO 3: Login no Expo

```bash
# Login no Expo (criar conta se não tiver)
npx expo login

# OU criar conta nova
npx expo register
```

---

## 🏗️ PASSO 4: Fazer Build para Google Play

### Build de Produção (AAB - Android App Bundle):

```bash
# Dentro da pasta easemind-app/frontend
eas build --platform android --profile production
```

### O que vai acontecer:

1. **Pergunta: Configure project?** → Digite `Y` (Yes)
2. **Pergunta: Generate a new keystore?** → Digite `Y` (Yes)
3. **Build vai iniciar na nuvem do Expo** (20-30 minutos)
4. **Você verá um link:** `https://expo.dev/accounts/...`
5. **Aguarde a mensagem:** ✅ Build finished

### Download do AAB:

Quando terminar, você receberá um link para baixar o arquivo `.aab`:
```
✅ Build finished!
Download: https://expo.dev/artifacts/eas/[id].aab
```

**Salve este arquivo** em `~/Downloads/easemind.aab`

---

## 📸 PASSO 5: Preparar Assets (Imagens)

### Você precisa de:

**1. Screenshots (obrigatório):**
- Mínimo: 2 screenshots
- Tamanho: 1080x1920 pixels (portrait)
- Formato: PNG ou JPEG

**2. Feature Graphic (obrigatório):**
- Tamanho: 1024x500 pixels
- Formato: PNG ou JPEG
- Banner promocional do app

**3. Ícone (512x512) - JÁ TEMOS!**
- Arquivo: `./assets/images/icone-easemind.png`

### Como tirar screenshots:

1. Abra o app no navegador
2. Abra DevTools (Command + Option + I)
3. Clique no ícone de celular (responsive mode)
4. Escolha dimensão: 1080x1920
5. Tire screenshots de:
   - Tela de login
   - Chat com Luna
   - Sessões guiadas
   - Journal
   - Perfil

---

## 🎮 PASSO 6: Publicar no Google Play Console

### A. Acessar e Criar App:

1. Vá para: https://play.google.com/console
2. Clique em **"Create app"**
3. Preencha:
   - **Nome:** EaseMind
   - **Idioma padrão:** Português (Brasil)
   - **App ou jogo:** App
   - **Grátis ou pago:** Grátis
   - **Declarações:** Aceitar todos os termos

---

### B. Configurar Conteúdo do App:

#### **Store Listing (Listagem na Loja):**

**Descrição Curta (80 caracteres):**
```
Suporte emocional com IA, meditação guiada e diário pessoal
```

**Descrição Completa:**
```
EaseMind é seu companheiro de bem-estar emocional.

✨ Recursos principais:

🤖 Luna - IA de Apoio Emocional
Converse com Luna, nossa assistente de IA treinada para oferecer apoio emocional em português, inglês e espanhol.

🧘 Sessões Guiadas
8 sessões de meditação e respiração para reduzir ansiedade, melhorar o sono e aumentar o foco.

📔 Diário Pessoal
Registre seus pensamentos, emoções e acompanhe seu progresso emocional ao longo do tempo.

🆘 Botão de Pânico
Acesso rápido a técnicas de respiração em momentos de crise.

🌍 Multi-idioma
Disponível em Português, Inglês e Espanhol.

🎨 Design Minimalista
Interface inspirada na serenidade Apple, focada no seu bem-estar.

Nota: EaseMind não substitui atendimento médico ou psicológico profissional. Em caso de emergência, procure ajuda especializada.
```

**Categoria:** Saúde e fitness > Bem-estar

---

### C. Upload do AAB:

1. No menu lateral: **Production** → **Create new release**
2. Clique em **Upload** e selecione `easemind.aab`
3. **Release notes** (notas da versão):
```
Versão 1.0.0 - Lançamento Inicial

🎉 Bem-vindo ao EaseMind!

Esta é nossa primeira versão, incluindo:
- Chat com Luna (IA de apoio emocional)
- 8 sessões guiadas de meditação
- Diário pessoal com rastreamento de humor
- Botão de pânico para emergências
- Suporte a 3 idiomas (PT, EN, ES)

Estamos animados para ajudar você em sua jornada de bem-estar emocional!
```

---

### D. Classificação de Conteúdo:

1. Clique em **Start questionnaire**
2. Responda:
   - **Categoria:** Utilidades
   - **Contém violência?** Não
   - **Tema sexual?** Não
   - **Linguagem imprópria?** Não
   - **Uso de substâncias?** Não
   - **Compras no app?** Não
   - **Interação entre usuários?** Não (Luna é IA, não pessoas reais)

---

### E. Política de Privacidade:

Você precisa de uma URL de política de privacidade. **Posso criar uma para você** ou use um gerador:
- https://app-privacy-policy-generator.firebaseapp.com/

**Exemplo de URL:** `https://easemind.io/privacy-policy`

---

### F. Preço e Distribuição:

- **Países:** Brasil, Estados Unidos, Portugal, Espanha (ou todos)
- **Classificação de conteúdo:** Livre
- **Anúncios:** Não contém anúncios
- **Aceitar termos do Google Play**

---

## ⏱️ PASSO 7: Revisão do Google

Após submeter:
- **Revisão inicial:** 1-3 dias
- **Possíveis pedidos:** Screenshots adicionais, ajustes na descrição
- **Publicação:** Automática após aprovação

---

## 🎯 CHECKLIST FINAL

Antes de submeter, certifique-se:

- [ ] AAB (.aab file) baixado e pronto
- [ ] 2+ screenshots (1080x1920)
- [ ] Feature graphic (1024x500)
- [ ] Ícone 512x512 (já temos!)
- [ ] Descrição escrita
- [ ] Política de privacidade pronta
- [ ] Classificação de conteúdo preenchida
- [ ] Países selecionados

---

## 💰 CUSTOS

- **Google Play Developer:** $25 USD (taxa única)
- **Expo EAS Build:** Grátis (primeiros builds)
- **Railway Backend:** $5 USD/mês crédito grátis

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Erro: "eas: command not found"
```bash
npm install -g eas-cli
```

### Erro: "Unable to find expo config"
```bash
# Certifique-se que está na pasta /frontend
cd ~/Documents/easemind-app/frontend
```

### Build falhou no Expo?
```bash
# Limpar e tentar novamente
rm -rf node_modules
npm install
eas build --platform android --profile production --clear-cache
```

---

## 📞 PRÓXIMOS PASSOS APÓS PUBLICAÇÃO

1. **Monitorar reviews** no Google Play Console
2. **Atualizar versão** quando fizer mudanças:
   - Aumentar `versionCode` em `app.json`
   - Fazer novo build com `eas build`
3. **Acompanhar analytics** no Google Play Console

---

## 🎉 PARABÉNS!

Você está pronto para publicar o EaseMind no Google Play Store!

Qualquer dúvida, consulte:
- Expo Docs: https://docs.expo.dev/
- Google Play Console Help: https://support.google.com/googleplay/android-developer

---

**Boa sorte! 🚀**
