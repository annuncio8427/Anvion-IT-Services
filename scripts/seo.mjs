import fs from 'node:fs';
import path from 'node:path';

export const SEO_PAGES = {
  'index.html': {
    title: "Web & App Development in Kanyakumari | ANVION",
    description: "Build business websites, Flutter apps and custom software with ANVION IT SERVICES in Kanyakumari, Nagercoil and across Tamil Nadu.",
  },
  'about.html': {
    title: "About ANVION IT SERVICES | Karungal, Kanyakumari",
    description: "Meet ANVION IT SERVICES, an MSME-registered digital solutions company based in Karungal, Kanyakumari district, Tamil Nadu.",
  },
  'services.html': {
    title: "IT Services in Kanyakumari | ANVION IT SERVICES",
    description: "Explore web development, Flutter apps, custom software, digital marketing, branding and IT consulting from ANVION in Kanyakumari, Tamil Nadu.",
  },
  'web-development.html': {
    title: "Website Development in Kanyakumari | ANVION",
    description: "ANVION builds responsive business websites, e-commerce sites and web apps for organisations in Kanyakumari, Nagercoil and Tamil Nadu.",
    service: "Website and Web Application Development",
  },
  'mobile-development.html': {
    title: "Flutter App Development in Nagercoil | ANVION",
    description: "Flutter mobile apps for Android and iOS, with custom UI, APIs, Firebase and business workflows from ANVION IT SERVICES in Tamil Nadu.",
    service: "Flutter Mobile Application Development",
  },
  'ai-machine-learning.html': {
    title: "AI & Automation Solutions Tamil Nadu | ANVION",
    description: "Explore AI automation, machine learning and computer vision solutions designed around business workflows by ANVION IT SERVICES.",
    service: "AI and Machine Learning Solutions",
  },
  'cybersecurity.html': {
    title: "Cybersecurity Services Tamil Nadu | ANVION",
    description: "Practical website, application and data-security guidance for businesses seeking safer digital systems from ANVION IT SERVICES in Tamil Nadu.",
    service: "Cybersecurity and Application Security",
  },
  'it-consulting.html': {
    title: "IT Consulting in Kanyakumari | ANVION IT Services",
    description: "Get technology roadmaps, solution architecture and digital transformation guidance for your business from ANVION IT SERVICES in Kanyakumari.",
    service: "IT Consulting and Solution Architecture",
  },
  'projects.html': {
    title: "Software & App Development Projects | ANVION",
    description: "View ANVION IT SERVICES project work across web applications, Flutter apps, desktop software and digital marketing campaigns.",
  },
  'portfolio.html': {
    title: "ANVION Portfolio | Web, Mobile & Software Projects",
    description: "Explore ANVION work in web apps, Flutter mobile development, desktop tools, product design and digital campaigns.",
  },
  'case-studies.html': {
    title: "Client Case Studies | ANVION IT SERVICES",
    description: "Read project case studies by ANVION IT SERVICES, including HOMELUXE, EduVerify, Smart Invoice Builder and St. Joseph College.",
  },
  'contact.html': {
    title: "Contact ANVION IT SERVICES | Kanyakumari",
    description: "Contact ANVION IT SERVICES in Karungal, Kanyakumari to discuss website development, mobile apps, custom software or digital marketing.",
  },
  'careers.html': {
    title: 'Careers at ANVION IT Services | Build With Us',
    description: 'Explore opportunities to learn, collaborate and contribute to web, mobile, software and emerging technology projects at ANVION IT SERVICES.',
  },
  'internships.html': {
    title: 'IT Internships in Web & Flutter | ANVION',
    description: 'Explore student internships at ANVION in web development, Flutter apps, AI automation and UI/UX design. Review current roles and application details.',
  },
  'pricing.html': {
    title: 'Website & App Development Pricing | ANVION',
    description: 'Estimate website, Flutter app and custom software costs in INR. Explore ANVION project pricing, milestones and quotation options.',
  },
  'blog.html': {
    title: 'Engineering Blog & Technical Insights | ANVION IT SERVICES',
    description: 'Technical deep dives, architectural breakdowns, Flutter engineering, sub-50ms desktop software, and cloud systems by ANVION IT Services.',
  },
  'solution.html': {
    title: 'Business Technology Solutions | ANVION IT SERVICES',
    description: 'Explore ANVION solutions for CRM systems, e-commerce, education technology, applied AI and specialized digital architectures.',
  },
  'service-details.html': {
    title: 'Digital Solutions & Technology Services | ANVION',
    description: 'Discover ANVION IT SERVICES web development, mobile apps, custom software, UI/UX, AI, cloud, backend and IoT delivery capabilities.',
  },
  'start-a-project.html': {
    title: "Start a Website or App Project | ANVION",
    description: "Share your requirements for a website, Flutter app, desktop software or digital marketing project with ANVION IT SERVICES.",
  },
  'project-eduverify.html': {
    title: "EduVerify Desktop Software Case Study | ANVION",
    description: "See how EduVerify helps educational teams merge Excel files, validate spreadsheet data and generate reports in a Windows desktop tool.",
  },
  'project-homeluxe.html': {
    title: "HOMELUXE Real Estate App Case Study | ANVION",
    description: "Explore the HOMELUXE real estate web platform case study, including property discovery, listing workflows and interface design by ANVION.",
  },
  'project-smart-invoice-builder.html': {
    title: "Smart Invoice Builder Case Study | ANVION",
    description: "Explore Smart Invoice Builder, a mobile invoicing case study with A4 PDF output, payment details and WhatsApp sharing workflows.",
  },
  'project-st-joseph.html': {
    title: "St. Joseph College Marketing Case Study | ANVION",
    description: "See the St. Joseph College digital marketing case study, including campaign content, audience reach and admissions communication.",
  },
  'project-task-planner.html': {
    title: "Task Planner Mobile App Case Study | ANVION",
    description: "Explore Task Planner, an offline-first mobile productivity app concept by ANVION IT SERVICES.",
  },
  'custom-desktop-software.html': {
    title: "Custom Software Development Tamil Nadu | ANVION",
    description: "ANVION develops Windows desktop software, Excel automation, data validation and workflow tools for businesses and education teams in Tamil Nadu.",
    service: "Custom Desktop Software Development and Workflow Automation",
    faqs: [{"question":"Can ANVION build Windows desktop software?","answer":"Yes. ANVION develops custom Windows desktop tools for data processing, internal workflows and reporting, with scope and requirements agreed before development."},{"question":"Can you automate repetitive Excel work?","answer":"We can assess spreadsheet tasks, file formats and validation rules, then propose a desktop utility or a more suitable web workflow."},{"question":"Can custom software work offline?","answer":"Offline support can be designed where the workflow and data requirements allow it. Local storage, synchronisation, backup and recovery behaviour are agreed during discovery."}],
  },
  'digital-marketing.html': {
    title: "Digital Marketing & SEO in Kanyakumari | ANVION",
    description: "Improve local visibility and enquiries with SEO, content and digital marketing support from ANVION IT SERVICES in Kanyakumari and Tamil Nadu.",
    service: "Digital Marketing and Search Engine Optimization",
    faqs: [{"question":"Do you guarantee first-page Google rankings?","answer":"No responsible SEO provider can guarantee a specific ranking. We work on crawlability, useful service content, local relevance and measurement, then report progress using Search Console and agreed KPIs."},{"question":"Can ANVION support businesses in Nagercoil and Kanyakumari?","answer":"ANVION is based in Karungal and can discuss digital marketing projects for organisations in Kanyakumari district, Nagercoil and the wider Tamil Nadu market."},{"question":"What do you need to begin a digital marketing project?","answer":"We begin with your website, services, target customers and locations, current enquiry channels and access to Search Console or Analytics where available."}],
  },
  'branding-ui-ux.html': {
    title: "Branding & UI/UX Design in Tamil Nadu | ANVION",
    description: "Create a consistent brand identity and user-friendly digital products with branding, UI design and UX support from ANVION IT SERVICES.",
    service: "Brand Identity and UI/UX Design",
    faqs: [{"question":"What is included in brand identity design?","answer":"A project can include logo direction, colour and typography, layout rules, brand assets and practical usage guidance. The exact deliverables are agreed before work begins."},{"question":"Do you design website and mobile app interfaces?","answer":"Yes. We can plan user journeys, wireframes, responsive screen layouts and reusable UI patterns for websites and mobile applications."},{"question":"Can you improve an existing logo or website design?","answer":"Yes. We can review your current identity and interfaces, identify usability or consistency issues and propose a focused refresh around your goals."}],
  },
  'privacy-policy.html': {
    title: "Privacy Policy | ANVION IT SERVICES",
    description: "Read how ANVION IT SERVICES collects, uses and protects information when you browse the website or contact the team.",
  },
  'terms-of-service.html': {
    title: "Terms of Service | ANVION IT SERVICES",
    description: "Review the terms for using the ANVION IT SERVICES website and engaging its digital and software services.",
  },
};

const NOINDEX_PAGES = [
  '404.html',
  'admin.html',
  'admin-login.html',
  'admin/login.html',
  'login.html',
  'signup.html',
  'forgot-password.html',
  'profile.html',
  'dashboard.html',
];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeJsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

function buildStructuredData(file, metadata, canonical, siteUrl) {
  const organizationId = siteUrl + '/#organization';
  const websiteId = siteUrl + '/#website';
  const isHome = file === 'index.html';
  const graph = [{
    '@type': 'WebPage',
    '@id': canonical + '#webpage',
    url: canonical,
    name: metadata.title,
    description: metadata.description,
    inLanguage: 'en-IN',
    isPartOf: { '@id': websiteId },
    publisher: { '@id': organizationId },
  }];

  if (isHome) {
    graph.push({
      '@type': ['Organization', 'ProfessionalService'],
      '@id': organizationId,
      name: 'ANVION IT SERVICES',
      legalName: 'ANVION IT SERVICES',
      url: siteUrl + '/',
      email: 'anvionitservices@gmail.com',
      telephone: '+91 9150270802',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91 9150270802',
          email: 'anvionitservices@gmail.com',
          contactType: 'customer enquiries',
          areaServed: 'IN',
          availableLanguage: ['English', 'Tamil'],
        },
        {
          '@type': 'ContactPoint',
          telephone: '+91 8438464047',
          contactType: 'customer enquiries',
          areaServed: 'IN',
          availableLanguage: ['English', 'Tamil'],
        },
      ],
      logo: {
        '@type': 'ImageObject',
        url: siteUrl + '/images/logo.png',
      },
      image: siteUrl + '/images/logo.png',
      description: metadata.description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Door No. 7-69D, Maria Rose Franco, Mangantruvillai, Mangalakuntu, Vilavancode PO',
        addressLocality: 'Karungal',
        addressRegion: 'Tamil Nadu',
        postalCode: '629178',
        addressCountry: 'IN',
      },
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Kanyakumari district' },
        { '@type': 'City', name: 'Nagercoil' },
        { '@type': 'AdministrativeArea', name: 'Tirunelveli district' },
        { '@type': 'AdministrativeArea', name: 'Tenkasi district' },
        { '@type': 'State', name: 'Tamil Nadu' },
        { '@type': 'Country', name: 'India' },
      ],
      identifier: {
        '@type': 'PropertyValue',
        name: 'Udyam Registration Number',
        value: 'UDYAM-TN-09-0098980',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'IT and Digital Services',
        itemListElement: [
          { '@type': 'OfferCatalog', name: 'Website and Web Application Development' },
          { '@type': 'OfferCatalog', name: 'Flutter Mobile App Development' },
          { '@type': 'OfferCatalog', name: 'Custom Desktop Software Development' },
          { '@type': 'OfferCatalog', name: 'Digital Marketing and SEO' },
          { '@type': 'OfferCatalog', name: 'Branding and UI/UX Design' },
          { '@type': 'OfferCatalog', name: 'IT Consulting and Solution Architecture' },
        ],
      },
      knowsAbout: [
        'Website development',
        'Mobile application development',
        'Custom desktop software',
        'Digital marketing and search engine optimization',
        'Brand identity and UI/UX design',
        'AI and workflow automation',
        'Cloud and backend development',
        'IT consulting',
      ],
    });
    graph.push({
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteUrl + '/',
      name: 'ANVION IT SERVICES',
      alternateName: 'ANVION',
      publisher: { '@id': organizationId },
      inLanguage: 'en-IN',
    });
  }

  if (metadata.service) {
    graph.push({
      '@type': 'Service',
      name: metadata.service,
      description: metadata.description,
      provider: { '@id': organizationId },
      areaServed: ['Kanyakumari district', 'Nagercoil', 'Tamil Nadu', 'India'],
      url: canonical,
    });
  }

  if (Array.isArray(metadata.faqs) && metadata.faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': canonical + '#faq',
      mainEntity: metadata.faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (!isHome) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl + '/' },
        { '@type': 'ListItem', position: 2, name: metadata.title, item: canonical },
      ],
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
function applyPageSeo(publicDir, siteUrl, file, metadata) {
  const target = path.join(publicDir, file);
  if (!fs.existsSync(target)) {
    throw new Error('SEO page is missing from public output: ' + file);
  }

  let html = fs.readFileSync(target, 'utf8');
  // Use extensionless canonical URLs because Vercel cleanUrls redirects .html paths.
  const canonicalPath = file === 'index.html' ? '/' : '/' + file.replace(/\.html?$/i, '');
  const canonical = siteUrl + canonicalPath;

  // Remove prior managed tags so builds remain idempotent.
  const managedTags = [
    /<meta\b[^>]*\bname=["']description["'][^>]*>/gi,
    /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi,
    /<meta\b[^>]*\bproperty=["']og:[^"']+["'][^>]*>/gi,
    /<meta\b[^>]*\bname=["']twitter:[^"']+["'][^>]*>/gi,
    /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,
    /<link\b[^>]*\brel=["'](?:icon|apple-touch-icon|manifest)["'][^>]*>/gi,
    /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  ];
  for (const pattern of managedTags) html = html.replace(pattern, '');

  const tags = [
    '<meta name="description" content="' + escapeHtml(metadata.description) + '">',
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    '<link rel="icon" type="image/png" sizes="48x48" href="/favicon.png">',
    '<link rel="icon" type="image/x-icon" href="/favicon.ico">',
    '<link rel="apple-touch-icon" href="/images/logo.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    '<link rel="canonical" href="' + escapeHtml(canonical) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="ANVION IT SERVICES">',
    '<meta property="og:title" content="' + escapeHtml(metadata.title) + '">',
    '<meta property="og:description" content="' + escapeHtml(metadata.description) + '">',
    '<meta property="og:url" content="' + escapeHtml(canonical) + '">',
    '<meta property="og:locale" content="en_IN">',
    '<meta property="og:image" content="' + escapeHtml(siteUrl + '/images/logo.png') + '">',
    '<meta property="og:image:alt" content="ANVION IT SERVICES logo">',
    '<meta name="twitter:image" content="' + escapeHtml(siteUrl + '/images/logo.png') + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeHtml(metadata.title) + '">',
    '<meta name="twitter:description" content="' + escapeHtml(metadata.description) + '">',
    '<meta name="theme-color" content="#0d0e12">',
    '<script type="application/ld+json">' + escapeJsonForHtml(buildStructuredData(file, metadata, canonical, siteUrl)) + '</script>',
  ].join('\n');

  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(metadata.title) + '</title>');
  } else {
    html = html.replace(/<\/head>/i, '<title>' + escapeHtml(metadata.title) + '</title>\n</head>');
  }

  if (!/<meta\b[^>]*\bcharset=/i.test(html.slice(0, html.indexOf('</head>')))) {
    html = html.replace(/<head\b[^>]*>/i, (head) => head + '\n<meta charset="utf-8">');
  }

  if (/<html\b[^>]*\blang=/i.test(html)) {
    html = html.replace(/(<html\b[^>]*\blang=["'])[^"']*(["'])/i, '$1en-IN$2');
  } else {
    html = html.replace(/<html\b/i, '<html lang="en-IN"');
  }

  html = html.replace(/<\/head>/i, tags + '\n</head>');
  fs.writeFileSync(target, html, 'utf8');
  return canonical;
}

function applyNoindex(publicDir, file) {
  const target = path.join(publicDir, file);
  if (!fs.existsSync(target)) return;
  let html = fs.readFileSync(target, 'utf8');
  html = html.replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi, '');
  html = html.replace(/<\/head>/i, '<meta name="robots" content="noindex,nofollow">\n</head>');
  fs.writeFileSync(target, html, 'utf8');
}

export function applySeo(publicDir, siteUrl = process.env.VERCEL_ENV === 'production' ? 'https://www.anvionitservices.in' : process.env.SITE_URL || 'https://www.anvionitservices.in') {
  siteUrl = siteUrl.replace(/\/+$/, '');
  const sitemapUrls = [];

  for (const [file, metadata] of Object.entries(SEO_PAGES)) {
    sitemapUrls.push(applyPageSeo(publicDir, siteUrl, file, metadata));
  }

  for (const file of NOINDEX_PAGES) applyNoindex(publicDir, file);

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapUrls.map((url) => '  <url><loc>' + url.replaceAll('&', '&amp;') + '</loc></url>'),
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');

  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Sitemap: ' + siteUrl + '/sitemap.xml',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots, 'utf8');

  return { pageCount: sitemapUrls.length, noindexCount: NOINDEX_PAGES.length, siteUrl };
}
