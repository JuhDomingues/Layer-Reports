# 🔗 Como Conectar à API Real do Facebook

## 🚀 **Passo a Passo para Conexão Real**

### 1. **Acesse o Servidor HTTPS**
```
https://localhost:8443
```

⚠️ **IMPORTANTE**: O navegador mostrará um aviso de segurança sobre certificado não confiável
- **Chrome**: Clique em "Avançado" → "Prosseguir para localhost (não seguro)"
- **Firefox**: Clique em "Avançado" → "Aceitar o risco e continuar"
- **Safari**: Clique em "Mostrar detalhes" → "Visitar esse site"

### 2. **Alterar para Modo Real**

**Opção A - Via Interface:**
1. No topo da página, localize o seletor "📊 Modo Demo"
2. Altere para "🔗 API Real"
3. Clique no botão "Conectar Facebook" que aparecerá

**Opção B - Via Console:**
```javascript
// No console do navegador (F12):
metaAdsApp.api.setMode("real");
```

### 3. **Fazer Login no Facebook**
1. Clique no botão "Conectar Facebook" 
2. Faça login com sua conta Facebook
3. **IMPORTANTE**: Use a conta que tem acesso ao Business Manager "Dr. Santiago Vecina"
4. Aceite todas as permissões solicitadas

### 4. **Selecionar Business Manager**
1. Após o login, o seletor de Business Manager aparecerá
2. Selecione "Dr. Santiago Vecina" (177341406299126)
3. As contas de anúncios desse BM aparecerão automaticamente

### 5. **Selecionar Conta de Anúncios**
1. Escolha a conta específica que contém a conta USD 4030832237237833
2. O dashboard carregará os dados reais dessa conta

## 🔧 **Troubleshooting**

### ❌ **Problema: "Facebook SDK requer HTTPS"**
**Solução**: Use https://localhost:8443 (não http://localhost:8001)

### ❌ **Problema: "Login cancelado"**
**Solução**: 
- Verifique se sua conta tem acesso ao Business Manager
- Aceite todas as permissões solicitadas
- Use uma conta com campanhas ativas

### ❌ **Problema: "Business Manager não encontrado"**
**Solução**:
- Confirme que você é admin/desenvolvedor do BM
- Verifique se o BM está ativo
- Teste com modo incógnito

### ❌ **Problema: "Nenhuma conta de anúncios"**
**Solução**:
- Verifique permissões de `ads_read` e `ads_management`
- Confirme que existem contas ativas no BM
- Execute `debugBM177341406299126()` no console para diagnóstico

## 🧪 **Testes de Verificação**

### **Confirmar Modo Real Ativo:**
```javascript
console.log('Modo:', metaAdsApp.api.mode); // Deve ser "real"
console.log('Autenticado:', metaAdsApp.isAuthenticated); // Deve ser true
```

### **Verificar Conexão:**
```javascript
metaAdsApp.api.getBusinessManagers().then(bms => {
    console.log('Business Managers reais:', bms.data.length);
    bms.data.forEach(bm => console.log(`- ${bm.name} (${bm.id})`));
});
```

### **Testar Contas Específicas:**
```javascript
metaAdsApp.api.getAdAccounts().then(accounts => {
    const usdAccount = accounts.data.find(acc => acc.id.includes('4030832237237833'));
    if (usdAccount) {
        console.log('✅ Conta USD encontrada:', usdAccount.name);
    } else {
        console.log('❌ Conta USD não encontrada');
    }
});
```

## 📊 **Status da Conexão**

**Indicadores Visuais:**
- 🟢 **Verde**: API conectada e funcionando
- 🟡 **Amarelo**: Conectando...
- 🔴 **Vermelho**: Desconectado ou erro
- 📊 **Azul**: Modo demo ativo

**Status no Console:**
- Execute `debugAPI()` para diagnóstico completo
- Execute `fullLoadingDiagnostic()` para teste de carregamento
- Execute `debugBM177341406299126()` para o BM específico

---

**🎯 Objetivo:** Conectar à API real e sincronizar dados da conta 4030832237237833 (USD) do Business Manager "Dr. Santiago Vecina" (177341406299126)