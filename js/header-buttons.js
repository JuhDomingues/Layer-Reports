// Script para gerenciar botões integrados no cabeçalho
(function() {
    'use strict';
    
    console.log('🎯 === BOTÕES DO CABEÇALHO ===');
    
    // Configurar botões do cabeçalho
    function setupHeaderButtons() {
        setupAccountSelectorButton();
        setupAdAccountsSelectorButton();
        // setupFiltersButton(); // Removido - botão não está mais presente
    }
    
    // Configurar botão de seleção de contas
    function setupAccountSelectorButton() {
        const btn = document.getElementById('accountSelectorHeaderBtn');
        if (!btn) {
            console.warn('⚠️ Botão de seleção de contas não encontrado');
            return;
        }
        
        // Atualizar texto - mostrar sempre como conectado ao BM fixo
        btn.innerHTML = '<i class="fas fa-building"></i><span>Dr. Santiago Vecina - Layer...</span>';
        
        // Ação do clique - agora apenas mostra status
        btn.addEventListener('click', function() {
            showInfoMessage('Business Manager configurado: Dr. Santiago Vecina (177341406299126)');
        });
        
        console.log('✅ Botão de seleção de contas configurado');
    }
    
    // Configurar botão de seleção de contas de anúncios
    function setupAdAccountsSelectorButton() {
        console.log('🔧 Configurando botão de seleção de contas de anúncios...');
        const btn = document.getElementById('adAccountsSelectorBtn');
        if (!btn) {
            console.warn('⚠️ Botão de seleção de contas de anúncios não encontrado');
            return;
        }
        
        console.log('✅ Botão encontrado:', btn);
        
        // Atualizar estado inicial - sempre disponível agora
        updateAdAccountsButtonState(btn);
        
        // Ação do clique - buscar diretamente do BM fixo
        btn.addEventListener('click', function() {
            console.log('🔥 CLIQUE DETECTADO no botão de contas de anúncios!');
            console.log('💳 Buscando contas do Business Manager 177341406299126...');
            showAdAccountsSelectorWithToken();
        });
        
        console.log('✅ Botão de seleção de contas de anúncios configurado');
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
    
    // Atualizar estado do botão de contas de anúncios
    function updateAdAccountsButtonState(btn) {
        const selectedAdAccount = localStorage.getItem('selected_ad_account');
        
        if (selectedAdAccount) {
            try {
                const accountData = JSON.parse(selectedAdAccount);
                let displayName = accountData.name || accountData.account_id || 'Conta Selecionada';
                
                // Limitar tamanho do texto
                if (displayName.length > 20) {
                    displayName = displayName.substring(0, 20) + '...';
                }
                
                btn.classList.remove('disabled');
                btn.innerHTML = `<i class="fas fa-check-circle"></i><span>${displayName}</span>`;
                btn.style.cursor = 'pointer';
            } catch (e) {
                btn.classList.remove('disabled');
                btn.innerHTML = '<i class="fas fa-credit-card"></i><span>Selecionar Conta</span>';
                btn.style.cursor = 'pointer';
            }
        } else {
            // Sempre disponível - não depende mais do BM conectado
            btn.classList.remove('disabled');
            btn.innerHTML = '<i class="fas fa-credit-card"></i><span>Selecionar Conta</span>';
            btn.style.cursor = 'pointer';
        }
    }
    
    // Mostrar seletor de contas de anúncios
    async function showAdAccountsSelector() {
        let adAccounts = [];
        
        try {
            // Tentar buscar contas do localStorage primeiro
            const storedAccounts = localStorage.getItem('available_ad_accounts');
            if (storedAccounts) {
                adAccounts = JSON.parse(storedAccounts);
            }
            
            // Se não houver contas armazenadas, buscar via API
            if (adAccounts.length === 0) {
                showLoadingModal('Buscando contas de anúncios...');
                adAccounts = await fetchAdAccountsFromAPI();
                hideLoadingModal();
            }
            
            if (adAccounts.length === 0) {
                showErrorMessage('Nenhuma conta de anúncios encontrada no Business Manager');
                return;
            }
            
            // Criar modal de seleção
            createAdAccountsModal(adAccounts);
            
        } catch (error) {
            hideLoadingModal();
            console.error('Erro ao buscar contas:', error);
            showErrorMessage(`Erro ao buscar contas: ${error.message}`);
        }
    }
    
    // Buscar contas de anúncios via API
    async function fetchAdAccountsFromAPI() {
        const bmId = localStorage.getItem('connected_bm_id');
        if (!bmId) {
            throw new Error('Business Manager não conectado');
        }
        
        return new Promise((resolve, reject) => {
            if (!window.FB) {
                reject(new Error('Facebook SDK não carregado'));
                return;
            }
            
            // Usar o access token da sessão atual sem sobrescrever
            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    const accessToken = response.authResponse.accessToken;
                    
                    FB.api(`/${bmId}/owned_ad_accounts`, {
                        fields: 'id,name,account_status,currency,business_country_code,timezone_name',
                        access_token: accessToken  // Passar token diretamente
                    }, function(apiResponse) {
                        if (apiResponse && !apiResponse.error) {
                            const accounts = apiResponse.data || [];
                            localStorage.setItem('available_ad_accounts', JSON.stringify(accounts));
                            resolve(accounts);
                        } else {
                            reject(new Error(apiResponse.error?.message || 'Erro ao buscar contas'));
                        }
                    });
                } else {
                    reject(new Error('Usuário não conectado ao Facebook'));
                }
            });
        });
    }
    
    // Criar modal de seleção de contas
    function createAdAccountsModal(adAccounts) {
        const modal = document.createElement('div');
        modal.id = 'ad-accounts-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease-out;
        `;
        
        const selectedAccount = localStorage.getItem('selected_ad_account');
        let selectedAccountId = null;
        try {
            if (selectedAccount) {
                selectedAccountId = JSON.parse(selectedAccount).id;
            }
        } catch (e) {}
        
        const accountsList = adAccounts.map(account => {
            const isSelected = selectedAccountId === account.id;
            const statusColor = account.account_status === 1 ? '#10b981' : '#f59e0b';
            const statusText = account.account_status === 1 ? 'Ativa' : 'Inativa';
            
            return `
                <div class="account-item ${isSelected ? 'selected' : ''}" data-account='${JSON.stringify(account)}' style="
                    padding: 1rem;
                    border: 2px solid ${isSelected ? '#8b5cf6' : '#e5e7eb'};
                    border-radius: 8px;
                    margin-bottom: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: ${isSelected ? '#f3f4f6' : 'white'};
                ">
                    <div style="display: flex; justify-content: between; align-items: center;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.25rem; color: #374151; font-size: 0.9rem;">${account.name || account.id}</h4>
                            <p style="margin: 0; color: #6b7280; font-size: 0.8rem;">ID: ${account.id}</p>
                            <p style="margin: 0.25rem 0 0; color: #6b7280; font-size: 0.8rem;">
                                ${account.currency || 'USD'} • ${account.business_country_code || 'US'}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <span style="
                                background: ${statusColor};
                                color: white;
                                padding: 0.25rem 0.5rem;
                                border-radius: 4px;
                                font-size: 0.75rem;
                                font-weight: 500;
                            ">${statusText}</span>
                            ${isSelected ? '<i class="fas fa-check-circle" style="color: #8b5cf6; margin-left: 0.5rem;"></i>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; color: #374151;">Selecionar Conta de Anúncios</h3>
                    <button id="close-accounts-modal" style="
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        color: #6b7280;
                        cursor: pointer;
                        padding: 0.25rem;
                    ">×</button>
                </div>
                
                <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">
                    Encontradas ${adAccounts.length} conta(s) no Business Manager
                </p>
                
                <div class="accounts-list">
                    ${accountsList}
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                    <button id="cancel-account-selection" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Cancelar</button>
                    <button id="confirm-account-selection" style="
                        background: #8b5cf6;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Confirmar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        let selectedAccountData = null;
        
        // Seleção de conta
        modal.querySelectorAll('.account-item').forEach(item => {
            item.addEventListener('click', function() {
                // Remover seleção anterior
                modal.querySelectorAll('.account-item').forEach(i => {
                    i.classList.remove('selected');
                    i.style.border = '2px solid #e5e7eb';
                    i.style.background = 'white';
                    const checkIcon = i.querySelector('.fa-check-circle');
                    if (checkIcon) checkIcon.remove();
                });
                
                // Adicionar seleção atual
                this.classList.add('selected');
                this.style.border = '2px solid #8b5cf6';
                this.style.background = '#f3f4f6';
                this.querySelector('div:last-child').innerHTML += '<i class="fas fa-check-circle" style="color: #8b5cf6; margin-left: 0.5rem;"></i>';
                
                selectedAccountData = JSON.parse(this.dataset.account);
            });
        });
        
        // Botão fechar
        modal.querySelector('#close-accounts-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Botão cancelar
        modal.querySelector('#cancel-account-selection').addEventListener('click', () => {
            modal.remove();
        });
        
        // Botão confirmar
        modal.querySelector('#confirm-account-selection').addEventListener('click', async () => {
            console.log('🔥 CONFIRMAÇÃO CLICADA!');
            if (selectedAccountData) {
                console.log('🎯 Conta selecionada:', selectedAccountData);
                localStorage.setItem('selected_ad_account', JSON.stringify(selectedAccountData));
                localStorage.setItem('selected_ad_account_id', selectedAccountData.id);
                
                showSuccessMessage(`Conta "${selectedAccountData.name || selectedAccountData.id}" selecionada!`);
                
                // Atualizar botão
                const btn = document.getElementById('adAccountsSelectorBtn');
                if (btn) updateAdAccountsButtonState(btn);
                
                modal.remove();
                
                // Sincronizar campanhas da conta selecionada
                console.log('🚀 Iniciando sincronização de campanhas para conta:', selectedAccountData.id);
                await loadCampaignsForSelectedAccount(selectedAccountData.id);
            } else {
                console.warn('❌ Nenhuma conta selecionada');
                showErrorMessage('Selecione uma conta primeiro');
            }
        });
        
        // Fechar ao clicar fora
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Conectar ao Business Manager via API do Facebook
    async function connectToBusinessManager() {
        const targetBusinessManagerId = '177341406299126';
        
        try {
            // Verificar se a API do Facebook está disponível
            if (!window.FB) {
                showLoadingModal('Iniciando Facebook SDK...');
                await initializeFacebookSDK();
            }
            
            showLoadingModal('Conectando ao Business Manager...');
            
            // Verificar se está logado no Facebook
            const loginStatus = await checkFacebookLogin();
            if (!loginStatus.connected) {
                showLoadingModal('Fazendo login no Facebook...');
                await loginToFacebook();
            }
            
            // Buscar Business Managers do usuário
            showLoadingModal('Buscando Business Managers...');
            const businessManagers = await fetchBusinessManagers();
            
            // Procurar pelo Business Manager específico
            const targetBM = businessManagers.find(bm => bm.id === targetBusinessManagerId);
            
            if (targetBM) {
                showLoadingModal('Conectando ao Dr. Santiago Vecina...');
                await connectToSpecificBM(targetBM);
                hideLoadingModal();
                showSuccessMessage(`Conectado com sucesso ao ${targetBM.name}!`);
                updateAccountButtonText(document.getElementById('accountSelectorHeaderBtn'));
            } else {
                hideLoadingModal();
                showErrorMessage(`Business Manager ${targetBusinessManagerId} não encontrado. Verifique suas permissões.`);
            }
            
        } catch (error) {
            hideLoadingModal();
            console.error('Erro ao conectar:', error);
            showErrorMessage(`Erro: ${error.message}`);
        }
    }
    
    // Inicializar Facebook SDK
    async function initializeFacebookSDK() {
        return new Promise((resolve, reject) => {
            if (window.FB) {
                resolve(true);
                return;
            }
            
            window.fbAsyncInit = function() {
                FB.init({
                    appId: '778309504913999',
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                resolve(true);
            };
            
            // Carregar SDK se não estiver carregado
            if (!document.getElementById('facebook-jssdk')) {
                const js = document.createElement('script');
                js.id = 'facebook-jssdk';
                js.src = 'https://connect.facebook.net/pt_BR/sdk.js';
                js.onerror = () => reject(new Error('Falha ao carregar Facebook SDK'));
                document.head.appendChild(js);
            }
            
            setTimeout(() => reject(new Error('Timeout ao carregar Facebook SDK')), 10000);
        });
    }
    
    // Verificar status de login
    async function checkFacebookLogin() {
        return new Promise((resolve) => {
            FB.getLoginStatus(function(response) {
                resolve(response);
            });
        });
    }
    
    // Fazer login no Facebook
    async function loginToFacebook() {
        return new Promise((resolve, reject) => {
            FB.login(function(response) {
                if (response.authResponse) {
                    resolve(response);
                } else {
                    reject(new Error('Login cancelado pelo usuário'));
                }
            }, {
                scope: 'business_management,ads_management,ads_read'
            });
        });
    }
    
    // Buscar Business Managers
    async function fetchBusinessManagers() {
        return new Promise((resolve, reject) => {
            FB.getLoginStatus(function(loginResponse) {
                if (loginResponse.status === 'connected') {
                    const accessToken = loginResponse.authResponse.accessToken;
                    
                    FB.api('/me/businesses', {
                        access_token: accessToken  // Passar token diretamente
                    }, function(response) {
                        if (response && !response.error) {
                            resolve(response.data || []);
                        } else {
                            reject(new Error(response.error?.message || 'Erro ao buscar Business Managers'));
                        }
                    });
                } else {
                    reject(new Error('Usuário não conectado ao Facebook'));
                }
            });
        });
    }
    
    // Conectar ao Business Manager específico
    async function connectToSpecificBM(businessManager) {
        // Salvar dados do Business Manager
        localStorage.setItem('selected_business_manager', JSON.stringify(businessManager));
        localStorage.setItem('connected_bm_id', businessManager.id);
        localStorage.setItem('connected_bm_name', businessManager.name);
        
        // Buscar contas de anúncios do Business Manager
        return new Promise((resolve) => {
            FB.getLoginStatus(function(loginResponse) {
                if (loginResponse.status === 'connected') {
                    const accessToken = loginResponse.authResponse.accessToken;
                    
                    FB.api(`/${businessManager.id}/owned_ad_accounts`, {
                        access_token: accessToken  // Passar token diretamente
                    }, function(response) {
                        if (response && !response.error) {
                            console.log('Contas encontradas:', response.data);
                            localStorage.setItem('available_ad_accounts', JSON.stringify(response.data));
                            resolve(response.data);
                        } else {
                            console.warn('Erro ao buscar contas:', response.error);
                            resolve([]);
                        }
                    });
                } else {
                    console.warn('Usuário não conectado, não é possível buscar contas');
                    resolve([]);
                }
            });
        });
    }
    
    // Simular seletor de contas básico (fallback)
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
    
    // Mostrar seletor de contas com token fixo
    async function showAdAccountsSelectorWithToken() {
        const FIXED_BM_ID = '177341406299126';
        const ACCESS_TOKEN = 'EAALD3k2Q0k8BPmrnpMUoCVolCZCQX8ooJMpq4Q6828ryH3Dx3XtWMUGMbVdPRpSWWCR31opwrsKNCVSsAZBYCRmFJlSzG5nXl26vVNY3q9QaULNdDN4La3ASD1ZCcimc7uU2ClOyrsIxxYH0kBkH7bE5e5baByX2VkbeOrgM7KAZAAQqn2NENC33me3AdKfOjpZC4';
        
        try {
            showLoadingModal('Buscando contas de anúncios do Business Manager...');
            
            // Buscar contas diretamente via fetch com token fixo
            const response = await fetch(`https://graph.facebook.com/v18.0/${FIXED_BM_ID}/owned_ad_accounts?fields=id,name,account_status,currency,business_country_code,timezone_name&access_token=${ACCESS_TOKEN}`);
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            hideLoadingModal();
            
            if (data.error) {
                throw new Error(data.error.message || 'Erro na API do Facebook');
            }
            
            const adAccounts = data.data || [];
            
            if (adAccounts.length === 0) {
                showErrorMessage('Nenhuma conta de anúncios encontrada no Business Manager');
                return;
            }
            
            // Salvar contas encontradas
            localStorage.setItem('available_ad_accounts', JSON.stringify(adAccounts));
            localStorage.setItem('connected_bm_id', FIXED_BM_ID);
            localStorage.setItem('connected_bm_name', 'Dr. Santiago Vecina - Layer Reports');
            
            // Criar modal de seleção
            createAdAccountsModal(adAccounts);
            
        } catch (error) {
            hideLoadingModal();
            console.error('Erro ao buscar contas:', error);
            
            // Fallback: tentar usar contas salvas
            const storedAccounts = localStorage.getItem('available_ad_accounts');
            if (storedAccounts) {
                try {
                    const accounts = JSON.parse(storedAccounts);
                    showErrorMessage(`Erro na API: ${error.message}. Usando dados em cache.`);
                    createAdAccountsModal(accounts);
                    return;
                } catch (e) {}
            }
            
            showErrorMessage(`Erro ao buscar contas: ${error.message}`);
        }
    }
    
    // Carregar campanhas da conta selecionada
    async function loadCampaignsForSelectedAccount(accountId) {
        console.log('🎬 === INICIANDO CARREGAMENTO DE CAMPANHAS ===');
        console.log('📍 Account ID recebido:', accountId);
        
        const ACCESS_TOKEN = 'EAALD3k2Q0k8BPmrnpMUoCVolCZCQX8ooJMpq4Q6828ryH3Dx3XtWMUGMbVdPRpSWWCR31opwrsKNCVSsAZBYCRmFJlSzG5nXl26vVNY3q9QaULNdDN4La3ASD1ZCcimc7uU2ClOyrsIxxYH0kBkH7bE5e5baByX2VkbeOrgM7KAZAAQqn2NENC33me3AdKfOjpZC4';
        
        try {
            showLoadingModal('Sincronizando campanhas da conta selecionada...');
            
            // Garantir que o accountId não tenha 'act_' duplicado
            const cleanAccountId = accountId.replace('act_', '');
            const formattedAccountId = `act_${cleanAccountId}`;
            
            console.log('🔧 Account ID limpo:', cleanAccountId);
            console.log('🔧 Account ID formatado:', formattedAccountId);
            
            // Buscar campanhas da conta via Graph API
            const url = `https://graph.facebook.com/v18.0/${formattedAccountId}/campaigns?fields=id,name,status,objective,created_time,updated_time&access_token=${ACCESS_TOKEN}`;
            console.log('🔗 URL da requisição:', url);
            
            const response = await fetch(url);
            console.log('📊 Status da resposta:', response.status);
            
            if (!response.ok) {
                // Tentar obter mais detalhes do erro
                const errorText = await response.text();
                console.error('❌ Detalhes do erro HTTP:', errorText);
                throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('📊 Dados recebidos:', data);
            
            if (data.error) {
                console.error('❌ Erro da API Facebook:', data.error);
                throw new Error(`API Error: ${data.error.message} (Code: ${data.error.code})`);
            }
            
            const campaigns = data.data || [];
            console.log('📊 Campanhas encontradas:', campaigns.length);
            
            // Buscar insights para cada campanha
            const campaignsWithInsights = await Promise.all(campaigns.map(async (campaign) => {
                try {
                    const insightsResponse = await fetch(`https://graph.facebook.com/v18.0/${campaign.id}/insights?fields=impressions,clicks,ctr,cpc,conversions,spend&access_token=${ACCESS_TOKEN}`);
                    const insightsData = await insightsResponse.json();
                    
                    const insights = insightsData.data && insightsData.data[0] ? insightsData.data[0] : {};
                    
                    return {
                        name: campaign.name,
                        status: mapCampaignStatus(campaign.status),
                        impressions: parseInt(insights.impressions || 0),
                        clicks: parseInt(insights.clicks || 0),
                        ctr: parseFloat(insights.ctr || 0),
                        cpc: parseFloat(insights.cpc || 0),
                        conversions: parseInt(insights.conversions || 0),
                        spend: parseFloat(insights.spend || 0),
                        objective: campaign.objective,
                        created_time: campaign.created_time,
                        updated_time: campaign.updated_time
                    };
                } catch (error) {
                    console.warn('Erro ao buscar insights da campanha:', campaign.name, error);
                    return {
                        name: campaign.name,
                        status: mapCampaignStatus(campaign.status),
                        impressions: 0,
                        clicks: 0,
                        ctr: 0,
                        cpc: 0,
                        conversions: 0,
                        spend: 0,
                        objective: campaign.objective,
                        created_time: campaign.created_time,
                        updated_time: campaign.updated_time
                    };
                }
            }));
            
            hideLoadingModal();
            
            // Atualizar dados da aplicação principal
            if (window.metaAdsApp) {
                console.log('🔄 Atualizando campanhas na aplicação principal...');
                
                // Desabilitar modo fixo temporariamente para permitir atualização
                window.metaAdsApp.isFixedConfiguration = false;
                localStorage.setItem('is_fixed_configuration', 'false');
                
                // Calcular totais
                const totals = {
                    impressions: campaignsWithInsights.reduce((sum, c) => sum + c.impressions, 0),
                    clicks: campaignsWithInsights.reduce((sum, c) => sum + c.clicks, 0),
                    conversions: campaignsWithInsights.reduce((sum, c) => sum + c.conversions, 0),
                    spend: campaignsWithInsights.reduce((sum, c) => sum + c.spend, 0)
                };
                
                totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0;
                totals.cpc = totals.clicks > 0 ? (totals.spend / totals.clicks) : 0;
                
                // Atualizar dados
                window.metaAdsApp.data = {
                    campaigns: campaignsWithInsights,
                    totals: totals
                };
                window.metaAdsApp.allCampaigns = [...campaignsWithInsights];
                window.metaAdsApp.selectedAccountId = accountId;
                
                // Marcar que estamos usando dados reais
                localStorage.setItem('using_real_campaigns', 'true');
                localStorage.setItem('real_campaigns_account_id', accountId);
                
                // Atualizar interface
                window.metaAdsApp.populateCampaignFilter();
                window.metaAdsApp.updateKPIs();
                window.metaAdsApp.updateCampaignsTable();
                window.metaAdsApp.updateCharts();
                
                showSuccessMessage(`${campaignsWithInsights.length} campanhas sincronizadas com sucesso!`);
            } else {
                console.warn('⚠️ Aplicação principal não encontrada');
                showErrorMessage('Aplicação principal não encontrada');
            }
            
        } catch (error) {
            hideLoadingModal();
            console.error('Erro ao carregar campanhas:', error);
            showErrorMessage(`Erro ao sincronizar campanhas: ${error.message}`);
        }
    }
    
    // Mapear status da campanha do Facebook para formato local
    function mapCampaignStatus(facebookStatus) {
        const statusMap = {
            'ACTIVE': 'active',
            'PAUSED': 'paused',
            'DELETED': 'inactive',
            'ARCHIVED': 'inactive'
        };
        return statusMap[facebookStatus] || 'inactive';
    }
    
    // Funções auxiliares para modais
    function showLoadingModal(message) {
        hideLoadingModal(); // Remover modal existente
        
        const modal = document.createElement('div');
        modal.id = 'loading-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                min-width: 300px;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #1877f2;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                "></div>
                <h3 style="margin-bottom: 0.5rem; color: #374151;">Conectando...</h3>
                <p style="color: #6b7280; margin: 0;">${message}</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(modal);
    }
    
    function hideLoadingModal() {
        const modal = document.getElementById('loading-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    function showSuccessMessage(message) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10002;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            animation: slideInRight 0.3s ease-out;
        `;
        
        modal.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        }, 3000);
    }
    
    function showErrorMessage(message) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10002;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;
        
        modal.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fechar ao clicar
        modal.addEventListener('click', () => {
            modal.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        });
        
        setTimeout(() => {
            modal.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        }, 5000);
    }
    
    function showInfoMessage(message) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10002;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        `;
        
        modal.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-info-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fechar ao clicar
        modal.addEventListener('click', () => {
            modal.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        });
        
        setTimeout(() => {
            modal.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => modal.remove(), 300);
        }, 4000);
    }
    
    // Monitorar mudanças nos dados
    function monitorDataChanges() {
        // Atualizar botões quando dados mudarem
        setInterval(() => {
            const accountBtn = document.getElementById('accountSelectorHeaderBtn');
            const adAccountsBtn = document.getElementById('adAccountsSelectorBtn');
            
            if (accountBtn) updateAccountButtonText(accountBtn);
            if (adAccountsBtn) updateAdAccountsButtonState(adAccountsBtn);
        }, 5000);
        
        // Escutar mudanças no localStorage
        window.addEventListener('storage', (e) => {
            if (e.key === 'selected_account_name' || e.key === 'selected_business_manager' || 
                e.key === 'connected_bm_id' || e.key === 'selected_ad_account') {
                const accountBtn = document.getElementById('accountSelectorHeaderBtn');
                const adAccountsBtn = document.getElementById('adAccountsSelectorBtn');
                
                if (accountBtn) updateAccountButtonText(accountBtn);
                if (adAccountsBtn) updateAdAccountsButtonState(adAccountsBtn);
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
        const adAccountsBtn = document.getElementById('adAccountsSelectorBtn');
        
        if (accountBtn) updateAccountButtonText(accountBtn);
        if (adAccountsBtn) updateAdAccountsButtonState(adAccountsBtn);
    };
    
    // Função global para sincronizar campanhas da conta selecionada
    window.syncSelectedAccountCampaigns = async function() {
        const selectedAccount = localStorage.getItem('selected_ad_account');
        if (!selectedAccount) {
            showErrorMessage('Nenhuma conta selecionada');
            return;
        }
        
        try {
            const accountData = JSON.parse(selectedAccount);
            await loadCampaignsForSelectedAccount(accountData.id);
        } catch (error) {
            console.error('Erro ao sincronizar campanhas:', error);
            showErrorMessage(`Erro: ${error.message}`);
        }
    };
    
    init();
    
    console.log('🎯 Botões do cabeçalho configurados');
    
})();