# 🔑 Teste do Login Facebook - Guia Completo

## 🚀 Preparação

1. **Acesse**: http://localhost:8000
2. **Abra Console**: F12 → Console
3. **Mude para API Real**: Seletor no topo direito

## 🔍 Diagnósticos Disponíveis

### **Debug Básico**
```javascript
// Verificar se o botão está visível e clicável
checkButtonClickability()

// Debug completo do botão
debugFacebookButton()

// Debug completo do login
debugFacebookLogin()
```

### **Testes de Funcionamento**
```javascript
// Testar clique do botão
testButtonClick()

// Forçar clique direto
forceButtonClick()

// Teste completo de login
testFacebookLogin()
```

### **Testes Avançados**
```javascript
// Login forçado com logs detalhados
forceFacebookLogin()

// Reset completo e tentativa de login
resetAndTryLogin()

// Verificar configuração do Facebook App
checkFacebookAppConfig()
```

## 📋 Checklist de Problemas Comuns

### ✅ **1. Botão Não Aparece**
- [ ] Está no modo "API Real"?
- [ ] Console mostra erros de CSS?
- [ ] Execute: `fixFacebookButton()`

### ✅ **2. Botão Não Clica**
- [ ] Execute: `checkButtonClickability()`
- [ ] Botão está habilitado?
- [ ] Execute: `testButtonClick()`

### ✅ **3. Login Não Funciona**
- [ ] Facebook SDK carregado? (`typeof FB !== 'undefined'`)
- [ ] App ID correto? (`778309504913999`)
- [ ] Execute: `debugFacebookLogin()`

### ✅ **4. Popup Não Abre**
- [ ] Popup blocker ativo?
- [ ] HTTPS/localhost?
- [ ] Execute: `forceFacebookLogin()`

## 🎯 Fluxo de Teste Recomendado

### **Passo 1: Verificação Básica**
```javascript
// 1. Verificar ambiente
runAPIDiagnostics()

// 2. Verificar botão
fullButtonDebug()
```

### **Passo 2: Teste de Clique**
```javascript
// 1. Verificar clicabilidade
checkButtonClickability()

// 2. Testar clique
testButtonClick()
```

### **Passo 3: Teste de Login**
```javascript
// 1. Debug do login
debugFacebookLogin()

// 2. Teste completo
testFacebookLogin()
```

### **Passo 4: Se Não Funcionar**
```javascript
// 1. Reset completo
resetAndTryLogin()

// 2. Verificar App
checkFacebookAppConfig()
```

## 🚨 Soluções para Problemas Específicos

### **Erro: "Facebook SDK não carregado"**
```javascript
// Forçar carregamento do SDK
await window.metaAdsApp.api.initFacebookSDK()
```

### **Erro: "Popup bloqueado"**
1. Permitir popups para localhost
2. Tentar clique manual no botão
3. Execute: `forceFacebookLogin()`

### **Erro: "App ID inválido"**
```javascript
// Verificar App ID
checkFacebookAppConfig()

// App ID deve ser: 778309504913999
```

### **Erro: "Permissões negadas"**
1. Fazer logout: `window.metaAdsApp.api.logout()`
2. Tentar login novamente
3. Aceitar todas as permissões

## 📊 O que Esperar

### **Login Bem-sucedido**
```
✅ SDK carregado
✅ Popup aberto
✅ Usuário autorizou
✅ Token recebido
✅ Dados do usuário carregados
✅ Interface atualizada
```

### **Console Logs Esperados**
```
🔗 Iniciando login Facebook...
📦 Facebook SDK carregado
🔑 Iniciando autenticação...
✅ Login bem-sucedido!
👤 Usuário: [Nome do usuário]
```

## 🛠️ Comandos de Emergência

### **Reset Completo**
```javascript
// Limpar tudo e recomeçar
localStorage.clear()
location.reload()
```

### **Fix Agressivo do Botão**
```javascript
// Forçar exibição do botão
fixFacebookButton()
```

### **Login Manual Direto**
```javascript
// Bypass da interface, login direto
forceFacebookLogin()
```

## 📱 Configuração do Facebook App

### **Informações Importantes**
- **App ID**: `778309504913999`
- **Domínios Válidos**: `localhost:8000`
- **Permissões**: `ads_read`, `ads_management`, `read_insights`, `business_management`

### **Se o App Não Funcionar**
1. Verificar se o App ID está ativo
2. Verificar se localhost está autorizado
3. Verificar se as permissões estão aprovadas

---

💡 **Dica**: Execute os comandos na ordem e cole os resultados se precisar de ajuda!