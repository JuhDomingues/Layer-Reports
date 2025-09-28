# 🧪 Teste do Botão Facebook - Guia Rápido

## 🚀 Passos para Testar

### 1. **Acessar a Aplicação**
```
http://localhost:8000
```

### 2. **Abrir Console do Navegador**
- Pressione `F12`
- Vá para aba "Console"

### 3. **Verificar Carregamento**
Você deve ver logs como:
```
🚀 === INICIALIZADOR DA API REAL ===
🔧 === FIX IMEDIATO DO BOTÃO FACEBOOK ===
✅ Fix aplicado com sucesso!
```

### 4. **Mudar para API Real**
- No seletor superior direito, mude de "📊 Modo Demo" para "🔗 API Real"
- O botão "Conectar Facebook" deve aparecer

### 5. **Se o Botão NÃO Aparecer**

#### **Opção A: Debug Automático**
```javascript
fullButtonDebug()
```

#### **Opção B: Fix Manual**
```javascript
fixFacebookButton()
```

#### **Opção C: Diagnóstico Completo**
```javascript
runAPIDiagnostics()
```

## 🔍 Comandos de Debug Disponíveis

```javascript
// Verificar estado do botão
debugFacebookButton()

// Forçar exibição
forceShowFacebookButton()

// Fix agressivo
fixFacebookButton()

// Testar mudança de modo
testModeSwitch()

// Debug completo
fullButtonDebug()

// Diagnóstico da API
runAPIDiagnostics()
```

## ✅ O que Deve Acontecer

1. **Modo Demo**: Botão oculto
2. **Modo API Real**: Botão visível com:
   - Cor azul do Facebook
   - Texto "Conectar Facebook"
   - Ícone do Facebook
   - Animação pulsante (se não autenticado)
   - Notificação explicativa

## 🎯 Posição do Botão

O botão deve aparecer no **header superior direito**, entre:
- Status da API (esquerda)
- Seletores de Business Manager (direita)

## 🚨 Se Ainda Não Funcionar

1. **Recarregue a página** (Ctrl+F5)
2. **Execute no console**:
   ```javascript
   // Limpeza completa
   localStorage.clear()
   location.reload()
   ```
3. **Verifique se está em localhost**:
   ```javascript
   console.log(window.location.href)
   // Deve mostrar: http://localhost:8000
   ```

## 📱 Layout Responsivo

- **Desktop**: Botão visível no header
- **Mobile**: Pode ficar em dropdown do menu

## 🎨 Aparência do Botão

```css
/* Deve ter estas características: */
- Background: Gradiente azul (#1877f2 → #166fe5)
- Padding: 0.625rem 1.25rem
- Border-radius: 8px
- Box-shadow: sutil
- Hover: Efeito shimmer
- Animação: Pulso quando necessário
```

---

💡 **Dica**: Mantenha o Console aberto para ver todos os logs de debug!