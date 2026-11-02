# Security Policy

## Supported Versions

Security fixes are applied to the current default development branch. Older deployments should be upgraded to the latest reviewed release.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately to **anvionitservices@gmail.com**.

Include:
- A clear description of the affected page, endpoint or component.
- Steps to reproduce the issue and its impact.
- Relevant screenshots or request/response details, with passwords, tokens and personal data removed.

Please do not publish exploitable details in a public issue before the team has had an opportunity to investigate. We will acknowledge reports and coordinate a fix and disclosure with the reporter.

## Deployment security

Never commit `.env` files, Firebase service-account credentials, database passwords, API secrets or admin signing keys. Rotate any secret that has been exposed.
