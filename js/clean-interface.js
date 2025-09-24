// Script para limpar interface - remover elementos de login desnecessários
(function() {
    'use strict';
    
    console.log('🧹 === LIMPANDO INTERFACE ===');
    
    // Função para ocultar elementos de login
    function hideLoginElements() {
        // Botões de Facebook login
        const facebookBtn = document.getElementById('facebookLoginBtn');
        if (facebookBtn) {
            facebookBtn.style.display = 'none';
            console.log('✅ Botão Facebook ocultado');
        }
        
        // Outros botões de login que possam ter sido criados
        const loginButtons = document.querySelectorAll('[id*="facebook"], [class*="facebook-login"], [id*="login"]');
        loginButtons.forEach(btn => {
            if (btn.innerHTML && (btn.innerHTML.includes('Facebook') || btn.innerHTML.includes('Login'))) {
                btn.style.display = 'none';
                console.log('✅ Botão de login ocultado:', btn.id || btn.className);
            }
        });
        
        // Instruções de conexão
        const instructions = document.querySelectorAll('[class*="instruction"], [class*="connect"]');
        instructions.forEach(element => {
            if (element.textContent && 
                (element.textContent.includes('Conectar') || 
                 element.textContent.includes('Login') ||
                 element.textContent.includes('Facebook'))) {
                element.style.display = 'none';
                console.log('✅ Instrução ocultada');
            }
        });
        
        // Status de conexão - alterar para mostrar "Conectado"
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator real-connected';
        }
        
        if (statusText) {
            statusText.textContent = 'Conectado via Token';
            statusText.style.color = '#10b981';
        }
        
        // Ocultar notificações de conexão
        const notifications = document.querySelectorAll('[class*="notification"], [class*="alert"]');
        notifications.forEach(notification => {
            if (notification.textContent && 
                notification.textContent.includes('Conectar Facebook')) {
                notification.style.display = 'none';
                console.log('✅ Notificação de conexão ocultada');
            }
        });
    }
    
    // Função para mostrar status premium
    function showPremiumStatus() {
        // Criar indicador de status premium
        const existingStatus = document.getElementById('premium-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const premiumStatus = document.createElement('div');
        premiumStatus.id = 'premium-status';
        premiumStatus.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: linear-gradient(135deg, #10b981, #059669) !important;
            color: white !important;
            padding: 8px 16px !important;
            border-radius: 20px !important;
            font-size: 12px !important;
            font-weight: bold !important;
            z-index: 999999 !important;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3) !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
        `;
        
        premiumStatus.innerHTML = '🚀 Modo Premium Ativo';
        
        // Verificar se tem token válido
        const hasToken = localStorage.getItem('facebook_access_token');
        const apiMode = localStorage.getItem('api_mode');
        
        if (hasToken && apiMode === 'real') {
            document.body.appendChild(premiumStatus);
            console.log('✅ Status premium exibido');
        }
    }
    
    // Função para simplificar header
    function simplifyHeader() {
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            // Manter apenas elementos essenciais
            const children = Array.from(headerRight.children);
            children.forEach(child => {
                if (child.textContent && 
                    (child.textContent.includes('Conectar') || 
                     child.textContent.includes('Login'))) {
                    child.style.display = 'none';
                }
            });
            
            console.log('✅ Header simplificado');
        }
    }
    
    // Função para remover modais de instrução
    function removeInstructionModals() {
        // Remover modais que possam aparecer
        const modals = document.querySelectorAll('[id*="modal"], [class*="modal"]');
        modals.forEach(modal => {
            if (modal.textContent && 
                (modal.textContent.includes('Configure') || 
                 modal.textContent.includes('Facebook'))) {
                modal.remove();
                console.log('✅ Modal de instrução removido');
            }
        });
    }
    
    // Executar limpeza quando DOM estiver pronto
    function executeCleanup() {
        hideLoginElements();
        showPremiumStatus();
        simplifyHeader();
        removeInstructionModals();
        
        console.log('✅ Interface limpa - modo token direto');
    }
    
    // Executar limpeza periodicamente para elementos dinâmicos
    function startPeriodicCleanup() {
        // Limpeza inicial
        executeCleanup();
        
        // Limpeza a cada 3 segundos para elementos que aparecem dinamicamente
        setInterval(() => {
            hideLoginElements();
            removeInstructionModals();
        }, 3000);
        
        // Monitorar mudanças no localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'api_mode' || e.key === 'facebook_access_token') {
                setTimeout(executeCleanup, 1000);
            }
        });
        
        console.log('🔄 Limpeza periódica ativada');
    }
    
    // Aguardar carregamento e executar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startPeriodicCleanup, 2000);
        });
    } else {
        setTimeout(startPeriodicCleanup, 2000);
    }
    
    // Função global para limpeza manual
    window.cleanInterface = function() {
        console.log('🧹 Executando limpeza manual...');
        executeCleanup();
    };
    
    console.log('🧹 Sistema de limpeza de interface carregado');
    console.log('💡 Execute cleanInterface() para limpeza manual');
    
})();