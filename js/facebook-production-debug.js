// Facebook Production Debug - Advanced troubleshooting for Live apps

class FacebookProductionDebugger {
    constructor() {
        this.debugResults = {};
        this.recommendations = [];
    }

    // Comprehensive production app debugging
    async debugProductionApp(appId = '778309504913999') {
        console.group('🔍 Facebook Production App Debug');
        console.log(`Debugging App ID: ${appId}`);
        
        this.debugResults = {
            appId: appId,
            timestamp: new Date().toISOString(),
            tests: {}
        };

        // Test 1: Basic SDK Loading
        await this.testSDKLoading(appId);
        
        // Test 2: App Configuration
        await this.testAppConfiguration(appId);
        
        // Test 3: Domain Validation
        await this.testDomainValidation();
        
        // Test 4: Login Status Check
        await this.testLoginStatus();
        
        // Test 5: API Endpoint Accessibility
        await this.testAPIEndpoints();
        
        // Test 6: Business Verification
        await this.testBusinessVerification();
        
        // Generate recommendations
        this.generateRecommendations();
        
        // Show results
        this.showDebugResults();
        
        console.groupEnd();
        return this.debugResults;
    }

    // Test SDK loading with detailed error capture
    async testSDKLoading(appId) {
        console.log('🧪 Testing SDK Loading...');
        
        try {
            const result = await this.loadSDKWithDebug(appId);
            this.debugResults.tests.sdkLoading = {
                status: 'success',
                details: result
            };
            console.log('✅ SDK Loading: SUCCESS');
        } catch (error) {
            this.debugResults.tests.sdkLoading = {
                status: 'failed',
                error: error.message,
                details: error
            };
            console.error('❌ SDK Loading: FAILED', error.message);
        }
    }

    // Load SDK with enhanced debugging
    async loadSDKWithDebug(appId) {
        return new Promise((resolve, reject) => {
            // Clear existing FB
            if (window.FB) {
                delete window.FB;
            }

            let sdkLoadTimeout = setTimeout(() => {
                reject(new Error('SDK load timeout after 10 seconds'));
            }, 10000);

            window.fbAsyncInit = () => {
                clearTimeout(sdkLoadTimeout);
                try {
                    FB.init({
                        appId: appId,
                        cookie: true,
                        xfbml: true,
                        version: 'v18.0',
                        status: true
                    });
                    
                    console.log('📊 SDK Initialized with config:', {
                        appId: appId,
                        version: 'v18.0',
                        cookie: true,
                        status: true
                    });
                    
                    resolve({
                        initialized: true,
                        version: 'v18.0',
                        appId: appId
                    });
                } catch (error) {
                    reject(error);
                }
            };

            // Load script with error handling
            if (!document.getElementById('facebook-jssdk')) {
                const script = document.createElement('script');
                script.id = 'facebook-jssdk';
                script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
                script.async = true;
                script.defer = true;
                
                script.onerror = () => {
                    clearTimeout(sdkLoadTimeout);
                    reject(new Error('Failed to load Facebook SDK script'));
                };
                
                document.head.appendChild(script);
            } else {
                window.fbAsyncInit();
            }
        });
    }

    // Test app configuration
    async testAppConfiguration(appId) {
        console.log('🧪 Testing App Configuration...');
        
        if (!window.FB) {
            this.debugResults.tests.appConfiguration = {
                status: 'skipped',
                reason: 'SDK not loaded'
            };
            return;
        }

        try {
            const config = await this.getAppConfiguration();
            this.debugResults.tests.appConfiguration = {
                status: 'success',
                config: config
            };
            console.log('✅ App Configuration: SUCCESS', config);
        } catch (error) {
            this.debugResults.tests.appConfiguration = {
                status: 'failed',
                error: error.message
            };
            console.error('❌ App Configuration: FAILED', error.message);
        }
    }

    // Get app configuration details
    async getAppConfiguration() {
        return new Promise((resolve, reject) => {
            // Try to get app info
            FB.api('/me', { fields: 'id' }, (response) => {
                if (response.error) {
                    // Analyze the specific error
                    const errorAnalysis = this.analyzeAPIError(response.error);
                    reject(new Error(`API Error: ${response.error.message} (${errorAnalysis})`));
                } else {
                    resolve({
                        apiCallSuccessful: true,
                        userContext: !!response.id
                    });
                }
            });
        });
    }

    // Analyze specific API errors
    analyzeAPIError(error) {
        const errorMappings = {
            1: 'Unknown error - check app configuration',
            2: 'Service temporarily unavailable',
            4: 'Application request limit reached',
            10: 'Permission is required to perform this action',
            17: 'User request limit reached',
            100: 'Invalid parameter',
            101: 'Invalid API key - app may be inactive or misconfigured',
            102: 'Session key invalid or no longer valid',
            190: 'Access token has expired or been invalidated',
            200: 'User does not have permission to perform this action',
            341: 'Application limit reached',
            368: 'The action attempted has been deemed abusive or is otherwise disallowed'
        };

        return errorMappings[error.code] || `Unknown error code: ${error.code}`;
    }

    // Test domain validation
    async testDomainValidation() {
        console.log('🧪 Testing Domain Validation...');
        
        const currentDomain = window.location.hostname;
        const currentOrigin = window.location.origin;
        
        const domainTests = {
            hostname: currentDomain,
            origin: currentOrigin,
            protocol: window.location.protocol,
            isHttps: window.location.protocol === 'https:',
            isVercelApp: currentDomain.includes('vercel.app'),
            isProd: !currentDomain.includes('localhost')
        };

        this.debugResults.tests.domainValidation = {
            status: 'info',
            details: domainTests
        };

        console.log('📊 Domain Details:', domainTests);
        
        if (!domainTests.isHttps && domainTests.isProd) {
            console.warn('⚠️ Production domain should use HTTPS');
        }
    }

    // Test login status
    async testLoginStatus() {
        console.log('🧪 Testing Login Status...');
        
        if (!window.FB) {
            this.debugResults.tests.loginStatus = {
                status: 'skipped',
                reason: 'SDK not loaded'
            };
            return;
        }

        try {
            const status = await this.getDetailedLoginStatus();
            this.debugResults.tests.loginStatus = {
                status: 'success',
                details: status
            };
            console.log('✅ Login Status: SUCCESS', status);
        } catch (error) {
            this.debugResults.tests.loginStatus = {
                status: 'failed',
                error: error.message
            };
            console.error('❌ Login Status: FAILED', error.message);
        }
    }

    // Get detailed login status
    async getDetailedLoginStatus() {
        return new Promise((resolve, reject) => {
            FB.getLoginStatus((response) => {
                const analysis = {
                    status: response.status,
                    hasAuthResponse: !!response.authResponse,
                    timestamp: new Date().toISOString()
                };

                if (response.authResponse) {
                    analysis.authDetails = {
                        accessToken: response.authResponse.accessToken ? 'Present' : 'Missing',
                        expiresIn: response.authResponse.expiresIn,
                        signedRequest: response.authResponse.signedRequest ? 'Present' : 'Missing',
                        userID: response.authResponse.userID
                    };
                }

                resolve(analysis);
            });
        });
    }

    // Test API endpoints
    async testAPIEndpoints() {
        console.log('🧪 Testing API Endpoints...');
        
        if (!window.FB) {
            this.debugResults.tests.apiEndpoints = {
                status: 'skipped',
                reason: 'SDK not loaded'
            };
            return;
        }

        const endpoints = [
            { name: 'App Info', path: '/app', fields: 'id,name' },
            { name: 'User Info', path: '/me', fields: 'id,name' },
            { name: 'Permissions', path: '/me/permissions', fields: 'permission,status' }
        ];

        const results = {};

        for (const endpoint of endpoints) {
            try {
                const result = await this.testEndpoint(endpoint);
                results[endpoint.name] = {
                    status: 'success',
                    data: result
                };
                console.log(`✅ ${endpoint.name}: SUCCESS`);
            } catch (error) {
                results[endpoint.name] = {
                    status: 'failed',
                    error: error.message
                };
                console.error(`❌ ${endpoint.name}: FAILED`, error.message);
            }
        }

        this.debugResults.tests.apiEndpoints = {
            status: 'completed',
            results: results
        };
    }

    // Test individual endpoint
    async testEndpoint(endpoint) {
        return new Promise((resolve, reject) => {
            FB.api(endpoint.path, { fields: endpoint.fields }, (response) => {
                if (response.error) {
                    reject(new Error(`${response.error.message} (Code: ${response.error.code})`));
                } else {
                    resolve(response);
                }
            });
        });
    }

    // Test business verification
    async testBusinessVerification() {
        console.log('🧪 Testing Business Verification...');
        
        if (!window.FB) {
            this.debugResults.tests.businessVerification = {
                status: 'skipped',
                reason: 'SDK not loaded'
            };
            return;
        }

        try {
            // Try to access business-related endpoints
            const businessTest = await this.testBusinessAccess();
            this.debugResults.tests.businessVerification = {
                status: 'success',
                details: businessTest
            };
            console.log('✅ Business Verification: SUCCESS');
        } catch (error) {
            this.debugResults.tests.businessVerification = {
                status: 'failed',
                error: error.message
            };
            console.error('❌ Business Verification: FAILED', error.message);
        }
    }

    // Test business access
    async testBusinessAccess() {
        return new Promise((resolve, reject) => {
            FB.api('/me/businesses', { fields: 'id,name' }, (response) => {
                if (response.error) {
                    reject(new Error(`Business access error: ${response.error.message}`));
                } else {
                    resolve({
                        hasBusinessAccess: true,
                        businessCount: response.data ? response.data.length : 0,
                        businesses: response.data || []
                    });
                }
            });
        });
    }

    // Generate recommendations based on test results
    generateRecommendations() {
        this.recommendations = [];

        // Check SDK loading
        if (this.debugResults.tests.sdkLoading?.status === 'failed') {
            this.recommendations.push({
                priority: 'high',
                issue: 'Facebook SDK Failed to Load',
                solution: 'Check network connectivity and domain configuration',
                action: 'Verify domain is added to Facebook App settings'
            });
        }

        // Check API errors
        if (this.debugResults.tests.appConfiguration?.status === 'failed') {
            const error = this.debugResults.tests.appConfiguration.error;
            if (error.includes('101')) {
                this.recommendations.push({
                    priority: 'critical',
                    issue: 'App ID Invalid or App Inactive',
                    solution: 'Verify App ID and status in Facebook Developers',
                    action: 'Check https://developers.facebook.com/apps/778309504913999/'
                });
            }
        }

        // Check domain configuration
        const domain = this.debugResults.tests.domainValidation?.details;
        if (domain && !domain.isHttps && domain.isProd) {
            this.recommendations.push({
                priority: 'medium',
                issue: 'Production Domain Not Using HTTPS',
                solution: 'Ensure all production domains use HTTPS',
                action: 'Update domain configuration to force HTTPS'
            });
        }

        // Check business verification
        if (this.debugResults.tests.businessVerification?.status === 'failed') {
            this.recommendations.push({
                priority: 'medium',
                issue: 'Business Verification Required',
                solution: 'App may require business verification for production use',
                action: 'Complete business verification in Facebook Business Manager'
            });
        }
    }

    // Show debug results in modal
    showDebugResults() {
        const modal = document.createElement('div');
        modal.id = 'production-debug-modal';
        modal.className = 'production-debug-modal';
        modal.innerHTML = this.generateDebugModal();
        document.body.appendChild(modal);
    }

    // Generate debug modal HTML
    generateDebugModal() {
        const testResults = Object.entries(this.debugResults.tests).map(([testName, result]) => {
            const statusIcon = result.status === 'success' ? '✅' : 
                              result.status === 'failed' ? '❌' : '⏭️';
            
            return `
                <div class="debug-test-result ${result.status}">
                    <h4>${statusIcon} ${testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                    ${result.error ? `<p class="error">Error: ${result.error}</p>` : ''}
                    ${result.details ? `<pre class="details">${JSON.stringify(result.details, null, 2)}</pre>` : ''}
                </div>
            `;
        }).join('');

        const recommendations = this.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}">
                <h4>🔧 ${rec.issue}</h4>
                <p><strong>Solution:</strong> ${rec.solution}</p>
                <p><strong>Action:</strong> ${rec.action}</p>
            </div>
        `).join('');

        return `
            <div class="debug-modal-content">
                <div class="debug-header">
                    <h2>🔍 Facebook Production Debug Results</h2>
                    <button onclick="document.getElementById('production-debug-modal').remove()">✕</button>
                </div>
                
                <div class="debug-body">
                    <div class="debug-summary">
                        <h3>📊 Test Summary</h3>
                        <p>App ID: <code>${this.debugResults.appId}</code></p>
                        <p>Timestamp: ${new Date(this.debugResults.timestamp).toLocaleString()}</p>
                    </div>

                    <div class="debug-tests">
                        <h3>🧪 Test Results</h3>
                        ${testResults}
                    </div>

                    ${this.recommendations.length > 0 ? `
                        <div class="debug-recommendations">
                            <h3>💡 Recommendations</h3>
                            ${recommendations}
                        </div>
                    ` : ''}

                    <div class="debug-actions">
                        <button onclick="window.productionDebugger.retryWithFixes()" class="btn btn-primary">
                            🔄 Retry with Fixes
                        </button>
                        <a href="https://developers.facebook.com/apps/778309504913999/" target="_blank" class="btn btn-secondary">
                            🔗 Open Facebook Console
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Retry with automatic fixes
    async retryWithFixes() {
        console.log('🔄 Retrying with automatic fixes...');
        document.getElementById('production-debug-modal').remove();
        
        // Apply automatic fixes
        await this.applyAutomaticFixes();
        
        // Re-run debug
        setTimeout(() => {
            this.debugProductionApp();
        }, 2000);
    }

    // Apply automatic fixes
    async applyAutomaticFixes() {
        console.log('🔧 Applying automatic fixes...');
        
        // Clear all caches
        localStorage.removeItem('facebook_access_token');
        localStorage.removeItem('facebook_token_expires');
        
        // Force HTTPS if needed
        if (window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
            window.location.protocol = 'https:';
            return;
        }
        
        // Reinitialize SDK
        if (window.FB) {
            delete window.FB;
        }
        
        const existingScript = document.getElementById('facebook-jssdk');
        if (existingScript) {
            existingScript.remove();
        }
        
        console.log('✅ Automatic fixes applied');
    }
}

// Initialize global production debugger
window.productionDebugger = new FacebookProductionDebugger();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacebookProductionDebugger;
}