# 🔧 Guia de Resolução - API Real Meta Ads

## ⚡ Teste Rápido

1. **Acesse**: http://localhost:8000
2. **Mude para API Real** no seletor no topo direito
3. **Abra o Console** (F12 → Console)
4. **Execute**: `runAPIDiagnostics()`

## 🔍 Principais Causas de Problemas

### 1. **Protocolo HTTPS/Localhost**
❌ **Problema**: Facebook SDK só funciona com HTTPS ou localhost
✅ **Solução**: 
- Use `http://localhost:8000` (atual)
- Ou acesse via HTTPS

### 2. **Facebook App Configuration**
❌ **Problema**: App ID não configurado ou domínio não autorizado
✅ **Solução**:
- App ID atual: `778309504913999`
- Domínio autorizado: `localhost:8000`

### 3. **SDK não carregando**
❌ **Problema**: Facebook SDK não inicializa
✅ **Solução**:
```javascript
// No console, execute:
forceReconnectAPI()
```

## 🛠️ Comandos de Debug

### Diagnóstico Completo
```javascript
runAPIDiagnostics()
```

### Verificar Configuração
```javascript
checkAPIConfig()
```

### Forçar Reconexão
```javascript
forceReconnectAPI()
```

### Reset Completo
```javascript
resetFacebookConnection()
```

### Teste Rápido de Login
```javascript
quickLoginTest()
```

## 📋 Checklist de Resolução

### ✅ Verificações Básicas
- [ ] Acessando via `http://localhost:8000`
- [ ] Modo "API Real" selecionado
- [ ] Console sem erros críticos
- [ ] Botão "Conectar Facebook" visível

### ✅ Verificações Avançadas
- [ ] Facebook SDK carregado (`typeof FB !== 'undefined'`)
- [ ] App ID correto (`778309504913999`)
- [ ] Permissões necessárias disponíveis
- [ ] Token não expirado

## 🚨 Problemas Comuns

### "Facebook SDK requer HTTPS"
**Causa**: Protocolo HTTP em domínio público
**Solução**: Use localhost ou HTTPS

### "App ID não encontrado"
**Causa**: Configuração incorreta do App
**Solução**: Verificar App ID no Facebook Developers

### "Permissões negadas"
**Causa**: Usuário negou permissões necessárias
**Solução**: Fazer logout e login novamente

### "Token expirado"
**Causa**: Token de acesso expirou
**Solução**: Execute `resetFacebookConnection()` e faça login novamente

## 📞 Próximos Passos

Se ainda não funcionar:

1. **Execute diagnóstico completo**:
   ```javascript
   runAPIDiagnostics()
   ```

2. **Verifique console** para erros específicos

3. **Teste com conta de desenvolvedor** do Facebook App

4. **Verificar status do App** no Facebook Developers

## 🎯 URLs Importantes

- **Localhost**: http://localhost:8000
- **Facebook Developers**: https://developers.facebook.com/apps/778309504913999
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/

---

💡 **Dica**: Mantenha o Console aberto para ver logs detalhados do processo de conexão!