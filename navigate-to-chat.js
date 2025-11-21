const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Connecting to existing browser or launching new one...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('📱 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(2000);

    console.log('🔍 Looking for Chat button...');

    // Click Chat button in navigation
    const chatButton = page.locator('a:has-text("Chat"), button:has-text("Chat")').first();

    if (await chatButton.isVisible()) {
      console.log('🖱️  Clicking Chat button...');
      await chatButton.click();
      await page.waitForTimeout(3000);

      console.log('✅ Navigated to Chat section!');
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);

      await page.screenshot({ path: 'chat-view.png' });
      console.log('📸 Screenshot saved to chat-view.png');
    } else {
      console.log('⚠️  Chat button not visible - might need to login first');
    }

    console.log('\n🎯 Browser will remain open.');
    console.log('   Press Ctrl+C to close.');

    // Keep browser open
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
})();
