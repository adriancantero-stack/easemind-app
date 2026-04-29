const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (process.env.FIREBASE_CREDENTIALS) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    // Check if already initialized to avoid errors in hot reload
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('🔥 Firebase Admin initialized');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
}

const app = express();
const PORT = process.env.PORT || 9000;

// Admin password (em produção, use variável de ambiente)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'easemind2025';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Trust proxy for correct client IP and protocol detection (needed for Vercel)
app.set('trust proxy', 1);

// Detect if running in production (Vercel sets VERCEL env var)
// For local development, we always use the local backend even if NODE_ENV=production
const isProduction = !!process.env.VERCEL;
console.log('🌐 Environment:', isProduction ? 'PRODUCTION (Vercel)' : 'DEVELOPMENT (Local)');

// Session configuration

app.use(session({
  secret: process.env.SESSION_SECRET || 'easemind-admin-secret-2025',
  name: 'easemind.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false, // Always false for local development (Vercel handles HTTPS)
    sameSite: 'lax',
    path: '/'
  },
  proxy: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/locales', express.static(path.join(__dirname, 'locales')));

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

// Route Mappings for Localization
const routeMap = {
  'home': { 'pt-BR': '', 'en': '', 'es': '' },
  'how-it-works': { 'pt-BR': 'como-funciona', 'en': 'how-it-works', 'es': 'como-funciona' },
  'plans': { 'pt-BR': 'planos', 'en': 'plans', 'es': 'planes' },
  'faq': { 'pt-BR': 'faq', 'en': 'faq', 'es': 'faq' },
  'contact': { 'pt-BR': 'contato', 'en': 'contact', 'es': 'contacto' },
  'about': { 'pt-BR': 'sobre', 'en': 'about', 'es': 'sobre' },
  'privacy': { 'pt-BR': 'privacidade', 'en': 'privacy', 'es': 'privacidad' },
  'terms': { 'pt-BR': 'termos', 'en': 'terms', 'es': 'terminos' },
  'presell': { 'pt-BR': 'pre-venda', 'en': 'presell', 'es': 'pre-venta' }
};

// Reverse map for lookup: { 'pt-BR': { 'como-funciona': 'how-it-works' } }
const reverseRouteMap = {
  'pt-BR': {}, 'en': {}, 'es': {}
};
Object.keys(routeMap).forEach(key => {
  reverseRouteMap['pt-BR'][routeMap[key]['pt-BR']] = key;
  reverseRouteMap['en'][routeMap[key]['en']] = key;
  reverseRouteMap['es'][routeMap[key]['es']] = key;
});

// Helper: Get canonical URL and alternates
function getSeoTags(page, currentLang) {
  const baseUrl = 'https://easemind.io';
  const tags = [];

  // Canonical
  const currentPath = routeMap[page][currentLang];
  const canonicalPath = currentLang === 'en' && currentPath === '' ? '' : `/${currentLang === 'pt-BR' ? 'pt' : currentLang}${currentPath ? '/' + currentPath : ''}`;
  tags.push(`<link rel="canonical" href="${baseUrl}${canonicalPath}" />`);

  // Hreflang
  ['en', 'pt-BR', 'es'].forEach(lang => {
    const path = routeMap[page][lang];
    const urlLangPrefix = lang === 'pt-BR' ? 'pt' : lang;
    const finalUrl = `${baseUrl}/${urlLangPrefix}${path ? '/' + path : ''}`;

    tags.push(`<link rel="alternate" hreflang="${lang}" href="${finalUrl}" />`);
  });

  // x-default (English)
  const defaultPath = routeMap[page]['en'];
  tags.push(`<link rel="alternate" hreflang="x-default" href="${baseUrl}/en${defaultPath ? '/' + defaultPath : ''}" />`);

  return tags.join('\n  ');
}

// Helper: Get Open Graph Tags
function getOpenGraphTags(page, lang, t) {
  const baseUrl = 'https://easemind.io';
  const currentPath = routeMap[page][lang];
  const urlLangPrefix = lang === 'pt-BR' ? 'pt' : lang;
  const url = `${baseUrl}/${urlLangPrefix}${currentPath ? '/' + currentPath : ''}`;
  const image = `${baseUrl}/images/og-image.jpg`; // Ensure this image exists or use a default logo

  return `
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${t.meta.title}" />
  <meta property="og:description" content="${t.meta.description}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:site_name" content="EaseMind" />
  <meta property="og:locale" content="${lang.replace('-', '_')}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t.meta.title}" />
  <meta name="twitter:description" content="${t.meta.description}" />
  <meta name="twitter:image" content="${image}" />
  `;
}

// Helper: Get Schema.org JSON-LD
function getSchemaTags(page, lang, t) {
  const baseUrl = 'https://easemind.io';

  // Organization Schema (Global)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EaseMind",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "sameAs": [
      "https://instagram.com/easemind_app",
      "https://twitter.com/easemind_app"
    ]
  };

  // Mobile Application Schema (Home only)
  let appSchema = null;
  if (page === 'home') {
    appSchema = {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      "name": "EaseMind",
      "operatingSystem": "iOS, Android",
      "applicationCategory": "HealthApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    };
  }

  return `
  <script type="application/ld+json">
    ${JSON.stringify(organizationSchema)}
  </script>
  ${appSchema ? `<script type="application/ld+json">${JSON.stringify(appSchema)}</script>` : ''}
  `;
}

// Helper: Generate HTML template (PREMIUM DESIGN)
function generateHTML(page, lang, t) {
  const pwaUrl = 'https://app.easemind.io';
  const appStoreUrl = 'https://apps.apple.com/app/easemind';  // Legacy
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=io.easemind';  // Legacy
  const appPreviewUrl = 'https://easemind-control.preview.emergentagent.com';

  // Get SEO Tags
  const seoTags = getSeoTags(page, lang);
  const openGraphTags = getOpenGraphTags(page, lang, t);
  const schemaTags = getSchemaTags(page, lang, t);

  let content = '';

  // Generate page-specific content
  switch (page) {
    case 'home':
      content = `
        <!-- HERO SECTION -->
        <section class="hero">
          <div class="container">
            <h1>${t.hero.h1}</h1>
            <p>${t.hero.subtitle}</p>
            <div class="cta-group">
              <a href="https://app.easemind.io/" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${t.cta.download}</a>
              <a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['how-it-works'][lang]}" class="btn btn-secondary">${t.cta.how}</a>
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
            <div style="display: flex; justify-content: center; margin-top: 2rem;">
              <a href="${pwaUrl}" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 3rem; display: inline-flex; align-items: center; gap: 0.75rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                ${t.cta.downloadApp || 'Baixar APP'}
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
            <div style="display: flex; justify-content: center; margin-top: 2rem;">
              <a href="${pwaUrl}" target="_blank" rel="noopener" style="display: inline-block; text-decoration: none;">
                <div style="background: rgba(139, 111, 243, 0.95); border-radius: 16px; padding: 1.25rem 3rem; display: flex; align-items: center; gap: 1rem; min-width: 240px; box-shadow: 0 8px 24px rgba(139, 111, 243, 0.4); transition: all 0.3s ease; cursor: pointer;">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                  </svg>
                  <div style="text-align: left;">
                    <div style="color: white; font-size: 1.5rem; font-weight: 700; line-height: 1.2;">${t.cta.downloadApp || 'Baixar APP'}</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>
      `;
      break;

    case 'plans':
      const paymentLinks = {
        'pt-BR': {
          monthly: 'https://buy.stripe.com/dRm5kDeByfUnavK5qb3oA07',
          yearly: 'https://buy.stripe.com/14A28r1OM9vZfQ43i33oA06'
        },
        'en': {
          monthly: 'https://buy.stripe.com/6oUaEX9hedMfavK6uf3oA04',
          yearly: 'https://buy.stripe.com/4gMbJ10KI9vZ7jy6uf3oA05'
        },
        'es': {
          monthly: 'https://buy.stripe.com/6oUaEX9hedMfavK6uf3oA04',
          yearly: 'https://buy.stripe.com/4gMbJ10KI9vZ7jy6uf3oA05'
        }
      };
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
                <a href="${pwaUrl}" class="btn btn-secondary">${t.cta.startFree || 'Começar grátis'}</a>
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
                <a href="${paymentLinks[lang].yearly}" class="btn btn-primary">${t.cta.subYearly || 'Assinar anual'}</a>
              </div>
              
              <!-- MONTHLY PLAN -->
              <div class="pricing-card">
                <h3>${t.plans.monthly.title}</h3>
                <div class="price">${t.plans.monthly.price}</div>
                <div class="period">${t.plans.monthly.period}</div>
                <ul class="pricing-features">
                  ${t.plans.monthly.features.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <a href="${paymentLinks[lang].monthly}" class="btn btn-secondary">${t.cta.subMonthly || 'Assinar mensal'}</a>
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
              <a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['contact'][lang]}" class="btn btn-primary">${t.cta.contact}</a>
            </div>
          </div>
        </section>
      `;
      break;

    case 'about':
      content = `
        <style>
          .about-hero {
            padding: 8rem 0 4rem;
            text-align: center;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          }
          .about-hero h1 {
            font-size: 3rem;
            margin-bottom: 1.5rem;
            color: #667eea;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .about-hero p {
            font-size: 1.75rem;
            color: var(--ink-800);
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.5;
            font-weight: 700;
          }
          .story-section {
            padding: 6rem 0;
          }
          .story-card {
            background: white;
            border-radius: 24px;
            padding: 3rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
            margin-bottom: 3rem;
            border-left: 6px solid var(--brand-primary);
          }
          .story-card h2 {
            color: var(--brand-primary);
            margin-bottom: 1.5rem;
            font-size: 2rem;
          }
          .story-card p {
            font-size: 1.125rem;
            line-height: 1.8;
            color: var(--ink-700);
            margin-bottom: 1.5rem;
          }
          .story-card .highlight {
            background: rgba(102, 126, 234, 0.1);
            padding: 0.25rem 0.75rem;
            border-radius: 8px;
            font-weight: 600;
            color: var(--brand-primary);
          }
          .mission-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-top: 3rem;
          }
          .mission-card {
            background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
            padding: 2.5rem;
            border-radius: 20px;
            color: white;
            text-align: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
            transition: transform 0.3s;
          }
          .mission-card:hover {
            transform: translateY(-8px);
          }
          .mission-card .icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          .mission-card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
          }
          .mission-card p {
            font-size: 1rem;
            color: #374151 !important;
            line-height: 1.6;
          }
          .team-section {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
            padding: 6rem 0;
            text-align: center;
          }
          .team-section h2 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          .team-section p {
            font-size: 1.125rem;
            color: var(--ink-600);
            max-width: 800px;
            margin: 0 auto 3rem;
            line-height: 1.8;
          }
          @media (max-width: 768px) {
            .about-hero h1 {
              font-size: 2rem;
            }
            .about-hero p {
              font-size: 1.25rem;
              line-height: 1.6;
            }
            .story-card {
              padding: 2rem;
            }
            .story-card h2 {
              font-size: 1.5rem;
            }
          }
        </style>
        
        <!-- HERO SECTION -->
        <section class="about-hero">
          <div class="container">
            <h1>${t.about?.title || 'Nossa História'}</h1>
            <p>${t.about?.subtitle || 'Uma jornada de superação que se transformou em missão de ajudar milhares de pessoas'}</p>
          </div>
        </section>

        <!-- STORY SECTION -->
        <section class="story-section">
          <div class="container">
            <div class="story-card">
              <h2>💜 ${t.about?.origin?.title || 'Onde tudo começou'}</h2>
              <p>${t.about?.origin?.p1 || ''}</p>
              <p>${t.about?.origin?.p2 || ''}</p>
              ${t.about?.origin?.p3 ? `<p>${t.about.origin.p3}</p>` : ''}
              ${t.about?.origin?.p4 ? `<p>${t.about.origin.p4}</p>` : ''}
              ${t.about?.origin?.p5 ? `<p>${t.about.origin.p5}</p>` : ''}
            </div>

            <div class="story-card">
              <h2>🎯 ${t.about?.mission?.title || 'Nossa Missão'}</h2>
              <p>${t.about?.mission?.p1 || ''}</p>
              ${t.about?.mission?.p2 ? `<p>${t.about.mission.p2}</p>` : ''}
              ${t.about?.mission?.list ? `<ul style="list-style: none; padding: 0; margin: 1.5rem 0;">${t.about.mission.list.map(item => `<li style="margin-bottom: 1rem; font-size: 1.125rem;">${item}</li>`).join('')}</ul>` : ''}
              ${t.about?.mission?.p3 ? `<p style="margin-top: 1.5rem; font-style: italic; font-weight: 600;">${t.about.mission.p3}</p>` : ''}
            </div>

            ${t.about?.values?.title ? `<h2 style="text-align: center; font-size: 2.5rem; margin: 4rem 0 2rem; color: var(--brand-primary);">🌍 ${t.about.values.title}</h2>` : ''}
            <div class="mission-grid">
              <div class="mission-card">
                <div class="icon">❤️</div>
                <h3>${t.about?.values?.v1?.title || 'Empatia'}</h3>
                <p>${t.about?.values?.v1?.desc || ''}</p>
              </div>
              <div class="mission-card">
                <div class="icon">💜</div>
                <h3>${t.about?.values?.v2?.title || 'Acessibilidade'}</h3>
                <p>${t.about?.values?.v2?.desc || ''}</p>
              </div>
              <div class="mission-card">
                <div class="icon">🚀</div>
                <h3>${t.about?.values?.v3?.title || 'Inovação humana'}</h3>
                <p>${t.about?.values?.v3?.desc || ''}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- TEAM SECTION -->
        <section class="team-section">
          <div class="container">
            <h2>${t.about?.team?.title || 'Quem Somos'}</h2>
            <p>${t.about?.team?.desc || ''}</p>
            ${t.about?.team?.desc2 ? `<p style="margin-top: 1.5rem;">${t.about.team.desc2}</p>` : ''}
            ${t.about?.team?.desc3 ? `<p style="margin-top: 1.5rem; font-weight: 700; font-size: 1.25rem; color: var(--brand-primary);">${t.about.team.desc3}</p>` : ''}
            <div style="margin-top: 3rem;">
              <a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['contact'][lang]}" class="btn btn-primary" style="font-size: 1.125rem; padding: 1rem 2.5rem;">
                ${t.cta?.contact || 'Entre em Contato'}
              </a>
            </div>
          </div>
        </section>

        <!-- CTA SECTION -->
        <section class="benefits" id="download" style="padding: 6rem 0; text-align: center;">
          <div class="container">
            <h2>${t.about?.cta?.title || 'Faça Parte Dessa Transformação'}</h2>
            <p class="section-subtitle">${t.about?.cta?.subtitle || 'Junte-se a milhares de pessoas que já encontraram apoio e alívio com o EaseMind'}</p>
            <div style="display: flex; justify-content: center; margin-top: 2rem;">
              <a href="https://app.easemind.io" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 3rem; display: inline-flex; align-items: center; gap: 0.75rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                ${t.cta?.downloadApp || 'Baixar APP'}
              </a>
            </div>
          </div>
        </section>
      `;
      break;

    case 'presell':
      // For the presell page, we serve the static HTML file we created, 
      // but we could also inject dynamic SEO tags here if we converted it to a template string.
      // Since we created a full HTML file, we might just read and return it, 
      // OR we can rely on Express static serving if we configure the route handler to sendFile.
      // However, the current server.js architecture generates HTML strings.
      // To fit in, let's read the file content and inject it, or return a placeholder if we want to move logic later.
      // But the simplest valid integration with this specific `generateHTML` switch is to reading the file.
      try {
        return fs.readFileSync(path.join(__dirname, 'presell.html'), 'utf8');
      } catch (e) {
        return '<h1>Error loading presell page</h1>';
      }
      break;

    case 'contact':
      content = `
        <style>
          .contact-section {
            padding: 4rem 1.5rem;
            min-height: 60vh;
            display: flex;
            align-items: center;
          }
          .contact-container {
            max-width: 800px;
            text-align: center;
            margin: 0 auto;
            width: 100%;
          }
          .contact-icon-wrapper {
            background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          }
          .contact-title {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: var(--ink-900);
            line-height: 1.2;
          }
          .contact-description {
            font-size: 1.1rem;
            color: var(--ink-600);
            margin-bottom: 2rem;
            line-height: 1.6;
            padding: 0 1rem;
          }
          .contact-card {
            background: var(--paper);
            border: 2px solid var(--ink-100);
            border-radius: 16px;
            padding: 2rem 1.5rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .contact-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--ink-500);
            margin-bottom: 1rem;
            font-weight: 600;
            text-align: center;
          }
          .contact-email {
            font-size: 1.25rem;
            color: var(--brand-primary);
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 12px;
            transition: all 0.3s;
            word-break: break-all;
          }
          .contact-email:hover {
            background: rgba(102, 126, 234, 0.2);
            transform: translateY(-2px);
          }
          .contact-info {
            font-size: 0.875rem;
            color: var(--ink-500);
            margin-top: 1.5rem;
            line-height: 1.6;
            text-align: center;
          }
          
          @media (min-width: 768px) {
            .contact-section {
              padding: 8rem 2rem;
            }
            .contact-icon-wrapper {
              width: 100px;
              height: 100px;
              margin-bottom: 2rem;
            }
            .contact-title {
              font-size: 2.5rem;
            }
            .contact-description {
              font-size: 1.25rem;
              margin-bottom: 3rem;
            }
            .contact-card {
              padding: 3rem;
            }
            .contact-label {
              font-size: 0.875rem;
            }
            .contact-email {
              font-size: 1.75rem;
              padding: 1rem 2rem;
              word-break: normal;
            }
          }
        </style>
        
        <section class="contact-section">
          <div class="contact-container">
            <div class="contact-icon-wrapper">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            
            <h1 class="contact-title">${t.contact.h1}</h1>
            <p class="contact-description">${t.contact.description}</p>
            
            <div class="contact-card">
              <p class="contact-label">${t.contact.support.label}</p>
              <a href="mailto:${t.contact.support.email}" class="contact-email">${t.contact.support.email}</a>
              <p class="contact-info">
                📧 ${t.contact.emailInfo || 'Envie-nos um email e responderemos em até 24 horas'}
              </p>
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
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-413235931"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-413235931');
  </script>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.meta.title}</title>
  <meta name="description" content="${t.meta.description}">
  <meta name="keywords" content="${t.meta.keywords}">
  
  <!-- SEO Tags (Canonical + Hreflang) -->
  ${seoTags}
  
  <!-- Open Graph & Twitter -->
  ${openGraphTags}
  
  <!-- Schema.org JSON-LD -->
  ${schemaTags}

  <link rel="manifest" href="/manifest.json">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="stylesheet" href="/styles/main.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <nav class="container">
      <a href="/${lang === 'pt-BR' ? 'pt' : lang}" class="logo">
        <img src="/logo.png" alt="EaseMind Logo">
      </a>
      <div class="header-actions">
        <div class="lang-selector">
          <button class="lang-selector-button" aria-label="Select Language">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </button>
          <div class="lang-selector-dropdown">
            <a href="/pt${page === 'home' ? '' : '/' + routeMap[page]['pt-BR']}" ${lang === 'pt-BR' ? 'class="active"' : ''}>🇧🇷 PT</a>
            <a href="/en${page === 'home' ? '' : '/' + routeMap[page]['en']}" ${lang === 'en' ? 'class="active"' : ''}>🇺🇸 EN</a>
            <a href="/es${page === 'home' ? '' : '/' + routeMap[page]['es']}" ${lang === 'es' ? 'class="active"' : ''}>🇪🇸 ES</a>
          </div>
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
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['about'][lang]}">${t.footer.about}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['how-it-works'][lang]}">${t.footer.how}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['plans'][lang]}">${t.footer.plans}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['faq'][lang]}">${t.footer.faq}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['contact'][lang]}">${t.footer.contact}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/blog">Blog</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>${t.footer.legal}</h4>
          <ul>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['privacy'][lang]}">${t.footer.privacy}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['terms'][lang]}">${t.footer.terms}</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>${t.footer.download}</h4>
          <ul>
            <li><a href="${pwaUrl}" target="_blank" rel="noopener">${t.cta.downloadApp || 'Baixar APP'}</a></li>
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
  

</body>
</html>
  `;
}

// Admin Routes
app.get('/admin/check', (req, res) => {
  res.json({ isAdmin: !!req.session?.isAdmin });
});

// Serve educativo page with language-specific routes
app.get('/educativo', (req, res) => {
  res.sendFile(path.join(__dirname, 'educativo.html'));
});

app.get('/pt/educativo', (req, res) => {
  res.sendFile(path.join(__dirname, 'educativo.html'));
});

app.get('/en/educational', (req, res) => {
  res.sendFile(path.join(__dirname, 'educativo.html'));
});

app.get('/es/educativo', (req, res) => {
  res.sendFile(path.join(__dirname, 'educativo.html'));
});

app.get('/admin', (req, res) => {
  // Debug logging
  console.log('🔍 Admin access attempt:', {
    hasSession: !!req.session,
    isAdmin: req.session?.isAdmin,
    sessionID: req.sessionID,
    cookies: req.cookies
  });

  // Se já está logado, mostra o dashboard
  if (req.session && req.session.isAdmin) {
    console.log('✅ Admin authenticated, serving dashboard');
    return res.sendFile(path.join(__dirname, 'admin.html'));
  }

  console.log('❌ Not authenticated, showing login page');
  // Senão, mostra página de login
  res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EaseMind Admin - Login</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon-admin.png">
  <link rel="shortcut icon" type="image/png" href="/favicon-admin.png">
  <link rel="apple-touch-icon" href="/favicon-admin.png">
  
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
    console.log('✅ Admin login script loaded');
    
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ DOM loaded');
      
      const loginForm = document.getElementById('loginForm');
      const passwordInput = document.getElementById('password');
      const errorDiv = document.getElementById('error');
      const submitButton = loginForm.querySelector('button[type="submit"]');
      
      if (!loginForm) {
        console.error('❌ Login form not found!');
        return;
      }
      
      console.log('✅ Form found, adding event listener');
      
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('🔐 Form submitted');
        
        const password = passwordInput.value;
        console.log('📝 Password length:', password.length);
        
        if (!password) {
          errorDiv.textContent = 'Por favor, digite a senha';
          errorDiv.style.display = 'block';
          return;
        }
        
        // Disable button during submission
        submitButton.disabled = true;
        submitButton.textContent = 'Entrando...';
        
        try {
          console.log('🌐 Sending request to /admin/login');
          
          const res = await fetch('/admin/login', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ password }),
            credentials: 'same-origin'
          });
          
          console.log('📡 Response status:', res.status);
          
          const data = await res.json();
          console.log('📦 Response data:', data);
          
          if (res.ok && data.success) {
            console.log('✅ Login successful, redirecting...');
            errorDiv.style.display = 'none';
            submitButton.textContent = '✓ Sucesso!';
            setTimeout(() => {
              window.location.href = '/admin';
            }, 500);
          } else {
            console.log('❌ Login failed:', data.message);
            errorDiv.textContent = data.message || 'Senha incorreta';
            errorDiv.style.display = 'block';
            passwordInput.value = '';
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
          }
        } catch (err) {
          console.error('❌ Error during login:', err);
          errorDiv.textContent = 'Erro ao fazer login. Tente novamente. (' + err.message + ')';
          errorDiv.style.display = 'block';
          submitButton.disabled = false;
          submitButton.textContent = 'Entrar';
        }
      });
      
      // Also handle Enter key
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          console.log('⌨️ Enter key pressed');
          loginForm.dispatchEvent(new Event('submit'));
        }
      });
    });
  </script>
</body>
</html>
  `);
});

app.post('/admin/login', (req, res) => {
  const { password } = req.body;

  console.log('🔐 Login attempt received');
  console.log('Session before login:', {
    hasSession: !!req.session,
    sessionID: req.sessionID
  });

  if (password === ADMIN_PASSWORD) {
    console.log('✅ Password correct, creating session');
    req.session.isAdmin = true;
    req.session.save((err) => {
      if (err) {
        console.error('❌ Error saving session:', err);
        return res.status(500).json({ success: false, message: 'Erro ao salvar sessão' });
      }
      console.log('✅ Admin session created successfully:', {
        sessionID: req.sessionID,
        isAdmin: req.session.isAdmin,
        cookie: req.session.cookie,
        cookieHeader: res.getHeader('Set-Cookie')
      });
      res.json({ success: true });
    });
  } else {
    console.log('❌ Password incorrect');
    res.status(401).json({ success: false, message: 'Senha incorreta' });
  }
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Admin API Proxy
// In production (Vercel), use serverless functions in /api/ folder
// In development, use local FastAPI backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

const getApiUrl = (endpoint) => {
  if (isProduction) {
    // In production (Vercel), use the serverless functions
    // Map the endpoint names to the serverless function files
    const endpointMap = {
      '/api/admin/subscriptions': '/api/admin_subscriptions',
      '/api/admin/subscription': '/api/admin_subscription',
      '/api/admin/stats': '/api/admin_stats',
      '/api/admin/popular-sessions': '/api/popular_sessions',
      '/api/admin/mood-distribution': '/api/mood_distribution',
      '/api/list_users': '/api/list_users'
    };
    return endpointMap[endpoint] || endpoint;
  } else {
    // In development, use the local backend
    return `${BACKEND_URL}${endpoint}`;
  }
};

app.get('/api/admin/stats', async (req, res) => {
  console.log('📊 Stats endpoint called:', {
    hasSession: !!req.session,
    isAdmin: req.session?.isAdmin,
    isProduction
  });

  if (!req.session || !req.session.isAdmin) {
    console.log('❌ Unauthorized: No valid admin session');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const url = getApiUrl('/api/admin/stats');

    // In production, make request to same domain
    const fullUrl = isProduction ? `${req.protocol}://${req.get('host')}${url}` : url;

    console.log(`🌐 Fetching stats from: ${fullUrl}`);
    const response = await fetch(fullUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error: ${response.status} - ${errorText}`);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Stats fetched successfully');
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching stats:', error.message);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: error.message,
      isProduction
    });
  }
});

app.get('/api/admin/popular-sessions', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const url = getApiUrl('/api/admin/popular-sessions');
    const fullUrl = isProduction ? `${req.protocol}://${req.get('host')}${url}` : url;

    console.log(`🌐 Fetching popular sessions from: ${fullUrl}`);
    const response = await fetch(fullUrl);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Popular sessions fetched successfully');
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching popular sessions:', error.message);
    res.status(500).json({ error: 'Failed to fetch popular sessions', details: error.message });
  }
});

app.get('/api/admin/mood-distribution', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const url = getApiUrl('/api/admin/mood-distribution');
    const fullUrl = isProduction ? `${req.protocol}://${req.get('host')}${url}` : url;

    console.log(`🌐 Fetching mood distribution from: ${fullUrl}`);
    const response = await fetch(fullUrl);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Mood distribution fetched successfully');
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching mood distribution:', error.message);
    res.status(500).json({ error: 'Failed to fetch mood distribution', details: error.message });
  }
});

// Subscription Management Endpoints
app.get('/api/admin/subscriptions', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const url = getApiUrl('/api/subscriptions');
    const fullUrl = isProduction ? `${req.protocol}://${req.get('host')}${url}` : url;
    console.log(`🌐 Fetching subscriptions from: ${fullUrl}`);
    const response = await fetch(fullUrl);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching subscriptions:', error.message);
    res.status(500).json({ error: 'Failed to fetch subscriptions', details: error.message });
  }
});

app.post('/api/admin/subscription', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { uid, plan } = req.body;
  try {
    const url = getApiUrl('/api/subscription');
    const fullUrl = isProduction ? `${req.protocol}://${req.get('host')}${url}` : url;
    console.log(`🌐 Updating subscription for ${uid} to ${plan} via: ${fullUrl}`);
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, plan })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('❌ Error updating subscription:', error.message);
    res.status(500).json({ error: 'Failed to update subscription', details: error.message });
  }
});

// Simple proxy to backend for all admin APIs
app.all('/api/backend/*', async (req, res) => {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Extract the path after /api/backend/
    const backendPath = req.path.replace('/api/backend', '/api');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8001';
    const url = `${backendUrl}${backendPath}`;

    console.log(`📡 Proxying to backend: ${req.method} ${url}`);

    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Backend proxy error:', error.message);
    res.status(500).json({ error: 'Backend error', details: error.message });
  }
});

app.delete('/api/admin/delete-user/:firebase_uid', async (req, res) => {
  console.log('🗑️ Delete user request received:', {
    hasSession: !!req.session,
    isAdmin: req.session?.isAdmin,
    sessionID: req.sessionID,
    firebase_uid: req.params.firebase_uid
  });

  if (!req.session || !req.session.isAdmin) {
    console.log('❌ Unauthorized delete attempt - no valid session');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { firebase_uid } = req.params;

    let url;
    if (isProduction) {
      // In production (Vercel), use serverless function
      url = `${req.protocol}://${req.get('host')}/api/delete_user/${firebase_uid}`;
    } else {
      // In development, use backend FastAPI
      url = `http://localhost:8001/api/admin/delete-user/${firebase_uid}`;
    }

    console.log(`🗑️ Deleting user ${firebase_uid} via: ${url}`);
    const response = await fetch(url, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ User deleted successfully');
    res.json(data);
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});

// Routes


// Blog Routes

// Blog Index Route
app.get(['/pt/blog', '/en/blog', '/es/blog'], (req, res) => {
  const pathParts = req.path.split('/');
  const langCode = pathParts[1]; // 'pt', 'en', 'es'
  const lang = langCode === 'pt' ? 'pt-BR' : langCode;
  
  const t = loadTranslations(lang);
  
  try {
    const blogDataPath = path.join(__dirname, 'blog_data.json');
    if (!fs.existsSync(blogDataPath)) {
        return res.status(404).send("Blog data not found");
    }
    const blogData = JSON.parse(fs.readFileSync(blogDataPath, 'utf8'));
    
    // FILTRO GARANTIDO: Filtra apenas artigos que correspondem EXATAMENTE ao idioma da URL
    const articles = blogData.articles.filter(a => {
        if (lang === 'pt-BR') return a.lang === 'pt-BR';
        return a.lang === lang;
    });
    
    res.send(generateBlogIndexHTML(articles, lang, t));
  } catch (error) {
    console.error('Error loading blog index:', error);
    res.status(500).send("Internal Server Error");
  }
});

app.get(['/pt/blog/:slug', '/en/blog/:slug', '/es/blog/:slug'], (req, res) => {
  const slug = req.params.slug;
  const pathParts = req.path.split('/');
  const langCode = pathParts[1]; // 'pt', 'en', 'es'
  const lang = langCode === 'pt' ? 'pt-BR' : langCode;
  
  const t = loadTranslations(lang);
  
  try {
    const blogDataPath = path.join(__dirname, 'blog_data.json');
    if (!fs.existsSync(blogDataPath)) {
        return res.status(404).send("Blog data not found");
    }
    const blogData = JSON.parse(fs.readFileSync(blogDataPath, 'utf8'));
    
    // Busca robusta: 
    // 1. Tenta slug exato
    // 2. Tenta slug sem o sufixo de idioma (ex: 'anxiety-relief' em vez de 'anxiety-relief-en')
    let article = blogData.articles.find(a => a.slug === slug && a.lang === lang);
    
    if (!article) {
      // Tenta encontrar um artigo que comece com o slug e pertença ao idioma
      article = blogData.articles.find(a => a.slug.startsWith(slug) && a.lang === lang);
    }
    
    if (!article) {
      return res.status(404).send("Article not found");
    }

    res.send(generateBlogHTML(article, lang, t));
  } catch (error) {
    console.error('Error loading blog article:', error);
    res.status(500).send("Internal Server Error");
  }
});

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

app.get('/about', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  res.send(generateHTML('about', lang, t));
});


app.get('/privacy', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  const html = loadLegal('privacy', lang);
  res.send(`
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-413235931"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-413235931');
  </script>
  
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
      <a href="/${lang === 'pt-BR' ? 'pt' : lang}" class="logo">
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
      <div class="footer-content">
        <div class="footer-brand">
          <img src="/logo-footer.png" alt="EaseMind" style="height: 40px; margin-bottom: 1.25rem;">
          <p>${t.legal.disclaimer || 'Sua terapeuta virtual Luna oferece apoio emocional com empatia e segurança. Não substitui terapia profissional.'}</p>
        </div>
        <div class="footer-links">
          <h4>${t.footer.product}</h4>
          <ul>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['about'][lang]}">${t.footer.about}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['how-it-works'][lang]}">${t.footer.how}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['plans'][lang]}">${t.footer.plans}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['faq'][lang]}">${t.footer.faq}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['contact'][lang]}">${t.footer.contact}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/blog">Blog</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>${t.footer.legal}</h4>
          <ul>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['privacy'][lang]}">${t.footer.privacy}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['terms'][lang]}">${t.footer.terms}</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>${t.footer.download}</h4>
          <ul>
            <li><a href="https://app.easemind.io" target="_blank" rel="noopener">${t.cta.downloadApp || 'Baixar APP'}</a></li>
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
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-413235931"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-413235931');
  </script>
  
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
      <a href="/${lang === 'pt-BR' ? 'pt' : lang}" class="logo">
        <img src="/logo.png" alt="EaseMind Logo">
      </a>
      <div class="lang-selector">
        <button class="lang-selector-button" aria-label="Select Language">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
        </button>
        <div class="lang-selector-dropdown">
          <a href="?lang=pt-BR" ${lang === 'pt-BR' ? 'class="active"' : ''}>🇧🇷 PT</a>
          <a href="?lang=en" ${lang === 'en' ? 'class="active"' : ''}>🇺🇸 EN</a>
          <a href="?lang=es" ${lang === 'es' ? 'class="active"' : ''}>🇪🇸 ES</a>
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
      <div class="footer-content">
        <div class="footer-brand">
          <img src="/logo-footer.png" alt="EaseMind" style="height: 40px; margin-bottom: 1.25rem;">
          <p>${t.legal.disclaimer || 'Sua terapeuta virtual Luna oferece apoio emocional com empatia e segurança. Não substitui terapia profissional.'}</p>
        </div>
        <div class="footer-links">
          <h4>${t.footer.product}</h4>
          <ul>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['about'][lang]}">${t.footer.about}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['how-it-works'][lang]}">${t.footer.how}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['plans'][lang]}">${t.footer.plans}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['faq'][lang]}">${t.footer.faq}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['contact'][lang]}">${t.footer.contact}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/blog">Blog</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>${t.footer.legal}</h4>
          <ul>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['privacy'][lang]}">${t.footer.privacy}</a></li>
            <li><a href="/${lang === 'pt-BR' ? 'pt' : lang}/${routeMap['terms'][lang]}">${t.footer.terms}</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>${t.footer.download}</h4>
          <ul>
            <li><a href="https://app.easemind.io" target="_blank" rel="noopener">${t.cta.downloadApp || 'Baixar APP'}</a></li>
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
</body>
</html>
  `);
});

// Here I will replace the ROUTES.

// Root redirect
app.get('/', (req, res) => {
  // Check if it's a legacy query param request
  if (req.query.lang) {
    const lang = req.query.lang;
    const urlPrefix = lang === 'pt-BR' ? 'pt' : lang;
    return res.redirect(301, `/${urlPrefix}`);
  }

  // Detect language and redirect
  const lang = detectLanguage(req);
  const urlPrefix = lang === 'pt-BR' ? 'pt' : lang;
  res.redirect(302, `/${urlPrefix}`);
});

// Legacy redirects (Query params to new URLs)
const legacyPages = ['how-it-works', 'plans', 'faq', 'contact', 'about', 'privacy', 'terms'];
legacyPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    const lang = detectLanguage(req);
    const urlPrefix = lang === 'pt-BR' ? 'pt' : lang;
    // Find the localized slug
    // We need to know which page key this corresponds to. 
    // Since legacy pages match the keys in routeMap (mostly), we can map them.
    const key = page;
    const newSlug = routeMap[key][lang];
    res.redirect(301, `/${urlPrefix}/${newSlug}`);
  });
});

// Dynamic Route Handler for Localized Pages
// /:lang/:slug
app.get('/:langPrefix/:slug?', (req, res, next) => {
  const { langPrefix, slug } = req.params;

  // Validate language prefix
  if (!['pt', 'en', 'es'].includes(langPrefix)) {
    return next(); // Not a language route, maybe a static file or API
  }

  const lang = langPrefix === 'pt' ? 'pt-BR' : langPrefix;

  // Handle Home (empty slug)
  if (!slug) {
    const t = loadTranslations(lang);
    return res.send(generateHTML('home', lang, t));
  }

  // Handle Internal Pages
  // Find which page key corresponds to this slug for this language
  const pageKey = reverseRouteMap[lang][slug];

  if (pageKey) {
    const t = loadTranslations(lang);
    if (['privacy', 'terms'].includes(pageKey)) {
      // Legal pages use specific loader
      const html = loadLegal(pageKey, lang);
      // We need to wrap this in the layout or update generateHTML to handle legal content
      // For now, let's use a simple wrapper similar to before but with SEO tags
      // Actually, the previous code had inline HTML for privacy/terms. 
      // Let's use generateHTML if possible, or keep the inline logic but improved.
      // The previous code for privacy was:
      /*
      app.get('/privacy', (req, res) => {
        const lang = detectLanguage(req);
        const t = loadTranslations(lang);
        const html = loadLegal('privacy', lang);
        res.send(`...`);
      });
      */
      // I will create a helper to render legal pages to keep it clean.
      return res.send(renderLegalPage(pageKey, lang, t, html));
    }
    return res.send(generateHTML(pageKey, lang, t));
  }

  // 404 for this language
  res.status(404).send('Page not found');
});

// Helper for Legal Pages (Privacy/Terms)
function renderLegalPage(type, lang, t, content) {
  const seoTags = getSeoTags(type, lang);
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-413235931"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'AW-413235931');
  </script>
  
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.legal[type].title} - EaseMind</title>
  ${seoTags}
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="stylesheet" href="/styles/main.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { color: #2D3748; margin-bottom: 2rem; }
    h2 { color: #4A5568; margin-top: 2rem; }
    p { margin-bottom: 1rem; }
    .back-link { display: inline-block; margin-bottom: 2rem; color: #667EEA; text-decoration: none; font-weight: 500; }
    .back-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <a href="/${lang === 'pt-BR' ? 'pt' : lang}" class="back-link">← ${t.nav.home}</a>
  ${content}
</body>
</html>
  `;
}

// Sitemap
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://easemind.io';
  const lastMod = new Date().toISOString().split('T')[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
  xml += 'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  // Generate URLs for all pages in all languages
  Object.keys(routeMap).forEach(pageKey => {
    ['pt-BR', 'en', 'es'].forEach(lang => {
      const urlPrefix = lang === 'pt-BR' ? 'pt' : lang;
      const slug = routeMap[pageKey][lang];
      const path = slug ? `/${slug}` : '';
      const loc = `${baseUrl}/${urlPrefix}${path}`;

      xml += `  <url>\n`;
      xml += `    <loc>${loc}</loc>\n`;
      xml += `    <lastmod>${lastMod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${pageKey === 'home' ? '1.0' : '0.8'}</priority>\n`;

      // Hreflangs
      ['pt-BR', 'en', 'es'].forEach(altLang => {
        if (altLang !== lang) {
          const altPrefix = altLang === 'pt-BR' ? 'pt' : altLang;
          const altSlug = routeMap[pageKey][altLang];
          const altPath = altSlug ? `/${altSlug}` : '';
          xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${baseUrl}/${altPrefix}${altPath}" />\n`;
        }
      });

      xml += `  </url>\n`;
    });
  });

  // Educational Pages (Pre-sell) - Keep existing logic but update URLs if needed
  // User didn't explicitly ask to change these, but for consistency:
  // /pt/educativo, /en/educational, /es/educativo match the pattern /:lang/:slug
  // We can add them to routeMap or keep them separate if they use a different template (educativo.html)
  // They use `educativo.html`, so we should handle them separately or integrate.
  // Let's keep them explicit for now to avoid breaking the static file serving.

  const eduPages = [
    { lang: 'pt-BR', path: '/pt/educativo' },
    { lang: 'en', path: '/en/educational' },
    { lang: 'es', path: '/es/educativo' }
  ];

  eduPages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    eduPages.forEach(altPage => {
      if (altPage.lang !== page.lang) {
        xml += `    <xhtml:link rel="alternate" hreflang="${altPage.lang}" href="${baseUrl}${altPage.path}" />\n`;
      }
    });
    xml += `  </url>\n`;
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





function generateBlogHTML(article, lang, t) {
  const baseUrl = 'https://easemind.io';
  const urlLangPrefix = lang === 'pt-BR' ? 'pt' : lang;
  const url = `${baseUrl}/${urlLangPrefix}/blog/${article.slug}`;
  
  const seoTags = `
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${article.title}" />
    <meta property="og:description" content="${article.description}" />
    <meta property="og:image" content="${baseUrl}${article.image}" />
    <meta property="og:url" content="${url}" />
  `;

  
  let cleanContent = article.content;
  // Remove o primeiro H1 (# Título) se ele existir no início do conteúdo
  cleanContent = cleanContent.replace(/^#\s+.*$/m, '').trim();


  const bodyContent = `
    <article class="blog-post container" style="max-width: 800px; margin: 0 auto; padding: 2rem 1.5rem; background: white;">
      <header class="post-header" style="margin-bottom: 3.5rem; text-align: center; background: white; padding: 2rem 0;">
        <span class="category" style="display: inline-block; background: #f3f4f6; color: #4b5563; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em;">${article.category}</span>
        <h1 style="font-size: 2.5rem; font-weight: 800; color: #111827; line-height: 1.2; margin-bottom: 1.5rem; letter-spacing: -0.02em;">${article.title}</h1>
        <div class="post-meta" style="color: #9ca3af; font-size: 0.875rem; font-weight: 500;">
          <time datetime="${article.date}">${new Date(article.date).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
        </div>
      </header>
      
      <div class="post-content" style="font-size: 1.125rem; line-height: 1.8; color: #374151;">
        ${marked.parse(cleanContent)}
      </div>

      <footer class="post-footer" style="margin-top: 6rem; padding: 4rem 2rem; border: 1px solid #f3f4f6; border-radius: 1.5rem; text-align: center; background: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
        <h3 style="font-size: 1.75rem; font-weight: 800; color: #111827; margin-bottom: 1rem;">Try EaseMind</h3>
        <p style="color: #6b7280; margin-bottom: 2.5rem; font-size: 1.125rem; max-width: 500px; margin-left: auto; margin-right: auto;">${t.cta.subtitle || 'Your journey to mental wellness starts here.'}</p>
        <a href="https://app.easemind.io/" class="btn btn-primary" style="display: inline-block; background: #4f46e5; color: white; padding: 1.25rem 3rem; border-radius: 1rem; font-weight: 700; text-decoration: none; font-size: 1.125rem; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);">
          ${lang === 'pt-BR' ? 'Baixar EaseMind' : lang === 'es' ? 'Descargar EaseMind' : 'Download EaseMind'}
        </a>
      </footer>
    </article>
  `;

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title} - EaseMind</title>
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="stylesheet" href="/styles/main.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  ${seoTags}
  <style>
    body { background-color: white !important; color: #111827; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    header.site-header { background: white; border-bottom: 1px solid #f3f4f6; padding: 1.25rem 0; position: relative; z-index: 100; }
    .post-content h2 { font-size: 1.75rem; font-weight: 800; color: #111827; margin-top: 3.5rem; margin-bottom: 1.5rem; letter-spacing: -0.01em; }
    .post-content p { margin-bottom: 1.75rem; }
    .post-content ul, .post-content ol { margin-bottom: 2rem; padding-left: 1.5rem; }
    .post-content li { margin-bottom: 0.75rem; }
    .post-content strong { color: #111827; font-weight: 700; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }
    .logo img { height: 36px; }
    footer.site-footer { background: #f9fafb; padding: 5rem 0; margin-top: 8rem; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <header class="site-header">
    <nav class="container" style="display: flex; justify-content: space-between; align-items: center;">
      <a href="/${urlLangPrefix}" class="logo">
        <img src="/logo.png" alt="EaseMind Logo">
      </a>
      <a href="/${urlLangPrefix}/blog" style="text-decoration: none; color: #4b5563; font-weight: 600; font-size: 0.875rem;">&larr; Voltar ao Blog</a>
    </nav>
  </header>
  <main>
    ${bodyContent}
  </main>
  
  
  <footer class="site-footer" style="background: #1a202c; color: white; padding: 4rem 0; margin-top: 4rem;">
    <div class="container" style="max-width: 1100px; margin: 0 auto; padding: 0 1.5rem;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 3rem; margin-bottom: 4rem; text-align: left;">
        <div class="footer-brand">
          <img src="/logo-footer.png" alt="EaseMind" style="height: 40px; margin-bottom: 1.5rem;">
          <p style="color: #a0aec0; line-height: 1.6; font-size: 0.9375rem;">${t.legal.disclaimer || 'EaseMind é um aplicativo de apoio emocional e não substitui terapia, diagnóstico ou tratamento médico.'}</p>
        </div>
        <div>
          <h4 style="color: white; font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">${t.footer.product}</h4>
          <ul style="list-style: none; padding: 0; line-height: 2;">
            <li><a href="/${urlLangPrefix}/${routeMap['about'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.about}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['how-it-works'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.how}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['plans'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.plans}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['faq'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.faq}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['contact'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.contact}</a></li>
            <li><a href="/${urlLangPrefix}/blog" style="color: white; text-decoration: none; font-weight: 600;">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4 style="color: white; font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">${t.footer.legal}</h4>
          <ul style="list-style: none; padding: 0; line-height: 2;">
            <li><a href="/${urlLangPrefix}/${routeMap['privacy'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.privacy}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['terms'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.terms}</a></li>
          </ul>
        </div>
        <div>
          <h4 style="color: white; font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">${t.footer.download}</h4>
          <ul style="list-style: none; padding: 0; line-height: 2;">
            <li><a href="https://app.easemind.io" style="color: #a0aec0; text-decoration: none;">${t.cta.downloadApp || 'Comece Agora'}</a></li>
          </ul>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.05); border-radius: 1rem; padding: 2rem; margin: 0 auto 3rem auto; text-align: center; border: 1px solid rgba(255,255,255,0.1); max-width: 900px;">
        <p style="color: #a0aec0; font-size: 0.875rem; margin: 0; line-height: 1.6;">
          ⚕️ <strong>${t.footer.disclaimerLabel}:</strong> ${t.footer.disclaimer}
        </p>
      </div>

      <div style="text-align: center; color: #718096; font-size: 0.875rem; width: 100%;">
        <p style="margin-bottom: 0.5rem; display: block;">${t.footer.copyright}</p>
        <p style="display: block;">${t.footer.madeWith} ❤️ ${t.footer.toHelp}</p>
      </div>
    </div>
  </footer>


</body>
</html>
  `;
}


function generateBlogIndexHTML(articles, lang, t) {
  const baseUrl = 'https://easemind.io';
  const urlLangPrefix = lang === 'pt-BR' ? 'pt' : lang;
  
  const articleCards = articles.map(article => `
    <a href="/${urlLangPrefix}/blog/${article.slug}" style="text-decoration: none; color: inherit;">
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 1rem; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s; height: 100%; display: flex; flex-direction: column;">
        <div style="padding: 1.5rem; flex-grow: 1;">
          <span style="display: inline-block; background: #f3f4f6; color: #4b5563; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-bottom: 1rem;">${article.category}</span>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 0.75rem; line-height: 1.4;">${article.title}</h3>
          <p style="color: #6b7280; font-size: 0.875rem; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${article.description}</p>
        </div>
        <div style="padding: 1rem 1.5rem; border-top: 1px solid #f3f4f6; color: #4f46e5; font-weight: 600; font-size: 0.875rem;">
          ${lang === 'pt-BR' ? 'Ler mais' : lang === 'es' ? 'Leer más' : 'Read more'} &rarr;
        </div>
      </div>
    </a>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog - EaseMind</title>
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="stylesheet" href="/styles/main.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { background-color: #f9fafb; color: #111827; font-family: 'Inter', sans-serif; }
    header { background: white; border-bottom: 1px solid #e5e7eb; padding: 1rem 0; position: relative; z-index: 50; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; margin: 4rem 0; }
    .blog-header { text-align: center; margin: 4rem 0; }
    .blog-header h1 { font-size: 3rem; font-weight: 800; color: #111827; margin-bottom: 1rem; }
    .blog-header p { font-size: 1.25rem; color: #6b7280; max-width: 600px; margin: 0 auto; }
    footer.site-footer { background: white; padding: 4rem 0; border-top: 1px solid #e5e7eb; margin-top: 4rem; }
  </style>
</head>
<body>
  <header>
    <nav class="container">
      <a href="/${urlLangPrefix}" class="logo">
        <img src="/logo.png" alt="EaseMind Logo" style="height: 40px;">
      </a>
    </nav>
  </header>
  <main class="container">
    <div class="blog-header">
      <h1>Blog</h1>
      <p>${lang === 'pt-BR' ? 'Dicas e guias para sua saúde mental e bem-estar.' : lang === 'es' ? 'Consejos y guías para tu salud mental y bienestar.' : 'Tips and guides for your mental health and wellness.'}</p>
    </div>
    <div class="blog-grid">
      ${articleCards}
    </div>
  </main>
  
  
  <footer class="site-footer" style="background: #1a202c; color: white; padding: 4rem 0; margin-top: 4rem;">
    <div class="container" style="max-width: 1100px; margin: 0 auto; padding: 0 1.5rem;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 3rem; margin-bottom: 4rem; text-align: left;">
        <div class="footer-brand">
          <img src="/logo-footer.png" alt="EaseMind" style="height: 40px; margin-bottom: 1.5rem;">
          <p style="color: #a0aec0; line-height: 1.6; font-size: 0.9375rem;">${t.legal.disclaimer || 'EaseMind é um aplicativo de apoio emocional e não substitui terapia, diagnóstico ou tratamento médico.'}</p>
        </div>
        <div>
          <h4 style="color: white; font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">${t.footer.product}</h4>
          <ul style="list-style: none; padding: 0; line-height: 2;">
            <li><a href="/${urlLangPrefix}/${routeMap['about'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.about}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['how-it-works'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.how}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['plans'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.plans}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['faq'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.faq}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['contact'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.contact}</a></li>
            <li><a href="/${urlLangPrefix}/blog" style="color: white; text-decoration: none; font-weight: 600;">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4 style="color: white; font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">${t.footer.legal}</h4>
          <ul style="list-style: none; padding: 0; line-height: 2;">
            <li><a href="/${urlLangPrefix}/${routeMap['privacy'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.privacy}</a></li>
            <li><a href="/${urlLangPrefix}/${routeMap['terms'][lang]}" style="color: #a0aec0; text-decoration: none;">${t.footer.terms}</a></li>
          </ul>
        </div>
        <div>
          <h4 style="color: white; font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem;">${t.footer.download}</h4>
          <ul style="list-style: none; padding: 0; line-height: 2;">
            <li><a href="https://app.easemind.io" style="color: #a0aec0; text-decoration: none;">${t.cta.downloadApp || 'Comece Agora'}</a></li>
          </ul>
        </div>
      </div>
      
      <div style="background: rgba(255,255,255,0.05); border-radius: 1rem; padding: 2rem; margin: 0 auto 3rem auto; text-align: center; border: 1px solid rgba(255,255,255,0.1); max-width: 900px;">
        <p style="color: #a0aec0; font-size: 0.875rem; margin: 0; line-height: 1.6;">
          ⚕️ <strong>${t.footer.disclaimerLabel}:</strong> ${t.footer.disclaimer}
        </p>
      </div>

      <div style="text-align: center; color: #718096; font-size: 0.875rem; width: 100%;">
        <p style="margin-bottom: 0.5rem; display: block;">${t.footer.copyright}</p>
        <p style="display: block;">${t.footer.madeWith} ❤️ ${t.footer.toHelp}</p>
      </div>
    </div>
  </footer>


</body>
</html>
  `;
}
