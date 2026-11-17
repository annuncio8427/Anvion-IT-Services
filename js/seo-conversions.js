(() => {
  "use strict";
  if (window.__anvionConversionTrackingReady) return;
  window.__anvionConversionTrackingReady = true;
  window.dataLayer = window.dataLayer || [];

  function pushEvent(eventName, parameters) {
    window.dataLayer.push(Object.assign({
      event: eventName,
      page_path: window.location.pathname
    }, parameters || {}));
  }

  window.anvionTrackLead = function (parameters) {
    pushEvent("generate_lead", parameters || {});
  };

  document.addEventListener("click", (event) => {
    const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!link) return;

    const href = (link.getAttribute("href") || "").trim();
    const label = (link.textContent || link.getAttribute("aria-label") || "").trim().slice(0, 80);

    if (/^tel:/i.test(href)) {
      pushEvent("phone_click", { link_url: href, link_text: label });
      return;
    }

    try {
      const url = new URL(href, window.location.href);
      if (url.hostname === "wa.me" || url.hostname === "api.whatsapp.com" || url.hostname === "web.whatsapp.com") {
        pushEvent("whatsapp_click", { link_url: url.origin + url.pathname, link_text: label });
      }
    } catch (error) {
      // Ignore malformed or non-URL anchors.
    }
  }, true);
})();