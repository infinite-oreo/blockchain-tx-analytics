import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page    = await browser.newPage();
page.setDefaultTimeout(10000);
await page.goto('http://localhost:5174');
await page.waitForSelector('.kpi-row');
await page.waitForTimeout(1200);  // let recharts finish animating

// probe: try various recharts pie selectors
const sel1 = await page.locator('.recharts-pie-sector').count();
const sel2 = await page.locator('.recharts-layer.recharts-pie-sector').count();
const sel3 = await page.locator('.recharts-pie path').count();
const sel4 = await page.locator('svg path[fill]').count();
const sel5 = await page.locator('.recharts-surface path').count();
console.log('pie-sector:', sel1, 'layer.pie-sector:', sel2, 'pie path:', sel3, 'svg path[fill]:', sel4, 'surface path:', sel5);

// check legend labels (should show 4 statuses)
const legendItems = await page.locator('.recharts-legend-item-text').allTextContents();
console.log('Legend labels:', legendItems);

await page.screenshot({ path: '/tmp/pie_detail.png' });
await browser.close();
