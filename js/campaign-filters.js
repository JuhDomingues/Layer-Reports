// Sistema de filtros de campanhas
window.CampaignFilters = {
    
    currentFilters: {
        status: 'all',
        dateRange: '30',
        minSpend: '',
        maxSpend: '',
        minCTR: '',
        maxCTR: '',
        minConversions: '',
        searchText: '',
        sortBy: 'name',
        sortOrder: 'asc'
    },
    
    originalCampaigns: [],
    filteredCampaigns: [],
    
    // Inicializar sistema de filtros
    init() {
        console.log('🔍 === INICIALIZANDO SISTEMA DE FILTROS ===');
        this.createFilterInterface();
        this.setupEventListeners();
    },
    
    // Criar interface de filtros
    createFilterInterface() {
        // Verificar se já existe
        if (document.getElementById('campaign-filters')) {
            return;
        }
        
        const filtersHTML = `
            <div id="campaign-filters" style="
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                margin-bottom: 20px;
                display: none;
            ">
                <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #374151; display: flex; align-items: center; gap: 8px;">
                        🔍 Filtros de Campanhas
                    </h3>
                    <button id="toggle-filters" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Ocultar</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <!-- Status -->
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Status:</label>
                        <select id="filter-status" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="all">Todos</option>
                            <option value="ACTIVE">Ativas</option>
                            <option value="PAUSED">Pausadas</option>
                            <option value="ARCHIVED">Arquivadas</option>
                        </select>
                    </div>
                    
                    <!-- Período -->
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Período:</label>
                        <select id="filter-date-range" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="7">Últimos 7 dias</option>
                            <option value="30" selected>Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>
                    
                    <!-- Gasto -->
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Gasto (min):</label>
                        <input type="number" id="filter-min-spend" placeholder="R$ 0" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Gasto (max):</label>
                        <input type="number" id="filter-max-spend" placeholder="R$ 999999" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                    
                    <!-- CTR -->
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">CTR min (%):</label>
                        <input type="number" id="filter-min-ctr" placeholder="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                    
                    <!-- Conversões -->
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Conversões min:</label>
                        <input type="number" id="filter-min-conversions" placeholder="0" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                    </div>
                </div>
                
                <!-- Busca por nome -->
                <div style="margin-top: 15px;">
                    <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Buscar por nome:</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="filter-search" placeholder="Nome da campanha..." style="
                            flex: 1; 
                            padding: 8px; 
                            border: 1px solid #d1d5db; 
                            border-radius: 6px;
                        ">
                        <button id="clear-filters" style="
                            background: #ef4444;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Limpar</button>
                    </div>
                </div>
                
                <!-- Ordenação -->
                <div style="margin-top: 15px; display: flex; gap: 10px; align-items: end;">
                    <div style="flex: 1;">
                        <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Ordenar por:</label>
                        <select id="filter-sort" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                            <option value="name">Nome</option>
                            <option value="spend">Gasto</option>
                            <option value="impressions">Impressões</option>
                            <option value="clicks">Cliques</option>
                            <option value="ctr">CTR</option>
                            <option value="conversions">Conversões</option>
                        </select>
                    </div>
                    <button id="sort-order" data-order="asc" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">↑ ASC</button>
                </div>
            </div>
        `;
        
        // Inserir depois do header
        const mainContent = document.querySelector('.main-content') || document.querySelector('.dashboard');
        if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', filtersHTML);
        }
    },
    
    // Configurar event listeners
    setupEventListeners() {
        // Toggle filtros
        const toggleBtn = document.getElementById('toggle-filters');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', this.toggleFilters.bind(this));
        }
        
        // Filtros
        const filterElements = [
            'filter-status',
            'filter-date-range', 
            'filter-min-spend',
            'filter-max-spend',
            'filter-min-ctr',
            'filter-min-conversions',
            'filter-search',
            'filter-sort'
        ];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', this.applyFilters.bind(this));
                if (element.type === 'text' || element.type === 'number') {
                    element.addEventListener('keyup', this.debounceFilter.bind(this));
                }
            }
        });
        
        // Limpar filtros
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', this.clearAllFilters.bind(this));
        }
        
        // Ordenação
        const sortOrderBtn = document.getElementById('sort-order');
        if (sortOrderBtn) {
            sortOrderBtn.addEventListener('click', this.toggleSortOrder.bind(this));
        }
        
        console.log('✅ Event listeners configurados');
    },
    
    // Toggle visibilidade dos filtros
    toggleFilters() {
        const filtersDiv = document.getElementById('campaign-filters');
        const toggleBtn = document.getElementById('toggle-filters');
        
        if (!filtersDiv) return;
        
        const isHidden = filtersDiv.style.display === 'none';
        filtersDiv.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? 'Ocultar' : 'Mostrar Filtros';
        
        console.log(`🔍 Filtros ${isHidden ? 'exibidos' : 'ocultados'}`);
    },
    
    // Debounce para campos de texto
    debounceFilter() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.applyFilters();
        }, 500);
    },
    
    // Aplicar filtros
    applyFilters() {
        if (!window.metaAdsApp || !window.metaAdsApp.data || !window.metaAdsApp.data.campaigns) {
            console.warn('⚠️ Dados de campanhas não disponíveis para filtrar');
            return;
        }
        
        // Capturar valores dos filtros
        this.currentFilters = {
            status: document.getElementById('filter-status')?.value || 'all',
            dateRange: document.getElementById('filter-date-range')?.value || '30',
            minSpend: parseFloat(document.getElementById('filter-min-spend')?.value) || 0,
            maxSpend: parseFloat(document.getElementById('filter-max-spend')?.value) || Infinity,
            minCTR: parseFloat(document.getElementById('filter-min-ctr')?.value) || 0,
            minConversions: parseInt(document.getElementById('filter-min-conversions')?.value) || 0,
            searchText: document.getElementById('filter-search')?.value.toLowerCase() || '',
            sortBy: document.getElementById('filter-sort')?.value || 'name',
            sortOrder: document.getElementById('sort-order')?.dataset.order || 'asc'
        };
        
        console.log('🔍 Aplicando filtros:', this.currentFilters);
        
        // Filtrar campanhas
        const campaigns = window.metaAdsApp.data.campaigns;
        this.filteredCampaigns = campaigns.filter(campaign => {
            // Filtro por status
            if (this.currentFilters.status !== 'all' && campaign.status !== this.currentFilters.status) {
                return false;
            }
            
            // Filtro por gasto
            const spend = parseFloat(campaign.spend) || 0;
            if (spend < this.currentFilters.minSpend || spend > this.currentFilters.maxSpend) {
                return false;
            }
            
            // Filtro por CTR
            const ctr = parseFloat(campaign.ctr) || 0;
            if (ctr < this.currentFilters.minCTR) {
                return false;
            }
            
            // Filtro por conversões
            const conversions = parseInt(campaign.conversions) || 0;
            if (conversions < this.currentFilters.minConversions) {
                return false;
            }
            
            // Filtro por nome
            if (this.currentFilters.searchText && 
                !campaign.name.toLowerCase().includes(this.currentFilters.searchText)) {
                return false;
            }
            
            return true;
        });
        
        // Ordenar campanhas
        this.sortCampaigns();
        
        // Atualizar contadores
        this.updateFilterStats();
        
        // Atualizar tabela
        this.updateCampaignsTable();
        
        console.log(`✅ Filtros aplicados: ${this.filteredCampaigns.length} de ${campaigns.length} campanhas`);
    },
    
    // Ordenar campanhas
    sortCampaigns() {
        const { sortBy, sortOrder } = this.currentFilters;
        
        this.filteredCampaigns.sort((a, b) => {
            let valueA = a[sortBy];
            let valueB = b[sortBy];
            
            // Tratar valores numéricos
            if (['spend', 'impressions', 'clicks', 'ctr', 'conversions'].includes(sortBy)) {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            }
            
            // Ordenar
            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    },
    
    // Toggle ordem de ordenação
    toggleSortOrder() {
        const btn = document.getElementById('sort-order');
        if (!btn) return;
        
        const currentOrder = btn.dataset.order;
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        
        btn.dataset.order = newOrder;
        btn.innerHTML = newOrder === 'asc' ? '↑ ASC' : '↓ DESC';
        
        this.applyFilters();
    },
    
    // Atualizar estatísticas dos filtros
    updateFilterStats() {
        // Criar/atualizar div de estatísticas
        let statsDiv = document.getElementById('filter-stats');
        if (!statsDiv) {
            statsDiv = document.createElement('div');
            statsDiv.id = 'filter-stats';
            statsDiv.style.cssText = `
                background: #f3f4f6;
                padding: 10px 15px;
                border-radius: 8px;
                margin: 10px 0;
                font-size: 14px;
                color: #374151;
            `;
            
            const filtersDiv = document.getElementById('campaign-filters');
            if (filtersDiv) {
                filtersDiv.insertAdjacentElement('afterend', statsDiv);
            }
        }
        
        const total = window.metaAdsApp?.data?.campaigns?.length || 0;
        const filtered = this.filteredCampaigns.length;
        
        // Calcular totais dos filtrados
        const totalSpend = this.filteredCampaigns.reduce((sum, c) => sum + (parseFloat(c.spend) || 0), 0);
        const totalConversions = this.filteredCampaigns.reduce((sum, c) => sum + (parseInt(c.conversions) || 0), 0);
        
        statsDiv.innerHTML = `
            📊 <strong>${filtered}</strong> de <strong>${total}</strong> campanhas | 
            💰 Gasto total: <strong>${window.metaAdsApp?.formatCurrency?.(totalSpend) || 'R$ ' + totalSpend.toFixed(2)}</strong> | 
            🎯 Conversões: <strong>${totalConversions}</strong>
        `;
    },
    
    // Atualizar tabela de campanhas
    updateCampaignsTable() {
        if (!window.metaAdsApp || !window.metaAdsApp.updateCampaignsTable) {
            console.warn('⚠️ Método updateCampaignsTable não disponível');
            return;
        }
        
        // Temporariamente substituir os dados
        const originalCampaigns = window.metaAdsApp.data.campaigns;
        window.metaAdsApp.data.campaigns = this.filteredCampaigns;
        
        // Atualizar tabela
        window.metaAdsApp.updateCampaignsTable();
        
        // Restaurar dados originais
        window.metaAdsApp.data.campaigns = originalCampaigns;
    },
    
    // Limpar todos os filtros
    clearAllFilters() {
        document.getElementById('filter-status').value = 'all';
        document.getElementById('filter-date-range').value = '30';
        document.getElementById('filter-min-spend').value = '';
        document.getElementById('filter-max-spend').value = '';
        document.getElementById('filter-min-ctr').value = '';
        document.getElementById('filter-min-conversions').value = '';
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-sort').value = 'name';
        
        const sortBtn = document.getElementById('sort-order');
        if (sortBtn) {
            sortBtn.dataset.order = 'asc';
            sortBtn.innerHTML = '↑ ASC';
        }
        
        this.applyFilters();
        console.log('🧹 Filtros limpos');
    },
    
    // Mostrar filtros automaticamente
    show() {
        const filtersDiv = document.getElementById('campaign-filters');
        const toggleBtn = document.getElementById('toggle-filters');
        
        if (filtersDiv) {
            filtersDiv.style.display = 'block';
            if (toggleBtn) {
                toggleBtn.textContent = 'Ocultar';
            }
        }
    },
    
    // Salvar filtros no localStorage
    saveFilters() {
        localStorage.setItem('campaign_filters', JSON.stringify(this.currentFilters));
    },
    
    // Carregar filtros do localStorage
    loadSavedFilters() {
        const saved = localStorage.getItem('campaign_filters');
        if (saved) {
            try {
                this.currentFilters = { ...this.currentFilters, ...JSON.parse(saved) };
                this.restoreFilterUI();
            } catch (error) {
                console.warn('⚠️ Erro ao carregar filtros salvos:', error);
            }
        }
    },
    
    // Restaurar interface com filtros salvos
    restoreFilterUI() {
        const filters = this.currentFilters;
        
        const elements = {
            'filter-status': filters.status,
            'filter-date-range': filters.dateRange,
            'filter-min-spend': filters.minSpend || '',
            'filter-max-spend': filters.maxSpend === Infinity ? '' : filters.maxSpend,
            'filter-min-ctr': filters.minCTR || '',
            'filter-min-conversions': filters.minConversions || '',
            'filter-search': filters.searchText,
            'filter-sort': filters.sortBy
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
        
        const sortBtn = document.getElementById('sort-order');
        if (sortBtn) {
            sortBtn.dataset.order = filters.sortOrder;
            sortBtn.innerHTML = filters.sortOrder === 'asc' ? '↑ ASC' : '↓ DESC';
        }
    }
};

// Funções globais de conveniência
window.showCampaignFilters = function() {
    CampaignFilters.init();
    CampaignFilters.show();
};

window.applyCampaignFilters = function() {
    CampaignFilters.applyFilters();
};

window.clearCampaignFilters = function() {
    CampaignFilters.clearAllFilters();
};

// Inicializar quando dados forem carregados
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar dados serem carregados
    const checkData = setInterval(() => {
        if (window.metaAdsApp && window.metaAdsApp.data && window.metaAdsApp.data.campaigns) {
            clearInterval(checkData);
            setTimeout(() => {
                CampaignFilters.init();
                CampaignFilters.loadSavedFilters();
            }, 2000);
        }
    }, 1000);
});

console.log('🔍 Campaign Filters carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• showCampaignFilters() - Mostrar interface de filtros');
console.log('• applyCampaignFilters() - Aplicar filtros atuais');
console.log('• clearCampaignFilters() - Limpar todos os filtros');