/**
 * ANVION IT SERVICES - Universal Modern Navbar & Auth State Controller
 * Manages responsive drawer, auth state sync, and header enhancements across all pages
 * Engineered to run seamlessly on both http(s):// web servers and file:/// local execution
 */

// Helper to safely retrieve cached user from localStorage
function getActiveCachedUser() {
  try {
    const raw = localStorage.getItem("anvion_active_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Helper to safely perform logout
function performLogout() {
  try {
    localStorage.removeItem("anvion_active_user");
  } catch (e) {}

  // If on http/https, notify auth.js if available
  if (window.location.protocol.startsWith("http")) {
    import("./auth.js")
      .then(m => {
        if (m && m.logoutUser) return m.logoutUser();
      })
      .catch(() => {})
      .finally(() => {
        window.location.reload();
      });
  } else {
    window.location.reload();
  }
}

// Helper to safely locate ONLY the action buttons container (never <nav>!)
function findHeaderActionContainer(header) {
  // Find trailing action containers (where Client Portal, Sign In, or Start a Project buttons live)
  const candidates = header.querySelectorAll("div.hidden.md\\:flex, div.hidden.lg\\:flex, div.flex.items-center.gap-3\\.5, div.flex.items-center.gap-4");
  
  for (const div of candidates) {
    // Strictly skip <nav> or any container inside <nav>
    if (div.tagName === "NAV" || div.closest("nav")) continue;
    // Skip containers with more than 3 links (those are nav menus)
    const links = div.querySelectorAll("a");
    if (links.length > 3) continue;
    // Ensure it contains an action button
    if (div.querySelector("a[href*='start-a-project'], a[href*='login'], a[href*='dashboard'], a[href*='contact']")) {
      return div;
    }
  }
  return null;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavbar);
} else {
  initNavbar();
}

function initNavbar() {
  const header = document.querySelector("header.sticky, header:has(nav), nav.sticky, header, nav");
  if (!header) return;

  // 1. Optimize any legacy bloated base64 logo in header
  const logoImgs = header.querySelectorAll("img[src*='data:image/png;base64']");
  logoImgs.forEach(img => {
    img.src = "images/logo.png";
    img.classList.remove("p-1");
    img.classList.add("object-contain");
  });

  // 2. Identify Action Container (strictly trailing action buttons, NEVER <nav>)
  const actionContainer = findHeaderActionContainer(header);

  // 3. Setup or replace Mobile Menu Drawer
  setupMobileDrawer(header);

  // 4. Highlight active navigation link
  highlightActiveLink(header);

  // 5. Auth state render from localStorage ONLY if a user is logged in
  const initialUser = getActiveCachedUser();
  if (initialUser && actionContainer) {
    updateNavbarAuthState(header, actionContainer, initialUser);
  }
  updateMobileDrawerAuthState(initialUser);

  // 6. Connect to local custom auth state change listener
  window.addEventListener("anvion:auth-changed", (e) => {
    const user = (e && e.detail && e.detail.user !== undefined) ? e.detail.user : getActiveCachedUser();
    if (actionContainer) {
      updateNavbarAuthState(header, actionContainer, user);
    }
    updateMobileDrawerAuthState(user);
  });

  // 7. If running on a web server (http:// or https://), hook into live Firebase Auth
  if (window.location.protocol.startsWith("http")) {
    import("./auth.js")
      .then(authMod => {
        if (authMod && typeof authMod.onAuthChange === "function") {
          authMod.onAuthChange((user) => {
            if (actionContainer) {
              updateNavbarAuthState(header, actionContainer, user);
            }
            updateMobileDrawerAuthState(user);
          });
        }
      })
      .catch(() => {
        // Standalone fallback mode active
      });
  }

  // 8. Initialize Universal Floating WhatsApp Button
  initWhatsAppWidget();
}

/**
 * Highlights current active link based on window.location.pathname
 */
function highlightActiveLink(header) {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = header.querySelectorAll("nav a");
  
  navLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    const linkPath = href.split("/").pop();

    if (linkPath === currentPath || (currentPath === "" && linkPath === "index.html")) {
      link.classList.add("text-white", "font-bold", "border-b-2", "border-brand-blue", "pb-1");
      link.classList.remove("text-on-surface-variant", "text-neutral-400", "text-neutral-300");
    } else {
      link.classList.remove("border-b-2", "border-brand-blue", "pb-1");
    }
  });
}

/**
 * Updates Desktop Header Action Buttons based on User State
 * NEVER modifies <nav>!
 */
function updateNavbarAuthState(header, actionContainer, user) {
  if (!actionContainer || actionContainer.tagName === "NAV" || actionContainer.closest("nav")) return;

  if (user) {
    // Save original markup before overwriting with user profile
    if (!actionContainer.getAttribute("data-original-html")) {
      actionContainer.setAttribute("data-original-html", actionContainer.innerHTML);
    }

    const displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Client");
    const initials = displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    const avatarHtml = user.avatar 
      ? `<img src="${user.avatar}" class="w-full h-full object-cover rounded-full" alt="${displayName}"/>`
      : `<span class="text-xs font-bold text-brand-blue uppercase">${initials}</span>`;

    actionContainer.innerHTML = `
      <div class="relative" id="globalUserMenu">
        <button id="globalUserDropdownBtn" class="flex items-center gap-2.5 py-1.5 px-3 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-brand-blue/50 transition-all">
          <div class="w-7 h-7 rounded-full bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center overflow-hidden">
            ${avatarHtml}
          </div>
          <span class="text-xs font-bold text-white max-w-[120px] truncate hidden lg:inline">${displayName}</span>
          <span class="material-symbols-outlined text-sm text-neutral-400">expand_more</span>
        </button>

        <!-- Dropdown -->
        <div id="globalUserDropdownMenu" class="hidden absolute right-0 mt-2 w-56 glass-dropdown rounded-xl p-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div class="px-3 py-2 border-b border-white/10 mb-1">
            <p class="text-xs font-bold text-white truncate">${displayName}</p>
            <p class="text-[10px] text-neutral-400 truncate">${user.email || ""}</p>
          </div>
          
          <a href="dashboard.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:bg-brand-blue/15 hover:text-brand-blue transition-colors">
            <span class="material-symbols-outlined text-sm">dashboard</span>
            Client Dashboard
          </a>

          <a href="start-a-project.html" class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/5 transition-colors">
            <span class="material-symbols-outlined text-sm">rocket_launch</span>
            Submit Brief
          </a>

          <div class="border-t border-white/10 my-1 pt-1">
            <button id="globalLogoutBtn" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors">
              <span class="material-symbols-outlined text-sm">logout</span>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <a href="start-a-project.html" class="hidden sm:inline-flex bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-brand-blue/20 btn-glow">
        Start a Project
      </a>
    `;

    // Dropdown toggle
    const btn = document.getElementById("globalUserDropdownBtn");
    const menu = document.getElementById("globalUserDropdownMenu");
    const logout = document.getElementById("globalLogoutBtn");

    if (btn && menu) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("hidden");
      });

      document.addEventListener("click", () => {
        menu.classList.add("hidden");
      });
    }

    if (logout) {
      logout.addEventListener("click", () => {
        performLogout();
      });
    }

  } else {
    // Restore original HTML if previously logged in
    if (actionContainer.hasAttribute("data-original-html")) {
      actionContainer.innerHTML = actionContainer.getAttribute("data-original-html");
      actionContainer.removeAttribute("data-original-html");
    }
  }
}

/**
 * Creates and connects the mobile sliding drawer
 */
function setupMobileDrawer(header) {
  // Check if drawer already exists
  let drawer = document.getElementById("anvionMobileDrawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.id = "anvionMobileDrawer";
    drawer.className = "fixed inset-0 z-[99999] hidden";
    drawer.innerHTML = `
      <!-- Backdrop -->
      <div id="mobileDrawerBackdrop" class="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 opacity-0 z-[99998]"></div>

      <!-- Drawer Content -->
      <div id="mobileDrawerPanel" class="fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-surface-card border-l border-white/10 p-5 flex flex-col justify-between transform translate-x-full transition-transform duration-300 ease-out z-[99999] shadow-2xl overflow-y-auto">
        <div>
          <!-- Header -->
          <div class="flex items-center justify-between pb-6 border-b border-white/10">
            <div class="flex items-center gap-2.5">
              <img src="images/logo.png" alt="ANVION" class="h-8 w-8 object-contain"/>
              <span class="font-display font-extrabold text-lg text-white">ANVION</span>
            </div>
            <button id="closeMobileDrawer" class="text-neutral-400 hover:text-white p-1" aria-label="Close navigation">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- User Card in Mobile Drawer -->
          <div id="mobileUserCard" class="py-4 my-2 border-b border-white/10">
            <!-- Injected by JS -->
          </div>

          <!-- Nav Links -->
          <nav class="flex flex-col space-y-1.5 pt-2" id="mobileDrawerNav">
            <a href="index.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">home</span>
              Home
            </a>
            <a href="services.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">handyman</span>
              Services
            </a>
            <a href="solution.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">hub</span>
              Solutions
            </a>
            <a href="projects.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">folder_open</span>
              Projects
            </a>
            <a href="portfolio.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">grid_view</span>
              Portfolio
            </a>
            <a href="case-studies.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">analytics</span>
              Case Studies
            </a>
            <a href="about.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">groups</span>
              About
            </a>
            <a href="careers.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">work</span>
              Careers
            </a>
            <a href="contact.html" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:text-white hover:bg-white/5 transition-all">
              <span class="material-symbols-outlined text-base">mail</span>
              Contact
            </a>
          </nav>
        </div>

        <!-- Bottom CTA -->
        <div class="pt-5 mt-4 border-t border-white/10 space-y-2.5">
          <a href="https://wa.me/919150270802" target="_blank" rel="noopener noreferrer" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all">
            <svg class="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.04-1.077-.077-.282-.086-.632-.23-1.092-.432-1.928-.844-3.177-2.803-3.275-2.933-.095-.128-.778-1.036-.778-1.975 0-.94.492-1.403.666-1.597.174-.194.38-.243.507-.243.127 0 .254.002.366.007.119.006.277-.045.433.329.162.388.552 1.345.602 1.442.049.097.082.212.016.34-.065.13-.098.21-.194.321-.097.112-.204.25-.292.336-.098.096-.2.2-.086.396.114.195.508.839 1.09 1.357.75.669 1.382.876 1.578.973.196.098.312.083.428-.05.116-.134.494-.576.626-.774.133-.198.265-.165.446-.098.181.066 1.149.542 1.347.64.198.099.33.148.379.231.049.083.049.48-.095.885zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.661 1.434 5.176L2 22l4.982-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.464-1.282l-.32-.2-2.957.776.79-2.883-.21-.334A8.175 8.175 0 013.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z"/>
            </svg>
            Chat on WhatsApp
          </a>
          <a href="start-a-project.html" class="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/30 transition-all btn-glow">
            Start a Project
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  // Highlight active link in mobile drawer
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const drawerLinks = drawer.querySelectorAll("nav a");
  drawerLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    const linkPath = href.split("/").pop();
    if (linkPath === currentPath || (currentPath === "" && linkPath === "index.html")) {
      link.classList.add("text-brand-blue", "bg-brand-blue/10", "font-bold");
      link.classList.remove("text-neutral-300");
    }
  });

  // Drawer Toggle logic
  const backdrop = document.getElementById("mobileDrawerBackdrop");
  const panel = document.getElementById("mobileDrawerPanel");
  const closeBtn = document.getElementById("closeMobileDrawer");

  function openDrawer() {
    drawer.classList.remove("hidden");
    // Force layout reflow so CSS transition runs immediately
    void drawer.offsetWidth;
    document.body.style.overflow = "hidden";
    backdrop.classList.remove("opacity-0");
    panel.classList.remove("translate-x-full");

    // Hide floating WhatsApp button on mobile while drawer is active
    const wa = document.getElementById("anvionWhatsAppFloat");
    if (wa) wa.style.visibility = "hidden";
  }

  function closeDrawer() {
    backdrop.classList.add("opacity-0");
    panel.classList.add("translate-x-full");
    document.body.style.overflow = "";
    setTimeout(() => {
      drawer.classList.add("hidden");
      const wa = document.getElementById("anvionWhatsAppFloat");
      if (wa) wa.style.visibility = "visible";
    }, 300);
  }

  // Connect click listeners to all mobile toggle buttons across page
  const triggers = document.querySelectorAll(
    "#mobileMenuBtn, [data-mobile-toggle], button.lg\\:hidden, button.md\\:hidden, button[aria-label*='Navigation' i], button[aria-label*='menu' i]"
  );
  triggers.forEach(btn => {
    if (btn.id === "closeMobileDrawer" || btn.closest("#anvionMobileDrawer")) return;
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openDrawer();
    };
  });

  // Event delegation guarantees any click on hamburger button or inner icon opens drawer
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("#mobileMenuBtn, [data-mobile-toggle], header button.lg\\:hidden, header button.md\\:hidden, button[aria-label*='navigation' i], button[aria-label*='menu' i]");
    if (trigger && !trigger.closest("#anvionMobileDrawer")) {
      e.preventDefault();
      e.stopPropagation();
      openDrawer();
    }
  });

  backdrop.onclick = closeDrawer;
  if (closeBtn) closeBtn.onclick = closeDrawer;

  drawerLinks.forEach(link => {
    link.addEventListener("click", closeDrawer);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer.classList.contains("hidden")) {
      closeDrawer();
    }
  });
}

/**
 * Updates User profile snippet in mobile drawer
 */
function updateMobileDrawerAuthState(user) {
  const container = document.getElementById("mobileUserCard");
  if (!container) return;

  if (user) {
    const displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Client");
    container.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue font-bold text-xs">
            ${displayName[0].toUpperCase()}
          </div>
          <div>
            <p class="text-xs font-bold text-white leading-tight">${displayName}</p>
            <p class="text-[10px] text-neutral-400 leading-tight">${user.email || ""}</p>
          </div>
        </div>
        <a href="dashboard.html" class="px-2.5 py-1 rounded bg-brand-blue/15 text-brand-blue text-[11px] font-bold">Portal</a>
      </div>
    `;
  } else {
    container.innerHTML = `
      <a href="login.html" class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-white hover:text-brand-blue transition-colors">
        <span class="material-symbols-outlined text-sm">login</span>
        Sign In / Client Portal
      </a>
    `;
  }
}

/**
 * Injects Universal Floating WhatsApp Button on all pages
 */
function initWhatsAppWidget() {
  if (document.getElementById("anvionWhatsAppFloat") || document.getElementById("anvionCommunicationSuite") || document.getElementById("anvionAiLauncher")) return;

  const waBtn = document.createElement("a");
  waBtn.id = "anvionWhatsAppFloat";
  waBtn.className = "whatsapp-float";
  waBtn.href = "https://wa.me/919150270802";
  waBtn.target = "_blank";
  waBtn.rel = "noopener noreferrer";
  waBtn.setAttribute("aria-label", "Chat on WhatsApp with ANVION IT SERVICES");
  waBtn.innerHTML = `
    <span class="whatsapp-float-pulse"></span>
    <svg class="w-6 h-6 fill-current flex-shrink-0" viewBox="0 0 24 24">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.04-1.077-.077-.282-.086-.632-.23-1.092-.432-1.928-.844-3.177-2.803-3.275-2.933-.095-.128-.778-1.036-.778-1.975 0-.94.492-1.403.666-1.597.174-.194.38-.243.507-.243.127 0 .254.002.366.007.119.006.277-.045.433.329.162.388.552 1.345.602 1.442.049.097.082.212.016.34-.065.13-.098.21-.194.321-.097.112-.204.25-.292.336-.098.096-.2.2-.086.396.114.195.508.839 1.09 1.357.75.669 1.382.876 1.578.973.196.098.312.083.428-.05.116-.134.494-.576.626-.774.133-.198.265-.165.446-.098.181.066 1.149.542 1.347.64.198.099.33.148.379.231.049.083.049.48-.095.885zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.661 1.434 5.176L2 22l4.982-1.309A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.637 0-3.167-.47-4.464-1.282l-.32-.2-2.957.776.79-2.883-.21-.334A8.175 8.175 0 013.8 12c0-4.521 3.679-8.2 8.2-8.2 4.521 0 8.2 3.679 8.2 8.2 0 4.521-3.679 8.2-8.2 8.2z"/>
    </svg>
    <span class="whatsapp-float-text">Chat with us</span>
  `;
  document.body.appendChild(waBtn);
}
