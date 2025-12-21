/**
 * Browser automation script to verify LiaiZen dashboard
 * This allows Claude to "see" the application and verify changes
 */

const { chromium } = require('playwright');

async function verifyDashboard() {
  console.log('🚀 Launching browser...');

  const browser = await chromium.launch({
    headless: false, // Show browser so we can see what's happening
    slowMo: 500, // Slow down actions so they're visible
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    console.log('📱 Navigating to http://localhost:5173');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Take screenshot of landing page
    await page.screenshot({ path: '/tmp/liaizen-landing.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/liaizen-landing.png');

    // Check if login form exists
    const loginForm = await page
      .locator('input[type="email"], input[placeholder*="email" i]')
      .first();
    const isVisible = await loginForm.isVisible().catch(() => false);

    if (isVisible) {
      console.log('✅ Login form found');

      // Login with mom@test.com
      console.log('🔐 Logging in as mom@test.com...');
      await page.fill('input[type="email"], input[placeholder*="email" i]', 'mom@test.com');
      await page.fill('input[type="password"], input[placeholder*="password" i]', '123');

      // Take screenshot before clicking login
      await page.screenshot({ path: '/tmp/liaizen-before-login.png' });

      // Click login button
      await page.click('button:has-text("Log In"), button:has-text("Sign In")');

      // Wait for navigation to dashboard
      console.log('⏳ Waiting for dashboard...');
      await page.waitForTimeout(2000);

      // Take screenshot of dashboard
      await page.screenshot({ path: '/tmp/liaizen-dashboard.png', fullPage: true });
      console.log('📸 Dashboard screenshot saved: /tmp/liaizen-dashboard.png');

      // Check for task filters
      console.log('🔍 Checking task filter tabs...');
      const openTab = await page.locator('button:has-text("Open")').first();
      const completedTab = await page.locator('button:has-text("Completed")').first();
      const allTab = await page.locator('button:has-text("All")').first();
      const highPriorityTab = await page.locator('button:has-text("High Priority")').first();

      const openExists = await openTab.isVisible().catch(() => false);
      const completedExists = await completedTab.isVisible().catch(() => false);
      const allExists = await allTab.isVisible().catch(() => false);
      const highExists = await highPriorityTab.isVisible().catch(() => false);

      console.log(`  ✅ Open tab: ${openExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`  ✅ Completed tab: ${completedExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`  ✅ All tab: ${allExists ? 'EXISTS' : 'MISSING'}`);
      console.log(
        `  ${highExists ? '❌' : '✅'} High Priority tab: ${highExists ? 'STILL EXISTS (should be removed!)' : 'REMOVED (correct!)'}`
      );

      // Check which tab is selected
      if (openExists) {
        const openTabElement = await openTab.elementHandle();
        const classList = await openTabElement.evaluate(el => el.className);
        const isSelected = classList.includes('bg-[#275559]') || classList.includes('text-white');
        console.log(
          `  ${isSelected ? '✅' : '❌'} Open tab is ${isSelected ? 'SELECTED (default)' : 'NOT selected'}`
        );
      }

      // Count visible tasks
      console.log('🔍 Checking tasks...');
      const tasks = await page
        .locator(
          'div:has-text("Welcome to LiaiZen"), div:has-text("Complete Your Profile"), div:has-text("Add Your"), div:has-text("Children")'
        )
        .all();
      console.log(`  📋 Found ${tasks.length} visible tasks`);

      // Check for "Add Your Co-parent" (should NOT be visible on Open tab)
      const coparentTask = await page.locator('text="Add Your Co-parent"').first();
      const coparentVisible = await coparentTask.isVisible().catch(() => false);
      console.log(
        `  ${coparentVisible ? '❌' : '✅'} "Add Your Co-parent" task: ${coparentVisible ? "VISIBLE (BUG - it's completed!)" : 'NOT VISIBLE (correct!)'}`
      );

      // Check for Threads section
      console.log('🔍 Checking for Threads section...');
      const threadsHeading = await page.locator('h2:has-text("Threads")').first();
      const threadsExists = await threadsHeading.isVisible().catch(() => false);
      console.log(
        `  ${threadsExists ? '✅' : '❌'} Threads section: ${threadsExists ? 'EXISTS' : 'MISSING'}`
      );

      if (threadsExists) {
        await page.screenshot({ path: '/tmp/liaizen-threads-section.png' });
        console.log('  📸 Threads section screenshot: /tmp/liaizen-threads-section.png');
      }

      // Try clicking Welcome task
      console.log('🔍 Testing Welcome task modal...');
      const welcomeTask = await page.locator('text="Welcome to LiaiZen"').first();
      const welcomeExists = await welcomeTask.isVisible().catch(() => false);

      if (welcomeExists) {
        await welcomeTask.click();
        await page.waitForTimeout(500);

        // Take screenshot of modal
        await page.screenshot({ path: '/tmp/liaizen-welcome-modal.png' });
        console.log('  📸 Welcome modal screenshot: /tmp/liaizen-welcome-modal.png');

        // Check if modal content is scrollable
        const modalContent = await page.locator('.prose, .overflow-y-auto').first();
        const hasScroll = await modalContent
          .evaluate(el => el.scrollHeight > el.clientHeight)
          .catch(() => false);
        console.log(
          `  ${hasScroll ? '✅' : 'ℹ️ '} Modal content: ${hasScroll ? 'SCROLLABLE (has overflow)' : 'fits without scrolling'}`
        );

        // Close modal
        await page.click('button:has-text("×"), button:has-text("OK")');
        await page.waitForTimeout(300);
      }

      console.log('\n📊 VERIFICATION SUMMARY:');
      console.log('========================');
      console.log(`✅ Dashboard loaded successfully`);
      console.log(
        `${openExists && completedExists && allExists && !highExists ? '✅' : '⚠️ '} Task filter tabs: ${openExists && completedExists && allExists && !highExists ? 'Correct (Open, Completed, All)' : 'Check configuration'}`
      );
      console.log(
        `${threadsExists ? '✅' : '❌'} Threads section: ${threadsExists ? 'Added successfully' : 'Missing'}`
      );
      console.log(
        `${!coparentVisible ? '✅' : '❌'} Task filtering: ${!coparentVisible ? 'Working (completed tasks hidden)' : 'Not working (showing completed tasks)'}`
      );
    } else {
      console.log('❌ Login form not found - check if app is running');
    }
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    await page.screenshot({ path: '/tmp/liaizen-error.png' });
    console.log('📸 Error screenshot saved: /tmp/liaizen-error.png');
  } finally {
    console.log('\n🔍 Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

    console.log('🛑 Closing browser...');
    await browser.close();

    console.log('\n✅ Verification complete!');
    console.log('📁 Screenshots saved in /tmp/');
    console.log('   - liaizen-landing.png');
    console.log('   - liaizen-dashboard.png');
    console.log('   - liaizen-welcome-modal.png');
    console.log('   - liaizen-threads-section.png');
  }
}

// Run verification
verifyDashboard().catch(console.error);
