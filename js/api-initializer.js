// Inicializador da API Real - Garante configuração correta
(function() {
    'use strict';
    
    console.log('🚀 === INICIALIZADOR DA API REAL ===');
    
    // Configurações da aplicação
    const CONFIG = {
        APP_ID: '778309504913999',
        REQUIRED_PERMISSIONS: ['ads_read', 'ads_management', 'read_insights', 'business_management'],
        SDK_VERSION: 'v18.0',
        LOCALE: 'pt_BR'
    };
    
    // Detectar ambiente
    const ENVIRONMENT = {
        isHttps: window.location.protocol === 'https:',
        isLocalhost: ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname),
        domain: window.location.origin,
        userAgent: navigator.userAgent
    };
    
    console.log('🔍 Ambiente detectado:', ENVIRONMENT);
    
    // Verificar se pode usar API real
    const canUseRealAPI = ENVIRONMENT.isHttps || ENVIRONMENT.isLocalhost;
    console.log(`📱 API Real disponível: ${canUseRealAPI ? '✅' : '❌'}`);
    
    if (!canUseRealAPI) {
        console.warn('⚠️ Facebook SDK requer HTTPS ou localhost');
        console.log('💡 Para usar API real:');
        console.log('   - Acesse via https://');
        console.log('   - Ou use http://localhost:8000');
        return;
    }
    
    // Aguardar carregamento do DOM
    function initializeWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
        } else {
            initialize();
        }
    }
    
    function initialize() {
        console.log('🔧 Inicializando configurações...');
        
        // Garantir que o localStorage está configurado corretamente
        if (!localStorage.getItem('facebook_app_id')) {
            localStorage.setItem('facebook_app_id', CONFIG.APP_ID);
            console.log('✅ App ID configurado no localStorage');
        }
        
        // Verificar se o modo real está disponível
        const currentMode = localStorage.getItem('api_mode') || 'demo';
        console.log(`🎭 Modo atual: ${currentMode}`);
        
        // Configurar interceptador para FB SDK
        setupFacebookSDKInterceptor();
        
        // Aguardar carregamento da aplicação principal
        waitForMainApp();
    }
    
    function setupFacebookSDKInterceptor() {
        console.log('🔌 Configurando interceptador do Facebook SDK...');
        
        // Interceptar fbAsyncInit para garantir configuração correta
        const originalFbAsyncInit = window.fbAsyncInit;
        
        window.fbAsyncInit = function() {
            console.log('📡 Facebook SDK inicializando...');
            
            try {
                FB.init({
                    appId: CONFIG.APP_ID,
                    cookie: true,
                    xfbml: true,
                    version: CONFIG.SDK_VERSION,
                    status: true // Verificar status de login automaticamente
                });
                
                console.log('✅ Facebook SDK inicializado com sucesso');
                console.log(`   🆔 App ID: ${CONFIG.APP_ID}`);
                console.log(`   📦 Versão: ${CONFIG.SDK_VERSION}`);
                
                // Verificar status de login imediatamente
                FB.getLoginStatus(function(response) {
                    console.log('🔍 Status de login verificado:', response.status);
                    
                    if (response.status === 'connected') {
                        console.log('🔑 Usuário já conectado!');
                        // Notificar a aplicação principal se disponível
                        if (window.metaAdsApp) {
                            window.metaAdsApp.isAuthenticated = true;
                            window.metaAdsApp.api.accessToken = response.authResponse.accessToken;
                            window.metaAdsApp.api.connectionStatus = 'connected';
                        }
                    }
                });
                
                // Chamar fbAsyncInit original se existir
                if (originalFbAsyncInit && typeof originalFbAsyncInit === 'function') {
                    originalFbAsyncInit();
                }
                
            } catch (error) {
                console.error('❌ Erro ao inicializar Facebook SDK:', error);
            }
        };
    }
    
    function waitForMainApp() {
        console.log('⏳ Aguardando carregamento da aplicação principal...');
        
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos
        
        const checkApp = setInterval(() => {
            attempts++;
            
            if (window.metaAdsApp && window.metaAdsApp.api) {
                console.log('✅ Aplicação principal carregada!');
                clearInterval(checkApp);
                configureMainApp();
            } else if (attempts >= maxAttempts) {
                console.warn('⚠️ Timeout aguardando aplicação principal');
                clearInterval(checkApp);
            }
        }, 100);
    }
    
    function configureMainApp() {
        console.log('⚙️ Configurando aplicação principal...');
        
        const app = window.metaAdsApp;
        const api = app.api;
        
        // Garantir configurações corretas
        api.facebookAppId = CONFIG.APP_ID;
        api.requiredPermissions = CONFIG.REQUIRED_PERMISSIONS;
        
        console.log('✅ Configurações aplicadas');
        
        // Adicionar listeners para mudança de modo
        const apiModeSelect = document.getElementById('apiMode');
        if (apiModeSelect) {
            apiModeSelect.addEventListener('change', handleModeChange);
            console.log('✅ Listener de modo adicionado');
        }
        
        // Verificar modo inicial
        const currentMode = api.mode;
        if (currentMode === 'real' && canUseRealAPI) {
            console.log('🔄 Inicializando modo real...');
            initializeRealAPIMode();
        }
        
        // Adicionar funções de debug globais
        setupDebugFunctions();
    }
    
    function handleModeChange(event) {
        const newMode = event.target.value;
        console.log(`🔄 Mudança de modo: ${newMode}`);
        
        if (newMode === 'real' && canUseRealAPI) {
            initializeRealAPIMode();
        }
    }
    
    function initializeRealAPIMode() {
        console.log('🌟 Inicializando modo API Real...');
        
        const app = window.metaAdsApp;
        
        // Tentar carregar SDK se ainda não carregado
        if (!window.FB && !document.getElementById('facebook-jssdk')) {
            console.log('📦 Carregando Facebook SDK...');
            loadFacebookSDK();
        } else {
            console.log('📦 Facebook SDK já carregado');
        }
        
        // Configurar botão de login
        const loginBtn = document.getElementById('facebookLoginBtn');
        if (loginBtn) {
            loginBtn.style.display = 'flex';
            console.log('👆 Botão de login exibido');
        }
    }
    
    function loadFacebookSDK() {
        if (document.getElementById('facebook-jssdk')) return;
        
        const js = document.createElement('script');
        js.id = 'facebook-jssdk';
        js.src = `https://connect.facebook.net/${CONFIG.LOCALE}/sdk.js`;
        js.async = true;
        js.defer = true;
        
        js.onload = () => {
            console.log('✅ Facebook SDK carregado via inicializador');
        };
        
        js.onerror = (error) => {
            console.error('❌ Erro ao carregar Facebook SDK:', error);
        };
        
        document.head.appendChild(js);
    }
    
    function setupDebugFunctions() {
        // Função para forçar reconexão
        window.forceReconnectAPI = async function() {
            console.log('🔄 === FORÇANDO RECONEXÃO ===');
            
            const app = window.metaAdsApp;
            if (!app) {
                console.error('❌ App não encontrado');
                return;
            }
            
            try {
                // Reset estado
                app.api.logout();
                console.log('✅ Estado resetado');
                
                // Forçar modo real
                app.api.setMode('real');
                console.log('✅ Modo definido para real');
                
                // Inicializar SDK
                await app.api.initFacebookSDK();
                console.log('✅ SDK inicializado');
                
                // Tentar login
                const result = await app.api.loginWithFacebook();
                console.log('📊 Resultado:', result);
                
                return result;
                
            } catch (error) {
                console.error('❌ Erro na reconexão:', error);
                return { success: false, error: error.message };
            }
        };
        
        // Função para verificar configuração
        window.checkAPIConfig = function() {
            console.log('🔍 === VERIFICAÇÃO DE CONFIGURAÇÃO ===');
            
            const app = window.metaAdsApp;
            if (!app) {
                console.error('❌ App não encontrado');
                return;
            }
            
            console.log('📋 Configuração atual:');
            console.log(`   🆔 App ID: ${app.api.facebookAppId}`);
            console.log(`   🎭 Modo: ${app.api.mode}`);
            console.log(`   🔑 Token: ${app.api.accessToken ? 'Presente' : 'Ausente'}`);
            console.log(`   📱 SDK: ${window.FB ? 'Carregado' : 'Não carregado'}`);
            console.log(`   🔗 Status: ${app.api.connectionStatus}`);
            
            return {
                appId: app.api.facebookAppId,
                mode: app.api.mode,
                hasToken: !!app.api.accessToken,
                sdkLoaded: !!window.FB,
                status: app.api.connectionStatus
            };
        };
        
        console.log('🛠️ Funções de debug configuradas:');
        console.log('   • forceReconnectAPI() - Forçar reconexão');
        console.log('   • checkAPIConfig() - Verificar configuração');
    }
    
    // Inicializar
    initializeWhenReady();
    
    console.log('✅ Inicializador da API Real carregado');
    
})();