// Diagnóstico Completo da API Real
class APIDiagnostics {
    constructor() {
        this.results = {
            environment: {},
            facebook: {},
            permissions: {},
            connectivity: {},
            recommendations: []
        };
    }

    async runFullDiagnostics() {
        console.log('🔍 === DIAGNÓSTICO COMPLETO DA API REAL ===');
        console.log('');

        await this.checkEnvironment();
        await this.checkFacebookSDK();
        await this.checkAppConfiguration();
        await this.checkPermissions();
        await this.checkConnectivity();
        
        this.generateRecommendations();
        this.displayResults();
        
        return this.results;
    }

    async checkEnvironment() {
        console.log('1️⃣ Verificando Ambiente...');
        
        const env = {
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            port: window.location.port,
            isHttps: window.location.protocol === 'https:',
            isLocalhost: ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname),
            userAgent: navigator.userAgent,
            language: navigator.language
        };

        this.results.environment = env;

        console.log(`   📍 URL: ${window.location.href}`);
        console.log(`   🔒 HTTPS: ${env.isHttps ? '✅' : '❌'}`);
        console.log(`   🏠 Localhost: ${env.isLocalhost ? '✅' : '❌'}`);
        
        if (!env.isHttps && !env.isLocalhost) {
            console.warn('   ⚠️  Facebook SDK requer HTTPS ou localhost!');
            this.results.recommendations.push('Use HTTPS ou acesse via localhost para ativar a API real');
        }
        
        console.log('');
    }

    async checkFacebookSDK() {
        console.log('2️⃣ Verificando Facebook SDK...');
        
        const facebook = {
            sdkLoaded: typeof window.FB !== 'undefined',
            scriptTag: !!document.getElementById('facebook-jssdk'),
            fbAsyncInit: typeof window.fbAsyncInit === 'function',
            appId: window.metaAdsApp?.api?.facebookAppId || 'não definido',
            mode: window.metaAdsApp?.api?.mode || 'não definido'
        };

        this.results.facebook = facebook;

        console.log(`   📦 SDK Carregado: ${facebook.sdkLoaded ? '✅' : '❌'}`);
        console.log(`   🏷️  Script Tag: ${facebook.scriptTag ? '✅' : '❌'}`);
        console.log(`   🔧 fbAsyncInit: ${facebook.fbAsyncInit ? '✅' : '❌'}`);
        console.log(`   🆔 App ID: ${facebook.appId}`);
        console.log(`   🎭 Modo: ${facebook.mode}`);

        if (!facebook.sdkLoaded) {
            console.log('   🔄 Tentando carregar SDK...');
            try {
                if (window.metaAdsApp?.api?.initFacebookSDK) {
                    await window.metaAdsApp.api.initFacebookSDK();
                    this.results.facebook.sdkLoaded = typeof window.FB !== 'undefined';
                    console.log(`   📦 SDK Carregado após init: ${this.results.facebook.sdkLoaded ? '✅' : '❌'}`);
                }
            } catch (error) {
                console.error('   ❌ Erro ao carregar SDK:', error.message);
                this.results.recommendations.push('Erro ao carregar Facebook SDK - verifique conexão e configurações');
            }
        }
        
        console.log('');
    }

    async checkAppConfiguration() {
        console.log('3️⃣ Verificando Configuração do App...');
        
        const api = window.metaAdsApp?.api;
        if (!api) {
            console.error('   ❌ API não encontrada');
            return;
        }

        const config = {
            appId: api.facebookAppId,
            accessToken: !!api.accessToken,
            tokenExpiry: api.tokenExpiresAt,
            accountId: api.accountId,
            permissions: api.requiredPermissions,
            connectionStatus: api.connectionStatus
        };

        console.log(`   🆔 App ID: ${config.appId}`);
        console.log(`   🔑 Access Token: ${config.accessToken ? '✅ Presente' : '❌ Ausente'}`);
        console.log(`   ⏰ Token Expiry: ${config.tokenExpiry ? new Date(config.tokenExpiry).toLocaleString() : 'Não definido'}`);
        console.log(`   💳 Account ID: ${config.accountId || 'Não selecionado'}`);
        console.log(`   🔗 Status: ${config.connectionStatus}`);
        console.log(`   🎫 Permissões: ${config.permissions.join(', ')}`);

        // Verificar se o App ID é válido
        if (config.appId === '778309504913999') {
            console.log('   ✅ Usando App ID padrão');
        } else {
            console.log('   🔧 Usando App ID customizado');
        }

        // Verificar expiração do token
        if (config.tokenExpiry && config.tokenExpiry < Date.now()) {
            console.warn('   ⚠️  Token expirado');
            this.results.recommendations.push('Token de acesso expirado - faça login novamente');
        }
        
        console.log('');
    }

    async checkPermissions() {
        console.log('4️⃣ Verificando Permissões...');
        
        if (typeof window.FB === 'undefined') {
            console.log('   ❌ SDK não carregado - pulando verificação de permissões');
            return;
        }

        try {
            const loginStatus = await new Promise((resolve) => {
                window.FB.getLoginStatus(resolve);
            });

            console.log(`   📊 Status de Login: ${loginStatus.status}`);
            
            if (loginStatus.status === 'connected') {
                console.log('   ✅ Usuário conectado');
                
                // Verificar permissões concedidas
                const permissions = await new Promise((resolve) => {
                    window.FB.api('/me/permissions', resolve);
                });

                if (permissions.data) {
                    const granted = permissions.data.filter(p => p.status === 'granted').map(p => p.permission);
                    const declined = permissions.data.filter(p => p.status === 'declined').map(p => p.permission);
                    
                    console.log(`   ✅ Permissões Concedidas: ${granted.join(', ')}`);
                    if (declined.length > 0) {
                        console.log(`   ❌ Permissões Negadas: ${declined.join(', ')}`);
                        this.results.recommendations.push('Algumas permissões foram negadas - isso pode afetar a funcionalidade');
                    }
                    
                    this.results.permissions = { granted, declined };
                }
            } else {
                console.log('   ❌ Usuário não conectado');
                this.results.recommendations.push('Usuário não está conectado - clique em "Conectar Facebook"');
            }
        } catch (error) {
            console.error('   ❌ Erro ao verificar permissões:', error);
        }
        
        console.log('');
    }

    async checkConnectivity() {
        console.log('5️⃣ Verificando Conectividade...');
        
        // Testar conexão com Facebook Graph API
        try {
            const response = await fetch('https://graph.facebook.com/v18.0/', {
                method: 'GET',
                mode: 'cors'
            });
            
            if (response.ok) {
                console.log('   ✅ Conexão com Graph API: OK');
                this.results.connectivity.graphApi = true;
            } else {
                console.log('   ❌ Conexão com Graph API: Falhou');
                this.results.connectivity.graphApi = false;
            }
        } catch (error) {
            console.log('   ❌ Erro de rede:', error.message);
            this.results.connectivity.graphApi = false;
            this.results.recommendations.push('Problemas de conectividade - verifique sua conexão de internet');
        }

        // Testar se o domínio está configurado no Facebook App
        try {
            const currentDomain = window.location.origin;
            console.log(`   🌐 Domínio atual: ${currentDomain}`);
            
            const validDomains = [
                'https://localhost:8000',
                'https://layer-reports.vercel.app',
                'http://localhost:8000',
                'http://127.0.0.1:8000'
            ];
            
            const domainValid = validDomains.includes(currentDomain) || 
                               currentDomain.includes('localhost') || 
                               currentDomain.includes('127.0.0.1');
            
            if (domainValid) {
                console.log('   ✅ Domínio reconhecido');
            } else {
                console.log('   ⚠️  Domínio pode não estar configurado no Facebook App');
                this.results.recommendations.push('Adicione este domínio às configurações do Facebook App');
            }
            
        } catch (error) {
            console.error('   ❌ Erro ao verificar domínio:', error);
        }
        
        console.log('');
    }

    generateRecommendations() {
        console.log('6️⃣ Gerando Recomendações...');
        
        const env = this.results.environment;
        const fb = this.results.facebook;
        
        // Recomendações baseadas no ambiente
        if (!env.isHttps && !env.isLocalhost) {
            this.results.recommendations.unshift('CRÍTICO: Use HTTPS ou localhost para habilitar API real');
        }
        
        // Recomendações baseadas no SDK
        if (!fb.sdkLoaded) {
            this.results.recommendations.push('Recarregue a página se o SDK não carregar');
        }
        
        // Recomendações gerais
        if (this.results.recommendations.length === 0) {
            this.results.recommendations.push('Configuração parece estar correta - tente fazer login');
        }
        
        console.log('');
    }

    displayResults() {
        console.log('📋 === RESUMO DO DIAGNÓSTICO ===');
        console.log('');
        
        // Status geral
        const env = this.results.environment;
        const fb = this.results.facebook;
        const canUseRealAPI = (env.isHttps || env.isLocalhost) && fb.sdkLoaded;
        
        console.log(`🎯 API Real Disponível: ${canUseRealAPI ? '✅ SIM' : '❌ NÃO'}`);
        console.log('');
        
        // Recomendações
        console.log('💡 RECOMENDAÇÕES:');
        this.results.recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
        });
        console.log('');
        
        // Comandos úteis
        console.log('🛠️ COMANDOS ÚTEIS:');
        console.log('   • runAPIDiagnostics() - Executar este diagnóstico novamente');
        console.log('   • window.metaAdsApp.handleFacebookLogin() - Tentar login manual');
        console.log('   • debugFacebookConnection() - Debug detalhado da conexão');
        console.log('   • window.metaAdsApp.api.setMode("real") - Forçar modo real');
        console.log('');
        
        return this.results;
    }
}

// Função global para executar diagnósticos
window.runAPIDiagnostics = async function() {
    const diagnostics = new APIDiagnostics();
    return await diagnostics.runFullDiagnostics();
};

// Função para teste rápido de login
window.quickLoginTest = async function() {
    console.log('⚡ === TESTE RÁPIDO DE LOGIN ===');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ App não encontrado');
        return;
    }
    
    try {
        // Forçar modo real
        app.api.setMode('real');
        console.log('✅ Modo definido para "real"');
        
        // Inicializar SDK
        await app.api.initFacebookSDK();
        console.log('✅ SDK inicializado');
        
        // Tentar login
        console.log('🔑 Iniciando login...');
        const result = await app.api.loginWithFacebook();
        
        if (result && result.success) {
            console.log('✅ Login bem-sucedido!');
            console.log('👤 Usuário:', result.user);
        } else {
            console.log('❌ Login falhou');
            console.log('📋 Detalhes:', result);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste de login:', error);
    }
};

// Função para limpar e reinicializar
window.resetFacebookConnection = function() {
    console.log('🔄 === RESETANDO CONEXÃO FACEBOOK ===');
    
    // Limpar localStorage
    localStorage.removeItem('facebook_access_token');
    localStorage.removeItem('facebook_token_expires');
    localStorage.removeItem('facebook_account_id');
    console.log('✅ Cache limpo');
    
    // Reset API state
    const app = window.metaAdsApp;
    if (app && app.api) {
        app.api.accessToken = null;
        app.api.tokenExpiresAt = null;
        app.api.accountId = null;
        app.api.user = null;
        app.api.connectionStatus = 'disconnected';
        app.isAuthenticated = false;
        console.log('✅ Estado da API resetado');
    }
    
    // Recarregar SDK se necessário
    const fbScript = document.getElementById('facebook-jssdk');
    if (fbScript) {
        fbScript.remove();
        console.log('✅ Script do SDK removido');
    }
    
    console.log('💡 Recarregue a página para um reset completo');
};

console.log('🔍 Diagnósticos de API carregados!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• runAPIDiagnostics() - Diagnóstico completo');
console.log('• quickLoginTest() - Teste rápido de login');
console.log('• resetFacebookConnection() - Reset completo');
console.log('');
console.log('💡 Execute runAPIDiagnostics() para começar!');