# ANVION Security Specification & Rules Design

## 1. Data Invariants & Authorization Boundaries

1. **Identity & Role Authorization**:
   - Every registered user belongs to role `USER`.
   - Users are strictly forbidden from setting or mutating their own `role` or claiming `admin` status.
   - Administrative access requires a verified Firebase Custom Claim (`request.auth.token.admin == true`) OR presence in the trusted `/databases/$(database)/documents/admins/$(request.auth.uid)` document.
   - PII Isolation: Users may read/write only their own document in `/users/{userId}` where `request.auth.uid == userId`. Admins may read users for administrative oversight.

2. **Project Enquiries (`/projectEnquiries/{enquiryId}`)**:
   - Any client (or authenticated user) can create a project inquiry.
   - If authenticated, `incoming().userId == request.auth.uid`. If unauthenticated, `incoming().userId == null` or absent.
   - Normal users can read and list ONLY their own inquiries (`resource.data.userId == request.auth.uid`).
   - Normal users CANNOT modify inquiry status or delete inquiries.
   - Only Admins have full read, update (e.g. status transition), and delete privileges.

3. **Contact Messages (`/contactMessages/{messageId}`)**:
   - Anyone can create a contact message.
   - If authenticated, `incoming().userId == request.auth.uid`.
   - Normal users cannot read all contact messages.
   - Admins can read, update status (`UNREAD`, `READ`, `REPLIED`, `ARCHIVED`), and delete messages.

4. **Public CMS Collections (`projects`, `services`, `reviews`, `blogPosts`, `jobs`, `faqs`, `solutions`, `websiteContent`)**:
   - Public / Unauthenticated users can only READ documents where `resource.data.published == true` or `resource.data.published == 'true'`.
   - ONLY Admins can create, update, delete, or read unpublished drafts.

5. **Confidential Job Applications (`/jobApplications/{applicationId}`)**:
   - Anyone can submit a job application (`create`).
   - Only authorized Admins can read, list, update candidate status, or delete applications.

6. **Admin Audit Logs (`/adminAuditLogs/{logId}`)**:
   - Append-only for Admins. No updates or deletions allowed.

---

## 2. The "Dirty Dozen" Payloads (Designed to Break Identity, State & Integrity)

The following 12 attack vectors are specifically audited against our security rules:

1. **Payload 1 - Privilege Escalation on Signup**:
   A normal user sends `{ uid: "attacker123", email: "user@test.com", role: "ADMIN" }` to `/users/attacker123`.
   *Target Result: Denied. Users cannot self-assign role = "ADMIN".*

2. **Payload 2 - PII Snoop / Identity Impersonation**:
   User A requests `get /users/VictimUser456`.
   *Target Result: Denied. Users can only read their own profile.*

3. **Payload 3 - Inquiry Status Hijack**:
   A customer submits an update to `/projectEnquiries/enquiry789` changing `status: "COMPLETED"`.
   *Target Result: Denied. Only admins can modify inquiry status.*

4. **Payload 4 - Cross-Tenant Project Inquiry Scraping**:
   User A executes `list /projectEnquiries` attempting to retrieve User B's proprietary project brief.
   *Target Result: Denied. Client list queries must evaluate `resource.data.userId == request.auth.uid`.*

5. **Payload 5 - Unauthenticated CMS Defacement**:
   An anonymous visitor executes `update /projects/fintech-case-study` with malicious title or links.
   *Target Result: Denied. Requires verified admin custom claim.*

6. **Payload 6 - Unpublished Blog Leak**:
   An unauthenticated visitor queries `get /blogPosts/draft-unreleased-acquisition` where `published == false`.
   *Target Result: Denied. Public can only read published posts.*

7. **Payload 7 - Fake Review Injection**:
   An external bot attempts to inject 5-star fake reviews directly into `/reviews/rev101` with `published: true`.
   *Target Result: Denied. Only admins can publish reviews.*

8. **Payload 8 - Resume PII Harvester Attack**:
   An authenticated normal user executes `list /jobApplications` to harvest candidate resumes, phone numbers, and salaries.
   *Target Result: Denied. Only admins can read job applications.*

9. **Payload 9 - Resource Exhaustion (Denial of Wallet)**:
   A malicious request sends a 10MB string inside `contactMessages.message`.
   *Target Result: Denied by size bounds check (`message.size() <= 3000`).*

10. **Payload 10 - Ghost Field Shadow Update**:
    An attacker attempts an update adding undeclared ghost fields `isAdmin: true` or `isSuperUser: true`.
    *Target Result: Denied by strict update key allowlists.*

11. **Payload 11 - Tampering with Immutable Creation Timestamps**:
    An attacker attempts to backdate `createdAt` on an existing document during update.
    *Target Result: Denied by immutability assertion `incoming().createdAt == existing().createdAt`.*

12. **Payload 12 - Audit Log Deletion**:
    A compromised session attempts to delete a trace record from `/adminAuditLogs/log999`.
    *Target Result: Denied. Audit logs are append-only; delete is strictly false.*
