// Botão de acesso rápido para funcionalidades premium
(function() {
    'use strict';
    
    console.log('🚀 === SISTEMA DE ACESSO RÁPIDO ===');
    
    // Criar botão de acesso premium
    function createPremiumAccessButton() {
        // Remover botão existente
        const existing = document.getElementById('premium-access-btn');
        if (existing) {
            existing.remove();
        }
        
        const btn = document.createElement('button');
        btn.id = 'premium-access-btn';
        btn.innerHTML = '🔑 Liberar Funcionalidades';
        btn.style.cssText = `
            position: fixed !important;
            top: 20px !important;
            left: 20px !important;
            z-index: 999999 !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border: none !important;
            padding: 12px 20px !important;
            border-radius: 25px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            font-weight: bold !important;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4) !important;
            transition: all 0.3s ease !important;
        `;
        
        // Efeito hover
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        });
        
        // Ação do clique
        btn.addEventListener('click', function() {
            console.log('🔑 Ativando funcionalidades premium...');
            
            // Verificar se já tem token
            const hasToken = localStorage.getItem('facebook_access_token');
            
            if (hasToken) {
                // Já tem token, apenas ativar
                if (window.TokenManager) {
                    window.TokenManager.activateRealMode();
                } else {
                    activateRealMode();
                }
            } else {
                // Não tem token, configurar automaticamente
                if (window.TokenManager) {
                    window.TokenManager.setupToken();
                } else {
                    setupToken();
                }
            }
            
            // Mudar aparência do botão
            this.innerHTML = '✅ Ativado';
            this.style.background = 'linear-gradient(135deg, #42b883 0%, #27ae60 100%)';
            
            setTimeout(() => {
                this.innerHTML = '🚀 Modo Premium';
                this.style.background = 'linear-gradient(135deg, #42b883 0%, #27ae60 100%)';
            }, 2000);
        });
        
        document.body.appendChild(btn);
        console.log('✅ Botão de acesso premium criado');
        return btn;
    }
    
    // Verificar status do token e atualizar botão
    function updateButtonStatus() {
        const btn = document.getElementById('premium-access-btn');
        if (!btn) return;
        
        const hasToken = localStorage.getItem('facebook_access_token');
        const apiMode = localStorage.getItem('api_mode');
        
        if (hasToken && apiMode === 'real') {
            btn.innerHTML = '🚀 Modo Premium';
            btn.style.background = 'linear-gradient(135deg, #42b883 0%, #27ae60 100%)';
        } else {
            btn.innerHTML = '🔑 Liberar Funcionalidades';
            btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }
    
    // Criar botão quando página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                createPremiumAccessButton();
                updateButtonStatus();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            createPremiumAccessButton();
            updateButtonStatus();
        }, 1000);
    }
    
    // Monitorar mudanças no localStorage
    window.addEventListener('storage', updateButtonStatus);
    
    // Verificar periodicamente
    setInterval(updateButtonStatus, 5000);
    
    console.log('🚀 Sistema de acesso rápido configurado');
    
})();