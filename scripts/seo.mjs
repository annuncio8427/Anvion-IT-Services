import fs from 'node:fs';
import path from 'node:path';

export const SEO_PAGES = {
  'index.html': {
    title: 'ANVION IT SERVICES | Official Website & Digital Solutions',
    description: 'ANVION IT SERVICES is an India-based digital solutions company providing website development, mobile app development, custom software, digital marketing and IT solutions in Kanyakumari, Tamil Nadu.' ,
    kind: 'home',
  },
  'about.html': {
    title: 'About ANVION IT SERVICES | Company, Team & Mission',
    description: 'Meet ANVION IT SERVICES: a technology team turning ideas into practical digital products through web, mobile, software, cloud and emerging technologies.',
  },
  'services.html': {
    title: 'IT Services by ANVION IT SERVICES | Web, Apps & Software',
    description: 'Explore ANVION IT SERVICES: web platforms, e-commerce, mobile apps, bespoke software, cloud infrastructure, AI automation, API development and maintenance.',
  },
  'web-development.html': {
    title: 'Website Development Services | ANVION IT SERVICES',
    description: 'ANVION IT SERVICES designs responsive business websites, e-commerce stores and web applications for businesses in Kanyakumari and across Tamil Nadu.',
    service: 'Website and Web Application Development',
  },
  'mobile-development.html': {
    title: 'Mobile App Development | Flutter Apps - ANVION',
    description: 'ANVION IT SERVICES builds cross-platform mobile apps with responsive UI, authentication, notifications and backend integration for customer and business workflows.',
    service: 'Mobile Application Development',
  },
  'ai-machine-learning.html': {
    title: 'AI & Machine Learning Solutions | ANVION IT SERVICES',
    description: 'Explore practical AI assistants, machine learning, computer vision and workflow automation solutions from ANVION IT SERVICES.',
    service: 'AI and Machine Learning Solutions',
  },
  'cybersecurity.html': {
    title: 'Cybersecurity Services | ANVION IT SERVICES',
    description: 'Improve the security of websites, applications, accounts and data with practical security assessments, access management and secure development guidance from ANVION.',
    service: 'Cybersecurity and Application Security',
  },
  'it-consulting.html': {
    title: 'IT Consulting & Solution Architecture | ANVION',
    description: 'Plan your digital roadmap with technology strategy, solution architecture, digital transformation and technical advisory from ANVION IT SERVICES.',
    service: 'IT Consulting and Solution Architecture',
  },
  'projects.html': {
    title: 'Software & Digital Projects | ANVION IT SERVICES',
    description: 'Explore selected software, web, mobile, automation and connected technology projects and concepts by ANVION IT SERVICES.',
  },
  'portfolio.html': {
    title: 'ANVION Client Portfolio | 12 Digital Projects & Capabilities',
    description: 'Explore ANVION IT SERVICES capabilities, 12 selected projects and concepts, technology stack, product approach and digital experiences across web, mobile, cloud, AI, IoT and media.',
  },
  'case-studies.html': {
    title: 'Digital Product Case Studies | ANVION IT SERVICES',
    description: 'See how ANVION approaches business platforms, service booking, corporate websites, AI workflow automation and connected technology projects.',
  },
  'contact.html': {
    title: 'Contact ANVION IT SERVICES | Enquiries & Project Consultation',
    description: 'Contact ANVION IT SERVICES about website development, mobile apps, custom software, AI automation or a digital project. Share your requirements with our team.',
  },
  'careers.html': {
    title: 'Careers at ANVION IT Services | Build With Us',
    description: 'Explore opportunities to learn, collaborate and contribute to web, mobile, software and emerging technology projects at ANVION IT SERVICES.',
  },
  'internships.html': {
    title: 'Internship Applications | Student Programs - ANVION IT SERVICES',
    description: 'Apply for hands-on student internships in Full-Stack Web, Flutter Mobile Apps, AI Automation and UI/UX Design at ANVION IT Services. Govt. MSME recognized experience.',
  },
  'pricing.html': {
    title: 'Transparent Pricing & Project Cost Estimator | ANVION IT SERVICES',
    description: 'Explore transparent milestone pricing and calculate your custom web, mobile, or software project cost in INR with the ANVION IT Services interactive quotation estimator.',
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
    title: 'Start a Project with ANVION IT SERVICES',
    description: 'Tell ANVION about your business or technology challenge. Share your goals, scope, preferred timeline and budget to start a project discussion.',
  },
  'project-eduverify.html': {
    title: 'EduVerify School Data Validation Software | ANVION IT SERVICES',
    description: 'Explore EduVerify by ANVION IT SERVICES, a Windows desktop application for educational institutions to merge Excel files, validate data and identify spreadsheet errors.',
  },
  'project-homeluxe.html': {
    title: 'HOMELUXE Luxury Real Estate Marketplace | ANVION IT SERVICES',
    description: 'Explore HOMELUXE, a luxury real estate marketplace concept by ANVION IT SERVICES featuring curated properties, AI-assisted valuations and RERA-focused advisory information.',
  },
  'project-smart-invoice-builder.html': {
    title: 'Smart Invoice Builder App Case Study | ANVION IT SERVICES',
    description: 'Explore Smart Invoice Builder by ANVION IT SERVICES, an invoice-generation application for creating A4 PDF invoices with business branding, payment details and sharing workflows.',
  },
  'project-st-joseph.html': {
    title: 'St. Joseph College Digital Marketing Case Study | ANVION IT SERVICES',
    description: 'Read the ANVION IT SERVICES case study about digital media and admissions promotion for St. Joseph College of Arts and Science, including campaign reach and audience discovery metrics.',
  },
  'project-task-planner.html': {
    title: 'Task Planner Mobile App Case Study | ANVION IT SERVICES',
    description: 'Explore Task Planner by ANVION IT SERVICES, an offline-first productivity mobile app concept with categorized tasks, quick search and local data storage.',
  },
  'privacy-policy.html': {
    title: 'Privacy Policy | ANVION IT SERVICES',
    description: 'Read how ANVION IT SERVICES collects, uses, protects and handles information when you use our website and digital services.',
  },
  'terms-of-service.html': {
    title: 'Terms of Service | ANVION IT SERVICES',
    description: 'Review the terms for using the ANVION IT SERVICES website and engaging our technology, software and digital services.',
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
      '@type': 'Organization',
      '@id': organizationId,
      name: 'ANVION IT SERVICES',
      legalName: 'ANVION IT SERVICES',
      url: siteUrl + '/',
      email: 'anvionitservices@gmail.com',
      telephone: '+91-9150270802',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9150270802',
        email: 'anvionitservices@gmail.com',
        contactType: 'customer support',
        areaServed: 'IN',
        availableLanguage: ['English', 'Tamil'],
      },
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Tamil Nadu, India' },
        { '@type': 'Country', name: 'India' },
      ],
      logo: {
        '@type': 'ImageObject',
        url: siteUrl + '/images/logo.png',
      },
      image: siteUrl + '/images/logo.png',
      description: metadata.description,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Door No. 7-69D, Maria Rose Franco, Mangantruvillai, Mangalakuntu, Vilavancode PO, Karungal',
        addressLocality: 'Kanniyakumari',
        postalCode: '629178',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
      identifier: {
        '@type': 'PropertyValue',
        name: 'Udyam Registration Number',
        value: 'UDYAM-TN-09-0098980',
      },
      knowsAbout: [
        'Website development',
        'Mobile application development',
        'Custom software development',
        'Digital marketing',
        'UI and UX design',
        'AI and workflow automation',
        'Cloud and backend development',
        'IoT solutions',
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
      url: canonical,
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
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg">',
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
    '<meta name="twitter:card" content="summary">',
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
