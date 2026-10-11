// Dependency-free static content generation: cards work without JavaScript.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'content/events.json'), 'utf8'));
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
if (!Array.isArray(data.items) || !data.items.length) throw new Error('At least one event or enquiry topic is required');
const ids = new Set();
for (const item of data.items) {
  if (!/^[a-z][a-z0-9-]*$/.test(item.id) || ids.has(item.id)) throw new Error('Event IDs must be unique slugs');
  ids.add(item.id);
  for (const key of ['label', 'title', 'description', 'detail', 'cta', 'href']) if (typeof item[key] !== 'string' || !item[key].trim()) throw new Error(`Missing ${key} for ${item.id}`);
  const match = item.href.match(/^([a-z-]+\.html)(#[a-z-]+)?$/);
  if (!match || !fs.existsSync(path.join(root, match[1]))) throw new Error(`Invalid internal route for ${item.id}`);
  if (match[2] && !fs.readFileSync(path.join(root, match[1]), 'utf8').includes(`id="${match[2].slice(1)}"`)) throw new Error(`Missing fragment for ${item.id}`);
  if (!item.page || !['title', 'intro', 'cta'].every(key => typeof item.page[key] === 'string' && item.page[key].trim()) || !Array.isArray(item.page.paragraphs) || !item.page.paragraphs.every(text => typeof text === 'string' && text.trim())) throw new Error(`Missing page content for ${item.id}`);
  if (item.page.href) {
    const enquiry = new URL(item.page.href);
    if (enquiry.protocol !== 'mailto:' || enquiry.pathname !== 'hello@themelusine.co.uk' || !enquiry.searchParams.get('subject')?.trim()) throw new Error(`Invalid enquiry email for ${item.id}`);
  }
  if (item.page.photo) {
    const photo = item.page.photo;
    const sources = [photo.src, ...String(photo.srcset).split(',').map(source => source.trim().split(/\s+/)[0])];
    if (!sources.every(source => /^assets\/photos\/[a-z0-9-]+\.webp$/.test(source) && fs.existsSync(path.join(root, source))) || !Number.isInteger(photo.width) || photo.width < 1 || !Number.isInteger(photo.height) || photo.height < 1 || !photo.alt?.trim()) throw new Error(`Invalid page photo for ${item.id}`);
  }
}
function pageArticle(item) {
  const page = item.page;
  const text = `            <div class="event-copy">
              <p class="eyebrow eyebrow--dark">${escape(page.label || item.label)}</p>
              <h2 class="display" id="${escape(item.id)}-title">${escape(page.title)}</h2>
              <p class="event-copy__intro">${escape(page.intro)}</p>
${page.paragraphs.map(text => `              <p>${escape(text)}</p>`).join('\n')}
              <div class="detail-links"><a class="${item.featured ? 'btn btn--navy' : 'link-arrow'}" href="${escape(page.href || item.href)}">${escape(page.cta)}</a>${page.secondary ? `<a class="link-arrow" href="private-hire.html">${escape(page.secondary)}</a>` : ''}</div>
            </div>`;
  return `          <article class="seasonal-card ${item.featured ? 'event-feature' : 'event-note'}" id="${escape(item.id)}" aria-labelledby="${escape(item.id)}-title">
${text}${page.photo ? `
            <figure class="event-feature__photo"><img src="${escape(page.photo.src)}" srcset="${escape(page.photo.srcset)}" sizes="(max-width: 699px) 100vw, 50vw" width="${page.photo.width}" height="${page.photo.height}" alt="${escape(page.photo.alt)}" loading="lazy" decoding="async"></figure>` : ''}
          </article>`;
}
let stale = false;
for (const [file, mode] of [['index.html', 'home'], ['events.html', 'page']]) {
  const cards = data.items.map((item) => `          <article class="seasonal-card${item.featured ? ' seasonal-card--featured' : ''}"${mode === 'page' ? ` id="${escape(item.id)}"` : ''}>
            <p class="seasonal-card__label">${escape(item.label)}</p>
            <h3>${escape(item.title)}</h3>
            <p>${escape(item.description)}</p>${mode === 'page' ? `\n            <p class="seasonal-card__detail">${escape(item.detail)}</p>` : ''}
            <a class="${item.featured ? 'btn btn--navy' : 'link-arrow'}" href="${escape(mode === 'home' && !item.featured ? 'events.html#' + item.id : item.href)}">${escape(mode === 'home' && !item.featured ? 'Explore ' + (item.id === 'oysters' ? 'oyster events' : 'collaborations') + ' →' : item.cta)}</a>
          </article>`).join('\n');
  const replacement = mode === 'home'
    ? `<!-- events:${mode}:start -->\n        <div class="seasonal__grid">\n${cards}\n        </div>\n        <!-- events:${mode}:end -->`
    : `<!-- events:page:start -->
    <section class="section event-christmas">
      <div class="wrap">
${data.items.filter(item => item.featured).map(pageArticle).join('\n')}
      </div>
    </section>
    <section class="section section--tint event-future" aria-label="Oyster events and future occasions">
      <div class="wrap event-notes">
${data.items.filter(item => !item.featured).map(pageArticle).join('\n')}
      </div>
    </section>
    <!-- events:page:end -->`;
  const target = path.join(root, file);
  const original = fs.readFileSync(target, 'utf8');
  const expression = new RegExp(`<!-- events:${mode}:start -->[\\s\\S]*?<!-- events:${mode}:end -->`);
  if (!expression.test(original)) throw new Error(`Missing generation markers in ${file}`);
  const generated = original.replace(expression, () => replacement);
  if (generated !== original) {
    stale = true;
    if (!process.argv.includes('--check')) fs.writeFileSync(target, generated);
  }
}
if (process.argv.includes('--check') && stale) { console.error('Event content is out of date. Run node tools/build-events.cjs'); process.exitCode = 1; }
else console.log(process.argv.includes('--check') ? 'Event content is current.' : 'Event cards generated.');
