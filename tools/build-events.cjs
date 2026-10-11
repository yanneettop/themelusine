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
}
let stale = false;
for (const [file, mode] of [['index.html', 'home'], ['events.html', 'page']]) {
  const cards = data.items.map((item) => `          <article class="seasonal-card${item.featured ? ' seasonal-card--featured' : ''}"${mode === 'page' ? ` id="${escape(item.id)}"` : ''}>
            <p class="seasonal-card__label">${escape(item.label)}</p>
            <h3>${escape(item.title)}</h3>
            <p>${escape(item.description)}</p>${mode === 'page' ? `\n            <p class="seasonal-card__detail">${escape(item.detail)}</p>` : ''}
            <a class="${item.featured ? 'btn btn--navy' : 'link-arrow'}" href="${escape(mode === 'home' && !item.featured ? 'events.html#' + item.id : item.href)}">${escape(mode === 'home' && !item.featured ? 'Explore ' + (item.id === 'oysters' ? 'oyster events' : 'collaborations') + ' →' : item.cta)}</a>
          </article>`).join('\n');
  const replacement = `<!-- events:${mode}:start -->\n        <div class="seasonal__grid">\n${cards}\n        </div>\n        <!-- events:${mode}:end -->`;
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
