// Domain Detector for Facebook Configuration

class DomainDetector {
    constructor() {
        this.currentDomain = this.getCurrentDomain();
        this.isProduction = this.detectProductionEnvironment();
    }

    // Get current domain information
    getCurrentDomain() {
        return {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            port: window.location.port,
            origin: window.location.origin,
            fullUrl: window.location.href
        };
    }

    // Detect if we're in production
    detectProductionEnvironment() {
        const hostname = window.location.hostname;
        return hostname.includes('vercel.app') ||
               hostname.includes('netlify.app') ||
               hostname.includes('github.io') ||
               hostname.includes('layer-reports') ||
               (window.location.protocol === 'https:' && hostname !== 'localhost');
    }

    // Get the exact domain that should be configured in Facebook
    getFacebookDomainConfig() {
        const config = {
            appDomains: [],
            validOAuthRedirectURIs: [],
            websiteURL: null,
            recommended: []
        };

        if (this.isProduction) {
            // Production configuration
            config.appDomains.push(this.currentDomain.hostname);
            config.validOAuthRedirectURIs.push(this.currentDomain.origin + '/');
            config.websiteURL = this.currentDomain.origin;
            
            // Add variations that might be needed
            if (this.currentDomain.hostname.includes('vercel.app')) {
                // Also add the base domain without subdomain
                const baseDomain = this.currentDomain.hostname.split('.').slice(-2).join('.');
                config.appDomains.push(baseDomain);
            }
        } else {
            // Development configuration
            config.appDomains.push('localhost');
            config.validOAuthRedirectURIs.push('http://localhost:8000/');
            config.websiteURL = 'http://localhost:8000';
        }

        // Recommended configurations
        config.recommended = [
            'App Domains: ' + config.appDomains.join(', '),
            'Valid OAuth Redirect URIs: ' + config.validOAuthRedirectURIs.join(', '),
            'Website URL: ' + config.websiteURL
        ];

        return config;
    }

    // Display current configuration
    displayCurrentConfig() {
        console.group('🌐 Current Domain Configuration');
        console.log('Environment:', this.isProduction ? 'Production' : 'Development');
        console.log('Hostname:', this.currentDomain.hostname);
        console.log('Protocol:', this.currentDomain.protocol);
        console.log('Origin:', this.currentDomain.origin);
        console.log('Full URL:', this.currentDomain.fullUrl);
        console.groupEnd();

        const fbConfig = this.getFacebookDomainConfig();
        console.group('📋 Facebook App Configuration Required');
        fbConfig.recommended.forEach(config => {
            console.log('✅', config);
        });
        console.groupEnd();

        return fbConfig;
    }

    // Generate Facebook App configuration instructions
    generateConfigInstructions() {
        const config = this.getFacebookDomainConfig();
        
        const instructions = {
            title: 'Configuração Necessária no Facebook App',
            steps: [
                {
                    step: 1,
                    title: 'Acessar Facebook Developers',
                    action: 'Vá para https://developers.facebook.com/apps/1469476877413511/'
                },
                {
                    step: 2,
                    title: 'Configurações Básicas',
                    action: 'Em "Settings" > "Basic", configure:',
                    details: [
                        `App Domains: ${config.appDomains.join(', ')}`,
                        `Website URL: ${config.websiteURL}`
                    ]
                },
                {
                    step: 3,
                    title: 'Facebook Login',
                    action: 'Em "Products" > "Facebook Login" > "Settings", configure:',
                    details: [
                        `Valid OAuth Redirect URIs: ${config.validOAuthRedirectURIs.join(', ')}`,
                        `Web OAuth Login: Enable`,
                        `Enforce HTTPS: ${this.isProduction ? 'Yes' : 'No'}`
                    ]
                },
                {
                    step: 4,
                    title: 'Advanced Settings',
                    action: 'Em "Settings" > "Advanced", configure:',
                    details: [
                        'Require App Secret: No',
                        'Use Strict Mode for Redirect URIs: Yes',
                        'Server IP Whitelist: (deixe vazio)'
                    ]
                }
            ]
        };

        return instructions;
    }

    // Show configuration modal
    showConfigurationModal() {
        this.removeExistingModal();

        const instructions = this.generateConfigInstructions();
        const config = this.getFacebookDomainConfig();

        const modal = document.createElement('div');
        modal.id = 'facebook-config-modal';
        modal.className = 'facebook-config-modal';
        modal.innerHTML = `
            <div class="facebook-config-content">
                <div class="config-header">
                    <h2>🔧 ${instructions.title}</h2>
                    <button class="close-btn" onclick="document.getElementById('facebook-config-modal').remove()">
                        ✕
                    </button>
                </div>
                
                <div class="current-domain">
                    <h3>📍 Domínio Atual Detectado:</h3>
                    <div class="domain-info">
                        <strong>${this.currentDomain.hostname}</strong>
                        <span class="env-badge ${this.isProduction ? 'production' : 'development'}">
                            ${this.isProduction ? 'Produção' : 'Desenvolvimento'}
                        </span>
                    </div>
                </div>

                <div class="config-steps">
                    ${instructions.steps.map(step => `
                        <div class="config-step">
                            <div class="step-number">${step.step}</div>
                            <div class="step-content">
                                <h4>${step.title}</h4>
                                <p>${step.action}</p>
                                ${step.details ? `
                                    <ul class="step-details">
                                        ${step.details.map(detail => `<li>${detail}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="config-copy">
                    <h3>📋 Copie os valores exatos:</h3>
                    <div class="copy-section">
                        <label>App Domains:</label>
                        <div class="copy-value" onclick="navigator.clipboard.writeText('${config.appDomains.join(', ')}')">
                            ${config.appDomains.join(', ')}
                            <span class="copy-hint">Clique para copiar</span>
                        </div>
                    </div>
                    <div class="copy-section">
                        <label>Valid OAuth Redirect URIs:</label>
                        <div class="copy-value" onclick="navigator.clipboard.writeText('${config.validOAuthRedirectURIs.join('\\n')}')">
                            ${config.validOAuthRedirectURIs.join('<br>')}
                            <span class="copy-hint">Clique para copiar</span>
                        </div>
                    </div>
                    <div class="copy-section">
                        <label>Website URL:</label>
                        <div class="copy-value" onclick="navigator.clipboard.writeText('${config.websiteURL}')">
                            ${config.websiteURL}
                            <span class="copy-hint">Clique para copiar</span>
                        </div>
                    </div>
                </div>

                <div class="config-actions">
                    <a href="https://developers.facebook.com/apps/1469476877413511/" target="_blank" class="btn-primary">
                        🔗 Abrir Facebook Developers
                    </a>
                    <button onclick="window.domainDetector.testAfterConfig()" class="btn-secondary">
                        🧪 Testar Após Configuração
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Remove existing modal
    removeExistingModal() {
        const existing = document.getElementById('facebook-config-modal');
        if (existing) {
            existing.remove();
        }
    }

    // Test after configuration
    async testAfterConfig() {
        console.log('🧪 Testing configuration after Facebook setup...');
        
        // Close modal
        this.removeExistingModal();
        
        // Clear SDK and try again
        if (window.metaAdsApp) {
            try {
                await window.metaAdsApp.api.reinitializeSDK();
                console.log('✅ SDK reinitialized');
                
                // Test login
                const result = await window.metaAdsApp.api.authenticateWithFallback();
                if (result.success) {
                    console.log('✅ Authentication successful after configuration!');
                    alert('✅ Configuração aplicada com sucesso! Login funcionando.');
                } else {
                    console.warn('⚠️ Authentication still failing:', result.message);
                    alert('⚠️ Ainda há problemas. Verifique se todas as configurações foram aplicadas corretamente.');
                }
            } catch (error) {
                console.error('❌ Test failed:', error);
                alert('❌ Teste falhou: ' + error.message);
            }
        }
    }

    // Auto-detect and show if configuration is needed
    autoDetectAndShow() {
        // Check if we're getting the host unknown error
        const originalConsoleError = console.error;
        let hostUnknownDetected = false;

        console.error = function(...args) {
            const message = args.join(' ').toLowerCase();
            if (message.includes('host') && (message.includes('unknown') || message.includes('jssdk'))) {
                hostUnknownDetected = true;
            }
            originalConsoleError.apply(console, args);
        };

        // Show modal if error detected or if not configured
        setTimeout(() => {
            if (hostUnknownDetected || !this.isConfigurationComplete()) {
                this.showConfigurationModal();
            }
            // Restore original console.error
            console.error = originalConsoleError;
        }, 2000);
    }

    // Check if configuration seems complete
    isConfigurationComplete() {
        // This is a heuristic check - in a real scenario you might
        // want to make an API call to verify the configuration
        return localStorage.getItem('facebook_config_verified') === 'true';
    }

    // Mark configuration as verified
    markConfigurationVerified() {
        localStorage.setItem('facebook_config_verified', 'true');
    }
}

// Initialize global domain detector
window.domainDetector = new DomainDetector();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DomainDetector;
}

// Auto-show configuration if needed
window.domainDetector.autoDetectAndShow();