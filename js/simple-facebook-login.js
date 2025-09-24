// Login do Facebook super simples que sempre funciona
window.simpleFacebookLogin = async function() {
    console.log('🚀 === LOGIN FACEBOOK SIMPLES ===');
    
    try {
        // 1. Verificar se o Facebook SDK está disponível
        if (typeof window.FB === 'undefined') {
            console.log('📦 Carregando Facebook SDK...');
            
            // Carregar SDK diretamente
            await new Promise((resolve, reject) => {
                window.fbAsyncInit = function() {
                    FB.init({
                        appId: '778309504913999',
                        cookie: true,
                        xfbml: true,
                        version: 'v18.0'
                    });
                    resolve();
                };
                
                // Carregar script do SDK
                const script = document.createElement('script');
                script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
                script.onload = () => console.log('✅ SDK carregado');
                script.onerror = () => reject(new Error('Erro ao carregar SDK'));
                document.head.appendChild(script);
            });
        }
        
        console.log('✅ Facebook SDK disponível');
        
        // 2. Fazer login
        console.log('🔑 Iniciando login...');
        
        const loginResult = await new Promise((resolve) => {
            FB.login((response) => {
                console.log('📊 Resposta do login:', response);
                resolve(response);
            }, {
                scope: 'email,public_profile',
                return_scopes: true,
                auth_type: 'rerequest'
            });
        });
        
        if (!loginResult.authResponse) {
            throw new Error('Login cancelado ou negado');
        }
        
        console.log('✅ Login autorizado!');
        
        // 3. Buscar dados do usuário
        console.log('👤 Buscando dados do usuário...');
        
        const userData = await new Promise((resolve, reject) => {
            FB.api('/me', { fields: 'name,email,picture' }, (response) => {
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response);
                }
            });
        });
        
        console.log('✅ Dados do usuário obtidos:', userData);
        
        // 4. Salvar no localStorage
        const accessToken = loginResult.authResponse.accessToken;
        const expiresAt = Date.now() + (loginResult.authResponse.expiresIn * 1000);
        
        localStorage.setItem('facebook_access_token', accessToken);
        localStorage.setItem('facebook_token_expires', expiresAt.toString());
        localStorage.setItem('api_mode', 'real');
        
        console.log('✅ Dados salvos no localStorage');
        
        // 5. Atualizar aplicação se disponível
        if (window.metaAdsApp) {
            window.metaAdsApp.api.accessToken = accessToken;
            window.metaAdsApp.api.tokenExpiresAt = expiresAt;
            window.metaAdsApp.api.user = userData;
            window.metaAdsApp.api.connectionStatus = 'connected';
            window.metaAdsApp.isAuthenticated = true;
            
            // Atualizar UI
            window.metaAdsApp.updateUIForMode('real');
            
            console.log('✅ Estado da aplicação atualizado');
        }
        
        // 6. Mostrar sucesso
        alert(`🎉 Login bem-sucedido!\n\nBem-vindo, ${userData.name}!\n\nA página será recarregada para aplicar as mudanças.`);
        
        // 7. Recarregar página para garantir que tudo funcione
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
        return {
            success: true,
            user: userData,
            accessToken: accessToken
        };
        
    } catch (error) {
        console.error('❌ Erro no login simples:', error);
        alert(`❌ Erro: ${error.message}`);
        
        return {
            success: false,
            error: error.message
        };
    }
};

// Criar botão simples na página
window.createSimpleLoginButton = function() {
    console.log('🔘 === CRIANDO BOTÃO SIMPLES ===');
    
    // Remover botão existente se houver
    const existingBtn = document.getElementById('simple-facebook-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Criar botão
    const btn = document.createElement('button');
    btn.id = 'simple-facebook-btn';
    btn.innerHTML = '🔗 Login Facebook Direto';
    btn.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        background: #1877f2 !important;
        color: white !important;
        border: none !important;
        padding: 12px 20px !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: bold !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    `;
    
    // Adicionar evento de clique
    btn.addEventListener('click', async function() {
        const originalText = this.innerHTML;
        this.innerHTML = '⏳ Conectando...';
        this.disabled = true;
        
        try {
            await simpleFacebookLogin();
        } finally {
            this.innerHTML = originalText;
            this.disabled = false;
        }
    });
    
    // Adicionar à página
    document.body.appendChild(btn);
    
    console.log('✅ Botão simples criado e adicionado');
    return btn;
};

// Função para teste imediato
window.testFacebookLoginNow = function() {
    console.log('🧪 === TESTE IMEDIATO ===');
    
    // Verificar pré-requisitos
    const isHttpsOrLocalhost = window.location.protocol === 'https:' || 
                              ['localhost', '127.0.0.1'].includes(window.location.hostname);
    
    if (!isHttpsOrLocalhost) {
        alert('❌ Facebook requer HTTPS ou localhost!\n\nAcesse via https:// ou localhost');
        return;
    }
    
    // Criar botão e iniciar login
    createSimpleLoginButton();
    
    console.log('✅ Botão criado. Clique nele para fazer login!');
    console.log('💡 Ou execute: simpleFacebookLogin()');
};

console.log('🚀 Login simples carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• simpleFacebookLogin() - Login direto sem depender da app');
console.log('• createSimpleLoginButton() - Criar botão simples');
console.log('• testFacebookLoginNow() - Teste completo imediato');
console.log('');
console.log('💡 Execute: testFacebookLoginNow()');