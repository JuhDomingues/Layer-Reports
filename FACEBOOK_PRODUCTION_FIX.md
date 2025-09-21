# 🔧 Correção Facebook Login em Produção

## 🚨 **Problema Identificado**
Não consegue conectar com Facebook na versão do Vercel.

## 🔍 **Diagnóstico - Execute no Console**

### **1. Debug Específico Facebook:**
```javascript
debugFacebookConnection()
```

### **2. Verificar Configurações:**
```javascript
console.log('Protocol:', location.protocol);
console.log('Hostname:', location.hostname);
console.log('App ID:', metaAdsApp.api.facebookAppId);
console.log('SDK Loaded:', metaAdsApp.api.isSDKLoaded);
```

## ⚙️ **Configurações Necessárias no Facebook App**

### **1. Acesse Facebook Developers:**
- **URL**: https://developers.facebook.com/apps/1469476877413511/

### **2. Configurações Básicas:**
1. **Domínios de App** → Adicionar:
   ```
   layer-reports-xxx.vercel.app
   ```
   (Substitua `xxx` pelo seu hash específico do Vercel)

### **3. Facebook Login:**
1. **Produtos** → **Facebook Login** → **Configurações**
2. **URIs de redirecionamento OAuth válidos**:
   ```
   https://layer-reports-xxx.vercel.app/
   ```
3. **Domínios de clientes OAuth válidos**:
   ```
   layer-reports-xxx.vercel.app
   ```

### **4. Configurações Avançadas:**
1. **Configurações Avançadas** → **Segurança**
2. **Requer App Secret**: ❌ **DESATIVAR**
3. **Usar Strict Mode para URLs de redirecionamento**: ✅ **ATIVAR**

## 🔧 **Correções Aplicadas no Código**

### **1. Detecção Automática de Produção:**
```javascript
// Detecta Vercel automaticamente
if (window.location.hostname.includes('vercel.app')) {
    this.isHttps = true; // Força HTTPS
}
```

### **2. Configurações Facebook SDK Aprimoradas:**
```javascript
FB.init({
    appId: '1469476877413511',
    cookie: true,
    xfbml: true,
    version: 'v18.0',
    status: true,
    frictionlessRequests: true
});
```

## 🧪 **Testes de Verificação**

### **Após configurar Facebook App:**

1. **Limpar cache e recarregar página**
2. **Executar diagnóstico:**
```javascript
debugFacebookConnection()
```

3. **Testar mudança para modo real:**
```javascript
metaAdsApp.api.setMode('real');
```

4. **Tentar login Facebook:**
- Alterar seletor para "🔗 API Real"
- Clicar "Conectar Facebook"
- Verificar se abre popup de login

## 🔄 **Solução de Problemas Comuns**

### **❌ "App ID não válido"**
**Solução**: Verificar se App ID está correto: `1469476877413511`

### **❌ "Domínio não autorizado"**
**Solução**: Adicionar domínio Vercel exato nas configurações do Facebook

### **❌ "Popup bloqueado"**
**Solução**: Permitir popups no navegador para o domínio

### **❌ "SDK não carrega"**
**Solução**: 
```javascript
// Forçar reload do SDK
delete window.FB;
metaAdsApp.api.isSDKLoaded = false;
metaAdsApp.api.initFacebookSDK();
```

## 📱 **Modo de Desenvolvimento vs Produção**

### **Desenvolvimento (localhost):**
- ✅ Modo demo funciona
- ❌ API real requer HTTPS

### **Produção (Vercel):**
- ✅ HTTPS automático
- ✅ API real deve funcionar
- ⚠️ Requer configuração Facebook App

## 🎯 **Checklist Final**

- [ ] Domínio Vercel adicionado no Facebook App
- [ ] URIs de redirecionamento configurados
- [ ] App Secret requirement desabilitado
- [ ] Cache do navegador limpo
- [ ] Diagnóstico `debugFacebookConnection()` executado
- [ ] Modo real testado na produção

---

**🔑 Chave do Sucesso**: O domínio exato do Vercel DEVE estar configurado no Facebook App antes que o login funcione.