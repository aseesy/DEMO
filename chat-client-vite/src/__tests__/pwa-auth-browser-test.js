/**
 * Browser Console Test for PWA Authentication
 * 
 * Run this in the browser console after launching the PWA to verify auth state
 * 
 * Usage:
 * 1. Open browser console (F12 or Cmd+Option+I)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Review the test results
 */

(function testPWAAuth() {
  console.log('🧪 PWA Authentication Test\n');
  console.log('='.repeat(60));

  // Test 1: Check localStorage for auth data
  console.log('\n📦 Test 1: Checking localStorage...');
  const token = localStorage.getItem('auth_token_backup');
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const username = localStorage.getItem('username');
  
  console.log('   Token exists:', !!token);
  console.log('   isAuthenticated:', isAuthenticated);
  console.log('   Username:', username);

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = new Date(payload.exp * 1000);
      const isExpired = Date.now() >= payload.exp * 1000;
      console.log('   Token expires:', exp.toLocaleString());
      console.log('   Token expired:', isExpired);
      if (isExpired) {
        console.log('   ⚠️  WARNING: Token is expired!');
      }
    } catch (e) {
      console.log('   ❌ ERROR: Invalid token format');
    }
  }

  // Test 2: Check if React state shows authenticated
  console.log('\n⚛️  Test 2: Checking React state...');
  console.log('   (Open React DevTools to verify AuthProvider state)');
  console.log('   Expected: isAuthenticated = true, isCheckingAuth = false');

  // Test 3: Check current page
  console.log('\n🌐 Test 3: Checking current page...');
  const currentPath = window.location.pathname;
  console.log('   Current path:', currentPath);
  
  if (currentPath === '/signin' || currentPath === '/sign-in') {
    console.log('   ⚠️  On sign-in page - this is correct if not authenticated');
  } else if (currentPath === '/') {
    const hasLandingPage = document.querySelector('[class*="landing"]') || 
                          document.querySelector('h1')?.textContent?.toLowerCase().includes('co-parent');
    if (hasLandingPage) {
      console.log('   ❌ Landing page is showing - this should NOT happen if authenticated');
      console.log('   💡 Possible causes:');
      console.log('      - Token is expired');
      console.log('      - Auth state not loading from storage');
      console.log('      - Server verification failed');
    } else {
      console.log('   ✅ On home page, no landing page - correct for authenticated user');
    }
  } else {
    console.log('   ✅ On authenticated page:', currentPath);
  }

  // Test 4: Check for errors in console
  console.log('\n🔍 Test 4: Check for errors above');
  console.log('   Look for any red error messages');
  console.log('   Common issues:');
  console.log('      - Network errors (server not running)');
  console.log('      - Token validation errors');
  console.log('      - React state errors');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log('='.repeat(60));
  
  const hasValidAuth = token && isAuthenticated === 'true' && username;
  const tokenValid = token && (() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  })();

  if (hasValidAuth && tokenValid) {
    console.log('✅ Auth data found in storage');
    console.log('✅ Token is valid');
    console.log('✅ Expected: User should be automatically logged in');
    if (currentPath === '/signin' || currentPath === '/sign-in') {
      console.log('⚠️  But user is on sign-in page - check server verification');
    } else if (document.querySelector('[class*="landing"]')) {
      console.log('⚠️  But landing page is showing - check React state');
    } else {
      console.log('✅ User appears to be logged in correctly');
    }
  } else if (hasValidAuth && !tokenValid) {
    console.log('⚠️  Auth data found but token is expired');
    console.log('✅ Expected: User should be redirected to sign-in');
  } else {
    console.log('ℹ️  No auth data in storage');
    console.log('✅ Expected: User should see sign-in page');
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 Next Steps:');
  console.log('='.repeat(60));
  console.log('1. If landing page shows but you have valid auth:');
  console.log('   - Check React DevTools for AuthProvider state');
  console.log('   - Verify isAuthenticated is true');
  console.log('   - Check for errors in console');
  console.log('2. If sign-in page shows but you have valid auth:');
  console.log('   - Check Network tab for /api/auth/verify request');
  console.log('   - Verify server is running');
  console.log('   - Check server response');
  console.log('3. If everything looks correct but still not working:');
  console.log('   - Hard refresh the page (Cmd+Shift+R)');
  console.log('   - Clear cache and try again');
  console.log('   - Check browser console for React errors\n');
})();

