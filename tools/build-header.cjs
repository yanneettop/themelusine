// Keep static, JavaScript-free navigation identical across public pages.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'content/header.html'), 'utf8').replace(/\r\n/g, '\n').trim();
const pages = ['index.html', 'menu.html', 'private-hire.html', 'events.html', 'about.html', 'gallery.html'];
const check = process.argv.includes('--check');
let stale = false;
for (const file of pages) {
  const target = path.join(root, file);
  const source = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
  const markup = template.replaceAll(`<a href="${file}">`, `<a href="${file}" aria-current="page">`);
  const block = `  <!-- Shared header:start -->\n  ${markup}\n  <!-- Shared header:end -->`;
  const pattern = /  <!-- Shared header:start -->[\s\S]*?  <!-- Shared header:end -->/;
  if (!pattern.test(source)) throw new Error(`Missing shared header markers: ${file}`);
  const updated = source.replace(pattern, () => block);
  if (updated === source) continue;
  if (check) { console.error(`Header needs updating: ${file}`); stale = true; }
  else fs.writeFileSync(target, updated);
}
if (stale) process.exitCode = 1;
else console.log(check ? 'All six headers match the shared template.' : 'Shared headers updated.');
