// The Melusine — shared interactions. All content is readable without this file.
(function () {
  const doc = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Shared solid header and mobile navigation
  const nav = document.getElementById('nav');

  // Mobile drawer
  const toggle = document.querySelector('.nav__toggle');
  const drawer = document.getElementById('drawer');
  const setDrawer = (open, restoreFocus = true) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.hidden = !open;
    document.querySelectorAll('main, footer, .skip').forEach((el) => { el.inert = open; });
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
      msg = 'Open now · until ' + fmt(close);
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

  // Menu page: keep the main category current as its subcategories are browsed.
  const tabs = document.querySelectorAll('.mtabs a');
  if (tabs.length && doc.querySelector('.page-menu')) {
    const categories = new Map();
    tabs.forEach(tab => (tab.dataset.sections || '').split(' ').forEach(id => categories.set(id, tab)));
    const sections = [...document.querySelectorAll('.mgroup, .msec')].filter(section => categories.has(section.id));
    const bar = document.querySelector('.mtabs');
    const track = document.querySelector('.mtabs__track');
    let active;
    let scheduled = false;
    const updateCategory = () => {
      scheduled = false;
      const boundary = bar.getBoundingClientRect().bottom + 28;
      let current = tabs[0];
      sections.forEach(section => {
        const heading = section.querySelector(':scope > header') || section;
        if (heading.getBoundingClientRect().top <= boundary) current = categories.get(section.id);
      });
      if (current === active) return;
      active = current;
      tabs.forEach(tab => {
        tab.classList.toggle('is-active', tab === active);
        if (tab === active) tab.setAttribute('aria-current', 'location');
        else tab.removeAttribute('aria-current');
      });
      const bounds = track.getBoundingClientRect();
      const selected = active.getBoundingClientRect();
      if (selected.left < bounds.left + 12) track.scrollLeft += selected.left - bounds.left - 12;
      else if (selected.right > bounds.right - 12) track.scrollLeft += selected.right - bounds.right + 12;
    };
    const scheduleCategory = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateCategory); } };
    window.addEventListener('scroll', scheduleCategory, { passive: true });
    window.addEventListener('resize', scheduleCategory);
    window.addEventListener('hashchange', scheduleCategory);
    window.addEventListener('load', scheduleCategory);
    document.fonts?.ready.then(scheduleCategory);
    updateCategory();
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
      const planViewport = lightbox.querySelector('.floorplans__viewport');
      if (planViewport) planViewport.scrollTo(0, 0);
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
      if (e.target.classList.contains('floorplans__viewport')) return;
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
    lightbox.addEventListener('touchstart', (e) => {
      // Floor plans pan inside the viewer; a swipe must not switch layouts.
      if (lightbox.classList.contains('lightbox--plans')) return;
      touchX = e.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  // Enable only after a same-origin delivery endpoint has been deployed and tested.
  const form = document.getElementById('enquiry-form');
  if (form) {
    const feedback = document.getElementById('enquiry-feedback');
    const button = form.querySelector('[type="submit"]');
    const note = document.getElementById('enquiry-note');
    const fields = ['name', 'email', 'date', 'guests', 'message'].map((key) => form.querySelector('#ef-' + key));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    fields[2].min = today;
    let endpoint;
    try {
      if (form.dataset.endpoint) {
        const url = new URL(form.dataset.endpoint, location.href);
        if (url.origin === location.origin && (url.protocol === 'https:' || url.hostname === '127.0.0.1' || url.hostname === 'localhost')) endpoint = url.href;
      }
    } catch { /* Keep the form unavailable if configuration is invalid. */ }
    const showFeedback = (message) => {
      feedback.textContent = message;
      feedback.hidden = false;
      feedback.focus();
    };
    const valid = (el) => {
      const ok = el.checkValidity() && (!el.required || el.value.trim().length > 0);
      el.setAttribute('aria-invalid', String(!ok));
      document.getElementById(el.id + '-err').hidden = ok;
      return ok;
    };
    fields.forEach((el) => {
      el.addEventListener('blur', () => { if (el.value || el.hasAttribute('aria-invalid')) valid(el); });
      el.addEventListener('input', () => { if (el.hasAttribute('aria-invalid')) valid(el); });
    });
    if (endpoint) {
      form.hidden = false;
      form.inert = false;
      const contact = document.getElementById('enquiry-contact');
      if (contact) contact.hidden = true;
      button.disabled = false;
      button.textContent = 'Send enquiry';
      note.textContent = 'Share a few details and we’ll get back to you. A preferred date is an enquiry, not a confirmed booking.';
      document.querySelector('.enquire__intro > p:not(.eyebrow)').textContent = 'Tell us about your occasion and we’ll get back to you. No date yet? Leave it blank.';
    }
    let sending = false;
    let requestId = null;
    form.addEventListener('input', () => { requestId = null; });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!endpoint) { showFeedback('Online enquiries are not available yet. Please email or call us. Nothing has been sent.'); return; }
      if (sending) return;
      const results = fields.map(valid);
      if (results.includes(false)) {
        showFeedback('Please check the highlighted fields. Nothing has been sent.');
        fields[results.indexOf(false)].focus();
        return;
      }
      if (form.querySelector('#ef-website').value) {
        showFeedback('Your enquiry could not be sent. Please email or call us.');
        return;
      }
      requestId = requestId || crypto.randomUUID();
      const payload = { requestId, name: fields[0].value.trim(), email: fields[1].value.trim(), date: fields[2].value, guests: fields[3].value ? Number(fields[3].value) : null, message: fields[4].value.trim(), website: '' };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      sending = true;
      button.disabled = true;
      button.textContent = 'Sending…';
      form.setAttribute('aria-busy', 'true');
      fields.forEach((el) => { el.readOnly = true; });
      try {
        const response = await fetch(endpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
        const result = await response.json();
        if (!response.ok || result.accepted !== true) throw new Error('Delivery was not confirmed');
        form.reset();
        requestId = null;
        fields.forEach((el) => { el.removeAttribute('aria-invalid'); });
        showFeedback('Thank you. Your enquiry has been received by our team. This does not confirm a booking.');
        window.MelusineTracking?.track('private_hire_enquiry_submit', { location: 'enquiry' });
      } catch {
        showFeedback('We could not confirm that your enquiry was received. Your details are still here. Please try again, or email or call us.');
      } finally {
        clearTimeout(timeout);
        sending = false;
        button.disabled = false;
        button.textContent = 'Send enquiry';
        form.removeAttribute('aria-busy');
        fields.forEach((el) => { el.readOnly = false; });
      }
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

// Instagram carousel: native swipe and keyboard navigation; no autoplay.
(function () {
  const carousel = document.querySelector('.instagram__carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.instagram__photos');
  const slides = [...track.children];
  const controls = carousel.querySelector('.instagram__controls');
  const previous = carousel.querySelector('[data-instagram-prev]');
  const next = carousel.querySelector('[data-instagram-next]');
  const status = carousel.querySelector('.instagram__position');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const count = () => innerWidth <= 699 ? 1 : 3;
  const offset = index => slides[index].offsetLeft - slides[0].offsetLeft;
  function current() {
    let nearest = 0;
    slides.forEach((slide, index) => {
      if (Math.abs(offset(index) - track.scrollLeft) < Math.abs(offset(nearest) - track.scrollLeft)) nearest = index;
    });
    return Math.min(nearest, slides.length - count());
  }
  function update() {
    frame = 0;
    const start = current();
    const end = Math.min(start + count(), slides.length);
    status.textContent = count() === 1 ? `Post ${start + 1} of ${slides.length}` : `Posts ${start + 1}–${end} of ${slides.length}`;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function move(direction) {
    const target = Math.max(0, Math.min(slides.length - count(), current() + direction * count()));
    track.scrollTo({ left: offset(target), behavior: motion.matches ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', schedule, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: motion.matches ? 'instant' : 'smooth' });
    }
  });
  new ResizeObserver(schedule).observe(track);
  controls.hidden = false;
  update();
})();
