import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page    = await browser.newPage();
page.setDefaultTimeout(10000);

await page.goto('http://localhost:5174');
await page.waitForSelector('.kpi-row', { timeout: 8000 });
await page.screenshot({ path: '/tmp/tab_overview.png', fullPage: true });

const kpiCount  = await page.locator('.kpi-card').count();
const pieSects  = await page.locator('.recharts-pie-sector').count();
const lineCrvs  = await page.locator('.recharts-line-curve').count();
console.log(`OVERVIEW  kpi=${kpiCount} pie_sectors=${pieSects} lines=${lineCrvs}`);

await page.click('nav button:nth-child(2)');  // Protocols
await page.waitForSelector('.recharts-bar-rectangle', { timeout: 6000 });
await page.screenshot({ path: '/tmp/tab_protocols.png', fullPage: true });
const pBars = await page.locator('.recharts-bar-rectangle').count();
const pRows = await page.locator('.data-table tbody tr').count();
console.log(`PROTOCOLS bars=${pBars} table_rows=${pRows}`);

await page.click('nav button:nth-child(3)');  // Chains
await page.waitForSelector('.recharts-bar-rectangle', { timeout: 6000 });
await page.screenshot({ path: '/tmp/tab_chains.png', fullPage: true });
const cRows = await page.locator('.data-table tbody tr').count();
console.log(`CHAINS    corridor_rows=${cRows}`);

await page.click('nav button:nth-child(4)');  // Validators
await page.waitForSelector('.data-table tbody tr', { timeout: 6000 });
await page.screenshot({ path: '/tmp/tab_validators.png', fullPage: true });
const vRows   = await page.locator('.data-table tbody tr').count();
const bSucc   = await page.locator('.badge-success').count();
const bDanger = await page.locator('.badge-danger').count();
const bWarn   = await page.locator('.badge-warning').count();
console.log(`VALIDATORS rows=${vRows} badges(success/danger/warn)=${bSucc}/${bDanger}/${bWarn}`);

await browser.close();
console.log('DONE');
// Never ran - appended for probe run below
