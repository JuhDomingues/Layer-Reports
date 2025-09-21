// Debug Tools for Meta Ads Dashboard

// Enhanced debugging functions
window.debugFacebookConnection = function() {
    console.group('🔍 Facebook Connection Debug');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ metaAdsApp not found');
        return;
    }

    // Basic info
    console.log('📋 Basic Information:');
    console.log('- Mode:', app.api.mode);
    console.log('- Protocol:', window.location.protocol);
    console.log('- Hostname:', window.location.hostname);
    console.log('- Is HTTPS:', app.api.isHttps);
    console.log('- App ID:', app.api.facebookAppId);
    console.log('- Fallback App ID:', app.api.fallbackAppId);

    // Token info
    console.log('\n🔑 Authentication:');
    console.log('- Has Access Token:', !!app.api.accessToken);
    console.log('- Token Expires At:', app.api.tokenExpiresAt ? new Date(app.api.tokenExpiresAt) : 'Not set');
    console.log('- Token Expired:', app.api.isTokenExpired());
    console.log('- Is Authenticated:', app.api.isAuthenticated());
    console.log('- Connection Status:', app.api.connectionStatus);

    // SDK status
    console.log('\n📚 Facebook SDK:');
    console.log('- SDK Loaded:', app.api.isSDKLoaded);
    console.log('- FB Object Available:', typeof window.FB !== 'undefined');
    if (window.FB) {
        console.log('- FB.api Available:', typeof window.FB.api === 'function');
        console.log('- FB.login Available:', typeof window.FB.login === 'function');
    }

    // Rate limiting
    console.log('\n⏱️ Rate Limiting:');
    console.log('- API Calls Made:', app.api.rateLimitTracker.calls);
    console.log('- Reset Time:', new Date(app.api.rateLimitTracker.resetTime));

    // Error statistics
    console.log('\n📊 Error Statistics:');
    const errorStats = app.api.errorHandler.getErrorStats();
    console.log('- Total Errors:', errorStats.total);
    console.log('- Error Breakdown:', errorStats.breakdown);
    
    // Network status
    console.log('\n🌐 Network Status:');
    console.log('- Online:', navigator.onLine);
    console.log('- Connection Effective Type:', navigator.connection?.effectiveType || 'Unknown');

    console.groupEnd();
    
    // Suggestions
    console.group('💡 Troubleshooting Suggestions');
    
    if (!app.api.isHttps && app.api.mode === 'real') {
        console.warn('⚠️ HTTPS required for real API mode');
    }
    
    if (app.api.isTokenExpired()) {
        console.warn('⚠️ Token has expired - login required');
    }
    
    if (!window.FB && app.api.mode === 'real') {
        console.warn('⚠️ Facebook SDK not loaded');
    }
    
    if (app.api.rateLimitTracker.calls > 150) {
        console.warn('⚠️ Approaching rate limit');
    }
    
    console.groupEnd();
};

// Test specific API endpoints
window.testAPIEndpoints = async function() {
    console.group('🧪 Testing API Endpoints');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ metaAdsApp not found');
        return;
    }

    if (app.api.mode === 'demo') {
        console.log('✅ Demo mode - testing mock endpoints');
        
        try {
            const accounts = await app.api.getAdAccounts();
            console.log('✅ getAdAccounts:', accounts.data.length, 'accounts');
        } catch (error) {
            console.error('❌ getAdAccounts failed:', error.message);
        }

        try {
            const campaigns = await app.api.getCampaigns('demo_account');
            console.log('✅ getCampaigns:', campaigns.data.length, 'campaigns');
        } catch (error) {
            console.error('❌ getCampaigns failed:', error.message);
        }
        
    } else if (app.api.mode === 'real') {
        console.log('🔗 Real API mode - testing Facebook endpoints');
        
        if (!app.api.isAuthenticated()) {
            console.error('❌ Not authenticated - login required');
            console.groupEnd();
            return;
        }

        try {
            console.log('Testing /me/adaccounts...');
            const accounts = await app.api.getRealAdAccounts();
            console.log('✅ /me/adaccounts:', accounts.data.length, 'accounts');
        } catch (error) {
            console.error('❌ /me/adaccounts failed:', error.message);
        }

        try {
            console.log('Testing /me/businesses...');
            const businesses = await app.api.getRealBusinessManagers();
            console.log('✅ /me/businesses:', businesses.data.length, 'business managers');
        } catch (error) {
            console.error('❌ /me/businesses failed:', error.message);
        }
    }
    
    console.groupEnd();
};

// Force reconnection with enhanced login
window.forceReconnect = async function() {
    console.group('🔄 Force Reconnect');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ metaAdsApp not found');
        return;
    }

    try {
        console.log('1. Initializing login helper...');
        if (!app.api.loginHelper) {
            app.api.loginHelper = new FacebookLoginHelper(app.api);
        }
        
        console.log('2. Enhanced logout...');
        await app.api.loginHelper.enhancedLogout();
        
        console.log('3. Clearing SDK...');
        delete window.FB;
        app.api.isSDKLoaded = false;
        
        console.log('4. Reinitializing SDK...');
        await app.api.initFacebookSDK();
        
        console.log('5. Attempting enhanced login...');
        const result = await app.api.loginHelper.enhancedLogin();
        
        if (result.success) {
            console.log('✅ Enhanced reconnection successful');
        } else {
            console.error('❌ Enhanced reconnection failed:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Force reconnect failed:', error.message);
    }
    
    console.groupEnd();
};

// Enhanced login test
window.testEnhancedLogin = async function() {
    console.group('🧪 Testing Enhanced Login');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ metaAdsApp not found');
        return;
    }

    try {
        // Initialize login helper
        if (!app.api.loginHelper) {
            app.api.loginHelper = new FacebookLoginHelper(app.api);
        }

        console.log('🔍 Testing enhanced login flow...');
        const result = await app.api.loginHelper.enhancedLogin();
        
        if (result.success) {
            console.log('✅ Enhanced login successful');
            console.log('User:', result.user?.name);
            console.log('Token expires:', new Date(app.api.tokenExpiresAt));
        } else {
            console.error('❌ Enhanced login failed:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Enhanced login test failed:', error.message);
    }
    
    console.groupEnd();
};

// Clear all cached data
window.clearAPICache = function() {
    console.group('🧹 Clearing API Cache');
    
    const keysToRemove = [
        'facebook_access_token',
        'facebook_token_expires',
        'facebook_account_id',
        'api_mode',
        'api_errors'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('✅ Removed:', key);
    });
    
    // Clear session storage too
    sessionStorage.clear();
    console.log('✅ Session storage cleared');
    
    console.log('💡 Reload the page to apply changes');
    console.groupEnd();
};

// Show error logs
window.showErrorLogs = function() {
    console.group('📋 Error Logs');
    
    const app = window.metaAdsApp;
    if (app) {
        const stats = app.api.errorHandler.getErrorStats();
        console.table(stats.recent);
        console.log('Total errors:', stats.total);
        console.log('Error breakdown:', stats.breakdown);
    } else {
        const errors = JSON.parse(localStorage.getItem('api_errors') || '[]');
        console.table(errors.slice(-10));
    }
    
    console.groupEnd();
};

// Performance monitoring
window.monitorAPIPerformance = function() {
    console.group('⚡ API Performance Monitor');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ metaAdsApp not found');
        return;
    }

    // Wrap API methods to measure performance
    const originalGetAdAccounts = app.api.getAdAccounts;
    app.api.getAdAccounts = async function(...args) {
        const start = performance.now();
        try {
            const result = await originalGetAdAccounts.apply(this, args);
            const duration = performance.now() - start;
            console.log(`✅ getAdAccounts: ${duration.toFixed(2)}ms`);
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            console.error(`❌ getAdAccounts failed after ${duration.toFixed(2)}ms:`, error.message);
            throw error;
        }
    };

    console.log('✅ Performance monitoring enabled');
    console.log('💡 API calls will now show timing information');
    console.groupEnd();
};

// Connection health check
window.healthCheck = async function() {
    console.group('🏥 Connection Health Check');
    
    const tests = [
        {
            name: 'Internet Connection',
            test: () => navigator.onLine,
            critical: true
        },
        {
            name: 'HTTPS Protocol',
            test: () => window.location.protocol === 'https:' || window.location.hostname === 'localhost',
            critical: false
        },
        {
            name: 'Facebook SDK',
            test: () => typeof window.FB !== 'undefined',
            critical: true
        },
        {
            name: 'MetaAds App',
            test: () => typeof window.metaAdsApp !== 'undefined',
            critical: true
        },
        {
            name: 'API Token',
            test: () => window.metaAdsApp?.api?.accessToken && !window.metaAdsApp.api.isTokenExpired(),
            critical: false
        }
    ];

    let healthScore = 0;
    let criticalIssues = 0;

    for (const test of tests) {
        const passed = test.test();
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${passed ? 'OK' : 'FAILED'}`);
        
        if (passed) {
            healthScore++;
        } else if (test.critical) {
            criticalIssues++;
        }
    }

    const percentage = Math.round((healthScore / tests.length) * 100);
    console.log(`\n📊 Health Score: ${percentage}%`);
    
    if (criticalIssues > 0) {
        console.warn(`⚠️ ${criticalIssues} critical issue(s) found`);
    } else {
        console.log('✅ All critical systems operational');
    }

    console.groupEnd();
    return { healthScore: percentage, criticalIssues };
};

// Auto-debug on errors
window.addEventListener('error', (event) => {
    if (event.error && event.error.message?.includes('Facebook')) {
        console.warn('🔍 Facebook error detected, running auto-debug...');
        setTimeout(() => {
            window.debugFacebookConnection();
        }, 1000);
    }
});

// Quick popup test
window.testPopups = async function() {
    const isAllowed = await window.popupDetector.testPopupBlocking();
    console.log('Popup test result:', isAllowed ? '✅ Allowed' : '❌ Blocked');
    if (!isAllowed) {
        window.popupDetector.showPopupBlockedWarning();
    }
    return isAllowed;
};

// Alternative login test
window.testAlternativeLogin = async function() {
    console.group('🧪 Testing Alternative Login Methods');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ metaAdsApp not found');
        return;
    }

    try {
        const result = await window.popupDetector.attemptAlternativeLogin(app.api);
        console.log('Alternative login result:', result);
    } catch (error) {
        console.error('❌ Alternative login failed:', error);
    }
    
    console.groupEnd();
};

// Show Facebook configuration modal
window.showFacebookConfig = function() {
    window.domainDetector.showConfigurationModal();
};

// Get current domain configuration
window.getDomainConfig = function() {
    return window.domainDetector.displayCurrentConfig();
};

console.log('🛠️ Debug tools loaded. Available commands:');
console.log('- debugFacebookConnection() - Full connection debug');
console.log('- testAPIEndpoints() - Test API endpoints');
console.log('- forceReconnect() - Force FB reconnection with enhanced login');
console.log('- testEnhancedLogin() - Test new enhanced login flow');
console.log('- testPopups() - Test if popups are blocked');
console.log('- testAlternativeLogin() - Test alternative login methods');
console.log('- showFacebookConfig() - Show Facebook domain configuration guide');
console.log('- getDomainConfig() - Display current domain configuration');
console.log('- clearAPICache() - Clear all cached data');
console.log('- showErrorLogs() - Show recent errors');
console.log('- monitorAPIPerformance() - Enable performance monitoring');
console.log('- healthCheck() - Run connection health check');