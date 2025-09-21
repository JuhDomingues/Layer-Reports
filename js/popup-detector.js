// Popup Detector and Alternative Login Methods

class PopupDetector {
    constructor() {
        this.isPopupBlocked = false;
        this.hasTestedPopup = false;
    }

    // Test if popups are blocked
    async testPopupBlocking() {
        if (this.hasTestedPopup) {
            return !this.isPopupBlocked;
        }

        try {
            console.log('🔍 Testing popup blocking...');
            
            // Try to open a small popup
            const popup = window.open(
                '', 
                'popup-test', 
                'width=1,height=1,left=-1000,top=-1000'
            );

            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                this.isPopupBlocked = true;
                console.warn('⚠️ Popups are blocked');
                return false;
            } else {
                // Close the test popup immediately
                setTimeout(() => {
                    try {
                        popup.close();
                    } catch (e) {
                        // Ignore close errors
                    }
                }, 100);
                
                this.isPopupBlocked = false;
                console.log('✅ Popups are allowed');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Popup test failed:', error);
            this.isPopupBlocked = true;
            return false;
        } finally {
            this.hasTestedPopup = true;
        }
    }

    // Show popup blocked warning
    showPopupBlockedWarning() {
        this.removeExistingWarning();

        const warning = document.createElement('div');
        warning.id = 'popup-blocked-warning';
        warning.className = 'popup-warning';
        warning.innerHTML = `
            <div class="popup-warning-content">
                <div class="warning-icon">🚫</div>
                <h3>Popups Bloqueados</h3>
                <p>Para fazer login no Facebook, você precisa permitir popups neste site.</p>
                <div class="warning-steps">
                    <h4>Como permitir popups:</h4>
                    <ol>
                        <li>Clique no ícone de popup bloqueado na barra de endereços</li>
                        <li>Selecione "Sempre permitir popups neste site"</li>
                        <li>Recarregue a página e tente novamente</li>
                    </ol>
                </div>
                <div class="warning-actions">
                    <button class="btn-primary" onclick="window.location.reload()">
                        Recarregar Página
                    </button>
                    <button class="btn-secondary" onclick="document.getElementById('popup-blocked-warning').remove()">
                        Fechar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(warning);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            this.removeExistingWarning();
        }, 30000);
    }

    // Remove existing warning
    removeExistingWarning() {
        const existing = document.getElementById('popup-blocked-warning');
        if (existing) {
            existing.remove();
        }
    }

    // Alternative login methods when popup is blocked
    async attemptAlternativeLogin(api) {
        console.log('🔍 Attempting alternative login methods...');

        // Method 1: Try redirect-based authentication
        try {
            const redirectResult = await this.tryRedirectLogin(api);
            if (redirectResult.success) {
                return redirectResult;
            }
        } catch (error) {
            console.warn('❌ Redirect login failed:', error.message);
        }

        // Method 2: Try iframe-based login (less secure but sometimes works)
        try {
            const iframeResult = await this.tryIframeLogin(api);
            if (iframeResult.success) {
                return iframeResult;
            }
        } catch (error) {
            console.warn('❌ Iframe login failed:', error.message);
        }

        // Method 3: Manual token input (as last resort)
        return this.promptManualToken();
    }

    // Try redirect-based login
    async tryRedirectLogin(api) {
        console.log('🔍 Trying redirect-based login...');
        
        return new Promise((resolve) => {
            // This would redirect the entire page to Facebook
            // Not ideal for UX but works when popups are blocked
            const redirectUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
                `client_id=${api.facebookAppId}&` +
                `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
                `scope=${api.requiredPermissions.join(',')}&` +
                `response_type=code&` +
                `state=redirect_login`;

            // Ask user if they want to redirect
            const userConsent = confirm(
                'Popups estão bloqueados. Deseja ser redirecionado para o Facebook para fazer login?\n\n' +
                'Nota: Você será levado para o Facebook e depois retornará a esta página.'
            );

            if (userConsent) {
                // Store current state
                sessionStorage.setItem('login_attempt', 'redirect');
                sessionStorage.setItem('return_url', window.location.href);
                
                // Redirect to Facebook
                window.location.href = redirectUrl;
            } else {
                resolve({
                    success: false,
                    message: 'Usuário cancelou o redirecionamento'
                });
            }
        });
    }

    // Try iframe-based login (limited by Facebook's X-Frame-Options)
    async tryIframeLogin(api) {
        console.log('🔍 Trying iframe-based login...');
        
        return new Promise((resolve) => {
            // Create hidden iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `https://www.facebook.com/v18.0/dialog/oauth?` +
                `client_id=${api.facebookAppId}&` +
                `redirect_uri=${encodeURIComponent(window.location.origin)}&` +
                `scope=${api.requiredPermissions.join(',')}&` +
                `response_type=token`;

            let timeout = setTimeout(() => {
                document.body.removeChild(iframe);
                resolve({
                    success: false,
                    message: 'Iframe login timeout'
                });
            }, 30000);

            iframe.onload = () => {
                try {
                    // Try to access iframe content (will fail due to CORS)
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const url = iframeDoc.URL || iframe.contentWindow.location.href;
                    
                    if (url.includes('access_token')) {
                        clearTimeout(timeout);
                        // Extract token from URL
                        const tokenMatch = url.match(/access_token=([^&]+)/);
                        if (tokenMatch) {
                            const accessToken = tokenMatch[1];
                            api.accessToken = accessToken;
                            api.connectionStatus = 'connected';
                            
                            document.body.removeChild(iframe);
                            resolve({
                                success: true,
                                accessToken: accessToken,
                                message: 'Login via iframe bem-sucedido'
                            });
                            return;
                        }
                    }
                } catch (error) {
                    // Expected due to CORS restrictions
                    console.log('Iframe access blocked (expected)');
                }
                
                clearTimeout(timeout);
                document.body.removeChild(iframe);
                resolve({
                    success: false,
                    message: 'Iframe login não disponível'
                });
            };

            document.body.appendChild(iframe);
        });
    }

    // Prompt for manual token input (development/testing only)
    promptManualToken() {
        console.log('🔍 Prompting for manual token input...');
        
        const modal = document.createElement('div');
        modal.className = 'manual-token-modal';
        modal.innerHTML = `
            <div class="manual-token-content">
                <h3>Login Manual (Apenas para Desenvolvimento)</h3>
                <p>Como último recurso, você pode inserir um token de acesso manualmente:</p>
                <ol>
                    <li>Vá para <a href="https://developers.facebook.com/tools/explorer/" target="_blank">Facebook Graph API Explorer</a></li>
                    <li>Selecione sua aplicação</li>
                    <li>Configure as permissões: ads_read, ads_management, read_insights</li>
                    <li>Gere um token de usuário</li>
                    <li>Cole o token abaixo:</li>
                </ol>
                <input type="text" id="manual-token-input" placeholder="Cole o token aqui..." style="width: 100%; padding: 10px; margin: 10px 0;">
                <div class="manual-token-actions">
                    <button onclick="window.popupDetector.applyManualToken()" class="btn-primary">Aplicar Token</button>
                    <button onclick="document.querySelector('.manual-token-modal').remove()" class="btn-secondary">Cancelar</button>
                </div>
                <p><small><strong>Aviso:</strong> Use apenas para desenvolvimento. Nunca compartilhe tokens de acesso.</small></p>
            </div>
        `;

        document.body.appendChild(modal);

        return new Promise((resolve) => {
            window.popupDetector.manualTokenResolve = resolve;
        });
    }

    // Apply manual token
    applyManualToken() {
        const input = document.getElementById('manual-token-input');
        const token = input.value.trim();
        
        if (!token) {
            alert('Por favor, insira um token válido.');
            return;
        }

        // Remove modal
        document.querySelector('.manual-token-modal').remove();

        // Resolve with token
        if (this.manualTokenResolve) {
            this.manualTokenResolve({
                success: true,
                accessToken: token,
                message: 'Token manual aplicado',
                manual: true
            });
        }
    }

    // Check if we're returning from a redirect
    handleRedirectReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state === 'redirect_login') {
            console.log('🔍 Handling redirect return with code:', code);
            
            // Exchange code for token (would need backend implementation)
            this.showRedirectMessage();
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            return true;
        }
        
        return false;
    }

    // Show message for redirect return
    showRedirectMessage() {
        const message = document.createElement('div');
        message.className = 'redirect-message';
        message.innerHTML = `
            <div class="redirect-message-content">
                <h3>🔄 Retorno do Facebook</h3>
                <p>Você retornou do Facebook com sucesso!</p>
                <p><small>Nota: Para converter o código em token, seria necessário um backend. Por enquanto, use o modo demo.</small></p>
                <button onclick="this.parentElement.parentElement.remove()" class="btn-primary">OK</button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 10000);
    }
}

// Initialize global popup detector
window.popupDetector = new PopupDetector();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopupDetector;
}