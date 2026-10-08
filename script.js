// The Melusine — shared interactions. All content is readable without this file.
(function () {
  const doc = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header: transparent over the photographic hero, solid once scrolled
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile drawer
  const toggle = document.querySelector('.nav__toggle');
  const drawer = document.getElementById('drawer');
  const setDrawer = (open, restoreFocus = true) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.hidden = !open;
    nav.classList.toggle('is-solid', open || window.scrollY > 40);
    doc.style.overflow = open ? 'hidden' : '';
    if (open) drawer.querySelector('a').focus();
    else if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => setDrawer(drawer.hidden));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a')) setDrawer(false, false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 980 && !drawer.hidden) setDrawer(false, false); });
  document.addEventListener('keydown', (e) => {
    if (drawer.hidden) return;
    if (e.key === 'Escape') setDrawer(false);
    if (e.key === 'Tab') {
      // Header controls (toggle, logo, Book) plus the drawer form one focus loop
      const controls = [...document.querySelectorAll('#nav a, #nav button, #drawer a')].filter((el) => el.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Open / closed status, computed in London time
  const HOURS = { 0: [12 * 60, 21 * 60 + 30] };
  for (let d = 1; d <= 6; d++) HOURS[d] = [12 * 60, 22 * 60 + 30];
  const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

  const london = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, mins: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
  };

  const status = document.getElementById('status');
  const updateStatus = () => {
    const { day, mins } = london();
    const [open, close] = HOURS[day];
    const text = document.getElementById('status-text');
    let msg;
    if (mins >= open && mins < close) {
      status.classList.add('is-open');
      const hh = mins >= 15 * 60 && mins < 18 * 60;
      msg = hh ? 'Open now · Happy hour until 18:00' : 'Open now · until ' + fmt(close);
    } else {
      status.classList.remove('is-open');
      msg = mins < open ? 'Opens today at ' + fmt(open) : 'Closed now · opens tomorrow at 12:00';
    }
    text.textContent = msg;

    document.querySelectorAll('#hours tr[data-days]').forEach((tr) => {
      tr.classList.toggle('is-today', tr.dataset.days.split(',').map(Number).includes(day));
    });
  };
  if (status) {
    updateStatus();
    setInterval(updateStatus, 60 * 1000);
  }

  // Menu page: highlight the tab for the section in view (Food / Drinks groups included,
  // so the tab bar follows straight away when someone jumps to #drinks)
  const tabs = document.querySelectorAll('.mtabs a');
  if (tabs.length && 'IntersectionObserver' in window) {
    const byId = new Map([...tabs].map((a) => [a.getAttribute('href').slice(1), a]));
    const setActive = (id) => {
      tabs.forEach((a) => a.classList.remove('is-active'));
      const tab = byId.get(id);
      if (!tab) return;
      tab.classList.add('is-active');
      const track = tab.parentElement;
      // Instant on purpose: a smooth scroll here can interrupt the page's own jump to an anchor
      track.scrollLeft = tab.offsetLeft - track.clientWidth / 2 + tab.clientWidth / 2;
    };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    byId.forEach((_, id) => { const sec = document.getElementById(id); if (sec) spy.observe(sec); });
  }

  // Visit: the address card is always shown; the map loads only on request.
  // (The previous keyless Google embed URL now renders a blank frame.)
  const showMap = document.getElementById('locate-show');
  const mapBox = document.getElementById('locate-map');
  if (showMap && mapBox) {
    showMap.hidden = false;
    showMap.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      frame.title = 'Map showing Ivory House, St Katharine Docks';
      frame.referrerPolicy = 'no-referrer';
      frame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=-0.0772%2C51.5047%2C-0.0652%2C51.5103&layer=mapnik&marker=51.50751%2C-0.07120';
      mapBox.appendChild(frame); // the OSM embed carries its own attribution
      mapBox.hidden = false;
      showMap.remove();
      document.getElementById('locate-osm').focus();
    }, { once: true });
  }

  // Gallery lightbox. Without JS each photo link simply opens the full image.
  const lightbox = document.getElementById('lightbox');
  const galleryLinks = [...document.querySelectorAll('.gitem__link')];
  if (lightbox && galleryLinks.length && typeof lightbox.showModal === 'function') {
    const lbImg = lightbox.querySelector('.lightbox__img');
    const lbCaption = lightbox.querySelector('.lightbox__caption');
    const lbCount = lightbox.querySelector('.lightbox__count');
    let index = 0;
    let opener = null;
    const show = (i) => {
      index = (i + galleryLinks.length) % galleryLinks.length;
      const link = galleryLinks[index];
      const thumb = link.querySelector('img');
      lbImg.src = link.getAttribute('href');
      lbImg.alt = thumb.alt;
      lbCaption.textContent = link.dataset.caption || '';
      lbCount.textContent = (index + 1) + ' / ' + galleryLinks.length;
    };
    galleryLinks.forEach((link, i) => link.addEventListener('click', (e) => {
      e.preventDefault();
      opener = link;
      show(i);
      lightbox.showModal();
      lightbox.querySelector('.lightbox__close').focus();
    }));
    lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.close());
    lightbox.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
    lightbox.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
    lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
    });
    // Click on the dark surround closes; Escape is handled by <dialog>
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', () => {
      doc.style.overflow = '';
      if (opener) opener.focus();
    });
    lightbox.addEventListener('toggle', () => { if (lightbox.open) doc.style.overflow = 'hidden'; });
    // Swipe left/right on touch screens
    let touchX = null;
    lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  // Private hire enquiry: no sending service exists, so we prepare an email
  // in the visitor's own email app instead of pretending to send.
  const form = document.getElementById('enquiry-form');
  if (form) {
    const ready = document.getElementById('enquiry-ready');
    const mailto = document.getElementById('enquiry-mailto');
    const fields = {
      name: form.querySelector('#ef-name'),
      email: form.querySelector('#ef-email'),
      date: form.querySelector('#ef-date'),
      guests: form.querySelector('#ef-guests'),
      message: form.querySelector('#ef-message'),
    };
    const checks = [
      [fields.name, (v) => v.trim().length > 0],
      [fields.email, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())],
      [fields.guests, (v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1)],
      [fields.message, (v) => v.trim().length > 0],
    ];
    const validate = (el, ok) => {
      const err = document.getElementById(el.id + '-err');
      el.setAttribute('aria-invalid', String(!ok));
      if (err) err.hidden = ok;
      return ok;
    };
    checks.forEach(([el, test]) => el.addEventListener('blur', () => {
      if (el.getAttribute('aria-invalid') !== null || el.value) validate(el, test(el.value));
    }));
    form.addEventListener('input', () => { ready.hidden = true; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = checks.map(([el, test]) => validate(el, test(el.value)));
      const firstBad = checks[results.indexOf(false)];
      if (firstBad) { firstBad[0].focus(); return; }
      let when = 'Flexible';
      if (fields.date.value) {
        const d = new Date(fields.date.value + 'T12:00:00');
        when = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
      const body = [
        'Name: ' + fields.name.value.trim(),
        'Email: ' + fields.email.value.trim(),
        'Preferred date: ' + when,
        'Number of guests: ' + (fields.guests.value || 'Not sure yet'),
        '',
        fields.message.value.trim(),
      ].join('\n');
      mailto.href = 'mailto:hello@themelusine.co.uk?subject=' + encodeURIComponent('Private hire enquiry: ' + fields.name.value.trim()) +
        '&body=' + encodeURIComponent(body);
      ready.hidden = false;
      ready.focus();
    });
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

// Scroll motion: one scheduled frame per scroll, no idle animation.
(function () {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero--editorial');
  const frames = [...document.querySelectorAll('.intro__img__frame, .story__img__frame')];
  document.querySelectorAll('.catch-card, .platter, .dock-note__inner, .press-note, .mhappy').forEach((el) => el.classList.add('reveal'));
  const elements = [...document.querySelectorAll('.reveal')];
  let observer;
  let pending = false;

  function render() {
    pending = false;
    if (preference.matches) return;
    const viewport = innerHeight;
    if (hero) {
      const rect = hero.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < viewport) {
        const distance = Math.max(0, -rect.top);
        hero.style.setProperty('--hero-shift', Math.min(distance * .16, rect.height * .07) + 'px');
        hero.style.setProperty('--copy-shift', Math.min(distance * .07, 60) + 'px');
      }
    }
    frames.forEach((frame) => {
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewport) return;
      const offset = (viewport / 2 - rect.top - rect.height / 2) * .06;
      const limit = rect.height * .04;
      frame.style.setProperty('--image-shift', Math.max(-limit, Math.min(limit, offset)) + 'px');
    });
  }
  function schedule() {
    if (!pending && !preference.matches) { pending = true; requestAnimationFrame(render); }
  }
  function configure() {
    if (observer) observer.disconnect();
    if (preference.matches || !('IntersectionObserver' in window)) {
      document.documentElement.classList.remove('motion-ready');
      elements.forEach((el) => el.classList.add('is-in'));
      if (hero) { hero.style.removeProperty('--hero-shift'); hero.style.removeProperty('--copy-shift'); }
      frames.forEach((f) => f.style.removeProperty('--image-shift'));
      return;
    }
    // Mark content already on screen first, so nothing visible blinks out.
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      el.classList.toggle('is-in', rect.top < innerHeight && rect.bottom > 0);
    });
    document.documentElement.classList.add('motion-ready');
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    elements.forEach((el) => { if (!el.classList.contains('is-in')) observer.observe(el); });
    schedule();
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  preference.addEventListener('change', configure);
  configure();
})();
