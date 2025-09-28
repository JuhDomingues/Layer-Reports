// Debug específico para cliques no botão do Facebook
(function() {
    'use strict';
    
    console.log('🖱️ === DEBUG DE CLIQUE DO BOTÃO ===');
    
    function setupButtonClickDebug() {
        const loginBtn = document.getElementById('facebookLoginBtn');
        if (!loginBtn) {
            console.log('⏳ Botão não encontrado ainda, tentando novamente...');
            return false;
        }
        
        console.log('✅ Botão encontrado, configurando debug de clique...');
        
        // Interceptar todos os tipos de eventos
        const events = ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend'];
        
        events.forEach(eventType => {
            loginBtn.addEventListener(eventType, function(e) {
                console.log(`🖱️ Evento ${eventType} detectado no botão Facebook`);
                console.log('   📍 Target:', e.target);
                console.log('   ⚡ Event:', e);
                
                if (eventType === 'click') {
                    console.log('🔍 CLIQUE DETECTADO - Verificando handler...');
                    
                    // Verificar se o app está carregado
                    if (window.metaAdsApp) {
                        console.log('✅ App principal carregado');
                        console.log(`   🎭 Modo: ${window.metaAdsApp.api?.mode}`);
                        console.log(`   🔗 handleFacebookLogin: ${typeof window.metaAdsApp.handleFacebookLogin}`);
                    } else {
                        console.error('❌ App principal não carregado!');
                    }
                    
                    // Verificar se há outros listeners
                    console.log('🔍 Verificando outros listeners...');
                    const listeners = getEventListeners ? getEventListeners(loginBtn) : 'N/A (console do DevTools necessário)';
                    console.log('   📋 Listeners:', listeners);
                }
            }, true); // Use capture para garantir que pegue o evento
        });
        
        // Adicionar listener personalizado para teste
        loginBtn.addEventListener('click', async function(e) {
            console.log('🧪 === TESTE DE CLIQUE PERSONALIZADO ===');
            
            try {
                // Prevenir múltiplos cliques
                if (loginBtn.disabled) {
                    console.log('⚠️ Botão já está processando clique');
                    return;
                }
                
                loginBtn.disabled = true;
                loginBtn.style.opacity = '0.7';
                
                console.log('🔄 Iniciando login via clique personalizado...');
                
                if (window.metaAdsApp && window.metaAdsApp.handleFacebookLogin) {
                    const result = await window.metaAdsApp.handleFacebookLogin();
                    console.log('📊 Resultado do login personalizado:', result);
                } else {
                    console.error('❌ Função handleFacebookLogin não encontrada');
                }
                
            } catch (error) {
                console.error('❌ Erro no clique personalizado:', error);
            } finally {
                loginBtn.disabled = false;
                loginBtn.style.opacity = '1';
            }
        });
        
        console.log('✅ Debug de clique configurado');
        return true;
    }
    
    // Tentar configurar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            let attempts = 0;
            const maxAttempts = 50;
            
            const interval = setInterval(() => {
                attempts++;
                
                if (setupButtonClickDebug() || attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (attempts >= maxAttempts) {
                        console.warn('⚠️ Não foi possível configurar debug do botão');
                    }
                }
            }, 100);
        });
    } else {
        setupButtonClickDebug();
    }
    
    // Função global para testar clique manual
    window.testButtonClick = function() {
        console.log('🧪 === TESTE MANUAL DE CLIQUE ===');
        
        const loginBtn = document.getElementById('facebookLoginBtn');
        if (!loginBtn) {
            console.error('❌ Botão não encontrado');
            return;
        }
        
        console.log('🖱️ Simulando clique...');
        
        // Criar evento de clique
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        // Disparar evento
        loginBtn.dispatchEvent(clickEvent);
        console.log('✅ Evento de clique disparado');
    };
    
    // Função para verificar se o clique está funcionando
    window.checkButtonClickability = function() {
        console.log('🔍 === VERIFICAÇÃO DE CLICABILIDADE ===');
        
        const loginBtn = document.getElementById('facebookLoginBtn');
        if (!loginBtn) {
            console.error('❌ Botão não encontrado');
            return false;
        }
        
        const styles = window.getComputedStyle(loginBtn);
        const rect = loginBtn.getBoundingClientRect();
        
        console.log('📊 Estado do botão:');
        console.log(`   👀 Visível: ${styles.display !== 'none' && styles.visibility !== 'hidden'}`);
        console.log(`   🖱️ Clicável: ${!loginBtn.disabled}`);
        console.log(`   📐 Dimensões: ${rect.width}x${rect.height}`);
        console.log(`   📍 Posição: ${rect.top}, ${rect.left}`);
        console.log(`   🎯 Z-index: ${styles.zIndex}`);
        console.log(`   👆 Pointer events: ${styles.pointerEvents}`);
        
        // Verificar se está sendo coberto por outro elemento
        const elementAtPosition = document.elementFromPoint(
            rect.left + rect.width/2, 
            rect.top + rect.height/2
        );
        
        console.log('🎯 Elemento na posição do botão:', elementAtPosition);
        console.log(`   📋 É o próprio botão? ${elementAtPosition === loginBtn}`);
        
        return {
            visible: styles.display !== 'none' && styles.visibility !== 'hidden',
            clickable: !loginBtn.disabled,
            hasSize: rect.width > 0 && rect.height > 0,
            notCovered: elementAtPosition === loginBtn || loginBtn.contains(elementAtPosition)
        };
    };
    
    // Função para forçar clique do botão
    window.forceButtonClick = async function() {
        console.log('💪 === FORÇANDO CLIQUE DO BOTÃO ===');
        
        const loginBtn = document.getElementById('facebookLoginBtn');
        if (!loginBtn) {
            console.error('❌ Botão não encontrado');
            return;
        }
        
        // Verificar se o app está carregado
        if (!window.metaAdsApp) {
            console.error('❌ App principal não carregado');
            return;
        }
        
        try {
            console.log('🔄 Chamando handleFacebookLogin diretamente...');
            const result = await window.metaAdsApp.handleFacebookLogin();
            console.log('📊 Resultado:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro ao forçar clique:', error);
            return { success: false, error: error.message };
        }
    };
    
    console.log('🖱️ Debug de clique carregado!');
    console.log('');
    console.log('📋 COMANDOS DISPONÍVEIS:');
    console.log('• testButtonClick() - Simular clique');
    console.log('• checkButtonClickability() - Verificar se é clicável');
    console.log('• forceButtonClick() - Forçar clique direto');
    
})();