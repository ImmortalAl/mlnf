const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pages = [
  'debate.html',
  'archive.html',
  'mindmap.html',
  'blog.html',
  'news.html',
  'index.html',
];

const baseUrl = 'http://localhost:5000/pages/';
const screenshotDir = path.join(__dirname, 'screenshots');
const logFile = path.join(__dirname, 'screenshots', 'puppeteer-test-log.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

(async () => {
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);
  fs.writeFileSync(logFile, ''); // Clear log file
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for (const file of pages) {
    const url = baseUrl + file;
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.setViewport({ width: 1600, height: 900 });
      const screenshotPath = path.join(screenshotDir, `test-${file.replace('.html','')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      log(`Screenshot for ${file} saved to ${screenshotPath}`);
      // Check header flushness
      const headerBox = await page.$eval('header', el => el.getBoundingClientRect());
      if (headerBox.left > 0 || headerBox.top > 0) {
        log(`${file}: Header is NOT flush! left=${headerBox.left}, top=${headerBox.top}`);
      } else {
        log(`${file}: Header is flush.`);
      }
      // Check floating button overlap
      const btns = await page.$$('.floating-buttons button');
      if (btns.length >= 2) {
        const rects = await Promise.all(btns.map(async btn => await btn.boundingBox()));
        const overlap = (a, b) => !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
        if (overlap(rects[0], rects[1])) {
          log(`${file}: Floating buttons are overlapping!`);
        } else {
          log(`${file}: Floating buttons are NOT overlapping.`);
        }
      } else {
        log(`${file}: Not enough floating buttons found for overlap test.`);
      }
    } catch (err) {
      log(`ERROR on ${file}: ${err.message}`);
    }
  }
  await browser.close();
  log('Test complete.');
})(); 