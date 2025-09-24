# 📱 Facebook Login - Permissões Corrigidas

## 🔧 **Problema resolvido:**
❌ Erro: `Invalid Scopes: read_insights`

## ✅ **Solução implementada:**

**Permissões antigas** (requeriam aprovação):
```javascript
scope: 'ads_read,ads_management,read_insights,business_management'
```

**Permissões corrigidas** (básicas, sem aprovação):
```javascript
scope: 'email,public_profile'
```

## 🎯 **Arquivos atualizados:**

1. ✅ `js/simple-facebook-login.js` - linha 41
2. ✅ `js/meta-api.js` - linha 25

## 🚀 **Para testar:**

1. **Acesse**: http://localhost:8000  
2. **Console** (F12) → Execute: `testFacebookLoginNow()`
3. **Login deve funcionar** sem erros de permissão

## 📋 **Próximos passos para produção:**

Para usar permissões avançadas (`ads_read`, `ads_management`), será necessário:

1. **App Review** do Facebook
2. **Demonstrar** como o app usa cada permissão  
3. **Fornecer** exemplos de uso específicos
4. **Aguardar** aprovação (2-7 dias)

Por enquanto, o login básico funciona para autenticação! 🎉

## 🔍 **Teste atual:**
- ✅ Login funciona
- ✅ Obtém dados básicos do usuário  
- ✅ Salva token corretamente
- ⏳ Sem acesso a dados de anúncios (requer aprovação)