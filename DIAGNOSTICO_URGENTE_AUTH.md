# 🚨 DIAGNÓSTICO URGENTE - AUTENTICAÇÃO NÃO PERSISTE

## 📋 EXECUTE ESTE SCRIPT NO CONSOLE DO NAVEGADOR

### **PASSO 1: ABRIR CONSOLE**
1. Pressione `F12`
2. Clique na aba **"Console"**
3. **Cole e execute** este script completo:

```javascript
// ============================================
// DIAGNÓSTICO COMPLETO DE AUTENTICAÇÃO
// ============================================

console.log('🔍 === INICIANDO DIAGNÓSTICO COMPLETO ===\n');

// 1. VERIFICAR AMBIENTE
console.log('1️⃣ AMBIENTE:');
console.log('   URL atual:', window.location.href);
console.log('   Origin:', window.location.origin);
console.log('   Protocol:', window.location.protocol);
console.log('   Is HTTPS:', window.location.protocol === 'https:');
console.log('');

// 2. VERIFICAR LOCAL STORAGE
console.log('2️⃣ LOCAL STORAGE:');
console.log('   Tamanho:', localStorage.length);
console.log('   Todas as chaves:', Object.keys(localStorage));

const authKey = 'sb-qtcwetabhhkhvomcrqgm-auth-token';
const authToken = localStorage.getItem(authKey);
console.log('   Token Supabase existe:', !!authToken);

if (authToken) {
  try {
    const parsed = JSON.parse(authToken);
    console.log('   ✅ Token encontrado!');
    console.log('   User ID:', parsed?.currentSession?.user?.id);
    console.log('   Email:', parsed?.currentSession?.user?.email);
    console.log('   Access Token:', parsed?.currentSession?.access_token?.substring(0, 20) + '...');
    console.log('   Expires:', new Date(parsed?.currentSession?.expires_at * 1000));
    console.log('   Expirado?', Date.now() > parsed?.currentSession?.expires_at * 1000);
  } catch (e) {
    console.error('   ❌ Erro ao parsear token:', e);
  }
} else {
  console.log('   ❌ Token NÃO encontrado no localStorage!');
}
console.log('');

// 3. VERIFICAR SESSION STORAGE
console.log('3️⃣ SESSION STORAGE:');
console.log('   Tamanho:', sessionStorage.length);
console.log('   Todas as chaves:', Object.keys(sessionStorage));
console.log('');

// 4. VERIFICAR COOKIES
console.log('4️⃣ COOKIES:');
const allCookies = document.cookie.split(';').map(c => c.trim());
console.log('   Total de cookies:', allCookies.length);
console.log('   Cookies Supabase:', allCookies.filter(c => c.includes('sb-')));
console.log('');

// 5. TESTAR ACESSO AO SUPABASE CLIENT
console.log('5️⃣ SUPABASE CLIENT:');
try {
  // Tenta acessar o cliente Supabase através do window (se exposto)
  if (window.supabase) {
    console.log('   ✅ Supabase client acessível via window');
  } else {
    console.log('   ⚠️ Supabase client não exposto no window');
  }
} catch (e) {
  console.error('   ❌ Erro ao acessar Supabase:', e);
}
console.log('');

// 6. VERIFICAR PERMISSÕES DO NAVEGADOR
console.log('6️⃣ PERMISSÕES DO NAVEGADOR:');
console.log('   Cookies habilitados:', navigator.cookieEnabled);
console.log('   Storage disponível:', typeof(Storage) !== "undefined");
console.log('   localStorage acessível:', typeof localStorage !== 'undefined');
console.log('   sessionStorage acessível:', typeof sessionStorage !== 'undefined');
console.log('');

// 7. TESTAR ESCRITA NO LOCAL STORAGE
console.log('7️⃣ TESTE DE ESCRITA NO STORAGE:');
try {
  const testKey = 'test-write-' + Date.now();
  localStorage.setItem(testKey, 'test-value');
  const readValue = localStorage.getItem(testKey);
  localStorage.removeItem(testKey);
  
  if (readValue === 'test-value') {
    console.log('   ✅ LocalStorage: Escrita e leitura funcionando');
  } else {
    console.log('   ❌ LocalStorage: Leitura retornou valor diferente');
  }
} catch (e) {
  console.error('   ❌ Erro ao escrever no localStorage:', e);
  console.error('   Possível causa: Modo privado, quota excedida, ou bloqueado por extensão');
}
console.log('');

// 8. VERIFICAR MODO PRIVADO
console.log('8️⃣ DETECÇÃO DE MODO PRIVADO:');
try {
  sessionStorage.setItem('test', '1');
  sessionStorage.removeItem('test');
  console.log('   ✅ Não está em modo privado (ou modo privado permite storage)');
} catch (e) {
  console.error('   ❌ MODO PRIVADO DETECTADO! Storage bloqueado.');
  console.error('   Solução: Use uma janela normal (não privada/anônima)');
}
console.log('');

// 9. VERIFICAR EXTENSÕES QUE BLOQUEIAM STORAGE
console.log('9️⃣ POSSÍVEIS EXTENSÕES BLOQUEADORAS:');
console.log('   Extensões comuns que podem bloquear storage:');
console.log('   - Privacy Badger');
console.log('   - uBlock Origin (modo avançado)');
console.log('   - Ghostery');
console.log('   - DuckDuckGo Privacy Essentials');
console.log('   ⚠️ Desabilite extensões de privacidade temporariamente para testar');
console.log('');

// 10. RESUMO FINAL
console.log('🎯 === RESUMO DO DIAGNÓSTICO ===');
console.log('');
console.log('STATUS:');
console.log('  Token no localStorage:', !!authToken ? '✅' : '❌');
console.log('  Storage funcional:', typeof localStorage !== 'undefined' ? '✅' : '❌');
console.log('  Cookies habilitados:', navigator.cookieEnabled ? '✅' : '❌');
console.log('');

if (!authToken) {
  console.log('⚠️ AÇÕES RECOMENDADAS:');
  console.log('  1. Se em modo privado → Use janela normal');
  console.log('  2. Se extensões de privacidade → Desabilite temporariamente');
  console.log('  3. Limpe cache completamente: Ctrl+Shift+Del');
  console.log('  4. Tente em outro navegador (Chrome sem extensões)');
  console.log('  5. Faça logout e login novamente');
}

console.log('\n🔍 === DIAGNÓSTICO CONCLUÍDO ===');
```

---

## 📊 RESULTADO ESPERADO:

### **SE TUDO ESTIVER OK:**
```
✅ Token no localStorage: ✅
✅ Storage funcional: ✅
✅ Cookies habilitados: ✅
```

### **SE HOUVER PROBLEMA:**
```
❌ Token no localStorage: ❌
❌ MODO PRIVADO DETECTADO!
ou
⚠️ Extensão bloqueando storage
```

---

## 🚨 CAUSAS COMUNS:

### **1. MODO PRIVADO/ANÔNIMO** ❌
- Chrome Incógnito
- Firefox Navegação Privada
- Edge InPrivate
- **SOLUÇÃO:** Use janela normal

### **2. EXTENSÕES DE PRIVACIDADE** ❌
- uBlock Origin (modo avançado)
- Privacy Badger
- Ghostery
- DuckDuckGo Privacy Essentials
- **SOLUÇÃO:** Desabilite temporariamente

### **3. QUOTA DE STORAGE EXCEDIDA** ❌
- LocalStorage cheio (muito raro)
- **SOLUÇÃO:** Limpe o storage: `localStorage.clear()`

### **4. POLÍTICA DE SAME-SITE COOKIES** ❌
- Configurações de segurança do navegador
- **SOLUÇÃO:** Verifique configurações de cookies

### **5. SUPABASE URL INCORRETA** ❌
- .env.local com URL errada
- **SOLUÇÃO:** Validar variáveis de ambiente

---

## 🎯 PRÓXIMO PASSO:

**EXECUTE O SCRIPT ACIMA NO CONSOLE E ME ENVIE:**

1. ✅ A mensagem final do "RESUMO DO DIAGNÓSTICO"
2. ✅ Qualquer mensagem de erro em vermelho
3. ✅ Os valores de "Token no localStorage", "Storage funcional", "Cookies habilitados"

**Com essas informações, vou identificar EXATAMENTE o problema!** 🔍

