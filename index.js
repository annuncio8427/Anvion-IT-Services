// Vercel Express framework entry point.
// Keep static HTML and browser assets in public/; Vercel serves them from its CDN.
import express from 'express';
import app from './server.js';

if (typeof app !== 'function' || typeof app.use !== 'function' || typeof express.Router !== 'function') {
  throw new TypeError('ANVION server entry point must export an Express application.');
}

export default app;
