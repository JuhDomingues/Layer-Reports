// Facebook App Status Management

class FacebookAppStatusManager {
    constructor() {
        this.appStatuses = {
            '778309504913999': 'checking', // Will be determined
            '1091093523181393': 'checking'  // Fallback app
        };
        this.activeAppId = null;
        this.developmentMode = false;
    }

    // Check if app is active or in development mode
    async checkAppStatus(appId) {
        console.log(`🔍 Checking status for App ID: ${appId}`);
        
        try {
            // Try to initialize SDK with the app
            await this.testAppInitialization(appId);
            
            // If no error, app might be active or in development
            const status = await this.determineAppMode(appId);
            this.appStatuses[appId] = status;
            
            return status;
        } catch (error) {
            console.warn(`❌ App ${appId} failed initialization:`, error.message);
            this.appStatuses[appId] = 'inactive';
            return 'inactive';
        }
    }

    // Test app initialization
    async testAppInitialization(appId) {
        return new Promise((resolve, reject) => {
            // Create a temporary FB init to test
            if (window.FB) {
                delete window.FB;
            }

            window.fbAsyncInit = () => {
                try {
                    FB.init({
                        appId: appId,
                        cookie: true,
                        xfbml: true,
                        version: 'v18.0'
                    });
                    
                    // Test basic API call
                    FB.api('/me', { fields: 'id' }, (response) => {
                        if (response.error) {
                            if (response.error.code === 101) {
                                reject(new Error('App is inactive or not properly configured'));
                            } else if (response.error.code === 102) {
                                reject(new Error('App requires user to be logged in (development mode)'));
                            } else {
                                reject(new Error(response.error.message));
                            }
                        } else {
                            resolve('active');
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            };

            // Load SDK if not already loaded
            if (!document.getElementById('facebook-jssdk')) {
                const js = document.createElement('script');
                js.id = 'facebook-jssdk';
                js.src = "https://connect.facebook.net/pt_BR/sdk.js";
                document.getElementsByTagName('head')[0].appendChild(js);
            } else {
                window.fbAsyncInit();
            }
        });
    }

    // Determine if app is in development or live mode
    async determineAppMode(appId) {
        return new Promise((resolve) => {
            FB.getLoginStatus((response) => {
                console.log(`📊 Login status for ${appId}:`, response);
                
                if (response.status === 'connected') {
                    resolve('active');
                } else if (response.status === 'not_authorized') {
                    resolve('development'); // App works but user needs to authorize
                } else {
                    resolve('unknown');
                }
            });
        });
    }

    // Show app status resolution modal
    showAppStatusModal(appId, status) {
        this.removeExistingModal();

        const modal = document.createElement('div');
        modal.id = 'app-status-modal';
        modal.className = 'app-status-modal';
        modal.innerHTML = this.generateModalContent(appId, status);

        document.body.appendChild(modal);
    }

    // Generate modal content based on status
    generateModalContent(appId, status) {
        const baseContent = {
            inactive: {
                title: '🚫 Facebook App Inativo',
                description: 'O aplicativo Facebook está inativo e não pode ser usado.',
                color: '#dc3545',
                solutions: [
                    {
                        title: 'Ativar o Aplicativo',
                        steps: [
                            'Acesse Facebook Developers Console',
                            'Vá para Settings > Basic',
                            'Mude o status para "Live"',
                            'Complete a revisão do app se necessário'
                        ],
                        url: `https://developers.facebook.com/apps/${appId}/`,
                        primary: true
                    },
                    {
                        title: 'Usar Modo Demo',
                        steps: [
                            'Continuar sem autenticação real',
                            'Usar dados simulados para desenvolvimento',
                            'Funcionalidade limitada mas utilizável'
                        ],
                        action: 'useDemoMode',
                        primary: false
                    }
                ]
            },
            development: {
                title: '🔧 App em Modo Desenvolvimento',
                description: 'O aplicativo está ativo mas em modo desenvolvimento. Apenas desenvolvedores/testadores podem usar.',
                color: '#ffc107',
                solutions: [
                    {
                        title: 'Adicionar como Desenvolvedor/Testador',
                        steps: [
                            'Acesse Facebook Developers Console',
                            'Vá para Roles > Roles',
                            'Adicione seu usuário como Developer ou Tester',
                            'Aceite o convite no Facebook'
                        ],
                        url: `https://developers.facebook.com/apps/${appId}/roles/`,
                        primary: true
                    },
                    {
                        title: 'Publicar o App',
                        steps: [
                            'Complete todas as configurações obrigatórias',
                            'Adicione Privacy Policy e Terms of Service',
                            'Submeta para revisão do Facebook',
                            'Aguarde aprovação (pode levar dias)'
                        ],
                        url: `https://developers.facebook.com/apps/${appId}/review-status/`,
                        primary: false
                    },
                    {
                        title: 'Continuar no Modo Demo',
                        steps: [
                            'Usar dados simulados',
                            'Desenvolvimento sem restrições',
                            'Trocar para API real quando app for aprovado'
                        ],
                        action: 'useDemoMode',
                        primary: false
                    }
                ]
            },
            unknown: {
                title: '❓ Status do App Desconhecido',
                description: 'Não foi possível determinar o status do aplicativo Facebook.',
                color: '#6c757d',
                solutions: [
                    {
                        title: 'Verificar Configuração Manual',
                        steps: [
                            'Verifique o Facebook Developers Console',
                            'Confirme se o App ID está correto',
                            'Verifique se você tem acesso ao app'
                        ],
                        url: `https://developers.facebook.com/apps/${appId}/`,
                        primary: true
                    },
                    {
                        title: 'Usar Modo Demo',
                        steps: [
                            'Continuar com dados simulados',
                            'Configurar autenticação posteriormente'
                        ],
                        action: 'useDemoMode',
                        primary: false
                    }
                ]
            }
        };

        const content = baseContent[status] || baseContent.unknown;

        return `
            <div class="app-status-content">
                <div class="status-header" style="background-color: ${content.color}">
                    <h2>${content.title}</h2>
                    <button class="close-btn" onclick="document.getElementById('app-status-modal').remove()">✕</button>
                </div>
                
                <div class="status-body">
                    <div class="status-description">
                        <p>${content.description}</p>
                        <div class="app-info">
                            <strong>App ID:</strong> ${appId}<br>
                            <strong>Status:</strong> ${status.toUpperCase()}
                        </div>
                    </div>

                    <div class="solutions-container">
                        <h3>💡 Soluções Disponíveis:</h3>
                        
                        ${content.solutions.map((solution, index) => `
                            <div class="solution-card ${solution.primary ? 'primary' : 'secondary'}">
                                <h4>${solution.title}</h4>
                                <ol class="solution-steps">
                                    ${solution.steps.map(step => `<li>${step}</li>`).join('')}
                                </ol>
                                <div class="solution-actions">
                                    ${solution.url ? `
                                        <a href="${solution.url}" target="_blank" class="btn btn-primary">
                                            🔗 Abrir Console
                                        </a>
                                    ` : ''}
                                    ${solution.action ? `
                                        <button onclick="window.appStatusManager.${solution.action}()" class="btn btn-secondary">
                                            📊 Usar Modo Demo
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="status-footer">
                        <p><small>💡 <strong>Recomendação:</strong> Para uso em produção, o app deve estar em modo "Live" e aprovado pelo Facebook.</small></p>
                    </div>
                </div>
            </div>
        `;
    }

    // Remove existing modal
    removeExistingModal() {
        const existing = document.getElementById('app-status-modal');
        if (existing) {
            existing.remove();
        }
    }

    // Switch to demo mode
    useDemoMode() {
        console.log('🔄 Switching to demo mode due to Facebook app issues...');
        
        this.removeExistingModal();
        
        if (window.metaAdsApp) {
            window.metaAdsApp.api.setMode('demo');
            window.metaAdsApp.loadInitialData();
            
            // Show success message
            this.showDemoModeMessage();
        }
    }

    // Show demo mode activation message
    showDemoModeMessage() {
        const message = document.createElement('div');
        message.className = 'demo-mode-message';
        message.innerHTML = `
            <div class="demo-message-content">
                <h3>📊 Modo Demo Ativado</h3>
                <p>O dashboard agora está funcionando com dados simulados.</p>
                <p>Você pode explorar todas as funcionalidades enquanto configura a autenticação Facebook.</p>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary">
                    Entendi
                </button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 8000);
    }

    // Check all available apps and find the best one
    async findBestAvailableApp() {
        console.log('🔍 Finding best available Facebook app...');
        
        const apps = ['778309504913999', '1091093523181393'];
        const results = {};
        
        for (const appId of apps) {
            try {
                const status = await this.checkAppStatus(appId);
                results[appId] = status;
                console.log(`📊 App ${appId}: ${status}`);
                
                if (status === 'active') {
                    this.activeAppId = appId;
                    return { appId, status };
                }
            } catch (error) {
                console.warn(`❌ Failed to check app ${appId}:`, error.message);
                results[appId] = 'error';
            }
        }
        
        // If no active app found, check for development mode apps
        for (const appId of apps) {
            if (results[appId] === 'development') {
                this.developmentMode = true;
                this.activeAppId = appId;
                return { appId, status: 'development' };
            }
        }
        
        // No working app found
        return { appId: apps[0], status: 'inactive' };
    }

    // Auto-detect and handle app status issues
    async autoDetectAndHandle() {
        console.log('🔍 Auto-detecting Facebook app status...');
        
        try {
            const result = await this.findBestAvailableApp();
            
            if (result.status === 'active') {
                console.log('✅ Found active Facebook app:', result.appId);
                return result;
            } else if (result.status === 'development') {
                console.log('⚠️ App is in development mode:', result.appId);
                this.showAppStatusModal(result.appId, 'development');
                return result;
            } else {
                console.log('❌ No working Facebook app found');
                this.showAppStatusModal(result.appId, 'inactive');
                return result;
            }
        } catch (error) {
            console.error('❌ Failed to detect app status:', error);
            this.showAppStatusModal('778309504913999', 'unknown');
            return { appId: '778309504913999', status: 'unknown' };
        }
    }
}

// Initialize global app status manager
window.appStatusManager = new FacebookAppStatusManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacebookAppStatusManager;
}