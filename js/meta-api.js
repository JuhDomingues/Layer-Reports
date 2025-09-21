// Meta Ads Dashboard - Hybrid Mode (Demo + Real API)
class MetaAdsAPI {
    constructor() {
        // Detectar se está em HTTP e forçar modo demo
        const isHttps = window.location.protocol === 'https:';
        if (!isHttps) {
            console.warn('⚠️ HTTP detectado - Facebook SDK requer HTTPS. Forçando modo demo.');
            this.mode = 'demo';
        } else {
            this.mode = localStorage.getItem('api_mode') || 'demo'; // 'demo' or 'real'
        }
        
        // Initialize error handler and connection monitor
        this.errorHandler = new APIErrorHandler();
        this.connectionMonitor = new ConnectionMonitor();
        this.loginHelper = null; // Will be initialized when needed
        
        this.facebookAppId = localStorage.getItem('facebook_app_id') || '1469476877413511';
        this.fallbackAppId = '1091093523181393'; // Fallback App ID
        this.accessToken = localStorage.getItem('facebook_access_token');
        this.accountId = localStorage.getItem('facebook_account_id');
        this.isSDKLoaded = false;
        this.requiredPermissions = ['ads_read', 'ads_management', 'read_insights'];
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
        if (mode === 'real' && !this.isHttps) {
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
        if (this.isSDKLoaded) return Promise.resolve();
        
        // Verificar se está em HTTPS (melhorada detecção de produção)
        if (!this.isHttps && this.mode === 'real') {
            console.warn('⚠️ Facebook SDK requer HTTPS para modo real.');
            // Detecção melhorada de ambientes de produção
            const isProduction = window.location.hostname.includes('vercel.app') || 
                                 window.location.hostname.includes('layer-reports') ||
                                 window.location.hostname.includes('netlify.app') ||
                                 window.location.hostname.includes('github.io') ||
                                 window.location.protocol === 'https:';
            
            if (isProduction) {
                console.log('✅ Detectado ambiente de produção, permitindo SDK');
                this.isHttps = true;
            } else {
                return Promise.reject(new Error('Facebook SDK requer HTTPS em produção'));
            }
        }

        return new Promise((resolve, reject) => {
            window.fbAsyncInit = () => {
                try {
                    console.log('Initializing Facebook SDK with App ID:', this.facebookAppId);
                    FB.init({
                        appId: this.facebookAppId,
                        cookie: true,
                        xfbml: true,
                        version: 'v18.0',
                        status: true,
                        frictionlessRequests: true
                    });
                    this.isSDKLoaded = true;
                    console.log('Facebook SDK initialized successfully');
                    resolve();
                } catch (error) {
                    console.error('Error initializing Facebook SDK with primary App ID:', error);
                    // Try fallback App ID
                    try {
                        console.log('Trying fallback App ID:', this.fallbackAppId);
                        FB.init({
                            appId: this.fallbackAppId,
                            cookie: true,
                            xfbml: true,
                            version: 'v18.0',
                            status: true,
                            frictionlessRequests: true
                        });
                        this.facebookAppId = this.fallbackAppId;
                        this.isSDKLoaded = true;
                        console.log('Facebook SDK initialized with fallback App ID');
                        resolve();
                    } catch (fallbackError) {
                        console.error('Error with fallback App ID:', fallbackError);
                        reject(fallbackError);
                    }
                }
            };

            // Check if script already exists
            if (!document.getElementById('facebook-jssdk')) {
                console.log('Loading Facebook SDK...');
                const js = document.createElement('script');
                js.id = 'facebook-jssdk';
                js.src = "https://connect.facebook.net/pt_BR/sdk.js";
                js.onload = () => console.log('Facebook SDK script loaded');
                js.onerror = () => {
                    console.error('Failed to load Facebook SDK script');
                    reject(new Error('Failed to load Facebook SDK'));
                };
                document.head.appendChild(js);
            } else if (window.FB) {
                console.log('Facebook SDK already available, initializing...');
                window.fbAsyncInit();
            } else {
                console.log('Facebook SDK script exists but FB object not available yet');
                // Wait a bit for FB to be available
                setTimeout(() => {
                    if (window.FB) {
                        window.fbAsyncInit();
                    } else {
                        reject(new Error('Facebook SDK failed to load properly'));
                    }
                }, 2000);
            }
        });
    }

    // Login com Facebook
    async loginWithFacebook() {
        try {
            console.log('🔍 loginWithFacebook started');
            this.connectionStatus = 'connecting';
            
            // Check network connection first
            if (!this.connectionMonitor.isConnected()) {
                throw new Error('Sem conexão com a internet');
            }
            
            console.log('🔍 Initializing Facebook SDK...');
            await this.initFacebookSDK();
            
            if (!window.FB) {
                throw new Error('Facebook SDK não carregou corretamente');
            }
            
            console.log('🔍 Facebook SDK initialized, calling FB.login...');
            
            return new Promise((resolve, reject) => {
                console.log('🔍 Calling FB.login with permissions:', this.requiredPermissions);
                
                FB.login((response) => {
                    console.log('🔍 FB.login response:', response);
                    
                    // Check for user cancellation
                    if (!response || response.status === 'not_authorized') {
                        console.warn('❌ Login não autorizado ou cancelado');
                        resolve({
                            success: false,
                            message: 'Login cancelado ou não autorizado pelo usuário'
                        });
                        return;
                    }
                    
                    if (response.authResponse) {
                        this.accessToken = response.authResponse.accessToken;
                        this.tokenExpiresAt = Date.now() + (response.authResponse.expiresIn * 1000);
                        localStorage.setItem('facebook_access_token', this.accessToken);
                        localStorage.setItem('facebook_token_expires', this.tokenExpiresAt.toString());
                        
                        FB.api('/me', { fields: 'name,email,picture' }, (userResponse) => {
                            if (userResponse.error) {
                                this.connectionStatus = 'disconnected';
                                console.error('❌ Erro ao obter dados do usuário:', userResponse.error);
                                resolve({
                                    success: false,
                                    message: 'Erro ao obter dados do usuário: ' + userResponse.error.message
                                });
                            } else {
                                this.user = userResponse;
                                this.connectionStatus = 'connected';
                                console.log('✅ Login Facebook bem-sucedido:', userResponse.name);
                                
                                resolve({
                                    success: true,
                                    user: userResponse,
                                    accessToken: this.accessToken,
                                    expiresIn: response.authResponse.expiresIn
                                });
                            }
                        });
                    } else {
                        this.connectionStatus = 'disconnected';
                        console.warn('❌ Login cancelado pelo usuário');
                        resolve({
                            success: false,
                            message: 'Login cancelado ou não autorizado'
                        });
                    }
                }, { 
                    scope: this.requiredPermissions.join(','),
                    return_scopes: true 
                });
            });
        } catch (error) {
            this.connectionStatus = 'disconnected';
            console.error('❌ Erro na inicialização Facebook SDK:', error);
            
            // Retornar resultado em vez de throw para não quebrar o fluxo
            return {
                success: false,
                message: 'Erro ao inicializar Facebook SDK: ' + error.message
            };
        }
    }

    // Logout
    async logout() {
        this.connectionStatus = 'disconnected';
        this.user = null;
        
        if (this.isSDKLoaded && window.FB) {
            return new Promise((resolve) => {
                FB.logout(() => {
                    this.accessToken = null;
                    this.accountId = null;
                    localStorage.removeItem('facebook_access_token');
                    localStorage.removeItem('facebook_account_id');
                    resolve();
                });
            });
        } else {
            this.accessToken = null;
            this.accountId = null;
            localStorage.removeItem('facebook_access_token');
            localStorage.removeItem('facebook_account_id');
        }
    }

    // Autenticação (híbrida) com fallback inteligente
    async authenticate() {
        if (this.mode === 'demo') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        message: 'Modo Demo - Dados simulados',
                        user: {
                            id: 'demo_user',
                            name: 'Usuário Demo',
                            email: 'demo@empresa.com'
                        },
                        mode: 'demo'
                    });
                }, 500);
            });
        } else {
            return this.authenticateWithFallback();
        }
    }

    // Autenticação com múltiplas estratégias de fallback
    async authenticateWithFallback() {
        console.log('🔍 Starting authentication with fallback strategies...');
        
        // Strategy 1: Check if already logged in
        try {
            const existingStatus = await this.checkExistingLoginStatus();
            if (existingStatus.success) {
                console.log('✅ Using existing Facebook session');
                return existingStatus;
            }
        } catch (error) {
            console.warn('❌ Existing login check failed:', error.message);
        }

        // Strategy 2: Direct Facebook login with reduced timeout
        try {
            console.log('🔍 Attempting direct Facebook login...');
            const directResult = await this.loginWithFacebookDirect();
            if (directResult.success) {
                return directResult;
            }
        } catch (error) {
            console.warn('❌ Direct Facebook login failed:', error.message);
        }

        // Strategy 3: Alternative SDK initialization
        try {
            console.log('🔍 Trying alternative SDK initialization...');
            await this.reinitializeSDK();
            const alternativeResult = await this.loginWithFacebookDirect();
            if (alternativeResult.success) {
                return alternativeResult;
            }
        } catch (error) {
            console.warn('❌ Alternative SDK login failed:', error.message);
        }

        // Strategy 4: Fallback to demo mode with warning
        console.warn('⚠️ All authentication strategies failed, falling back to demo mode');
        return {
            success: false,
            message: 'Falha na autenticação Facebook. Usando modo demo temporariamente.',
            fallbackMode: 'demo'
        };
    }

    // Check existing login status
    async checkExistingLoginStatus() {
        if (!window.FB) {
            throw new Error('Facebook SDK not available');
        }

        return new Promise((resolve, reject) => {
            FB.getLoginStatus((response) => {
                console.log('🔍 Facebook login status:', response);
                
                if (response.status === 'connected' && response.authResponse) {
                    this.accessToken = response.authResponse.accessToken;
                    this.tokenExpiresAt = Date.now() + (response.authResponse.expiresIn * 1000);
                    this.connectionStatus = 'connected';
                    
                    // Get user info
                    FB.api('/me', { fields: 'name,email,picture' }, (userResponse) => {
                        if (userResponse.error) {
                            reject(new Error(userResponse.error.message));
                        } else {
                            this.user = userResponse;
                            localStorage.setItem('facebook_access_token', this.accessToken);
                            localStorage.setItem('facebook_token_expires', this.tokenExpiresAt.toString());
                            
                            resolve({
                                success: true,
                                user: userResponse,
                                accessToken: this.accessToken,
                                message: 'Sessão Facebook existente restaurada'
                            });
                        }
                    });
                } else {
                    reject(new Error('No existing Facebook session'));
                }
            });
        });
    }

    // Direct login with reduced complexity
    async loginWithFacebookDirect() {
        if (!window.FB) {
            throw new Error('Facebook SDK not available');
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Login timeout after 60 seconds'));
            }, 60000); // Reduced timeout

            FB.login((response) => {
                clearTimeout(timeout);
                console.log('🔍 FB.login direct response:', response);
                
                if (response.authResponse) {
                    this.accessToken = response.authResponse.accessToken;
                    this.tokenExpiresAt = Date.now() + (response.authResponse.expiresIn * 1000);
                    localStorage.setItem('facebook_access_token', this.accessToken);
                    localStorage.setItem('facebook_token_expires', this.tokenExpiresAt.toString());
                    
                    FB.api('/me', { fields: 'name,email,picture' }, (userResponse) => {
                        if (userResponse.error) {
                            this.connectionStatus = 'disconnected';
                            resolve({
                                success: false,
                                message: 'Erro ao obter dados do usuário: ' + userResponse.error.message
                            });
                        } else {
                            this.user = userResponse;
                            this.connectionStatus = 'connected';
                            resolve({
                                success: true,
                                user: userResponse,
                                accessToken: this.accessToken,
                                expiresIn: response.authResponse.expiresIn
                            });
                        }
                    });
                } else {
                    this.connectionStatus = 'disconnected';
                    resolve({
                        success: false,
                        message: 'Login cancelado ou não autorizado'
                    });
                }
            }, { 
                scope: this.requiredPermissions.join(','),
                return_scopes: true,
                auth_type: 'rerequest' // Force re-authentication
            });
        });
    }

    // Reinitialize SDK with alternative configuration
    async reinitializeSDK() {
        console.log('🔍 Reinitializing Facebook SDK...');
        
        // Clear existing SDK
        if (window.FB) {
            delete window.FB;
        }
        
        // Remove existing script
        const existingScript = document.getElementById('facebook-jssdk');
        if (existingScript) {
            existingScript.remove();
        }
        
        this.isSDKLoaded = false;
        
        // Try with fallback App ID
        const originalAppId = this.facebookAppId;
        this.facebookAppId = this.fallbackAppId;
        
        try {
            await this.initFacebookSDK();
            console.log('✅ SDK reinitialized with fallback App ID');
        } catch (error) {
            // Restore original App ID if fallback fails
            this.facebookAppId = originalAppId;
            throw error;
        }
    }

    // Buscar contas de anúncio (híbrido)
    async getAdAccounts() {
        if (this.mode === 'demo') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        data: [
                            {
                                id: 'act_4030832237237833',
                                name: 'Layer Reports - Conta USD',
                                account_status: 1,
                                currency: 'USD',
                                timezone_name: 'America/New_York',
                                business: {
                                    id: '177341406299126',
                                    name: 'Dr. Santiago Vecina'
                                }
                            },
                            {
                                id: 'act_demo_layer_brl',
                                name: 'Layer Reports - Conta BRL',
                                account_status: 1,
                                currency: 'BRL',
                                timezone_name: 'America/Sao_Paulo',
                                business: {
                                    id: '177341406299126',
                                    name: 'Dr. Santiago Vecina'
                                }
                            },
                            {
                                id: 'act_demo_123456789',
                                name: 'Conta Demo Genérica',
                                account_status: 1,
                                currency: 'BRL',
                                timezone_name: 'America/Sao_Paulo',
                                business: {
                                    id: 'demo_bm_1',
                                    name: 'Business Manager Demo 1'
                                }
                            }
                        ]
                    });
                }, 500);
            });
        } else {
            return this.getRealAdAccounts();
        }
    }

    // Buscar contas reais via API
    async getRealAdAccounts() {
        if (!this.accessToken) {
            throw new Error('Access token não encontrado. Faça login primeiro.');
        }

        if (this.isTokenExpired()) {
            throw new Error('Token expirado. Faça login novamente.');
        }

        this.checkRateLimit();

        return new Promise((resolve, reject) => {
            FB.api('/me/adaccounts', { 
                fields: 'id,name,account_status,currency,timezone_name',
                access_token: this.accessToken 
            }, (response) => {
                if (response.error) {
                    const errorMessage = this.errorHandler.handleAPIError(response, 'getRealAdAccounts');
                    if (response.error.code === 190) { // Invalid token
                        this.logout();
                    }
                    reject(new Error(errorMessage));
                } else {
                    resolve({
                        data: response.data || []
                    });
                }
            });
        });
    }

    // Buscar contas de anúncio para um Business Manager específico
    async getAccountsForBusinessManager(businessManagerId) {
        console.log('🔍 getAccountsForBusinessManager called with:', businessManagerId);
        
        if (this.mode === 'demo') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Contas específicas para o BM 177341406299126
                    let demoAccounts = [];
                    
                    if (businessManagerId === '177341406299126') {
                        demoAccounts = [
                            {
                                id: 'act_4030832237237833',
                                name: 'Layer Reports - Conta USD',
                                account_status: 1,
                                currency: 'USD',
                                timezone_name: 'America/New_York',
                                business: {
                                    id: '177341406299126',
                                    name: 'Dr. Santiago Vecina'
                                }
                            },
                            {
                                id: 'act_demo_layer_brl',
                                name: 'Layer Reports - Conta BRL',
                                account_status: 1,
                                currency: 'BRL',
                                timezone_name: 'America/Sao_Paulo',
                                business: {
                                    id: '177341406299126',
                                    name: 'Dr. Santiago Vecina'
                                }
                            }
                        ];
                    } else {
                        // Contas demo genéricas para outros BMs
                        demoAccounts = [
                            {
                                id: 'act_demo_123456789',
                                name: 'Conta Demo BM - Reais',
                                account_status: 1,
                                currency: 'BRL',
                                timezone_name: 'America/Sao_Paulo',
                                business: {
                                    id: businessManagerId,
                                    name: 'Business Manager Demo'
                                }
                            },
                            {
                                id: 'act_demo_usd_generic',
                                name: 'Conta Demo BM - Dólares',
                                account_status: 1,
                                currency: 'USD',
                                timezone_name: 'America/New_York',
                                business: {
                                    id: businessManagerId,
                                    name: 'Business Manager Demo'
                                }
                            }
                        ];
                    }
                    
                    console.log(`🔍 Demo accounts for BM ${businessManagerId}:`, demoAccounts);
                    
                    resolve({
                        data: demoAccounts
                    });
                }, 500);
            });
        } else {
            return this.getRealAccountsForBusinessManager(businessManagerId);
        }
    }

    // Buscar contas reais para um Business Manager específico
    async getRealAccountsForBusinessManager(businessManagerId) {
        console.log('🔍 getRealAccountsForBusinessManager called with:', businessManagerId);
        
        if (!this.accessToken) {
            throw new Error('Access token não encontrado. Faça login primeiro.');
        }

        // Tentar múltiplas abordagens para acessar as contas APENAS do Business Manager específico
        const approaches = [
            // Método 1: Direto do Business Manager (preferido)
            {
                endpoint: `/${businessManagerId}/adaccounts`,
                fields: 'id,name,account_status,currency,timezone_name,business',
                description: 'Business Manager direto',
                filterByBM: false // Já vem filtrado
            },
            // Método 2: Business Manager com campos mínimos
            {
                endpoint: `/${businessManagerId}/adaccounts`,
                fields: 'id,name,currency,account_status',
                description: 'Business Manager com campos básicos',
                filterByBM: false // Já vem filtrado
            },
            // Método 3: Através do /me/adaccounts e filtrar rigorosamente
            {
                endpoint: '/me/adaccounts',
                fields: 'id,name,account_status,currency,timezone_name,business',
                description: 'Filtrar contas por Business Manager',
                filterByBM: true // Precisa filtrar
            }
        ];

        for (const approach of approaches) {
            try {
                console.log(`🔍 Tentando abordagem: ${approach.description}`);
                
                const result = await new Promise((resolve, reject) => {
                    FB.api(approach.endpoint, {
                        fields: approach.fields,
                        access_token: this.accessToken,
                        limit: 100
                    }, (response) => {
                        console.log(`🔍 Response for ${approach.description}:`, response);
                        
                        if (response.error) {
                            console.warn(`🔍 Error with ${approach.description}:`, response.error);
                            reject(new Error(response.error.message));
                        } else {
                            let accounts = response.data || [];
                            console.log(`🔍 Raw accounts from ${approach.description}:`, accounts.length);
                            
                            // Filtrar SEMPRE para garantir que são apenas do Business Manager específico
                            if (approach.filterByBM || approach.endpoint === '/me/adaccounts') {
                                console.log(`🔍 Aplicando filtro para Business Manager: ${businessManagerId}`);
                                
                                // Múltiplas estratégias de filtragem
                                const originalCount = accounts.length;
                                
                                // Estratégia 1: Filtrar por business.id
                                accounts = accounts.filter(account => {
                                    if (account.business && account.business.id) {
                                        return account.business.id === businessManagerId;
                                    }
                                    return false;
                                });
                                
                                console.log(`🔍 Após filtro business.id: ${accounts.length} de ${originalCount}`);
                                
                                // Se não encontrou nenhuma, tentar filtro mais amplo
                                if (accounts.length === 0 && response.data.length > 0) {
                                    console.log(`🔍 Tentando filtro alternativo...`);
                                    accounts = response.data.filter(account => {
                                        // Verificar se o account.id contém parte do businessManagerId
                                        // ou outras heurísticas
                                        return account.business && 
                                               (account.business.id === businessManagerId ||
                                                account.business.name?.includes(businessManagerId));
                                    });
                                    console.log(`🔍 Após filtro alternativo: ${accounts.length}`);
                                }
                            }
                            
                            console.log(`🔍 Final filtered accounts for BM ${businessManagerId}: ${accounts.length}`);
                            
                            resolve({
                                data: accounts,
                                paging: response.paging || null,
                                method: approach.description,
                                businessManagerId: businessManagerId
                            });
                        }
                    });
                });

                // Se chegou aqui, deu certo
                console.log(`✅ Sucesso com: ${result.method}`);
                return result;

            } catch (error) {
                console.warn(`❌ Falhou com ${approach.description}:`, error.message);
                continue; // Tenta próxima abordagem
            }
        }

        // Se chegou aqui, todas as abordagens falharam
        // Para BMs específicos conhecidos, tentar estratégias adicionais
        if (businessManagerId === '177341406299126') {
            console.log('🔍 Tentando estratégias específicas para BM 177341406299126...');
            
            try {
                // Estratégia especial: buscar todas as contas e filtrar pela conta USD específica
                const allAccountsResult = await new Promise((resolve, reject) => {
                    FB.api('/me/adaccounts', {
                        fields: 'id,name,account_status,currency,timezone_name,business',
                        access_token: this.accessToken,
                        limit: 200 // Aumentar limite para pegar mais contas
                    }, (response) => {
                        if (response.error) {
                            reject(new Error(response.error.message));
                        } else {
                            resolve(response);
                        }
                    });
                });
                
                console.log('🔍 Todas as contas encontradas:', allAccountsResult.data?.length || 0);
                
                // Filtrar contas que podem pertencer ao BM 177341406299126
                let filteredAccounts = allAccountsResult.data?.filter(account => {
                    // Filtro 1: Business Manager ID específico
                    if (account.business && account.business.id === businessManagerId) {
                        return true;
                    }
                    
                    // Filtro 2: Conta USD específica que sabemos que existe
                    if (account.id.includes('4030832237237833')) {
                        console.log('🎯 Encontrou conta USD específica:', account.name);
                        return true;
                    }
                    
                    // Filtro 3: Outras heurísticas baseadas no nome ou características
                    if (account.business && account.business.name && 
                        (account.business.name.toLowerCase().includes('layer') ||
                         account.business.name.toLowerCase().includes('177341406299126'))) {
                        return true;
                    }
                    
                    return false;
                }) || [];
                
                console.log('🔍 Contas filtradas para BM 177341406299126:', filteredAccounts.length);
                
                if (filteredAccounts.length > 0) {
                    return {
                        data: filteredAccounts,
                        paging: allAccountsResult.paging || null,
                        method: 'Filtro específico para BM 177341406299126',
                        businessManagerId: businessManagerId
                    };
                }
            } catch (specialError) {
                console.warn('🔍 Estratégia especial falhou:', specialError.message);
            }
        }
        
        throw new Error(`Não foi possível acessar as contas do Business Manager ${businessManagerId}. Verifique suas permissões ou tente usar "Todas as contas".`);
    }

    // Buscar campanhas (híbrido)
    async getCampaigns(accountId, dateRange = '30', status = null) {
        if (this.mode === 'demo') {
            return this.getDemoCampaigns();
        } else {
            return this.getRealCampaigns(accountId, status);
        }
    }

    // Campanhas demo
    getDemoCampaigns() {
        return new Promise((resolve) => {
            setTimeout(() => {
                const campaigns = [
                    {
                        id: 'demo_campaign_1',
                        name: 'Campanha Demo - Black Friday',
                        status: 'ACTIVE',
                        objective: 'CONVERSIONS',
                        created_time: '2024-01-15T10:30:00+0000',
                        updated_time: '2024-01-20T15:45:00+0000',
                        daily_budget: '10000',
                        lifetime_budget: null,
                        bid_strategy: 'LOWEST_COST_WITHOUT_CAP'
                    },
                    {
                        id: 'demo_campaign_2',
                        name: 'Campanha Demo - Holiday',
                        status: 'ACTIVE',
                        objective: 'TRAFFIC',
                        created_time: '2024-01-10T08:20:00+0000',
                        updated_time: '2024-01-22T12:30:00+0000',
                        daily_budget: '8000',
                        lifetime_budget: null,
                        bid_strategy: 'LOWEST_COST_WITHOUT_CAP'
                    },
                    {
                        id: 'demo_campaign_3',
                        name: 'Campanha Demo - Retargeting',
                        status: 'PAUSED',
                        objective: 'BRAND_AWARENESS',
                        created_time: '2024-01-05T14:15:00+0000',
                        updated_time: '2024-01-18T09:45:00+0000',
                        daily_budget: '5000',
                        lifetime_budget: null,
                        bid_strategy: 'LOWEST_COST_WITHOUT_CAP'
                    }
                ];

                resolve({
                    data: campaigns,
                    paging: {
                        cursors: {
                            before: 'demo_before',
                            after: 'demo_after'
                        },
                        next: null
                    }
                });
            }, 800);
        });
    }

    // Campanhas reais via API
    async getRealCampaigns(accountId, status = null) {
        console.log('🔍 getRealCampaigns called with:', { accountId, status, accessToken: !!this.accessToken });
        
        if (!this.accessToken) {
            console.error('🔍 Access token não encontrado');
            throw new Error('Access token não encontrado');
        }

        if (!accountId) {
            console.error('🔍 Account ID não fornecido');
            throw new Error('Account ID é obrigatório');
        }

        return new Promise((resolve, reject) => {
            console.log('🔍 Making FB.api call to:', `/${accountId}/campaigns`);
            
            FB.api(`/${accountId}/campaigns`, {
                fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,bid_strategy,effective_status',
                access_token: this.accessToken,
                limit: 100
            }, (response) => {
                console.log('🔍 FB.api response received:', response);
                
                if (!response) {
                    console.error('🔍 Response é null/undefined');
                    reject(new Error('Resposta da API está vazia ou inválida'));
                    return;
                }
                
                if (response.error) {
                    console.error('🔍 API Error:', response.error);
                    reject(new Error(response.error.message || 'Erro desconhecido da API'));
                    return;
                }
                
                // Validação mais robusta da estrutura de dados
                const campaigns = Array.isArray(response.data) ? response.data : [];
                console.log('🔍 Campaigns found:', campaigns.length);
                
                // Apply status filter client-side if specified
                let filteredCampaigns = campaigns;
                if (status && status !== 'all') {
                    const targetStatus = status.toUpperCase();
                    filteredCampaigns = campaigns.filter(c => {
                        const campaignStatus = c.status || c.effective_status;
                        return campaignStatus === targetStatus;
                    });
                    console.log('🔍 Campaigns after status filter:', filteredCampaigns.length);
                }
                
                const result = {
                    data: filteredCampaigns,
                    paging: response.paging || null
                };
                
                console.log('🔍 Final result structure:', {
                    dataLength: result.data.length,
                    hasPaging: !!result.paging
                });
                
                resolve(result);
            });
        });
    }

    // Buscar insights/métricas (modo demo)
    async getInsights(objectId, objectType = 'campaign', dateRange = '30', metrics = []) {
        const defaultMetrics = [
            'impressions',
            'clicks',
            'ctr',
            'cpc',
            'cpm',
            'spend',
            'actions'
        ];

        if (this.mode === 'demo') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const insightsData = this.generateMockInsights(objectId, defaultMetrics, dateRange);
                    resolve({
                        data: insightsData,
                        paging: {
                            cursors: {
                                before: 'demo_before',
                                after: 'demo_after'
                            }
                        }
                    });
                }, 600);
            });
        } else {
            return this.getRealInsights(objectId, objectType, dateRange, metrics.length > 0 ? metrics : defaultMetrics);
        }
    }

    // Buscar insights reais via API
    async getRealInsights(objectId, objectType = 'campaign', dateRange = '30', metrics = []) {
        console.log('🔍 getRealInsights called with:', { objectId, objectType, dateRange, metrics });
        
        if (!this.accessToken) {
            throw new Error('Access token não encontrado');
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(dateRange));
        
        const dateRange_start = startDate.toISOString().split('T')[0];
        const dateRange_end = endDate.toISOString().split('T')[0];

        return new Promise((resolve, reject) => {
            console.log('🔍 Making FB.api call for insights:', `/${objectId}/insights`);
            
            FB.api(`/${objectId}/insights`, {
                fields: metrics.join(','),
                access_token: this.accessToken,
                time_range: JSON.stringify({
                    since: dateRange_start,
                    until: dateRange_end
                }),
                time_increment: 1, // Daily breakdown
                limit: 100
            }, (response) => {
                console.log('🔍 Insights API response:', response);
                
                if (!response) {
                    console.error('🔍 Insights response é null/undefined');
                    reject(new Error('Resposta de insights vazia ou inválida'));
                    return;
                }
                
                if (response.error) {
                    console.error('🔍 Insights API error:', response.error);
                    reject(new Error(response.error.message || 'Erro ao buscar insights'));
                    return;
                }
                
                const insights = Array.isArray(response.data) ? response.data : [];
                console.log('🔍 Insights found:', insights.length);
                
                resolve({
                    data: insights,
                    paging: response.paging || null
                });
            });
        });
    }

    // Gerar dados simulados de insights
    generateMockInsights(objectId, metrics, dateRange) {
        const days = parseInt(dateRange);
        const insights = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            const baseImpressions = 8000 + Math.random() * 12000;
            const ctr = 0.015 + Math.random() * 0.025;
            const clicks = Math.floor(baseImpressions * ctr);
            const cpc = 0.5 + Math.random() * 1.5;
            const spend = clicks * cpc;
            const cpm = (spend / baseImpressions) * 1000;

            const insight = {
                date_start: dateString,
                date_stop: dateString,
                impressions: Math.floor(baseImpressions).toString(),
                clicks: clicks.toString(),
                ctr: (ctr * 100).toFixed(4),
                cpc: cpc.toFixed(4),
                cpm: cpm.toFixed(4),
                spend: spend.toFixed(2),
                actions: this.generateActions()
            };

            insights.push(insight);
        }

        return insights;
    }

    // Gerar dados de ações/conversões simuladas
    generateActions() {
        const actionTypes = [
            'post_engagement',
            'page_engagement',
            'link_click',
            'offsite_conversion.fb_pixel_purchase',
            'offsite_conversion.fb_pixel_add_to_cart',
            'offsite_conversion.fb_pixel_view_content'
        ];

        return actionTypes.map(actionType => ({
            action_type: actionType,
            value: Math.floor(Math.random() * 100 + 10).toString()
        }));
    }

    // Buscar audiências personalizadas (modo demo)
    async getCustomAudiences(accountId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: [
                        {
                            id: 'demo_audience_1',
                            name: 'Website Visitors - Demo',
                            description: 'Visitantes do site (simulado)',
                            approximate_count: 15420,
                            data_source: {
                                type: 'WEBSITE'
                            }
                        },
                        {
                            id: 'demo_audience_2',
                            name: 'Email Subscribers - Demo',
                            description: 'Lista de emails (simulado)',
                            approximate_count: 8750,
                            data_source: {
                                type: 'USER_PROVIDED_ONLY'
                            }
                        }
                    ]
                });
            }, 400);
        });
    }

    // Teste de conexão
    async testConnection() {
        if (this.mode === 'demo') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        message: 'Modo Demo - Funcionando perfeitamente',
                        demo: true
                    });
                }, 300);
            });
        } else {
            try {
                await this.initFacebookSDK();
                return {
                    success: true,
                    message: 'Facebook SDK carregado com sucesso',
                    demo: false,
                    appId: this.facebookAppId
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Erro ao carregar Facebook SDK: ' + error.message,
                    demo: false
                };
            }
        }
    }

    // Verificar permissões do usuário
    async checkPermissions() {
        if (!this.accessToken || this.mode === 'demo') {
            return { success: false, message: 'Não autenticado' };
        }

        return new Promise((resolve) => {
            FB.api('/me/permissions', { access_token: this.accessToken }, (response) => {
                if (response.error) {
                    resolve({
                        success: false,
                        message: response.error.message
                    });
                } else {
                    const grantedPermissions = response.data
                        .filter(perm => perm.status === 'granted')
                        .map(perm => perm.permission);
                    
                    const hasAllPermissions = this.requiredPermissions.every(
                        perm => grantedPermissions.includes(perm)
                    );

                    resolve({
                        success: hasAllPermissions,
                        permissions: grantedPermissions,
                        missing: this.requiredPermissions.filter(
                            perm => !grantedPermissions.includes(perm)
                        )
                    });
                }
            });
        });
    }

    // Buscar Business Managers do usuário
    async getBusinessManagers() {
        if (this.mode === 'demo') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        data: [
                            {
                                id: '177341406299126',
                                name: 'Dr. Santiago Vecina',
                                created_time: '2023-01-15T10:30:00+0000'
                            },
                            {
                                id: 'demo_bm_1',
                                name: 'Business Manager Demo 1',
                                created_time: '2023-01-15T10:30:00+0000'
                            },
                            {
                                id: 'demo_bm_2', 
                                name: 'Business Manager Demo 2',
                                created_time: '2023-06-20T14:20:00+0000'
                            }
                        ]
                    });
                }, 500);
            });
        } else {
            return this.getRealBusinessManagers();
        }
    }

    async getRealBusinessManagers() {
        if (!this.accessToken) {
            throw new Error('Access token não encontrado');
        }

        // Try multiple endpoints to get Business Managers
        const endpoints = [
            {
                endpoint: '/me/businesses',
                fields: 'id,name,created_time,timezone_id'
            },
            {
                endpoint: '/me/owned_businesses',
                fields: 'id,name,created_time,timezone_id'
            },
            {
                endpoint: '/me/client_businesses',
                fields: 'id,name,created_time,timezone_id'
            }
        ];

        const allBusinessManagers = [];
        const bmIds = new Set(); // Para evitar duplicatas

        for (const config of endpoints) {
            try {
                const response = await new Promise((resolve, reject) => {
                    FB.api(config.endpoint, {
                        fields: config.fields,
                        access_token: this.accessToken
                    }, (response) => {
                        if (response.error) {
                            console.warn(`Error fetching from ${config.endpoint}:`, response.error);
                            resolve({ data: [] });
                        } else {
                            resolve(response);
                        }
                    });
                });

                if (response.data && response.data.length > 0) {
                    response.data.forEach(bm => {
                        if (!bmIds.has(bm.id)) {
                            bmIds.add(bm.id);
                            allBusinessManagers.push(bm);
                        }
                    });
                }
            } catch (error) {
                console.warn(`Failed to fetch from ${config.endpoint}:`, error);
            }
        }

        console.log('Found Business Managers:', allBusinessManagers);
        
        // Try to fetch specific BM if it's not in the list
        const targetBMId = '177341406299126';
        if (!bmIds.has(targetBMId)) {
            try {
                console.log(`Trying to fetch specific BM: ${targetBMId}`);
                const specificBM = await this.getSpecificBusinessManager(targetBMId);
                if (specificBM) {
                    allBusinessManagers.push(specificBM);
                }
            } catch (error) {
                console.warn(`Could not fetch specific BM ${targetBMId}:`, error);
            }
        }
        
        return {
            data: allBusinessManagers
        };
    }

    // Buscar Business Manager específico
    async getSpecificBusinessManager(businessManagerId) {
        if (!this.accessToken) {
            throw new Error('Access token não encontrado');
        }

        return new Promise((resolve, reject) => {
            FB.api(`/${businessManagerId}`, {
                fields: 'id,name,created_time,timezone_id',
                access_token: this.accessToken
            }, (response) => {
                if (response.error) {
                    console.warn(`Error fetching BM ${businessManagerId}:`, response.error);
                    resolve(null);
                } else {
                    console.log(`Successfully fetched BM ${businessManagerId}:`, response);
                    resolve(response);
                }
            });
        });
    }

    // Buscar contas por Business Manager
    async getAccountsByBusinessManager(businessManagerId) {
        if (this.mode === 'demo') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        data: [
                            {
                                id: 'act_demo_bm1_acc1',
                                name: 'Conta Demo BM1 - Ecommerce',
                                account_status: 1,
                                currency: 'BRL',
                                business: { id: businessManagerId }
                            },
                            {
                                id: 'act_demo_bm1_acc2',
                                name: 'Conta Demo BM1 - Leads',
                                account_status: 1,
                                currency: 'BRL',
                                business: { id: businessManagerId }
                            }
                        ]
                    });
                }, 400);
            });
        } else {
            return this.getRealAccountsByBusinessManager(businessManagerId);
        }
    }

    async getRealAccountsByBusinessManager(businessManagerId) {
        if (!this.accessToken) {
            throw new Error('Access token não encontrado');
        }

        // Try multiple endpoints to get accounts from Business Manager
        const endpoints = [
            `/${businessManagerId}/owned_ad_accounts`,
            `/${businessManagerId}/client_ad_accounts`,
            `/${businessManagerId}/ad_accounts`
        ];

        const allAccounts = [];
        const accountIds = new Set(); // Para evitar duplicatas

        for (const endpoint of endpoints) {
            try {
                const response = await new Promise((resolve, reject) => {
                    FB.api(endpoint, {
                        fields: 'id,name,account_status,currency,business,timezone_name',
                        access_token: this.accessToken
                    }, (response) => {
                        if (response.error) {
                            console.warn(`Error fetching from ${endpoint}:`, response.error);
                            resolve({ data: [] });
                        } else {
                            resolve(response);
                        }
                    });
                });

                if (response.data && response.data.length > 0) {
                    response.data.forEach(account => {
                        if (!accountIds.has(account.id)) {
                            accountIds.add(account.id);
                            allAccounts.push(account);
                        }
                    });
                }
            } catch (error) {
                console.warn(`Failed to fetch from ${endpoint}:`, error);
            }
        }

        console.log(`Found accounts for BM ${businessManagerId}:`, allAccounts);
        
        return {
            data: allAccounts
        };
    }

    // Buscar campanhas com filtros avançados
    async getCampaignsWithFilters(accountId, filters = {}) {
        console.log('🔍 getCampaignsWithFilters called with:', { accountId, filters, mode: this.mode });
        
        if (this.mode === 'demo') {
            console.log('🔍 Using demo mode');
            const result = await this.getFilteredDemoCampaigns(filters);
            console.log('🔍 Demo campaigns result:', result);
            return result;
        } else {
            console.log('🔍 Using real API mode');
            const result = await this.getRealCampaignsWithFilters(accountId, filters);
            console.log('🔍 Real campaigns result:', result);
            return result;
        }
    }

    getFilteredDemoCampaigns(filters) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let campaigns = [
                    {
                        id: 'demo_campaign_1',
                        name: 'Black Friday Sale 2024',
                        status: 'ACTIVE',
                        objective: 'CONVERSIONS',
                        created_time: '2024-01-15T10:30:00+0000',
                        updated_time: '2024-01-20T15:45:00+0000'
                    },
                    {
                        id: 'demo_campaign_2',
                        name: 'Holiday Collection',
                        status: 'ACTIVE',
                        objective: 'TRAFFIC',
                        created_time: '2024-01-10T08:20:00+0000',
                        updated_time: '2024-01-22T12:30:00+0000'
                    },
                    {
                        id: 'demo_campaign_3',
                        name: 'Summer Campaign',
                        status: 'PAUSED',
                        objective: 'BRAND_AWARENESS',
                        created_time: '2024-01-05T14:15:00+0000',
                        updated_time: '2024-01-18T09:45:00+0000'
                    },
                    {
                        id: 'demo_campaign_4',
                        name: 'Lead Generation Q1',
                        status: 'ACTIVE',
                        objective: 'LEAD_GENERATION',
                        created_time: '2024-02-01T09:00:00+0000',
                        updated_time: '2024-02-15T16:30:00+0000'
                    }
                ];

                // Apply filters
                if (filters.status && filters.status.length > 0) {
                    campaigns = campaigns.filter(c => filters.status.includes(c.status));
                }

                if (filters.objective && filters.objective.length > 0) {
                    campaigns = campaigns.filter(c => filters.objective.includes(c.objective));
                }

                if (filters.name) {
                    const searchTerm = filters.name.toLowerCase();
                    campaigns = campaigns.filter(c => 
                        filters.exactMatch ? 
                        c.name.toLowerCase() === searchTerm :
                        c.name.toLowerCase().includes(searchTerm)
                    );
                }

                if (filters.createdAfter) {
                    const afterDate = new Date(filters.createdAfter);
                    campaigns = campaigns.filter(c => new Date(c.created_time) >= afterDate);
                }

                if (filters.createdBefore) {
                    const beforeDate = new Date(filters.createdBefore);
                    campaigns = campaigns.filter(c => new Date(c.created_time) <= beforeDate);
                }

                resolve({
                    data: campaigns,
                    paging: {
                        cursors: {
                            before: 'demo_before',
                            after: 'demo_after'
                        }
                    }
                });
            }, 800);
        });
    }

    async getRealCampaignsWithFilters(accountId, filters) {
        console.log('🔍 getRealCampaignsWithFilters called:', { accountId, filters });
        
        if (!this.accessToken) {
            console.error('🔍 No access token found');
            throw new Error('Access token não encontrado');
        }

        // Build filtering parameters - only use supported fields
        let filterParams = [];
        
        // Note: 'status' and 'objective' are not supported in filtering
        // We'll fetch all campaigns and filter client-side
        
        if (filters.createdAfter) {
            filterParams.push({
                field: 'created_time',
                operator: 'GREATER_THAN',
                value: filters.createdAfter
            });
        }

        if (filters.createdBefore) {
            filterParams.push({
                field: 'created_time',
                operator: 'LESS_THAN',
                value: filters.createdBefore
            });
        }

        let apiParams = {
            fields: 'id,name,status,objective,created_time,updated_time,daily_budget,lifetime_budget,effective_status',
            access_token: this.accessToken,
            limit: 100 // Increase limit to get more campaigns
        };

        if (filterParams.length > 0) {
            apiParams.filtering = JSON.stringify(filterParams);
        }

        console.log('🔍 API call params:', apiParams);
        console.log('🔍 Calling FB.api for campaigns...');

        return new Promise((resolve, reject) => {
            FB.api(`/${accountId}/campaigns`, apiParams, (response) => {
                console.log('🔍 FB.api response received:', response);
                
                // Validação mais robusta da resposta
                if (!response) {
                    console.error('🔍 Response é null/undefined');
                    reject(new Error('Resposta da API está vazia ou inválida'));
                    return;
                }
                
                if (response.error) {
                    console.error('🔍 FB.api error:', response.error);
                    reject(new Error(response.error.message || 'Erro desconhecido da API'));
                    return;
                }
                
                // Garantir que response.data existe e é um array
                let campaigns = Array.isArray(response.data) ? response.data : [];
                console.log('🔍 Raw campaigns from API:', campaigns);

                // Apply client-side filters
                if (filters.status && filters.status.length > 0) {
                    console.log('🔍 Applying status filter:', filters.status);
                    campaigns = campaigns.filter(c => {
                        // Check both 'status' and 'effective_status'
                        const campaignStatus = c.status || c.effective_status;
                        return filters.status.includes(campaignStatus);
                    });
                }

                if (filters.objective && filters.objective.length > 0) {
                    console.log('🔍 Applying objective filter:', filters.objective);
                    campaigns = campaigns.filter(c => filters.objective.includes(c.objective));
                }

                if (filters.name) {
                    console.log('🔍 Applying name filter:', filters.name);
                    const searchTerm = filters.name.toLowerCase();
                    campaigns = campaigns.filter(c => 
                        filters.exactMatch ? 
                        c.name.toLowerCase() === searchTerm :
                        c.name.toLowerCase().includes(searchTerm)
                    );
                }

                console.log('🔍 Filtered campaigns:', campaigns);

                const result = {
                    data: campaigns,
                    paging: response.paging || null
                };
                
                console.log('🔍 Final result to return:', result);
                resolve(result);
            });
        });
    }
}

// Exportar classe para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetaAdsAPI;
} else if (typeof window !== 'undefined') {
    window.MetaAdsAPI = MetaAdsAPI;
}