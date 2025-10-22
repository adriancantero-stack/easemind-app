const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 9000;

// Admin password (em produção, use variável de ambiente)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'easemind2025';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'easemind-admin-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Helper: Load translations
function loadTranslations(lang) {
  const filePath = path.join(__dirname, 'locales', `${lang}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'locales', 'pt-BR.json'), 'utf8'));
}

// Helper: Load legal markdown
function loadLegal(type, lang) {
  const filePath = path.join(__dirname, 'locales', `${type}-${lang}.md`);
  if (fs.existsSync(filePath)) {
    const markdown = fs.readFileSync(filePath, 'utf8');
    return marked.parse(markdown);
  }
  return marked.parse(fs.readFileSync(path.join(__dirname, 'locales', `${type}-pt-BR.md`), 'utf8'));
}

// Helper: Detect language from Accept-Language header
function detectLanguage(req) {
  const langQuery = req.query.lang;
  if (langQuery && ['pt-BR', 'en', 'es'].includes(langQuery)) return langQuery;
  
  const acceptLang = req.headers['accept-language'] || '';
  if (acceptLang.includes('pt')) return 'pt-BR';
  if (acceptLang.includes('es')) return 'es';
  return 'en';
}

// Helper: Generate HTML template (PREMIUM DESIGN)
function generateHTML(page, lang, t) {
  const appStoreUrl = 'https://apps.apple.com/app/easemind';
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=io.easemind';
  const appPreviewUrl = 'https://ui-revamp-21.preview.emergentagent.com';
  
  let content = '';
  
  // Generate page-specific content
  switch(page) {
    case 'home':
      content = `
        <!-- HERO SECTION -->
        <section class="hero">
          <div class="container">
            <h1>${t.hero.h1}</h1>
            <p>${t.hero.subtitle}</p>
            <div class="cta-group">
              <a href="#download" class="btn btn-primary">${t.cta.download}</a>
              <a href="/how-it-works?lang=${lang}" class="btn btn-secondary">${t.cta.how}</a>
            </div>
          </div>
        </section>
        
        <!-- BENEFITS SECTION -->
        <section class="benefits">
          <div class="container">
            <h2>${t.benefits.title || 'Por que escolher o EaseMind?'}</h2>
            <p class="section-subtitle">${t.benefits.subtitle || 'Apoio emocional quando você mais precisa'}</p>
            <div class="benefit-grid">
              <div class="benefit-card">
                <div class="benefit-icon">
                  <img src="/images/benefit-1.png" alt="${t.benefits.b1.title}" loading="lazy">
                </div>
                <h3>${t.benefits.b1.title}</h3>
                <p>${t.benefits.b1.description}</p>
              </div>
              <div class="benefit-card">
                <div class="benefit-icon">
                  <img src="/images/benefit-2.png" alt="${t.benefits.b2.title}" loading="lazy">
                </div>
                <h3>${t.benefits.b2.title}</h3>
                <p>${t.benefits.b2.description}</p>
              </div>
              <div class="benefit-card">
                <div class="benefit-icon">
                  <img src="/images/benefit-3.png" alt="${t.benefits.b3.title}" loading="lazy">
                </div>
                <h3>${t.benefits.b3.title}</h3>
                <p>${t.benefits.b3.description}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- HOW IT WORKS -->
        <section class="how-it-works">
          <div class="container">
            <h2>${t.howItWorks.h1}</h2>
            <p class="section-subtitle">${t.howItWorks.subtitle || 'Simples, rápido e eficaz'}</p>
            <div class="steps">
              <div class="step">
                <div class="step-visual">
                  <img src="/images/step-1.png" alt="${t.howItWorks.s1.title}" loading="lazy">
                </div>
                <div class="step-content">
                  <h3>${t.howItWorks.s1.title}</h3>
                  <p>${t.howItWorks.s1.description}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-visual">
                  <img src="/images/step-2.png" alt="${t.howItWorks.s2.title}" loading="lazy">
                </div>
                <div class="step-content">
                  <h3>${t.howItWorks.s2.title}</h3>
                  <p>${t.howItWorks.s2.description}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-visual">
                  <img src="/images/step-3.png" alt="${t.howItWorks.s3.title}" loading="lazy">
                </div>
                <div class="step-content">
                  <h3>${t.howItWorks.s3.title}</h3>
                  <p>${t.howItWorks.s3.description}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-visual">
                  <img src="/images/step-4.png" alt="${t.howItWorks.s4?.title || 'Diário Emocional'}" loading="lazy">
                </div>
                <div class="step-content">
                  <h3>${t.howItWorks.s4?.title || 'Diário Emocional'}</h3>
                  <p>${t.howItWorks.s4?.description || 'Registre seus sentimentos e acompanhe seu progresso ao longo do tempo.'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA FINAL -->
        <section class="benefits" id="download" style="padding: 6rem 0; text-align: center;">
          <div class="container">
            <h2>${t.cta.finalTitle}</h2>
            <p class="section-subtitle">${t.cta.finalSubtitle}</p>
            <div class="store-buttons">
              <a href="${appStoreUrl}" class="btn-store btn-appstore" target="_blank" rel="noopener">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div>
                  <div class="store-text">${t.cta.availableOn}</div>
                  <div class="store-name">App Store</div>
                </div>
              </a>
              <a href="${playStoreUrl}" class="btn-store btn-playstore" target="_blank" rel="noopener">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div>
                  <div class="store-text">${t.cta.availableAt}</div>
                  <div class="store-name">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </section>
      `;
      break;
      
    case 'how-it-works':
      content = `
        <!-- HERO SECTION -->
        <section class="hero" style="padding: 8rem 0 5rem; text-align: center;">
          <div class="container">
            <h1 style="font-size: 3rem; margin-bottom: 1.5rem;">${t.howItWorks.title}</h1>
            <p style="font-size: 1.25rem; color: #000000; font-weight: 500; max-width: 700px; margin: 0 auto 2rem;">
              ${t.howItWorks.subtitle}
            </p>
          </div>
        </section>

        <!-- HOW IT WORKS DETAILED -->
        <section class="how-it-works" style="padding: 4rem 0;">
          <div class="container">
            <div class="steps">
              <!-- Step 1: Luna Chat -->
              <div class="step">
                <div class="step-visual">
                  <img src="/images/step-1.png" alt="${t.howItWorks.s1.title}" loading="lazy" style="width: 100%; height: auto; border-radius: 24px;">
                </div>
                <div class="step-content">
                  <h3>${t.howItWorks.s1.title}</h3>
                  <p>${t.howItWorks.s1.description}</p>
                  <ul style="margin-top: 1.5rem; line-height: 2;">
                    <li><strong>${t.howItWorks.s1.feature1 || 'Conversas naturais:'}</strong> ${t.howItWorks.s1.feature1Desc || 'Luna usa processamento de linguagem natural para entender suas emoções e oferecer respostas empáticas e contextualizadas.'}</li>
                    <li><strong>${t.howItWorks.s1.feature2 || 'Memória contextual:'}</strong> ${t.howItWorks.s1.feature2Desc || 'Ela lembra de suas conversas anteriores para oferecer suporte personalizado e consistente ao longo do tempo.'}</li>
                    <li><strong>${t.howItWorks.s1.feature3 || 'Disponível 24/7:'}</strong> ${t.howItWorks.s1.feature3Desc || 'Acesse quando precisar, sem agendamentos ou filas de espera.'}</li>
                  </ul>
                </div>
              </div>

              <!-- Step 2: Guided Sessions -->
              <div class="step">
                <div class="step-content">
                  <h3>${t.howItWorks.s2.title}</h3>
                  <p>${t.howItWorks.s2.description}</p>
                  <ul style="margin-top: 1.5rem; line-height: 2;">
                    <li><strong>${t.howItWorks.s2.feature1 || 'Técnicas cientificamente validadas:'}</strong> ${t.howItWorks.s2.feature1Desc || 'Respiração 4-7-8, Box Breathing, relaxamento muscular progressivo, mindfulness e visualização guiada.'}</li>
                    <li><strong>${t.howItWorks.s2.feature2 || 'Música ambiente personalizada:'}</strong> ${t.howItWorks.s2.feature2Desc || 'Sons da natureza, frequências binaurais e melodias relaxantes para potencializar os exercícios.'}</li>
                    <li><strong>${t.howItWorks.s2.feature3 || 'Sessões de 3 a 15 minutos:'}</strong> ${t.howItWorks.s2.feature3Desc || 'Práticas adaptáveis à sua rotina, seja para uma pausa rápida ou um momento mais profundo de autocuidado.'}</li>
                  </ul>
                </div>
                <div class="step-visual">
                  <img src="/images/step-2.png" alt="${t.howItWorks.s2.title}" loading="lazy" style="width: 100%; height: auto; border-radius: 24px;">
                </div>
              </div>

              <!-- Step 3: SOS Panic Button -->
              <div class="step">
                <div class="step-visual">
                  <img src="/images/step-3.png" alt="${t.howItWorks.s3.title}" loading="lazy" style="width: 100%; height: auto; border-radius: 24px;">
                </div>
                <div class="step-content">
                  <h3>${t.howItWorks.s3.title}</h3>
                  <p>${t.howItWorks.s3.description}</p>
                  <ul style="margin-top: 1.5rem; line-height: 2;">
                    <li><strong>${t.howItWorks.s3.feature1 || 'Ativação imediata:'}</strong> ${t.howItWorks.s3.feature1Desc || 'Um toque no botão SOS inicia uma sessão de respiração de emergência com música calmante instantânea.'}</li>
                    <li><strong>${t.howItWorks.s3.feature2 || 'Instruções claras e tranquilizadoras:'}</strong> ${t.howItWorks.s3.feature2Desc || 'Voz guiada que acompanha você durante a crise, ensinando técnicas de regulação emocional em tempo real.'}</li>
                    <li><strong>${t.howItWorks.s3.feature3 || 'Contatos de emergência:'}</strong> ${t.howItWorks.s3.feature3Desc || 'Acesso rápido a CVV (188), SAMU (192) e outros recursos de apoio profissional.'}</li>
                  </ul>
                </div>
              </div>

              <!-- Step 4: Journal & Progress -->
              <div class="step">
                <div class="step-content">
                  <h3>${t.howItWorks.s4.title}</h3>
                  <p>${t.howItWorks.s4.description}</p>
                  <ul style="margin-top: 1.5rem; line-height: 2;">
                    <li><strong>${t.howItWorks.s4.feature1 || 'Registro emocional diário:'}</strong> ${t.howItWorks.s4.feature1Desc || 'Acompanhe seus sentimentos, gatilhos e padrões ao longo do tempo com insights baseados em dados.'}</li>
                    <li><strong>${t.howItWorks.s4.feature2 || 'Gráficos e tendências:'}</strong> ${t.howItWorks.s4.feature2Desc || 'Visualize sua evolução emocional com gráficos intuitivos que mostram como você está progredindo.'}</li>
                    <li><strong>${t.howItWorks.s4.feature3 || 'Recomendações personalizadas:'}</strong> ${t.howItWorks.s4.feature3Desc || 'Com base no seu histórico, Luna sugere práticas e horários ideais para seus exercícios.'}</li>
                  </ul>
                </div>
                <div class="step-visual">
                  <img src="/images/step-4.png" alt="${t.howItWorks.s4.title}" loading="lazy" style="width: 100%; height: auto; border-radius: 24px;">
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA SECTION -->
        <section class="benefits" id="download" style="padding: 6rem 0; text-align: center; background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);">
          <div class="container">
            <h2 style="color: white; font-size: 2.5rem; margin-bottom: 1rem;">${t.cta.finalTitle}</h2>
            <p style="color: rgba(255,255,255,0.9); font-size: 1.25rem; margin-bottom: 2.5rem;">${t.cta.finalSubtitle}</p>
            <div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
              <!-- App Store Badge -->
              <a href="${appStoreUrl}" target="_blank" rel="noopener" class="store-badge-link" style="display: inline-block; transition: transform 0.3s ease; text-decoration: none;">
                <div class="store-badge" style="background: rgba(139, 111, 243, 0.95); border-radius: 12px; padding: 0.75rem 1.5rem; display: flex; align-items: center; gap: 0.875rem; min-width: 180px; box-shadow: 0 4px 12px rgba(139, 111, 243, 0.3); transition: all 0.3s ease;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div style="text-align: left;">
                    <div style="color: rgba(255,255,255,0.9); font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.5px;">${t.cta.downloadOn}</div>
                    <div style="color: white; font-size: 1.125rem; font-weight: 600; line-height: 1.2;">${t.cta.availableOnAppStore}</div>
                  </div>
                </div>
              </a>
              
              <!-- Google Play Badge -->
              <a href="${playStoreUrl}" target="_blank" rel="noopener" class="store-badge-link" style="display: inline-block; transition: transform 0.3s ease; text-decoration: none;">
                <div class="store-badge" style="background: rgba(139, 111, 243, 0.95); border-radius: 12px; padding: 0.75rem 1.5rem; display: flex; align-items: center; gap: 0.875rem; min-width: 180px; box-shadow: 0 4px 12px rgba(139, 111, 243, 0.3); transition: all 0.3s ease;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div style="text-align: left;">
                    <div style="color: rgba(255,255,255,0.9); font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.5px;">${t.cta.getItOn}</div>
                    <div style="color: white; font-size: 1.125rem; font-weight: 600; line-height: 1.2;">${t.cta.availableOnGooglePlay}</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>
      `;
      break;
      
    case 'plans':
      content = `
        <section class="pricing">
          <div class="container">
            <h2>${t.plans.h1}</h2>
            <p class="section-subtitle">${t.plans.subtitle}</p>
            
            <div class="pricing-grid">
              <!-- FREE PLAN -->
              <div class="pricing-card">
                <h3>${t.plans.free.title}</h3>
                <div class="price">${t.plans.free.price}</div>
                <div class="period">${t.plans.free.period}</div>
                <ul class="pricing-features">
                  ${t.plans.free.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <a href="${appPreviewUrl}" class="btn btn-secondary">${t.cta.startFree || 'Começar grátis'}</a>
              </div>
              
              <!-- ANNUAL PLAN - FEATURED -->
              <div class="pricing-card featured">
                <div class="pricing-badge">${t.plans.yearly.badge}</div>
                <h3>${t.plans.yearly.title}</h3>
                <div class="price">${t.plans.yearly.price}</div>
                <div class="period">${t.plans.yearly.period}</div>
                <ul class="pricing-features">
                  ${t.plans.yearly.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <a href="${appPreviewUrl}" class="btn btn-primary">${t.cta.subYearly || 'Assinar anual'}</a>
              </div>
              
              <!-- MONTHLY PLAN -->
              <div class="pricing-card">
                <h3>${t.plans.monthly.title}</h3>
                <div class="price">${t.plans.monthly.price}</div>
                <div class="period">${t.plans.monthly.period}</div>
                <ul class="pricing-features">
                  ${t.plans.monthly.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <a href="${appPreviewUrl}" class="btn btn-secondary">${t.cta.subMonthly || 'Assinar mensal'}</a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 3rem; color: #6B7280; font-size: 0.875rem; max-width: 800px; margin-left: auto; margin-right: auto;">
              <p>${t.plans.legal}</p>
              <p style="margin-top: 0.5rem;">💰 ${t.plans.payment} • 🔒</p>
            </div>
          </div>
        </section>
      `;
      break;
      
    case 'faq':
      content = `
        <section class="faq">
          <div class="container">
            <h2>${t.faq.h1}</h2>
            ${t.faq.subtitle ? `<p class="section-subtitle">${t.faq.subtitle}</p>` : ''}
            
            <div class="faq-list">
              ${t.faq.items.map((item, index) => `
                <div class="faq-item">
                  <button class="faq-question" onclick="this.parentElement.classList.toggle('active')">
                    ${item.q}
                    <span class="faq-icon">›</span>
                  </button>
                  <div class="faq-answer">
                    ${item.a}
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div style="text-align: center; margin-top: 4rem;">
              <p style="font-size: 1.125rem; margin-bottom: 1.5rem; text-align: center; margin-left: auto; margin-right: auto;">${t.faq.more}</p>
              <a href="/contact?lang=${lang}" class="btn btn-primary">${t.cta.contact}</a>
            </div>
          </div>
        </section>
      `;
      break;
      
    case 'contact':
      content = `
        <section class="contact-section">
          <div class="container">
            <h1 style="text-align: center; margin-bottom: 1rem;">${t.contact.h1}</h1>
            <p style="text-align: center; max-width: 600px; margin: 0 auto 3rem; color: var(--ink-600); font-size: 1.125rem;">${t.contact.description}</p>
            
            <form id="contactForm" class="contact-form">
              <div class="form-group">
                <input type="text" name="name" placeholder="${t.contact.form.name}" required>
              </div>
              <div class="form-group">
                <input type="email" name="email" placeholder="${t.contact.form.email}" required>
              </div>
              <div class="form-group">
                <textarea name="message" rows="6" placeholder="${t.contact.form.message}" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">${t.contact.form.submit}</button>
            </form>
            
            <div class="contact-info" style="text-align: center; margin-top: 3rem; width: 100%; display: block;">
              <p style="font-size: 1rem; color: var(--ink-600); text-align: center; margin: 0 auto;"><strong style="color: var(--ink-900);">${t.contact.support.label}</strong> <a href="mailto:${t.contact.support.email}" style="color: var(--brand-primary); text-decoration: none;">${t.contact.support.email}</a></p>
            </div>
          </div>
        </section>
      `;
      break;
  }
  
  // Complete HTML structure
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.meta.title}</title>
  <meta name="description" content="${t.meta.description}">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/favicon.png">
  <link rel="stylesheet" href="/styles/main.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <nav class="container">
      <a href="/?lang=${lang}" class="logo">
        <img src="/logo.png" alt="EaseMind Logo">
      </a>
      <div class="lang-selector">
        <button class="lang-selector-button">
          ${lang === 'pt-BR' ? '🇧🇷 PT' : lang === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'} ▾
        </button>
        <div class="lang-selector-dropdown">
          <a href="?lang=pt-BR" ${lang === 'pt-BR' ? 'class="active"' : ''}>🇧🇷 Português</a>
          <a href="?lang=en" ${lang === 'en' ? 'class="active"' : ''}>🇺🇸 English</a>
          <a href="?lang=es" ${lang === 'es' ? 'class="active"' : ''}>🇪🇸 Español</a>
        </div>
      </div>
    </nav>
  </header>
  
  <main>
    ${content}
  </main>
  
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <img src="/logo-footer.png" alt="EaseMind" style="height: 40px; margin-bottom: 1.25rem;">
          <p>${t.legal.disclaimer || 'Sua terapeuta virtual Luna oferece apoio emocional com empatia e segurança. Não substitui terapia profissional.'}</p>
        </div>
        <div class="footer-links">
          <h4>${t.footer.product}</h4>
          <ul>
            <li><a href="/how-it-works?lang=${lang}">${t.footer.how}</a></li>
            <li><a href="/plans?lang=${lang}">${t.footer.plans}</a></li>
            <li><a href="/faq?lang=${lang}">${t.footer.faq}</a></li>
            <li><a href="/contact?lang=${lang}">${t.footer.contact}</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>${t.footer.legal}</h4>
          <ul>
            <li><a href="/privacy?lang=${lang}">${t.footer.privacy}</a></li>
            <li><a href="/terms?lang=${lang}">${t.footer.terms}</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>${t.footer.download}</h4>
          <ul>
            <li><a href="${appStoreUrl}" target="_blank" rel="noopener">${t.footer.appStore}</a></li>
            <li><a href="${playStoreUrl}" target="_blank" rel="noopener">${t.footer.googlePlay}</a></li>
          </ul>
        </div>
      </div>
      <div class="disclaimer" style="text-align: center;">
        ⚕️ <strong>${t.footer.disclaimerLabel}</strong> ${t.footer.disclaimer}
      </div>
      <div class="footer-bottom" style="text-align: center;">
        <p>${t.footer.copyright}</p>
        <p>${t.footer.madeWith} ❤️ ${t.footer.toHelp}</p>
      </div>
    </div>
  </footer>
  
  ${page === 'contact' ? `
  <script>
    document.getElementById('contactForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        const res = await fetch('/api/website/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (res.ok) {
          alert('${t.contact.form.success}');
          e.target.reset();
        } else {
          alert('${t.contact.form.error}');
        }
      } catch (err) {
        alert('${t.contact.form.error}');
      }
    });
  </script>
  ` : ''}
</body>
</html>
  `;
}

// Admin Routes
app.get('/admin', (req, res) => {
  // Se já está logado, mostra o dashboard
  if (req.session && req.session.isAdmin) {
    return res.sendFile(path.join(__dirname, 'admin.html'));
  }
  
  // Senão, mostra página de login
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EaseMind Admin - Login</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    .login-container {
      background: white;
      padding: 3rem;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      max-width: 400px;
      width: 100%;
    }
    
    .login-container h1 {
      color: #667eea;
      text-align: center;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    
    .login-container p {
      text-align: center;
      color: #718096;
      margin-bottom: 2rem;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    label {
      display: block;
      color: #1a202c;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    input {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s;
    }
    
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }
    
    button {
      width: 100%;
      padding: 1rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    button:hover {
      background: #764ba2;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .error {
      background: #fee;
      color: #c33;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      display: none;
    }
    
    @media (max-width: 480px) {
      .login-container {
        padding: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>🔐 Admin Login</h1>
    <p>EaseMind Dashboard</p>
    
    <div id="error" class="error"></div>
    
    <form id="loginForm">
      <div class="form-group">
        <label for="password">Senha de Acesso</label>
        <input type="password" id="password" name="password" required autofocus>
      </div>
      <button type="submit">Entrar</button>
    </form>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error');
      
      try {
        const res = await fetch('/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
          window.location.href = '/admin';
        } else {
          errorDiv.textContent = data.message || 'Senha incorreta';
          errorDiv.style.display = 'block';
          document.getElementById('password').value = '';
        }
      } catch (err) {
        errorDiv.textContent = 'Erro ao fazer login. Tente novamente.';
        errorDiv.style.display = 'block';
      }
    });
  </script>
</body>
</html>
  `);
});

app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Senha incorreta' });
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Admin API Proxy (proxy requests to backend)
const fetch = require('node-fetch');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

app.get('/api/admin/stats', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/stats`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/admin/popular-sessions', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/popular-sessions`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching popular sessions:', error);
    res.status(500).json({ error: 'Failed to fetch popular sessions' });
  }
});

app.get('/api/admin/mood-distribution', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/mood-distribution`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching mood distribution:', error);
    res.status(500).json({ error: 'Failed to fetch mood distribution' });
  }
});

// Routes
app.get('/', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  res.send(generateHTML('home', lang, t));
});

app.get('/how-it-works', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  res.send(generateHTML('how-it-works', lang, t));
});

app.get('/plans', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  res.send(generateHTML('plans', lang, t));
});

app.get('/faq', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  res.send(generateHTML('faq', lang, t));
});

app.get('/contact', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  res.send(generateHTML('contact', lang, t));
});

app.get('/privacy', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  const html = loadLegal('privacy', lang);
  res.send(`
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.legal.privacy.title} - EaseMind</title>
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="stylesheet" href="/styles/main.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <nav class="container">
      <a href="/?lang=${lang}" class="logo">
        <img src="/logo.png" alt="EaseMind Logo">
      </a>
      <div class="lang-selector">
        <button class="lang-selector-button">
          ${lang === 'pt-BR' ? '🇧🇷 PT' : lang === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'} ▾
        </button>
        <div class="lang-selector-dropdown">
          <a href="?lang=pt-BR" ${lang === 'pt-BR' ? 'class="active"' : ''}>🇧🇷 Português</a>
          <a href="?lang=en" ${lang === 'en' ? 'class="active"' : ''}>🇺🇸 English</a>
          <a href="?lang=es" ${lang === 'es' ? 'class="active"' : ''}>🇪🇸 Español</a>
        </div>
      </div>
    </nav>
  </header>
  <main>
    <div class="container legal-content">
      ${html}
    </div>
  </main>
  <footer>
    <div class="container">
      <p class="copyright">${t.footer.copyright}</p>
    </div>
  </footer>
</body>
</html>
  `);
});

app.get('/terms', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  const html = loadLegal('terms', lang);
  res.send(`
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.legal.terms.title} - EaseMind</title>
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="stylesheet" href="/styles/main.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <nav class="container">
      <a href="/?lang=${lang}" class="logo">
        <img src="/logo.png" alt="EaseMind Logo">
      </a>
      <div class="lang-selector">
        <button class="lang-selector-button">
          ${lang === 'pt-BR' ? '🇧🇷 PT' : lang === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'} ▾
        </button>
        <div class="lang-selector-dropdown">
          <a href="?lang=pt-BR" ${lang === 'pt-BR' ? 'class="active"' : ''}>🇧🇷 Português</a>
          <a href="?lang=en" ${lang === 'en' ? 'class="active"' : ''}>🇺🇸 English</a>
          <a href="?lang=es" ${lang === 'es' ? 'class="active"' : ''}>🇪🇸 Español</a>
        </div>
      </div>
    </nav>
  </header>
  <main>
    <div class="container legal-content">
      ${html}
    </div>
  </main>
  <footer>
    <div class="container">
      <p class="copyright">${t.footer.copyright}</p>
    </div>
  </footer>
</body>
</html>
  `);
});

// Sitemap
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://easemind.io';
  const langs = ['pt-BR', 'en', 'es'];
  const pages = ['', '/how-it-works', '/plans', '/faq', '/contact', '/privacy', '/terms'];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  langs.forEach(lang => {
    pages.forEach(page => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${page}?lang=${lang}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });
  });
  
  xml += '</urlset>';
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\n\nSitemap: https://easemind.io/sitemap.xml`);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ EaseMind Website running on http://0.0.0.0:${PORT}`);
});
