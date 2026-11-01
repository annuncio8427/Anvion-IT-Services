# ANVION IT Services

Company website and administration backend for ANVION IT SERVICES.

## Requirements

- Node.js with support for the TypeScript files imported by the server.
- PostgreSQL.
- A Firebase project with Firebase Authentication and Cloud Firestore enabled.
- Firebase Admin credentials for server-side ID-token verification. On supported cloud platforms, Application Default Credentials may be used.

## Local setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure the PostgreSQL connection:

   - `SQL_HOST`
   - `SQL_PORT` (defaults to `5432`)
   - `SQL_USER`
   - `SQL_PASSWORD`
   - `SQL_DB_NAME`

3. Configure Firebase Admin credentials using `FIREBASE_SERVICE_ACCOUNT_KEY`, or use the hosting platform's Application Default Credentials. Never commit a service-account JSON file or private key.

4. Set a unique `ADMIN_JWT_SECRET` of at least 32 characters when using the legacy SQL-backed admin login endpoint. The normal Firebase admin login uses Firebase ID tokens.

5. Run the backend:

   ```bash
   npm start
   ```

   The server uses `PORT` from the environment and defaults to port `3000`.

## Validation

Run the repository's JavaScript syntax checks:

```bash
npm run lint
```

The build script runs the same validation:

```bash
npm run build
```

## Security notes

- Admin API endpoints require an administrator identity verified by Firebase custom claims or the trusted Firestore `admins` collection. Legacy admin JWTs are accepted only when `ADMIN_JWT_SECRET` is configured and the token carries the `ADMIN` role.
- Client enquiry history is looked up using the email from the verified bearer token, not an email supplied in the URL.
- Public project and service APIs return published records only.
- Server source, dependency metadata, configuration files and uploaded private documents are not served by the public static-file middleware.
- Keep `.env`, Firebase service-account credentials, database passwords and signing secrets out of Git.
