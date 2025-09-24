// Sistema para gerenciar token de acesso do Facebook
window.TokenManager = {
    
    // Token fornecido pelo usuário
    validToken: 'EAALD3k2Q0k8BPnCMtMtQfyovwZA1qRyEgR5rUbyEP4cGlvZAwrmPRod0WhbZCJIxxHJBZATwyVgLMcdF7S63kpHaTC5mSR3IzUQPor6OhEbyULmCRAZCyJOyR7V0Y8X0iuH0hywgduwRw9OGUozZCxARKQ9ALNFpPndimJZBYyWd9n6EnlxEJM66sI3cDi2RAtg1LtX',
    
    // Configurar token automaticamente
    setupToken: function() {
        console.log('🔑 === CONFIGURANDO TOKEN DE ACESSO ===');
        
        // Salvar token no localStorage
        localStorage.setItem('facebook_access_token', this.validToken);
        localStorage.setItem('api_mode', 'real');
        
        // Calcular expiração (assumir 60 dias)
        const expiresAt = Date.now() + (60 * 24 * 60 * 60 * 1000);
        localStorage.setItem('facebook_token_expires', expiresAt.toString());
        
        console.log('✅ Token configurado com sucesso');
        console.log(`🔑 Token: ${this.validToken.substring(0, 20)}...`);
        console.log(`⏰ Expira em: ${new Date(expiresAt).toLocaleString()}`);
        
        // Atualizar aplicação se existir
        if (window.metaAdsApp) {
            window.metaAdsApp.api.accessToken = this.validToken;
            window.metaAdsApp.api.tokenExpiresAt = expiresAt;
            window.metaAdsApp.api.connectionStatus = 'connected';
            window.metaAdsApp.isAuthenticated = true;
            
            // Forçar modo real
            window.metaAdsApp.api.setMode('real');
            window.metaAdsApp.updateUIForMode('real');
            
            console.log('✅ Aplicação atualizada com token');
        }
        
        // Mostrar sucesso
        this.showTokenSuccess();
        
        return true;
    },
    
    // Mostrar interface de sucesso
    showTokenSuccess: function() {
        const modal = document.createElement('div');
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
            padding: 40px !important;
            border-radius: 12px !important;
            max-width: 500px !important;
            text-align: center !important;
            font-family: system-ui, -apple-system, sans-serif !important;
        `;
        
        content.innerHTML = `
            <h2 style="color: #1877f2; margin-bottom: 20px;">🎉 Token Configurado!</h2>
            <p style="font-size: 16px; margin-bottom: 20px;">
                Token de acesso válido foi configurado com sucesso!
            </p>
            <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>✅ Funcionalidades liberadas:</strong></p>
                <ul style="text-align: left; margin: 10px 0;">
                    <li>Acesso à API Real do Meta Ads</li>
                    <li>Dados de campanhas reais</li>
                    <li>Insights e métricas atuais</li>
                    <li>Todas as funcionalidades premium</li>
                </ul>
            </div>
            <div style="margin-top: 25px;">
                <button id="start-using" style="background: #1877f2; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    🚀 Começar a Usar
                </button>
                <button id="test-token" style="background: #42b883; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    🧪 Testar Token
                </button>
            </div>
        `;
        
        // Eventos
        content.querySelector('#start-using').addEventListener('click', () => {
            modal.remove();
            this.activateRealMode();
        });
        
        content.querySelector('#test-token').addEventListener('click', () => {
            modal.remove();
            this.testToken();
        });
        
        modal.appendChild(content);
        document.body.appendChild(modal);
    },
    
    // Ativar modo real
    activateRealMode: function() {
        console.log('🚀 === ATIVANDO MODO REAL ===');
        
        // Alterar seletor para modo real
        const apiModeSelect = document.getElementById('apiMode');
        if (apiModeSelect) {
            apiModeSelect.value = 'real';
            
            // Disparar evento de mudança
            const changeEvent = new Event('change', { bubbles: true });
            apiModeSelect.dispatchEvent(changeEvent);
            
            console.log('✅ Modo real ativado via seletor');
        }
        
        // Usar Account Manager para inicializar completamente
        if (window.AccountManager) {
            window.AccountManager.initializeWithToken().then((success) => {
                if (success) {
                    console.log('✅ Sistema inicializado com sucesso');
                    alert('✅ Modo real ativado!\n\nContas encontradas e dados carregados com sucesso!');
                } else {
                    console.error('❌ Falha na inicialização');
                    alert('⚠️ Modo real ativado, mas houve problemas ao carregar dados.\n\nVerifique se sua conta tem acesso ao Meta Ads.');
                }
            }).catch(error => {
                console.error('❌ Erro na inicialização:', error);
                alert(`❌ Erro ao inicializar:\n\n${error.message}`);
            });
        } else {
            // Fallback para método antigo
            if (window.metaAdsApp) {
                window.metaAdsApp.updateUIForMode('real');
                
                if (window.metaAdsApp.loadRealData) {
                    window.metaAdsApp.loadRealData().then(() => {
                        console.log('✅ Dados reais carregados (fallback)');
                        alert('✅ Modo real ativado!');
                    }).catch(error => {
                        console.error('❌ Erro ao carregar dados:', error);
                        alert('⚠️ Erro: Nenhuma conta selecionada.\n\nExecute: autoSelectAccount()');
                    });
                }
            }
        }
    },
    
    // Testar token
    testToken: function() {
        console.log('🧪 === TESTANDO TOKEN ===');
        
        const token = this.validToken;
        console.log(`🔑 Testando token: ${token.substring(0, 20)}...`);
        
        // Fazer chamada de teste para a API do Facebook
        fetch(`https://graph.facebook.com/me?access_token=${token}`)
            .then(response => response.json())
            .then(data => {
                console.log('📊 Resposta da API:', data);
                
                if (data.error) {
                    console.error('❌ Token inválido:', data.error);
                    alert(`❌ Token inválido!\n\nErro: ${data.error.message}\n\nVerifique se o token não expirou.`);
                } else {
                    console.log('✅ Token válido para usuário:', data.name);
                    alert(`✅ Token válido!\n\nUsuário: ${data.name}\nID: ${data.id}\n\nToken está funcionando perfeitamente!`);
                }
            })
            .catch(error => {
                console.error('❌ Erro ao testar token:', error);
                alert(`❌ Erro ao testar token:\n\n${error.message}\n\nVerifique sua conexão com a internet.`);
            });
    },
    
    // Criar interface para inserir token manualmente
    showTokenInput: function() {
        const modal = document.createElement('div');
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
            max-width: 600px !important;
            width: 90% !important;
            font-family: system-ui, -apple-system, sans-serif !important;
        `;
        
        content.innerHTML = `
            <h2 style="color: #1877f2; margin-bottom: 20px;">🔑 Inserir Token de Acesso</h2>
            <p style="margin-bottom: 20px;">
                Cole seu token de acesso do Facebook para liberar todas as funcionalidades:
            </p>
            <textarea id="token-input" placeholder="Cole seu token aqui..." style="
                width: 100%; 
                height: 80px; 
                padding: 12px; 
                border: 2px solid #ddd; 
                border-radius: 8px; 
                font-family: monospace; 
                font-size: 12px;
                resize: vertical;
                box-sizing: border-box;
            ">${this.validToken}</textarea>
            <div style="margin-top: 20px; text-align: center;">
                <button id="save-token" style="background: #1877f2; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    💾 Salvar Token
                </button>
                <button id="cancel-token" style="background: #666; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Cancelar
                </button>
            </div>
        `;
        
        // Eventos
        content.querySelector('#save-token').addEventListener('click', () => {
            const inputToken = content.querySelector('#token-input').value.trim();
            if (inputToken) {
                this.validToken = inputToken;
                modal.remove();
                this.setupToken();
            } else {
                alert('❌ Por favor, insira um token válido!');
            }
        });
        
        content.querySelector('#cancel-token').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.appendChild(content);
        document.body.appendChild(modal);
    },
    
    // Verificar se já tem token salvo
    checkExistingToken: function() {
        const savedToken = localStorage.getItem('facebook_access_token');
        const savedExpires = localStorage.getItem('facebook_token_expires');
        
        if (savedToken && savedExpires) {
            const expiresAt = parseInt(savedExpires);
            const now = Date.now();
            
            if (now < expiresAt) {
                console.log('✅ Token válido encontrado no localStorage');
                return savedToken;
            } else {
                console.log('⚠️ Token expirado encontrado');
                localStorage.removeItem('facebook_access_token');
                localStorage.removeItem('facebook_token_expires');
            }
        }
        
        return null;
    }
};

// Funções globais de conveniência
window.setupToken = function() {
    TokenManager.setupToken();
};

window.insertToken = function() {
    TokenManager.showTokenInput();
};

window.testToken = function() {
    TokenManager.testToken();
};

window.activateRealMode = function() {
    TokenManager.activateRealMode();
};

// Auto-configurar token se ainda não estiver configurado
document.addEventListener('DOMContentLoaded', function() {
    const existingToken = TokenManager.checkExistingToken();
    
    if (!existingToken) {
        console.log('🔑 Configurando token automaticamente...');
        setTimeout(() => {
            TokenManager.setupToken();
        }, 3000); // Aguardar 3 segundos para a página carregar
    } else {
        console.log('✅ Token já configurado');
    }
});

console.log('🔑 Token Manager carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• setupToken() - Configurar token automaticamente');
console.log('• insertToken() - Interface para inserir token');
console.log('• testToken() - Testar se o token funciona');
console.log('• activateRealMode() - Ativar modo real');
console.log('');
console.log('💡 Token será configurado automaticamente em 3 segundos!');