# 📊 Layer Reports - Meta Ads Dashboard

Dashboard profissional para visualização e análise de relatórios do Meta Ads (Facebook Ads) com integração à API real.

## 🚀 **Funcionalidades**

- **📈 Dashboard Interativo**: KPIs, gráficos e tabelas responsivas
- **🔗 API Real**: Conexão direta com Meta Ads Graph API
- **📊 Modo Demo**: Dados simulados para desenvolvimento e testes
- **💰 Multi-moeda**: Suporte para USD, BRL, EUR, GBP com formatação automática
- **🏢 Business Manager**: Filtros por Business Manager e contas específicas
- **📱 Responsivo**: Design mobile-first com breakpoints otimizados

## 🛠️ **Tecnologias**

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js para visualizações interativas
- **API**: Meta Ads Graph API v18.0
- **Estilo**: CSS Grid, Flexbox, Inter Font Family
- **Deploy**: Vercel com HTTPS automático

## 🔧 **Configuração**

### **1. Configuração do Facebook App**

1. Acesse: [Facebook Developers](https://developers.facebook.com/apps/1469476877413511/)
2. Configure os domínios permitidos:
   - **Desenvolvimento**: `localhost`
   - **Produção**: Seu domínio Vercel
3. Ative Facebook Login com permissões:
   - `ads_read`
   - `ads_management` 
   - `read_insights`

### **2. Business Manager Target**

- **Nome**: Dr. Santiago Vecina
- **ID**: 177341406299126
- **Conta USD**: 4030832237237833

## 🌐 **Deploy**

### **Vercel (Recomendado)**

1. **Push para GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/layer-reports
git push -u origin main
```

2. **Deploy no Vercel**:
- Conecte seu repositório GitHub
- Deploy automático com HTTPS
- Configure domínios personalizados se necessário

### **Local (Desenvolvimento)**

```bash
# Servidor simples
python3 -m http.server 8000

# Para API real (requer HTTPS)
npx serve -s . -l 8443 --ssl
```

## 📋 **Uso**

### **Modo Demo**
- Carregamento automático com dados simulados
- Business Manager "Dr. Santiago Vecina" pré-configurado
- Contas USD e BRL de exemplo

### **Modo Real**
1. Altere para "🔗 API Real" no seletor
2. Clique "Conectar Facebook"
3. Faça login com conta autorizada
4. Selecione Business Manager "Dr. Santiago Vecina"
5. Escolha a conta de anúncios desejada

## 🧪 **Debug e Diagnóstico**

### **Funções de Console**
```javascript
// Diagnóstico completo
fullLoadingDiagnostic()

// Debug do Business Manager específico
debugBM177341406299126()

// Verificar status da API
console.log('Modo:', metaAdsApp.api.mode);
console.log('Autenticado:', metaAdsApp.isAuthenticated);
```

### **Verificar Contas**
```javascript
metaAdsApp.api.getAdAccounts().then(accounts => {
    const usdAccount = accounts.data.find(acc => acc.id.includes('4030832237237833'));
    console.log('Conta USD:', usdAccount?.name);
});
```

## 📁 **Estrutura do Projeto**

```
Layer/
├── index.html              # Página principal
├── css/style.css          # Estilos responsivos
├── js/
│   ├── main.js            # Lógica principal
│   └── meta-api.js        # Integração API Meta
├── assets/                # Imagens e recursos
├── vercel.json           # Configuração Vercel
└── README.md             # Documentação
```

## 🔒 **Segurança**

- **HTTPS Obrigatório**: Para API real (automático no Vercel)
- **Tokens Seguros**: Access tokens armazenados localmente
- **Permissões Mínimas**: Apenas leitura de insights e campanhas
- **Validação**: Verificação de Business Manager e contas

## 📞 **Suporte**

- **Issues**: Use GitHub Issues para reportar problemas
- **Debug**: Consulte arquivos `DEBUG_API.md` e `TESTE_CORRECOES.md`
- **API Docs**: [Meta Ads API Documentation](https://developers.facebook.com/docs/marketing-api)

---

**🎯 Objetivo**: Dashboard profissional para análise de campanhas Meta Ads com dados reais da conta 4030832237237833 do Business Manager "Dr. Santiago Vecina".