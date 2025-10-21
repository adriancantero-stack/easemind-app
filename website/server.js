const express = require('express');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const app = express();
const PORT = process.env.PORT || 9000;

// Middleware
app.use(express.json());
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
  const appPreviewUrl = 'https://calm-space-12.preview.emergentagent.com';
  
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
              <a href="${appPreviewUrl}" class="btn btn-primary" target="_blank" rel="noopener">${t.cta.download}</a>
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
                <div class="benefit-icon">💬</div>
                <h3>${t.benefits.b1.title}</h3>
                <p>${t.benefits.b1.description}</p>
              </div>
              <div class="benefit-card">
                <div class="benefit-icon">🎵</div>
                <h3>${t.benefits.b2.title}</h3>
                <p>${t.benefits.b2.description}</p>
              </div>
              <div class="benefit-card">
                <div class="benefit-icon">🆘</div>
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
                <div class="step-visual">💭</div>
                <div class="step-content">
                  <h3>${t.howItWorks.s1.title}</h3>
                  <p>${t.howItWorks.s1.description}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-visual">🎧</div>
                <div class="step-content">
                  <h3>${t.howItWorks.s2.title}</h3>
                  <p>${t.howItWorks.s2.description}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-visual">🚨</div>
                <div class="step-content">
                  <h3>${t.howItWorks.s3.title}</h3>
                  <p>${t.howItWorks.s3.description}</p>
                </div>
              </div>
              <div class="step">
                <div class="step-visual">📔</div>
                <div class="step-content">
                  <h3>${t.howItWorks.s4?.title || 'Diário Emocional'}</h3>
                  <p>${t.howItWorks.s4?.description || 'Registre seus sentimentos e acompanhe seu progresso ao longo do tempo.'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA FINAL -->
        <section class="benefits" style="padding: 4rem 0; text-align: center;">
          <div class="container">
            <h2>${t.cta.finalTitle || 'Pronto para começar?'}</h2>
            <p class="section-subtitle">${t.cta.finalSubtitle || 'Baixe o EaseMind e encontre calma em poucos minutos'}</p>
            <div class="cta-group">
              <a href="${appPreviewUrl}" class="btn btn-primary" target="_blank" rel="noopener">${t.cta.download}</a>
            </div>
          </div>
        </section>
      `;
      break;
      
    case 'how-it-works':
      content = `
        <section class="how-section">
          <div class="container">
            <h1>${t.howItWorks.h1}</h1>
            <div class="how-grid">
              <div class="how-item">
                <h3>${t.howItWorks.s1.title}</h3>
                <p>${t.howItWorks.s1.description}</p>
              </div>
              <div class="how-item">
                <h3>${t.howItWorks.s2.title}</h3>
                <p>${t.howItWorks.s2.description}</p>
              </div>
              <div class="how-item">
                <h3>${t.howItWorks.s3.title}</h3>
                <p>${t.howItWorks.s3.description}</p>
              </div>
              <div class="how-item">
                <h3>${t.howItWorks.s4.title}</h3>
                <p>${t.howItWorks.s4.description}</p>
              </div>
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
            <p class="section-subtitle">${t.plans.subtitle || 'Escolha o plano ideal para você'}</p>
            
            <div class="pricing-grid">
              <!-- FREE PLAN -->
              <div class="pricing-card">
                <h3>${t.plans.free.title}</h3>
                <div class="price">R$ 0</div>
                <div class="period">${t.plans.free.period || 'Grátis para sempre'}</div>
                <ul class="pricing-features">
                  <li>Conversas ilimitadas com Luna</li>
                  <li>3 sessões guiadas por semana</li>
                  <li>Botão SOS básico</li>
                  <li>Diário emocional</li>
                </ul>
                <a href="${appPreviewUrl}" class="btn btn-secondary">${t.cta.startFree || 'Começar grátis'}</a>
              </div>
              
              <!-- ANNUAL PLAN - FEATURED -->
              <div class="pricing-card featured">
                <div class="pricing-badge">✨ Mais econômico</div>
                <h3>${t.plans.yearly.title || 'Premium Anual'}</h3>
                <div class="price">R$ 199,90</div>
                <div class="period">~R$ 16,66/mês • economize 30%</div>
                <ul class="pricing-features">
                  <li>✓ Sessões ilimitadas com música</li>
                  <li>✓ Voz natural da Luna (TTS)</li>
                  <li>✓ SOS avançado com respiração</li>
                  <li>✓ Diário completo + tendências</li>
                  <li>✓ Suporte prioritário</li>
                  <li>✓ Conteúdo exclusivo</li>
                </ul>
                <a href="${appPreviewUrl}" class="btn btn-primary">${t.cta.subYearly || 'Assinar anual'}</a>
              </div>
              
              <!-- MONTHLY PLAN -->
              <div class="pricing-card">
                <h3>${t.plans.monthly.title || 'Premium Mensal'}</h3>
                <div class="price">R$ 29,90</div>
                <div class="period">por mês</div>
                <ul class="pricing-features">
                  <li>✓ Sessões ilimitadas com música</li>
                  <li>✓ Voz natural da Luna (TTS)</li>
                  <li>✓ SOS avançado com respiração</li>
                  <li>✓ Diário completo + tendências</li>
                  <li>✓ Suporte prioritário</li>
                  <li>✓ Conteúdo exclusivo</li>
                </ul>
                <a href="${appPreviewUrl}" class="btn btn-secondary">${t.cta.subMonthly || 'Assinar mensal'}</a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 3rem; color: #6B7280; font-size: 0.875rem;">
              <p>${t.plans.legal || 'Pagamentos seguros via App Store/Google Play. Cancele a qualquer momento.'}</p>
              <p style="margin-top: 0.5rem;">💰 Aceitamos cartões de crédito, débito e PIX • 🔒 Dados protegidos</p>
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
            <p class="section-subtitle">${t.faq.subtitle || 'Perguntas frequentes'}</p>
            
            <div class="faq-list">
              ${t.faq.items.map((item, index) => `
                <div class="faq-item">
                  <button class="faq-question">
                    ${item.q}
                    <span>›</span>
                  </button>
                  <div class="faq-answer">
                    ${item.a}
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div style="text-align: center; margin-top: 4rem;">
              <p style="font-size: 1.125rem; margin-bottom: 1.5rem;">${t.faq.more || 'Ainda tem dúvidas?'}</p>
              <a href="/contact?lang=${lang}" class="btn btn-primary">${t.cta.contact || 'Entre em contato'}</a>
            </div>
          </div>
        </section>
      `;
      break;
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
      break;
      
    case 'contact':
      content = `
        <section class="contact-section">
          <div class="container">
            <h1>${t.contact.h1}</h1>
            <p>${t.contact.description}</p>
            
            <form id="contactForm" class="contact-form">
              <input type="text" name="name" placeholder="${t.contact.form.name}" required>
              <input type="email" name="email" placeholder="${t.contact.form.email}" required>
              <textarea name="message" rows="6" placeholder="${t.contact.form.message}" required></textarea>
              <button type="submit" class="btn btn-primary">${t.contact.form.submit}</button>
            </form>
            
            <div class="contact-info">
              <p><strong>${t.contact.support.label}</strong> <a href="mailto:${t.contact.support.email}">${t.contact.support.email}</a></p>
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
  <link rel="stylesheet" href="/styles/main.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <nav class="container">
      <a href="/?lang=${lang}" class="logo">EaseMind</a>
      <div class="nav-links">
        <a href="/?lang=${lang}">${t.nav.home}</a>
        <a href="/how-it-works?lang=${lang}">${t.nav.how}</a>
        <a href="/plans?lang=${lang}">${t.nav.plans}</a>
        <a href="/faq?lang=${lang}">${t.nav.faq}</a>
        <a href="/contact?lang=${lang}">${t.nav.contact}</a>
      </div>
      <div class="lang-selector">
        <a href="?lang=pt-BR" ${lang === 'pt-BR' ? 'class="active"' : ''}>PT</a>
        <a href="?lang=en" ${lang === 'en' ? 'class="active"' : ''}>EN</a>
        <a href="?lang=es" ${lang === 'es' ? 'class="active"' : ''}>ES</a>
      </div>
    </nav>
  </header>
  
  <main>
    ${content}
  </main>
  
  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>EaseMind</h4>
          <p>${t.legal.disclaimer}</p>
        </div>
        <div class="footer-section">
          <h4>${t.footer.links.privacy}</h4>
          <a href="/privacy?lang=${lang}">${t.legal.privacy.title}</a><br>
          <a href="/terms?lang=${lang}">${t.legal.terms.title}</a>
        </div>
        <div class="footer-section">
          <h4>Download</h4>
          <a href="${appStoreUrl}" target="_blank" rel="noopener">App Store</a><br>
          <a href="${playStoreUrl}" target="_blank" rel="noopener">Google Play</a>
        </div>
      </div>
      <p class="copyright">${t.footer.copyright}</p>
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
  <link rel="stylesheet" href="/styles/main.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <nav class="container">
      <a href="/?lang=${lang}" class="logo">EaseMind</a>
      <div class="lang-selector">
        <a href="?lang=pt-BR">PT</a>
        <a href="?lang=en">EN</a>
        <a href="?lang=es">ES</a>
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
  <link rel="stylesheet" href="/styles/main.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <header>
    <nav class="container">
      <a href="/?lang=${lang}" class="logo">EaseMind</a>
      <div class="lang-selector">
        <a href="?lang=pt-BR">PT</a>
        <a href="?lang=en">EN</a>
        <a href="?lang=es">ES</a>
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
