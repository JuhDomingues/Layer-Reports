// Fix imediato e definitivo para o botão do Facebook
(function() {
    'use strict';
    
    console.log('🚨 === FIX IMEDIATO DO BOTÃO FACEBOOK ===');
    
    // Função para garantir que o botão funcione
    function ensureButtonWorks() {
        const loginBtn = document.getElementById('facebookLoginBtn');
        
        if (!loginBtn) {
            console.log('⏳ Botão não encontrado, aguardando...');
            return false;
        }
        
        console.log('🔧 Configurando botão Facebook...');
        
        // Remover todos os event listeners existentes
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        
        // Garantir visibilidade
        newBtn.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
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
            z-index: 1000 !important;
            pointer-events: auto !important;
        `;
        
        // Adicionar novo event listener que funciona
        newBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🖱️ CLIQUE DETECTADO NO BOTÃO FACEBOOK!');
            
            // Se o app não está carregado, usar login simples
            if (!window.metaAdsApp) {
                console.log('⚠️ App principal não carregado - usando login simples');
                
                // Usar o sistema de login simples
                if (window.simpleFacebookLogin) {
                    try {
                        const result = await window.simpleFacebookLogin();
                        if (result.success) {
                            console.log('✅ Login simples bem-sucedido!');
                            return;
                        }
                    } catch (error) {
                        console.error('❌ Erro no login simples:', error);
                    }
                } else {
                    console.error('❌ Sistema de login simples não disponível');
                    alert('Sistema de login não disponível. Recarregue a página.');
                }
                return;
            }
            
            const app = window.metaAdsApp;
            
            try {
                // Desabilitar botão temporariamente
                newBtn.disabled = true;
                newBtn.textContent = 'Conectando...';
                
                console.log('🔄 Iniciando processo de login...');
                
                // Garantir modo real
                app.api.setMode('real');
                console.log('✅ Modo definido para real');
                
                // Inicializar SDK se necessário
                if (typeof window.FB === 'undefined') {
                    console.log('📦 Carregando Facebook SDK...');
                    await app.api.initFacebookSDK();
                    console.log('✅ SDK carregado');
                }
                
                // Fazer login
                console.log('🔑 Iniciando login...');
                const result = await app.api.loginWithFacebook();
                
                console.log('📊 Resultado do login:', result);
                
                if (result && result.success) {
                    console.log('🎉 Login bem-sucedido!');
                    
                    // Atualizar estado da aplicação
                    app.isAuthenticated = true;
                    app.api.connectionStatus = 'connected';
                    
                    // Atualizar UI
                    app.updateUIForMode('real');
                    
                    // Mostrar sucesso
                    if (app.showSuccess) {
                        app.showSuccess(`Bem-vindo, ${result.user?.name}!`);
                    }
                    
                    // Carregar dados reais
                    if (app.loadRealData) {
                        await app.loadRealData();
                    }
                    
                } else {
                    console.error('❌ Login falhou:', result);
                    
                    let errorMsg = 'Erro ao conectar com Facebook';
                    if (result && result.message) {
                        errorMsg = result.message;
                    }
                    
                    alert(`Erro: ${errorMsg}`);
                }
                
            } catch (error) {
                console.error('❌ Erro durante login:', error);
                alert(`Erro: ${error.message}`);
            } finally {
                // Reabilitar botão
                newBtn.disabled = false;
                newBtn.innerHTML = '<i class="fab fa-facebook-f"></i> <span>Conectar Facebook</span>';
            }
        });
        
        console.log('✅ Botão Facebook configurado e funcionando!');
        return true;
    }
    
    // Função para monitorar mudanças de modo
    function setupModeMonitoring() {
        const apiModeSelect = document.getElementById('apiMode');
        if (!apiModeSelect) return;
        
        // Observer para mudanças no select
        apiModeSelect.addEventListener('change', function(e) {
            console.log(`🔄 Modo mudou para: ${e.target.value}`);
            
            if (e.target.value === 'real') {
                setTimeout(() => {
                    ensureButtonWorks();
                }, 500);
            }
        });
        
        // Verificar modo inicial
        if (apiModeSelect.value === 'real') {
            setTimeout(() => {
                ensureButtonWorks();
            }, 1000);
        }
    }
    
    // Tentar configurar quando possível
    function init() {
        let attempts = 0;
        const maxAttempts = 100; // 10 segundos
        
        const interval = setInterval(() => {
            attempts++;
            
            if (ensureButtonWorks()) {
                clearInterval(interval);
                setupModeMonitoring();
                console.log('🎉 Fix aplicado com sucesso!');
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.warn('⚠️ Não foi possível aplicar fix automaticamente');
            }
        }, 100);
    }
    
    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Função global para aplicar fix manualmente
    window.applyButtonFix = function() {
        console.log('🔧 === APLICANDO FIX MANUAL ===');
        
        if (ensureButtonWorks()) {
            setupModeMonitoring();
            console.log('✅ Fix manual aplicado!');
            return true;
        } else {
            console.error('❌ Não foi possível aplicar fix');
            return false;
        }
    };
    
    // Função para testar o botão imediatamente
    window.testButtonNow = function() {
        console.log('🧪 === TESTE IMEDIATO DO BOTÃO ===');
        
        const loginBtn = document.getElementById('facebookLoginBtn');
        if (!loginBtn) {
            console.error('❌ Botão não encontrado');
            return;
        }
        
        console.log('🖱️ Simulando clique...');
        loginBtn.click();
    };
    
    console.log('🚨 Fix imediato carregado!');
    console.log('💡 Se o botão não funcionar, execute: applyButtonFix()');
    
})();