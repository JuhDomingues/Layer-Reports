// Auto-fix que executa automaticamente
(function() {
    'use strict';
    
    console.log('🔄 === AUTO-FIX EXECUTANDO ===');
    
    // Aguardar carregamento completo
    function waitForComplete() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 100;
            
            const check = () => {
                attempts++;
                
                // Verificar se app está carregado
                const appLoaded = window.metaAdsApp;
                const domReady = document.readyState === 'complete';
                const btnExists = document.getElementById('facebookLoginBtn');
                
                if ((appLoaded && domReady && btnExists) || attempts >= maxAttempts) {
                    resolve({
                        appLoaded: !!appLoaded,
                        domReady,
                        btnExists: !!btnExists,
                        attempts
                    });
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }
    
    async function executeAutoFix() {
        console.log('⏳ Aguardando carregamento completo...');
        
        const status = await waitForComplete();
        console.log('📊 Status do carregamento:', status);
        
        // Aguardar mais um pouco para garantir
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se o botão funciona
        const loginBtn = document.getElementById('facebookLoginBtn');
        const apiMode = document.getElementById('apiMode');
        
        if (!loginBtn) {
            console.error('❌ Botão não existe - algo está muito errado');
            return;
        }
        
        if (!apiMode) {
            console.error('❌ Seletor de modo não existe');
            return;
        }
        
        // Forçar modo real para testar
        if (apiMode.value !== 'real') {
            console.log('🔄 Mudando para modo real...');
            apiMode.value = 'real';
            
            // Disparar evento de mudança
            const changeEvent = new Event('change', { bubbles: true });
            apiMode.dispatchEvent(changeEvent);
            
            // Aguardar UI atualizar
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Verificar se botão está visível
        const styles = window.getComputedStyle(loginBtn);
        const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
        
        console.log(`👀 Botão visível: ${isVisible}`);
        console.log(`📊 Display: ${styles.display}, Visibility: ${styles.visibility}`);
        
        if (!isVisible) {
            console.log('🔧 Aplicando fix de visibilidade...');
            
            if (window.applyButtonFix) {
                window.applyButtonFix();
            }
            
            if (window.fixFacebookButton) {
                window.fixFacebookButton();
            }
        }
        
        // Verificar se botão tem event listeners
        let hasWorkingClick = false;
        
        try {
            // Testar se o clique funciona
            const testClick = new MouseEvent('click', { bubbles: true, cancelable: true });
            
            // Interceptar para ver se algo acontece
            let clickDetected = false;
            
            const clickHandler = () => {
                clickDetected = true;
            };
            
            loginBtn.addEventListener('click', clickHandler);
            loginBtn.dispatchEvent(testClick);
            loginBtn.removeEventListener('click', clickHandler);
            
            // Verificar se app tem função de login
            const appHasLogin = window.metaAdsApp && 
                              typeof window.metaAdsApp.handleFacebookLogin === 'function';
            
            hasWorkingClick = clickDetected && appHasLogin;
            
            console.log(`🖱️ Clique funcional: ${hasWorkingClick}`);
            console.log(`📱 App tem login: ${appHasLogin}`);
            
        } catch (error) {
            console.warn('⚠️ Erro ao testar clique:', error);
            hasWorkingClick = false;
        }
        
        // Se não funciona, ativar emergência
        if (!hasWorkingClick) {
            console.log('🚨 Botão não funcional - ativando emergência...');
            
            if (window.activateEmergencyButton) {
                window.activateEmergencyButton();
            } else {
                console.error('❌ Sistema de emergência não disponível');
            }
        } else {
            console.log('✅ Botão funcional detectado');
        }
        
        // Mostrar resultado final
        console.log('');
        console.log('🎯 === RESULTADO DO AUTO-FIX ===');
        console.log(`✅ App carregado: ${status.appLoaded}`);
        console.log(`✅ DOM pronto: ${status.domReady}`);
        console.log(`✅ Botão existe: ${status.btnExists}`);
        console.log(`✅ Botão visível: ${isVisible}`);
        console.log(`✅ Botão funcional: ${hasWorkingClick}`);
        
        if (isVisible && hasWorkingClick) {
            console.log('🎉 TUDO FUNCIONANDO! Botão pronto para usar.');
        } else {
            console.log('⚠️ Problemas detectados - verifique o botão de emergência.');
        }
    }
    
    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeAutoFix);
    } else {
        executeAutoFix();
    }
    
    console.log('🔄 Auto-fix configurado para executar');
    
})();