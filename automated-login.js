const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting automated browser login...');

  // Launch browser in headed mode (visible)
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions so you can see them
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    console.log('📱 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    console.log('🔍 Looking for Sign In button...');

    // Click "Sign In" button in header to navigate to login page
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    if (await signInButton.isVisible()) {
      console.log('🖱️  Clicking "Sign In" button in header...');
      await signInButton.click();
      await page.waitForTimeout(2000); // Wait for navigation
    }

    console.log('⏳ Waiting for login form to load...');

    // Wait for email input field
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    console.log('✍️  Filling in login credentials...');

    // Fill in email (find by type="email")
    await page.fill('input[type="email"]', 'mom@test.com');

    // Fill in password (find by type="password")
    await page.fill('input[type="password"]', '123123');

    console.log('🔐 Credentials entered:');
    console.log('   Email: mom@test.com');
    console.log('   Password: 123123');

    // Find and click login button
    console.log('🖱️  Clicking "Log in" submit button...');
    await page.click('button[type="submit"]');

    console.log('⏳ Waiting for authentication...');

    // Wait for navigation or success indicator
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    // Check if we're still on login page or redirected
    if (currentUrl.includes('login') || currentUrl === 'http://localhost:5173/') {
      console.log('⚠️  Still on login page - checking for errors...');
      const errorElement = await page.locator('.error, .alert, [role="alert"]').first();
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Login error: ${errorText}`);
      }
    } else {
      console.log('✅ Login successful! Redirected to:', currentUrl);
    }

    // Take a screenshot
    await page.screenshot({ path: 'login-screenshot.png' });
    console.log('📸 Screenshot saved to login-screenshot.png');

    console.log('\n🎯 Browser will remain open for you to interact with the app.');
    console.log('   Press Ctrl+C in the terminal to close the browser.');

    // Navigate to Chat
    console.log('\n📨 Navigating to Chat...');
    const chatButton = page.locator('a:has-text("Chat"), button:has-text("Chat")').first();
    await chatButton.click();
    await page.waitForTimeout(2000);

    console.log('✅ Navigated to Chat section');
    await page.screenshot({ path: 'chat-view.png' });
    console.log('📸 Chat screenshot saved to chat-view.png');

    // Keep browser open
    await page.waitForTimeout(300000); // Wait 5 minutes or until manually closed

  } catch (error) {
    console.error('❌ Error during login automation:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('📸 Error screenshot saved to error-screenshot.png');
  } finally {
    // Don't close browser automatically - let user interact
    // await browser.close();
  }
})();
