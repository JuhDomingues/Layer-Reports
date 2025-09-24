// Sistema de teste de login Facebook com múltiplas estratégias
window.testFacebookApps = async function() {
    console.log('🧪 === TESTE DE MÚLTIPLOS APPS FACEBOOK ===');
    
    // Lista de App IDs para testar (públicos conhecidos)
    const testApps = [
        {
            id: '966242223397117',
            name: 'Facebook SDK Test App',
            public: true
        },
        {
            id: '145634995501895',
            name: 'Facebook for Developers',
            public: true
        },
        {
            id: '778309504913999',
            name: 'App Original do Projeto',
            public: false
        }
    ];
    
    for (const app of testApps) {
        console.log(`\n🔍 Testando App ID: ${app.id} (${app.name})`);
        
        try {
            const result = await testSingleApp(app.id);
            
            if (result.success) {
                console.log(`✅ App ${app.id} funciona!`);
                return {
                    success: true,
                    workingAppId: app.id,
                    appName: app.name
                };
            } else {
                console.log(`❌ App ${app.id} falhou: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`❌ App ${app.id} erro: ${error.message}`);
        }
        
        // Aguardar antes do próximo teste
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('❌ Nenhum App ID funcionou');
    return { success: false, error: 'Nenhum App ID disponível' };
};

// Testar um App ID específico
async function testSingleApp(appId) {
    return new Promise((resolve) => {
        // Limpar Facebook SDK anterior se existir
        if (window.FB) {
            delete window.FB;
        }
        
        // Remover scripts anteriores
        const existingScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
        existingScripts.forEach(script => script.remove());
        
        // Configurar novo SDK
        window.fbAsyncInit = function() {
            FB.init({
                appId: appId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
            
            // Testar se o app está disponível
            FB.api('/me', { fields: 'id' }, (response) => {
                if (response && !response.error) {
                    resolve({ success: true });
                } else {
                    resolve({ 
                        success: false, 
                        error: response ? response.error.message : 'Sem resposta'
                    });
                }
            });
        };
        
        // Carregar script do SDK
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
        script.onload = () => console.log(`📦 SDK carregado para App ${appId}`);
        script.onerror = () => resolve({ 
            success: false, 
            error: 'Erro ao carregar SDK' 
        });
        
        document.head.appendChild(script);
        
        // Timeout
        setTimeout(() => {
            resolve({ 
                success: false, 
                error: 'Timeout' 
            });
        }, 10000);
    });
}

// Função para usar o melhor App ID disponível
window.useWorkingFacebookApp = async function() {
    console.log('🎯 === BUSCANDO APP FACEBOOK FUNCIONAL ===');
    
    const result = await testFacebookApps();
    
    if (result.success) {
        console.log(`🎉 App funcional encontrado: ${result.workingAppId}`);
        console.log(`📱 Nome: ${result.appName}`);
        
        // Salvar o App ID funcional
        localStorage.setItem('working_facebook_app_id', result.workingAppId);
        
        // Atualizar o sistema principal se existir
        if (window.metaAdsApp && window.metaAdsApp.api) {
            window.metaAdsApp.api.facebookAppId = result.workingAppId;
            console.log('✅ App principal atualizado');
        }
        
        // Criar botão de teste
        createTestLoginButton(result.workingAppId);
        
        return result.workingAppId;
        
    } else {
        console.error('❌ Nenhum App Facebook disponível');
        alert('❌ Nenhum App Facebook está disponível no momento.\n\nIsso pode acontecer porque:\n- Os apps precisam de configuração\n- Você não tem permissão para acessá-los\n- Os apps não estão públicos');
        return null;
    }
};

// Criar botão de teste com App ID específico
function createTestLoginButton(appId) {
    // Remover botão existente
    const existingBtn = document.getElementById('test-facebook-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Criar novo botão
    const btn = document.createElement('button');
    btn.id = 'test-facebook-btn';
    btn.innerHTML = `🧪 Testar Login (${appId})`;
    btn.style.cssText = `
        position: fixed !important;
        top: 70px !important;
        right: 20px !important;
        z-index: 999999 !important;
        background: #42b883 !important;
        color: white !important;
        border: none !important;
        padding: 12px 20px !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: bold !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    `;
    
    // Adicionar evento de clique
    btn.addEventListener('click', async function() {
        console.log('🧪 Testando login com App funcional...');
        
        try {
            this.innerHTML = '⏳ Testando...';
            this.disabled = true;
            
            // Fazer login de teste
            FB.login((response) => {
                console.log('📊 Resposta do teste:', response);
                
                if (response.authResponse) {
                    alert(`✅ Login de teste bem-sucedido!\n\nApp ID: ${appId}\nToken: ${response.authResponse.accessToken.substring(0, 20)}...`);
                } else {
                    alert('❌ Login cancelado ou negado');
                }
                
            }, {
                scope: 'email,public_profile',
                return_scopes: true
            });
            
        } catch (error) {
            console.error('❌ Erro no teste:', error);
            alert(`❌ Erro no teste: ${error.message}`);
        } finally {
            this.innerHTML = `🧪 Testar Login (${appId})`;
            this.disabled = false;
        }
    });
    
    // Adicionar à página
    document.body.appendChild(btn);
    
    console.log('✅ Botão de teste criado');
}

console.log('🧪 Sistema de teste de Apps Facebook carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• testFacebookApps() - Testar múltiplos App IDs');
console.log('• useWorkingFacebookApp() - Encontrar e usar App funcional');
console.log('');
console.log('💡 Execute: useWorkingFacebookApp()');