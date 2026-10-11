// No tag, ID, cookies, storage or network requests are installed by this file.
// Activation requires an existing GA4 tag and an explicit consent adapter; see SETUP.md.
(function () {
  if (window.MelusineTracking) return;
  const allowed = new Set(['book_table_click', 'food_menu_click', 'drinks_menu_click', 'private_hire_click', 'private_hire_enquiry_submit', 'events_click', 'directions_click']);
  function track(name, parameters = {}) {
    const config = window.MelusineAnalytics;
    if (!allowed.has(name) || config?.enabled !== true || typeof config.hasConsent !== 'function' || typeof window.gtag !== 'function') return;
    try {
      if (config.hasConsent() !== true) return;
      // Fixed labels only: never send enquiry fields, URL queries, email addresses or names.
      const locations = ['header', 'mobile_navigation', 'hero', 'menu', 'private-hire', 'events', 'story', 'reviews', 'instagram', 'visit', 'footer', 'enquiry', 'page'];
      window.gtag('event', name, { cta_location: locations.includes(parameters.location) ? parameters.location : 'page' });
    } catch { /* Analytics must never interrupt navigation or an enquiry. */ }
  }
  window.MelusineTracking = Object.freeze({ track });
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    let name;
    if (url.hostname === 'www.opentable.co.uk' && url.searchParams.get('restref') === '206064') name = 'book_table_click';
    else if (url.hostname === 'www.google.com' && url.pathname.startsWith('/maps/dir/')) name = 'directions_click';
    else if (url.hostname === 'www.openstreetmap.org') name = 'directions_click';
    else if (url.origin === location.origin) {
      const file = url.pathname.split('/').pop();
      if (file === 'menu.html') name = url.hash === '#drinks' || ['#cocktails', '#by-the-glass', '#sparkling', '#white', '#rose-red', '#spirits', '#beer-softs'].includes(url.hash) ? 'drinks_menu_click' : 'food_menu_click';
      if (file === 'private-hire.html' || (file === 'index.html' && url.hash === '#private-hire')) name = 'private_hire_click';
      if (file === 'events.html') name = 'events_click';
      if (file === 'private-hire.html' && url.hash === '#enquire') name = 'private_hire_click';
    }
    const locationLabel = link.closest('header') ? 'header' : link.closest('#drawer') ? 'mobile_navigation' : link.closest('footer') ? 'footer' : link.closest('section')?.id === 'top' ? 'hero' : link.closest('section')?.id || 'page';
    if (name) track(name, { location: locationLabel });
  });
})();
