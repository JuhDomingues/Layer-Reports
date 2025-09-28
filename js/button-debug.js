// Debug específico para o botão do Facebook
window.debugFacebookButton = function() {
    console.log('🔍 === DEBUG DO BOTÃO FACEBOOK ===');
    
    const loginBtn = document.getElementById('facebookLoginBtn');
    if (!loginBtn) {
        console.error('❌ Botão não encontrado no DOM!');
        return;
    }
    
    console.log('✅ Botão encontrado no DOM');
    
    // Verificar estilos computados
    const styles = window.getComputedStyle(loginBtn);
    console.log('📊 Estilos atuais:');
    console.log(`   display: ${styles.display}`);
    console.log(`   visibility: ${styles.visibility}`);
    console.log(`   opacity: ${styles.opacity}`);
    console.log(`   position: ${styles.position}`);
    console.log(`   z-index: ${styles.zIndex}`);
    
    // Verificar classes
    console.log('📋 Classes:', loginBtn.className);
    
    // Verificar se está visível
    const rect = loginBtn.getBoundingClientRect();
    console.log('📐 Dimensões:', {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
    });
    
    // Verificar modo da API
    const apiMode = document.getElementById('apiMode')?.value;
    console.log(`🎭 Modo atual: ${apiMode}`);
    
    // Verificar se app está carregado
    const app = window.metaAdsApp;
    if (app) {
        console.log('📱 App status:');
        console.log(`   Modo API: ${app.api?.mode}`);
        console.log(`   Autenticado: ${app.isAuthenticated}`);
        console.log(`   Status conexão: ${app.api?.connectionStatus}`);
    } else {
        console.warn('⚠️ App principal não carregado');
    }
    
    return {
        buttonExists: !!loginBtn,
        styles: {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity
        },
        dimensions: rect,
        apiMode,
        appLoaded: !!app
    };
};

// Função para forçar exibição do botão
window.forceShowFacebookButton = function() {
    console.log('💪 === FORÇANDO EXIBIÇÃO DO BOTÃO ===');
    
    const loginBtn = document.getElementById('facebookLoginBtn');
    if (!loginBtn) {
        console.error('❌ Botão não encontrado!');
        return false;
    }
    
    // Forçar estilos
    loginBtn.style.display = 'flex !important';
    loginBtn.style.visibility = 'visible !important';
    loginBtn.style.opacity = '1 !important';
    loginBtn.style.position = 'relative !important';
    loginBtn.style.zIndex = '1000 !important';
    
    console.log('✅ Estilos forçados aplicados');
    
    // Verificar resultado
    const styles = window.getComputedStyle(loginBtn);
    console.log('📊 Estilos após forçar:');
    console.log(`   display: ${styles.display}`);
    console.log(`   visibility: ${styles.visibility}`);
    console.log(`   opacity: ${styles.opacity}`);
    
    return true;
};

// Função para testar mudança de modo
window.testModeSwitch = function() {
    console.log('🔄 === TESTANDO MUDANÇA DE MODO ===');
    
    const apiModeSelect = document.getElementById('apiMode');
    if (!apiModeSelect) {
        console.error('❌ Seletor de modo não encontrado!');
        return;
    }
    
    console.log(`🎭 Modo atual: ${apiModeSelect.value}`);
    
    // Mudar para real se não estiver
    if (apiModeSelect.value !== 'real') {
        console.log('🔄 Mudando para modo real...');
        apiModeSelect.value = 'real';
        
        // Disparar evento de mudança
        const event = new Event('change', { bubbles: true });
        apiModeSelect.dispatchEvent(event);
        
        console.log('✅ Evento de mudança disparado');
    } else {
        console.log('✅ Já está no modo real');
    }
    
    // Aguardar e verificar botão
    setTimeout(() => {
        debugFacebookButton();
    }, 1000);
};

// Função para debug completo
window.fullButtonDebug = function() {
    console.log('🎯 === DEBUG COMPLETO DO BOTÃO ===');
    console.log('');
    
    // 1. Verificar elementos do DOM
    console.log('1️⃣ Verificando DOM...');
    const loginBtn = document.getElementById('facebookLoginBtn');
    const apiModeSelect = document.getElementById('apiMode');
    const header = document.querySelector('.main-header');
    
    console.log(`   Botão Facebook: ${loginBtn ? '✅' : '❌'}`);
    console.log(`   Seletor Modo: ${apiModeSelect ? '✅' : '❌'}`);
    console.log(`   Header: ${header ? '✅' : '❌'}`);
    
    if (!loginBtn) {
        console.error('❌ PROBLEMA: Botão não existe no DOM');
        return;
    }
    
    // 2. Verificar CSS
    console.log('');
    console.log('2️⃣ Verificando CSS...');
    debugFacebookButton();
    
    // 3. Testar mudança de modo
    console.log('');
    console.log('3️⃣ Testando mudança de modo...');
    testModeSwitch();
    
    // 4. Forçar exibição
    console.log('');
    console.log('4️⃣ Forçando exibição...');
    forceShowFacebookButton();
    
    console.log('');
    console.log('🎯 Debug completo finalizado!');
    console.log('💡 Se ainda não aparecer, o problema pode ser de CSS ou layout');
};

console.log('🔧 Debug do botão Facebook carregado!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('• debugFacebookButton() - Verificar estado do botão');
console.log('• forceShowFacebookButton() - Forçar exibição');
console.log('• testModeSwitch() - Testar mudança de modo');
console.log('• fullButtonDebug() - Debug completo');
console.log('');
console.log('💡 Execute fullButtonDebug() para começar!');