// Debug para testar sincronização de campanhas
console.log('🧪 === DEBUG DE SINCRONIZAÇÃO ===');

// Verificar estado atual
console.log('📋 Estado atual:');
console.log('  - localStorage.selected_ad_account:', localStorage.getItem('selected_ad_account'));
console.log('  - localStorage.selected_ad_account_id:', localStorage.getItem('selected_ad_account_id'));

// Função para testar sincronização manual
window.testCampaignSync = function() {
    console.log('🔧 Testando sincronização manual...');
    
    const selectedAccount = localStorage.getItem('selected_ad_account');
    if (!selectedAccount) {
        console.error('❌ Nenhuma conta selecionada');
        return;
    }
    
    try {
        const accountData = JSON.parse(selectedAccount);
        console.log('📊 Conta encontrada:', accountData);
        
        // Verificar se a função está disponível
        if (typeof window.syncSelectedAccountCampaigns === 'function') {
            console.log('✅ Função syncSelectedAccountCampaigns encontrada');
            window.syncSelectedAccountCampaigns();
        } else {
            console.error('❌ Função syncSelectedAccountCampaigns não encontrada');
        }
        
    } catch (error) {
        console.error('❌ Erro ao parsear conta:', error);
    }
};

// Verificar se botão existe
setTimeout(() => {
    const btn = document.getElementById('adAccountsSelectorBtn');
    console.log('🔍 Botão de seleção de contas:', btn ? '✅ Encontrado' : '❌ Não encontrado');
    
    if (btn) {
        console.log('  - innerHTML:', btn.innerHTML);
        console.log('  - classList:', btn.classList.toString());
        console.log('  - style.display:', btn.style.display);
    }
}, 2000);

// Função para testar com uma conta hardcoded para debug
window.testWithHardcodedAccount = async function() {
    console.log('🧪 Testando com conta hardcoded para debug...');
    
    // Simular uma conta selecionada
    const mockAccount = {
        id: '23843476610650659', // Exemplo de ID de conta
        name: 'Conta de Teste'
    };
    
    console.log('🎯 Usando conta mock:', mockAccount);
    localStorage.setItem('selected_ad_account', JSON.stringify(mockAccount));
    localStorage.setItem('selected_ad_account_id', mockAccount.id);
    
    // Tentar sincronizar
    if (typeof window.syncSelectedAccountCampaigns === 'function') {
        await window.syncSelectedAccountCampaigns();
    } else {
        console.error('❌ Função não disponível');
    }
};

// Função para simular o clique no botão
window.simulateAccountSelection = function() {
    console.log('🎬 Simulando processo completo de seleção...');
    
    // 1. Simular clique no botão
    const btn = document.getElementById('adAccountsSelectorBtn');
    if (btn) {
        console.log('✅ Botão encontrado, simulando clique...');
        btn.click();
    } else {
        console.error('❌ Botão não encontrado');
    }
};

// Função para forçar carregamento direto de campanhas
window.forceLoadCampaigns = async function(accountId = '23843476610650659') {
    console.log('💪 Forçando carregamento direto de campanhas...');
    console.log('📍 Account ID original:', accountId);
    
    const ACCESS_TOKEN = 'EAALD3k2Q0k8BPmrnpMUoCVolCZCQX8ooJMpq4Q6828ryH3Dx3XtWMUGMbVdPRpSWWCR31opwrsKNCVSsAZBYCRmFJlSzG5nXl26vVNY3q9QaULNdDN4La3ASD1ZCcimc7uU2ClOyrsIxxYH0kBkH7bE5e5baByX2VkbeOrgM7KAZAAQqn2NENC33me3AdKfOjpZC4';
    
    // Testar primeiro se o token é válido
    console.log('🔍 Testando token de acesso...');
    try {
        const tokenTest = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`);
        console.log('🔑 Token test status:', tokenTest.status);
        
        if (tokenTest.ok) {
            const tokenData = await tokenTest.json();
            console.log('✅ Token válido - usuário:', tokenData);
        } else {
            const tokenError = await tokenTest.json();
            console.error('❌ Token inválido:', tokenError);
            return;
        }
    } catch (error) {
        console.error('❌ Erro ao testar token:', error);
        return;
    }
    
    // Testar diferentes formatos de ID
    const testIds = [
        accountId,
        `act_${accountId}`,
        accountId.replace('act_', '')
    ];
    
    for (const testId of testIds) {
        console.log(`🧪 Testando ID: ${testId}`);
        
        try {
            const url = `https://graph.facebook.com/v18.0/${testId}/campaigns?fields=id,name,status,objective,created_time,updated_time&access_token=${ACCESS_TOKEN}`;
            console.log('🔗 URL:', url);
            
            const response = await fetch(url);
            console.log(`📊 Response status para ${testId}:`, response.status);
            
            const data = await response.json();
            console.log(`📊 Response data para ${testId}:`, data);
            
            if (response.ok && !data.error) {
                console.log(`✅ Sucesso com ID: ${testId}`);
                console.log('✅ Campanhas encontradas:', data.data?.length || 0);
                if (data.data) {
                    data.data.forEach((campaign, index) => {
                        console.log(`  ${index + 1}. ${campaign.name} (${campaign.status})`);
                    });
                }
                return; // Sucesso, parar aqui
            } else {
                console.warn(`⚠️ Falhou com ID ${testId}:`, data.error || 'Status não OK');
            }
            
        } catch (error) {
            console.error(`❌ Erro na requisição para ${testId}:`, error);
        }
    }
    
    console.error('❌ Todos os formatos de ID falharam');
};

// Função para buscar contas reais do Business Manager
window.getAvailableAccounts = async function() {
    console.log('🏢 Buscando contas do Business Manager...');
    
    const ACCESS_TOKEN = 'EAALD3k2Q0k8BPmrnpMUoCVolCZCQX8ooJMpq4Q6828ryH3Dx3XtWMUGMbVdPRpSWWCR31opwrsKNCVSsAZBYCRmFJlSzG5nXl26vVNY3q9QaULNdDN4La3ASD1ZCcimc7uU2ClOyrsIxxYH0kBkH7bE5e5baByX2VkbeOrgM7KAZAAQqn2NENC33me3AdKfOjpZC4';
    const BM_ID = '177341406299126';
    
    try {
        const url = `https://graph.facebook.com/v18.0/${BM_ID}/owned_ad_accounts?fields=id,name,account_status,currency,business_country_code,timezone_name&access_token=${ACCESS_TOKEN}`;
        console.log('🔗 URL:', url);
        
        const response = await fetch(url);
        console.log('📊 Response status:', response.status);
        
        const data = await response.json();
        console.log('📊 Response data:', data);
        
        if (response.ok && !data.error) {
            console.log('✅ Contas encontradas:', data.data?.length || 0);
            if (data.data) {
                data.data.forEach((account, index) => {
                    console.log(`  ${index + 1}. ${account.name || account.id} (ID: ${account.id})`);
                });
                
                // Testar campanhas da primeira conta
                if (data.data.length > 0) {
                    const firstAccount = data.data[0];
                    console.log(`🎯 Testando campanhas da primeira conta: ${firstAccount.id}`);
                    await forceLoadCampaigns(firstAccount.id);
                }
            }
        } else {
            console.error('❌ Erro ao buscar contas:', data.error || 'Status não OK');
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição de contas:', error);
    }
};

console.log('💡 Comandos disponíveis:');
console.log('  - getAvailableAccounts() - Buscar contas reais do BM e testar');
console.log('  - forceLoadCampaigns() - Testar requisição direta à API');
console.log('  - testCampaignSync() - Testar com conta já selecionada');
console.log('  - testWithHardcodedAccount() - Testar com conta hardcoded');
console.log('  - simulateAccountSelection() - Simular clique no botão');