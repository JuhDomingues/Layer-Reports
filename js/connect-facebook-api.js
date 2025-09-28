// Script para conectar com a API real do Facebook
(function() {
    'use strict';
    
    console.log('🔗 === CONECTANDO COM API REAL DO FACEBOOK ===');
    
    // Configurar para API real
    function connectToFacebookAPI() {
        console.log('🎯 Configurando conexão com API real do Facebook...');
        
        // Desabilitar configuração fixa
        localStorage.removeItem('is_fixed_configuration');
        localStorage.setItem('api_mode', 'real');
        localStorage.setItem('facebook_app_id', '778309504913999');
        
        console.log('✅ Configurações aplicadas:');
        console.log('- Configuração fixa: DESABILITADA');
        console.log('- Modo API: REAL');
        console.log('- App ID: 778309504913999');
        
        // Recarregar a página para aplicar as mudanças
        setTimeout(() => {
            console.log('🔄 Recarregando página para aplicar configurações...');
            window.location.reload();
        }, 1000);
    }
    
    // Verificar status atual
    function checkCurrentStatus() {
        const isFixed = localStorage.getItem('is_fixed_configuration') === 'true';
        const apiMode = localStorage.getItem('api_mode') || 'demo';
        const appId = localStorage.getItem('facebook_app_id') || 'não definido';
        
        console.log('📊 Status atual:');
        console.log('- Configuração fixa:', isFixed ? 'ATIVA' : 'DESATIVADA');
        console.log('- Modo API:', apiMode.toUpperCase());
        console.log('- App ID:', appId);
        
        return { isFixed, apiMode, appId };
    }
    
    // Função global para conectar
    window.connectFacebookAPI = function() {
        checkCurrentStatus();
        connectToFacebookAPI();
    };
    
    // Função global para verificar status
    window.checkFacebookStatus = function() {
        return checkCurrentStatus();
    };
    
    // Auto-executar se parâmetro na URL
    if (window.location.search.includes('connect_facebook=true')) {
        console.log('🚀 Auto-conectando com Facebook API...');
        connectToFacebookAPI();
    }
    
    // Configurar botão no cabeçalho
    function setupHeaderButton() {
        const btn = document.getElementById('facebookConnectBtn');
        if (!btn) {
            console.warn('⚠️ Botão do cabeçalho não encontrado');
            return;
        }
        
        // Verificar status atual
        const status = checkCurrentStatus();
        updateButtonState(btn, status);
        
        // Ação do clique
        btn.addEventListener('click', function() {
            connectToFacebookAPI();
        });
        
        console.log('✅ Botão do cabeçalho configurado');
    }
    
    // Atualizar estado visual do botão
    function updateButtonState(btn, status) {
        if (!btn) return;
        
        if (status.apiMode === 'real' && !status.isFixed) {
            btn.classList.add('connected');
            btn.innerHTML = '<i class="fab fa-facebook-f"></i><span>API Conectada</span>';
        } else {
            btn.classList.remove('connected');
            btn.innerHTML = '<i class="fab fa-facebook-f"></i><span>Conectar API</span>';
        }
    }
    
    // Inicializar quando página carregar
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(setupHeaderButton, 1000);
            });
        } else {
            setTimeout(setupHeaderButton, 1000);
        }
    }
    
    init();
    
    console.log('🔗 Script de conexão Facebook carregado');
    console.log('💡 Use: connectFacebookAPI() para conectar');
    console.log('💡 Use: checkFacebookStatus() para verificar status');
    
})();