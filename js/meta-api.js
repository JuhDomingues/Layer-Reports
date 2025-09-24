// Meta Ads Dashboard - Hybrid Mode (Demo + Real API)
class MetaAdsAPI {
    constructor() {
        // Detectar se está em HTTP e forçar modo demo, a menos que seja localhost
        const isHttps = window.location.protocol === 'https:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (!isHttps && !isLocalhost) {
            console.warn('⚠️ HTTP detectado e não é localhost - Facebook SDK requer HTTPS. Forçando modo demo.');
            this.mode = 'demo';
        } else {
            this.mode = localStorage.getItem('api_mode') || 'demo'; // 'demo' or 'real'
        }
        
        // Initialize error handler and connection monitor
        this.errorHandler = new APIErrorHandler();
        this.connectionMonitor = new ConnectionMonitor();
        this.loginHelper = null; // Will be initialized when needed
        
        this.facebookAppId = localStorage.getItem('facebook_app_id') || '778309504913999';
        this.fallbackAppId = '1469476877413511'; // Fallback App ID (previous)
        this.accessToken = localStorage.getItem('facebook_access_token');
        this.accountId = localStorage.getItem('facebook_account_id');
        this.isSDKLoaded = false;
        this.requiredPermissions = ['email', 'public_profile', 'pages_show_list'];
        this.user = null;
        this.connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected'
        this.isHttps = isHttps;
        this.tokenExpiresAt = localStorage.getItem('facebook_token_expires') ? 
                            parseInt(localStorage.getItem('facebook_token_expires')) : null;
        this.rateLimitTracker = {
            calls: 0,
            resetTime: Date.now() + 3600000 // 1 hour
        };
    }

    // Alternar modo API
    setMode(mode) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (mode === 'real' && !this.isHttps && !isLocalhost) {
            console.warn('⚠️ Modo real requer HTTPS. Mantendo modo demo.');
            this.mode = 'demo';
            return false;
        }
        this.mode = mode;
        localStorage.setItem('api_mode', mode);
        return true;
    }

    // Configurar App ID
    setAppId(appId) {
        this.facebookAppId = appId;
        localStorage.setItem('facebook_app_id', appId);
    }

    // Obter status da conexão
    getConnectionStatus() {
        return this.connectionStatus;
    }

    // Verificar se está autenticado
    isAuthenticated() {
        return this.accessToken && this.user && !this.isTokenExpired();
    }

    // Verificar se token expirou
    isTokenExpired() {
        if (!this.tokenExpiresAt) return false;
        return Date.now() >= this.tokenExpiresAt;
    }

    // Rate limiting check
    checkRateLimit() {
        const now = Date.now();
        if (now >= this.rateLimitTracker.resetTime) {
            this.rateLimitTracker.calls = 0;
            this.rateLimitTracker.resetTime = now + 3600000; // Reset for next hour
        }
        
        if (this.rateLimitTracker.calls >= 200) { // Facebook's rate limit
            const waitTime = this.rateLimitTracker.resetTime - now;
            throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 60000)} minutes.`);
        }
        
        this.rateLimitTracker.calls++;
    }

    // Obter informações do usuário
    getUserInfo() {
        return this.user;
    }

    // Inicializar Facebook SDK
    async initFacebookSDK() {
        console.log('[DEBUG] initFacebookSDK: Start');
        if (this.isSDKLoaded) {
            console.log('[DEBUG] initFacebookSDK: SDK already loaded.');
            return Promise.resolve();
        }
        
        if (!this.isHttps && this.mode === 'real') {
            console.warn('[DEBUG] initFacebookSDK: HTTPS required for real mode.');
            return Promise.reject(new Error('Facebook SDK requer HTTPS'));
        }

        return new Promise((resolve, reject) => {
            window.fbAsyncInit = () => {
                try {
                    console.log(`[DEBUG] fbAsyncInit: Initializing with App ID: ${this.facebookAppId}`);
                    FB.init({
                        appId: this.facebookAppId,
                        cookie: true,
                        xfbml: true,
                        version: 'v18.0',
                    });
                    this.isSDKLoaded = true;
                    console.log('[DEBUG] fbAsyncInit: SDK initialized successfully.');
                    resolve();
                } catch (error) {
                    console.error('[DEBUG] fbAsyncInit: Error initializing SDK', error);
                    reject(error);
                }
            };

            if (!document.getElementById('facebook-jssdk')) {
                console.log('[DEBUG] initFacebookSDK: Loading SDK script.');
                const js = document.createElement('script');
                js.id = 'facebook-jssdk';
                js.src = "https://connect.facebook.net/pt_BR/sdk/debug.js"; // Use debug version
                js.onload = () => console.log('[DEBUG] initFacebookSDK: SDK script loaded.');
                js.onerror = (e) => {
                    console.error('[DEBUG] initFacebookSDK: Failed to load SDK script.', e);
                    reject(new Error('Failed to load Facebook SDK script'));
                };
                document.head.appendChild(js);
            } else {
                console.log('[DEBUG] initFacebookSDK: SDK script tag already exists. Calling fbAsyncInit.');
                window.fbAsyncInit();
            }
        });
    }

    // Login com Facebook
    async loginWithFacebook() {
        console.log('[DEBUG] loginWithFacebook: Start');
        this.connectionStatus = 'connecting';
        
        try {
            await this.initFacebookSDK();
            console.log('[DEBUG] loginWithFacebook: SDK initialized.');

            return new Promise((resolve) => {
                console.log(`[DEBUG] loginWithFacebook: Calling FB.login with perms: ${this.requiredPermissions.join(',')}`);
                FB.login((response) => {
                    console.log('[DEBUG] loginWithFacebook: FB.login response received:', response);
                    
                    if (response.authResponse) {
                        console.log('[DEBUG] loginWithFacebook: authResponse successful.');
                        this.accessToken = response.authResponse.accessToken;
                        this.tokenExpiresAt = Date.now() + (response.authResponse.expiresIn * 1000);
                        localStorage.setItem('facebook_access_token', this.accessToken);
                        localStorage.setItem('facebook_token_expires', this.tokenExpiresAt.toString());
                        
                        console.log('[DEBUG] loginWithFacebook: Fetching user info with /me.');
                        FB.api('/me', { fields: 'name,email,picture' }, (userResponse) => {
                            console.log('[DEBUG] loginWithFacebook: /me response:', userResponse);
                            if (userResponse.error) {
                                this.connectionStatus = 'disconnected';
                                console.error('[DEBUG] loginWithFacebook: Error fetching user data.', userResponse.error);
                                resolve({ success: false, message: 'Error fetching user data: ' + userResponse.error.message, error: userResponse.error });
                            } else {
                                this.user = userResponse;
                                this.connectionStatus = 'connected';
                                console.log(`[DEBUG] loginWithFacebook: Success! User: ${userResponse.name}`);
                                resolve({ success: true, user: userResponse, accessToken: this.accessToken });
                            }
                        });
                    } else {
                        this.connectionStatus = 'disconnected';
                        console.warn('[DEBUG] loginWithFacebook: Login cancelled or not authorized.', response);
                        resolve({ success: false, message: 'Login cancelled or not authorized.', error: response });
                    }
                }, { 
                    scope: this.requiredPermissions.join(','),
                    return_scopes: true,
                    auth_type: 'rerequest' // Force re-authentication
                });
            });
        } catch (error) {
            this.connectionStatus = 'disconnected';
            console.error('[DEBUG] loginWithFacebook: Error during login process.', error);
            return { success: false, message: 'Error during login: ' + error.message, error: error };
        }
    }

    // Logout
    async logout() {
        this.connectionStatus = 'disconnected';
        this.user = null;
        this.accessToken = null;
        this.accountId = null;
        localStorage.removeItem('facebook_access_token');
        localStorage.removeItem('facebook_account_id');
        localStorage.removeItem('facebook_token_expires');
        console.log('[DEBUG] logout: Local session cleared.');
        
        if (this.isSDKLoaded && window.FB) {
            return new Promise((resolve) => {
                FB.logout(() => {
                    console.log('[DEBUG] logout: FB.logout successful.');
                    resolve();
                });
            });
        }
    }

    // Autenticação (híbrida)
    async authenticate() {
        console.log(`[DEBUG] authenticate: Start. Mode: ${this.mode}`);
        if (this.mode === 'demo') {
            return { success: true, message: 'Modo Demo', user: { name: 'Usuário Demo' }, mode: 'demo' };
        }

        // Check for existing valid token first
        if (this.accessToken && !this.isTokenExpired()) {
            console.log('[DEBUG] authenticate: Found valid token. Verifying...');
            try {
                const verification = await this.verifyToken();
                if (verification.success) {
                    console.log('[DEBUG] authenticate: Token verification successful.');
                    this.user = verification.user;
                    this.connectionStatus = 'connected';
                    return { success: true, user: this.user, accessToken: this.accessToken };
                }
            } catch (e) {
                console.warn('[DEBUG] authenticate: Token verification failed.', e);
            }
        }
        
        console.log('[DEBUG] authenticate: No valid token found, proceeding to login.');
        return this.loginWithFacebook();
    }

    async verifyToken() {
        return new Promise((resolve, reject) => {
            FB.api('/me', { fields: 'name,email,picture', access_token: this.accessToken }, (response) => {
                if (response.error) {
                    reject(response.error);
                } else {
                    resolve({ success: true, user: response });
                }
            });
        });
    }

    // Buscar contas de anúncio (híbrido)
    async getAdAccounts() {
        if (this.mode === 'demo') {
            return this.getDemoAdAccounts();
        }
        return this.getRealAdAccounts();
    }

    getDemoAdAccounts() {
        return new Promise(resolve => {
            setTimeout(() => resolve({
                data: [
                    { id: 'act_demo_1', name: 'Conta Demo 1 (BRL)', account_status: 1, currency: 'BRL' },
                    { id: 'act_demo_2', name: 'Conta Demo 2 (USD)', account_status: 1, currency: 'USD' }
                ]
            }), 500);
        });
    }

    async getRealAdAccounts() {
        console.log('[DEBUG] getRealAdAccounts: Start');
        if (!this.accessToken) throw new Error('Access token não encontrado.');
        if (this.isTokenExpired()) throw new Error('Token expirado.');

        return new Promise((resolve, reject) => {
            FB.api('/me/adaccounts', { 
                fields: 'id,name,account_status,currency,timezone_name,business',
                limit: 200,
                access_token: this.accessToken 
            }, (response) => {
                console.log('[DEBUG] getRealAdAccounts: /me/adaccounts response:', response);
                if (response.error) {
                    console.error('[DEBUG] getRealAdAccounts: API Error', response.error);
                    reject(new Error(this.errorHandler.handleAPIError(response, 'getRealAdAccounts')));
                } else {
                    resolve({ data: response.data || [] });
                }
            });
        });
    }

    // Buscar Business Managers
    async getBusinessManagers() {
        if (this.mode === 'demo') {
            return new Promise(resolve => setTimeout(() => resolve({
                data: [
                    { id: 'demo_bm_1', name: 'Business Manager Demo 1' },
                    { id: '177341406299126', name: 'Dr. Santiago Vecina' }
                ]
            }), 300));
        }
        return this.getRealBusinessManagers();
    }

    async getRealBusinessManagers() {
        console.log('[DEBUG] getRealBusinessManagers: Start');
        if (!this.accessToken) throw new Error('Access token não encontrado.');

        return new Promise((resolve, reject) => {
            FB.api('/me/businesses', { 
                fields: 'id,name',
                limit: 100,
                access_token: this.accessToken 
            }, (response) => {
                console.log('[DEBUG] getRealBusinessManagers: /me/businesses response:', response);
                if (response.error) {
                    console.error('[DEBUG] getRealBusinessManagers: API Error', response.error);
                    // Don't reject, just return empty array as it might not be a critical failure
                    resolve({ data: [] });
                } else {
                    resolve({ data: response.data || [] });
                }
            });
        });
    }
    
    // Buscar campanhas (híbrido)
    async getCampaigns(accountId, filters = {}) {
        if (this.mode === 'demo') {
            return this.getDemoCampaigns(filters);
        }
        return this.getRealCampaigns(accountId, filters);
    }

    getDemoCampaigns(filters) {
        // Basic demo campaigns
        return new Promise(resolve => setTimeout(() => resolve({ data: [
            { id: 'demo_camp_1', name: 'Campanha Demo 1', status: 'ACTIVE', objective: 'CONVERSIONS' },
            { id: 'demo_camp_2', name: 'Campanha Demo 2', status: 'PAUSED', objective: 'TRAFFIC' }
        ]}), 500));
    }

    async getRealCampaigns(accountId, filters) {
        console.log(`[DEBUG] getRealCampaigns: Start for account ${accountId}`, filters);
        if (!this.accessToken) throw new Error('Access token não encontrado.');
        if (!accountId) throw new Error('Account ID é obrigatório.');

        const params = {
            fields: 'id,name,status,objective,effective_status',
            limit: 200,
            access_token: this.accessToken
        };

        // API-side filtering (only for supported fields)
        const apiFilters = [];
        if (filters.status && filters.status.length > 0) {
            apiFilters.push({ field: 'effective_status', operator: 'IN', value: filters.status });
        }
        if (apiFilters.length > 0) {
            params.filtering = JSON.stringify(apiFilters);
        }

        return new Promise((resolve, reject) => {
            FB.api(`/${accountId}/campaigns`, params, (response) => {
                console.log(`[DEBUG] getRealCampaigns: /${accountId}/campaigns response:`, response);
                if (response.error) {
                    console.error('[DEBUG] getRealCampaigns: API Error', response.error);
                    reject(new Error(this.errorHandler.handleAPIError(response, 'getRealCampaigns')));
                } else {
                    // Additional client-side filtering if needed
                    let campaigns = response.data || [];
                    if (filters.name) {
                        campaigns = campaigns.filter(c => c.name.toLowerCase().includes(filters.name.toLowerCase()));
                    }
                    resolve({ data: campaigns, paging: response.paging });
                }
            });
        });
    }

    // Buscar insights/métricas (híbrido)
    async getInsights(objectId, dateRange = '30') {
        if (this.mode === 'demo') {
            return this.getDemoInsights(objectId);
        }
        return this.getRealInsights(objectId, dateRange);
    }

    getDemoInsights(objectId) {
        return new Promise(resolve => setTimeout(() => resolve({ data: [{
            impressions: Math.floor(Math.random() * 10000),
            clicks: Math.floor(Math.random() * 1000),
            spend: (Math.random() * 500).toFixed(2),
            actions: [{ action_type: 'purchase', value: Math.floor(Math.random() * 50) }]
        }]}), 400));
    }

    async getRealInsights(objectId, dateRange) {
        console.log(`[DEBUG] getRealInsights: Start for object ${objectId}`);
        if (!this.accessToken) throw new Error('Access token não encontrado.');

        const datePreset = `last_${dateRange}d`;

        return new Promise((resolve, reject) => {
            FB.api(`/${objectId}/insights`, {
                fields: 'impressions,clicks,spend,ctr,cpc,cpm,actions',
                date_preset: datePreset,
                access_token: this.accessToken
            }, (response) => {
                console.log(`[DEBUG] getRealInsights: /${objectId}/insights response:`, response);
                if (response.error) {
                    console.error('[DEBUG] getRealInsights: API Error', response.error);
                    reject(new Error(this.errorHandler.handleAPIError(response, 'getRealInsights')));
                } else {
                    resolve({ data: response.data || [] });
                }
            });
        });
    }
}

// Simple error handler
class APIErrorHandler {
    handleAPIError(response, context) {
        const error = response.error;
        console.error(`API Error in ${context}:`, error);
        
        if (error.code === 190) { // Auth errors
            // Should trigger re-login
            return `Token de acesso inválido ou expirado (cód ${error.code}). Por favor, faça login novamente.`;
        }
        if (error.code === 803) { // Permission errors
            return `Permissão negada para ${context} (cód ${error.code}). Verifique suas permissões no Business Manager.`;
        }
        if (error.code === 17) { // Rate limit
            return `Limite de chamadas da API atingido (cód ${error.code}). Tente novamente mais tarde.`;
        }
        
        return error.message || 'Erro desconhecido na API.';
    }
}

// Simple connection monitor
class ConnectionMonitor {
    isConnected() {
        return navigator.onLine;
    }
}

// Exportar classe para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetaAdsAPI;
} else if (typeof window !== 'undefined') {
    window.MetaAdsAPI = MetaAdsAPI;
}