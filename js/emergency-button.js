// Botão de emergência que sempre funciona
window.createEmergencyFacebookButton = function() {
    console.log('🚨 === CRIANDO BOTÃO DE EMERGÊNCIA ===');
    
    // Remover botão existente se houver
    const existingBtn = document.getElementById('facebookLoginBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Criar novo botão funcional
    const emergencyBtn = document.createElement('button');
    emergencyBtn.id = 'facebookLoginBtn';
    emergencyBtn.className = 'facebook-login-btn emergency-button';
    emergencyBtn.innerHTML = '<i class="fab fa-facebook-f"></i> <span>Conectar Facebook</span>';
    
    // Estilos inline para garantir visibilidade
    emergencyBtn.style.cssText = `
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        background: linear-gradient(135deg, #1877f2, #166fe5) !important;
        color: white !important;
        border: none !important;
        padding: 0.625rem 1.25rem !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-size: 0.875rem !important;
        font-weight: 600 !important;
        box-shadow: 0 2px 8px rgba(24, 119, 242, 0.25) !important;
        z-index: 10000 !important;
        position: relative !important;
        margin: 0 10px !important;
        transition: all 0.2s ease !important;
    `;
    
    // Adicionar hover effect
    emergencyBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 12px rgba(24, 119, 242, 0.4)';
    });
    
    emergencyBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 8px rgba(24, 119, 242, 0.25)';
    });
    
    // Função de clique que sempre funciona
    emergencyBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🚨 BOTÃO DE EMERGÊNCIA CLICADO!');
        
        // Salvar conteúdo original
        const originalHTML = this.innerHTML;
        
        try {
            // Mostrar loading
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
            this.disabled = true;
            
            // Verificar se o app existe, se não, criar um básico
            if (!window.metaAdsApp) {
                console.log('⏳ App não encontrado, criando versão básica...');
                
                // Criar API básica se não existir
                if (!window.MetaAdsAPI) {
                    console.error('❌ MetaAdsAPI não carregada');
                    throw new Error('Sistema não carregado corretamente. Recarregue a página.');
                }
                
                // Criar instância básica
                window.metaAdsApp = {
                    api: new MetaAdsAPI(),
                    isAuthenticated: false,
                    updateUIForMode: function(mode) {
                        console.log(`UI atualizada para modo: ${mode}`);
                    },
                    loadRealData: async function() {
                        console.log('Carregando dados reais...');
                    }
                };
                
                console.log('✅ App básico criado');
            }
            
            const app = window.metaAdsApp;
            const api = app.api;
            
            // Forçar modo real
            api.setMode('real');
            console.log('✅ Modo real ativado');
            
            // Inicializar Facebook SDK
            if (typeof window.FB === 'undefined') {
                console.log('📦 Inicializando Facebook SDK...');
                await api.initFacebookSDK();
                
                // Aguardar SDK carregar
                let sdkAttempts = 0;
                while (typeof window.FB === 'undefined' && sdkAttempts < 30) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    sdkAttempts++;
                }
                
                if (typeof window.FB === 'undefined') {
                    throw new Error('Facebook SDK não carregou');
                }
            }
            
            console.log('✅ Facebook SDK carregado');
            
            // Fazer login direto via SDK
            console.log('🔑 Iniciando login direto...');
            
            const loginResult = await new Promise((resolve) => {
                window.FB.login((response) => {
                    console.log('📊 Response do login:', response);
                    
                    if (response.authResponse) {
                        // Salvar token
                        api.accessToken = response.authResponse.accessToken;
                        api.tokenExpiresAt = Date.now() + (response.authResponse.expiresIn * 1000);
                        localStorage.setItem('facebook_access_token', api.accessToken);
                        localStorage.setItem('facebook_token_expires', api.tokenExpiresAt.toString());
                        
                        // Buscar dados do usuário
                        window.FB.api('/me', { fields: 'name,email,picture' }, (userResponse) => {
                            if (userResponse.error) {
                                resolve({ success: false, error: userResponse.error });
                            } else {
                                api.user = userResponse;
                                api.connectionStatus = 'connected';
                                app.isAuthenticated = true;
                                
                                resolve({ success: true, user: userResponse });
                            }
                        });
                    } else {
                        resolve({ success: false, message: 'Login cancelado' });
                    }
                }, {
                    scope: 'ads_read,ads_management,read_insights,business_management',
                    return_scopes: true,
                    auth_type: 'rerequest'
                });
            });
            
            if (loginResult.success) {
                console.log('🎉 Login de emergência bem-sucedido!');
                console.log('👤 Usuário:', loginResult.user.name);
                
                // Atualizar interface
                app.updateUIForMode('real');
                
                // Mostrar sucesso
                alert(`✅ Conectado com sucesso!\nBem-vindo, ${loginResult.user.name}!`);
                
                // Tentar carregar dados
                try {
                    if (app.loadRealData) {
                        await app.loadRealData();
                    }
                } catch (loadError) {
                    console.warn('⚠️ Erro ao carregar dados:', loadError);
                }
                
            } else {
                throw new Error(loginResult.message || 'Login falhou');
            }
            
        } catch (error) {
            console.error('❌ Erro no login de emergência:', error);
            alert(`❌ Erro: ${error.message}\n\nTente novamente ou recarregue a página.`);
        } finally {
            // Restaurar botão
            this.innerHTML = originalHTML;
            this.disabled = false;
        }
    });
    
    // Encontrar onde inserir o botão
    const header = document.querySelector('.main-header .header-right');
    const apiStatus = document.querySelector('.api-status');
    
    if (header && apiStatus) {
        // Inserir após o status da API
        apiStatus.insertAdjacentElement('afterend', emergencyBtn);
        console.log('✅ Botão de emergência inserido no header');
    } else {
        // Inserir no body como fallback
        document.body.appendChild(emergencyBtn);
        emergencyBtn.style.position = 'fixed';
        emergencyBtn.style.top = '20px';
        emergencyBtn.style.right = '20px';
        emergencyBtn.style.zIndex = '99999';
        console.log('✅ Botão de emergência inserido como overlay');
    }
    
    return emergencyBtn;
};

// Função para ativar botão de emergência se o normal não funcionar
window.activateEmergencyButton = function() {
    console.log('🚨 === ATIVANDO BOTÃO DE EMERGÊNCIA ===');
    
    // Verificar se o botão normal funciona
    const normalBtn = document.getElementById('facebookLoginBtn');
    if (normalBtn) {
        console.log('🧪 Testando botão normal...');
        
        // Verificar se tem event listeners
        const hasListeners = normalBtn.onclick || 
                            (normalBtn.addEventListener && normalBtn.constructor.name !== 'HTMLButtonElement');
        
        if (!hasListeners) {
            console.log('⚠️ Botão normal sem listeners - criando emergência');
            createEmergencyFacebookButton();
        } else {
            console.log('✅ Botão normal parece funcional');
        }
    } else {
        console.log('❌ Botão normal não encontrado - criando emergência');
        createEmergencyFacebookButton();
    }
};

console.log('🚨 Sistema de emergência carregado!');
console.log('');
console.log('📋 COMANDOS DE EMERGÊNCIA:');
console.log('• createEmergencyFacebookButton() - Criar botão que sempre funciona');
console.log('• activateEmergencyButton() - Ativar se necessário');
console.log('');
console.log('💡 Execute activateEmergencyButton() se o botão não funcionar!');