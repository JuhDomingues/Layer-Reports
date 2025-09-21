// API Utilities and Error Handling for Meta Ads Dashboard

class APIErrorHandler {
    constructor() {
        this.retryCount = 0;
        this.maxRetries = 3;
        this.backoffDelay = 1000; // Start with 1 second
    }

    // Centralized error handling
    handleAPIError(error, context = '') {
        console.error(`API Error in ${context}:`, error);

        const errorInfo = this.parseError(error);
        
        // Log structured error
        this.logError(errorInfo, context);
        
        // Return user-friendly message
        return this.getUserFriendlyMessage(errorInfo);
    }

    // Parse different error types
    parseError(error) {
        if (typeof error === 'string') {
            return { type: 'generic', message: error, code: null };
        }

        if (error.response && error.response.error) {
            // Facebook API error format
            return {
                type: 'facebook_api',
                message: error.response.error.message,
                code: error.response.error.code,
                subcode: error.response.error.error_subcode
            };
        }

        if (error.error) {
            // Direct FB error object
            return {
                type: 'facebook_api',
                message: error.error.message,
                code: error.error.code,
                subcode: error.error.error_subcode
            };
        }

        return {
            type: 'unknown',
            message: error.message || 'Erro desconhecido',
            code: null
        };
    }

    // Get user-friendly error messages
    getUserFriendlyMessage(errorInfo) {
        const errorMessages = {
            // Authentication errors
            190: 'Sua sessão expirou. Faça login novamente.',
            102: 'Sessão inválida. Faça login novamente.',
            
            // Permission errors
            10: 'Você não tem permissão para acessar estes dados.',
            200: 'Você não tem permissão para acessar esta conta de anúncios.',
            
            // Rate limiting
            4: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.',
            17: 'Limite de chamadas da API atingido. Tente novamente em uma hora.',
            
            // Business Manager errors
            803: 'Conta de anúncios não encontrada ou não acessível.',
            2635: 'Você não tem acesso a este Business Manager.',
            
            // General errors
            1: 'Erro interno da API. Tente novamente.',
            2: 'Serviço temporariamente indisponível.',
            
            // Custom error types
            'rate_limit': 'Limite de requisições atingido. Aguarde antes de tentar novamente.',
            'token_expired': 'Sua sessão expirou. Faça login novamente.',
            'network_error': 'Erro de conexão. Verifique sua internet.',
        };

        if (errorInfo.code && errorMessages[errorInfo.code]) {
            return errorMessages[errorInfo.code];
        }

        if (errorInfo.type && errorMessages[errorInfo.type]) {
            return errorMessages[errorInfo.type];
        }

        // Fallback to original message with improvements
        let message = errorInfo.message || 'Erro desconhecido';
        
        // Make common technical errors more user-friendly
        if (message.includes('access token')) {
            return 'Problema de autenticação. Faça login novamente.';
        }
        
        if (message.includes('permission')) {
            return 'Você não tem permissão para acessar estes dados.';
        }
        
        if (message.includes('rate limit')) {
            return 'Muitas solicitações. Aguarde alguns minutos.';
        }

        return message;
    }

    // Log structured errors for debugging
    logError(errorInfo, context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context: context,
            type: errorInfo.type,
            code: errorInfo.code,
            message: errorInfo.message,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log to console in development
        if (window.location.hostname === 'localhost') {
            console.table(logEntry);
        }

        // Could send to external logging service in production
        this.sendToLogger(logEntry);
    }

    // Send errors to logging service (placeholder)
    sendToLogger(logEntry) {
        // In a real implementation, send to logging service like Sentry, LogRocket, etc.
        // For now, just store in localStorage for debugging
        try {
            const errors = JSON.parse(localStorage.getItem('api_errors') || '[]');
            errors.push(logEntry);
            
            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            
            localStorage.setItem('api_errors', JSON.stringify(errors));
        } catch (e) {
            console.warn('Could not log error to localStorage:', e);
        }
    }

    // Retry mechanism with exponential backoff
    async retryWithBackoff(apiCall, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    // Wait before retry
                    const delay = this.backoffDelay * Math.pow(2, attempt - 1);
                    console.log(`Retrying API call in ${delay}ms (attempt ${attempt}/${maxRetries})`);
                    await this.delay(delay);
                }
                
                return await apiCall();
            } catch (error) {
                lastError = error;
                console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
                
                // Don't retry certain error types
                const errorInfo = this.parseError(error);
                if (this.isNonRetryableError(errorInfo)) {
                    throw error;
                }
            }
        }
        
        throw lastError;
    }

    // Check if error should not be retried
    isNonRetryableError(errorInfo) {
        const nonRetryableCodes = [
            190, // Invalid token
            102, // Invalid session
            10,  // Permission denied
            200, // No permission to ad account
            803, // Ad account not found
        ];

        return nonRetryableCodes.includes(errorInfo.code) ||
               errorInfo.type === 'token_expired';
    }

    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get error statistics for debugging
    getErrorStats() {
        try {
            const errors = JSON.parse(localStorage.getItem('api_errors') || '[]');
            const stats = {};
            
            errors.forEach(error => {
                const key = error.code || error.type || 'unknown';
                stats[key] = (stats[key] || 0) + 1;
            });
            
            return {
                total: errors.length,
                breakdown: stats,
                recent: errors.slice(-10)
            };
        } catch (e) {
            return { total: 0, breakdown: {}, recent: [] };
        }
    }

    // Clear error logs
    clearErrorLogs() {
        localStorage.removeItem('api_errors');
        console.log('Error logs cleared');
    }
}

// Connection status tracker
class ConnectionMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('✅ Conexão restaurada');
            this.showConnectionStatus('online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('❌ Conexão perdida');
            this.showConnectionStatus('offline');
        });
    }

    showConnectionStatus(status) {
        // Remove existing notifications
        const existing = document.querySelector('.connection-notification');
        if (existing) existing.remove();

        // Create notification
        const notification = document.createElement('div');
        notification.className = `connection-notification ${status}`;
        notification.innerHTML = status === 'online' 
            ? '✅ Conexão restaurada' 
            : '❌ Sem conexão com a internet';

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    isConnected() {
        return this.isOnline;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APIErrorHandler, ConnectionMonitor };
} else if (typeof window !== 'undefined') {
    window.APIErrorHandler = APIErrorHandler;
    window.ConnectionMonitor = ConnectionMonitor;
}