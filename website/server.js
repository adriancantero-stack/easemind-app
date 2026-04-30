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

// Helper: Load blog articles
function loadBlogArticles(lang) {
  const blogDataPath = path.join(__dirname, 'data', `blog_data_${lang.replace('-', '_')}.json`);
  if (fs.existsSync(blogDataPath)) {
    return JSON.parse(fs.readFileSync(blogDataPath, 'utf8')).articles;
  }
  return [];
}

// Blog routes
app.get('/(pt|en|es)/blog', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  const articles = loadBlogArticles(lang);

  let blogContent = `
    <section class="blog-list">
      <div class="container">
        <h1>${t.blog.title}</h1>
        <p class="section-subtitle">${t.blog.subtitle}</p>
        <div class="article-grid">
  `;

  articles.forEach(article => {
    blogContent += `
          <div class="article-card">
            <img src="${article.image}" alt="${article.title}" loading="lazy">
            <h3>${article.title}</h3>
            <p>${article.description}</p>
            <a href="/${lang === 'pt-BR' ? 'pt' : lang}/blog/${article.slug}" class="btn btn-secondary">${t.blog.readMore}</a>
          </div>
    `;
  });

  blogContent += `
        </div>
      </div>
    </section>
  `;

  res.send(generateHTML('blog', lang, t, blogContent));
});

app.get('/(pt|en|es)/blog/:slug', (req, res) => {
  const lang = detectLanguage(req);
  const t = loadTranslations(lang);
  const articles = loadBlogArticles(lang);
  const article = articles.find(a => a.slug === req.params.slug);

  if (!article) {
    return res.status(404).send(generateHTML('404', lang, t, '<h1>404: Article Not Found</h1>'));
  }

  const articleContent = marked.parse(article.content);

  let blogDetailContent = `
    <section class="blog-detail">
      <div class="container">
        <h1>${article.title}</h1>
        <p class="article-meta">${t.blog.publishedOn} ${article.date} | ${t.blog.category}: ${article.category}</p>
        <img src="${article.image}" alt="${article.title}" class="article-image" loading="lazy">
        <div class="article-body">
          ${articleContent}
        </div>
        <a href="/${lang === 'pt-BR' ? 'pt' : lang}/blog" class="btn btn-secondary">${t.blog.backToBlog}</a>
      </div>
    </section>
  `;

  res.send(generateHTML('blog-detail', lang, t, blogDetailContent));
});



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
                <h3>${t.howItWorks.s1.title}</h3>
                <p>${t.howItWorks.s1.description}</p>
              </div>
              <div class="step">
                <div class="step-visual">
                  <img src="/images/step-2.png" alt="${t.howItWorks.s2.title}" loading="lazy">
                </div>
                <h3>${t.howItWorks.s2.title}</h3>
                <p>${t.howItWorks.s2.description}</p>
              </div>
              <div class="step">
                <div class="step-visual">
                  <img src="/images/step-3.png" alt="${t.howItWorks.s3.title}" loading="lazy">
                </div>
                <h3>${t.howItWorks.s3.title}</h3>
                <p>${t.howItWorks.s3.description}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- TESTIMONIALS -->
        <section class="testimonials">
          <div class="container">
            <h2>${t.testimonials.title || 'O que nossos usuários dizem'}</h2>
            <div class="testimonial-carousel">
              <div class="testimonial-card">
                <p class="quote">"${t.testimonials.t1.quote}"</p>
                <p class="author">- ${t.testimonials.t1.author}</p>
              </div>
              <div class="testimonial-card">
                <p class="quote">"${t.testimonials.t2.quote}"</p>
                <p class="author">- ${t.testimonials.t2.author}</p>
              </div>
              <div class="testimonial-card">
                <p class="quote">"${t.testimonials.t3.quote}"</p>
                <p class="author">- ${t.testimonials.t3.author}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA SECTION -->
        <section class="cta-section">
          <div class="container">
            <h2>${t.ctaSection.title || 'Comece sua jornada para o bem-estar hoje!'}</h2>
            <p>${t.ctaSection.subtitle || 'Baixe o EaseMind e descubra uma nova forma de cuidar da sua saúde mental.'}</p>
            <a href="https://app.easemind.io/" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${t.cta.download}</a>
          </div>
        </section>
      `;
      break;
    case 'how-it-works':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t.howItWorks.h1}</h1>
            <p>${t.howItWorks.subtitle}</p>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            ${marked.parse(t.howItWorks.content)}
          </div>
        </section>
      `;
      break;
    case 'plans':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t.plans.h1}</h1>
            <p>${t.plans.subtitle}</p>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            ${marked.parse(t.plans.content)}
          </div>
        </section>
      `;
      break;
    case 'faq':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t.faq.h1}</h1>
            <p>${t.faq.subtitle}</p>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            <div class="faq-list">
      `;
      t.faq.questions.forEach((q, index) => {
        content += `
              <div class="faq-item">
                <button class="faq-question">
                  ${q.q}
                  <svg class="arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="faq-answer">
                  <p>${q.a}</p>
                </div>
              </div>
        `;
      });
      content += `
            </div>
          </div>
        </section>
        <script>
          document.querySelectorAll(".faq-question").forEach(button => {
            button.addEventListener("click", () => {
              const faqItem = button.parentElement;
              faqItem.classList.toggle("active");
            });
          });
        </script>
      `;
      break;
    case 'contact':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t.contact.h1}</h1>
            <p>${t.contact.subtitle}</p>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            ${marked.parse(t.contact.content)}
          </div>
        </section>
      `;
      break;
    case 'about':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t.about.h1}</h1>
            <p>${t.about.subtitle}</p>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            ${marked.parse(t.about.content)}
          </div>
        </section>
      `;
      break;
    case 'presell':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t.presell.h1}</h1>
            <p>${t.presell.subtitle}</p>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            ${marked.parse(t.presell.content)}
          </div>
        </section>
      `;
      break;
    case '404':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t['404'].h1}</h1>
            <p>${t['404'].subtitle}</p>
            <a href="/" class="btn btn-primary">${t['404'].backHome}</a>
          </div>
        </section>
      `;
      break;
    case 'blog':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t.blog.title}</h1>
            <p>${t.blog.subtitle}</p>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            <div class="article-grid">
      `;
      // Assuming 'articles' is passed as an additional argument to generateHTML for blog page
      // This part needs to be handled by the route itself, not generateHTML
      content += `
            </div>
          </div>
        </section>
      `;
      break;
    case 'blog-detail':
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t.blog.detail.title}</h1>
            <p>${t.blog.detail.subtitle}</p>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            ${marked.parse(t.blog.detail.content)}
          </div>
        </section>
      `;
      break;
    default:
      content = `
        <section class="page-hero">
          <div class="container">
            <h1>${t['404'].h1}</h1>
            <p>${t['404'].subtitle}</p>
            <a href="/" class="btn btn-primary">${t['404'].backHome}</a>
          </div>
        </section>
      `;
      break;
  }

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
  <title>${t.meta.title} - EaseMind</title>
  <meta name="description" content="${t.meta.description}">
  ${seoTags}
  ${openGraphTags}
  ${schemaTags}
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
  <script>
    // Language selector dropdown functionality
    const langSelectorButton = document.querySelector('.lang-selector-button');
    const langSelectorDropdown = document.querySelector('.lang-selector-dropdown');

    if (langSelectorButton && langSelectorDropdown) {
      langSelectorButton.addEventListener('click', () => {
        langSelectorDropdown.classList.toggle('show');
      });

      // Close the dropdown if the user clicks outside of it
      window.addEventListener('click', (event) => {
        if (!event.target.matches('.lang-selector-button') && !event.target.matches('.lang-selector-button *')) {
          if (langSelectorDropdown.classList.contains('show')) {
            langSelectorDropdown.classList.remove('show');
          }
        }
      });
    }
  </script>
</body>
</html>
  `;
}

// Routes

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
app.get("/:langPrefix/:slug?", (req, res, next) => {
  const { langPrefix, slug } = req.params;

  // Validate language prefix
  if (!["pt", "en", "es"].includes(langPrefix)) {
    return next(); // Not a language route, maybe a static file or API
  }

  const lang = langPrefix === "pt" ? "pt-BR" : langPrefix;

  // Handle Home (empty slug)
  if (!slug) {
    const t = loadTranslations(lang);
    return res.send(generateHTML("home", lang, t));
  }

  // Handle other localized pages
  const pageKey = reverseRouteMap[lang][slug];
  if (pageKey) {
    const t = loadTranslations(lang);
    return res.send(generateHTML(pageKey, lang, t));
  }

  next(); // No matching localized page found
});