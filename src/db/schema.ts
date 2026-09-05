import { relations } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table (linked to Firebase Auth UID and/or admin accounts)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('user').notNull(), // 'admin' or 'user'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. Admins table (supporting both Firebase Auth and secure direct admin login)
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').default('superadmin').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Project Categories
export const projectCategories = pgTable('project_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Projects table (with concept vs client project distinction)
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(), // Web, Mobile, Custom Software, AI, Cloud, IoT
  isConcept: boolean('is_concept').default(true).notNull(), // clearly labelled 'CONCEPT PROJECT' or 'ANVION DEMO'
  badgeLabel: text('badge_label').default('CONCEPT PROJECT'),
  summary: text('summary').notNull(),
  overview: text('overview').notNull(),
  problem: text('problem'),
  approach: text('approach'),
  solution: text('solution'),
  features: jsonb('features').default([]),
  technologies: jsonb('technologies').default([]),
  imageUrl: text('image_url'),
  demoUrl: text('demo_url'),
  githubUrl: text('github_url'),
  challenges: text('challenges'),
  results: text('results'),
  futureImprovements: text('future_improvements'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  status: text('status').default('published').notNull(), // published, draft
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 5. Services table
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
  tagline: text('tagline').notNull(),
  overview: text('overview').notNull(),
  problemsSolved: jsonb('problems_solved').default([]),
  servicesIncluded: jsonb('services_included').default([]),
  features: jsonb('features').default([]),
  technologies: jsonb('technologies').default([]),
  developmentProcess: jsonb('development_process').default([]),
  useCases: jsonb('use_cases').default([]),
  status: text('status').default('published').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Solutions table
export const solutions = pgTable('solutions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
  category: text('category').notNull(),
  problem: text('problem').notNull(),
  solution: text('solution').notNull(),
  features: jsonb('features').default([]),
  benefits: jsonb('benefits').default([]),
  technologies: jsonb('technologies').default([]),
  status: text('status').default('published').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 7. Industries table
export const industries = pgTable('industries', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon').notNull(),
  overview: text('overview').notNull(),
  challenges: jsonb('challenges').default([]),
  solutions: jsonb('solutions').default([]),
  benefits: jsonb('benefits').default([]),
  status: text('status').default('published').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 8. Technologies table
export const technologies = pgTable('technologies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // Frontend, Backend, Mobile, Database, Cloud, AI/ML, DevOps, IoT, Design
  icon: text('icon'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Careers / Jobs table
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  department: text('department').notNull(),
  employmentType: text('employment_type').notNull(), // Full-time, Part-time, Internship, Contract
  location: text('location').notNull(), // Remote, Hybrid, Onsite
  experience: text('experience').notNull(),
  overview: text('overview').notNull(),
  responsibilities: jsonb('responsibilities').default([]),
  requirements: jsonb('requirements').default([]),
  niceToHave: jsonb('nice_to_have').default([]),
  benefits: jsonb('benefits').default([]),
  status: text('status').default('active').notNull(), // active, closed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 10. Job Applications table (with secure resume upload metadata)
export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id),
  jobTitle: text('job_title').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  resumeFilename: text('resume_filename').notNull(),
  resumeOriginalName: text('resume_original_name').notNull(),
  resumeMimeType: text('resume_mime_type').notNull(),
  resumeSizeBytes: integer('resume_size_bytes').notNull(),
  linkedInUrl: text('linkedin_url'),
  githubUrl: text('github_url'),
  portfolioUrl: text('portfolio_url'),
  coverLetter: text('cover_letter'),
  status: text('status').default('new').notNull(), // new, reviewed, interviewing, rejected, accepted
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Blog / Insights Posts table
export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(), // Technology, AI, Web Development, Mobile Development, Cloud, Business Automation, Cybersecurity, Company News
  author: text('author').notNull().default('ANVION Engineering'),
  authorRole: text('author_role').default('Technology Team'),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  readTime: text('read_time').default('5 min read').notNull(),
  status: text('status').default('published').notNull(), // published, draft
  publishedAt: timestamp('published_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 12. Testimonials table (real & verified only, managed via admin)
export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  clientRole: text('client_role').notNull(),
  clientCompany: text('client_company'),
  rating: integer('rating').default(5).notNull(),
  quote: text('quote').notNull(),
  verified: boolean('verified').default(true).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 13. FAQs table
export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').default('general').notNull(), // general, services, pricing, technical
  sortOrder: integer('sort_order').default(0).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 14. Contact Messages table
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  service: text('service'),
  budget: text('budget'),
  message: text('message').notNull(),
  status: text('status').default('unread').notNull(), // unread, read, replied, archived
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 15. Project Enquiries table (multi-step form)
export const projectEnquiries = pgTable('project_enquiries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  company: text('company'),
  servicesNeeded: jsonb('services_needed').default([]), // Website, Mobile App, Custom Software, AI, etc.
  projectDescription: text('project_description').notNull(),
  requiredFeatures: text('required_features'),
  targetUsers: text('target_users'),
  timeline: text('timeline'),
  budget: text('budget'),
  attachmentFilename: text('attachment_filename'),
  attachmentOriginalName: text('attachment_original_name'),
  attachmentMimeType: text('attachment_mime_type'),
  attachmentSizeBytes: integer('attachment_size_bytes'),
  status: text('status').default('new').notNull(), // new, in_review, contacted, closed
  createdAt: timestamp('created_at').defaultNow(),
});

// 16. Site Settings & Audit Log
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  adminEmail: text('admin_email').notNull(),
  action: text('action').notNull(),
  details: text('details'),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at').defaultNow(),
});
