// Meta Ads Insights Dashboard JavaScript - Demo Mode
class MetaAdsInsights {
    constructor() {
        this.charts = {};
        this.currentDateRange = 30;
        this.currentMetric = 'impressions';
        this.currentCampaignFilter = 'all';
        this.data = {};
        this.allCampaigns = [];
        this.api = new MetaAdsAPI();
        this.isAuthenticated = false;
        this.selectedAccountId = null;
        this.businessManagers = [];
        this.availableAccounts = [];
        this.selectedBusinessManagerId = null;
        this.advancedFilters = {
            status: ['ACTIVE'],
            objective: ['CONVERSIONS', 'TRAFFIC'],
            createdAfter: null,
            createdBefore: null,
            minSpend: null,
            maxSpend: null,
            minCTR: null,
            minConversions: null,
            name: '',
            exactMatch: false
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initializeAPIMode();
        await this.checkExistingAuth();
        await this.loadInitialData();
        this.setupCharts();
    }

    async checkExistingAuth() {
        if (this.api.mode === 'real' && this.api.accessToken) {
            try {
                // Try to verify existing token by making a simple API call
                await this.api.initFacebookSDK();
                
                if (window.FB) {
                    FB.api('/me', { 
                        fields: 'name,email,picture',
                        access_token: this.api.accessToken 
                    }, (response) => {
                        if (!response.error) {
                            this.api.user = response;
                            this.isAuthenticated = true;
                            this.api.connectionStatus = 'connected';
                            this.updateUIForMode('real');
                            this.showSuccess(`Bem-vindo de volta, ${response.name}!`);
                        } else {
                            // Token expired or invalid, clear it
                            this.api.logout();
                            this.updateUIForMode('real');
                        }
                    });
                }
            } catch (error) {
                console.error('Error checking existing auth:', error);
                this.api.logout();
            }
        }
    }

    initializeAPIMode() {
        const modeSelect = document.getElementById('apiMode');
        const savedMode = this.api.mode;
        
        if (modeSelect) {
            modeSelect.value = savedMode;
            this.updateUIForMode(savedMode);
        }
    }

    setupEventListeners() {
        // Menu toggle para mobile
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', this.toggleSidebar.bind(this));
        }

        // Date range picker
        const dateRange = document.getElementById('dateRange');
        if (dateRange) {
            dateRange.addEventListener('change', this.handleDateRangeChange.bind(this));
        }

        // Custom date picker
        const applyCustomDate = document.getElementById('applyCustomDate');
        if (applyCustomDate) {
            applyCustomDate.addEventListener('click', this.handleCustomDateApply.bind(this));
        }

        // Campaign filter
        const campaignFilter = document.getElementById('campaignFilter');
        if (campaignFilter) {
            campaignFilter.addEventListener('change', this.handleCampaignFilterChange.bind(this));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshData.bind(this));
        }

        // Chart metric buttons
        const chartBtns = document.querySelectorAll('.chart-btn');
        chartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartMetric(e.target.dataset.metric);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchCampaigns');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }

        // Export button
        const exportBtn = document.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', this.exportData.bind(this));
        }

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        if (prevPage) prevPage.addEventListener('click', () => this.changePage(-1));
        if (nextPage) nextPage.addEventListener('click', () => this.changePage(1));

        // API Mode selector
        const apiMode = document.getElementById('apiMode');
        if (apiMode) {
            apiMode.addEventListener('change', this.handleModeChange.bind(this));
        }

        // Facebook login button
        const facebookLoginBtn = document.getElementById('facebookLoginBtn');
        if (facebookLoginBtn) {
            facebookLoginBtn.addEventListener('click', this.handleFacebookLogin.bind(this));
        }

        // Configuration modal events
        const apiModeIcon = document.querySelector('.api-mode-selector i');
        if (apiModeIcon) {
            apiModeIcon.addEventListener('click', this.openConfigModal.bind(this));
        }

        const closeConfigModal = document.getElementById('closeConfigModal');
        if (closeConfigModal) {
            closeConfigModal.addEventListener('click', this.closeConfigModal.bind(this));
        }

        const saveConfig = document.getElementById('saveConfig');
        if (saveConfig) {
            saveConfig.addEventListener('click', this.saveConfiguration.bind(this));
        }

        const cancelConfig = document.getElementById('cancelConfig');
        if (cancelConfig) {
            cancelConfig.addEventListener('click', this.closeConfigModal.bind(this));
        }

        const testConnectionBtn = document.getElementById('testConnectionBtn');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', this.testConnection.bind(this));
        }

        // Settings navigation link
        const settingsNavLink = document.getElementById('settingsNavLink');
        if (settingsNavLink) {
            settingsNavLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openConfigModal();
            });
        }

        // Advanced filters
        const advancedFiltersBtn = document.getElementById('advancedFiltersBtn');
        if (advancedFiltersBtn) {
            advancedFiltersBtn.addEventListener('click', this.openAdvancedFilters.bind(this));
        }

        const closeAdvancedFilters = document.getElementById('closeAdvancedFilters');
        if (closeAdvancedFilters) {
            closeAdvancedFilters.addEventListener('click', this.closeAdvancedFilters.bind(this));
        }

        const applyAdvancedFilters = document.getElementById('applyAdvancedFilters');
        if (applyAdvancedFilters) {
            applyAdvancedFilters.addEventListener('click', this.applyAdvancedFilters.bind(this));
        }

        const clearAllFilters = document.getElementById('clearAllFilters');
        if (clearAllFilters) {
            clearAllFilters.addEventListener('click', this.clearAllFilters.bind(this));
        }

        // Business Manager and Account selectors
        const businessManagerFilter = document.getElementById('businessManagerFilter');
        if (businessManagerFilter) {
            businessManagerFilter.addEventListener('change', this.handleBusinessManagerChange.bind(this));
        }

        const accountFilter = document.getElementById('accountFilter');
        if (accountFilter) {
            accountFilter.addEventListener('change', this.handleAccountChange.bind(this));
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    }

    showLoading(message = 'Carregando dados dos relatórios...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingText) loadingText.textContent = message;
        loadingOverlay.classList.add('active');
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.remove('active');
        
        // Reset loading text
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = 'Carregando dados dos relatórios...';
    }

    async loadInitialData() {
        this.showLoading();
        
        try {
            // Usar sempre dados demo agora
            await this.sleep(1500);
            this.data = this.generateMockData();
            this.allCampaigns = [...this.data.campaigns];
            this.updateKPIs();
            this.updateCampaignsTable();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Erro ao carregar dados iniciais');
        }
        
        this.hideLoading();
    }

    showError(message) {
        // Create or update error notification
        let errorDiv = document.getElementById('errorNotification');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'errorNotification';
            errorDiv.className = 'error-notification';
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv && errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create or update success notification
        let successDiv = document.getElementById('successNotification');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successNotification';
            successDiv.className = 'success-notification';
            document.body.appendChild(successDiv);
        }
        
        successDiv.innerHTML = `
            <div class="success-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (successDiv && successDiv.parentElement) {
                successDiv.remove();
            }
        }, 3000);
    }

    generateMockData() {
        const campaigns = [
            {
                name: 'Black Friday Sale 2024',
                status: 'active',
                impressions: 125420,
                clicks: 3876,
                ctr: 3.09,
                cpc: 0.85,
                conversions: 156,
                spend: 3294.60
            },
            {
                name: 'Holiday Collection',
                status: 'active',
                impressions: 98765,
                clicks: 2547,
                ctr: 2.58,
                cpc: 1.12,
                conversions: 89,
                spend: 2852.64
            },
            {
                name: 'Summer Campaign',
                status: 'paused',
                impressions: 67890,
                clicks: 1234,
                ctr: 1.82,
                cpc: 1.45,
                conversions: 45,
                spend: 1789.30
            },
            {
                name: 'Brand Awareness',
                status: 'active',
                impressions: 234567,
                clicks: 4321,
                ctr: 1.84,
                cpc: 0.67,
                conversions: 198,
                spend: 2895.07
            },
            {
                name: 'Retargeting Campaign',
                status: 'active',
                impressions: 45678,
                clicks: 2109,
                ctr: 4.62,
                cpc: 1.89,
                conversions: 278,
                spend: 3986.01
            },
            {
                name: 'Product Launch',
                status: 'inactive',
                impressions: 12345,
                clicks: 567,
                ctr: 4.59,
                cpc: 2.15,
                conversions: 67,
                spend: 1218.05
            }
        ];

        // Gerar dados temporais para gráficos
        const timeSeriesData = this.generateTimeSeriesData();

        return {
            campaigns,
            timeSeries: timeSeriesData,
            totals: this.calculateTotals(campaigns)
        };
    }

    generateTimeSeriesData() {
        const days = [];
        const data = {
            impressions: [],
            clicks: [],
            conversions: [],
            spend: []
        };

        for (let i = this.currentDateRange - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }));

            // Gerar dados aleatórios com tendência
            const baseImpression = 15000 + Math.random() * 10000;
            const baseCTR = 0.02 + Math.random() * 0.03;
            const baseConversionRate = 0.03 + Math.random() * 0.02;

            data.impressions.push(Math.floor(baseImpression));
            data.clicks.push(Math.floor(baseImpression * baseCTR));
            data.conversions.push(Math.floor(baseImpression * baseCTR * baseConversionRate));
            data.spend.push(Math.floor(baseImpression * baseCTR * (0.8 + Math.random() * 0.6)));
        }

        return { days, data };
    }

    calculateTotals(campaigns) {
        return campaigns.reduce((acc, campaign) => {
            acc.impressions += campaign.impressions;
            acc.clicks += campaign.clicks;
            acc.conversions += campaign.conversions;
            acc.spend += campaign.spend;
            return acc;
        }, { impressions: 0, clicks: 0, conversions: 0, spend: 0 });
    }

    updateKPIs() {
        const totals = this.data.totals;
        
        // Calcular métricas adicionais
        const roi = ((totals.conversions * 50 - totals.spend) / totals.spend * 100);
        const conversionRate = (totals.conversions / totals.clicks * 100);
        const filteredCampaigns = this.data.campaigns.filter(c => c.status === 'active').length;
        
        // Formatar números
        document.getElementById('totalSpend').textContent = this.formatCurrency(totals.spend);
        document.getElementById('roi').textContent = roi.toFixed(1) + '%';
        document.getElementById('conversions').textContent = this.formatNumber(totals.conversions);
        document.getElementById('conversionRate').textContent = conversionRate.toFixed(2) + '%';
        document.getElementById('impressions').textContent = this.formatNumber(totals.impressions);
        document.getElementById('clicks').textContent = this.formatNumber(totals.clicks);
        document.getElementById('ctr').textContent = ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%';
        document.getElementById('filteredCampaigns').textContent = filteredCampaigns;
    }

    setupCharts() {
        this.setupPerformanceChart();
        this.setupCampaignsChart();
    }

    setupPerformanceChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        
        // Verificar se dados estão inicializados
        if (!this.data || !this.data.timeSeries) {
            console.warn('⚠️ TimeSeries data não inicializado, gerando dados padrão...');
            this.data = this.data || {};
            this.data.timeSeries = this.generateTimeSeriesData();
        }
        
        const timeData = this.data.timeSeries;
        
        // Verificação adicional de segurança
        if (!timeData.days || !timeData.data) {
            console.error('❌ Dados de timeSeries inválidos:', timeData);
            return;
        }

        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData.days,
                datasets: [{
                    label: 'Impressões',
                    data: timeData.data.impressions,
                    borderColor: '#000000',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#000000',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            callback: function(value) {
                                return value >= 1000 ? (value / 1000) + 'K' : value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    setupCampaignsChart() {
        const ctx = document.getElementById('campaignsChart').getContext('2d');
        
        // Verificar se dados estão inicializados
        if (!this.data || !this.data.campaigns) {
            console.warn('⚠️ Campaigns data não inicializado, gerando dados padrão...');
            this.data = this.data || {};
            this.data.campaigns = [];
        }
        
        const activeCampaigns = this.data.campaigns
            .filter(c => c.status === 'active')
            .slice(0, 5);

        this.charts.campaigns = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: activeCampaigns.map(c => c.name),
                datasets: [{
                    data: activeCampaigns.map(c => c.spend),
                    backgroundColor: [
                        '#000000',
                        '#333333',
                        '#666666',
                        '#999999',
                        '#cccccc'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    switchChartMetric(metric) {
        // Atualizar botões ativos
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-metric="${metric}"]`).classList.add('active');

        // Atualizar gráfico
        const chart = this.charts.performance;
        const timeData = this.data.timeSeries;
        
        let label, data, color;
        
        switch (metric) {
            case 'impressions':
                label = 'Impressões';
                data = timeData.data.impressions;
                color = '#000000';
                break;
            case 'clicks':
                label = 'Cliques';
                data = timeData.data.clicks;
                color = '#10b981';
                break;
            case 'conversions':
                label = 'Conversões';
                data = timeData.data.conversions;
                color = '#f59e0b';
                break;
        }

        chart.data.datasets[0].label = label;
        chart.data.datasets[0].data = data;
        chart.data.datasets[0].borderColor = color;
        chart.data.datasets[0].backgroundColor = color + '20';
        chart.data.datasets[0].pointBackgroundColor = color;
        chart.update();
    }

    updateCampaignsTable() {
        const tbody = document.querySelector('#campaignsTable tbody');
        tbody.innerHTML = '';

        this.data.campaigns.forEach((campaign) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${campaign.name}</td>
                <td><span class="status-badge ${campaign.status}">${this.getStatusLabel(campaign.status)}</span></td>
                <td>${this.formatNumber(campaign.impressions)}</td>
                <td>${this.formatNumber(campaign.clicks)}</td>
                <td>${campaign.ctr.toFixed(2)}%</td>
                <td>${this.formatCurrency(campaign.cpc)}</td>
                <td>${campaign.conversions}</td>
                <td>${this.formatCurrency(campaign.spend)}</td>
                <td>
                    <button class="action-btn">Editar</button>
                    <button class="action-btn">Ver</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getStatusLabel(status) {
        const labels = {
            'active': 'Ativo',
            'paused': 'Pausado',
            'inactive': 'Inativo'
        };
        return labels[status] || status;
    }

    handleDateRangeChange(event) {
        const value = event.target.value;
        const customDatePicker = document.getElementById('customDatePicker');
        
        if (value === 'custom') {
            customDatePicker.style.display = 'block';
            // Set default dates (last 30 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
            document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        } else {
            customDatePicker.style.display = 'none';
            this.currentDateRange = parseInt(value);
            this.refreshData();
        }
    }

    handleCampaignFilterChange(event) {
        this.currentCampaignFilter = event.target.value;
        this.applyFilters();
    }

    applyFilters() {
        let filteredCampaigns = [...this.allCampaigns];
        
        // Apply campaign filter
        if (this.currentCampaignFilter !== 'all') {
            filteredCampaigns = filteredCampaigns.filter(campaign => 
                campaign.status === this.currentCampaignFilter
            );
        }
        
        // Update data with filtered campaigns
        this.data.campaigns = filteredCampaigns;
        this.data.totals = this.calculateTotals(filteredCampaigns);
        
        // Update UI
        this.updateKPIs();
        this.updateCampaignsTable();
        this.updateCharts();
    }

    handleCustomDateApply() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('Por favor, selecione ambas as datas');
            return;
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start > end) {
            alert('A data inicial deve ser anterior à data final');
            return;
        }
        
        // Calculate days difference
        const timeDiff = end.getTime() - start.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        this.currentDateRange = daysDiff;
        this.customStartDate = start;
        this.customEndDate = end;
        
        // Hide custom picker
        document.getElementById('customDatePicker').style.display = 'none';
        
        // Update data with custom range
        this.refreshData();
    }

    async refreshData() {
        this.showLoading();
        
        // Simular nova requisição à API
        await this.sleep(1500);
        
        this.data = this.generateMockData();
        this.allCampaigns = [...this.data.campaigns];
        
        // Apply current filters
        this.applyFilters();
        
        this.hideLoading();
    }

    updateCharts() {
        // Verificar se os dados e charts estão inicializados
        if (!this.data || !this.data.timeSeries || !this.charts || !this.charts.performance) {
            console.warn('⚠️ Charts ou dados não inicializados ainda');
            return;
        }
        
        // Atualizar dados do gráfico de performance
        const timeData = this.data.timeSeries;
        if (!timeData.days || !timeData.data) {
            console.warn('⚠️ Time series data inválido:', timeData);
            return;
        }
        
        this.charts.performance.data.labels = timeData.days;
        this.charts.performance.data.datasets[0].data = timeData.data[this.currentMetric];
        this.charts.performance.update();

        // Atualizar gráfico de campanhas
        if (!this.charts.campaigns) {
            console.warn('⚠️ Chart de campanhas não inicializado');
            return;
        }
        
        const activeCampaigns = this.data.campaigns
            .filter(c => c.status === 'active')
            .slice(0, 5);
        
        this.charts.campaigns.data.labels = activeCampaigns.map(c => c.name);
        this.charts.campaigns.data.datasets[0].data = activeCampaigns.map(c => c.spend);
        this.charts.campaigns.update();
    }

    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        const rows = document.querySelectorAll('#campaignsTable tbody tr');

        rows.forEach(row => {
            const campaignName = row.cells[0].textContent.toLowerCase();
            row.style.display = campaignName.includes(searchTerm) ? '' : 'none';
        });
    }

    exportData() {
        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `layer-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    generateCSV() {
        const headers = ['Nome da Campanha', 'Status', 'Impressões', 'Cliques', 'CTR', 'CPC', 'Conversões', 'Gasto'];
        const rows = this.data.campaigns.map(campaign => [
            campaign.name,
            this.getStatusLabel(campaign.status),
            campaign.impressions,
            campaign.clicks,
            campaign.ctr.toFixed(2) + '%',
            this.formatCurrency(campaign.cpc),
            campaign.conversions,
            this.formatCurrency(campaign.spend)
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    changePage(direction) {
        // Implementação básica de paginação (mockada)
        console.log('Mudando página:', direction);
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }


    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Gerenciamento de Modos API
    async handleModeChange(event) {
        const newMode = event.target.value;
        const oldMode = this.api.mode;
        
        if (newMode === oldMode) return;
        
        this.showLoading();
        
        try {
            this.api.setMode(newMode);
            this.updateUIForMode(newMode);
            
            if (newMode === 'real' && !this.isAuthenticated) {
                this.showSuccess('Modo alterado para API Real. Clique em "Conectar Facebook" para começar.');
            } else {
                await this.loadInitialData();
                this.showSuccess(`Modo alterado para: ${newMode === 'demo' ? 'Demo' : 'API Real'}`);
            }
        } catch (error) {
            console.error('Error changing mode:', error);
            this.showError('Erro ao alterar modo: ' + error.message);
            // Revert mode
            event.target.value = oldMode;
            this.api.setMode(oldMode);
        }
        
        this.hideLoading();
    }

    updateUIForMode(mode) {
        const loginBtn = document.getElementById('facebookLoginBtn');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (mode === 'real') {
            if (loginBtn) loginBtn.style.display = 'flex';
            if (statusIndicator) {
                statusIndicator.className = 'status-indicator real-disconnected';
                if (!this.isAuthenticated) {
                    statusIndicator.className = 'status-indicator real-disconnected';
                } else {
                    statusIndicator.className = 'status-indicator real-connected';
                }
            }
            if (statusText) {
                statusText.textContent = this.isAuthenticated ? 'API Real Conectada' : 'API Real Desconectada';
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'none';
            if (statusIndicator) statusIndicator.className = 'status-indicator demo';
            if (statusText) statusText.textContent = 'Modo Demo';
            if (userName) userName.textContent = 'Usuário Demo';
            if (userAvatar) {
                userAvatar.src = 'https://ui-avatars.com/api/?name=Demo&background=10b981&color=fff';
            }
            
            // Load Business Managers for demo mode
            this.loadBusinessManagers();
        }

        // Update user info if authenticated
        if (this.isAuthenticated && this.api.getUserInfo()) {
            const user = this.api.getUserInfo();
            if (userName) userName.textContent = user.name;
            if (userAvatar && user.picture) {
                userAvatar.src = user.picture.data.url;
            }
            
            // Load Business Managers when authenticated
            this.loadBusinessManagers();
        }
    }

    // Modal Management
    openConfigModal() {
        const modal = document.getElementById('configModal');
        const appIdInput = document.getElementById('facebookAppId');
        
        if (modal) {
            modal.style.display = 'flex';
            if (appIdInput) {
                appIdInput.value = this.api.facebookAppId;
            }
            this.updateConnectionStatus();
        }
    }

    closeConfigModal() {
        const modal = document.getElementById('configModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async saveConfiguration() {
        const appIdInput = document.getElementById('facebookAppId');
        
        if (!appIdInput || !appIdInput.value.trim()) {
            this.showError('Por favor, insira um App ID válido');
            return;
        }

        const newAppId = appIdInput.value.trim();
        this.api.setAppId(newAppId);
        
        this.showSuccess('Configurações salvas com sucesso!');
        this.closeConfigModal();
        
        // Re-test connection with new app ID
        if (this.api.mode === 'real') {
            await this.testConnection();
        }
    }

    async testConnection() {
        const result = await this.api.testConnection();
        const statusDiv = document.getElementById('connectionStatus');
        
        if (statusDiv) {
            const statusDot = statusDiv.querySelector('.status-dot');
            const statusText = statusDiv.querySelector('span:last-child');
            
            if (result.success) {
                statusDot.className = 'status-dot connected';
                statusText.textContent = result.demo ? 'Demo - Funcionando' : 'SDK Carregado';
                this.showSuccess(result.message);
            } else {
                statusDot.className = 'status-dot disconnected';
                statusText.textContent = 'Erro de Conexão';
                this.showError(result.message);
            }
        }
    }

    updateConnectionStatus() {
        const statusDiv = document.getElementById('connectionStatus');
        if (statusDiv) {
            const statusDot = statusDiv.querySelector('.status-dot');
            const statusText = statusDiv.querySelector('span:last-child');
            
            if (this.api.mode === 'demo') {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Modo Demo';
            } else if (this.isAuthenticated) {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Conectado';
            } else {
                statusDot.className = 'status-dot disconnected';
                statusText.textContent = 'Desconectado';
            }
        }
    }

    async handleFacebookLogin() {
        const loadingText = document.getElementById('loadingText');
        
        console.log('🔗 Iniciando login Facebook...');
        if (loadingText) loadingText.textContent = 'Conectando com Facebook...';
        this.showLoading();
        
        try {
            // Adicionar timeout mais generoso para login manual
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Login demorou mais de 120 segundos')), 120000);
            });
            
            console.log('🔍 Iniciando autenticação...');
            const result = await Promise.race([
                this.api.authenticate(),
                timeoutPromise
            ]);
            
            console.log('📊 Resultado do login:', result);
            
            if (result && result.success) {
                this.isAuthenticated = true;
                
                if (loadingText) loadingText.textContent = 'Buscando contas de anúncios...';
                
                // Get ad accounts
                const accounts = await this.api.getAdAccounts();
                
                // Ensure accounts object has data property
                if (!accounts || !accounts.data) {
                    console.warn('Invalid accounts response:', accounts);
                    this.showError('Erro ao buscar contas de anúncios');
                    return;
                }
                
                if (accounts.data.length > 0) {
                    if (accounts.data.length === 1) {
                        // Auto-select if only one account
                        this.selectedAccountId = accounts.data[0].id;
                        this.api.accountId = this.selectedAccountId;
                        
                        this.showSuccess(`Conectado como ${result.user.name}! Carregando dados reais...`);
                        this.updateUIForMode('real');
                        
                        // Load Business Managers first, then data
                        if (loadingText) loadingText.textContent = 'Carregando Business Managers...';
                        await this.loadBusinessManagers();
                        
                        if (loadingText) loadingText.textContent = 'Carregando campanhas...';
                        await this.loadRealData();
                    } else {
                        // Show account selection modal
                        this.showAccountSelectionModal(accounts.data, result.user);
                    }
                } else {
                    this.showError('Nenhuma conta de anúncio encontrada. Verifique suas permissões no Facebook.');
                }
            } else {
                // Login não foi bem-sucedido
                console.warn('❌ Login Facebook falhou:', result);
                this.showError('Login cancelado ou falhou. Tente novamente.');
            }
        } catch (error) {
            console.error('❌ Facebook login error:', error);
            this.isAuthenticated = false;
            this.updateUIForMode('real');
            
            // Mensagens de erro mais específicas
            let errorMessage = 'Erro ao conectar com Facebook';
            if (error.message.includes('Timeout')) {
                errorMessage = 'Timeout: Verifique sua conexão e tente novamente';
            } else if (error.message.includes('SDK')) {
                errorMessage = 'Erro no Facebook SDK. Recarregue a página e tente novamente';
            } else if (error.message.includes('permissions')) {
                errorMessage = 'Permissões insuficientes. Verifique se tem acesso ao Business Manager';
            } else {
                errorMessage += ': ' + (error.message || 'Erro desconhecido');
            }
            
            this.showError(errorMessage);
        } finally {
            // Sempre limpar loading, independente do resultado
            console.log('🔄 Finalizando processo de login...');
            if (loadingText) loadingText.textContent = 'Carregando dados dos relatórios...';
            this.hideLoading();
        }
    }

    showAccountSelectionModal(accounts, user) {
        const modal = document.getElementById('accountModal');
        const accountsList = document.getElementById('accountsList');
        
        if (!modal || !accountsList) return;
        
        // Clear previous accounts
        accountsList.innerHTML = '';
        
        // Create account items
        accounts.forEach(account => {
            const accountItem = document.createElement('div');
            accountItem.className = 'account-item';
            accountItem.dataset.accountId = account.id;
            
            accountItem.innerHTML = `
                <div class="account-name">${account.name}</div>
                <div class="account-details">
                    ID: ${account.id} | Status: ${account.account_status === 1 ? 'Ativo' : 'Inativo'}
                    <br>Moeda: ${account.currency} | Fuso: ${account.timezone_name}
                </div>
            `;
            
            accountItem.addEventListener('click', () => {
                // Remove previous selection
                accountsList.querySelectorAll('.account-item').forEach(item => {
                    item.classList.remove('selected');
                });
                
                // Select this account
                accountItem.classList.add('selected');
                this.selectedAccountId = account.id;
                this.api.accountId = account.id;
                
                // Auto-close modal and load data after selection
                setTimeout(async () => {
                    modal.style.display = 'none';
                    this.showSuccess(`Conta selecionada: ${account.name}`);
                    this.updateUIForMode('real');
                    
                    this.showLoading();
                    const loadingText = document.getElementById('loadingText');
                    if (loadingText) loadingText.textContent = 'Carregando campanhas...';
                    
                    await this.loadRealData();
                    this.hideLoading();
                }, 500);
            });
            
            accountsList.appendChild(accountItem);
        });
        
        modal.style.display = 'flex';
    }

    // Business Manager Management
    async loadBusinessManagers() {
        try {
            console.log('Loading Business Managers...');
            
            if (this.api.mode === 'real' && this.isAuthenticated) {
                this.showLoading('Carregando Business Managers...');
                const managers = await this.api.getBusinessManagers();
                
                // Ensure managers object has data property
                if (!managers || !managers.data) {
                    console.warn('Invalid business managers response:', managers);
                    this.businessManagers = [];
                } else {
                    this.businessManagers = managers.data;
                }
                
                console.log('Loaded Business Managers:', this.businessManagers);
                
                // Check if target BM is in the list
                const targetBM = this.businessManagers.find(bm => bm.id === '177341406299126');
                if (targetBM) {
                    console.log('✅ Target BM 177341406299126 found:', targetBM);
                } else {
                    console.warn('❌ Target BM 177341406299126 NOT found in list');
                }
                
                this.populateBusinessManagerSelector();
                
                if (this.businessManagers.length > 0) {
                    document.getElementById('businessManagerSelector').style.display = 'flex';
                    
                    // Auto-select target BM if available
                    if (targetBM) {
                        const selector = document.getElementById('businessManagerFilter');
                        selector.value = '177341406299126';
                        await this.handleBusinessManagerChange({ target: { value: '177341406299126' } });
                    }
                }
            } else if (this.api.mode === 'demo') {
                const managers = await this.api.getBusinessManagers();
                
                // Ensure managers object has data property
                if (!managers || !managers.data) {
                    console.warn('Invalid demo managers response:', managers);
                    this.businessManagers = [];
                } else {
                    this.businessManagers = managers.data;
                }
                
                this.populateBusinessManagerSelector();
                document.getElementById('businessManagerSelector').style.display = 'flex';
            }
        } catch (error) {
            console.error('Error loading business managers:', error);
            this.showError('Erro ao carregar Business Managers: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    populateBusinessManagerSelector() {
        const selector = document.getElementById('businessManagerFilter');
        if (!selector) return;

        // Clear existing options (except "all")
        while (selector.children.length > 1) {
            selector.removeChild(selector.lastChild);
        }

        // Add business managers
        this.businessManagers.forEach(bm => {
            const option = document.createElement('option');
            option.value = bm.id;
            option.textContent = bm.name;
            selector.appendChild(option);
        });
    }


    populateAccountSelector() {
        const selector = document.getElementById('accountFilter');
        if (!selector) return;

        // Clear existing options (except "all")
        while (selector.children.length > 1) {
            selector.removeChild(selector.lastChild);
        }

        // Add accounts
        this.availableAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.name} (${account.currency})`;
            selector.appendChild(option);
        });
    }

    async handleAccountChange(event) {
        try {
            console.log('🔍 === ACCOUNT CHANGE STARTED ===');
            const accountId = event.target.value;
            console.log('🔍 Selected account value:', accountId);
            
            // Show loading with specific message
            this.showLoading('Carregando campanhas da conta selecionada...');
            
            this.selectedAccountId = accountId === 'all' ? null : accountId;
            console.log('🔍 this.selectedAccountId set to:', this.selectedAccountId);
            
            if (this.selectedAccountId) {
                this.api.accountId = this.selectedAccountId;
                console.log('🔍 API accountId set to:', this.api.accountId);
                
                // Get account name and currency info
                const accountSelect = event.target;
                const selectedOption = accountSelect.options[accountSelect.selectedIndex];
                const accountName = selectedOption.text;
                const accountCurrency = selectedOption.dataset.currency || 'USD';
                const currencySymbol = selectedOption.dataset.currencySymbol || '$';
                
                // Store currency info for the session
                this.selectedAccountCurrency = accountCurrency;
                this.selectedAccountCurrencySymbol = currencySymbol;
                this.selectedAccountCurrencyInfo = this.getCurrencyInfo(accountCurrency);
                
                console.log('🔍 Account currency detected:', {
                    currency: accountCurrency,
                    symbol: currencySymbol,
                    info: this.selectedAccountCurrencyInfo
                });
                
                console.log('🔍 Loading campaigns for account:', accountName);
                this.showLoading(`Carregando campanhas de: ${accountName}`);
                
                // Load campaigns specifically for this account
                await this.loadCampaignsForSpecificAccount(this.selectedAccountId, accountName, accountCurrency);
            } else {
                console.log('🔍 No specific account selected, loading all campaigns');
                await this.refreshDataWithFilters();
            }
            
            console.log('🔍 === ACCOUNT CHANGE COMPLETED ===');
        } catch (error) {
            console.error('🔍 Error in handleAccountChange:', error);
            this.showError('Erro ao carregar campanhas da conta: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleBusinessManagerChange(event) {
        try {
            console.log('🔍 === BUSINESS MANAGER CHANGE STARTED ===');
            const businessManagerId = event.target.value;
            console.log('🔍 Selected Business Manager ID:', businessManagerId);
            
            this.selectedBusinessManagerId = businessManagerId === 'all' ? null : businessManagerId;
            
            if (this.selectedBusinessManagerId) {
                this.showLoading('Carregando contas do Business Manager...');
                
                // Load accounts for the selected Business Manager
                await this.loadAccountsForBusinessManager(this.selectedBusinessManagerId);
            } else {
                // Load all accounts
                this.showLoading('Carregando todas as contas disponíveis...');
                await this.loadAllAccounts();
            }
            
            console.log('🔍 === BUSINESS MANAGER CHANGE COMPLETED ===');
        } catch (error) {
            console.error('🔍 Error in handleBusinessManagerChange:', error);
            
            // Fallback final: tentar carregar todas as contas
            console.log('🔍 Final fallback: attempting to load all accounts');
            try {
                this.showLoading('Carregando contas disponíveis...');
                await this.loadAllAccounts();
                this.showSuccess('Carregadas todas as contas disponíveis');
            } catch (finalError) {
                console.error('🔍 Final fallback failed:', finalError);
                this.showError('Não foi possível carregar nenhuma conta. Verifique suas permissões e conexão.');
            }
        } finally {
            this.hideLoading();
        }
    }

    async loadAccountsForBusinessManager(businessManagerId) {
        console.log('🔍 Loading accounts for Business Manager:', businessManagerId);
        
        try {
            // Validate Business Manager ID
            if (!businessManagerId || businessManagerId === 'all') {
                throw new Error('ID do Business Manager inválido');
            }
            
            console.log('🔍 Fetching accounts from API...');
            const accounts = await this.api.getAccountsForBusinessManager(businessManagerId);
            console.log('🔍 Accounts loaded for BM:', accounts);
            
            // Validate response
            if (!accounts || !Array.isArray(accounts.data)) {
                throw new Error('Resposta inválida da API');
            }
            
            // Update account selector with BM context
            this.updateAccountSelector(accounts.data, businessManagerId);
            
            // Clear current selection
            this.selectedAccountId = null;
            this.api.accountId = null;
            
            // Show empty state until account is selected
            this.showEmptyAccountState();
            
            if (accounts.data.length === 0) {
                this.showError('Nenhuma conta de anúncios encontrada neste Business Manager');
            } else {
                this.showSuccess(`${accounts.data.length} contas carregadas do Business Manager`);
            }
            
        } catch (error) {
            console.error('🔍 Error loading accounts for BM:', error);
            console.error('🔍 Error details:', {
                message: error.message,
                stack: error.stack,
                bmId: businessManagerId
            });
            
            // Show specific error message based on error type
            let errorMessage = `Erro ao carregar contas do Business Manager ${businessManagerId}`;
            
            if (error.message.includes('access') || error.message.includes('permiss')) {
                errorMessage = `Sem permissão para acessar contas do Business Manager ${businessManagerId}. Verifique se você tem acesso administrativo ou selecione "Todos os Business Managers".`;
            } else if (error.message.includes('não encontrado') || error.message.includes('not found')) {
                errorMessage = `Business Manager ${businessManagerId} não encontrado ou inacessível.`;
            } else if (error.message.includes('Não foi possível acessar')) {
                errorMessage = `Não foi possível acessar as contas do Business Manager ${businessManagerId}. Tente selecionar "Todos os Business Managers" para ver todas as contas disponíveis.`;
            } else {
                errorMessage += `: ${error.message}`;
            }
            
            this.showError(errorMessage);
            this.updateAccountSelector([]);
            
            // Clear current selection since we couldn't load accounts
            this.selectedAccountId = null;
            this.api.accountId = null;
            this.showEmptyAccountState();
        }
    }

    async loadAllAccounts() {
        console.log('🔍 Loading all accounts');
        
        try {
            const accounts = await this.api.getAdAccounts();
            console.log('🔍 All accounts loaded:', accounts);
            
            // Update account selector
            this.updateAccountSelector(accounts.data || []);
            
            // Clear current selection
            this.selectedAccountId = null;
            this.api.accountId = null;
            
            // Show empty state until account is selected
            this.showEmptyAccountState();
            
            this.showSuccess(`${accounts.data?.length || 0} contas carregadas`);
        } catch (error) {
            console.error('🔍 Error loading all accounts:', error);
            this.showError('Erro ao carregar contas');
            this.updateAccountSelector([]);
        }
    }

    updateAccountSelector(accounts, businessManagerId = null) {
        console.log('🔍 Updating account selector with', accounts.length, 'accounts for BM:', businessManagerId);
        
        const selector = document.getElementById('accountFilter');
        if (!selector) return;
        
        // Clear existing options
        const placeholderText = businessManagerId && businessManagerId !== 'all' 
            ? 'Selecione uma conta deste Business Manager'
            : 'Selecione uma conta';
        selector.innerHTML = `<option value="all">${placeholderText}</option>`;
        
        // Add accounts to selector with currency information
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            
            // Get currency symbol and flag
            const currencyInfo = this.getCurrencyInfo(account.currency);
            const currencyDisplay = currencyInfo.symbol + ' ' + account.currency;
            
            // Add business manager info if available
            let bmInfo = '';
            if (account.business && account.business.name) {
                bmInfo = ` [${account.business.name}]`;
            }
            
            option.textContent = `${account.name} (${currencyDisplay})${bmInfo} - ${account.id}`;
            
            // Store currency and BM info in data attributes
            option.dataset.currency = account.currency;
            option.dataset.currencySymbol = currencyInfo.symbol;
            option.dataset.businessManagerId = account.business?.id || '';
            
            selector.appendChild(option);
        });
        
        // Store accounts for reference
        this.availableAccounts = accounts;
        
        // Show account selector
        const accountSelector = document.getElementById('accountSelector');
        if (accountSelector) {
            accountSelector.style.display = accounts.length > 0 ? 'block' : 'none';
        }
        
        console.log('🔍 Accounts filtered for BM:', accounts.map(acc => `${acc.name}: ${acc.currency} (BM: ${acc.business?.name || 'N/A'})`));
    }

    getCurrencyInfo(currency) {
        const currencyMap = {
            'BRL': { symbol: '🇧🇷 R$', name: 'Real Brasileiro', locale: 'pt-BR' },
            'USD': { symbol: '🇺🇸 $', name: 'Dólar Americano', locale: 'en-US' },
            'EUR': { symbol: '🇪🇺 €', name: 'Euro', locale: 'de-DE' },
            'GBP': { symbol: '🇬🇧 £', name: 'Libra Esterlina', locale: 'en-GB' }
        };
        
        return currencyMap[currency] || { symbol: currency, name: currency, locale: 'en-US' };
    }

    formatCurrency(value, currency = null) {
        // Use selected account currency if not specified
        const targetCurrency = currency || this.selectedAccountCurrency || 'USD';
        const currencyInfo = this.getCurrencyInfo(targetCurrency);
        
        // Convert to number if it's a string
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(numValue)) return currencyInfo.symbol + ' 0.00';
        
        // Format according to currency locale
        try {
            const formatter = new Intl.NumberFormat(currencyInfo.locale, {
                style: 'currency',
                currency: targetCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            
            return formatter.format(numValue);
        } catch (error) {
            // Fallback formatting
            console.warn('Currency formatting error:', error);
            return `${currencyInfo.symbol} ${numValue.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    }

    formatCurrencyCompact(value, currency = null) {
        const targetCurrency = currency || this.selectedAccountCurrency || 'USD';
        const currencyInfo = this.getCurrencyInfo(targetCurrency);
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(numValue)) return currencyInfo.symbol + ' 0';
        
        // Compact format for large numbers
        if (numValue >= 1000000) {
            return `${currencyInfo.symbol} ${(numValue / 1000000).toFixed(1)}M`;
        } else if (numValue >= 1000) {
            return `${currencyInfo.symbol} ${(numValue / 1000).toFixed(1)}K`;
        } else {
            return `${currencyInfo.symbol} ${numValue.toFixed(0)}`;
        }
    }

    showEmptyAccountState() {
        console.log('🔍 Showing empty account state');
        
        // Clear dashboard data
        this.data = {
            campaigns: [],
            timeSeries: this.generateTimeSeriesData(),
            totals: { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
        };
        this.allCampaigns = [];
        
        // Update UI
        this.updateKPIs();
        this.updateCampaignsTable();
        this.updateCharts();
    }

    // Advanced Filters Management
    openAdvancedFilters() {
        const modal = document.getElementById('advancedFiltersModal');
        if (modal) {
            this.populateAdvancedFiltersForm();
            modal.style.display = 'flex';
        }
    }

    closeAdvancedFilters() {
        const modal = document.getElementById('advancedFiltersModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    populateAdvancedFiltersForm() {
        // Status checkboxes
        document.querySelectorAll('#advancedFiltersModal input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.value && this.advancedFilters.status) {
                checkbox.checked = this.advancedFilters.status.includes(checkbox.value);
            }
        });

        // Objective checkboxes
        document.querySelectorAll('#advancedFiltersModal .filter-section:nth-child(2) input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.value && this.advancedFilters.objective) {
                checkbox.checked = this.advancedFilters.objective.includes(checkbox.value);
            }
        });

        // Date inputs
        if (this.advancedFilters.createdAfter) {
            document.getElementById('createdAfter').value = this.advancedFilters.createdAfter;
        }
        if (this.advancedFilters.createdBefore) {
            document.getElementById('createdBefore').value = this.advancedFilters.createdBefore;
        }

        // Performance inputs
        if (this.advancedFilters.minSpend) {
            document.getElementById('minSpend').value = this.advancedFilters.minSpend;
        }
        if (this.advancedFilters.maxSpend) {
            document.getElementById('maxSpend').value = this.advancedFilters.maxSpend;
        }
        if (this.advancedFilters.minCTR) {
            document.getElementById('minCTR').value = this.advancedFilters.minCTR;
        }
        if (this.advancedFilters.minConversions) {
            document.getElementById('minConversions').value = this.advancedFilters.minConversions;
        }

        // Search
        document.getElementById('campaignNameSearch').value = this.advancedFilters.name || '';
        document.getElementById('exactMatch').checked = this.advancedFilters.exactMatch || false;
    }

    async applyAdvancedFilters() {
        // Collect status filters
        const statusFilters = [];
        document.querySelectorAll('#advancedFiltersModal .filter-section:first-child input[type="checkbox"]:checked').forEach(checkbox => {
            statusFilters.push(checkbox.value);
        });

        // Collect objective filters
        const objectiveFilters = [];
        document.querySelectorAll('#advancedFiltersModal .filter-section:nth-child(2) input[type="checkbox"]:checked').forEach(checkbox => {
            objectiveFilters.push(checkbox.value);
        });

        // Update filters object
        this.advancedFilters = {
            status: statusFilters,
            objective: objectiveFilters,
            createdAfter: document.getElementById('createdAfter').value || null,
            createdBefore: document.getElementById('createdBefore').value || null,
            minSpend: parseFloat(document.getElementById('minSpend').value) || null,
            maxSpend: parseFloat(document.getElementById('maxSpend').value) || null,
            minCTR: parseFloat(document.getElementById('minCTR').value) || null,
            minConversions: parseInt(document.getElementById('minConversions').value) || null,
            name: document.getElementById('campaignNameSearch').value || '',
            exactMatch: document.getElementById('exactMatch').checked
        };

        this.closeAdvancedFilters();
        await this.refreshDataWithFilters();
    }

    clearAllFilters() {
        this.advancedFilters = {
            status: ['ACTIVE'],
            objective: ['CONVERSIONS', 'TRAFFIC'],
            createdAfter: null,
            createdBefore: null,
            minSpend: null,
            maxSpend: null,
            minCTR: null,
            minConversions: null,
            name: '',
            exactMatch: false
        };

        this.populateAdvancedFiltersForm();
    }

    async refreshDataWithFilters() {
        console.log('🔍 refreshDataWithFilters started');
        this.showLoading('Carregando campanhas...');
        
        try {
            // Simplified approach - just load campaigns directly
            await this.loadCampaignsForAccount(this.selectedAccountId);
        } catch (error) {
            console.error('🔍 Error in refreshDataWithFilters:', error);
            console.error('🔍 Error stack:', error.stack);
            this.showError('Erro ao carregar campanhas: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadCampaignsForSpecificAccount(accountId, accountName, accountCurrency = 'USD') {
        console.log('🔍 === LOADING CAMPAIGNS FOR SPECIFIC ACCOUNT ===');
        console.log('🔍 Account ID:', accountId);
        console.log('🔍 Account Name:', accountName);
        console.log('🔍 Account Currency:', accountCurrency);
        
        try {
            // Validate authentication first
            if (this.api.mode === 'real' && !this.isAuthenticated) {
                throw new Error('Usuário não autenticado. Faça login primeiro.');
            }
            
            // Validate account ID format
            if (!accountId || accountId === 'all') {
                console.log('🔍 Loading all campaigns (no specific account)');
                await this.refreshDataWithFilters();
                return;
            }
            
            // Ensure accountId has the correct format (act_XXXXXXXXX)
            const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
            console.log('🔍 Formatted Account ID:', formattedAccountId);
            
            this.selectedAccountId = formattedAccountId;
            this.api.accountId = formattedAccountId;
            
            // Load campaigns with detailed feedback
            this.showLoading(`Buscando campanhas de: ${accountName}`);
            
            if (this.api.mode === 'real') {
                console.log('🔍 Loading real campaigns...');
                await this.loadRealData();
                
                // Provide specific success feedback
                const campaignCount = this.data?.campaigns?.length || 0;
                this.showSuccess(`${campaignCount} campanhas carregadas de: ${accountName}`);
            } else {
                console.log('🔍 Loading demo campaigns...');
                this.data = this.generateMockData();
                this.allCampaigns = [...this.data.campaigns];
                this.updateKPIs();
                this.updateCampaignsTable();
                this.updateCharts();
                this.showSuccess(`Dados demo carregados para: ${accountName}`);
            }
            
            // Update UI to show account-specific data
            this.updateAccountSpecificUI(accountName);
            
        } catch (error) {
            console.error('🔍 Error loading campaigns for specific account:', error);
            this.showError(`Erro ao carregar campanhas de ${accountName}: ${error.message}`);
            
            // Show empty state on error
            this.data = {
                campaigns: [],
                timeSeries: this.generateTimeSeriesData(),
                totals: { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
            };
            this.allCampaigns = [];
            this.updateKPIs();
            this.updateCampaignsTable();
            this.updateCharts();
        }
        
        console.log('🔍 === ACCOUNT-SPECIFIC LOADING COMPLETED ===');
    }

    updateAccountSpecificUI(accountName) {
        console.log('🔍 Updating UI for account:', accountName);
        console.log('🔍 Account currency:', this.selectedAccountCurrency);
        
        // Update page title or header if needed
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = `Dashboard - ${accountName}`;
        }
        
        // Update any account-specific indicators
        const accountIndicator = document.getElementById('currentAccountIndicator');
        if (accountIndicator) {
            accountIndicator.textContent = accountName;
        }
        
        // Update currency indicator in the UI
        this.updateCurrencyIndicators();
    }

    updateCurrencyIndicators() {
        console.log('🔍 Updating currency indicators');
        
        if (!this.selectedAccountCurrency) return;
        
        const currencyInfo = this.getCurrencyInfo(this.selectedAccountCurrency);
        
        // Update currency indicator if it exists
        const currencyIndicator = document.getElementById('currencyIndicator');
        if (currencyIndicator) {
            currencyIndicator.textContent = `${currencyInfo.symbol} ${this.selectedAccountCurrency}`;
            currencyIndicator.title = currencyInfo.name;
        }
        
        // Update KPI labels to show correct currency
        const spendLabel = document.querySelector('#totalSpend')?.parentElement?.querySelector('h3');
        if (spendLabel) {
            spendLabel.textContent = `Gasto Total (${this.selectedAccountCurrency})`;
        }
        
        // Add currency class to body for CSS styling
        document.body.className = document.body.className.replace(/currency-\w+/g, '');
        document.body.classList.add(`currency-${this.selectedAccountCurrency.toLowerCase()}`);
        
        console.log('🔍 Currency indicators updated for:', this.selectedAccountCurrency);
    }

    async loadCampaignsForAccount(accountId) {
        console.log('🔍 loadCampaignsForAccount called with:', accountId);
        
        try {
            // Use the existing loadRealData method which is more stable
            if (accountId) {
                this.selectedAccountId = accountId;
                this.api.accountId = accountId;
                await this.loadRealData();
            } else if (this.api.mode === 'demo') {
                // Load demo data
                this.data = this.generateMockData();
                this.allCampaigns = [...this.data.campaigns];
                this.updateKPIs();
                this.updateCampaignsTable();
                this.updateCharts();
                this.showSuccess('Dados demo carregados');
            } else {
                // No account selected, show empty state
                this.data = {
                    campaigns: [],
                    timeSeries: this.generateTimeSeriesData(),
                    totals: { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
                };
                this.allCampaigns = [];
                this.updateKPIs();
                this.updateCampaignsTable();
                this.updateCharts();
                this.showError('Nenhuma conta selecionada');
            }
        } catch (error) {
            console.error('🔍 Error in loadCampaignsForAccount:', error);
            // Fallback to demo data
            this.data = this.generateMockData();
            this.allCampaigns = [...this.data.campaigns];
            this.updateKPIs();
            this.updateCampaignsTable();
            this.updateCharts();
            this.showError('Erro ao carregar dados, usando demo: ' + error.message);
        }
    }

    async loadRealData() {
        console.log('🔍 loadRealData started with selectedAccountId:', this.selectedAccountId);
        
        try {
            if (!this.selectedAccountId) {
                console.error('🔍 Nenhuma conta selecionada');
                throw new Error('Nenhuma conta selecionada');
            }

            // Buscar campanhas reais
            this.showLoading('Carregando campanhas...');
            let campaigns;
            
            try {
                console.log('🔍 Calling api.getCampaigns with accountId:', this.selectedAccountId);
                console.log('🔍 API mode:', this.api.mode);
                console.log('🔍 Access token present:', !!this.api.accessToken);
                
                campaigns = await this.api.getCampaigns(this.selectedAccountId);
                console.log('🔍 getCampaigns result:', campaigns);
                console.log('🔍 getCampaigns type:', typeof campaigns);
                console.log('🔍 getCampaigns has data:', campaigns && campaigns.hasOwnProperty('data'));
                
                if (campaigns) {
                    console.log('🔍 Campaigns data type:', typeof campaigns.data);
                    console.log('🔍 Campaigns data is array:', Array.isArray(campaigns.data));
                    console.log('🔍 Campaigns data length:', campaigns.data ? campaigns.data.length : 'undefined');
                }
            } catch (campaignError) {
                console.error('🔍 Error fetching campaigns:', campaignError);
                console.error('🔍 Campaign error message:', campaignError.message);
                console.error('🔍 Campaign error stack:', campaignError.stack);
                
                // Fallback to demo data
                this.showLoading('Erro ao buscar campanhas, carregando dados demo...');
                await this.sleep(1000);
                this.data = this.generateMockData();
                this.allCampaigns = [...this.data.campaigns];
                this.updateKPIs();
                this.updateCampaignsTable();
                this.updateCharts();
                this.showError('Erro ao conectar com a API. Mostrando dados demo: ' + campaignError.message);
                return;
            }
            
            // Validação mais robusta da estrutura de dados
            console.log('🔍 Validating campaigns structure:', {
                campaigns: campaigns,
                type: typeof campaigns,
                isNull: campaigns === null,
                isUndefined: campaigns === undefined,
                hasData: campaigns && campaigns.hasOwnProperty('data'),
                dataType: campaigns && typeof campaigns.data,
                dataIsArray: campaigns && Array.isArray(campaigns.data)
            });
            
            if (!campaigns) {
                console.error('🔍 Campaigns is null/undefined, creating empty structure');
                campaigns = { data: [] };
            } else if (typeof campaigns !== 'object') {
                console.error('🔍 Invalid campaigns response - not an object:', campaigns);
                campaigns = { data: [] };
            } else if (!campaigns.hasOwnProperty('data')) {
                console.error('🔍 Campaigns missing data property, creating it:', campaigns);
                campaigns.data = [];
            } else if (!Array.isArray(campaigns.data)) {
                console.error('🔍 Campaigns.data is not an array:', typeof campaigns.data, campaigns.data);
                campaigns.data = [];
            }
            
            console.log('🔍 Final campaigns structure after validation:', {
                hasData: !!campaigns.data,
                dataLength: campaigns.data.length,
                dataType: typeof campaigns.data
            });
            
            if (campaigns.data.length === 0) {
                this.showError('Nenhuma campanha encontrada nesta conta. Verifique se você tem campanhas criadas.');
                
                // Show empty state
                this.data = {
                    campaigns: [],
                    timeSeries: this.generateTimeSeriesData(),
                    totals: { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
                };
                this.allCampaigns = [];
            } else {
                // Buscar insights para cada campanha
                this.showLoading('Carregando métricas das campanhas...');
                
                try {
                    console.log('🔍 Starting convertRealDataToFormat with:', campaigns.data.length, 'campaigns');
                    // Converter dados reais para formato do dashboard
                    this.data = await this.convertRealDataToFormat(campaigns.data);
                    console.log('🔍 convertRealDataToFormat completed successfully');
                    
                    if (!this.data || !this.data.campaigns) {
                        throw new Error('convertRealDataToFormat retornou dados inválidos');
                    }
                    
                    this.allCampaigns = [...this.data.campaigns];
                    console.log('🔍 Data successfully assigned to app');
                    
                    this.showSuccess(`${campaigns.data.length} campanhas carregadas com sucesso!`);
                } catch (conversionError) {
                    console.error('🔍 Error in convertRealDataToFormat:', conversionError);
                    throw new Error('Erro ao processar dados das campanhas: ' + conversionError.message);
                }
            }
            
            this.updateKPIs();
            this.updateCampaignsTable();
            this.updateCharts();
            
        } catch (error) {
            console.error('Error loading real data:', error);
            
            // Check if it's an authentication error
            if (error.message.includes('access token') || error.message.includes('permission')) {
                this.showError('Token de acesso expirado ou permissões insuficientes. Faça login novamente.');
                this.api.logout();
                this.isAuthenticated = false;
                this.updateUIForMode('real');
            } else if (error.message.includes('rate limit')) {
                this.showError('Limite de taxa da API atingido. Tente novamente em alguns minutos.');
            } else {
                this.showError('Erro ao carregar dados: ' + error.message);
            }
            
            // Fallback to demo data in case of error
            this.showLoading('Carregando dados demo como fallback...');
            await this.sleep(1000);
            this.data = this.generateMockData();
            this.allCampaigns = [...this.data.campaigns];
            this.updateKPIs();
            this.updateCampaignsTable();
            this.updateCharts();
        }
    }

    async convertRealDataToFormat(realCampaigns) {
        console.log('🔍 convertRealDataToFormat called with campaigns:', realCampaigns.length);
        
        // Converter dados da API real para formato do dashboard
        const campaigns = [];
        let realInsightsCount = 0;
        let mockInsightsCount = 0;
        
        for (const campaign of realCampaigns) {
            console.log('🔍 Processing campaign:', campaign.name, 'ID:', campaign.id);
            
            try {
                // Try to get real insights, fallback to mock if error
                let insights = null;
                
                if (this.api.mode === 'real') {
                    try {
                        console.log('🔍 Fetching insights for campaign:', campaign.id);
                        const insightsData = await this.api.getInsights(campaign.id, 'campaign', '30');
                        console.log('🔍 Insights data received:', insightsData);
                        
                        if (insightsData.data && insightsData.data.length > 0) {
                            // Use aggregated data from all insights or latest
                            let totalImpressions = 0;
                            let totalClicks = 0;
                            let totalSpend = 0;
                            let totalConversions = 0;
                            
                            // Sum up all insights for the period
                            insightsData.data.forEach(insight => {
                                totalImpressions += parseInt(insight.impressions) || 0;
                                totalClicks += parseInt(insight.clicks) || 0;
                                totalSpend += parseFloat(insight.spend) || 0;
                                
                                // Calculate conversions from actions
                                if (insight.actions) {
                                    insight.actions.forEach(action => {
                                        if (action.action_type.includes('conversion') || 
                                            action.action_type.includes('purchase')) {
                                            totalConversions += parseInt(action.value) || 0;
                                        }
                                    });
                                }
                            });
                            
                            // Calculate derived metrics
                            const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
                            const cpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
                            
                            insights = {
                                impressions: totalImpressions,
                                clicks: totalClicks,
                                spend: totalSpend,
                                ctr: ctr.toFixed(2),
                                cpc: cpc.toFixed(2),
                                conversions: totalConversions
                            };
                            
                            realInsightsCount++;
                            console.log('🔍 Real insights processed for', campaign.name, ':', insights);
                        } else {
                            console.log('🔍 No insights data found for campaign:', campaign.name);
                        }
                    } catch (insightError) {
                        console.warn(`🔍 Could not get insights for campaign ${campaign.name}:`, insightError);
                    }
                }
                
                // Use insights if available, otherwise generate mock data
                if (insights) {
                    const campaignData = {
                        name: campaign.name,
                        status: campaign.status.toLowerCase(),
                        impressions: insights.impressions,
                        clicks: insights.clicks,
                        ctr: insights.ctr,
                        cpc: insights.cpc,
                        conversions: insights.conversions,
                        spend: insights.spend.toFixed(2)
                    };
                    campaigns.push(campaignData);
                    console.log('🔍 Added campaign with real data:', campaign.name);
                } else {
                    // Generate mock data but still use real campaign info
                    mockInsightsCount++;
                    const campaignData = {
                        name: campaign.name,
                        status: campaign.status.toLowerCase(),
                        impressions: Math.floor(Math.random() * 100000 + 10000),
                        clicks: Math.floor(Math.random() * 5000 + 500),
                        ctr: (Math.random() * 5 + 1).toFixed(2),
                        cpc: (Math.random() * 2 + 0.5).toFixed(2),
                        conversions: Math.floor(Math.random() * 200 + 10),
                        spend: (Math.random() * 5000 + 500).toFixed(2)
                    };
                    campaigns.push(campaignData);
                    console.log('🔍 Added campaign with mock data:', campaign.name);
                }
                
            } catch (error) {
                console.error(`🔍 Error processing campaign ${campaign.name}:`, error);
                mockInsightsCount++;
                
                // Add with mock data if there's an error
                campaigns.push({
                    name: campaign.name,
                    status: campaign.status.toLowerCase(),
                    impressions: Math.floor(Math.random() * 100000 + 10000),
                    clicks: Math.floor(Math.random() * 5000 + 500),
                    ctr: (Math.random() * 5 + 1).toFixed(2),
                    cpc: (Math.random() * 2 + 0.5).toFixed(2),
                    conversions: Math.floor(Math.random() * 200 + 10),
                    spend: (Math.random() * 5000 + 500).toFixed(2)
                });
            }
        }

        console.log('🔍 Data conversion completed:');
        console.log('🔍 - Total campaigns:', campaigns.length);
        console.log('🔍 - Real insights:', realInsightsCount);
        console.log('🔍 - Mock insights:', mockInsightsCount);

        // Gerar dados temporais baseados nos dados reais
        const timeSeriesData = this.generateTimeSeriesData(campaigns);

        const result = {
            campaigns,
            timeSeries: timeSeriesData,
            totals: this.calculateTotals(campaigns)
        };
        
        console.log('🔍 Final dashboard data:', result);

        return result;
    }
}

// Função debug para verificar sincronização dos dados
function debugDataSync() {
    console.log('=== DEBUG DATA SYNC ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    console.log('📊 Status da aplicação:');
    console.log('- Modo API:', app.api?.mode);
    console.log('- Conta selecionada:', app.selectedAccountId);
    console.log('- Autenticado:', app.isAuthenticated);
    
    console.log('📈 Dados do dashboard:');
    console.log('- Total campanhas:', app.data?.campaigns?.length || 0);
    console.log('- Campanhas carregadas:', app.allCampaigns?.length || 0);
    console.log('- Totals:', app.data?.totals);
    
    if (app.data?.campaigns) {
        console.log('📋 Campanhas atuais:');
        app.data.campaigns.forEach((campaign, index) => {
            console.log(`  ${index + 1}. ${campaign.name} (${campaign.status})`);
            console.log(`     Impressões: ${campaign.impressions}, Cliques: ${campaign.clicks}, Gasto: R$ ${campaign.spend}`);
        });
    }
    
    console.log('🔧 Para forçar sincronização, execute: metaAdsApp.loadRealData()');
    console.log('=====================');
}

// Função debug para verificar conectividade da API
function debugAPIConnection() {
    console.log('=== DEBUG API CONNECTION ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    const api = app.api;
    
    console.log('🔗 Status da API:');
    console.log('- Modo:', api.mode);
    console.log('- Status conexão:', api.connectionStatus);
    console.log('- Access Token presente:', !!api.accessToken);
    console.log('- SDK carregado:', api.isSDKLoaded);
    console.log('- FB disponível:', typeof window.FB !== 'undefined');
    console.log('- Usuario logado:', api.user);
    console.log('- Permissões requeridas:', api.requiredPermissions);
    
    if (api.mode === 'real') {
        console.log('🚀 Teste manual de conexão:');
        console.log('Execute no console:');
        console.log('1. metaAdsApp.api.initFacebookSDK()');
        console.log('2. metaAdsApp.api.loginWithFacebook()');
        console.log('3. metaAdsApp.handleFacebookLogin()');
        
        if (api.accessToken && window.FB) {
            console.log('🧪 Testando token atual...');
            FB.api('/me', { 
                fields: 'name,email,picture',
                access_token: api.accessToken 
            }, (response) => {
                if (response.error) {
                    console.error('❌ Token inválido:', response.error);
                } else {
                    console.log('✅ Token válido, usuário:', response);
                }
            });
        }
    } else {
        console.log('🎭 Modo Demo ativo - conexão sempre disponível');
    }
    
    console.log('=============================');
}

// Função para forçar modo real e testar conexão
function forceRealMode() {
    console.log('🚀 Forçando modo Real...');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    // Forçar modo real
    app.api.setMode('real');
    app.updateUIForMode('real');
    
    console.log('✅ Modo alterado para Real');
    console.log('✅ UI atualizada');
    
    // Verificar se botão apareceu
    const loginBtn = document.getElementById('facebookLoginBtn');
    if (loginBtn) {
        console.log('✅ Botão de login visível:', loginBtn.style.display !== 'none');
        console.log('📍 Botão está em:', loginBtn.getBoundingClientRect());
    } else {
        console.log('❌ Botão de login não encontrado');
    }
    
    // Status da API
    debugAPIConnection();
}

// Função para testar login manual
function testFacebookLogin() {
    console.log('🧪 Testando login do Facebook...');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    window.metaAdsApp.handleFacebookLogin();
}

// Função para diagnóstico completo de erros de carregamento
function fullLoadingDiagnostic() {
    console.log('🔍 === DIAGNÓSTICO COMPLETO DE CARREGAMENTO ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    console.log('📊 Status geral:');
    console.log('- Modo API:', app.api?.mode);
    console.log('- Autenticado:', app.isAuthenticated);
    console.log('- Access Token presente:', !!app.api?.accessToken);
    console.log('- SDK carregado:', app.api?.isSDKLoaded);
    console.log('- FB disponível:', typeof window.FB !== 'undefined');
    
    // Teste 1: Verificar se consegue carregar Business Managers
    console.log('\n🧪 Teste 1: Carregando Business Managers...');
    app.loadBusinessManagers()
        .then(() => {
            console.log('✅ Business Managers carregados:', app.businessManagers?.length || 0);
            
            if (app.businessManagers && app.businessManagers.length > 0) {
                console.log('📋 Business Managers disponíveis:');
                app.businessManagers.forEach((bm, index) => {
                    console.log(`  ${index + 1}. ${bm.name} (${bm.id})`);
                });
                
                // Teste 2: Tentar carregar contas do primeiro BM
                const firstBM = app.businessManagers[0];
                console.log(`\n🧪 Teste 2: Carregando contas do BM ${firstBM.name}...`);
                
                return app.api.getAccountsForBusinessManager(firstBM.id);
            } else {
                console.log('❌ Nenhum Business Manager encontrado');
                return null;
            }
        })
        .then((accounts) => {
            if (accounts) {
                console.log('✅ Contas carregadas via API:', accounts.data?.length || 0);
                if (accounts.data && accounts.data.length > 0) {
                    console.log('📋 Primeiras contas:');
                    accounts.data.slice(0, 3).forEach((account, index) => {
                        console.log(`  ${index + 1}. ${account.name} (${account.currency})`);
                    });
                }
            }
            
            // Teste 3: Carregar todas as contas diretamente
            console.log('\n🧪 Teste 3: Carregando todas as contas...');
            return app.api.getAdAccounts();
        })
        .then((allAccounts) => {
            console.log('✅ Todas as contas:', allAccounts?.data?.length || 0);
            
            if (allAccounts?.data && allAccounts.data.length > 0) {
                console.log('📋 Primeiras contas (todas):');
                allAccounts.data.slice(0, 5).forEach((account, index) => {
                    console.log(`  ${index + 1}. ${account.name} (${account.currency}) - BM: ${account.business?.name || 'N/A'}`);
                });
                
                // Procurar a conta específica
                const targetAccount = allAccounts.data.find(acc => acc.id.includes('4030832237237833'));
                if (targetAccount) {
                    console.log('🎯 CONTA USD ENCONTRADA:', targetAccount.name);
                    console.log('   BM:', targetAccount.business?.name || 'N/A');
                    console.log('   BM ID:', targetAccount.business?.id || 'N/A');
                }
            }
        })
        .catch((error) => {
            console.error('❌ Erro no diagnóstico:', error);
            console.log('📝 Detalhes do erro:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Teste manual da API
            if (app.api.mode === 'real' && app.api.accessToken && window.FB) {
                console.log('\n🧪 Teste manual da API Facebook...');
                
                FB.api('/me/adaccounts', {
                    fields: 'id,name,currency,business',
                    access_token: app.api.accessToken,
                    limit: 5
                }, (response) => {
                    console.log('📡 Resposta manual /me/adaccounts:', response);
                });
                
                FB.api('/me/businesses', {
                    fields: 'id,name',
                    access_token: app.api.accessToken
                }, (response) => {
                    console.log('📡 Resposta manual /me/businesses:', response);
                });
            }
        });
    
    console.log('=============================================');
}

// Disponibilizar funções globalmente
window.fullLoadingDiagnostic = fullLoadingDiagnostic;
window.debugBM177341406299126 = debugBM177341406299126;

// Função para debug específico do BM 177341406299126
function debugBM177341406299126() {
    console.log('🔍 === DEBUG BUSINESS MANAGER 177341406299126 ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    const targetBMId = '177341406299126';
    
    if (!app.isAuthenticated && app.api.mode === 'real') {
        console.log('❌ Não autenticado. Execute primeiro: testFacebookLogin()');
        return;
    }
    
    console.log(`🎯 Testando acesso específico ao BM: ${targetBMId}`);
    
    // Teste 1: Verificar se o BM está na lista
    console.log('📋 Business Managers disponíveis:');
    if (app.businessManagers && app.businessManagers.length > 0) {
        app.businessManagers.forEach((bm, index) => {
            const isTarget = bm.id === targetBMId;
            console.log(`  ${index + 1}. ${bm.name} (${bm.id}) ${isTarget ? '🎯 ALVO' : ''}`);
        });
    }
    
    // Teste 2: Tentar carregar contas diretamente
    console.log(`\n🧪 Tentando carregar contas do BM ${targetBMId}...`);
    app.loadAccountsForBusinessManager(targetBMId)
        .then(() => {
            console.log('✅ Carregamento bem-sucedido');
            console.log('- Contas encontradas:', app.availableAccounts?.length || 0);
            
            if (app.availableAccounts && app.availableAccounts.length > 0) {
                console.log('📋 Contas do BM 177341406299126:');
                app.availableAccounts.forEach((account, index) => {
                    console.log(`  ${index + 1}. ${account.name} (${account.currency})`);
                    console.log(`     ID: ${account.id}`);
                    console.log(`     BM: ${account.business?.name || 'N/A'} (${account.business?.id || 'N/A'})`);
                    
                    // Verificar a conta específica USD
                    if (account.id.includes('4030832237237833')) {
                        console.log('     🎯 CONTA USD ENCONTRADA!');
                    }
                });
            }
        })
        .catch(error => {
            console.error('❌ Erro ao carregar contas:', error);
            console.log('\n🔧 Tentando diagnósticos alternativos...');
            
            // Teste 3: Tentar via API direta
            if (app.api.mode === 'real' && app.api.accessToken) {
                console.log('🧪 Testando API direta...');
                
                // Teste múltiplos endpoints
                const endpoints = [
                    `/${targetBMId}/adaccounts`,
                    `/me/adaccounts`,
                    `/${targetBMId}`,
                    `/me/businesses`
                ];
                
                endpoints.forEach(endpoint => {
                    FB.api(endpoint, {
                        fields: 'id,name,account_status,currency,business',
                        access_token: app.api.accessToken,
                        limit: 10
                    }, (response) => {
                        console.log(`📡 ${endpoint}:`, response);
                    });
                });
            }
        });
    
    console.log('=============================================');
}

// Função para testar filtragem específica por Business Manager
function testBusinessManagerFiltering() {
    console.log('🔍 === TESTE DE FILTRAGEM POR BUSINESS MANAGER ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    if (!app.isAuthenticated && app.api.mode === 'real') {
        console.log('❌ Não autenticado. Execute primeiro: testFacebookLogin()');
        return;
    }
    
    console.log('📊 Testando filtragem rigorosa por Business Manager...');
    
    // Se há Business Managers disponíveis, teste com o primeiro
    if (app.businessManagers && app.businessManagers.length > 0) {
        const bmId = app.businessManagers[0].id;
        const bmName = app.businessManagers[0].name;
        
        console.log(`🎯 Testando com Business Manager: ${bmName} (${bmId})`);
        
        app.loadAccountsForBusinessManager(bmId)
            .then(() => {
                console.log('✅ Carregamento específico concluído');
                console.log(`- Contas do BM ${bmName}:`, app.availableAccounts?.length || 0);
                
                if (app.availableAccounts && app.availableAccounts.length > 0) {
                    console.log('📋 Contas APENAS deste Business Manager:');
                    app.availableAccounts.forEach((account, index) => {
                        const bmInfo = account.business?.name || 'N/A';
                        console.log(`  ${index + 1}. ${account.name} (${account.currency})`);
                        console.log(`     ID: ${account.id}`);
                        console.log(`     Business Manager: ${bmInfo}`);
                        console.log(`     BM ID: ${account.business?.id || 'N/A'}`);
                    });
                } else {
                    console.log('❌ Nenhuma conta encontrada para este Business Manager específico');
                }
            })
            .catch(error => {
                console.error('❌ Erro no carregamento específico:', error.message);
                console.log('💡 Isso é esperado se você não tem permissão para este BM específico');
            });
    } else {
        console.log('❌ Nenhum Business Manager disponível para teste');
        console.log('Execute primeiro: app.loadBusinessManagers()');
    }
    
    console.log('=============================================');
}

// Função para testar permissões e fallbacks
function testPermissionsAndFallback() {
    console.log('🔍 === TESTE DE PERMISSÕES E FALLBACKS ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    if (!app.isAuthenticated && app.api.mode === 'real') {
        console.log('❌ Não autenticado. Execute primeiro: testFacebookLogin()');
        return;
    }
    
    console.log('🧪 Testando carregamento direto de todas as contas...');
    app.loadAllAccounts()
        .then(() => {
            console.log('✅ Carregamento direto bem-sucedido');
            console.log('- Contas encontradas:', app.availableAccounts?.length || 0);
            
            if (app.availableAccounts && app.availableAccounts.length > 0) {
                console.log('📋 Contas disponíveis:');
                app.availableAccounts.forEach((account, index) => {
                    console.log(`  ${index + 1}. ${account.name} (${account.currency}) - ${account.id}`);
                });
                
                // Verificar se a conta específica está disponível
                const targetAccount = app.availableAccounts.find(acc => acc.id.includes('4030832237237833'));
                if (targetAccount) {
                    console.log('🎯 Conta USD encontrada:', targetAccount.name);
                }
            }
        })
        .catch(error => {
            console.error('❌ Erro no carregamento direto:', error.message);
        });
    
    console.log('=============================================');
}

// Função para testar Business Manager
function testBusinessManager() {
    console.log('🔍 === TESTE DE BUSINESS MANAGER ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    if (!app.isAuthenticated && app.api.mode === 'real') {
        console.log('❌ Não autenticado. Execute primeiro: testFacebookLogin()');
        return;
    }
    
    console.log('📊 Status do Business Manager:');
    console.log('- Modo API:', app.api.mode);
    console.log('- BM selecionado:', app.selectedBusinessManagerId);
    console.log('- Business Managers disponíveis:', app.businessManagers?.length || 0);
    
    console.log('📋 Business Managers disponíveis:');
    if (app.businessManagers && app.businessManagers.length > 0) {
        app.businessManagers.forEach((bm, index) => {
            console.log(`  ${index + 1}. ${bm.name} (${bm.id})`);
        });
    } else {
        console.log('  Nenhum Business Manager disponível');
    }
    
    console.log('🧪 Para testar carregamento de contas:');
    if (app.businessManagers && app.businessManagers.length > 0) {
        const firstBM = app.businessManagers[0];
        console.log(`Execute: app.loadAccountsForBusinessManager('${firstBM.id}')`);
        
        // Teste automático
        console.log('🚀 Testando carregamento automático...');
        app.loadAccountsForBusinessManager(firstBM.id)
            .then(() => {
                console.log('✅ Teste de carregamento concluído');
                console.log('- Contas encontradas:', app.availableAccounts?.length || 0);
            })
            .catch(error => {
                console.error('❌ Erro no teste:', error.message);
            });
    } else {
        console.log('Execute primeiro: app.loadBusinessManagers()');
    }
    
    console.log('=====================================');
}

// Função para testar detecção de moedas
function testCurrencyDetection() {
    console.log('🔍 === TESTE DE DETECÇÃO DE MOEDAS ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    console.log('💰 Status da moeda:');
    console.log('- Moeda da conta selecionada:', app.selectedAccountCurrency);
    console.log('- Símbolo da moeda:', app.selectedAccountCurrencySymbol);
    console.log('- Info da moeda:', app.selectedAccountCurrencyInfo);
    
    console.log('🧪 Testando formatação:');
    
    // Testar valores em diferentes moedas
    const testValues = [100, 1500.50, 25000, 999999];
    
    testValues.forEach(value => {
        console.log(`Valor ${value}:`);
        console.log(`  USD: ${app.formatCurrency(value, 'USD')}`);
        console.log(`  BRL: ${app.formatCurrency(value, 'BRL')}`);
        console.log(`  Conta atual: ${app.formatCurrency(value)}`);
        console.log(`  Compacto: ${app.formatCurrencyCompact(value)}`);
    });
    
    console.log('📋 Contas e suas moedas:');
    if (app.availableAccounts && app.availableAccounts.length > 0) {
        app.availableAccounts.forEach((account, index) => {
            const currencyInfo = app.getCurrencyInfo(account.currency);
            console.log(`  ${index + 1}. ${account.name}`);
            console.log(`     ID: ${account.id}`);
            console.log(`     Moeda: ${currencyInfo.symbol} ${account.currency}`);
        });
    }
    
    console.log('🎯 Para testar específico da conta 4030832237237833:');
    const targetAccount = app.availableAccounts?.find(acc => acc.id.includes('4030832237237833'));
    if (targetAccount) {
        console.log('✅ Conta encontrada:', targetAccount.name);
        console.log('   Moeda:', targetAccount.currency);
        console.log('   Exemplo de gasto: $1,500.00 seria exibido como:', app.formatCurrency(1500, targetAccount.currency));
    } else {
        console.log('❌ Conta 4030832237237833 não encontrada nas contas disponíveis');
    }
    
    console.log('=====================================');
}

// Função para testar sincronização completa
function testAccountSync() {
    console.log('🔍 === TESTE DE SINCRONIZAÇÃO DE CONTAS ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    if (!app.isAuthenticated) {
        console.log('❌ Não autenticado. Execute primeiro: testFacebookLogin()');
        return;
    }
    
    console.log('📊 Status atual:');
    console.log('- Business Manager selecionado:', app.selectedBusinessManagerId);
    console.log('- Conta selecionada:', app.selectedAccountId);
    console.log('- Contas disponíveis:', app.availableAccounts?.length || 0);
    console.log('- Campanhas carregadas:', app.data?.campaigns?.length || 0);
    
    console.log('📋 Contas disponíveis:');
    if (app.availableAccounts && app.availableAccounts.length > 0) {
        app.availableAccounts.slice(0, 5).forEach((account, index) => {
            console.log(`  ${index + 1}. ${account.name} (${account.id})`);
        });
        
        if (app.availableAccounts.length > 5) {
            console.log(`  ... e mais ${app.availableAccounts.length - 5} contas`);
        }
    } else {
        console.log('  Nenhuma conta disponível');
    }
    
    console.log('🧪 Para testar manualmente:');
    console.log('1. Selecione um Business Manager no dropdown');
    console.log('2. Selecione uma conta de anúncios no dropdown');
    console.log('3. Verifique se as campanhas foram carregadas');
    
    console.log('=====================================');
}

// Função para testar busca de campanhas após conectar
function testCampaignsLoad() {
    console.log('🔍 === TESTE DE CARREGAMENTO DE CAMPANHAS ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    if (!app.isAuthenticated) {
        console.log('❌ Não autenticado. Execute primeiro: testFacebookLogin()');
        return;
    }
    
    if (!app.selectedAccountId) {
        console.log('❌ Nenhuma conta selecionada');
        return;
    }
    
    console.log('📊 Testando busca de campanhas...');
    console.log('- Conta selecionada:', app.selectedAccountId);
    console.log('- Access token presente:', !!app.api.accessToken);
    
    // Testar busca direta
    app.api.getCampaigns(app.selectedAccountId)
        .then(result => {
            console.log('✅ Campanhas buscadas com sucesso:', result);
            console.log('- Tipo:', typeof result);
            console.log('- Tem propriedade data:', result && result.hasOwnProperty('data'));
            console.log('- Data é array:', Array.isArray(result.data));
            console.log('- Quantidade:', result.data ? result.data.length : 'undefined');
            
            if (result.data && result.data.length > 0) {
                console.log('📋 Primeiras campanhas:');
                result.data.slice(0, 3).forEach((campaign, index) => {
                    console.log(`  ${index + 1}. ${campaign.name} (${campaign.status})`);
                });
            }
        })
        .catch(error => {
            console.error('❌ Erro ao buscar campanhas:', error);
        });
    
    console.log('=======================================');
}

// Função de diagnóstico completo
function fullDiagnostic() {
    console.log('🔬 === DIAGNÓSTICO COMPLETO ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    console.log('📋 1. VERIFICANDO ELEMENTOS DOM:');
    const elements = {
        apiMode: document.getElementById('apiMode'),
        facebookLoginBtn: document.getElementById('facebookLoginBtn'),
        statusIndicator: document.getElementById('statusIndicator'),
        statusText: document.getElementById('statusText')
    };
    
    Object.entries(elements).forEach(([name, element]) => {
        if (element) {
            console.log(`✅ ${name}: encontrado`);
            if (name === 'facebookLoginBtn') {
                console.log(`   - Display: ${element.style.display}`);
                console.log(`   - Visible: ${element.offsetWidth > 0 && element.offsetHeight > 0}`);
            }
            if (name === 'apiMode') {
                console.log(`   - Valor: ${element.value}`);
            }
        } else {
            console.log(`❌ ${name}: NÃO encontrado`);
        }
    });
    
    console.log('📋 2. STATUS DA APLICAÇÃO:');
    debugAPIConnection();
    
    console.log('📋 3. TESTE DE FORÇAR MODO REAL:');
    forceRealMode();
    
    console.log('📋 4. INSTRUÇÕES PARA TESTE MANUAL:');
    console.log('Tente no console:');
    console.log('1. forceRealMode() - força modo real');
    console.log('2. testFacebookLogin() - testa login');
    console.log('3. Ou clique no select de modo e mude para "API Real"');
    
    console.log('===============================');
}

// Tornar funções debug disponíveis globalmente
window.debugDataSync = debugDataSync;
window.debugAPIConnection = debugAPIConnection;
window.forceRealMode = forceRealMode;
window.testFacebookLogin = testFacebookLogin;
window.debugBM177341406299126 = debugBM177341406299126;
window.testBusinessManagerFiltering = testBusinessManagerFiltering;
window.testPermissionsAndFallback = testPermissionsAndFallback;
window.testBusinessManager = testBusinessManager;
window.testCurrencyDetection = testCurrencyDetection;
window.testAccountSync = testAccountSync;
window.testCampaignsLoad = testCampaignsLoad;
window.fullDiagnostic = fullDiagnostic;
window.debugFacebookConnection = debugFacebookConnection;
window.testFacebookLoginStep = testFacebookLoginStep;

// Função para debug específico de conexão Facebook
function debugFacebookConnection() {
    console.log('🔍 === DEBUG FACEBOOK CONNECTION ===');
    
    // 1. Verificar ambiente
    console.log('🌍 Ambiente:');
    console.log('- Protocol:', window.location.protocol);
    console.log('- Hostname:', window.location.hostname);
    console.log('- Is Production:', window.location.hostname.includes('vercel.app') || window.location.hostname.includes('layer-reports'));
    
    // 2. Verificar App
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    console.log('📱 App Status:');
    console.log('- Mode:', app.api.mode);
    console.log('- Is HTTPS:', app.api.isHttps);
    console.log('- App ID:', app.api.facebookAppId);
    console.log('- SDK Loaded:', app.api.isSDKLoaded);
    
    // 3. Verificar Facebook SDK
    console.log('📘 Facebook SDK:');
    console.log('- FB Available:', typeof window.FB !== 'undefined');
    if (typeof window.FB !== 'undefined') {
        console.log('- FB API Available:', typeof window.FB.api === 'function');
        console.log('- FB Login Available:', typeof window.FB.login === 'function');
    }
    
    // 4. Testar inicialização SDK
    console.log('🧪 Testando inicialização SDK...');
    app.api.initFacebookSDK()
        .then(() => {
            console.log('✅ SDK inicializado com sucesso');
            
            // 5. Testar login
            console.log('🧪 Testando capacidade de login...');
            if (window.FB && window.FB.getLoginStatus) {
                window.FB.getLoginStatus((response) => {
                    console.log('📊 Status de login:', response.status);
                    console.log('🔑 Response completo:', response);
                });
            }
        })
        .catch((error) => {
            console.error('❌ Erro na inicialização SDK:', error);
            
            // Diagnóstico adicional
            console.log('🔧 Sugestões de correção:');
            if (window.location.protocol === 'http:') {
                console.log('- ⚠️ Use HTTPS para Facebook SDK');
            }
            if (!window.location.hostname.includes('vercel.app')) {
                console.log('- ⚠️ Configure domínio no Facebook App');
            }
        });
    
    console.log('===========================================');
}

// Função para testar login Facebook passo a passo
async function testFacebookLoginStep() {
    console.log('🧪 === TESTE FACEBOOK LOGIN PASSO A PASSO ===');
    
    if (typeof window.metaAdsApp === 'undefined') {
        console.log('❌ App não inicializado');
        return;
    }
    
    const app = window.metaAdsApp;
    
    try {
        // Passo 1: Verificar modo
        console.log('1️⃣ Verificando modo API...');
        if (app.api.mode !== 'real') {
            console.log('⚠️ Alterando para modo real...');
            app.api.setMode('real');
        }
        console.log('✅ Modo real ativo');
        
        // Passo 2: Inicializar SDK
        console.log('2️⃣ Inicializando Facebook SDK...');
        await app.api.initFacebookSDK();
        console.log('✅ SDK inicializado');
        
        // Passo 3: Verificar FB
        console.log('3️⃣ Verificando FB object...');
        if (typeof window.FB === 'undefined') {
            throw new Error('FB object não disponível');
        }
        console.log('✅ FB object disponível');
        
        // Passo 4: Testar getLoginStatus
        console.log('4️⃣ Verificando status de login...');
        window.FB.getLoginStatus((response) => {
            console.log('📊 Status atual:', response.status);
            console.log('📋 Response completa:', response);
            
            // Passo 5: Tentar login
            console.log('5️⃣ Iniciando processo de login...');
            console.log('🔑 Permissões solicitadas:', app.api.requiredPermissions);
            
            window.FB.login((loginResponse) => {
                console.log('📊 Login response:', loginResponse);
                
                if (loginResponse.authResponse) {
                    console.log('✅ Login bem-sucedido!');
                    console.log('🔑 Access Token:', loginResponse.authResponse.accessToken);
                    
                    // Passo 6: Testar API call
                    console.log('6️⃣ Testando chamada /me...');
                    window.FB.api('/me', { fields: 'name,email,picture' }, (meResponse) => {
                        if (meResponse.error) {
                            console.error('❌ Erro na API /me:', meResponse.error);
                        } else {
                            console.log('✅ Dados do usuário:', meResponse);
                        }
                    });
                } else {
                    console.warn('❌ Login cancelado ou falhou');
                    console.log('📋 Status:', loginResponse.status);
                }
            }, { 
                scope: app.api.requiredPermissions.join(','),
                return_scopes: true 
            });
        });
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
    
    console.log('===============================================');
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.metaAdsApp = new MetaAdsInsights();
});

// Debug helpers for API connection
window.debugAPI = function() {
    const app = window.metaAdsApp;
    if (app) {
        console.log('=== DEBUG INFO ===');
        console.log('Current mode:', app.api.mode);
        console.log('App ID:', app.api.facebookAppId);
        console.log('Access Token:', app.api.accessToken ? 'Present' : 'Not found');
        console.log('SDK Loaded:', app.api.isSDKLoaded);
        console.log('Connection Status:', app.api.connectionStatus);
        console.log('Authenticated:', app.isAuthenticated);
        console.log('Selected Account:', app.selectedAccountId);
        console.log('Business Managers:', app.businessManagers);
        console.log('Selected BM:', app.selectedBusinessManagerId);
        console.log('Available Accounts:', app.availableAccounts);
        console.log('==================');
        
        // Test Facebook SDK
        if (window.FB) {
            console.log('Facebook SDK available');
            FB.getLoginStatus(response => {
                console.log('FB Login Status:', response);
            });
        } else {
            console.log('Facebook SDK not loaded');
        }
    }
};

// Debug function specifically for Business Manager
window.debugBM = async function() {
    const app = window.metaAdsApp;
    if (app && app.api.mode === 'real' && app.isAuthenticated) {
        console.log('=== BUSINESS MANAGER DEBUG ===');
        
        try {
            // Test direct BM access
            const targetBMId = '177341406299126';
            console.log(`Testing direct access to BM ${targetBMId}...`);
            
            const specificBM = await app.api.getSpecificBusinessManager(targetBMId);
            console.log('Direct BM result:', specificBM);
            
            // Test BM permissions
            FB.api('/me/permissions', { access_token: app.api.accessToken }, (response) => {
                console.log('User permissions:', response);
            });
            
            // Test all business endpoints
            const endpoints = ['/me/businesses', '/me/owned_businesses', '/me/client_businesses'];
            
            for (const endpoint of endpoints) {
                FB.api(endpoint, {
                    fields: 'id,name,created_time',
                    access_token: app.api.accessToken
                }, (response) => {
                    console.log(`${endpoint} result:`, response);
                });
            }
            
        } catch (error) {
            console.error('Debug BM error:', error);
        }
        
        console.log('============================');
    } else {
        console.log('Not authenticated or not in real mode');
    }
};

// Debug function for data structure issues
window.debugDataStructure = function() {
    const app = window.metaAdsApp;
    if (app) {
        console.log('=== DATA STRUCTURE DEBUG ===');
        console.log('Business Managers:', app.businessManagers);
        console.log('Available Accounts:', app.availableAccounts);
        console.log('Selected Account ID:', app.selectedAccountId);
        console.log('Current Data:', app.data);
        console.log('All Campaigns:', app.allCampaigns);
        
        // Test API methods manually
        if (app.api.mode === 'real' && app.isAuthenticated) {
            console.log('Testing API methods...');
            
            app.api.getAdAccounts().then(accounts => {
                console.log('getAdAccounts result:', accounts);
            }).catch(error => {
                console.error('getAdAccounts error:', error);
            });
            
            if (app.selectedAccountId) {
                app.api.getCampaigns(app.selectedAccountId).then(campaigns => {
                    console.log('getCampaigns result:', campaigns);
                }).catch(error => {
                    console.error('getCampaigns error:', error);
                });
            }
        }
        
        console.log('============================');
    }
};