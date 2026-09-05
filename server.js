import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, desc } from 'drizzle-orm';
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
} from './src/db/schema.ts';
import { requireAuth, requireAdminAuth } from './src/middleware/auth.js';
import { adminAuth, adminDb } from './src/lib/firebase-admin.ts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'anvion_secure_super_secret_jwt_key_2026';

// Uploads configuration
const uploadDir = path.join(__dirname, 'uploads');
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
    console.error('Audit log failed:', e);
  }
}

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
        .where(eq(projects.category, category))
        .orderBy(desc(projects.createdAt));
    } else {
      list = await db
        .select()
        .from(projects)
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
      .where(eq(projects.slug, req.params.slug))
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
    const list = await db.select().from(services).orderBy(desc(services.createdAt));
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
      name,
      email,
      phone,
      company,
      projectType,
      servicesNeeded,
      description,
      features,
      targetUsers,
      timeline,
      budget,
    } = req.body;

    if (!name || !email || !description) {
      return res.status(400).json({ error: 'Name, email, and project description are required.' });
    }

    const file = req.file;

    const parsedServices = Array.isArray(servicesNeeded)
      ? servicesNeeded
      : projectType
      ? [projectType]
      : [];

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
      projectDescription: description.trim(),
      requiredFeatures: features || null,
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
          userId: userId || null,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : '',
          company: company ? company.trim() : '',
          service: parsedServices.join(', ') || projectType || 'Custom Solution',
          description: description.trim(),
          features: features || '',
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
      message: 'Project inquiry recorded. An ANVION solutions architect will connect with you within 24-48 hours.',
    });
  } catch (error) {
    console.error('Error storing project enquiry:', error);
    res.status(500).json({ error: 'Failed to submit project inquiry' });
  }
});

// Endpoint: Client-Safe Firebase Config
app.get('/api/firebase-config', (req, res) => {
  const configPath = path.join(__dirname, 'firebase-applet-config.json');
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
app.get('/api/my-enquiries', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.json([]);
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

    const adminUser = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email.trim().toLowerCase()))
      .limit(1);

    if (!adminUser || adminUser.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, adminUser[0].passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: adminUser[0].id,
        email: adminUser[0].email,
        name: adminUser[0].name,
        role: adminUser[0].role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit(adminUser[0].email, 'ADMIN_LOGIN', 'Successful credentials authentication', req.ip);

    res.json({
      success: true,
      token,
      admin: {
        id: adminUser[0].id,
        email: adminUser[0].email,
        name: adminUser[0].name,
        role: adminUser[0].role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Authentication service error' });
  }
});

// Admin Dashboard Summary Metrics (Protected)
app.get('/api/admin/metrics', requireAuth, async (req, res) => {
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
app.get('/api/admin/enquiries', requireAuth, async (req, res) => {
  try {
    const list = await db.select().from(projectEnquiries).orderBy(desc(projectEnquiries.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

app.patch('/api/admin/enquiries/:id/status', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    await db.update(projectEnquiries).set({ status }).where(eq(projectEnquiries.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_ENQUIRY_STATUS', `ID ${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update enquiry status' });
  }
});

// Manage Contact Messages (Protected)
app.get('/api/admin/messages', requireAuth, async (req, res) => {
  try {
    const list = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.patch('/api/admin/messages/:id/status', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    await db.update(contactMessages).set({ status }).where(eq(contactMessages.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_MESSAGE_STATUS', `ID ${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

// Manage Job Applications (Protected)
app.get('/api/admin/applications', requireAuth, async (req, res) => {
  try {
    const list = await db.select().from(jobApplications).orderBy(desc(jobApplications.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.patch('/api/admin/applications/:id/status', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    await db.update(jobApplications).set({ status }).where(eq(jobApplications.id, id));
    await logAudit(req.user?.email || 'admin', 'UPDATE_APPLICATION_STATUS', `ID ${id} -> ${status}`, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Secure download for resumes & attachments (Protected)
app.get('/api/admin/download/:filename', requireAuth, (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(uploadDir, safeFilename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath);
});

// Manage Projects (Protected)
app.post('/api/admin/projects', requireAuth, async (req, res) => {
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
app.post('/api/admin/jobs', requireAuth, async (req, res) => {
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

// ==========================================
// 3. STATIC FILES & FALLBACK
// ==========================================

// Serve static HTML/assets from root
app.use(express.static(__dirname, {
  extensions: ['html', 'htm'],
}));

// Explicit HTML Page Routes
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/forgot-password', (req, res) => res.sendFile(path.join(__dirname, 'forgot-password.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'profile.html')));
app.get('/admin-login', (req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/start-a-project', (req, res) => res.sendFile(path.join(__dirname, 'start-a-project.html')));
app.get('/contact', (req, res) => res.sendFile(path.join(__dirname, 'contact.html')));
app.get('/careers', (req, res) => res.sendFile(path.join(__dirname, 'careers.html')));
app.get('/case-studies', (req, res) => res.sendFile(path.join(__dirname, 'case-studies.html')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


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

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
