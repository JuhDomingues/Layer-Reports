// Script para gerenciar botões integrados no cabeçalho
(function() {
    'use strict';
    
    console.log('🎯 === BOTÕES DO CABEÇALHO ===');
    
    // Configurar botões do cabeçalho
    function setupHeaderButtons() {
        setupAccountSelectorButton();
        setupFiltersButton();
    }
    
    // Configurar botão de seleção de contas
    function setupAccountSelectorButton() {
        const btn = document.getElementById('accountSelectorHeaderBtn');
        if (!btn) {
            console.warn('⚠️ Botão de seleção de contas não encontrado');
            return;
        }
        
        // Atualizar texto baseado na conta selecionada
        updateAccountButtonText(btn);
        
        // Ação do clique
        btn.addEventListener('click', function() {
            console.log('🏢 Abrindo seletor de contas...');
            
            if (window.BusinessManagerSelector) {
                window.BusinessManagerSelector.showBusinessManagerSelector();
            } else if (window.AccountManager) {
                window.AccountManager.showAccountSelection();
            } else {
                // Simular funcionamento básico
                showAccountSelector();
            }
        });
        
        console.log('✅ Botão de seleção de contas configurado');
    }
    
    // Configurar botão de filtros
    function setupFiltersButton() {
        const btn = document.getElementById('filtersHeaderBtn');
        if (!btn) {
            console.warn('⚠️ Botão de filtros não encontrado');
            return;
        }
        
        // Atualizar contador de filtros
        updateFiltersButtonText(btn);
        
        // Ação do clique
        btn.addEventListener('click', function() {
            console.log('🔍 Abrindo filtros...');
            
            if (window.CampaignFilters) {
                window.CampaignFilters.show();
            } else {
                // Simular funcionamento básico
                showFilters();
            }
        });
        
        console.log('✅ Botão de filtros configurado');
    }
    
    // Atualizar texto do botão de contas
    function updateAccountButtonText(btn) {
        const selectedAccountName = localStorage.getItem('selected_account_name');
        const selectedBM = localStorage.getItem('selected_business_manager');
        
        if (selectedAccountName) {
            let displayText = selectedAccountName;
            
            // Se for a configuração fixa da Layer Reports
            if (selectedAccountName.includes('Layer Reports') || selectedAccountName === 'Conta Principal - Layer Reports') {
                displayText = 'Dr. Santiago Vecina - Layer Reports';
            }
            
            // Limitar tamanho do texto
            if (displayText.length > 25) {
                displayText = displayText.substring(0, 25) + '...';
            }
            
            btn.innerHTML = `<i class="fas fa-building"></i><span>${displayText}</span>`;
        } else {
            // Usar configuração padrão
            btn.innerHTML = '<i class="fas fa-building"></i><span>Dr. Santiago Vecina - Layer Reports</span>';
        }
    }
    
    // Atualizar contador de filtros
    function updateFiltersButtonText(btn) {
        let filterCount = 0;
        
        // Contar campanhas se disponível
        if (window.metaAdsApp && window.metaAdsApp.data && window.metaAdsApp.data.campaigns) {
            filterCount = window.metaAdsApp.data.campaigns.length;
        } else {
            // Valor padrão
            filterCount = 6;
        }
        
        btn.innerHTML = `<i class="fas fa-filter"></i><span>Filtros (${filterCount})</span>`;
    }
    
    // Simular seletor de contas básico
    function showAccountSelector() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 400px;
                width: 90%;
                text-align: center;
            ">
                <h3 style="margin-bottom: 1rem; color: #374151;">Seletor de Contas</h3>
                <p style="margin-bottom: 1.5rem; color: #6b7280;">
                    Conta atual: Dr. Santiago Vecina - Layer Reports
                </p>
                <button onclick="this.closest('.modal').remove()" style="
                    background: #1877f2;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Fechar</button>
            </div>
        `;
        
        modal.className = 'modal';
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }
    
    // Simular filtros básicos
    function showFilters() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                text-align: center;
            ">
                <h3 style="margin-bottom: 1rem; color: #374151;">Filtros de Campanhas</h3>
                <p style="margin-bottom: 1.5rem; color: #6b7280;">
                    6 campanhas encontradas com os filtros atuais
                </p>
                <div style="margin-bottom: 1.5rem; text-align: left;">
                    <label style="display: block; margin-bottom: 0.5rem; color: #374151;">
                        <input type="checkbox" checked> Campanhas Ativas
                    </label>
                    <label style="display: block; margin-bottom: 0.5rem; color: #374151;">
                        <input type="checkbox" checked> Conversões > 0
                    </label>
                    <label style="display: block; margin-bottom: 0.5rem; color: #374151;">
                        <input type="checkbox"> Pausadas
                    </label>
                </div>
                <button onclick="this.closest('.modal').remove()" style="
                    background: #f59e0b;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                    margin-right: 0.5rem;
                ">Aplicar Filtros</button>
                <button onclick="this.closest('.modal').remove()" style="
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Fechar</button>
            </div>
        `;
        
        modal.className = 'modal';
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }
    
    // Monitorar mudanças nos dados
    function monitorDataChanges() {
        // Atualizar botões quando dados mudarem
        setInterval(() => {
            const accountBtn = document.getElementById('accountSelectorHeaderBtn');
            const filtersBtn = document.getElementById('filtersHeaderBtn');
            
            if (accountBtn) updateAccountButtonText(accountBtn);
            if (filtersBtn) updateFiltersButtonText(filtersBtn);
        }, 5000);
        
        // Escutar mudanças no localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'selected_account_name' || e.key === 'selected_business_manager') {
                const accountBtn = document.getElementById('accountSelectorHeaderBtn');
                if (accountBtn) updateAccountButtonText(accountBtn);
            }
        });
    }
    
    // Inicializar
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    setupHeaderButtons();
                    monitorDataChanges();
                }, 1000);
            });
        } else {
            setTimeout(() => {
                setupHeaderButtons();
                monitorDataChanges();
            }, 1000);
        }
    }
    
    // Funções globais
    window.updateHeaderButtons = function() {
        const accountBtn = document.getElementById('accountSelectorHeaderBtn');
        const filtersBtn = document.getElementById('filtersHeaderBtn');
        
        if (accountBtn) updateAccountButtonText(accountBtn);
        if (filtersBtn) updateFiltersButtonText(filtersBtn);
    };
    
    init();
    
    console.log('🎯 Botões do cabeçalho configurados');
    
})();