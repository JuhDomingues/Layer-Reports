// Facebook App Creation Guide and Helper

class FacebookAppCreator {
    constructor() {
        this.currentStep = 0;
        this.appConfig = {
            appId: null,
            appSecret: null,
            appName: 'Layer Reports Dashboard',
            domain: window.location.hostname,
            redirectUri: window.location.origin + '/'
        };
        this.steps = this.getCreationSteps();
    }

    // Get step-by-step creation guide
    getCreationSteps() {
        return [
            {
                title: 'Acesso ao Facebook Developers',
                description: 'Primeiro, você precisa acessar o console de desenvolvimento do Facebook',
                actions: [
                    'Acesse https://developers.facebook.com/',
                    'Faça login com sua conta Facebook',
                    'Aceite os termos de desenvolvedor se solicitado'
                ],
                verificationUrl: 'https://developers.facebook.com/',
                nextText: 'Já estou logado no Facebook Developers'
            },
            {
                title: 'Criar Novo App',
                description: 'Agora vamos criar um novo aplicativo Facebook',
                actions: [
                    'Clique no botão "Create App" (verde, no canto superior direito)',
                    'Selecione "Business" como tipo de app',
                    'Clique em "Next"'
                ],
                tips: [
                    'Se não aparecer "Create App", procure por "My Apps" → "Create App"',
                    'Escolha "Business" pois é para dashboard de negócios'
                ],
                nextText: 'Selecionei "Business" e cliquei Next'
            },
            {
                title: 'Configurar Informações Básicas',
                description: 'Preencha as informações básicas do seu app',
                actions: [
                    `App Name: "${this.appConfig.appName}"`,
                    'App Contact Email: Seu email principal',
                    'Business Account: Selecione ou crie um Business Manager',
                    'Clique em "Create App"'
                ],
                tips: [
                    'Use um nome descritivo como "Layer Reports Dashboard"',
                    'O email deve ser válido - você receberá notificações importantes',
                    'Se não tiver Business Manager, será criado automaticamente'
                ],
                nextText: 'App criado com sucesso'
            },
            {
                title: 'Copiar App ID',
                description: 'Agora precisamos do App ID que foi gerado',
                actions: [
                    'Na página principal do app, encontre o "App ID"',
                    'Copie o número (ex: 1234567890123456)',
                    'Cole o App ID no campo abaixo'
                ],
                inputField: {
                    label: 'Cole seu novo App ID:',
                    placeholder: '1234567890123456',
                    validation: /^\d{15,16}$/
                },
                tips: [
                    'O App ID é um número de 15-16 dígitos',
                    'Está na seção "Settings" → "Basic" se não estiver visível'
                ],
                nextText: 'App ID configurado'
            },
            {
                title: 'Adicionar Facebook Login',
                description: 'Adicionar o produto Facebook Login ao seu app',
                actions: [
                    'No menu lateral, clique em "Add Product"',
                    'Encontre "Facebook Login" e clique em "Set Up"',
                    'Escolha "Web" como plataforma',
                    'Clique em "Next"'
                ],
                tips: [
                    'Se já estiver na página de produtos, procure por "Facebook Login"',
                    'Web é a plataforma correta para dashboard'
                ],
                nextText: 'Facebook Login configurado'
            },
            {
                title: 'Configurar URLs do Site',
                description: 'Configurar as URLs permitidas para seu domínio',
                actions: [
                    'Em "Facebook Login" → "Settings" (menu lateral)',
                    `Valid OAuth Redirect URIs: ${this.appConfig.redirectUri}`,
                    'Salve as alterações'
                ],
                copyFields: [
                    {
                        label: 'Valid OAuth Redirect URIs:',
                        value: this.appConfig.redirectUri,
                        description: 'Cole exatamente este valor'
                    }
                ],
                tips: [
                    'Use exatamente a URL mostrada, incluindo a barra final',
                    'Para produção, use sua URL do Vercel'
                ],
                nextText: 'URLs configuradas'
            },
            {
                title: 'Configurar Domínios do App',
                description: 'Configurar os domínios permitidos nas configurações básicas',
                actions: [
                    'Vá para "Settings" → "Basic" (menu lateral)',
                    `App Domains: ${this.appConfig.domain}`,
                    `Website URL: ${this.appConfig.redirectUri}`,
                    'Salve as alterações'
                ],
                copyFields: [
                    {
                        label: 'App Domains:',
                        value: this.appConfig.domain,
                        description: 'Apenas o domínio, sem https://'
                    },
                    {
                        label: 'Website URL:',
                        value: this.appConfig.redirectUri,
                        description: 'URL completa com https://'
                    }
                ],
                nextText: 'Domínios configurados'
            },
            {
                title: 'Adicionar Marketing API',
                description: 'Adicionar a Marketing API para acessar dados de anúncios',
                actions: [
                    'Volte para "Add Product"',
                    'Encontre "Marketing API" e clique em "Set Up"',
                    'Aceite os termos de uso',
                    'A Marketing API será adicionada ao seu app'
                ],
                permissions: [
                    '✅ Permissões básicas (disponíveis imediatamente):',
                    'public_profile - Informações básicas do perfil',
                    'email - Endereço de email do usuário',
                    '',
                    '🔐 Permissões avançadas (requerem App Review):',
                    'ads_read - Ler dados de anúncios',
                    'ads_management - Gerenciar campanhas',
                    'business_management - Gerenciar Business Manager'
                ],
                tips: [
                    '⚠️ Para acessar dados de anúncios, você precisa passar pelo App Review',
                    'O processo pode levar 7-14 dias úteis',
                    'Por enquanto, o app funcionará em modo de desenvolvimento'
                ],
                nextText: 'Marketing API adicionada'
            },
            {
                title: 'Solicitar Permissões Avançadas (App Review)',
                description: 'Para usar ads_read, ads_management e business_management, você precisa do App Review',
                actions: [
                    'No menu lateral, clique em "App Review"',
                    'Vá para "Permissions and Features"',
                    'Para cada permissão avançada, clique em "Request":',
                    '',
                    '📝 Para ads_read:',
                    'Justificativa: "Dashboard para análise de performance de campanhas"',
                    'Forneça capturas de tela do dashboard',
                    '',
                    '📝 Para ads_management:',
                    'Justificativa: "Permitir otimização de campanhas baseada em dados"',
                    'Demonstre como os usuários gerenciam campanhas',
                    '',
                    '📝 Para business_management:',
                    'Justificativa: "Acesso a contas de anúncios em Business Manager"',
                    'Explique como protege dados empresariais'
                ],
                tips: [
                    '🎯 Seja específico sobre o valor para o usuário final',
                    '🔒 Destaque medidas de segurança e privacidade',
                    '📸 Inclua screenshots detalhadas da funcionalidade',
                    '⏰ O review pode levar até 14 dias úteis'
                ],
                copyData: {
                    businessUse: 'Dashboard para análise de performance de campanhas Meta Ads, permitindo aos usuários visualizar métricas, ROI e insights detalhados para otimizar investimentos em publicidade digital.'
                },
                nextText: 'Entendi o processo de App Review'
            },
            {
                title: 'Configurar App para Produção',
                description: 'Preparar o app para uso em produção',
                actions: [
                    'Em "Settings" → "Basic", complete todos os campos obrigatórios',
                    'Privacy Policy URL: Adicione uma URL válida',
                    'Terms of Service URL: Adicione uma URL válida',
                    'Mude o status para "Live" quando estiver pronto'
                ],
                tips: [
                    'Use geradores online para Privacy Policy se necessário',
                    'O app pode ficar em "Development" inicialmente',
                    'Em Development, apenas você pode usar o app'
                ],
                nextText: 'App configurado para produção'
            },
            {
                title: 'Testar Integração',
                description: 'Testar se o novo app funciona com o dashboard',
                actions: [
                    'Copie o App ID final',
                    'Cole no dashboard usando updateAppId()',
                    'Teste a conexão',
                    'Verifique se o login funciona'
                ],
                testCommands: [
                    'updateAppId("SEU_NOVO_APP_ID")',
                    'debugFacebookConnection()',
                    'forceReconnect()'
                ],
                nextText: 'Integração testada e funcionando'
            }
        ];
    }

    // Show creation guide modal
    showCreationGuide() {
        this.removeExistingModal();
        
        const modal = document.createElement('div');
        modal.id = 'app-creation-modal';
        modal.className = 'app-creation-modal';
        modal.innerHTML = this.generateGuideModal();
        
        document.body.appendChild(modal);
        this.updateStepContent();
    }

    // Generate guide modal HTML
    generateGuideModal() {
        return `
            <div class="creation-modal-content">
                <div class="creation-header">
                    <h2>🔧 Criar Novo Facebook App</h2>
                    <div class="step-progress">
                        <span class="current-step">Passo ${this.currentStep + 1}</span>
                        <span class="total-steps">de ${this.steps.length}</span>
                    </div>
                    <button class="close-btn" onclick="window.appCreator.closeModal()">✕</button>
                </div>
                
                <div class="creation-body">
                    <div class="step-indicator">
                        ${this.generateStepIndicator()}
                    </div>
                    
                    <div class="step-content" id="step-content">
                        <!-- Dynamic content will be inserted here -->
                    </div>
                    
                    <div class="step-navigation">
                        <button 
                            id="prev-btn" 
                            onclick="window.appCreator.previousStep()"
                            class="btn btn-secondary"
                            ${this.currentStep === 0 ? 'disabled' : ''}
                        >
                            ← Anterior
                        </button>
                        
                        <button 
                            id="next-btn" 
                            onclick="window.appCreator.nextStep()"
                            class="btn btn-primary"
                        >
                            ${this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Próximo →'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Generate step indicator
    generateStepIndicator() {
        return this.steps.map((step, index) => {
            const status = index < this.currentStep ? 'completed' : 
                          index === this.currentStep ? 'current' : 'pending';
            
            return `
                <div class="step-dot ${status}" onclick="window.appCreator.goToStep(${index})">
                    <span class="step-number">${index + 1}</span>
                    <span class="step-title">${step.title}</span>
                </div>
            `;
        }).join('');
    }

    // Update step content
    updateStepContent() {
        const step = this.steps[this.currentStep];
        const stepContent = document.getElementById('step-content');
        
        if (!stepContent) return;

        let content = `
            <div class="step-header">
                <h3>${step.title}</h3>
                <p class="step-description">${step.description}</p>
            </div>
            
            <div class="step-actions">
                <h4>📋 Ações Necessárias:</h4>
                <ol class="action-list">
                    ${step.actions.map(action => `<li>${action}</li>`).join('')}
                </ol>
            </div>
        `;

        // Add copy fields if present
        if (step.copyFields) {
            content += `
                <div class="copy-fields">
                    <h4>📋 Valores para Copiar:</h4>
                    ${step.copyFields.map(field => `
                        <div class="copy-field">
                            <label>${field.label}</label>
                            <div class="copy-value" onclick="navigator.clipboard.writeText('${field.value}')">
                                <code>${field.value}</code>
                                <span class="copy-hint">Clique para copiar</span>
                            </div>
                            <small>${field.description}</small>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Add input field if present
        if (step.inputField) {
            content += `
                <div class="input-field">
                    <label>${step.inputField.label}</label>
                    <input 
                        type="text" 
                        id="step-input"
                        placeholder="${step.inputField.placeholder}"
                        class="step-input"
                        onchange="window.appCreator.handleInput(this.value)"
                    >
                    <div id="input-validation" class="input-validation"></div>
                </div>
            `;
        }

        // Add test commands if present
        if (step.testCommands) {
            content += `
                <div class="test-commands">
                    <h4>🧪 Comandos para Testar:</h4>
                    ${step.testCommands.map(cmd => `
                        <div class="test-command">
                            <code onclick="navigator.clipboard.writeText('${cmd}')">${cmd}</code>
                            <button onclick="window.appCreator.executeCommand('${cmd}')" class="execute-btn">
                                ▶ Executar
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Add tips if present
        if (step.tips) {
            content += `
                <div class="step-tips">
                    <h4>💡 Dicas Importantes:</h4>
                    <ul class="tips-list">
                        ${step.tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Add verification link if present
        if (step.verificationUrl) {
            content += `
                <div class="verification-link">
                    <a href="${step.verificationUrl}" target="_blank" class="btn btn-primary">
                        🔗 Abrir ${step.title}
                    </a>
                </div>
            `;
        }

        stepContent.innerHTML = content;
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }

    // Update navigation buttons
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 0;
        }
        
        if (nextBtn) {
            nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Finalizar' : 'Próximo →';
        }
    }

    // Handle input validation
    handleInput(value) {
        const step = this.steps[this.currentStep];
        const validation = document.getElementById('input-validation');
        
        if (!step.inputField || !validation) return;

        if (step.inputField.validation && step.inputField.validation.test(value)) {
            validation.innerHTML = '<span class="validation-success">✅ App ID válido</span>';
            validation.className = 'input-validation success';
            this.appConfig.appId = value;
        } else {
            validation.innerHTML = '<span class="validation-error">❌ App ID deve ter 15-16 dígitos</span>';
            validation.className = 'input-validation error';
            this.appConfig.appId = null;
        }
    }

    // Execute test command
    executeCommand(command) {
        try {
            // Replace placeholder with actual app ID
            const cmd = command.replace('SEU_NOVO_APP_ID', this.appConfig.appId || 'PLACEHOLDER');
            
            console.log(`Executing: ${cmd}`);
            eval(cmd);
        } catch (error) {
            console.error('Error executing command:', error);
            alert('Erro ao executar comando. Verifique o console.');
        }
    }

    // Navigation methods
    nextStep() {
        const step = this.steps[this.currentStep];
        
        // Validate input if required
        if (step.inputField && !this.appConfig.appId) {
            alert('Por favor, preencha o App ID antes de continuar.');
            return;
        }
        
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.updateStepContent();
            this.updateStepIndicator();
        } else {
            this.finishCreation();
        }
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateStepContent();
            this.updateStepIndicator();
        }
    }

    goToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.steps.length) {
            this.currentStep = stepIndex;
            this.updateStepContent();
            this.updateStepIndicator();
        }
    }

    // Update step indicator
    updateStepIndicator() {
        const indicator = document.querySelector('.step-indicator');
        if (indicator) {
            indicator.innerHTML = this.generateStepIndicator();
        }
    }

    // Finish creation process
    finishCreation() {
        if (this.appConfig.appId) {
            // Automatically update the dashboard with new App ID
            if (window.metaAdsApp) {
                window.metaAdsApp.api.facebookAppId = this.appConfig.appId;
                localStorage.setItem('facebook_app_id', this.appConfig.appId);
            }
            
            alert(`✅ Processo concluído!\n\nNovo App ID: ${this.appConfig.appId}\n\nO dashboard foi atualizado automaticamente.`);
            this.closeModal();
            
            // Run automatic test
            setTimeout(() => {
                if (window.debugFacebookConnection) {
                    window.debugFacebookConnection();
                }
            }, 1000);
        } else {
            alert('❌ App ID não foi configurado. Volte ao passo 4 para configurar.');
        }
    }

    // Close modal
    closeModal() {
        this.removeExistingModal();
    }

    // Remove existing modal
    removeExistingModal() {
        const existing = document.getElementById('app-creation-modal');
        if (existing) {
            existing.remove();
        }
    }

    // Quick start guide
    showQuickStart() {
        const modal = document.createElement('div');
        modal.className = 'quick-start-modal';
        modal.innerHTML = `
            <div class="quick-start-content">
                <h2>🚀 Quick Start - Criar Facebook App</h2>
                <p>Escolha como você quer proceder:</p>
                
                <div class="quick-options">
                    <button onclick="window.appCreator.showCreationGuide()" class="option-btn primary">
                        📋 Guia Passo-a-Passo Completo
                        <small>Recomendado para iniciantes</small>
                    </button>
                    
                    <button onclick="window.open('https://developers.facebook.com/apps/', '_blank')" class="option-btn secondary">
                        🔗 Criar Direto no Facebook
                        <small>Para quem já conhece o processo</small>
                    </button>
                    
                    <button onclick="window.appCreator.showSummary()" class="option-btn tertiary">
                        📄 Ver Resumo das Configurações
                        <small>Lista de configurações necessárias</small>
                    </button>
                </div>
                
                <button onclick="this.parentElement.parentElement.remove()" class="close-quick">
                    Fechar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Show configuration summary
    showSummary() {
        console.group('📋 Resumo das Configurações Necessárias');
        console.log('1. Criar app tipo "Business"');
        console.log('2. Configurar Facebook Login');
        console.log('3. Adicionar Marketing API');
        console.log('4. Configurar domínios:', this.appConfig.domain);
        console.log('5. Configurar redirect URI:', this.appConfig.redirectUri);
        console.log('6. Ativar app para produção');
        console.groupEnd();
        
        alert(`📋 Configurações necessárias logadas no console!\n\nDomínio: ${this.appConfig.domain}\nRedirect URI: ${this.appConfig.redirectUri}`);
    }

    // Show development mode guide
    showDevelopmentMode() {
        const modal = document.createElement('div');
        modal.className = 'debug-modal production-debug-modal';
        modal.innerHTML = `
            <div class="debug-modal-content">
                <div class="debug-header">
                    <h2>🧪 Modo de Desenvolvimento</h2>
                    <button onclick="this.closest('.debug-modal').remove()">✕</button>
                </div>
                <div class="debug-body">
                    <h3>💡 Para Testar Sem App Review:</h3>
                    <p>Você pode gerar um token de acesso temporário para desenvolvimento:</p>
                    
                    <ol>
                        <li>Vá para <strong>Tools → Graph API Explorer</strong></li>
                        <li>Selecione seu app no dropdown</li>
                        <li>Clique em "Generate Access Token"</li>
                        <li>Selecione as permissões disponíveis</li>
                        <li>Use este token para testes de desenvolvimento</li>
                    </ol>
                    
                    <div class="copy-section">
                        <h4>🔗 Links Úteis:</h4>
                        <div class="copy-item">
                            <label>Graph API Explorer:</label>
                            <div class="copy-value">https://developers.facebook.com/tools/explorer/</div>
                            <button onclick="navigator.clipboard.writeText('https://developers.facebook.com/tools/explorer/')">📋</button>
                        </div>
                    </div>
                    
                    <div class="warning" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4>⚠️ Limitações do Token de Desenvolvimento:</h4>
                        <ul>
                            <li>Expira em 1-2 horas</li>
                            <li>Só funciona com suas próprias contas</li>
                            <li>Permissões limitadas</li>
                            <li>Não pode ser usado em produção</li>
                        </ul>
                    </div>
                    
                    <h3>🎯 Para Produção (App Review Necessário):</h3>
                    <p>Para usar ads_read, ads_management e business_management você precisa:</p>
                    <ul>
                        <li>📝 Preencher formulário de App Review</li>
                        <li>📸 Fornecer screenshots detalhadas</li>
                        <li>🔒 Explicar medidas de privacidade</li>
                        <li>⏰ Aguardar aprovação (7-14 dias)</li>
                    </ul>
                    
                    <div class="debug-actions">
                        <button onclick="window.open('https://developers.facebook.com/tools/explorer/', '_blank')" class="btn btn-primary">
                            🚀 Abrir Graph API Explorer
                        </button>
                        <button onclick="window.appCreator.showAppReviewHelp()" class="btn btn-secondary">
                            📋 Guia do App Review
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Show app review help
    showAppReviewHelp() {
        const modal = document.createElement('div');
        modal.className = 'debug-modal production-debug-modal';
        modal.innerHTML = `
            <div class="debug-modal-content">
                <div class="debug-header">
                    <h2>📋 Guia do App Review</h2>
                    <button onclick="this.closest('.debug-modal').remove()">✕</button>
                </div>
                <div class="debug-body">
                    <h3>🔐 Permissões que Precisam de Review:</h3>
                    <ul>
                        <li><strong>ads_read</strong> - Ler dados de campanhas e anúncios</li>
                        <li><strong>ads_management</strong> - Criar e modificar campanhas</li>
                        <li><strong>business_management</strong> - Acessar Business Manager</li>
                    </ul>
                    
                    <h3>📝 Como Solicitar:</h3>
                    <ol>
                        <li>Vá para App Review → Permissions and Features</li>
                        <li>Clique em "Request" para cada permissão</li>
                        <li>Preencha o formulário detalhadamente</li>
                        <li>Inclua screenshots do seu dashboard</li>
                        <li>Explique o valor para o usuário final</li>
                    </ol>
                    
                    <h3>🎯 Dicas para Aprovação:</h3>
                    <ul>
                        <li><strong>Seja específico:</strong> Explique exatamente como usa cada permissão</li>
                        <li><strong>Screenshots:</strong> Mostre a interface do usuário real</li>
                        <li><strong>Valor comercial:</strong> Destaque como ajuda os usuários</li>
                        <li><strong>Privacidade:</strong> Explique como protege dados sensíveis</li>
                        <li><strong>Teste completo:</strong> App deve funcionar perfeitamente</li>
                    </ul>
                    
                    <div class="copy-section">
                        <h4>📝 Texto Sugerido para Justificativa:</h4>
                        <div class="copy-item">
                            <label>Business Use Case:</label>
                            <div class="copy-value">Dashboard para análise de performance de campanhas Meta Ads, permitindo aos usuários visualizar métricas, ROI e insights detalhados para otimizar investimentos em publicidade digital.</div>
                            <button onclick="navigator.clipboard.writeText('Dashboard para análise de performance de campanhas Meta Ads, permitindo aos usuários visualizar métricas, ROI e insights detalhados para otimizar investimentos em publicidade digital.')">📋</button>
                        </div>
                    </div>
                    
                    <div class="debug-actions">
                        <button onclick="window.open('https://developers.facebook.com/docs/app-review/', '_blank')" class="btn btn-primary">
                            📖 Documentação do App Review
                        </button>
                        <button onclick="window.open('https://developers.facebook.com/docs/marketing-api/get-started/', '_blank')" class="btn btn-secondary">
                            🚀 Marketing API Guide
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Initialize global app creator
window.appCreator = new FacebookAppCreator();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacebookAppCreator;
}