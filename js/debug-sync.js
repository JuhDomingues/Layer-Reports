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
    console.log('📍 Account ID:', accountId);
    
    const ACCESS_TOKEN = 'EAALD3k2Q0k8BPmrnpMUoCVolCZCQX8ooJMpq4Q6828ryH3Dx3XtWMUGMbVdPRpSWWCR31opwrsKNCVSsAZBYCRmFJlSzG5nXl26vVNY3q9QaULNdDN4La3ASD1ZCcimc7uU2ClOyrsIxxYH0kBkH7bE5e5baByX2VkbeOrgM7KAZAAQqn2NENC33me3AdKfOjpZC4';
    
    try {
        console.log('🔍 Fazendo requisição para campanhas...');
        const response = await fetch(`https://graph.facebook.com/v18.0/act_${accountId}/campaigns?fields=id,name,status,objective,created_time,updated_time&access_token=${ACCESS_TOKEN}`);
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response OK:', response.ok);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Data recebida:', data);
        
        if (data.error) {
            console.error('❌ Erro da API:', data.error);
        } else {
            console.log('✅ Campanhas encontradas:', data.data?.length || 0);
            if (data.data) {
                data.data.forEach((campaign, index) => {
                    console.log(`  ${index + 1}. ${campaign.name} (${campaign.status})`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
};

console.log('💡 Comandos disponíveis:');
console.log('  - testCampaignSync() - Testar com conta já selecionada');
console.log('  - testWithHardcodedAccount() - Testar com conta hardcoded');
console.log('  - simulateAccountSelection() - Simular clique no botão');
console.log('  - forceLoadCampaigns() - Testar requisição direta à API');