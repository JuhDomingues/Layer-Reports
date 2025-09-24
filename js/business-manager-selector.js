// Sistema de seleção de gerenciadores de negócios e contas
window.BusinessManagerSelector = {
    
    currentBusinessManager: null,
    availableBusinessManagers: [],
    availableAccounts: [],
    
    // Buscar gerenciadores de negócios disponíveis
    async getBusinessManagers() {
        console.log('🏢 === BUSCANDO GERENCIADORES DE NEGÓCIOS ===');
        
        if (!window.metaAdsApp || !window.metaAdsApp.api) {
            throw new Error('Sistema não inicializado');
        }
        
        try {
            const response = await window.metaAdsApp.api.getBusinessManagers();
            
            if (response && response.data) {
                this.availableBusinessManagers = response.data;
                console.log(`📊 ${response.data.length} gerenciadores encontrados:`);
                response.data.forEach((bm, index) => {
                    console.log(`  ${index + 1}. ${bm.name} (${bm.id})`);
                });
                return response.data;
            } else {
                console.log('⚠️ Nenhum gerenciador encontrado ou usuário sem permissão');
                return [];
            }
        } catch (error) {
            console.error('❌ Erro ao buscar gerenciadores:', error);
            return [];
        }
    },
    
    // Buscar contas de um gerenciador específico
    async getAccountsForBusinessManager(businessManagerId) {
        console.log(`🔍 Buscando contas do gerenciador: ${businessManagerId}`);
        
        try {
            const response = await window.metaAdsApp.api.getAdAccounts(businessManagerId);
            
            if (response && response.data) {
                console.log(`📊 ${response.data.length} contas encontradas no gerenciador`);
                return response.data;
            } else {
                return [];
            }
        } catch (error) {
            console.error('❌ Erro ao buscar contas do gerenciador:', error);
            return [];
        }
    },
    
    // Mostrar interface de seleção
    async showBusinessManagerSelector() {
        console.log('🎯 === MOSTRANDO SELETOR DE GERENCIADORES ===');
        
        try {
            // Buscar gerenciadores disponíveis
            const businessManagers = await this.getBusinessManagers();
            
            // Se não houver gerenciadores ou só houver um, usar método padrão
            if (businessManagers.length === 0) {
                console.log('📝 Nenhum gerenciador encontrado, usando contas diretas');
                return window.AccountManager.showAccountSelection();
            }
            
            if (businessManagers.length === 1) {
                console.log('📝 Apenas um gerenciador, selecionando automaticamente');
                return this.selectBusinessManagerAndShowAccounts(businessManagers[0].id, businessManagers[0].name);
            }
            
            // Mostrar interface de seleção de gerenciadores
            this.createBusinessManagerModal(businessManagers);
            
        } catch (error) {
            console.error('❌ Erro ao mostrar seletor:', error);
            alert(`❌ Erro ao carregar gerenciadores:\n\n${error.message}`);
        }
    },
    
    // Criar modal de seleção de gerenciadores
    createBusinessManagerModal(businessManagers) {
        // Remover modal existente
        const existingModal = document.getElementById('business-manager-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'business-manager-modal';
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
            max-width: 600px !important;
            width: 90% !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            font-family: system-ui, -apple-system, sans-serif !important;
        `;
        
        let html = `
            <h2 style="color: #1877f2; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                🏢 Selecionar Gerenciador de Negócios
            </h2>
            <p style="margin-bottom: 20px; color: #666;">
                Selecione um gerenciador de negócios para ver suas contas de anúncios:
            </p>
        `;
        
        businessManagers.forEach((bm, index) => {
            html += `
                <div class="business-manager-option" data-bm-id="${bm.id}" data-bm-name="${bm.name}" style="
                    padding: 15px; 
                    margin: 10px 0; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 10px; 
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: linear-gradient(135deg, #1877f2, #166fe5);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 14px;
                    ">${bm.name.charAt(0)}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">${bm.name}</div>
                        <div style="color: #6b7280; font-size: 12px;">ID: ${bm.id}</div>
                    </div>
                    <div style="color: #1877f2;">→</div>
                </div>
            `;
        });
        
        html += `
            <div style="margin-top: 25px; text-align: center;">
                <button id="show-all-accounts" style="
                    background: #6b7280; 
                    color: white; 
                    border: none; 
                    padding: 12px 20px; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-size: 14px;
                    margin-right: 10px;
                ">
                    📋 Ver Todas as Contas
                </button>
                <button id="cancel-bm-selection" style="
                    background: #e5e7eb; 
                    color: #374151; 
                    border: none; 
                    padding: 12px 20px; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-size: 14px;
                ">
                    Cancelar
                </button>
            </div>
        `;
        
        content.innerHTML = html;
        
        // Adicionar eventos
        content.querySelectorAll('.business-manager-option').forEach(option => {
            option.addEventListener('mouseenter', function() {
                this.style.borderColor = '#1877f2';
                this.style.backgroundColor = '#f8faff';
            });
            
            option.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e5e7eb';
                this.style.backgroundColor = 'white';
            });
            
            option.addEventListener('click', async function() {
                const bmId = this.dataset.bmId;
                const bmName = this.dataset.bmName;
                
                modal.remove();
                await BusinessManagerSelector.selectBusinessManagerAndShowAccounts(bmId, bmName);
            });
        });
        
        // Botão para ver todas as contas (método original)
        content.querySelector('#show-all-accounts').addEventListener('click', () => {
            modal.remove();
            window.AccountManager.showAccountSelection();
        });
        
        content.querySelector('#cancel-bm-selection').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.appendChild(content);
        document.body.appendChild(modal);
    },
    
    // Selecionar gerenciador e mostrar suas contas
    async selectBusinessManagerAndShowAccounts(businessManagerId, businessManagerName) {
        console.log(`🏢 Selecionado gerenciador: ${businessManagerName} (${businessManagerId})`);
        
        try {
            this.currentBusinessManager = {
                id: businessManagerId,
                name: businessManagerName
            };
            
            // Salvar no localStorage
            localStorage.setItem('selected_business_manager', JSON.stringify(this.currentBusinessManager));
            
            // Buscar contas do gerenciador
            const accounts = await this.getAccountsForBusinessManager(businessManagerId);
            
            if (accounts.length === 0) {
                alert(`⚠️ Nenhuma conta encontrada no gerenciador "${businessManagerName}".\n\nVerifique as permissões ou tente outro gerenciador.`);
                return;
            }
            
            // Mostrar contas do gerenciador
            this.showAccountsModal(accounts, businessManagerName);
            
        } catch (error) {
            console.error('❌ Erro ao selecionar gerenciador:', error);
            alert(`❌ Erro ao carregar contas do gerenciador:\n\n${error.message}`);
        }
    },
    
    // Modal para mostrar contas de um gerenciador específico
    showAccountsModal(accounts, businessManagerName) {
        // Remover modal existente
        const existingModal = document.getElementById('accounts-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'accounts-modal';
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
            max-width: 700px !important;
            width: 90% !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            font-family: system-ui, -apple-system, sans-serif !important;
        `;
        
        let html = `
            <h2 style="color: #1877f2; margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
                📊 Contas de Anúncios
            </h2>
            <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
                <strong>Gerenciador:</strong> ${businessManagerName}<br>
                <strong>Contas encontradas:</strong> ${accounts.length}
            </p>
        `;
        
        accounts.forEach((account, index) => {
            const currency = account.currency || 'BRL';
            const status = account.account_status ? 'Ativa' : 'Inativa';
            const statusColor = account.account_status ? '#10b981' : '#ef4444';
            
            html += `
                <div class="account-option" data-account-id="${account.id}" data-account-name="${account.name}" style="
                    padding: 15px; 
                    margin: 8px 0; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 10px; 
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: linear-gradient(135deg, #10b981, #059669);
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: bold;
                        font-size: 12px;
                    ">${currency}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">${account.name}</div>
                        <div style="color: #6b7280; font-size: 12px; display: flex; gap: 15px;">
                            <span>ID: ${account.id}</span>
                            <span style="color: ${statusColor};">● ${status}</span>
                        </div>
                    </div>
                    <div style="color: #1877f2;">▶</div>
                </div>
            `;
        });
        
        html += `
            <div style="margin-top: 25px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                <button id="back-to-managers" style="
                    background: #6b7280; 
                    color: white; 
                    border: none; 
                    padding: 12px 20px; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-size: 14px;
                ">
                    ← Voltar aos Gerenciadores
                </button>
                <button id="cancel-account-selection" style="
                    background: #e5e7eb; 
                    color: #374151; 
                    border: none; 
                    padding: 12px 20px; 
                    border-radius: 8px; 
                    cursor: pointer; 
                    font-size: 14px;
                ">
                    Cancelar
                </button>
            </div>
        `;
        
        content.innerHTML = html;
        
        // Adicionar eventos às contas
        content.querySelectorAll('.account-option').forEach(option => {
            option.addEventListener('mouseenter', function() {
                this.style.borderColor = '#10b981';
                this.style.backgroundColor = '#f0fdf4';
            });
            
            option.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e5e7eb';
                this.style.backgroundColor = 'white';
            });
            
            option.addEventListener('click', async function() {
                const accountId = this.dataset.accountId;
                const accountName = this.dataset.accountName;
                
                console.log(`✅ Conta selecionada: ${accountName} (${accountId})`);
                
                // Configurar conta no sistema
                window.metaAdsApp.selectedAccountId = accountId;
                window.metaAdsApp.api.accountId = accountId;
                
                localStorage.setItem('selected_account_id', accountId);
                localStorage.setItem('selected_account_name', accountName);
                
                modal.remove();
                
                // Carregar dados da conta selecionada
                try {
                    await window.AccountManager.loadDataWithAccount();
                    console.log(`🎉 Dados carregados para: ${accountName}`);
                } catch (error) {
                    alert(`❌ Erro ao carregar dados: ${error.message}`);
                }
            });
        });
        
        // Botão voltar
        content.querySelector('#back-to-managers').addEventListener('click', () => {
            modal.remove();
            BusinessManagerSelector.showBusinessManagerSelector();
        });
        
        content.querySelector('#cancel-account-selection').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.appendChild(content);
        document.body.appendChild(modal);
    },
    
    // Restaurar seleções salvas
    restoreSavedSelections() {
        const savedBM = localStorage.getItem('selected_business_manager');
        if (savedBM) {
            try {
                this.currentBusinessManager = JSON.parse(savedBM);
                console.log(`🏢 Gerenciador restaurado: ${this.currentBusinessManager.name}`);
            } catch (error) {
                console.warn('⚠️ Erro ao restaurar gerenciador salvo');
            }
        }
    }
};

// Funções globais de conveniência
window.showBusinessManagerSelector = function() {
    BusinessManagerSelector.showBusinessManagerSelector();
};

window.selectBusinessManager = function(id, name) {
    return BusinessManagerSelector.selectBusinessManagerAndShowAccounts(id, name);
};

// Restaurar seleções ao carregar
document.addEventListener('DOMContentLoaded', () => {
    BusinessManagerSelector.restoreSavedSelections();
});

console.log('🏢 Business Manager Selector carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• showBusinessManagerSelector() - Abrir seletor de gerenciadores');
console.log('• selectBusinessManager(id, name) - Selecionar gerenciador específico');