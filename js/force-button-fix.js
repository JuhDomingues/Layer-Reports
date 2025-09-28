// Fix imediato para exibição do botão Facebook
(function() {
    'use strict';
    
    console.log('🔧 === FIX IMEDIATO DO BOTÃO FACEBOOK ===');
    
    function forceButtonVisibility() {
        const loginBtn = document.getElementById('facebookLoginBtn');
        const apiModeSelect = document.getElementById('apiMode');
        
        if (!loginBtn) {
            console.log('⏳ Botão ainda não carregado, tentando novamente...');
            return false;
        }
        
        const currentMode = apiModeSelect?.value || 'demo';
        console.log(`🎭 Modo detectado: ${currentMode}`);
        
        if (currentMode === 'real') {
            console.log('💪 Forçando exibição do botão...');
            
            // Aplicar múltiplas estratégias para garantir visibilidade
            loginBtn.style.setProperty('display', 'flex', 'important');
            loginBtn.style.setProperty('visibility', 'visible', 'important');
            loginBtn.style.setProperty('opacity', '1', 'important');
            loginBtn.style.setProperty('position', 'relative', 'important');
            
            // Adicionar classes
            loginBtn.classList.add('api-real-mode', 'visible');
            
            // Verificar se funcionou
            const styles = window.getComputedStyle(loginBtn);
            const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
            
            console.log(`✅ Botão forçado - Visível: ${isVisible ? '✅' : '❌'}`);
            console.log(`   Display: ${styles.display}`);
            console.log(`   Visibility: ${styles.visibility}`);
            
            return isVisible;
        } else {
            console.log('🎭 Modo demo - botão deve ficar oculto');
            return true;
        }
    }
    
    function setupModeChangeListener() {
        const apiModeSelect = document.getElementById('apiMode');
        if (!apiModeSelect) return;
        
        apiModeSelect.addEventListener('change', function(e) {
            console.log(`🔄 Modo mudou para: ${e.target.value}`);
            
            setTimeout(() => {
                forceButtonVisibility();
            }, 100);
        });
        
        console.log('✅ Listener de mudança de modo configurado');
    }
    
    function tryFix() {
        if (forceButtonVisibility()) {
            console.log('✅ Fix aplicado com sucesso!');
            setupModeChangeListener();
            return true;
        }
        return false;
    }
    
    // Tentar fix imediatamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Tentar várias vezes até conseguir
            let attempts = 0;
            const maxAttempts = 20;
            
            const interval = setInterval(() => {
                attempts++;
                
                if (tryFix() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    
                    if (attempts >= maxAttempts) {
                        console.warn('⚠️ Fix não conseguiu ser aplicado completamente');
                        
                        // Última tentativa mais agressiva
                        setTimeout(() => {
                            const loginBtn = document.getElementById('facebookLoginBtn');
                            if (loginBtn) {
                                loginBtn.style.cssText = 'display: flex !important; visibility: visible !important; opacity: 1 !important;';
                                console.log('💥 Fix agressivo aplicado!');
                            }
                        }, 2000);
                    }
                }
            }, 200);
        });
    } else {
        tryFix();
    }
    
    // Função global para fix manual
    window.fixFacebookButton = function() {
        console.log('🔧 === FIX MANUAL DO BOTÃO ===');
        
        const loginBtn = document.getElementById('facebookLoginBtn');
        if (!loginBtn) {
            console.error('❌ Botão não encontrado!');
            return false;
        }
        
        // Fix agressivo
        loginBtn.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 1000 !important;
            background: linear-gradient(135deg, #1877f2, #166fe5) !important;
            color: white !important;
            border: none !important;
            padding: 0.625rem 1.25rem !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            align-items: center !important;
            gap: 0.5rem !important;
            font-size: 0.875rem !important;
            font-weight: 600 !important;
            box-shadow: 0 2px 8px rgba(24, 119, 242, 0.25) !important;
        `;
        
        loginBtn.classList.add('api-real-mode', 'visible');
        
        console.log('✅ Fix agressivo aplicado!');
        return true;
    };
    
    console.log('🔧 Fix do botão Facebook carregado!');
    console.log('💡 Se o botão não aparecer, execute: fixFacebookButton()');
    
})();