// Inicialização limpa que prioriza o sistema simples
(function() {
    'use strict';
    
    console.log('🧹 === INICIALIZAÇÃO LIMPA ===');
    
    // Aguardar carregamento completo
    function waitForLoad() {
        return new Promise((resolve) => {
            const check = () => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    }
    
    async function init() {
        await waitForLoad();
        
        console.log('✅ Página carregada');
        
        // Aguardar um pouco para outros scripts carregarem
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se o botão Facebook existe
        const facebookBtn = document.getElementById('facebookLoginBtn');
        const apiModeSelect = document.getElementById('apiMode');
        
        if (!facebookBtn) {
            console.log('❌ Botão Facebook não encontrado');
            return;
        }
        
        if (!apiModeSelect) {
            console.log('❌ Seletor de modo não encontrado');
            return;
        }
        
        console.log('✅ Elementos encontrados');
        
        // Se estiver no modo real, ativar sistema simples
        function checkAndActivateSimpleLogin() {
            if (apiModeSelect.value === 'real') {
                console.log('🎯 Modo real detectado - ativando login simples');
                
                // Se o sistema simples existe, criar botão
                if (window.createSimpleLoginButton) {
                    console.log('📱 Criando botão de login simples...');
                    window.createSimpleLoginButton();
                } else if (window.testFacebookLoginNow) {
                    console.log('🧪 Ativando teste de login...');
                    window.testFacebookLoginNow();
                } else {
                    console.log('⚠️ Sistema simples não encontrado');
                }
            }
        }
        
        // Verificar modo inicial
        checkAndActivateSimpleLogin();
        
        // Monitor mudanças de modo
        apiModeSelect.addEventListener('change', function(e) {
            console.log(`🔄 Modo mudou para: ${e.target.value}`);
            setTimeout(checkAndActivateSimpleLogin, 500);
        });
        
        console.log('✅ Inicialização limpa concluída');
        
        // Disponibilizar função global para ativar manualmente
        window.activateSimpleLogin = function() {
            console.log('🎯 === ATIVAÇÃO MANUAL DO LOGIN SIMPLES ===');
            checkAndActivateSimpleLogin();
        };
    }
    
    // Executar inicialização
    init().catch(error => {
        console.error('❌ Erro na inicialização:', error);
    });
    
    console.log('🧹 Script de inicialização limpa carregado');
    console.log('💡 Execute activateSimpleLogin() para ativar manualmente');
    
})();