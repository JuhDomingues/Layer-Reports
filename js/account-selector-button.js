// Botão para seleção de contas e gerenciadores
(function() {
    'use strict';
    
    console.log('🔘 === BOTÃO SELETOR DE CONTAS ===');
    
    // Criar botão de seleção de contas
    function createAccountSelectorButton() {
        // Remover botão existente
        const existing = document.getElementById('account-selector-btn');
        if (existing) {
            existing.remove();
        }
        
        const btn = document.createElement('button');
        btn.id = 'account-selector-btn';
        btn.innerHTML = '🏢 Selecionar Conta';
        btn.style.cssText = `
            position: fixed !important;
            top: 70px !important;
            right: 20px !important;
            z-index: 999999 !important;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
            color: white !important;
            border: none !important;
            padding: 10px 16px !important;
            border-radius: 20px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            font-weight: bold !important;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3) !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
        `;
        
        // Efeito hover
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
            this.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
        });
        
        // Ação do clique
        btn.addEventListener('click', function() {
            console.log('🏢 Abrindo seletor de contas...');
            
            if (window.BusinessManagerSelector) {
                window.BusinessManagerSelector.showBusinessManagerSelector();
            } else if (window.AccountManager) {
                window.AccountManager.showAccountSelection();
            } else {
                alert('❌ Sistema de seleção não disponível');
            }
        });
        
        document.body.appendChild(btn);
        console.log('✅ Botão seletor de contas criado');
        return btn;
    }
    
    // Atualizar texto do botão baseado na conta selecionada
    function updateButtonText() {
        const btn = document.getElementById('account-selector-btn');
        if (!btn) return;
        
        const selectedAccountName = localStorage.getItem('selected_account_name');
        const selectedBM = localStorage.getItem('selected_business_manager');
        
        if (selectedAccountName) {
            let bmText = '';
            if (selectedBM) {
                try {
                    const bmData = JSON.parse(selectedBM);
                    bmText = ` (${bmData.name})`;
                } catch (e) {}
            }
            
            // Limitar tamanho do texto
            let accountText = selectedAccountName;
            if (accountText.length > 15) {
                accountText = accountText.substring(0, 15) + '...';
            }
            
            btn.innerHTML = `🏢 ${accountText}${bmText}`;
            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        } else {
            btn.innerHTML = '🏢 Selecionar Conta';
            btn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
        }
    }
    
    // Criar indicador de conta ativa
    function createAccountIndicator() {
        const selectedAccountName = localStorage.getItem('selected_account_name');
        const selectedBM = localStorage.getItem('selected_business_manager');
        
        if (!selectedAccountName) return;
        
        // Remover indicador existente
        const existing = document.getElementById('account-indicator');
        if (existing) {
            existing.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'account-indicator';
        indicator.style.cssText = `
            position: fixed !important;
            top: 120px !important;
            right: 20px !important;
            z-index: 999998 !important;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid #e5e7eb !important;
            padding: 12px 16px !important;
            border-radius: 12px !important;
            font-size: 11px !important;
            color: #374151 !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            max-width: 250px !important;
        `;
        
        let bmText = '';
        if (selectedBM) {
            try {
                const bmData = JSON.parse(selectedBM);
                bmText = `<div style="font-weight: bold; color: #1877f2; margin-bottom: 4px;">🏢 ${bmData.name}</div>`;
            } catch (e) {}
        }
        
        indicator.innerHTML = `
            ${bmText}
            <div style="color: #059669; font-weight: bold;">📊 ${selectedAccountName}</div>
            <div style="color: #6b7280; margin-top: 4px;">Conta ativa</div>
        `;
        
        document.body.appendChild(indicator);
        
        // Auto-ocultar após 10 segundos
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0';
                indicator.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.remove();
                    }
                }, 300);
            }
        }, 10000);
    }
    
    // Criar botão quando página carregar
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    createAccountSelectorButton();
                    updateButtonText();
                    createAccountIndicator();
                }, 3000); // Aguardar outros sistemas carregarem
            });
        } else {
            setTimeout(() => {
                createAccountSelectorButton();
                updateButtonText();
                createAccountIndicator();
            }, 3000);
        }
        
        // Monitorar mudanças no localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'selected_account_name' || e.key === 'selected_business_manager') {
                setTimeout(() => {
                    updateButtonText();
                    createAccountIndicator();
                }, 500);
            }
        });
        
        // Verificar periodicamente se conta mudou
        setInterval(() => {
            updateButtonText();
        }, 5000);
    }
    
    // Função global para forçar atualização
    window.updateAccountButton = function() {
        updateButtonText();
        createAccountIndicator();
    };
    
    init();
    
    console.log('🔘 Botão seletor de contas configurado');
    
})();