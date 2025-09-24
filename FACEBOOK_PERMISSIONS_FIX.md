# 🔧 Correção: "supported permission"

## ❌ **Problema:**
```
"Parece que esse app não está disponível"
"Este app precisa pelo menos do supported permission"
```

## 🎯 **Causa:**
- Facebook requer pelo menos **UMA** permissão além de `email` e `public_profile`
- Apenas `email,public_profile` não é suficiente para apps Business

## ✅ **Solução implementada:**

**Permissões antigas** (insuficientes):
```javascript
scope: 'email,public_profile'
```

**Permissões corrigidas** (com mínima adicional):
```javascript
scope: 'email,public_profile,pages_show_list'
```

### 📋 **Por que `pages_show_list`?**
- ✅ **Não requer App Review** - funciona imediatamente
- ✅ **Permissão básica** - apenas lista páginas do usuário
- ✅ **Compatível** com apps Business e Consumer
- ✅ **Sempre aprovada** automaticamente pelo Facebook

## 📁 **Arquivos atualizados:**
- ✅ `js/simple-facebook-login.js`
- ✅ `js/meta-api.js` 
- ✅ `js/production-config.js`
- ✅ `js/facebook-app-diagnostics.js`

## 🧪 **Para testar:**

1. **Em produção** (https://reports.layermarketing.com.br):
   ```javascript
   testProductionLogin()
   ```

2. **Em localhost**:
   ```javascript
   testFacebookLoginNow()
   ```

3. **Diagnóstico completo**:
   ```javascript
   diagnoseFacebookApp()
   ```

## 📋 **Configuração necessária no Facebook App:**

No console do Facebook (`https://developers.facebook.com/apps/778309504913999/`):

### 1. **Configurações Básicas:**
- App Domains: `reports.layermarketing.com.br`
- Site URL: `https://reports.layermarketing.com.br/`

### 2. **Facebook Login:**
- Valid OAuth Redirect URIs: `https://reports.layermarketing.com.br/`
- Client OAuth Login: **Sim**
- Web OAuth Login: **Sim**

### 3. **Produtos ativos:**
- ✅ Facebook Login (ativado)

### 4. **Status do App:**
- Status: **Live** (não Development)

## 🎉 **Resultado esperado:**
Com `pages_show_list` adicionado, o Facebook agora deve aceitar o login e não mostrar mais o erro de "supported permission"!

---

💡 **A permissão `pages_show_list` é a mínima adicional que funciona sem aprovação!**