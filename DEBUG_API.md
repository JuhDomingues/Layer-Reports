# 🔧 Debug da API Real - Meta Ads Dashboard

## ⚠️ Passos para Diagnosticar Problemas de Conexão

### 1. **Verificar o Console do Navegador**

1. Abra o dashboard em `http://localhost:8000`
2. Abra o DevTools (F12 ou Ctrl+Shift+I)
3. Vá para a aba **Console**
4. Digite: `debugAPI()` e pressione Enter
5. Anote as informações que aparecem

### 2. **Verificar Configuração do Facebook App**

Acesse: https://developers.facebook.com/apps/1469476877413511/

**Verifique se está configurado:**
- ✅ **Produtos > Facebook Login** ativado
- ✅ **Configurações do Facebook Login**:
  - URIs de redirecionamento OAuth válidos: `http://localhost:8000`
  - Domínios de App: `localhost`
- ✅ **Configurações Básicas**:
  - Domínios de App: `localhost`
  - URL da Política de Privacidade (obrigatória)

### 3. **Verificar Status do App**

- **Em Desenvolvimento**: Pode ser testado apenas por administradores/desenvolvedores
- **Em Produção**: Disponível para todos os usuários

### 4. **Problemas Comuns e Soluções**

#### ❌ **"API Real Desconectada"**
**Possíveis causas:**
1. App não configurado corretamente
2. Usuário não tem permissão para acessar o app
3. Problema de rede/CORS
4. Facebook SDK não carregou

**Soluções:**
1. Verifique se você é admin/desenvolvedor do app
2. Teste em modo **Incógnito** do navegador
3. Verifique se há bloqueadores de anúncios ativos

#### ❌ **"Erro ao carregar Facebook SDK"**
**Soluções:**
1. Verifique sua conexão com internet
2. Desative extensões/bloqueadores
3. Teste em outro navegador

#### ❌ **"Login cancelado ou não autorizado"**
**Soluções:**
1. Certifique-se de aceitar todas as permissões
2. Verifique se sua conta tem acesso ao Business Manager
3. Teste com uma conta que tenha campanhas ativas

### 5. **Teste Manual do Facebook SDK**

No console do navegador, execute:

```javascript
// Verificar se SDK carregou
console.log('FB disponível:', typeof FB !== 'undefined');

// Verificar status de login
if (typeof FB !== 'undefined') {
    FB.getLoginStatus(function(response) {
        console.log('Status de login:', response);
    });
}

// Testar login manual
if (typeof FB !== 'undefined') {
    FB.login(function(response) {
        console.log('Resposta do login:', response);
    }, {scope: 'ads_read,ads_management'});
}
```

### 6. **Logs Importantes**

Procure por estas mensagens no console:

✅ **Sucesso:**
- "Loading Facebook SDK..."
- "Facebook SDK script loaded"
- "Initializing Facebook SDK with App ID: 1469476877413511"
- "Facebook SDK initialized successfully"

❌ **Erro:**
- "Failed to load Facebook SDK script"
- "Error initializing Facebook SDK"
- "Facebook SDK failed to load properly"

### 7. **Configurações de Desenvolvimento**

Para desenvolvimento local, certifique-se:

1. **URL do app**: `http://localhost:8000` (não https)
2. **Domínio**: `localhost`
3. **Modo**: Em desenvolvimento
4. **Sua conta**: Adicionada como desenvolvedor/admin

### 8. **Teste de Permissões**

No console, após conectar:

```javascript
// Verificar permissões concedidas
window.metaAdsApp.api.checkPermissions().then(result => {
    console.log('Permissões:', result);
});
```

## 📞 **Próximos Passos**

1. Execute `debugAPI()` no console e me envie o resultado
2. Verifique se há erros no console durante o processo de login
3. Confirme se você é admin/desenvolvedor do app Facebook
4. Teste em modo incógnito sem extensões

---

**App ID configurado**: 1469476877413511
**Business Manager**: Dr. Santiago Vecina (177341406299126)
**Servidor rodando**: http://localhost:8001

## 🔧 **Correções Aplicadas**

### ✅ **Problema HTTPS Resolvido**
- Sistema detecta automaticamente HTTP vs HTTPS
- Em HTTP: força modo demo (Facebook SDK não funciona)
- Em HTTPS: permite modo real com API

### ✅ **Erro de Charts Corrigido**
- Adicionadas verificações de segurança em `updateCharts()`
- Previne erro "Cannot read properties of undefined (reading 'data')"
- Charts só atualizam quando dados estão inicializados

### ✅ **Função Duplicada Removida**
- Removida função `handleBusinessManagerChange` duplicada
- Mantida apenas a versão robusta com fallbacks

### ✅ **App ID Atualizado**
- App ID correto: `1469476877413511`
- Configuração automática baseada no localStorage