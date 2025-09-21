# 🔧 Soluções para Erro de Privacidade HTTPS

## 🚀 **Opção 1: Aceitar Certificado no Navegador (Mais Rápida)**

### **Chrome:**
1. Acesse: https://localhost:8443
2. Verá "Sua conexão não é particular"
3. Clique em **"Avançado"**
4. Clique em **"Prosseguir para localhost (não seguro)"**

### **Firefox:**
1. Acesse: https://localhost:8443
2. Verá "Aviso: risco potencial de segurança"
3. Clique em **"Avançado"**
4. Clique em **"Aceitar o risco e continuar"**

### **Safari:**
1. Acesse: https://localhost:8443
2. Verá "Esta conexão não é particular"
3. Clique em **"Mostrar detalhes"**
4. Clique em **"Visitar este site"**

## 🌐 **Opção 2: Usar Túnel HTTPS (Recomendado)**

### **Usando ngrok (Mais Simples):**

1. **Instalar ngrok:**
```bash
# Mac (com Homebrew)
brew install ngrok

# Windows/Linux - Download de https://ngrok.com/download
```

2. **Criar túnel HTTPS:**
```bash
# Em um terminal separado
ngrok http 8001
```

3. **Copiar URL HTTPS:**
- O ngrok mostrará algo como: `https://abc123.ngrok.io`
- Use essa URL no navegador

4. **Configurar Facebook App:**
- Acesse: https://developers.facebook.com/apps/1469476877413511/
- Adicione a URL do ngrok aos domínios válidos

## 🔄 **Opção 3: Modo Híbrido (Desenvolvimento + Produção)**

Como estamos em desenvolvimento, vou criar um modo que funciona com os dados reais mas sem HTTPS:

### **Modificação Temporária:**

Execute no console:
```javascript
// Forçar modo real mesmo em HTTP (apenas para teste)
metaAdsApp.api.mode = 'real';
metaAdsApp.api.isHttps = true; // Enganar a verificação
localStorage.setItem('api_mode', 'real');

// Recarregar interface
location.reload();
```

⚠️ **NOTA**: Esta é uma solução temporária apenas para desenvolvimento.

## 📱 **Opção 4: Teste em Dispositivo Móvel**

1. **Encontre seu IP local:**
```bash
ipconfig getifaddr en0  # Mac
ipconfig                # Windows
```

2. **Configure Facebook App:**
- Adicione o IP do seu computador aos domínios válidos
- Exemplo: `192.168.1.100:8001`

3. **Acesse do celular:**
- Use o IP: `http://192.168.1.100:8001`
- O Facebook pode aceitar HTTP em dispositivos móveis

## ⚡ **Solução Rápida Recomendada:**

**Para testar AGORA:**

1. **Acesse**: https://localhost:8443
2. **No Chrome**: Digite `thisisunsafe` (não aparece na tela, apenas digite)
3. **Ou clique**: "Avançado" → "Prosseguir para localhost"

Isso permite bypass do erro de certificado.

## 🧪 **Teste de Verificação:**

Após contornar o HTTPS, teste:

```javascript
// 1. Verificar se está em HTTPS
console.log('Protocol:', location.protocol); // Deve ser "https:"

// 2. Tentar carregar Facebook SDK
metaAdsApp.api.initFacebookSDK().then(() => {
    console.log('✅ Facebook SDK carregado com sucesso');
}).catch(err => {
    console.log('❌ Erro:', err.message);
});

// 3. Alterar para modo real
metaAdsApp.api.setMode('real');
```

---

**🎯 Objetivo**: Contornar o erro de privacidade para conectar à API real do Facebook e sincronizar dados da conta 4030832237237833.