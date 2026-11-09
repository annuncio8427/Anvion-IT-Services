import fs from 'node:fs';
import path from 'node:path';

const pages = [
  'index.html',
  'about.html',
  'services.html',
  'web-development.html',
  'mobile-development.html',
  'ai-machine-learning.html',
  'cybersecurity.html',
  'it-consulting.html',
  'service-details.html',
  'solution.html',
  'projects.html',
  'portfolio.html',
  'case-studies.html',
  'contact.html',
  'careers.html',
  'privacy-policy.html',
  'terms-of-service.html',
  'project-homeluxe.html',
  'project-eduverify.html',
  'project-smart-invoice-builder.html',
  'project-st-joseph.html',
  'project-task-planner.html',
];

for (const p of pages) {
  const filePath = path.resolve(p);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('anvion-ai.js')) {
      content = content.replace('</body>', '  <!-- Universal ANVION AI Assistant & WhatsApp Suite -->\n  <script src="js/anvion-ai.js"></script>\n</body>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Injected anvion-ai.js into ${p}`);
    }
  }
}

