// Facebook Login Helper - Enhanced login flow with better error handling

class FacebookLoginHelper {
    constructor(api) {
        this.api = api;
        this.loginInProgress = false;
        this.maxRetries = 2;
        this.currentRetry = 0;
    }

    // Enhanced login with better user feedback
    async enhancedLogin() {
        if (this.loginInProgress) {
            console.warn('⚠️ Login já em progresso');
            return { success: false, message: 'Login já em progresso' };
        }

        this.loginInProgress = true;
        this.currentRetry = 0;

        try {
            // Pre-flight checks
            const preflightResult = this.runPreflightChecks();
            if (!preflightResult.success) {
                return preflightResult;
            }

            // Show user-friendly instructions
            this.showLoginInstructions();

            // Attempt login with retries
            const result = await this.attemptLoginWithRetries();
            
            return result;

        } finally {
            this.loginInProgress = false;
            this.hideLoginInstructions();
        }
    }

    // Pre-flight checks before attempting login
    runPreflightChecks() {
        console.log('🔍 Running pre-flight checks...');

        // Check network connection
        if (!navigator.onLine) {
            return {
                success: false,
                message: 'Sem conexão com a internet. Verifique sua conexão e tente novamente.'
            };
        }

        // Check HTTPS
        if (this.api.mode === 'real' && !this.api.isHttps) {
            return {
                success: false,
                message: 'HTTPS é necessário para autenticação com Facebook.'
            };
        }

        // Check Facebook SDK
        if (!window.FB) {
            return {
                success: false,
                message: 'Facebook SDK não está carregado. Recarregue a página e tente novamente.'
            };
        }

        // Check popup blockers
        if (this.isPopupBlocked()) {
            return {
                success: false,
                message: 'Popups estão bloqueados. Permita popups para este site e tente novamente.'
            };
        }

        console.log('✅ Pre-flight checks passed');
        return { success: true };
    }

    // Check if popups are blocked
    isPopupBlocked() {
        try {
            const popup = window.open('', '_blank', 'width=1,height=1');
            if (popup) {
                popup.close();
                return false;
            }
            return true;
        } catch (e) {
            return true;
        }
    }

    // Show login instructions to user
    showLoginInstructions() {
        // Remove existing instructions
        this.hideLoginInstructions();

        const instructions = document.createElement('div');
        instructions.id = 'facebook-login-instructions';
        instructions.className = 'login-instructions';
        instructions.innerHTML = `
            <div class="login-instructions-content">
                <h3>🔐 Conectando com Facebook</h3>
                <p>Um popup será aberto para autenticação.</p>
                <ul>
                    <li>✅ Permita popups se solicitado</li>
                    <li>✅ Aceite as permissões necessárias</li>
                    <li>✅ Complete o login no Facebook</li>
                </ul>
                <div class="login-progress">
                    <div class="spinner"></div>
                    <span>Aguardando autenticação...</span>
                </div>
            </div>
        `;

        document.body.appendChild(instructions);
    }

    // Hide login instructions
    hideLoginInstructions() {
        const existing = document.getElementById('facebook-login-instructions');
        if (existing) {
            existing.remove();
        }
    }

    // Attempt login with retry logic
    async attemptLoginWithRetries() {
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`🔍 Login attempt ${attempt + 1}/${this.maxRetries + 1}`);
                
                if (attempt > 0) {
                    console.log('🔄 Retrying login...');
                    // Wait before retry
                    await this.delay(2000);
                }

                const result = await this.api.loginWithFacebook();
                
                if (result.success) {
                    console.log('✅ Login successful');
                    return result;
                }

                // If user cancelled, don't retry
                if (result.message?.includes('cancelado') || result.message?.includes('não autorizado')) {
                    console.log('ℹ️ User cancelled login, not retrying');
                    return result;
                }

                console.warn(`❌ Login attempt ${attempt + 1} failed:`, result.message);

            } catch (error) {
                console.error(`❌ Login attempt ${attempt + 1} error:`, error);
                
                // If it's the last attempt, return the error
                if (attempt === this.maxRetries) {
                    return {
                        success: false,
                        message: `Falha na autenticação após ${this.maxRetries + 1} tentativas: ${error.message}`
                    };
                }
            }
        }

        return {
            success: false,
            message: 'Falha na autenticação após múltiplas tentativas'
        };
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Check Facebook login status
    async checkExistingLogin() {
        if (!window.FB) {
            return { connected: false };
        }

        return new Promise((resolve) => {
            FB.getLoginStatus((response) => {
                console.log('🔍 Facebook login status:', response);
                resolve({
                    connected: response.status === 'connected',
                    response: response
                });
            });
        });
    }

    // Enhanced logout
    async enhancedLogout() {
        console.log('🔍 Starting enhanced logout...');
        
        try {
            // Clear local data first
            this.api.accessToken = null;
            this.api.tokenExpiresAt = null;
            this.api.user = null;
            this.api.connectionStatus = 'disconnected';
            
            localStorage.removeItem('facebook_access_token');
            localStorage.removeItem('facebook_token_expires');
            localStorage.removeItem('facebook_account_id');

            // Then logout from Facebook if SDK is available
            if (window.FB && this.api.isSDKLoaded) {
                return new Promise((resolve) => {
                    FB.logout(() => {
                        console.log('✅ Facebook logout completed');
                        resolve({ success: true });
                    });
                });
            } else {
                console.log('✅ Local logout completed');
                return { success: true };
            }

        } catch (error) {
            console.error('❌ Logout error:', error);
            return { success: false, message: error.message };
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacebookLoginHelper;
} else if (typeof window !== 'undefined') {
    window.FacebookLoginHelper = FacebookLoginHelper;
}