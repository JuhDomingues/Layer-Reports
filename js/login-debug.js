// Debug específico para o processo de login do Facebook
window.debugFacebookLogin = async function() {
    console.log('🔑 === DEBUG DO LOGIN FACEBOOK ===');
    console.log('');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ App principal não encontrado');
        return;
    }
    
    const api = app.api;
    
    // 1. Verificar pré-requisitos
    console.log('1️⃣ Verificando pré-requisitos...');
    console.log(`   🎭 Modo: ${api.mode}`);
    console.log(`   🔒 HTTPS/Localhost: ${api.isHttps || ['localhost', '127.0.0.1'].includes(window.location.hostname)}`);
    console.log(`   📦 Facebook SDK: ${typeof window.FB !== 'undefined' ? '✅' : '❌'}`);
    console.log(`   🆔 App ID: ${api.facebookAppId}`);
    console.log(`   🎫 Permissões: ${api.requiredPermissions.join(', ')}`);
    
    if (api.mode !== 'real') {
        console.warn('⚠️ Não está no modo real - mude para API Real primeiro');
        return;
    }
    
    if (typeof window.FB === 'undefined') {
        console.error('❌ Facebook SDK não carregado');
        console.log('🔄 Tentando carregar SDK...');
        try {
            await api.initFacebookSDK();
            console.log('✅ SDK carregado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao carregar SDK:', error);
            return;
        }
    }
    
    // 2. Testar status de login atual
    console.log('');
    console.log('2️⃣ Verificando status atual...');
    
    try {
        const loginStatus = await new Promise((resolve) => {
            window.FB.getLoginStatus(resolve);
        });
        
        console.log(`   📊 Status: ${loginStatus.status}`);
        console.log(`   📋 Response completa:`, loginStatus);
        
        if (loginStatus.status === 'connected') {
            console.log('✅ Usuário já está conectado!');
            console.log(`   🔑 Token: ${loginStatus.authResponse.accessToken.substring(0, 20)}...`);
        } else {
            console.log('❌ Usuário não conectado');
        }
    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
    }
    
    // 3. Testar acesso às permissões
    console.log('');
    console.log('3️⃣ Verificando permissões disponíveis...');
    
    try {
        // Verificar se consegue chamar FB.login
        if (typeof window.FB.login === 'function') {
            console.log('✅ FB.login disponível');
        } else {
            console.error('❌ FB.login não disponível');
        }
        
        // Verificar configuração do App
        console.log('🔍 Testando configuração do App...');
        const testCall = await new Promise((resolve) => {
            window.FB.api(`/${api.facebookAppId}`, (response) => {
                resolve(response);
            });
        });
        
        if (testCall.error) {
            console.warn('⚠️ Possível problema com App ID:', testCall.error);
        } else {
            console.log('✅ App ID válido:', testCall.name || 'App encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar permissões:', error);
    }
    
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('• testFacebookLogin() - Testar login completo');
    console.log('• forceFacebookLogin() - Forçar login com logs detalhados');
    console.log('• resetAndTryLogin() - Reset completo e tentativa de login');
};

// Teste de login completo
window.testFacebookLogin = async function() {
    console.log('🧪 === TESTE COMPLETO DE LOGIN ===');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ App não encontrado');
        return;
    }
    
    try {
        console.log('🔄 Iniciando processo de login...');
        
        // Garantir que estamos no modo real
        app.api.setMode('real');
        
        // Usar a função de login da aplicação
        const result = await app.handleFacebookLogin();
        
        console.log('📊 Resultado do login:', result);
        
        if (result && result.success) {
            console.log('✅ Login bem-sucedido!');
            console.log(`👤 Usuário: ${result.user?.name}`);
        } else {
            console.error('❌ Login falhou');
            console.log('📋 Detalhes:', result);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro durante teste de login:', error);
        return { success: false, error: error.message };
    }
};

// Login forçado com logs detalhados
window.forceFacebookLogin = async function() {
    console.log('💪 === LOGIN FORÇADO COM DEBUG ===');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ App não encontrado');
        return;
    }
    
    const api = app.api;
    
    try {
        // 1. Preparar ambiente
        console.log('1️⃣ Preparando ambiente...');
        api.setMode('real');
        await api.initFacebookSDK();
        
        // 2. Limpar estado anterior
        console.log('2️⃣ Limpando estado anterior...');
        api.logout();
        
        // 3. Tentar login direto via SDK
        console.log('3️⃣ Iniciando login via SDK...');
        
        return new Promise((resolve) => {
            window.FB.login((response) => {
                console.log('📊 Response do FB.login:', response);
                
                if (response.authResponse) {
                    console.log('✅ Login autorizado!');
                    console.log(`   🔑 Token: ${response.authResponse.accessToken.substring(0, 20)}...`);
                    console.log(`   ⏰ Expira em: ${response.authResponse.expiresIn} segundos`);
                    
                    // Salvar token
                    api.accessToken = response.authResponse.accessToken;
                    api.tokenExpiresAt = Date.now() + (response.authResponse.expiresIn * 1000);
                    localStorage.setItem('facebook_access_token', api.accessToken);
                    localStorage.setItem('facebook_token_expires', api.tokenExpiresAt.toString());
                    
                    // Buscar dados do usuário
                    window.FB.api('/me', { fields: 'name,email,picture' }, (userResponse) => {
                        console.log('👤 Dados do usuário:', userResponse);
                        
                        if (userResponse.error) {
                            console.error('❌ Erro ao buscar dados do usuário:', userResponse.error);
                            resolve({ success: false, error: userResponse.error });
                        } else {
                            api.user = userResponse;
                            api.connectionStatus = 'connected';
                            app.isAuthenticated = true;
                            
                            console.log('🎉 Login completo e bem-sucedido!');
                            resolve({ success: true, user: userResponse, accessToken: api.accessToken });
                        }
                    });
                } else {
                    console.warn('❌ Login não autorizado ou cancelado');
                    console.log('📋 Response completa:', response);
                    resolve({ success: false, message: 'Login não autorizado', response });
                }
            }, {
                scope: api.requiredPermissions.join(','),
                return_scopes: true,
                auth_type: 'rerequest'
            });
        });
        
    } catch (error) {
        console.error('❌ Erro durante login forçado:', error);
        return { success: false, error: error.message };
    }
};

// Reset e tentativa de login
window.resetAndTryLogin = async function() {
    console.log('🔄 === RESET E LOGIN ===');
    
    // 1. Limpeza completa
    console.log('1️⃣ Fazendo limpeza completa...');
    localStorage.removeItem('facebook_access_token');
    localStorage.removeItem('facebook_token_expires');
    localStorage.removeItem('facebook_account_id');
    
    // 2. Reset do app
    const app = window.metaAdsApp;
    if (app) {
        app.api.logout();
        app.isAuthenticated = false;
        console.log('✅ Estado do app resetado');
    }
    
    // 3. Aguardar um pouco
    console.log('2️⃣ Aguardando estabilização...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Tentar login
    console.log('3️⃣ Tentando login...');
    return await forceFacebookLogin();
};

// Verificar configuração do Facebook App
window.checkFacebookAppConfig = async function() {
    console.log('🔍 === VERIFICAÇÃO DO FACEBOOK APP ===');
    
    const app = window.metaAdsApp;
    if (!app) {
        console.error('❌ App não encontrado');
        return;
    }
    
    const appId = app.api.facebookAppId;
    console.log(`🆔 App ID: ${appId}`);
    
    if (typeof window.FB === 'undefined') {
        console.error('❌ Facebook SDK não carregado');
        return;
    }
    
    try {
        // Verificar se o App existe
        const appInfo = await new Promise((resolve) => {
            window.FB.api(`/${appId}`, (response) => {
                resolve(response);
            });
        });
        
        if (appInfo.error) {
            console.error('❌ Erro ao verificar App:', appInfo.error);
            
            if (appInfo.error.code === 803) {
                console.log('💡 Possível solução: Verificar se o App ID está correto');
            }
        } else {
            console.log('✅ App válido encontrado:');
            console.log(`   📛 Nome: ${appInfo.name || 'N/A'}`);
            console.log(`   🏢 Categoria: ${appInfo.category || 'N/A'}`);
        }
        
        // Verificar domínio atual
        const currentDomain = window.location.origin;
        console.log(`🌐 Domínio atual: ${currentDomain}`);
        console.log('💡 Certifique-se de que este domínio está configurado no Facebook App');
        
    } catch (error) {
        console.error('❌ Erro durante verificação:', error);
    }
};

console.log('🔑 Debug de login carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• debugFacebookLogin() - Debug completo do login');
console.log('• testFacebookLogin() - Teste usando função da app');
console.log('• forceFacebookLogin() - Login forçado com logs');
console.log('• resetAndTryLogin() - Reset completo e login');
console.log('• checkFacebookAppConfig() - Verificar configuração do App');
console.log('');
console.log('💡 Comece com: debugFacebookLogin()');