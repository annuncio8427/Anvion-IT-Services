// Vercel Node function catch-all for the existing Express API.
// Static website pages are served from public/ and do not invoke this function.
import app from '../server.js';

export default app;
