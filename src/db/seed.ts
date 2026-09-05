import { db } from './index.ts';
import { admins, projects, services, solutions, jobs, jobApplications, contactMessages, projectEnquiries, testimonials, faqs, blogPosts } from './schema.ts';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('Seeding initial data for ANVION IT SERVICES...');

  // 1. Seed Admin
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@anvion.in';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AnvionAdmin2026!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmins = await db.select().from(admins);
  if (existingAdmins.length === 0) {
    await db.insert(admins).values({
      email: adminEmail,
      name: 'ANVION Lead Administrator',
      passwordHash,
      role: 'superadmin',
    });
    console.log(`✓ Created superadmin account: ${adminEmail} (password: ${adminPassword})`);
  } else {
    console.log(`- Admin already exists (${existingAdmins[0].email})`);
  }

  // 2. Seed Projects
  const existingProjects = await db.select().from(projects);
  if (existingProjects.length === 0) {
    await db.insert(projects).values([
      {
        title: 'Enterprise ERP & Operations Platform',
        slug: 'enterprise-erp-operations-platform',
        category: 'software',
        isConcept: true,
        badgeLabel: 'ANVION DEMO / CONCEPT',
        summary: 'Cloud-native resource planning, analytics and workflow orchestration suite designed for multi-location mid-market enterprises.',
        overview: 'An integrated enterprise operations platform engineered to synchronize supply chain logistics, human capital workflows, and real-time ledger accounting into a single unified high-performance dashboard.',
        problem: 'Siloed data architecture causing asynchronous reporting delays, manual reconciliation bottlenecks, and lack of real-time auditability across distributed operational centers.',
        approach: 'Architected event-driven microservices with Postgres row-level security and responsive reactive state dashboards.',
        solution: 'Built an enterprise dashboard with sub-second response times, automated ledger balance verification, and real-time worker task distribution.',
        features: [
          'Multi-entity accounting & financial ledger sync',
          'Automated inventory forecasting and threshold triggers',
          'Role-based access control with comprehensive audit log tracking',
          'High-throughput asynchronous reporting exports'
        ],
        technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker'],
        status: 'published',
        isFeatured: true,
      },
      {
        title: 'HealthCare Mobile Consultation & Telehealth App',
        slug: 'healthcare-mobile-consultation-telehealth-app',
        category: 'mobile',
        isConcept: true,
        badgeLabel: 'CONCEPT PROJECT',
        summary: 'Cross-platform mobile telehealth solution featuring encrypted consultation sessions, prescription dispatch and patient health tracking.',
        overview: 'A patient-first healthcare experience with synchronous WebRTC consultation room dispatch, biometric sign-in, and offline medical history caching.',
        problem: 'High friction in scheduling specialized clinician reviews and insecure document sharing in conventional communication channels.',
        approach: 'Developed cross-platform client with strict end-to-end data encryption and HIPAA-conscious architecture.',
        solution: 'Smooth mobile interface allowing instant appointment reservation, integrated payment gateways, and live vitals streaming.',
        features: [
          'Encrypted audio/video consultation channel',
          'Automated electronic prescription generation and digital signatures',
          'Offline prescription store with SQLite synchronization',
          'Push notification consultation countdowns'
        ],
        technologies: ['Flutter', 'Dart', 'Node.js', 'PostgreSQL', 'WebRTC'],
        status: 'published',
        isFeatured: true,
      },
      {
        title: 'Autonomous Industrial IoT Monitoring Network',
        slug: 'autonomous-industrial-iot-monitoring-network',
        category: 'iot',
        isConcept: true,
        badgeLabel: 'ANVION LABS / CONCEPT',
        summary: 'Edge sensor telemetry platform monitoring mechanical vibration, thermal variance, and predictive maintenance schedules.',
        overview: 'Real-time telemetry ingestion pipeline capturing sensor telemetry over MQTT, performing real-time threshold scoring, and alerting on anomaly detection.',
        problem: 'Unanticipated production line stoppages due to undetected bearing friction and thermal breakdown in heavy equipment.',
        approach: 'Engineered lightweight edge ingestion daemons paired with streaming analytics and live threshold alarms.',
        solution: 'Zero-latency telemetry dashboard visualizing 50,000+ points/sec with dynamic alert SMS/Email dispatch.',
        features: [
          'High-throughput MQTT broker telemetry pipeline',
          'Configurable threshold alerts with escalation matrix',
          'Predictive maintenance machine learning scoring',
          'Interactive SVG industrial plant telemetry view'
        ],
        technologies: ['Node.js', 'MQTT', 'TimescaleDB / Postgres', 'WebSockets', 'Tailwind CSS'],
        status: 'published',
        isFeatured: true,
      },
      {
        title: 'Intelligent Enterprise Document Automation (AI/ML)',
        slug: 'intelligent-enterprise-document-automation',
        category: 'ai',
        isConcept: true,
        badgeLabel: 'ANVION DEMO',
        summary: 'AI-driven contract analysis, structured data extraction, and automated compliance auditing pipeline.',
        overview: 'A natural language pipeline that converts complex multi-page commercial contracts into structured tabular database entities with high precision.',
        problem: 'Legal and procurement teams spending hundreds of human hours manually reviewing supplier contracts and payment milestones.',
        approach: 'Combined multimodal OCR, LLM extraction prompting, and human-in-the-loop verification interfaces.',
        solution: 'Reduced document triage time by 82% while verifying compliance clauses against internal legal standards.',
        features: [
          'Automated PDF OCR with table structure recovery',
          'Risk clause identification and severity tagging',
          'One-click ERP sync of extracted line items',
          'Side-by-side human review and correction panel'
        ],
        technologies: ['Python', 'Node.js', 'PostgreSQL', 'Gemini AI', 'Tailwind CSS'],
        status: 'published',
        isFeatured: true,
      }
    ]);
    console.log('✓ Seeded 4 showcase projects');
  }

  // 3. Seed Jobs
  const existingJobs = await db.select().from(jobs);
  if (existingJobs.length === 0) {
    await db.insert(jobs).values([
      {
        title: 'Frontend Developer',
        slug: 'frontend-developer',
        department: 'Engineering',
        employmentType: 'Full-time',
        location: 'Remote / Hybrid (India)',
        experience: '1-3 years',
        overview: 'Build high-performance web applications, responsive user interfaces, and component architectures for client and internal software products.',
        responsibilities: [
          'Implement clean, accessible, and fast user interfaces using modern TypeScript and Tailwind CSS',
          'Collaborate closely with backend engineers to integrate RESTful and WebSocket APIs',
          'Optimize web performance, Core Web Vitals, and responsive cross-browser layouts',
          'Participate in code reviews and architectural discussions'
        ],
        requirements: [
          'Proficiency in TypeScript, JavaScript (ES6+), HTML5, and CSS3 / Tailwind CSS',
          'Hands-on experience with modern component-driven architectures (React, Next.js, or Vue)',
          'Solid understanding of Git, RESTful APIs, and browser rendering lifecycles',
          'Strong eye for detail, spacing, typography, and clean UI engineering'
        ],
        benefits: [
          'Flexible work culture with remote options',
          'Continuous learning budget and conference allowances',
          'Direct exposure to modern full-stack architectures and AI systems'
        ],
        status: 'active'
      },
      {
        title: 'Flutter / Mobile Developer',
        slug: 'flutter-developer',
        department: 'Mobile Engineering',
        employmentType: 'Full-time',
        location: 'Remote / Hybrid (India)',
        experience: '1-3 years',
        overview: 'Engineer responsive, reliable cross-platform mobile experiences for iOS and Android with solid state management and native bridge integration.',
        responsibilities: [
          'Develop feature-rich Flutter applications with fluid animations and responsive mobile UX',
          'Integrate native camera, push notifications, local storage, and secure biometrics',
          'Ensure seamless performance across varying device screen sizes and Android/iOS versions'
        ],
        requirements: [
          'Proven experience delivering apps with Flutter & Dart',
          'Deep understanding of state management (Bloc, Provider, or Riverpod)',
          'Experience deploying to Google Play Store and Apple App Store'
        ],
        benefits: [
          'Competitive compensation',
          'Direct mentorship from senior engineering architects',
          'Hands-on product ownership from prototype to deployment'
        ],
        status: 'active'
      },
      {
        title: 'UI/UX Designer',
        slug: 'ui-ux-designer',
        department: 'Design & Experience',
        employmentType: 'Full-time / Contract',
        location: 'Remote (India)',
        experience: '1-4 years',
        overview: 'Shape the visual identity, wireframes, prototypes, and design systems for enterprise web platforms and client digital products.',
        responsibilities: [
          'Design design systems, typography hierarchies, component libraries, and interactive Figma prototypes',
          'Conduct user journey mapping, wireframing, and usability testing',
          'Partner with frontend developers to ensure pixel-accurate, accessible implementations'
        ],
        requirements: [
          'Portfolio demonstrating clean, modern typography, restrained color usage, and intuitive UX flows',
          'Mastery of Figma, component variants, auto-layout, and prototyping',
          'Deep appreciation for accessibility (WCAG AA) and responsive micro-interactions'
        ],
        benefits: [
          'Flexible hours and remote setup',
          'Collaborative design culture with autonomy'
        ],
        status: 'active'
      },
      {
        title: 'AI / ML Intern',
        slug: 'ai-ml-intern',
        department: 'Emerging Technologies',
        employmentType: 'Internship (3-6 Months)',
        location: 'Remote (India)',
        experience: 'Fresher / Student',
        overview: 'Explore practical generative AI applications, workflow automation pipelines, OCR processing, and intelligent agent integrations.',
        responsibilities: [
          'Prototype automation workflows and document intelligence pipelines with Python and modern AI APIs',
          'Evaluate prompt architectures, fine-tuning setups, and retrieval systems',
          'Document findings and integrate prototype APIs with web interfaces'
        ],
        requirements: [
          'Proficiency in Python and basic understanding of machine learning principles',
          'Familiarity with REST APIs, JSON data structures, and Git version control',
          'High curiosity and eagerness to build real-world automation utilities'
        ],
        benefits: [
          'Hands-on experience with production systems',
          'Certificate of completion and potential full-time transition'
        ],
        status: 'active'
      }
    ]);
    console.log('✓ Seeded 4 career positions');
  }

  // 4. Seed Services
  const existingServices = await db.select().from(services);
  if (existingServices.length === 0) {
    await db.insert(services).values([
      {
        title: 'Web Development',
        slug: 'web-development',
        icon: 'language',
        tagline: 'High-performance business websites, web applications and portals.',
        overview: 'We build modern web experiences optimized for speed, reliability, SEO visibility, and business conversions.',
        problemsSolved: [
          'Slow loading legacy websites with poor mobile experience',
          'High bounce rates due to clunky navigation and confusing user flows',
          'Difficult content management and security vulnerabilities'
        ],
        servicesIncluded: [
          'Custom web application development',
          'Corporate & business websites',
          'CMS & portal engineering',
          'Performance tuning & Core Web Vitals optimization'
        ],
        features: ['TypeScript', 'Clean architecture', 'SEO-ready semantics', 'Sub-second page speeds'],
        technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
        status: 'published'
      },
      {
        title: 'Mobile App Development',
        slug: 'mobile-development',
        icon: 'phone_iphone',
        tagline: 'Cross-platform mobile applications for iOS and Android.',
        overview: 'Deliver intuitive mobile products that work reliably across devices with seamless offline capability and native performance.',
        problemsSolved: [
          'High costs of maintaining separate native iOS and Android codebases',
          'Inconsistent performance and frequent app crashes',
          'Poor offline synchronization and slow API responses'
        ],
        servicesIncluded: [
          'Cross-platform Flutter app development',
          'UI/UX design & interactive mobile prototyping',
          'App Store & Play Store release management',
          'Backend API integration and real-time push services'
        ],
        features: ['Native 60fps performance', 'Offline caching', 'Secure biometric authentication'],
        technologies: ['Flutter', 'Dart', 'Firebase', 'REST APIs', 'SQLite'],
        status: 'published'
      },
      {
        title: 'AI & Machine Learning',
        slug: 'ai-machine-learning',
        icon: 'psychology',
        tagline: 'Practical AI and smart automation systems that solve real business problems.',
        overview: 'We help companies integrate artificial intelligence into existing workflows to eliminate repetitive manual work, analyze documents, and surface actionable business insights.',
        problemsSolved: [
          'Manual, error-prone data entry and document review processes',
          'Inability to extract insights from unstructured text and invoices',
          'Repetitive customer support inquiries'
        ],
        servicesIncluded: [
          'Document intelligence & OCR pipelines',
          'Intelligent chatbots & automated customer assistance',
          'Predictive analytics & anomaly detection',
          'Custom LLM integrations and workflow automation'
        ],
        features: ['Enterprise privacy controls', 'High accuracy pipelines', 'Seamless existing API integrations'],
        technologies: ['Python', 'Gemini AI', 'FastAPI', 'Node.js', 'PostgreSQL'],
        status: 'published'
      },
      {
        title: 'Cybersecurity & Infrastructure',
        slug: 'cybersecurity',
        icon: 'security',
        tagline: 'Proactive security auditing, server hardening and compliance posture.',
        overview: 'Safeguard your digital assets, customer data, and cloud infrastructure with comprehensive vulnerability assessments and secure-by-default architecture.',
        problemsSolved: [
          'Exposed server ports and unpatched package vulnerabilities',
          'Data leak risks and compliance non-conformity',
          'Lack of centralized audit logging and threat detection'
        ],
        servicesIncluded: [
          'Web application security audits (OWASP Top 10)',
          'Cloud infrastructure hardening (GCP/AWS/Linux)',
          'Role-based access control and token authorization audit',
          'Automated backup and disaster recovery setup'
        ],
        features: ['Strict input sanitization', 'TLS 1.3 encryption', 'Continuous security monitoring'],
        technologies: ['Linux', 'Docker', 'PostgreSQL', 'Firewalls', 'OAuth / JWT'],
        status: 'published'
      }
    ]);
    console.log('✓ Seeded 4 core services');
  }

  console.log('Database seeding finished successfully!');
}

seed().catch((err) => {
  console.error('Error during database seeding:', err);
  process.exit(1);
});
