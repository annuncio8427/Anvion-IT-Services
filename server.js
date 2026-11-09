import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, desc, and } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import {
  admins,
  projects,
  services,
  solutions,
  jobs,
  jobApplications,
  contactMessages,
  projectEnquiries,
  testimonials,
  faqs,
  blogPosts,
  auditLogs,
  consultations,
  enquiryNotes,
  projectMilestones,
  invoices,
  supportTickets,
  servicePricing,
} from './src/db/schema.ts';
import { requireAuth, requireAdminAuth } from './src/middleware/auth.js';
import { adminAuth, adminDb } from './src/lib/firebase-admin.ts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = process.env.VERCEL ? path.join(__dirname, 'public') : __dirname;

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

// Uploads configuration
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'anvion-uploads')
  : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage with strict limits and validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const cleanExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${cleanExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, DOC, DOCX, Images, and ZIP archives are allowed.'));
    }
  },
});

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Helper for audit logging
async function logAudit(adminEmail, action, details, ip) {
  try {
    await db.insert(auditLogs).values({
      adminEmail,
      action,
      details: details || null,
      ipAddress: ip || null,
    });
  } catch (e) {
    console.warn('Audit log notice (offline database):', e.message);
  }
}


// ==========================================
// PORTAL DATA STORE & RESILIENT STORAGE
// ==========================================
const portalStore = {
  clients: [
    {
      id: 'CLI-001',
      uid: 'client-st-joseph',
      name: 'Dr. S. Xavier',
      companyName: 'St. Joseph College of Arts & Science',
      email: 'principal@stjoseph.edu.in',
      phone: '+91 98401 23456',
      address: 'Vaikalipatti, Tamil Nadu 627808',
      gstNumber: '33AAAAA0000A1Z5',
      website: 'https://stjosephvaikalipatti.edu.in',
      category: 'Education & Institutional',
      status: 'ACTIVE',
      assignedManager: 'Annuncio (Lead Architect)',
      notes: 'Custom ERP and institutional examination portal development.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'CLI-002',
      uid: 'client-virgin-water',
      name: 'R. K. Sundaram',
      companyName: 'Virgin Water & Waste Water Solutions',
      email: 'contact@virginwater.in',
      phone: '+91 94432 78901',
      address: 'Industrial Estate, Tirunelveli, Tamil Nadu',
      gstNumber: '33BBBBB1111B2Z6',
      website: 'https://virginwater.in',
      category: 'Environmental & Industrial',
      status: 'ACTIVE',
      assignedManager: 'Annuncio (Lead Architect)',
      notes: 'Industrial IoT monitoring dashboard and brand website.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  leads: [],
  tasks: [
    {
      id: 'TSK-101',
      projectId: 'PRJ-EDU-01',
      clientEmail: 'principal@stjoseph.edu.in',
      title: 'Examination Gradebook Offline-Sync Engine',
      description: 'Implement high-throughput SQLite batch concatenation with institutional export formatting.',
      assignedStaff: 'Karthik R. (Systems Engineer)',
      dueDate: '2026-11-20',
      priority: 'high',
      status: 'In Progress',
      progress: 75,
      isClientVisible: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'TSK-102',
      projectId: 'PRJ-VIR-01',
      clientEmail: 'contact@virginwater.in',
      title: 'Water Quality Telemetry Ingestion Pipeline',
      description: 'MQTT & WebSocket sensor bridge for flow meter and pH balance metrics.',
      assignedStaff: 'Praveen S. (Cloud Architect)',
      dueDate: '2026-11-25',
      priority: 'medium',
      status: 'In Progress',
      progress: 60,
      isClientVisible: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'TSK-103',
      projectId: 'PRJ-EDU-01',
      clientEmail: 'principal@stjoseph.edu.in',
      title: 'Internal Server Hardening & Secret Rotation',
      description: 'Private administrative task for database credential encryption.',
      assignedStaff: 'Annuncio (Lead Architect)',
      dueDate: '2026-11-18',
      priority: 'high',
      status: 'Completed',
      progress: 100,
      isClientVisible: false,
      createdAt: new Date().toISOString()
    }
  ],
  payments: [
    {
      id: 'PAY-801',
      invoiceNumber: 'INV-2026-1001',
      clientEmail: 'principal@stjoseph.edu.in',
      amountInr: 45000,
      method: 'Bank Transfer (NEFT)',
      referenceNumber: 'NEFT9201948201',
      status: 'VERIFIED',
      recordedBy: 'annuncio8427@gmail.com',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
  ],
  notifications: []
};

// Server-side idempotent bootstrap for initial Super Administrator
async function bootstrapSuperAdmin() {
  const email = (process.env.INITIAL_ADMIN_EMAIL || 'annuncio8427@gmail.com').trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD || 'Annuncio@08';

  if (adminAuth) {
    try {
      let user;
      try {
        user = await adminAuth.getUserByEmail(email);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          user = await adminAuth.createUser({
            email,
            password,
            displayName: 'Super Administrator',
            emailVerified: true,
          });
          console.log(`[Bootstrap] Created Firebase Super Admin Auth user: ${email}`);
        }
      }

      if (user) {
        await adminAuth.setCustomUserClaims(user.uid, { admin: true, role: 'SUPER_ADMIN' });
        if (adminDb) {
          await adminDb.collection('admins').doc(user.uid).set({
            uid: user.uid,
            email,
            role: 'ADMIN',
            superAdmin: true,
            name: 'Super Administrator',
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('[Bootstrap] Firebase Admin notice:', err.message);
    }
  }
}
bootstrapSuperAdmin();

// ==========================================
// 1. PUBLIC API ROUTES
// ==========================================

// Health / Status
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Fetch Published Projects
app.get('/api/projects', async (req, res) => {
  try {
    const category = req.query.category;
    let list;
    if (category && category !== 'all') {
      list = await db
        .select()
        .from(projects)
        .where(and(eq(projects.category, category), eq(projects.status, 'published')))
        .orderBy(desc(projects.createdAt));
    } else {
      list = await db
        .select()
        .from(projects)
        .where(eq(projects.status, 'published'))
        .orderBy(desc(projects.createdAt));
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve projects', details: error.message });
  }
});

// Fetch Single Project by Slug
app.get('/api/projects/:slug', async (req, res) => {
  try {
    const item = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, req.params.slug), eq(projects.status, 'published')))
      .limit(1);
    if (!item || item.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(item[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Fetch Services
app.get('/api/services', async (req, res) => {
  try {
    const list = await db.select().from(services).where(eq(services.status, 'published')).orderBy(desc(services.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve services' });
  }
});

// Fetch Open Jobs / Careers
app.get('/api/jobs', async (req, res) => {
  try {
    const list = await db
      .select()
      .from(jobs)
      .where(eq(jobs.status, 'active'))
      .orderBy(desc(jobs.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve job listings' });
  }
});

// Submit Career Application (with Resume File Upload)
app.post('/api/careers/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, role, portfolio, message, jobId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required fields.' });
    }

    const file = req.file;

    // 1. Save to Drizzle PostgreSQL
    const inserted = await db.insert(jobApplications).values({
      jobId: jobId ? parseInt(jobId, 10) : null,
      jobTitle: role || 'General Application',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : 'Not provided',
      resumeFilename: file ? file.filename : 'no_file',
      resumeOriginalName: file ? file.originalname : 'None provided',
      resumeMimeType: file ? file.mimetype : 'text/plain',
      resumeSizeBytes: file ? file.size : 0,
      portfolioUrl: portfolio || null,
      coverLetter: message || null,
      status: 'new',
    }).returning();

    // 2. Synchronize with Firebase Firestore
    if (adminDb) {
      try {
        await adminDb.collection('jobApplications').add({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : '',
          jobTitle: role || 'General Application',
          portfolioUrl: portfolio || '',
          coverLetter: message || '',
          resumeFilename: file ? file.filename : '',
          resumeOriginalName: file ? file.originalname : '',
          status: 'NEW',
          createdAt: new Date().toISOString(),
        });
      } catch (fe) {
        console.warn('Firestore sync for job application:', fe.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Application received successfully. Thank you for your interest in ANVION IT SERVICES.',
    });
  } catch (error) {
    console.error('Error handling career application:', error);
    res.status(500).json({ error: 'Failed to submit application', details: error.message });
  }
});

// Submit Contact Message
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, service, budget, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // 1. Save to Drizzle PostgreSQL
    await db.insert(contactMessages).values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      company: company ? company.trim() : null,
      service: service || null,
      budget: budget || null,
      message: message.trim(),
      status: 'unread',
      ipAddress: req.ip,
    });

    // 2. Synchronize with Firebase Firestore
    if (adminDb) {
      try {
        await adminDb.collection('contactMessages').add({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : '',
          company: company ? company.trim() : '',
          service: service || '',
          budget: budget || '',
          message: message.trim(),
          status: 'UNREAD',
          ipAddress: req.ip,
          createdAt: new Date().toISOString(),
        });
      } catch (fe) {
        console.warn('Firestore sync for contact message:', fe.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message delivered. Our engineering team will review and respond shortly.',
    });
  } catch (error) {
    console.error('Error storing contact message:', error);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

// Submit Project Enquiry (Multi-step form / Start a Project)
app.post('/api/project-enquiries', upload.single('attachment'), async (req, res) => {
  try {
    const {
      enquiryId,
      name,
      email,
      phone,
      company,
      country,
      projectType,
      servicesNeeded,
      description,
      features,
      referenceWebsites,
      pageCount,
      preferredTech,
      targetUsers,
      timeline,
      budget,
    } = req.body;

    if (!name || !email || !description) {
      return res.status(400).json({ error: 'Name, email, and project description are required.' });
    }

    const file = req.file;
    const genId = enquiryId || ('ANV-ENQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900));

    const parsedServices = Array.isArray(servicesNeeded)
      ? servicesNeeded
      : projectType
      ? [projectType]
      : [];

    // Combine any supplementary fields
    const supplementary = [];
    if (country) supplementary.push(`Country: ${country}`);
    if (pageCount) supplementary.push(`Scope: ${pageCount}`);
    if (preferredTech) supplementary.push(`Preferred Tech: ${preferredTech}`);
    if (referenceWebsites) supplementary.push(`References: ${referenceWebsites}`);
    
    const combinedFeatures = [features, supplementary.join(' | ')].filter(Boolean).join('\n');

    // Optional user token identification
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
        userId = decoded.uid;
      } catch (e) {}
    }

    // 1. Save to Drizzle PostgreSQL
    await db.insert(projectEnquiries).values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : 'Not provided',
      company: company ? company.trim() : null,
      servicesNeeded: parsedServices,
      projectDescription: `[${genId}] ${description.trim()}`,
      requiredFeatures: combinedFeatures || null,
      targetUsers: targetUsers || null,
      timeline: timeline || null,
      budget: budget || null,
      attachmentFilename: file ? file.filename : null,
      attachmentOriginalName: file ? file.originalname : null,
      attachmentMimeType: file ? file.mimetype : null,
      attachmentSizeBytes: file ? file.size : null,
      status: 'new',
    });

    // 2. Synchronize with Firebase Firestore
    if (adminDb) {
      try {
        await adminDb.collection('projectEnquiries').add({
          enquiryId: genId,
          userId: userId || null,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : '',
          company: company ? company.trim() : '',
          country: country || 'India',
          service: parsedServices.join(', ') || projectType || 'Custom Solution',
          description: description.trim(),
          features: combinedFeatures || '',
          targetUsers: targetUsers || '',
          timeline: timeline || '',
          budget: budget || '',
          attachmentFilename: file ? file.filename : null,
          status: 'NEW',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (fe) {
        console.warn('Firestore sync for project enquiry:', fe.message);
      }
    }

    res.status(201).json({
      success: true,
      enquiryId: genId,
      message: 'Project inquiry recorded. An ANVION solutions architect will connect with you within 24-48 hours.',
    });
  } catch (error) {
    console.error('Error storing project enquiry:', error);
    res.status(500).json({ error: 'Failed to submit project inquiry' });
  }
});

// ==========================================
// CONSULTATIONS & BOOKING API
// ==========================================

// Get booked slots for a given date (to disable double-booking)
app.get('/api/consultations/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Query parameter "date" (YYYY-MM-DD) is required.' });
    }
    const booked = await db
      .select({ timeSlot: consultations.timeSlot })
      .from(consultations)
      .where(and(eq(consultations.scheduledDate, String(date)), eq(consultations.status, 'confirmed')));

    res.json({ date, bookedSlots: booked.map((b) => b.timeSlot) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check consultation availability' });
  }
});

// Book a Consultation Slot
app.post('/api/consultations', async (req, res) => {
  try {
    const { name, email, phone, company, consultationType, date, timeSlot, notes } = req.body;
    if (!name || !email || !phone || !date || !timeSlot) {
      return res.status(400).json({ error: 'Name, email, phone, date, and time slot are required.' });
    }

    // Double-booking check
    const existing = await db
      .select()
      .from(consultations)
      .where(and(eq(consultations.scheduledDate, date), eq(consultations.timeSlot, timeSlot), eq(consultations.status, 'confirmed')))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: 'This time slot is already booked. Please choose another slot.' });
    }

    const bookingRef = `ANV-CON-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    await db.insert(consultations).values({
      bookingRef,
      clientName: name.trim(),
      clientEmail: email.trim().toLowerCase(),
      clientPhone: phone.trim(),
      company: company ? company.trim() : null,
      consultationType: consultationType || 'Technical Architecture',
      scheduledDate: date,
      timeSlot,
      notes: notes || null,
      status: 'confirmed',
      meetingLink: 'https://meet.google.com/anv-tech-desk',
    });

    if (adminDb) {
      try {
        await adminDb.collection('consultations').add({
          bookingRef,
          clientName: name.trim(),
          clientEmail: email.trim().toLowerCase(),
          clientPhone: phone.trim(),
          company: company || '',
          consultationType: consultationType || 'Technical Architecture',
          scheduledDate: date,
          timeSlot,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        });
      } catch (fe) {}
    }

    res.status(201).json({
      success: true,
      bookingRef,
      message: 'Consultation successfully scheduled. You will receive a calendar invite shortly.',
      details: { date, timeSlot, meetingLink: 'https://meet.google.com/anv-tech-desk' }
    });
  } catch (error) {
    console.error('Error booking consultation:', error);
    res.status(500).json({ error: 'Failed to schedule consultation' });
  }
});

// ==========================================
// COST ESTIMATOR & PRICING RULES API
// ==========================================

app.get('/api/pricing-rules', async (req, res) => {
  try {
    const rules = await db.select().from(servicePricing).where(eq(servicePricing.isActive, true));
    if (rules.length > 0) {
      return res.json(rules);
    }
    // Default indicative baseline pricing rules
    res.json([
      { serviceSlug: 'web-development', serviceName: 'Website & Web App', basePriceInr: 15000, perPageRateInr: 2000, authPriceInr: 8000, paymentPriceInr: 8000, cmsPriceInr: 10000, maintenanceInr: 3000 },
      { serviceSlug: 'mobile-app', serviceName: 'Cross-Platform Mobile App (Flutter)', basePriceInr: 35000, perPageRateInr: 3500, authPriceInr: 10000, paymentPriceInr: 12000, cmsPriceInr: 15000, maintenanceInr: 5000 },
      { serviceSlug: 'custom-software', serviceName: 'Custom Desktop & Enterprise Software', basePriceInr: 45000, perPageRateInr: 4000, authPriceInr: 12000, paymentPriceInr: 12000, cmsPriceInr: 15000, maintenanceInr: 6000 },
      { serviceSlug: 'digital-marketing', serviceName: 'Digital Marketing & Growth Engine', basePriceInr: 18000, perPageRateInr: 0, authPriceInr: 0, paymentPriceInr: 0, cmsPriceInr: 0, maintenanceInr: 15000 },
      { serviceSlug: 'ai-automation', serviceName: 'AI & Workflow Automation', basePriceInr: 40000, perPageRateInr: 5000, authPriceInr: 12000, paymentPriceInr: 15000, cmsPriceInr: 15000, maintenanceInr: 8000 }
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve pricing rules' });
  }
});

app.post('/api/cost-estimate', async (req, res) => {
  try {
    const { serviceType, pages, complexity, features, maintenanceMonths } = req.body;
    let base = 15000;
    let pageCount = Math.max(1, Number(pages) || 5);

    if (serviceType === 'mobile-app') base = 35000;
    else if (serviceType === 'custom-software') base = 45000;
    else if (serviceType === 'digital-marketing') base = 18000;
    else if (serviceType === 'ai-automation') base = 40000;

    let pageCost = (serviceType === 'digital-marketing') ? 0 : (pageCount * 2200);

    let featureCost = 0;
    const selectedFeatures = Array.isArray(features) ? features : [];
    if (selectedFeatures.includes('auth')) featureCost += 8000;
    if (selectedFeatures.includes('payments')) featureCost += 10000;
    if (selectedFeatures.includes('cms')) featureCost += 12000;
    if (selectedFeatures.includes('api')) featureCost += 12000;
    if (selectedFeatures.includes('offline')) featureCost += 15000;

    let complexityMultiplier = 1.0;
    if (complexity === 'medium') complexityMultiplier = 1.25;
    else if (complexity === 'enterprise') complexityMultiplier = 1.6;

    let subtotal = Math.round((base + pageCost + featureCost) * complexityMultiplier);
    let maintenance = (Number(maintenanceMonths) || 0) * 4500;
    let totalInr = subtotal + maintenance;

    res.json({
      serviceType,
      pages: pageCount,
      complexity: complexity || 'standard',
      subtotalInr: subtotal,
      maintenanceTotalInr: maintenance,
      estimatedTotalInr: totalInr,
      formattedEstimate: `₹${totalInr.toLocaleString('en-IN')}`,
      disclaimer: 'This is an indicative estimate. Final pricing depends on project requirements and technical evaluation.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate estimate' });
  }
});

// ==========================================
// ANVION AI WEBSITE ASSISTANT API
// ==========================================

// Rate limit map for AI requests (IP -> timestamps)
const aiRateLimits = new Map();

app.post('/api/ai/chat', async (req, res) => {
  try {
    const ip = req.ip || 'anonymous';
    const now = Date.now();
    const timestamps = aiRateLimits.get(ip) || [];
    const recent = timestamps.filter((t) => now - t < 600000); // 10 min window
    if (recent.length >= 35) {
      return res.status(429).json({
        reply: 'Rate limit reached. Please wait a few moments or connect directly via WhatsApp at +91 9150270802.',
      });
    }
    recent.push(now);
    aiRateLimits.set(ip, recent);

    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const query = message.trim().toLowerCase();

    // 1. Built-in high-accuracy ANVION knowledge base
    let reply = '';

    if (query.includes('service') || query.includes('what do you do') || query.includes('offer')) {
      reply = `ANVION IT SERVICES engineers high-performance digital products across 6 core domains:
• **Website Development**: Modern responsive portals, e-commerce, and high-speed web apps (React, Vite, Node.js).
• **Mobile App Engineering**: Cross-platform, offline-first mobile apps built with Flutter & SQLite B-Tree.
• **Custom Desktop Software**: High-speed Windows validation tools (e.g., EduVerify 35ms parser).
• **AI & Automation**: Custom LLM workflow agents, data pipelines, and business process automation.
• **Digital Marketing & SEO**: Proven admissions & growth engines (e.g., St. Joseph College 100K+ reach).
• **Cloud & Architecture**: Zero cloud lock-in architectures, PostgreSQL, and secure edge CDN hosting.

Would you like an instant cost estimate or would you like to speak directly with an engineer?`;
    } else if (query.includes('price') || query.includes('cost') || query.includes('quote') || query.includes('budget') || query.includes('rate')) {
      reply = `Our project pricing is transparent with zero hidden fees:
• **Starter / MVP Platforms**: Starting from ₹15,000 – ₹35,000 for standard responsive portals.
• **Growth & Mobile Systems (Flutter)**: ₹35,000 – ₹90,000 depending on features and offline sync.
• **Custom Enterprise & Desktop Systems**: Custom quote based on milestones (typically ₹50,000 – ₹2,50,000+).
• **Digital Marketing Campaigns**: Structured 30-day and ongoing performance retainers.

You can use our interactive **Project Cost Estimator** on our Pricing page, or tap **Start a Project** to receive a tailored architectural proposal within 24 hours.`;
    } else if (query.includes('contact') || query.includes('phone') || query.includes('whatsapp') || query.includes('email') || query.includes('office') || query.includes('location')) {
      reply = `You can connect directly with our engineering team:
• **WhatsApp**: [+91 9150270802](https://wa.me/919150270802) (Fastest technical response)
• **Phone Lines**: +91 9150270802 / +91 8438464047
• **Email**: anvionitservices@gmail.com
• **Official Office**: Door No. 7-69D, Maria Rose Franco, Vilavancode PO, Karungal, Kanniyakumari - 629178, Tamil Nadu, India.
• **Govt MSME Registration**: UDYAM-TN-09-0098980 (Active Micro Enterprise).`;
    } else if (query.includes('project') || query.includes('case study') || query.includes('portfolio') || query.includes('homeluxe') || query.includes('eduverify') || query.includes('st. joseph') || query.includes('client')) {
      reply = `ANVION has engineered verified production systems and campaigns:
1. **HOMELUXE Luxury Real Estate**: Premier estate portal with AI valuation algorithms and RERA diligence.
2. **St. Joseph College of Arts & Science**: 30-day admissions campaign in Tenkasi achieving 100K+ reach and 77.8% non-follower discovery.
3. **Smart Invoice Builder**: Zero-latency field invoicing app generating print-ready A4 PDF invoices with custom GST & UPI QR codes.
4. **EduVerify**: Native Windows software auditing Excel records with a 35ms coordinate validator and 0% cloud data leakage.
5. **Task Planner**: Offline-first Flutter mobile application with encrypted SQLite B-Tree caching.
6. **Virgin Water & Waste Water Solution**: Industrial wastewater engineering & digital brand architecture.

You can inspect the full architecture breakdowns on our **Case Studies** and **Portfolio** pages.`;
    } else if (query.includes('hire') || query.includes('career') || query.includes('job') || query.includes('internship') || query.includes('intern')) {
      reply = `ANVION IT SERVICES is actively accepting applications for full-time roles and student internships in Tamil Nadu & remote India:
• **Full-Stack Web Developers** (React, Node.js, Postgres)
• **Flutter Mobile App Engineers** (Dart, Riverpod, SQLite)
• **AI & Automation Engineers** (Python, LangChain, API integrations)
• **Digital Marketing & Growth Associates**

Check out our **Careers** and **Internships** pages to review requirements and submit your resume directly to our engineering leads.`;
    } else if (query.includes('tech') || query.includes('stack') || query.includes('flutter') || query.includes('react') || query.includes('python')) {
      reply = `ANVION's core technology stack prioritizes performance, security, and zero vendor lock-in:
• **Frontend**: React 18, Vite, Tailwind CSS, Next.js, HTML5/CSS3.
• **Mobile**: Flutter 3, Dart, Riverpod 2.0, SQLite B-Tree (Local-First).
• **Backend**: Node.js, Express, Python, Drizzle ORM, PostgreSQL, REST & WebSockets.
• **Security & Cloud**: Firebase Auth, Vercel Edge CDN, Docker, Air-Gapped Windows Desktop Engines.`;
    } else {
      reply = `Thank you for reaching out to ANVION IT SERVICES! I can help you with:
1. Explaining our services (Web, Mobile, Desktop Software, AI Automation, Digital Marketing).
2. Guiding you through our development process & technology stack.
3. Estimating project budgets and scheduling a free consultation.
4. Directing you to our Smart Project Requirement Builder.

How can we assist your business or project today? You can also message our technical leads directly on WhatsApp at [+91 9150270802](https://wa.me/919150270802).`;
    }

    res.json({
      success: true,
      reply,
      sender: 'ANVION AI',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('ANVION AI Assistant error:', error);
    res.status(500).json({ error: 'AI Assistant temporarily unavailable. Please connect on WhatsApp: +91 9150270802.' });
  }
});

// ==========================================
// BLOG POSTS PUBLIC API
// ==========================================

app.get('/api/blog-posts', async (req, res) => {
  try {
    const posts = await db.select().from(blogPosts).where(eq(blogPosts.status, 'published')).orderBy(desc(blogPosts.publishedAt));
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve blog posts' });
  }
});

app.get('/api/blog-posts/:slug', async (req, res) => {
  try {
    const post = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, req.params.slug), eq(blogPosts.status, 'published'))).limit(1);
    if (!post || post.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(post[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve article' });
  }
});

// ==========================================
// CLIENT PORTAL API (Protected by requireAuth)
// ==========================================

app.get('/api/portal/overview', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    if (!email) return res.status(403).json({ error: 'Authenticated email required.' });

    const clientEnquiries = await db.select().from(projectEnquiries).where(eq(projectEnquiries.email, email)).orderBy(desc(projectEnquiries.createdAt));
    const clientMilestones = await db.select().from(projectMilestones).where(eq(projectMilestones.clientEmail, email)).orderBy(projectMilestones.sequenceOrder);
    const clientInvoices = await db.select().from(invoices).where(eq(invoices.clientEmail, email)).orderBy(desc(invoices.createdAt));
    const clientTickets = await db.select().from(supportTickets).where(eq(supportTickets.clientEmail, email)).orderBy(desc(supportTickets.createdAt));

    res.json({
      clientEmail: email,
      enquiries: clientEnquiries,
      milestones: clientMilestones,
      invoices: clientInvoices,
      tickets: clientTickets
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load portal overview' });
  }
});

app.get('/api/portal/invoices', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    if (!email) return res.status(403).json({ error: 'Authenticated email required.' });

    const list = await db.select().from(invoices).where(eq(invoices.clientEmail, email)).orderBy(desc(invoices.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
});

app.get('/api/portal/tickets', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    if (!email) return res.status(403).json({ error: 'Authenticated email required.' });

    const list = await db.select().from(supportTickets).where(eq(supportTickets.clientEmail, email)).orderBy(desc(supportTickets.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve support tickets' });
  }
});

app.post('/api/portal/tickets', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    const name = req.user?.name || req.body.name || 'Client';
    const { subject, message, priority } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const ticketRef = `ANV-TCK-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    await db.insert(supportTickets).values({
      ticketRef,
      clientEmail: email,
      clientName: name,
      subject: subject.trim(),
      message: message.trim(),
      priority: priority || 'medium',
      status: 'open',
    });

    res.status(201).json({
      success: true,
      ticketRef,
      message: 'Support ticket submitted. An engineer will attend to your request.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// Endpoint: Client-Safe Firebase Config
app.get('/api/firebase-config', (req, res) => {
  const configPath = path.join(publicDir, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return res.json(cfg);
    } catch (e) {}
  }
  res.json({
    projectId: 'pure-formula-xxjsq',
    appId: '1:514186575326:web:b88af124692fd9138c714f',
    apiKey: 'AIzaSyBK1B0W_bTsQ0TGKTJmKknik5IrjjBJcw4',
    authDomain: 'pure-formula-xxjsq.firebaseapp.com',
    storageBucket: 'pure-formula-xxjsq.firebasestorage.app',
    messagingSenderId: '514186575326',
    oAuthClientId: '514186575326-gou7sg4ft1b32dg08p4rc9v7f4usphuq.apps.googleusercontent.com'
  });
});

// Endpoint: Client's own enquiries (for /profile)
app.get('/api/my-enquiries', requireAuth, async (req, res) => {
  try {
    // Never trust an email supplied in the query string; derive identity from the verified token.
    const email = req.user?.email;
    if (!email) {
      return res.status(403).json({ error: 'An authenticated account with an email address is required.' });
    }
    const results = await db
      .select()
      .from(projectEnquiries)
      .where(eq(projectEnquiries.email, String(email).trim().toLowerCase()))
      .orderBy(desc(projectEnquiries.createdAt));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personal enquiries' });
  }
});

// Endpoint: Authoritative Admin Role Assignment (Strict RBAC)
app.post('/api/admin/set-claim', requireAdminAuth, async (req, res) => {
  try {
    const { uid, email, makeAdmin } = req.body;
    if (!uid && !email) {
      return res.status(400).json({ error: 'Target user UID or email is required.' });
    }

    if (!adminAuth) {
      return res.status(500).json({ error: 'Firebase Admin Auth is not configured.' });
    }

    let targetUser;
    if (uid && !uid.includes('@')) {
      targetUser = await adminAuth.getUser(uid);
    } else if (email || uid.includes('@')) {
      targetUser = await adminAuth.getUserByEmail((email || uid).trim().toLowerCase());
    }

    // Set Custom Claims
    const shouldBeAdmin = makeAdmin !== false;
    await adminAuth.setCustomUserClaims(targetUser.uid, { admin: shouldBeAdmin });

    // Sync Firestore admins and users collections
    if (adminDb) {
      if (shouldBeAdmin) {
        await adminDb.collection('admins').doc(targetUser.uid).set({
          uid: targetUser.uid,
          email: targetUser.email,
          role: 'ADMIN',
          grantedBy: req.user?.email || 'admin',
          grantedAt: new Date().toISOString(),
        }, { merge: true });

        await adminDb.collection('users').doc(targetUser.uid).set({
          role: 'ADMIN',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        await adminDb.collection('admins').doc(targetUser.uid).delete();
        await adminDb.collection('users').doc(targetUser.uid).set({
          role: 'USER',
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }

    await logAudit(
      req.user?.email || 'admin',
      shouldBeAdmin ? 'GRANT_ADMIN_ROLE' : 'REVOKE_ADMIN_ROLE',
      `Target: ${targetUser.email} (UID: ${targetUser.uid})`,
      req.ip
    );

    res.json({
      success: true,
      message: `Successfully ${shouldBeAdmin ? 'granted' : 'revoked'} admin role for ${targetUser.email}.`,
      uid: targetUser.uid,
      admin: shouldBeAdmin,
    });
  } catch (error) {
    console.error('Error setting custom claim:', error);
    res.status(500).json({ error: 'Failed to assign custom claim', details: error.message });
  }
});


// ==========================================
// 2. AUTHENTICATION & ADMIN API
// ==========================================

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      return res.status(503).json({ error: 'Admin JWT login is not configured. Set ADMIN_JWT_SECRET to a random value of at least 32 characters.' });
    }

    let authenticatedAdmin = null;

    try {
      if (db) {
        const adminUser = await db
          .select()
          .from(admins)
          .where(eq(admins.email, email.trim().toLowerCase()))
          .limit(1);

        if (adminUser && adminUser.length > 0) {
          const isValid = await bcrypt.compare(password, adminUser[0].passwordHash);
          if (isValid) {
            authenticatedAdmin = {
              id: adminUser[0].id,
              email: adminUser[0].email,
              name: adminUser[0].name,
              role: 'ADMIN',
            };
          }
        }
      }
    } catch (dbErr) {
      console.warn('Database admin lookup skipped:', dbErr.message);
    }

    // Authoritative Admin credentials check (configured admin account)
    const configuredAdminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'annuncio8427@gmail.com').trim().toLowerCase();
    const configuredAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Annuncio@08';

    if (!authenticatedAdmin) {
      if (email.trim().toLowerCase() === configuredAdminEmail && password === configuredAdminPassword) {
        authenticatedAdmin = {
          id: 'admin-annuncio-01',
          email: configuredAdminEmail,
          name: 'Annuncio (Administrator)',
          role: 'ADMIN',
        };
      }
    }

    if (!authenticatedAdmin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: authenticatedAdmin.id,
        email: authenticatedAdmin.email,
        name: authenticatedAdmin.name,
        role: 'ADMIN',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit(authenticatedAdmin.email, 'ADMIN_LOGIN', 'Successful credentials authentication', req.ip);

    res.json({
      success: true,
      token,
      admin: {
        id: authenticatedAdmin.id,
        email: authenticatedAdmin.email,
        name: authenticatedAdmin.name,
        role: authenticatedAdmin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

// Admin Dashboard Summary Metrics (Protected)
app.get('/api/admin/metrics', requireAdminAuth, async (req, res) => {
  try {
    const enquiries = await db.select().from(projectEnquiries);
    const messages = await db.select().from(contactMessages);
    const applications = await db.select().from(jobApplications);
    const projectList = await db.select().from(projects);
    const jobList = await db.select().from(jobs);

    const newEnquiries = enquiries.filter((e) => e.status === 'new').length;
    const unreadMessages = messages.filter((m) => m.status === 'unread').length;
    const newApplications = applications.filter((a) => a.status === 'new').length;

    res.json({
      totals: {
        enquiries: enquiries.length,
        newEnquiries,
        messages: messages.length,
        unreadMessages,
        applications: applications.length,
        newApplications,
        projects: projectList.length,
        activeJobs: jobList.filter((j) => j.status === 'active').length,
      },
      recentEnquiries: enquiries.slice(-5).reverse(),
      recentMessages: messages.slice(-5).reverse(),
      recentApplications: applications.slice(-5).reverse(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate admin metrics' });
  }
});

// Manage Project Enquiries (Protected)
app.get('/api/admin/enquiries', requireAdminAuth, async (req, res) => {
  try {
    const list = await db.select().from(projectEnquiries).orderBy(desc(projectEnquiries.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

app.patch('/api/admin/enquiries/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!Number.isInteger(id) || id < 1 || !['new', 'in_review', 'contacted', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid enquiry ID or status.' });
    }
    await db.update(projectEnquiries).set({ status }).where(eq(projectEnquiries.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_ENQUIRY_STATUS', `ID ${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update enquiry status' });
  }
});

// Manage Contact Messages (Protected)
app.get('/api/admin/messages', requireAdminAuth, async (req, res) => {
  try {
    const list = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.patch('/api/admin/messages/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!Number.isInteger(id) || id < 1 || !['unread', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid message ID or status.' });
    }
    await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_MESSAGE_STATUS', `ID ${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Manage Job Applications (Protected)
app.get('/api/admin/applications', requireAdminAuth, async (req, res) => {
  try {
    const list = await db.select().from(jobApplications).orderBy(desc(jobApplications.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.patch('/api/admin/applications/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!Number.isInteger(id) || id < 1 || !['new', 'reviewed', 'interviewing', 'rejected', 'accepted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid application ID or status.' });
    }
    await db.update(jobApplications).set({ status }).where(eq(jobApplications.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_APPLICATION_STATUS', `ID ${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Secure download for resumes & attachments (Protected)
app.get('/api/admin/download/:filename', requireAdminAuth, (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath);
});

// Manage Projects (Protected)
app.post('/api/admin/projects', requireAdminAuth, async (req, res) => {
  try {
    const {
      title,
      slug,
      category,
      isConcept,
      badgeLabel,
      summary,
      overview,
      problem,
      approach,
      solution,
      features,
      technologies: techList,
      demoUrl,
      githubUrl,
    } = req.body;

    const newProject = await db.insert(projects).values({
      title: title.trim(),
      slug: (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim(),
      category: category || 'software',
      isConcept: isConcept !== undefined ? Boolean(isConcept) : true,
      badgeLabel: badgeLabel || (isConcept ? 'CONCEPT PROJECT' : 'CLIENT WORK'),
      summary: summary || '',
      overview: overview || '',
      problem: problem || null,
      approach: approach || null,
      solution: solution || null,
      features: features || [],
      technologies: techList || [],
      demoUrl: demoUrl || null,
      githubUrl: githubUrl || null,
      status: 'published',
    }).returning();

    await logAudit(req.user?.email || 'admin', 'CREATE_PROJECT', `Created ${title}`, req.ip);
    res.status(201).json(newProject[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// Manage Careers / Jobs (Protected)
app.post('/api/admin/jobs', requireAdminAuth, async (req, res) => {
  try {
    const { title, slug, department, employmentType, location, experience, overview, requirements, responsibilities } = req.body;

    const newJob = await db.insert(jobs).values({
      title: title.trim(),
      slug: (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim(),
      department: department || 'Engineering',
      employmentType: employmentType || 'Full-time',
      location: location || 'Remote (India)',
      experience: experience || '1-3 years',
      overview: overview || '',
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      status: 'active',
    }).returning();

    await logAudit(req.user?.email || 'admin', 'CREATE_JOB', `Created ${title}`, req.ip);
    res.status(201).json(newJob[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job', details: error.message });
  }
});

// Admin Consultation Management (Protected)
app.get('/api/admin/consultations', requireAdminAuth, async (req, res) => {
  try {
    const list = await db.select().from(consultations).orderBy(desc(consultations.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

app.patch('/api/admin/consultations/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!Number.isInteger(id) || id < 1 || !['confirmed', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid consultation ID or status.' });
    }
    await db.update(consultations).set({ status, updatedAt: new Date() }).where(eq(consultations.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_CONSULTATION_STATUS', `ID ${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update consultation status' });
  }
});

// Admin Lead Notes & Stage Tracking (Protected)
app.post('/api/admin/enquiries/:id/notes', requireAdminAuth, async (req, res) => {
  try {
    const enquiryId = Number.parseInt(req.params.id, 10);
    const { note, newStatus } = req.body;
    if (!Number.isInteger(enquiryId) || !note) {
      return res.status(400).json({ error: 'Enquiry ID and note content required.' });
    }

    const currentEnquiry = await db.select().from(projectEnquiries).where(eq(projectEnquiries.id, enquiryId)).limit(1);
    const prevStatus = currentEnquiry[0]?.status || 'new';

    await db.insert(enquiryNotes).values({
      enquiryId,
      authorEmail: req.user?.email || 'admin',
      note: note.trim(),
      previousStatus: prevStatus,
      newStatus: newStatus || prevStatus,
    });

    if (newStatus && newStatus !== prevStatus) {
      await db.update(projectEnquiries).set({ status: newStatus }).where(eq(projectEnquiries.id, enquiryId));
    }

    await logAudit(req.user?.email || 'admin', 'ADD_ENQUIRY_NOTE', `Enquiry #${enquiryId}: ${note.slice(0, 30)}...`, req.ip);
    res.status(201).json({ success: true, message: 'Note recorded successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record lead note' });
  }
});

app.get('/api/admin/enquiries/:id/notes', requireAdminAuth, async (req, res) => {
  try {
    const enquiryId = Number.parseInt(req.params.id, 10);
    const list = await db.select().from(enquiryNotes).where(eq(enquiryNotes.enquiryId, enquiryId)).orderBy(desc(enquiryNotes.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lead notes' });
  }
});

// Admin Export Enquiries to CSV (Protected)
app.get('/api/admin/export-enquiries', requireAdminAuth, async (req, res) => {
  try {
    const list = await db.select().from(projectEnquiries).orderBy(desc(projectEnquiries.createdAt));
    const headers = ['ID', 'Date', 'Name', 'Email', 'Phone', 'Company', 'Services', 'Budget', 'Timeline', 'Status'];
    const rows = list.map((item) => [
      item.id,
      item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '',
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.email || '').replace(/"/g, '""')}"`,
      `"${(item.phone || '').replace(/"/g, '""')}"`,
      `"${(item.company || '').replace(/"/g, '""')}"`,
      `"${(Array.isArray(item.servicesNeeded) ? item.servicesNeeded.join('; ') : '').replace(/"/g, '""')}"`,
      `"${(item.budget || '').replace(/"/g, '""')}"`,
      `"${(item.timeline || '').replace(/"/g, '""')}"`,
      item.status || 'new',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=anvion-enquiries-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export enquiries CSV' });
  }
});

// Admin Invoice & Billing Management (Protected)
app.get('/api/admin/invoices', requireAdminAuth, async (req, res) => {
  try {
    const list = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.post('/api/admin/invoices', requireAdminAuth, async (req, res) => {
  try {
    const { clientEmail, clientName, projectTitle, amountInr, taxInr, dueDate, notes } = req.body;
    if (!clientEmail || !clientName || !projectTitle || !amountInr || !dueDate) {
      return res.status(400).json({ error: 'Client email, name, project title, amount, and due date are required.' });
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amt = Number(amountInr);
    const tax = Number(taxInr) || Math.round(amt * 0.18);
    const total = amt + tax;

    const inserted = await db.insert(invoices).values({
      invoiceNumber,
      clientEmail: clientEmail.trim().toLowerCase(),
      clientName: clientName.trim(),
      projectTitle: projectTitle.trim(),
      amountInr: amt,
      taxInr: tax,
      totalInr: total,
      status: 'unpaid',
      dueDate,
      notes: notes || null,
    }).returning();

    await logAudit(req.user?.email || 'admin', 'CREATE_INVOICE', `Created Invoice ${invoiceNumber} for ${clientEmail}`, req.ip);
    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice', details: error.message });
  }
});

app.patch('/api/admin/invoices/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const { status, paidDate } = req.body;
    if (!Number.isInteger(id) || id < 1 || !['unpaid', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid invoice ID or status.' });
    }
    await db.update(invoices).set({ status, paidDate: paidDate || (status === 'paid' ? new Date().toISOString().split('T')[0] : null) }).where(eq(invoices.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_INVOICE_STATUS', `Invoice #${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// Admin Client Support Tickets (Protected)
app.get('/api/admin/support-tickets', requireAdminAuth, async (req, res) => {
  try {
    const list = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

app.patch('/api/admin/support-tickets/:id/status', requireAdminAuth, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!Number.isInteger(id) || id < 1 || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid ticket ID or status.' });
    }
    await db.update(supportTickets).set({ status, updatedAt: new Date() }).where(eq(supportTickets.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_TICKET_STATUS', `Ticket #${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Admin Pricing Rules Configuration (Protected)
app.get('/api/admin/pricing-rules', requireAdminAuth, async (req, res) => {
  try {
    const list = await db.select().from(servicePricing);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pricing rules' });
  }
});

app.post('/api/admin/pricing-rules', requireAdminAuth, async (req, res) => {
  try {
    const { serviceSlug, serviceName, basePriceInr, perPageRateInr, authPriceInr, paymentPriceInr, cmsPriceInr, maintenanceInr } = req.body;
    if (!serviceSlug || !serviceName || !basePriceInr) {
      return res.status(400).json({ error: 'Slug, name, and base price are required.' });
    }

    const inserted = await db.insert(servicePricing).values({
      serviceSlug,
      serviceName,
      basePriceInr: Number(basePriceInr),
      perPageRateInr: Number(perPageRateInr) || 2500,
      authIntegrationPriceInr: Number(authPriceInr) || 8000,
      paymentGatewayPriceInr: Number(paymentPriceInr) || 10000,
      cmsIntegrationPriceInr: Number(cmsPriceInr) || 12000,
      monthlyMaintenanceInr: Number(maintenanceInr) || 5000,
      isActive: true,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: servicePricing.serviceSlug,
      set: {
        serviceName,
        basePriceInr: Number(basePriceInr),
        perPageRateInr: Number(perPageRateInr) || 2500,
        authIntegrationPriceInr: Number(authPriceInr) || 8000,
        paymentGatewayPriceInr: Number(paymentPriceInr) || 10000,
        cmsIntegrationPriceInr: Number(cmsPriceInr) || 12000,
        monthlyMaintenanceInr: Number(maintenanceInr) || 5000,
        updatedAt: new Date(),
      }
    }).returning();

    await logAudit(req.user?.email || 'admin', 'UPDATE_PRICING_RULE', `Rule for ${serviceSlug}`, req.ip);
    res.status(201).json(inserted[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save pricing rule', details: error.message });
  }
});


// ==========================================
// EXTENDED ADMIN PORTAL API (Protected by requireAdminAuth)
// ==========================================

// Client Management
app.get('/api/admin/clients', requireAdminAuth, async (req, res) => {
  try {
    if (adminDb) {
      try {
        const snap = await adminDb.collection('clients').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          return res.json(list);
        }
      } catch (e) {}
    }
    res.json(portalStore.clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

app.post('/api/admin/clients', requireAdminAuth, async (req, res) => {
  try {
    const { name, companyName, email, phone, address, gstNumber, website, category, notes, assignedManager } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Client name and email are required.' });
    }

    const clientId = `CLI-${Date.now().toString().slice(-4)}`;
    const newClient = {
      id: clientId,
      uid: `client-${Date.now().toString(36)}`,
      name: name.trim(),
      companyName: (companyName || '').trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      gstNumber: (gstNumber || '').trim(),
      website: (website || '').trim(),
      category: category || 'General',
      status: 'ACTIVE',
      assignedManager: assignedManager || 'Annuncio (Lead Architect)',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (adminDb) {
      try {
        await adminDb.collection('clients').doc(clientId).set(newClient);
      } catch (e) {}
    }
    portalStore.clients.unshift(newClient);

    await logAudit(req.user?.email || 'admin', 'CREATE_CLIENT', `Created Client ${name} (${email})`, req.ip);
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client record', details: error.message });
  }
});

app.patch('/api/admin/clients/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    delete updates.id;

    if (adminDb) {
      try {
        await adminDb.collection('clients').doc(id).set(updates, { merge: true });
      } catch (e) {}
    }

    const idx = portalStore.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      portalStore.clients[idx] = { ...portalStore.clients[idx], ...updates };
    }

    await logAudit(req.user?.email || 'admin', 'UPDATE_CLIENT', `Updated Client ${id}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

app.delete('/api/admin/clients/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (adminDb) {
      try {
        await adminDb.collection('clients').doc(id).delete();
      } catch (e) {}
    }
    portalStore.clients = portalStore.clients.filter(c => c.id !== id);
    await logAudit(req.user?.email || 'admin', 'DELETE_CLIENT', `Deleted Client ${id}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// Leads & CRM Management
app.get('/api/admin/leads', requireAdminAuth, async (req, res) => {
  try {
    let enquiries = [];
    try {
      enquiries = await db.select().from(projectEnquiries).orderBy(desc(projectEnquiries.createdAt));
    } catch (e) {
      enquiries = [];
    }

    let messages = [];
    try {
      messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    } catch (e) {
      messages = [];
    }

    const mappedLeads = [
      ...portalStore.leads,
      ...enquiries.map(e => ({
        id: `ENQ-${e.id}`,
        source: 'Website Start a Project',
        name: e.name,
        email: e.email,
        phone: e.phone,
        company: e.company || '',
        service: Array.isArray(e.servicesNeeded) ? e.servicesNeeded.join(', ') : (e.servicesNeeded || 'General'),
        budget: e.budget || 'Custom',
        timeline: e.timeline || 'Flexible',
        description: e.projectDescription,
        status: e.status === 'new' ? 'New' : e.status === 'contacted' ? 'Contacted' : e.status === 'in_review' ? 'Qualified' : 'Converted',
        priority: 'High',
        createdAt: e.createdAt || new Date().toISOString()
      })),
      ...messages.map(m => ({
        id: `MSG-${m.id}`,
        source: 'Website Contact Form',
        name: m.name,
        email: m.email,
        phone: m.phone || '',
        company: m.company || '',
        service: m.service || 'Inquiry',
        budget: m.budget || 'Custom',
        description: m.message,
        status: m.status === 'unread' ? 'New' : m.status === 'replied' ? 'Contacted' : 'Qualified',
        priority: 'Medium',
        createdAt: m.createdAt || new Date().toISOString()
      }))
    ];

    res.json(mappedLeads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate CRM leads' });
  }
});

app.post('/api/admin/leads', requireAdminAuth, async (req, res) => {
  try {
    const { name, email, phone, company, service, budget, description, status, priority, source } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required for leads.' });
    }

    const leadId = `LEAD-${Date.now().toString().slice(-5)}`;
    const newLead = {
      id: leadId,
      source: source || 'Manual Entry',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      company: (company || '').trim(),
      service: service || 'Custom Software',
      budget: budget || '₹50,000 - ₹1,00,000',
      description: description || '',
      status: status || 'New',
      priority: priority || 'Medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    portalStore.leads.unshift(newLead);
    if (adminDb) {
      try {
        await adminDb.collection('leads').doc(leadId).set(newLead);
      } catch (e) {}
    }

    await logAudit(req.user?.email || 'admin', 'CREATE_LEAD', `Added Lead ${name} (${email})`, req.ip);
    res.status(201).json(newLead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record lead' });
  }
});

app.patch('/api/admin/leads/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { status, priority, notes } = req.body;

    const lead = portalStore.leads.find(l => l.id === id);
    if (lead) {
      if (status) lead.status = status;
      if (priority) lead.priority = priority;
      if (notes) lead.notes = notes;
      lead.updatedAt = new Date().toISOString();
    }

    await logAudit(req.user?.email || 'admin', 'UPDATE_LEAD', `Updated Lead ${id} -> ${status || priority}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// Tasks & Milestones Management
app.get('/api/admin/tasks', requireAdminAuth, async (req, res) => {
  try {
    if (adminDb) {
      try {
        const snap = await adminDb.collection('tasks').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          return res.json(list);
        }
      } catch (e) {}
    }
    res.json(portalStore.tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/admin/tasks', requireAdminAuth, async (req, res) => {
  try {
    const { title, projectId, clientEmail, assignedStaff, dueDate, priority, status, isClientVisible, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const taskId = `TSK-${Date.now().toString().slice(-4)}`;
    const newTask = {
      id: taskId,
      title: title.trim(),
      projectId: projectId || 'PRJ-GEN',
      clientEmail: (clientEmail || '').trim().toLowerCase(),
      assignedStaff: assignedStaff || 'Engineering Team',
      dueDate: dueDate || '',
      priority: priority || 'medium',
      status: status || 'To Do',
      progress: status === 'Completed' ? 100 : 0,
      isClientVisible: isClientVisible !== false,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    portalStore.tasks.unshift(newTask);
    if (adminDb) {
      try {
        await adminDb.collection('tasks').doc(taskId).set(newTask);
      } catch (e) {}
    }

    await logAudit(req.user?.email || 'admin', 'CREATE_TASK', `Created Task ${title}`, req.ip);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.patch('/api/admin/tasks/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const updates = { ...req.body, updatedAt: new Date().toISOString() };

    const idx = portalStore.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      portalStore.tasks[idx] = { ...portalStore.tasks[idx], ...updates };
    }

    if (adminDb) {
      try {
        await adminDb.collection('tasks').doc(id).set(updates, { merge: true });
      } catch (e) {}
    }

    await logAudit(req.user?.email || 'admin', 'UPDATE_TASK', `Updated Task ${id}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/admin/tasks/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    portalStore.tasks = portalStore.tasks.filter(t => t.id !== id);
    if (adminDb) {
      try {
        await adminDb.collection('tasks').doc(id).delete();
      } catch (e) {}
    }
    await logAudit(req.user?.email || 'admin', 'DELETE_TASK', `Deleted Task ${id}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Payments & Receipts
app.get('/api/admin/payments', requireAdminAuth, async (req, res) => {
  try {
    if (adminDb) {
      try {
        const snap = await adminDb.collection('payments').get();
        if (!snap.empty) {
          const list = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() }));
          return res.json(list);
        }
      } catch (e) {}
    }
    res.json(portalStore.payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

app.post('/api/admin/payments', requireAdminAuth, async (req, res) => {
  try {
    const { invoiceNumber, clientEmail, amountInr, method, referenceNumber, notes } = req.body;
    if (!invoiceNumber || !amountInr) {
      return res.status(400).json({ error: 'Invoice number and amount are required.' });
    }

    const paymentId = `PAY-${Date.now().toString().slice(-4)}`;
    const newPayment = {
      id: paymentId,
      invoiceNumber: invoiceNumber.trim(),
      clientEmail: (clientEmail || '').trim().toLowerCase(),
      amountInr: Number(amountInr),
      method: method || 'Bank Transfer / UPI',
      referenceNumber: referenceNumber || `REF-${Date.now().toString(36).toUpperCase()}`,
      status: 'VERIFIED',
      recordedBy: req.user?.email || 'admin',
      notes: notes || '',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    portalStore.payments.unshift(newPayment);

    try {
      if (db) {
        await db.update(invoices).set({ status: 'paid', paidDate: newPayment.date }).where(eq(invoices.invoiceNumber, invoiceNumber));
      }
    } catch (e) {}

    if (adminDb) {
      try {
        await adminDb.collection('payments').doc(paymentId).set(newPayment);
      } catch (e) {}
    }

    await logAudit(req.user?.email || 'admin', 'RECORD_PAYMENT', `Recorded ₹${amountInr} for ${invoiceNumber}`, req.ip);
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

app.patch('/api/admin/payments/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { status, notes } = req.body;
    const payment = portalStore.payments.find(p => p.id === id);
    if (payment) {
      if (status) payment.status = status;
      if (notes) payment.notes = notes;
    }
    await logAudit(req.user?.email || 'admin', 'UPDATE_PAYMENT', `Updated Payment ${id}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Admin Audit Logs (Immutable)
app.get('/api/admin/audit-logs', requireAdminAuth, async (req, res) => {
  try {
    let logs = [];
    try {
      logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
    } catch (e) {
      logs = [];
    }
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Admin CMS & Dynamic Content
app.get('/api/admin/website-content', requireAdminAuth, async (req, res) => {
  try {
    if (adminDb) {
      try {
        const docSnap = await adminDb.collection('websiteContent').doc('global').get();
        if (docSnap.exists) {
          return res.json(docSnap.data());
        }
      } catch (e) {}
    }
    res.json({
      companyName: 'ANVION IT SERVICES',
      tagline: 'We Build Digital Products That Scale Real Businesses',
      officialEmail: 'anvionitservices@gmail.com',
      officialPhone: '+91 9150270802',
      address: 'Tamil Nadu, India',
      msmeNumber: 'UDYAM-TN-09-0098980'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch website content' });
  }
});

app.post('/api/admin/website-content', requireAdminAuth, async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    if (adminDb) {
      try {
        await adminDb.collection('websiteContent').doc('global').set(data, { merge: true });
      } catch (e) {}
    }
    await logAudit(req.user?.email || 'admin', 'UPDATE_CMS_CONTENT', 'Saved website content parameters', req.ip);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update CMS content' });
  }
});

app.patch('/api/admin/website-content/:id', requireAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const data = { ...req.body, updatedAt: new Date().toISOString() };
    if (adminDb) {
      try {
        await adminDb.collection('websiteContent').doc(id).set(data, { merge: true });
      } catch (e) {}
    }
    await logAudit(req.user?.email || 'admin', 'UPDATE_CMS_ENTITY', `Updated ${id}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update CMS entity' });
  }
});

// ==========================================
// CLIENT PORTAL EXTENSIONS (Protected by requireAuth)
// ==========================================

app.get('/api/portal/projects', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    if (!email) return res.status(403).json({ error: 'Authenticated email required.' });

    let list = [];
    try {
      list = await db.select().from(projects).where(eq(projects.status, 'published'));
    } catch (e) {
      list = [];
    }

    let milestones = [];
    try {
      milestones = await db.select().from(projectMilestones).where(eq(projectMilestones.clientEmail, email));
    } catch (e) {}

    res.json({
      projects: list,
      milestones
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve client projects' });
  }
});

app.get('/api/portal/tasks', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    const uid = req.user?.uid;
    if (!email) return res.status(403).json({ error: 'Authenticated identity required.' });

    const clientTasks = portalStore.tasks.filter(t => 
      t.isClientVisible === true && 
      (!t.clientEmail || t.clientEmail === email || t.clientId === uid)
    );

    res.json(clientTasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load client tasks' });
  }
});

app.get('/api/portal/payments', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    if (!email) return res.status(403).json({ error: 'Authenticated email required.' });

    const clientPayments = portalStore.payments.filter(p => p.clientEmail === email);
    res.json(clientPayments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load client payment history' });
  }
});

app.post('/api/portal/payments/reference', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    const { invoiceNumber, amountInr, referenceNumber, paymentMethod, notes } = req.body;
    if (!invoiceNumber || !amountInr || !referenceNumber) {
      return res.status(400).json({ error: 'Invoice number, amount, and reference number/UTR are required.' });
    }

    const paymentId = `PAY-REF-${Date.now().toString().slice(-4)}`;
    const submission = {
      id: paymentId,
      invoiceNumber: invoiceNumber.trim(),
      clientEmail: email,
      amountInr: Number(amountInr),
      method: paymentMethod || 'UPI / Bank Transfer',
      referenceNumber: referenceNumber.trim(),
      status: 'PENDING_VERIFICATION',
      notes: notes || '',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    portalStore.payments.push(submission);
    res.status(201).json({
      success: true,
      message: 'Payment reference submitted successfully. Our accounts team will verify and update your invoice.',
      payment: submission
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit payment reference' });
  }
});

app.get('/api/portal/profile', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    const client = portalStore.clients.find(c => c.email === email);
    res.json({
      uid: req.user?.uid,
      email: req.user?.email,
      name: client?.name || req.user?.name || req.user?.email?.split('@')[0],
      companyName: client?.companyName || 'Enterprise Partner',
      phone: client?.phone || '',
      address: client?.address || '',
      role: req.user?.role || 'CLIENT',
      assignedManager: client?.assignedManager || 'Annuncio (Lead Architect)'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client profile' });
  }
});

app.patch('/api/portal/profile', requireAuth, async (req, res) => {
  try {
    const email = req.user?.email?.toLowerCase();
    const { name, phone, companyName, address } = req.body;

    let client = portalStore.clients.find(c => c.email === email);
    if (!client) {
      client = {
        id: `CLI-${Date.now().toString().slice(-4)}`,
        uid: req.user?.uid,
        email,
        name: name || '',
        phone: phone || '',
        companyName: companyName || '',
        address: address || '',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      portalStore.clients.push(client);
    } else {
      if (name) client.name = name.trim();
      if (phone) client.phone = phone.trim();
      if (companyName) client.companyName = companyName.trim();
      if (address) client.address = address.trim();
      client.updatedAt = new Date().toISOString();
    }

    res.json({ success: true, profile: client });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client profile' });
  }
});

app.get('/api/portal/notifications', requireAuth, async (req, res) => {
  try {
    const items = [
      {
        id: 'NOTIF-1',
        title: 'Project Sprint 4 In Progress',
        message: 'Milestone build deliverables updated by engineering team.',
        read: false,
        timestamp: new Date().toISOString()
      },
      {
        id: 'NOTIF-2',
        title: 'Enterprise Architecture Support Online',
        message: 'Your dedicated SLA response channel is operational (< 15 min guarantee).',
        read: true,
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// ==========================================
// 3. STATIC FILES & FALLBACK
// ==========================================

// Do not expose server code, dependency metadata, configuration, or private uploads.
app.use((req, res, next) => {
  const pathname = decodeURIComponent(req.path);
  const blockedPath = /^\/(?:src|node_modules|uploads|\.git)(?:\/|$)/i.test(pathname);
  const blockedFile = /^\/(?:server\.js|package(?:-lock)?\.json|bun\.lock|pnpm-lock\.yaml|yarn\.lock|drizzle\.config\.[^/]+|tsconfig(?:\.[^/]+)?|firestore\.rules(?:\.test\.[^/]+)?|firebase-blueprint\.json)$/i.test(pathname);
  if (blockedPath || blockedFile) return res.status(404).end();
  next();
});

// Vercel publishes public/** through its CDN. express.static() and file-based
// fallbacks are retained only for local development.
if (!process.env.VERCEL) {
  app.use(express.static(publicDir, {
    extensions: ['html', 'htm'],
    index: 'index.html',
    fallthrough: true,
  }));
}

const servePage = (file) => (req, res) => {
  if (process.env.VERCEL) return res.redirect(308, `/${file}`);
  return res.sendFile(path.join(publicDir, file));
};

// Explicit HTML Page Routes
app.get('/login', servePage('login.html'));
app.get('/signup', servePage('signup.html'));
app.get('/forgot-password', servePage('forgot-password.html'));
app.get('/profile', servePage('profile.html'));
app.get('/portal', servePage('dashboard.html'));
app.get('/dashboard', servePage('dashboard.html'));
app.get('/admin/dashboard', servePage('admin.html'));
app.get('/admin/clients', servePage('admin.html'));
app.get('/admin/leads', servePage('admin.html'));
app.get('/admin/projects', servePage('admin.html'));
app.get('/admin/tasks', servePage('admin.html'));
app.get('/admin/invoices', servePage('admin.html'));
app.get('/admin/payments', servePage('admin.html'));
app.get('/admin/services', servePage('admin.html'));
app.get('/admin/messages', servePage('admin.html'));
app.get('/admin/settings', servePage('admin.html'));

app.get('/admin-login', servePage('admin-login.html'));
app.get('/admin/login', servePage('admin/login.html'));
app.get('/admin', servePage('admin.html'));
app.get('/start-a-project', servePage('start-a-project.html'));
app.get('/contact', servePage('contact.html'));
app.get('/careers', servePage('careers.html'));
app.get('/internships', servePage('internships.html'));
app.get('/case-studies', servePage('case-studies.html'));
app.get('/pricing', servePage('pricing.html'));
app.get('/blog', servePage('blog.html'));
app.get('/404', servePage('404.html'));

// Local fallback only. Vercel's CDN serves public/index.html at / and returns
// its normal 404 for unknown static paths without invoking this function.
if (!process.env.VERCEL) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}


// Normalize unhandled route/middleware errors into predictable API responses.
// This prevents Express from leaving a serverless invocation in an undefined state.
app.use((error, req, res, next) => {
  console.error('[ANVION API ERROR]', {
    method: req.method,
    path: req.originalUrl,
    message: error?.message,
    stack: error?.stack,
  });

  if (res.headersSent) return next(error);

  const statusCode = Number.isInteger(error?.statusCode)
    ? error.statusCode
    : Number.isInteger(error?.status) && error.status >= 400 && error.status < 600
      ? error.status
      : 500;

  return res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : (error.message || 'Request failed'),
  });
});


// Vercel executes the exported Express app as a serverless function.
// Keep the listener only for local/self-hosted execution.
if (!process.env.VERCEL) {
  const server = app.listen(PORT, HOST, () => {
    console.log(`ANVION Production Engine running at http://${HOST}:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use by active process. Existing listener retained.`);
    } else {
      console.error('Server listen error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
