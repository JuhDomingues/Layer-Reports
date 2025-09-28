// Sistema para gerenciar contas automaticamente
window.AccountManager = {
    
    // Buscar e selecionar automaticamente uma conta
    async autoSelectAccount() {
        console.log('🔍 === BUSCANDO CONTAS AUTOMATICAMENTE ===');
        
        if (!window.metaAdsApp) {
            console.error('❌ App principal não encontrado');
            return null;
        }
        
        const app = window.metaAdsApp;
        
        try {
            // Verificar se já tem uma conta selecionada
            if (app.selectedAccountId) {
                console.log(`✅ Conta já selecionada: ${app.selectedAccountId}`);
                return app.selectedAccountId;
            }
            
            console.log('🔄 Buscando contas de anúncios...');
            
            // Buscar contas disponíveis
            const accounts = await app.api.getAdAccounts();
            
            if (!accounts || !accounts.data || accounts.data.length === 0) {
                console.error('❌ Nenhuma conta encontrada');
                throw new Error('Nenhuma conta de anúncios encontrada');
            }
            
            console.log(`📊 ${accounts.data.length} contas encontradas:`);
            accounts.data.forEach((account, index) => {
                console.log(`  ${index + 1}. ${account.name} (${account.id})`);
            });
            
            // Selecionar a primeira conta disponível
            const selectedAccount = accounts.data[0];
            app.selectedAccountId = selectedAccount.id;
            app.api.accountId = selectedAccount.id;
            
            console.log(`✅ Conta selecionada automaticamente: ${selectedAccount.name} (${selectedAccount.id})`);
            
            // Salvar no localStorage para próximas vezes
            localStorage.setItem('selected_account_id', selectedAccount.id);
            localStorage.setItem('selected_account_name', selectedAccount.name);
            
            return selectedAccount.id;
            
        } catch (error) {
            console.error('❌ Erro ao buscar contas:', error);
            throw error;
        }
    },
    
    // Carregar dados reais com conta selecionada
    async loadDataWithAccount() {
        console.log('📊 === CARREGANDO DADOS COM CONTA SELECIONADA ===');
        
        // Se estiver em configuração fixa, usar dados demo
        if (localStorage.getItem('is_fixed_configuration') === 'true') {
            console.log('🎯 Configuração fixa detectada - usando dados demo da Layer Reports');
            if (window.metaAdsApp) {
                window.metaAdsApp.showLoading('Carregando dados da Layer Reports...');
                await new Promise(resolve => setTimeout(resolve, 1500));
                window.metaAdsApp.data = window.metaAdsApp.generateMockData();
                window.metaAdsApp.allCampaigns = [...window.metaAdsApp.data.campaigns];
                window.metaAdsApp.updateKPIs();
                window.metaAdsApp.updateCampaignsTable();
                window.metaAdsApp.updateCharts();
                window.metaAdsApp.hideLoading();
                window.metaAdsApp.showSuccess('Dados da Layer Reports carregados!');
            }
            return true;
        }
        
        try {
            // Primeiro buscar e selecionar conta
            const accountId = await this.autoSelectAccount();
            
            if (!accountId) {
                throw new Error('Não foi possível selecionar uma conta');
            }
            
            // Agora carregar os dados reais
            if (window.metaAdsApp && window.metaAdsApp.loadRealData) {
                console.log('🔄 Carregando dados reais...');
                await window.metaAdsApp.loadRealData();
                console.log('✅ Dados reais carregados com sucesso');
                
                // Inicializar filtros após carregar dados
                setTimeout(() => {
                    if (window.CampaignFilters) {
                        window.CampaignFilters.init();
                        console.log('✅ Filtros de campanha inicializados');
                    }
                    if (window.updateFilterButton) {
                        window.updateFilterButton();
                    }
                }, 1000);
                
                return true;
            } else {
                console.error('❌ Método loadRealData não encontrado');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            throw error;
        }
    },
    
    // Verificar token e buscar contas
    async initializeWithToken() {
        console.log('🔑 === INICIALIZANDO COM TOKEN ===');
        
        if (!window.metaAdsApp) {
            console.error('❌ App principal não carregado');
            return false;
        }
        
        const app = window.metaAdsApp;
        const token = localStorage.getItem('facebook_access_token');
        
        if (!token) {
            console.error('❌ Token não encontrado');
            return false;
        }
        
        try {
            // Configurar API com token
            app.api.accessToken = token;
            app.api.setMode('real');
            app.isAuthenticated = true;
            
            console.log('✅ Token configurado na API');
            
            // Buscar e carregar dados
            await this.loadDataWithAccount();
            
            // Atualizar UI
            app.updateUIForMode('real');
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            
            // Mostrar erro de forma amigável
            if (error.message.includes('conta')) {
                alert('⚠️ Token válido, mas nenhuma conta de anúncios encontrada.\n\nVerifique se sua conta tem acesso ao Meta Ads Manager.');
            } else {
                alert(`❌ Erro ao carregar dados:\n\n${error.message}`);
            }
            
            return false;
        }
    },
    
    // Mostrar interface de seleção de conta (se múltiplas)
    async showAccountSelection() {
        console.log('🔍 === MOSTRANDO SELEÇÃO DE CONTAS ===');
        
        // Verificar se deve usar o seletor de gerenciadores de negócios
        if (window.BusinessManagerSelector) {
            console.log('🏢 Usando seletor de gerenciadores de negócios');
            return window.BusinessManagerSelector.showBusinessManagerSelector();
        }
        
        try {
            const accounts = await window.metaAdsApp.api.getAdAccounts();
            
            if (!accounts || !accounts.data || accounts.data.length <= 1) {
                // Uma ou nenhuma conta, não precisa mostrar seleção
                return;
            }
            
            // Criar modal de seleção
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: rgba(0,0,0,0.8) !important;
                z-index: 9999999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                background: white !important;
                padding: 30px !important;
                border-radius: 12px !important;
                max-width: 500px !important;
                width: 90% !important;
                max-height: 80vh !important;
                overflow-y: auto !important;
                font-family: system-ui, -apple-system, sans-serif !important;
            `;
            
            let accountsHTML = '<h3>📊 Selecionar Conta de Anúncios</h3><p>Múltiplas contas encontradas. Selecione uma:</p>';
            
            accounts.data.forEach((account, index) => {
                accountsHTML += `
                    <div class="account-option" data-account-id="${account.id}" data-account-name="${account.name}" style="
                        padding: 12px; 
                        margin: 8px 0; 
                        border: 2px solid #ddd; 
                        border-radius: 8px; 
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        <strong>${account.name}</strong><br>
                        <small style="color: #666;">ID: ${account.id}</small>
                    </div>
                `;
            });
            
            accountsHTML += '<div style="margin-top: 20px; text-align: center;"><button id="cancel-account-selection" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Cancelar</button></div>';
            
            content.innerHTML = accountsHTML;
            
            // Adicionar eventos
            content.querySelectorAll('.account-option').forEach(option => {
                option.addEventListener('mouseenter', function() {
                    this.style.borderColor = '#1877f2';
                    this.style.backgroundColor = '#f0f8ff';
                });
                
                option.addEventListener('mouseleave', function() {
                    this.style.borderColor = '#ddd';
                    this.style.backgroundColor = 'white';
                });
                
                option.addEventListener('click', async function() {
                    const accountId = this.dataset.accountId;
                    const accountName = this.dataset.accountName;
                    
                    console.log(`✅ Conta selecionada pelo usuário: ${accountName} (${accountId})`);
                    
                    // Configurar conta selecionada
                    window.metaAdsApp.selectedAccountId = accountId;
                    window.metaAdsApp.api.accountId = accountId;
                    
                    localStorage.setItem('selected_account_id', accountId);
                    localStorage.setItem('selected_account_name', accountName);
                    
                    modal.remove();
                    
                    // Carregar dados
                    try {
                        await AccountManager.loadDataWithAccount();
                        alert(`✅ Dados carregados para: ${accountName}`);
                    } catch (error) {
                        alert(`❌ Erro ao carregar dados: ${error.message}`);
                    }
                });
            });
            
            content.querySelector('#cancel-account-selection').addEventListener('click', () => {
                modal.remove();
            });
            
            modal.appendChild(content);
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar seleção de contas:', error);
        }
    }
};

// Funções globais de conveniência
window.autoSelectAccount = function() {
    return AccountManager.autoSelectAccount();
};

window.loadDataWithAccount = function() {
    return AccountManager.loadDataWithAccount();
};

window.initializeWithToken = function() {
    return AccountManager.initializeWithToken();
};

window.showAccountSelection = function() {
    return AccountManager.showAccountSelection();
};

console.log('🔍 Account Manager carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• autoSelectAccount() - Buscar e selecionar primeira conta');
console.log('• loadDataWithAccount() - Carregar dados com conta selecionada');
console.log('• initializeWithToken() - Inicializar completamente com token');
console.log('• showAccountSelection() - Mostrar seleção de múltiplas contas');