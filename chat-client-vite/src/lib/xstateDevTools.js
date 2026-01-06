/**
 * XState DevTools Integration
 *
 * Enables XState DevTools in development for debugging state machines.
 * 
 * To use XState DevTools:
 * 1. Install browser extension: https://stately.ai/viz
 * 2. Or use the inspector: npm install @xstate/inspect
 * 
 * The machine is automatically available in DevTools if extension is installed.
 */

/**
 * Initialize XState DevTools (optional)
 * 
 * Uncomment and install @xstate/inspect to enable:
 * npm install @xstate/inspect
 */
export async function initXStateDevTools() {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    try {
      // Optional: Uncomment to enable inspector
      // const { inspect } = await import('@xstate/inspect');
      // inspect({ iframe: false });
      // console.log('✅ XState DevTools enabled');
      
      // For now, use browser extension at https://stately.ai/viz
      console.log('💡 XState: Install browser extension at https://stately.ai/viz for visual debugging');
    } catch (error) {
      // DevTools not available, that's okay
      console.debug('XState DevTools not available (optional)');
    }
  }
}

