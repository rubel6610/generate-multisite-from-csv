const fs = require('fs');
const path = require('path');


const CSV_FILE = './websites.csv';
const OUT_DIR = './build';


function parseCSV(raw) {
  return raw.split(/\r?\n/).map(line => line.split(','));
}

function slugifyDomain(domain) {
  return domain.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function renderIndexHtml(SITE) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${SITE.title}</title>
</head>
<body>

<div id="hero-root"></div>
<div id="contact-root"></div>

<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script>
const e = React.createElement;

// Hero component
function Hero() {
  return e('h1', null, '${SITE.title.split(' ')[0]} delivery service in dhaka.');
}

// Contact component
function Contact() {
  return e('div', null,
    e('p', null, 'Phone: ${SITE.phone}'),
    e('p', null, 'Address: ${SITE.address}')
  );
}

const heroRoot = document.getElementById('hero-root');
const contactRoot = document.getElementById('contact-root');

ReactDOM.createRoot(heroRoot).render(e(Hero));
ReactDOM.createRoot(contactRoot).render(e(Contact));
</script>
</body>
</html>`;
}


(function main() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error('Error: websites.csv not found in project root. Create the CSV and retry.');
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_FILE, 'utf8');
  const rows = parseCSV(raw).map(r => r.map(cell => cell.trim()));
  if (!rows.length) { console.error('CSV empty'); process.exit(1); }

  const headers = rows[0].map(h => h.toLowerCase());
  const expected = ['domain', 'title', 'description', 'phone', 'address'];
  for (const ex of expected) {
    if (!headers.includes(ex)) {
      console.error(`CSV must include header: ${ex}`);
      process.exit(1);
    }
  }


  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 1 && row[0] === '') continue; // skip empty
    const obj = {};
    headers.forEach((h, idx) => obj[h] = row[idx] || '');

    const domainSafe = slugifyDomain(obj.domain || `site-${i}`);
    const siteOut = path.join(OUT_DIR, domainSafe);
    if (!fs.existsSync(siteOut)) fs.mkdirSync(siteOut, { recursive: true });

    const indexHtml = renderIndexHtml(obj);
    fs.writeFileSync(path.join(siteOut, 'index.html'), indexHtml, 'utf8');
    console.log('Created:', siteOut);
  }

  console.log('\nAll sites generated under ./build');
})();
