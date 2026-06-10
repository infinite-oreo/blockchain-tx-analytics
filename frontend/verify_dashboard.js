const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);

  // Overview tab
  await page.goto('http://localhost:5174');
  await page.waitForSelector('.kpi-row', { timeout: 8000 });
  await page.screenshot({ path: '/tmp/tab_overview.png', fullPage: true });
  console.log('OVERVIEW: kpi-row present');

  // count KPI cards
  const kpiCount = await page.locator('.kpi-card').count();
  console.log('OVERVIEW: kpi cards =', kpiCount);

  // check pie chart rendered
  const pieSlices = await page.locator('.recharts-pie-sector').count();
  console.log('OVERVIEW: pie sectors =', pieSlices);

  // check line chart
  const linePaths = await page.locator('.recharts-line-curve').count();
  console.log('OVERVIEW: line curves =', linePaths);

  // Protocols tab
  await page.click('nav button:text("Protocols")');
  await page.waitForSelector('.recharts-bar-rectangle, .recharts-bar', { timeout: 6000 });
  await page.screenshot({ path: '/tmp/tab_protocols.png', fullPage: true });
  const protocolBars = await page.locator('.recharts-bar-rectangle').count();
  console.log('PROTOCOLS: bar rectangles =', protocolBars);
  const protocolTableRows = await page.locator('.data-table tbody tr').count();
  console.log('PROTOCOLS: scorecard rows =', protocolTableRows);

  // Chains tab
  await page.click('nav button:text("Chains")');
  await page.waitForSelector('.recharts-bar', { timeout: 6000 });
  await page.screenshot({ path: '/tmp/tab_chains.png', fullPage: true });
  const chainRows = await page.locator('.data-table tbody tr').count();
  console.log('CHAINS: corridor rows =', chainRows);

  // Validators tab
  await page.click('nav button:text("Validators")');
  await page.waitForSelector('.data-table tbody tr', { timeout: 6000 });
  await page.screenshot({ path: '/tmp/tab_validators.png', fullPage: true });
  const validatorRows = await page.locator('.data-table tbody tr').count();
  console.log('VALIDATORS: rows =', validatorRows);

  // check badges
  const successBadges = await page.locator('.badge-success').count();
  const dangerBadges  = await page.locator('.badge-danger').count();
  const warnBadges    = await page.locator('.badge-warning').count();
  console.log('VALIDATORS: badges success/danger/warn =', successBadges, dangerBadges, warnBadges);

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
