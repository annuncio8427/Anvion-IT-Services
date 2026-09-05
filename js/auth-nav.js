/**
 * ANVION IT SERVICES - Universal Authentication Navigation & Form Bridge
 * Dynamically updates header navigation based on Firebase Auth state
 * and enriches Start-a-Project and Contact forms with user identity.
 */

import { auth, onAuthStateChanged, checkAdminAuthorization, logoutUser } from './firebase-client.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Observe Authentication State
  onAuthStateChanged(auth, async (user) => {
    updateNavigation(user);
    if (user) {
      prefillForms(user);
    }
  });

  // 2. Enhance Navigation Bar
  async function updateNavigation(user) {
    const navContainers = document.querySelectorAll('header .flex.items-center.gap-4, header nav');
    const headerActionDiv = document.querySelector('header .hidden.md\\:flex.items-center.gap-4') || 
                            document.querySelector('header .flex.items-center.gap-4');

    if (!headerActionDiv) return;

    // Check if auth controls already injected
    let authNavEl = document.getElementById('anvionAuthNav');
    if (!authNavEl) {
      authNavEl = document.createElement('div');
      authNavEl.id = 'anvionAuthNav';
      authNavEl.className = 'flex items-center gap-3';
      headerActionDiv.insertBefore(authNavEl, headerActionDiv.firstChild);
    }

    if (user) {
      const isAdmin = await checkAdminAuthorization(user);
      authNavEl.innerHTML = `
        ${isAdmin ? `
          <a href="/admin.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500/10 text-brand-blue border border-brand-blue/30 text-xs font-mono font-bold hover:bg-brand-blue hover:text-white transition-all">
            <span class="material-symbols-outlined text-sm">shield_person</span>
            <span>CMS Admin</span>
          </a>
        ` : ''}
        <div class="relative group">
          <a href="/profile.html" class="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10 hover:border-brand-blue/50 text-xs font-semibold text-on-surface hover:text-brand-blue transition-all">
            <div class="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-[10px]">
              ${(user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
            <span class="max-w-[120px] truncate hidden sm:inline">${user.displayName || user.email.split('@')[0]}</span>
          </a>
        </div>
        <button id="navSignOutBtn" title="Sign Out" class="text-neutral-400 hover:text-red-400 p-1 rounded transition-colors text-xs flex items-center">
          <span class="material-symbols-outlined text-base">logout</span>
        </button>
      `;

      const signOutBtn = document.getElementById('navSignOutBtn');
      if (signOutBtn) {
        signOutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          logoutUser();
        });
      }
    } else {
      authNavEl.innerHTML = `
        <a href="/login.html" class="text-on-surface-variant hover:text-on-surface text-xs font-semibold tracking-wide transition-colors">
          Sign In
        </a>
      `;
    }
  }

  // 3. Pre-fill Form Fields if User is Logged In
  function prefillForms(user) {
    // Start a Project form fields
    const projName = document.getElementById('clientName');
    const projEmail = document.getElementById('clientEmail');
    if (projName && !projName.value && user.displayName) {
      projName.value = user.displayName;
    }
    if (projEmail && !projEmail.value && user.email) {
      projEmail.value = user.email;
    }

    // Contact form fields
    const contactName = document.getElementById('contactName');
    const contactEmail = document.getElementById('contactEmail');
    if (contactName && !contactName.value && user.displayName) {
      contactName.value = user.displayName;
    }
    if (contactEmail && !contactEmail.value && user.email) {
      contactEmail.value = user.email;
    }
  }
});
