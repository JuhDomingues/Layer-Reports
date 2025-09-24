// Diagnóstico completo do app Facebook existente
window.diagnoseFacebookApp = function(appId = '778309504913999') {
    console.log(`🔍 === DIAGNÓSTICO DO APP FACEBOOK ${appId} ===`);
    
    const issues = [];
    const fixes = [];
    
    // Verificar domínio atual
    const currentDomain = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const currentPort = window.location.port;
    const fullDomain = currentPort ? `${currentDomain}:${currentPort}` : currentDomain;
    
    console.log(`🌐 Domínio atual: ${currentProtocol}//${fullDomain}`);
    
    // Verificações essenciais
    if (currentProtocol !== 'https:' && !['localhost', '127.0.0.1'].includes(currentDomain)) {
        issues.push('❌ Facebook requer HTTPS ou localhost');
        fixes.push('Configure HTTPS ou use localhost para desenvolvimento');
    } else {
        console.log('✅ Protocolo válido para Facebook');
    }
    
    // Criar relatório de configurações necessárias
    const requiredSettings = {
        'App Domain': fullDomain,
        'Site URL': `${currentProtocol}//${fullDomain}/`,
        'Valid OAuth Redirect URIs': [
            `${currentProtocol}//${fullDomain}/`,
            `${currentProtocol}//${fullDomain}/index.html`
        ],
        'App Type': 'Consumer ou Business',
        'Status': 'Live ou Development'
    };
    
    console.log('📋 Configurações necessárias no Facebook App:');
    console.log(requiredSettings);
    
    // Testar se app responde
    return testAppConnection(appId).then(result => {
        const diagnosis = {
            appId: appId,
            currentDomain: fullDomain,
            protocol: currentProtocol,
            issues: issues,
            fixes: fixes,
            requiredSettings: requiredSettings,
            connectionTest: result,
            configurationUrl: `https://developers.facebook.com/apps/${appId}/settings/basic/`
        };
        
        console.log('📊 Diagnóstico completo:', diagnosis);
        showDiagnosisModal(diagnosis);
        
        return diagnosis;
    });
};

// Testar conexão com o app
async function testAppConnection(appId) {
    console.log(`🧪 Testando conexão com app ${appId}...`);
    
    try {
        // Tentar inicializar SDK
        await new Promise((resolve, reject) => {
            // Limpar SDK anterior
            if (window.FB) {
                delete window.FB;
            }
            
            const existingScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
            existingScripts.forEach(script => script.remove());
            
            window.fbAsyncInit = function() {
                FB.init({
                    appId: appId,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                
                console.log('✅ SDK inicializado');
                resolve();
            };
            
            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
            script.onload = () => console.log('✅ Script carregado');
            script.onerror = () => reject(new Error('Erro ao carregar script'));
            
            document.head.appendChild(script);
            
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        
        // Tentar fazer uma chamada básica
        return new Promise((resolve) => {
            FB.api(`/${appId}`, (response) => {
                if (response && !response.error) {
                    resolve({
                        success: true,
                        message: 'App responde corretamente',
                        appData: response
                    });
                } else {
                    resolve({
                        success: false,
                        error: response ? response.error : 'Sem resposta',
                        message: 'App não está acessível publicamente ou tem restrições'
                    });
                }
            });
        });
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            message: 'Erro ao conectar com o app'
        };
    }
}

// Mostrar modal com diagnóstico
function showDiagnosisModal(diagnosis) {
    // Remover modal existente
    const existingModal = document.getElementById('diagnosis-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'diagnosis-modal';
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
        max-height: 80vh !important;
        overflow-y: auto !important;
        font-family: monospace !important;
        font-size: 12px !important;
        line-height: 1.5 !important;
    `;
    
    const testResult = diagnosis.connectionTest.success ? 
        '✅ App responde' : 
        `❌ ${diagnosis.connectionTest.message}`;
    
    content.innerHTML = `
        <h3>🔍 Diagnóstico App Facebook</h3>
        <p><strong>App ID:</strong> ${diagnosis.appId}</p>
        <p><strong>Domínio atual:</strong> ${diagnosis.currentDomain}</p>
        <p><strong>Teste de conexão:</strong> ${testResult}</p>
        
        <h4>📋 Configure no Facebook Console:</h4>
        <p><strong>URL:</strong> <a href="${diagnosis.configurationUrl}" target="_blank">${diagnosis.configurationUrl}</a></p>
        
        <h4>⚙️ Configurações necessárias:</h4>
        <ul>
            <li><strong>App Domains:</strong> ${diagnosis.requiredSettings['App Domain']}</li>
            <li><strong>Site URL:</strong> ${diagnosis.requiredSettings['Site URL']}</li>
            <li><strong>Valid OAuth Redirect URIs:</strong> ${diagnosis.requiredSettings['Valid OAuth Redirect URIs'].join('<br>')}</li>
        </ul>
        
        <h4>🔧 Produtos necessários:</h4>
        <ul>
            <li>✅ Facebook Login</li>
            <li>⚠️ Status: Live (não Development)</li>
        </ul>
        
        <div style="margin-top: 20px;">
            <button id="close-diagnosis" style="background: #1877f2; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                Fechar
            </button>
            <button id="open-facebook-settings" style="background: #42b883; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                Abrir Configurações
            </button>
        </div>
    `;
    
    // Eventos
    content.querySelector('#close-diagnosis').addEventListener('click', () => {
        modal.remove();
    });
    
    content.querySelector('#open-facebook-settings').addEventListener('click', () => {
        window.open(diagnosis.configurationUrl, '_blank');
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// Função para testar após configurações
window.testConfiguredApp = function(appId = '778309504913999') {
    console.log(`🧪 === TESTE DO APP CONFIGURADO ${appId} ===`);
    
    // Limpar tudo
    if (window.FB) {
        delete window.FB;
    }
    
    const existingScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
    existingScripts.forEach(script => script.remove());
    
    // Inicializar com configurações corretas
    window.fbAsyncInit = function() {
        FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
        });
        
        console.log('✅ SDK inicializado para teste');
        
        // Testar login
        FB.login((response) => {
            console.log('📊 Resposta do teste:', response);
            
            if (response.authResponse) {
                console.log('🎉 LOGIN FUNCIONOU!');
                alert('✅ SUCESSO! O app está funcionando corretamente!');
                
                // Buscar dados do usuário
                FB.api('/me', { fields: 'name,email' }, (userResponse) => {
                    console.log('👤 Dados do usuário:', userResponse);
                    
                    if (userResponse && !userResponse.error) {
                        alert(`✅ Dados obtidos!\nUsuário: ${userResponse.name}\nEmail: ${userResponse.email || 'N/A'}`);
                    }
                });
                
            } else {
                console.log('❌ Login cancelado ou app ainda com problema');
                alert('❌ Login não funcionou. Verifique as configurações do app.');
            }
            
        }, {
            scope: 'email',
            return_scopes: true,
            auth_type: 'rerequest'
        });
    };
    
    // Carregar SDK
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
    script.onload = () => console.log('✅ SDK carregado para teste');
    document.head.appendChild(script);
};

console.log('🔍 Diagnóstico de app Facebook carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• diagnoseFacebookApp() - Diagnosticar app atual');
console.log('• testConfiguredApp() - Testar após configurar');
console.log('');
console.log('💡 Execute: diagnoseFacebookApp()');