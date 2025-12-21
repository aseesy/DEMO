const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting automated browser with login and chat navigation...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to homepage
    console.log('📱 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Step 2: Click Sign In button
    console.log('🔍 Looking for Sign In button...');
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      console.log('🖱️  Clicking "Sign In" button...');
      await signInButton.click();
      await page.waitForTimeout(2000);
    }

    // Step 3: Fill in login form
    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('✍️  Filling in credentials...');
    await page.fill('input[type="email"]', 'mom@test.com');
    await page.fill('input[type="password"]', '123123');

    console.log('🔐 Credentials entered: mom@test.com / 123123');

    // Step 4: Submit login
    console.log('🖱️  Clicking login button...');
    await page.click('button[type="submit"]');

    // Step 5: Wait for redirect
    console.log('⏳ Waiting for authentication...');
    await page.waitForTimeout(3000);

    let currentUrl = page.url();
    console.log(`📍 After login URL: ${currentUrl}`);

    // Step 6: Navigate to Chat
    console.log('\n📨 Navigating to Chat...');

    // Wait for the Chat button to be visible
    await page.waitForSelector('a:has-text("Chat"), button:has-text("Chat")', { timeout: 5000 });

    const chatButton = page.locator('a:has-text("Chat"), button:has-text("Chat")').first();

    if (await chatButton.isVisible()) {
      console.log('🖱️  Clicking Chat button...');
      await chatButton.click();
      await page.waitForTimeout(4000); // Wait for chat to load

      currentUrl = page.url();
      console.log(`📍 Chat URL: ${currentUrl}`);

      await page.screenshot({ path: 'chat-view.png' });
      console.log('📸 Screenshot saved to chat-view.png');

      console.log('\n✅ Successfully logged in and navigated to Chat!');
    } else {
      console.log('⚠️  Chat button not found');
      await page.screenshot({ path: 'after-login.png' });
    }

    console.log('\n🎯 Browser will remain open for interaction.');
    console.log('   Press Ctrl+C to close the browser.');

    // Keep browser open indefinitely
    await page.waitForTimeout(600000); // 10 minutes
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Error screenshot saved');
  } finally {
    // Don't close automatically - let user control
    // await browser.close();
  }
})();
