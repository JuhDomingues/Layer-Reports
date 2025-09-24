// Botão para ativar filtros de campanhas
(function() {
    'use strict';
    
    console.log('🔽 === BOTÃO DE FILTROS ===');
    
    // Criar botão de filtros
    function createFilterButton() {
        // Remover botão existente
        const existing = document.getElementById('campaign-filter-btn');
        if (existing) {
            existing.remove();
        }
        
        const btn = document.createElement('button');
        btn.id = 'campaign-filter-btn';
        btn.innerHTML = '🔍 Filtros';
        btn.style.cssText = `
            position: fixed !important;
            top: 120px !important;
            right: 20px !important;
            z-index: 999998 !important;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
            color: white !important;
            border: none !important;
            padding: 8px 14px !important;
            border-radius: 18px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            font-weight: bold !important;
            box-shadow: 0 3px 10px rgba(245, 158, 11, 0.3) !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            gap: 5px !important;
        `;
        
        // Efeito hover
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
            this.style.boxShadow = '0 5px 15px rgba(245, 158, 11, 0.4)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 3px 10px rgba(245, 158, 11, 0.3)';
        });
        
        // Ação do clique
        btn.addEventListener('click', function() {
            console.log('🔍 Toggling campaign filters...');
            toggleFilters();
        });
        
        document.body.appendChild(btn);
        console.log('✅ Botão de filtros criado');
        return btn;
    }
    
    // Toggle filtros
    function toggleFilters() {
        const filtersDiv = document.getElementById('campaign-filters');
        const btn = document.getElementById('campaign-filter-btn');
        
        if (!filtersDiv) {
            // Inicializar filtros se não existir
            if (window.CampaignFilters) {
                window.CampaignFilters.init();
                window.CampaignFilters.show();
                
                // Atualizar botão
                if (btn) {
                    btn.innerHTML = '🔍 Ocultar';
                    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                }
            }
            return;
        }
        
        const isVisible = filtersDiv.style.display !== 'none';
        
        if (isVisible) {
            // Ocultar
            filtersDiv.style.display = 'none';
            if (btn) {
                btn.innerHTML = '🔍 Filtros';
                btn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
            }
            console.log('🔍 Filtros ocultados');
        } else {
            // Mostrar
            filtersDiv.style.display = 'block';
            if (btn) {
                btn.innerHTML = '🔍 Ocultar';
                btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            }
            console.log('🔍 Filtros exibidos');
        }
    }
    
    // Atualizar estado do botão baseado nos dados
    function updateButtonState() {
        const btn = document.getElementById('campaign-filter-btn');
        if (!btn) return;
        
        const hasCampaigns = window.metaAdsApp && 
                           window.metaAdsApp.data && 
                           window.metaAdsApp.data.campaigns && 
                           window.metaAdsApp.data.campaigns.length > 0;
        
        if (hasCampaigns) {
            btn.style.display = 'flex';
            
            // Mostrar número de campanhas
            const count = window.metaAdsApp.data.campaigns.length;
            btn.innerHTML = `🔍 Filtros (${count})`;
        } else {
            btn.style.display = 'none';
        }
    }
    
    // Criar indicador de filtros ativos
    function createActiveFiltersIndicator() {
        if (!window.CampaignFilters || !window.CampaignFilters.filteredCampaigns) return;
        
        const total = window.metaAdsApp?.data?.campaigns?.length || 0;
        const filtered = window.CampaignFilters.filteredCampaigns.length;
        
        // Se não há filtros ativos, não mostrar
        if (filtered === total) return;
        
        // Remover indicador existente
        const existing = document.getElementById('active-filters-indicator');
        if (existing) {
            existing.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'active-filters-indicator';
        indicator.style.cssText = `
            position: fixed !important;
            top: 150px !important;
            right: 20px !important;
            z-index: 999997 !important;
            background: rgba(239, 68, 68, 0.9) !important;
            color: white !important;
            padding: 6px 12px !important;
            border-radius: 12px !important;
            font-size: 11px !important;
            font-weight: bold !important;
            backdrop-filter: blur(10px) !important;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3) !important;
        `;
        
        indicator.innerHTML = `🔍 ${filtered}/${total}`;
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.opacity = '0';
                indicator.style.transform = 'translateX(50px)';
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.remove();
                    }
                }, 300);
            }
        }, 5000);
        
        document.body.appendChild(indicator);
    }
    
    // Inicializar
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    createFilterButton();
                    updateButtonState();
                }, 3000);
            });
        } else {
            setTimeout(() => {
                createFilterButton();
                updateButtonState();
            }, 3000);
        }
        
        // Monitorar mudanças nos dados
        setInterval(() => {
            updateButtonState();
        }, 5000);
        
        // Escutar eventos de filtros
        document.addEventListener('campaign-filters-applied', createActiveFiltersIndicator);
    }
    
    // Funções globais
    window.toggleCampaignFilters = function() {
        toggleFilters();
    };
    
    window.updateFilterButton = function() {
        updateButtonState();
        createActiveFiltersIndicator();
    };
    
    init();
    
    console.log('🔽 Botão de filtros configurado');
    
})();