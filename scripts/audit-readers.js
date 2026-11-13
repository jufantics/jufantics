const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const base = process.env.JUFANTICS_BASE_URL || 'http://127.0.0.1:8765';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.JUFANTICS_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const evidenceDir = process.env.JUFANTICS_AUDIT_EVIDENCE ? path.resolve(process.env.JUFANTICS_AUDIT_EVIDENCE) : '';
  if (evidenceDir) fs.mkdirSync(evidenceDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('**/access-control.js*', route => route.fulfill({
    contentType: 'application/javascript; charset=utf-8',
    body: 'window.JufanticsAccess={prepare:async()=>true,requireStory:()=>true,tier:s=>s?.access||"free",hasActiveAccount:()=>true};'
  }));
  const stories = await (await page.request.get(`${base}/mundo-cuentos/cuentos-propios.json`)).json();
  const results = [];
  const missions = [];
  for (const story of stories.filter(item => item.slug !== 'rio-un-lugar-cerquita')) {
    const url = `${base}/mundo-cuentos/lector-cuento.html?cuento=${encodeURIComponent(story.slug)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('#pageImage').waitFor({ state: 'visible' });
    await page.waitForFunction(slug => {
      const image = document.querySelector('#pageImage');
      return image?.complete && image.src.includes(`/cuentos/${slug}/`) && Boolean(document.querySelector('#pageProgress')?.textContent.trim());
    }, story.slug);
    results.push(await page.evaluate(story => {
      const image = document.querySelector('#pageImage');
      return {
        slug: story.slug,
        title: document.querySelector('#storyTitle')?.textContent,
        imageLoaded: image.naturalWidth > 0 && image.naturalHeight > 0,
        imageSize: `${image.naturalWidth}x${image.naturalHeight}`,
        errorVisible: !document.querySelector('#imageError')?.classList.contains('hidden'),
        progress: document.querySelector('#pageProgress')?.textContent,
        activity: document.querySelector('#activityLink')?.getAttribute('href')
      };
    }, story));
    if (evidenceDir && story.slug === 'nico-comic') await page.screenshot({ path: path.join(evidenceDir, 'lector-nico.png'), fullPage: true });
  }
  for (const story of stories) {
    await page.goto(`${base}/mundo-cuentos/actividades-cuento.html?cuento=${encodeURIComponent(story.slug)}&edad=${encodeURIComponent(story.age)}`, { waitUntil: 'domcontentloaded' });
    await page.locator('#wordImage').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const wordImage = document.querySelector('#wordImage');
      const matchImage = document.querySelector('#matchImage');
      return wordImage?.complete && wordImage.naturalWidth > 0 && matchImage?.complete && matchImage.naturalWidth > 0;
    });
    missions.push(await page.evaluate(story => {
      const wordImage = document.querySelector('#wordImage');
      const matchImage = document.querySelector('#matchImage');
      return {
        slug: story.slug,
        title: document.querySelector('#title')?.textContent,
        wordImageLoaded: wordImage.naturalWidth > 0,
        matchImageLoaded: matchImage.naturalWidth > 0
      };
    }, story));
  }
  const activityStory = stories.find(item => item.slug === 'escuadron-verde');
  await page.goto(`${base}/mundo-cuentos/experiencias.html?cuento=${activityStory.slug}&edad=9-12`, { waitUntil: 'domcontentloaded' });
  await page.locator('#comprehensionImage').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('#comprehensionImage')?.complete);
  const activity = await page.evaluate(() => {
    const image = document.querySelector('#comprehensionImage');
    return {
      title: document.querySelector('.hero h1')?.textContent,
      question: document.querySelector('#questionText')?.textContent,
      imageLoaded: image.naturalWidth > 0,
      imageSize: `${image.naturalWidth}x${image.naturalHeight}`,
      caption: document.querySelector('#comprehensionCaption')?.textContent
    };
  });
  if (evidenceDir) await page.screenshot({ path: path.join(evidenceDir, 'actividad-escuadron-verde.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/mundo-cuentos/index.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-page="dominio-publico"]').waitFor({ state: 'visible' });
  await page.locator('[data-page="dominio-publico"]').click();
  await page.locator('.public-domain-grid article').first().waitFor({ state: 'visible' });
  await page.waitForFunction(() => [...document.querySelectorAll('#dominio-publico img')].every(image => image.complete));
  const classics = await page.evaluate(() => ({
    cards: document.querySelectorAll('.public-domain-grid article').length,
    images: [...document.querySelectorAll('#dominio-publico img')].map(image => image.naturalWidth > 0),
    heroAlt: document.querySelector('.public-domain-hero img')?.alt
  }));
  if (evidenceDir) await page.screenshot({ path: path.join(evidenceDir, 'biblioteca-clasica.png'), fullPage: true });
  await page.locator('[data-page="lecturas"]').click();
  await page.locator('#books .book').first().waitFor({ state: 'visible' });
  await page.locator('#books .book').nth(2).scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('#books .book img')].slice(0,3).every(image => image.complete && image.naturalWidth > 0));
  const guide = await page.evaluate(() => ({
    cards: document.querySelectorAll('#books .book').length,
    imagesLoaded: [...document.querySelectorAll('#books .book img')].filter(image => image.naturalWidth > 0).length
  }));
  await page.locator('#books .book button').first().click();
  guide.detailOpened = await page.locator('#bookDetail h2').isVisible();
  console.log(JSON.stringify({ readers: results, missions, activity, classics, guide }, null, 2));
  await browser.close();
  if (results.some(item => !item.imageLoaded || item.errorVisible) || missions.some(item => !item.wordImageLoaded || !item.matchImageLoaded) || !activity.imageLoaded || classics.cards === 0 || classics.images.some(value => !value) || guide.cards !== 60 || guide.imagesLoaded < 3 || !guide.detailOpened) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
