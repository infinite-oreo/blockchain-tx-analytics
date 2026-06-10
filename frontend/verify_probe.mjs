import { chromium } from 'playwright';

const browser  = await chromium.launch({ headless: true });
const page     = await browser.newPage();
const errors   = [];
page.on('console', m => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', e => errors.push(e.message));
page.setDefaultTimeout(10000);

// ── probe 1: KPI values match API ────────────────────────────────
await page.goto('http://localhost:5174');
await page.waitForSelector('.kpi-row');
const kpiTexts = await page.locator('.kpi-value').allTextContents();
console.log('KPI values:', kpiTexts);

// ── probe 2: all 4 pie sectors (check via paths not just selector) ─
const piePaths = await page.locator('.recharts-pie path').count();
console.log('Pie paths (incl all):', piePaths);

// ── probe 3: active tab highlight on click ───────────────────────
const activeTab = await page.locator('nav button.active').textContent();
console.log('Active tab on load:', activeTab);

// ── probe 4: Protocols tab – table has correct columns ───────────
await page.click('nav button:nth-child(2)');
await page.waitForSelector('.data-table');
const headers = await page.locator('.data-table thead th').allTextContents();
console.log('Protocol table headers:', headers);

// ── probe 5: Validators – badge distribution looks sane ──────────
await page.click('nav button:nth-child(4)');
await page.waitForSelector('.data-table tbody tr');
const firstFailureRate = await page.locator('.data-table tbody tr:first-child td:nth-child(4)').textContent();
console.log('Top validator failure rate badge text:', firstFailureRate);

// ── probe 6: console errors ──────────────────────────────────────
console.log('Browser errors:', errors.length ? errors : 'none');

await browser.close();
