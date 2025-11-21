const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Starting rewrite bypass test...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down so we can see what's happening
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate and login
    console.log('📱 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173');

    console.log('🔍 Looking for Sign In button...');
    await page.waitForSelector('text=Sign In', { timeout: 10000 });

    console.log('🖱️  Clicking "Sign In" button...');
    await page.click('text=Sign In');

    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('✍️  Filling in credentials...');
    await page.fill('input[type="email"]', 'mom@test.com');
    await page.fill('input[type="password"]', '123123');
    console.log('🔐 Credentials entered: mom@test.com / 123123');

    console.log('🖱️  Clicking login button...');
    await page.click('button[type="submit"]');

    console.log('⏳ Waiting for authentication...');
    await page.waitForTimeout(2000);

    console.log('📨 Navigating to Chat...');
    await page.click('text=Chat');
    await page.waitForTimeout(2000);

    console.log('\n=== TEST STEP 1: Send mean message ===');
    const messageInput = await page.locator('input[type="text"][placeholder*="Type a message"]');
    await messageInput.fill("You're such an idiot and you never listen");
    console.log('📝 Typed offensive message');

    await page.click('button[type="submit"]:has-text("Send")');
    console.log('📤 Sent message');

    console.log('\n⏳ Waiting for AI intervention to appear...');
    await page.waitForTimeout(5000); // Wait for AI to process

    // Take screenshot of intervention
    await page.screenshot({ path: 'test-intervention.png', fullPage: true });
    console.log('📸 Screenshot saved: test-intervention.png');

    console.log('\n=== TEST STEP 2: Click on first rewrite option ===');
    // Find and click the first rewrite button (Option 1)
    const rewriteButton = await page.locator('button:has-text("Option 1:")').first();
    const isVisible = await rewriteButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      console.log('❌ Rewrite button not found! Taking debug screenshot...');
      await page.screenshot({ path: 'test-no-rewrite.png', fullPage: true });
      throw new Error('Rewrite button not visible');
    }

    console.log('✅ Found rewrite button');
    await rewriteButton.click();
    console.log('🖱️  Clicked on rewrite Option 1');

    await page.waitForTimeout(1000);

    console.log('\n=== TEST STEP 3: Send the rewritten message ===');
    await page.click('button[type="submit"]:has-text("Send")');
    console.log('📤 Sent rewritten message');

    console.log('\n⏳ Waiting for message to be processed...');
    await page.waitForTimeout(3000);

    // Take final screenshot
    await page.screenshot({ path: 'test-final.png', fullPage: true });
    console.log('📸 Final screenshot saved: test-final.png');

    console.log('\n✅ TEST COMPLETE!');
    console.log('👀 Check the server logs for:');
    console.log('   1. "🚫 Message from mom blocked by AI" (for the mean message)');
    console.log('   2. "✅ Pre-approved rewrite from mom - SKIPPING AI mediation" (for the rewrite)');
    console.log('\n🎯 If you see both log messages, the fix is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: test-error.png');
  }

  console.log('\n🎯 Browser will remain open for 30 seconds...');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('✅ Browser closed');
})();
