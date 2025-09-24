// Configuração para produção - https://reports.layermarketing.com.br
window.setupProductionFacebook = function() {
    console.log('🌐 === CONFIGURAÇÃO PARA PRODUÇÃO ===');
    console.log('🔗 Domínio: https://reports.layermarketing.com.br');
    
    const productionDomain = 'reports.layermarketing.com.br';
    const isProduction = window.location.hostname === productionDomain;
    
    console.log(`📍 Ambiente detectado: ${isProduction ? 'PRODUÇÃO' : 'LOCAL'}`);
    
    if (!isProduction) {
        console.log('⚠️ Você está em ambiente local. Este script é otimizado para produção.');
        console.log('📝 Para testar localmente, use: diagnoseFacebookApp()');
    }
    
    // Configurações necessárias para o app Facebook em produção
    const productionConfig = {
        appId: '778309504913999',
        domain: productionDomain,
        siteUrl: `https://${productionDomain}/`,
        validRedirectUris: [
            `https://${productionDomain}/`,
            `https://${productionDomain}/index.html`,
            `https://${productionDomain}/callback.html`
        ],
        requiredSettings: {
            appDomains: [productionDomain],
            siteUrl: `https://${productionDomain}/`,
            validOAuthRedirectUris: [
                `https://${productionDomain}/`,
                `https://${productionDomain}/index.html`
            ],
            appType: 'Business',
            status: 'Live'
        }
    };
    
    console.log('📋 Configurações necessárias no Facebook Console:');
    console.table(productionConfig.requiredSettings);
    
    console.log(`🔗 Link direto: https://developers.facebook.com/apps/${productionConfig.appId}/settings/basic/`);
    
    // Mostrar instruções detalhadas
    showProductionInstructions(productionConfig);
    
    // Salvar configuração de produção
    localStorage.setItem('production_domain', productionDomain);
    localStorage.setItem('facebook_app_configured_for_production', 'true');
    
    return productionConfig;
};

// Mostrar instruções para configurar em produção
function showProductionInstructions(config) {
    // Remover modal existente
    const existingModal = document.getElementById('production-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'production-modal';
    modal.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0,0,0,0.9) !important;
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
        max-height: 90vh !important;
        overflow-y: auto !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
    `;
    
    content.innerHTML = `
        <h2>🌐 Configuração para Produção</h2>
        <p><strong>Domínio:</strong> ${config.domain}</p>
        <p><strong>App ID:</strong> ${config.appId}</p>
        
        <h3>📋 Configure no Facebook Console:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>1. Acesse:</strong> <a href="https://developers.facebook.com/apps/${config.appId}/settings/basic/" target="_blank">Configurações do App</a></p>
            <p><strong>2. App Domains:</strong> <code>${config.domain}</code></p>
            <p><strong>3. Site URL:</strong> <code>${config.siteUrl}</code></p>
        </div>
        
        <h3>🔧 Facebook Login Settings:</h3>
        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>1. Vá para:</strong> Produtos → Facebook Login → Configurações</p>
            <p><strong>2. Valid OAuth Redirect URIs:</strong></p>
            <ul>
                ${config.validRedirectUris.map(uri => `<li><code>${uri}</code></li>`).join('')}
            </ul>
        </div>
        
        <h3>⚡ Configurações Avançadas:</h3>
        <div style="background: #fff8dc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>• Status do App:</strong> Live (não Development)</p>
            <p><strong>• Categoria:</strong> Business</p>
            <p><strong>• Público-alvo:</strong> Permitir qualquer um</p>
        </div>
        
        <div style="margin-top: 25px; text-align: center;">
            <button id="test-production" style="background: #1877f2; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 10px;">
                🧪 Testar Configuração
            </button>
            <button id="open-facebook-console" style="background: #42b883; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 10px;">
                🔧 Abrir Facebook Console
            </button>
            <button id="close-production" style="background: #666; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px;">
                Fechar
            </button>
        </div>
    `;
    
    // Eventos dos botões
    content.querySelector('#test-production').addEventListener('click', () => {
        modal.remove();
        testProductionLogin();
    });
    
    content.querySelector('#open-facebook-console').addEventListener('click', () => {
        window.open(`https://developers.facebook.com/apps/${config.appId}/settings/basic/`, '_blank');
    });
    
    content.querySelector('#close-production').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// Testar login em produção
window.testProductionLogin = function() {
    console.log('🧪 === TESTE DE LOGIN EM PRODUÇÃO ===');
    
    const appId = '778309504913999';
    console.log(`🔧 Testando App ID: ${appId}`);
    console.log(`🌐 Domínio: ${window.location.hostname}`);
    
    // Limpar Facebook SDK anterior
    if (window.FB) {
        delete window.FB;
    }
    
    const existingScripts = document.querySelectorAll('script[src*="connect.facebook.net"]');
    existingScripts.forEach(script => script.remove());
    
    // Criar botão de teste
    const existingBtn = document.getElementById('production-test-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const testBtn = document.createElement('button');
    testBtn.id = 'production-test-btn';
    testBtn.innerHTML = '🌐 Testar Login Produção';
    testBtn.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        background: #1877f2 !important;
        color: white !important;
        border: none !important;
        padding: 15px 25px !important;
        border-radius: 8px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: bold !important;
        box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3) !important;
    `;
    
    // Inicializar SDK para produção
    window.fbAsyncInit = function() {
        FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
        });
        
        console.log('✅ Facebook SDK inicializado para produção');
        
        testBtn.addEventListener('click', function() {
            console.log('🔄 Iniciando teste de login...');
            
            this.innerHTML = '⏳ Testando...';
            this.disabled = true;
            
            FB.login((response) => {
                console.log('📊 Resposta do Facebook:', response);
                
                if (response.authResponse) {
                    console.log('🎉 LOGIN FUNCIONOU EM PRODUÇÃO!');
                    
                    // Buscar dados do usuário
                    FB.api('/me', { fields: 'name,email' }, (userResponse) => {
                        console.log('👤 Dados do usuário:', userResponse);
                        
                        if (userResponse && !userResponse.error) {
                            alert(`✅ SUCESSO EM PRODUÇÃO!\n\nUsuário: ${userResponse.name}\nEmail: ${userResponse.email || 'N/A'}\n\nDomínio: ${window.location.hostname}\nToken obtido: ${response.authResponse.accessToken.substring(0, 20)}...`);
                            
                            // Salvar dados
                            localStorage.setItem('production_facebook_token', response.authResponse.accessToken);
                            localStorage.setItem('production_user_data', JSON.stringify(userResponse));
                            
                        } else {
                            alert('⚠️ Login funcionou mas não foi possível buscar dados do usuário');
                        }
                    });
                    
                } else {
                    console.log('❌ Login cancelado ou falhou');
                    alert('❌ Login não funcionou. Verifique as configurações do app Facebook.');
                }
                
                this.innerHTML = '🌐 Testar Login Produção';
                this.disabled = false;
                
            }, {
                scope: 'email',
                return_scopes: true,
                auth_type: 'rerequest'
            });
        });
    };
    
    // Carregar SDK
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js';
    script.onload = () => {
        console.log('✅ SDK carregado para teste de produção');
        document.body.appendChild(testBtn);
    };
    script.onerror = () => {
        console.error('❌ Erro ao carregar SDK');
        alert('❌ Erro ao carregar Facebook SDK');
    };
    
    document.head.appendChild(script);
};

// Auto-executar se estiver em produção
if (window.location.hostname === 'reports.layermarketing.com.br') {
    console.log('🌐 Domínio de produção detectado!');
    
    // Aguardar carregamento da página
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                setupProductionFacebook();
            }, 2000);
        });
    } else {
        setTimeout(() => {
            setupProductionFacebook();
        }, 2000);
    }
}

console.log('🌐 Sistema de produção carregado!');
console.log('💡 Execute: setupProductionFacebook()');