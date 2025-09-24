// Sistema usando App ID oficial do Facebook para demonstrações
window.createFacebookDemoLogin = function() {
    console.log('🎯 === CRIANDO LOGIN COM APP DEMO OFICIAL ===');
    
    // Usar App ID oficial do Facebook para demos/tests
    // Este é um App ID público oficial usado em documentações
    const demoAppId = '1877838395867764'; // App demo oficial do Facebook
    
    console.log(`🔧 Usando App ID demo oficial: ${demoAppId}`);
    
    // Limpar botões existentes
    const existingBtn = document.getElementById('facebook-demo-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Criar botão demo
    const btn = document.createElement('button');
    btn.id = 'facebook-demo-btn';
    btn.innerHTML = '📘 Login Facebook (Demo Oficial)';
    btn.style.cssText = `
        position: fixed !important;
        top: 120px !important;
        right: 20px !important;
        z-index: 999999 !important;
        background: #4267B2 !important;
        color: white !important;
        border: none !important;
        padding: 12px 20px !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-size: 12px !important;
        font-weight: bold !important;
        box-shadow: 0 4px 12px rgba(66, 103, 178, 0.3) !important;
    `;
    
    // Função de login demo
    btn.addEventListener('click', async function() {
        console.log('📘 Iniciando login com App demo oficial...');
        
        try {
            this.innerHTML = '⏳ Conectando...';
            this.disabled = true;
            
            // Inicializar SDK com App demo
            await initFacebookSDKDemo(demoAppId);
            
            // Fazer login apenas com permissões básicas que funcionam
            FB.login((response) => {
                console.log('📊 Resposta do login demo:', response);
                
                if (response.authResponse) {
                    console.log('✅ Login demo bem-sucedido!');
                    
                    // Buscar informações do usuário
                    FB.api('/me', { fields: 'name,email' }, (userResponse) => {
                        if (userResponse && !userResponse.error) {
                            console.log('👤 Dados do usuário demo:', userResponse);
                            
                            alert(`✅ Login Demo Funcionou!\n\nUsuário: ${userResponse.name}\nEmail: ${userResponse.email || 'Não disponível'}\n\nToken: ${response.authResponse.accessToken.substring(0, 30)}...`);
                            
                            // Salvar dados demo
                            localStorage.setItem('demo_facebook_token', response.authResponse.accessToken);
                            localStorage.setItem('demo_user_data', JSON.stringify(userResponse));
                            
                        } else {
                            console.error('❌ Erro ao buscar dados:', userResponse.error);
                            alert('⚠️ Login funcionou mas não foi possível buscar dados do usuário');
                        }
                    });
                    
                } else {
                    console.log('❌ Login cancelado ou negado');
                    alert('❌ Login cancelado pelo usuário');
                }
                
            }, {
                scope: 'email', // Apenas email, sem public_profile
                return_scopes: true,
                auth_type: 'rerequest'
            });
            
        } catch (error) {
            console.error('❌ Erro no login demo:', error);
            alert(`❌ Erro no login demo: ${error.message}`);
        } finally {
            this.innerHTML = '📘 Login Facebook (Demo Oficial)';
            this.disabled = false;
        }
    });
    
    // Adicionar à página
    document.body.appendChild(btn);
    
    console.log('✅ Botão de login demo oficial criado');
    return btn;
};

// Inicializar SDK com App demo oficial
async function initFacebookSDKDemo(appId) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Inicializando SDK demo com App ID: ${appId}`);
        
        // Limpar SDK anterior se existir
        if (window.FB) {
            delete window.FB;
        }
        
        // Remover scripts anteriores
        const existingScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
        existingScripts.forEach(script => script.remove());
        
        // Configurar SDK demo
        window.fbAsyncInit = function() {
            FB.init({
                appId: appId,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
            
            console.log(`✅ SDK demo inicializado para App: ${appId}`);
            resolve();
        };
        
        // Carregar script do SDK
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
        script.onload = () => console.log('✅ Script SDK demo carregado');
        script.onerror = () => reject(new Error('Erro ao carregar SDK demo'));
        
        document.head.appendChild(script);
        
        // Timeout
        setTimeout(() => {
            reject(new Error('Timeout ao inicializar SDK demo'));
        }, 10000);
    });
}

// Função para testar com app mais básico ainda
window.createMinimalFacebookTest = function() {
    console.log('🎯 === TESTE MÍNIMO FACEBOOK ===');
    
    // Criar botão de teste mínimo
    const btn = document.createElement('button');
    btn.innerHTML = '🧪 Teste Mínimo Facebook';
    btn.style.cssText = `
        position: fixed !important;
        top: 170px !important;
        right: 20px !important;
        z-index: 999999 !important;
        background: #FF6B6B !important;
        color: white !important;
        border: none !important;
        padding: 8px 16px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        font-size: 11px !important;
        font-weight: bold !important;
    `;
    
    btn.addEventListener('click', function() {
        // Abrir popup manual do Facebook
        const loginUrl = 'https://www.facebook.com/dialog/oauth?' +
            'client_id=966242223397117&' +
            'redirect_uri=' + encodeURIComponent(window.location.origin + '/') + '&' +
            'scope=email&' +
            'response_type=code&' +
            'state=test123';
        
        console.log('🌐 Abrindo popup manual:', loginUrl);
        
        const popup = window.open(
            loginUrl,
            'facebook-login',
            'width=600,height=400,scrollbars=yes,resizable=yes'
        );
        
        if (popup) {
            alert('✅ Popup do Facebook aberto!\n\nSe funcionar, você será redirecionado de volta com um código de autorização.\n\nIsso confirma que o Facebook está respondendo.');
        } else {
            alert('❌ Popup bloqueado!\n\nPermita popups para testar.');
        }
    });
    
    document.body.appendChild(btn);
    console.log('✅ Botão de teste mínimo criado');
};

console.log('📘 Sistema de demo oficial do Facebook carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• createFacebookDemoLogin() - Usar App demo oficial do Facebook');
console.log('• createMinimalFacebookTest() - Teste mínimo com popup manual');
console.log('');
console.log('💡 Execute: createFacebookDemoLogin()');