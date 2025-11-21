const playwright = require('playwright');

async function inspectBrowser() {
  console.log('🚀 Launching browser...');

  const browser = await playwright.chromium.launch({
    headless: false, // Show the browser window
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null, // Use full window size
    recordVideo: {
      dir: '/Users/athenasees/Desktop/chat/screenshots/',
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  console.log('📱 Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Take initial screenshot
  console.log('📸 Taking screenshot...');
  await page.screenshot({
    path: '/Users/athenasees/Desktop/chat/screenshots/app-initial.png',
    fullPage: true
  });

  // Get page info
  const title = await page.title();
  const url = page.url();

  console.log(`\n✅ Connected to browser!`);
  console.log(`   Title: ${title}`);
  console.log(`   URL: ${url}`);
  console.log(`   Screenshot saved to: /Users/athenasees/Desktop/chat/screenshots/app-initial.png`);

  // Keep browser open and expose CDP endpoint
  console.log(`\n🔌 Browser is now open and connected.`);
  console.log(`   I can now inspect, navigate, and interact with the page.`);
  console.log(`   Press Ctrl+C to close when done.\n`);

  // Keep the script running
  await new Promise(() => {});
}

inspectBrowser().catch(console.error);
