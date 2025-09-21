# 🚀 Guia de Deploy - GitHub + Vercel

## 📋 **Pré-requisitos**

- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com)
- Git configurado localmente

## 🛠️ **Passo a Passo**

### **1. Criar Repositório no GitHub**

1. **Acesse**: https://github.com/new
2. **Nome do repositório**: `layer-reports-dashboard`
3. **Descrição**: `Meta Ads Dashboard com integração API real`
4. **Visibilidade**: Private (recomendado para dados de negócio)
5. **Clique**: "Create repository"

### **2. Conectar Repositório Local**

```bash
# Já executado - repositório local inicializado
git remote add origin https://github.com/SEU_USUARIO/layer-reports-dashboard.git
git branch -M main
git push -u origin main
```

### **3. Deploy no Vercel**

1. **Acesse**: https://vercel.com
2. **Login**: Use sua conta GitHub
3. **Import Project**: 
   - Clique "Import Git Repository"
   - Selecione `layer-reports-dashboard`
4. **Configure**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (padrão)
   - **Build Command**: Deixe vazio (projeto estático)
   - **Output Directory**: `./` (padrão)
5. **Deploy**: Clique "Deploy"

### **4. Configurar Domínio HTTPS**

O Vercel fornecerá automaticamente:
- **URL**: `https://layer-reports-dashboard.vercel.app`
- **HTTPS**: Certificado SSL automático
- **CDN**: Global para performance

### **5. Configurar Facebook App**

1. **Acesse**: https://developers.facebook.com/apps/1469476877413511/
2. **Configurações Básicas**:
   - Adicione o domínio Vercel: `layer-reports-dashboard.vercel.app`
3. **Facebook Login**:
   - **URIs de redirecionamento válidos**: 
     ```
     https://layer-reports-dashboard.vercel.app
     ```
   - **Domínios de App**: 
     ```
     layer-reports-dashboard.vercel.app
     ```

## ✅ **Verificação do Deploy**

### **1. Testar Acesso**
- **URL de produção**: https://layer-reports-dashboard.vercel.app
- **Verificar HTTPS**: ✅ Certificado válido
- **Verificar responsividade**: ✅ Mobile e desktop

### **2. Testar Modo Demo**
```javascript
// No console da página de produção
console.log('Protocol:', location.protocol); // "https:"
console.log('Mode:', metaAdsApp.api.mode); // "demo"
fullLoadingDiagnostic(); // Deve funcionar sem erros
```

### **3. Testar API Real**
1. Altere para "🔗 API Real"
2. Clique "Conectar Facebook"
3. Faça login (sem erro de HTTPS)
4. Selecione "Dr. Santiago Vecina"
5. Verifique conta USD 4030832237237833

## 🔄 **Deploy Contínuo**

### **Atualizações Automáticas**
```bash
# Fazer mudanças no código
git add .
git commit -m "Descrição das mudanças"
git push origin main
# Deploy automático no Vercel
```

### **Branches de Desenvolvimento**
```bash
# Criar branch para features
git checkout -b feature/nova-funcionalidade
# Fazer mudanças
git commit -m "Adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade
# Preview deploy automático no Vercel
```

## 🎯 **Resultado Final**

- **✅ Dashboard online**: HTTPS + Performance global
- **✅ API real funcionando**: Sem problemas de certificado
- **✅ Deploy automático**: Push = Deploy
- **✅ Previews**: Cada branch = URL de preview
- **✅ Monitoramento**: Analytics do Vercel

## 📊 **URLs Importantes**

- **Produção**: https://layer-reports-dashboard.vercel.app
- **Dashboard Vercel**: https://vercel.com/dashboard
- **Repositório**: https://github.com/SEU_USUARIO/layer-reports-dashboard
- **Facebook App**: https://developers.facebook.com/apps/1469476877413511/

## 🔧 **Configurações Avançadas**

### **Domínio Personalizado (Opcional)**
1. No Vercel: Settings → Domains
2. Adicione seu domínio: `dashboard.seudominio.com`
3. Configure DNS conforme instruções
4. Atualize Facebook App com novo domínio

### **Variáveis de Ambiente (Se necessário)**
1. No Vercel: Settings → Environment Variables
2. Adicione se precisar de configurações específicas

---

**🚀 Ready to Deploy!** O projeto está pronto para produção com HTTPS automático e integração completa com Meta Ads API.