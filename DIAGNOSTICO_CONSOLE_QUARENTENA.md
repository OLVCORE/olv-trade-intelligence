# 🔍 Diagnóstico da Quarentena ICP - Scripts para Console do Navegador

## 🎯 Problema
As empresas não aparecem na Quarentena ICP, mas os toasts dizem "já estão na quarentena".

## 🔧 Scripts de Diagnóstico

### 1. Verificar Registros Órfãos (sem user_id)

Cole no console do navegador (F12 > Console):

```javascript
// 1. Importar supabase (se estiver usando módulos ES6)
// Ou acesse via React DevTools: $r.props.supabase (se estiver em um componente React)
// Ou use o objeto global se disponível

// Para usar no console, você precisa importar o supabase client
// Opção 1: Se você tiver acesso ao código, adicione temporariamente:
// window.supabase = supabase; no arquivo client.ts

// Opção 2: Use o Supabase Dashboard SQL Editor para executar:
/*
SELECT 
  id, 
  razao_social, 
  user_id, 
  tenant_id, 
  workspace_id, 
  company_id, 
  created_at
FROM icp_analysis_results
WHERE user_id IS NULL
LIMIT 10;
*/
```

### 2. Verificar Registros do Usuário Atual

```javascript
// 1. Obter usuário autenticado
const { data: { user } } = await window.supabase.auth.getUser();
console.log('👤 Usuário autenticado:', user?.id);

// 2. Verificar registros do usuário atual
const { data: myRecords, error: myError } = await window.supabase
  .from('icp_analysis_results')
  .select('id, razao_social, user_id, tenant_id, workspace_id, status, icp_score, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(20);

if (myError) {
  console.error('❌ Erro ao buscar registros:', myError);
} else {
  console.log('✅ Registros do usuário atual:', myRecords?.length || 0);
  if (myRecords && myRecords.length > 0) {
    console.table(myRecords);
  } else {
    console.warn('⚠️ NENHUM REGISTRO ENCONTRADO para o usuário atual');
    console.warn('⚠️ Possíveis causas:');
    console.warn('⚠️ 1. Registros foram inseridos sem user_id (órfãos)');
    console.warn('⚠️ 2. RLS está bloqueando (user_id não corresponde a auth.uid())');
  }
}
```

### 3. Verificar Total de Registros (Bypass RLS - Apenas para diagnóstico)

⚠️ **ATENÇÃO:** Este script requer permissões de administrador ou acesso direto ao banco.

```javascript
// Contar total de registros (sem filtros RLS)
// ⚠️ Isso só funciona se você tiver acesso direto ao banco ou permissões de admin
const { count: totalCount, error: countError } = await window.supabase
  .from('icp_analysis_results')
  .select('*', { count: 'exact', head: true });

if (countError) {
  console.error('❌ Erro ao contar registros:', countError);
} else {
  console.log('📊 Total de registros no banco (sem filtros RLS):', totalCount);
}
```

### 4. Verificar Políticas RLS

```javascript
// Verificar se as políticas RLS estão corretas
// ⚠️ Isso requer acesso ao Supabase Dashboard ou SQL Editor

// Execute no SQL Editor do Supabase:
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'icp_analysis_results';
*/
```

### 5. Limpar Registros Órfãos Manualmente (⚠️ CUIDADO)

⚠️ **ATENÇÃO:** Execute apenas se você tiver certeza de que quer remover registros órfãos.

```javascript
// 1. Verificar quantos órfãos existem
const { data: orphans, error: orphanError } = await window.supabase
  .from('icp_analysis_results')
  .select('id, razao_social')
  .is('user_id', null);

if (orphanError) {
  console.error('❌ Erro ao buscar órfãos:', orphanError);
} else {
  console.log('🔍 Registros órfãos encontrados:', orphans?.length || 0);
  
  if (orphans && orphans.length > 0) {
    console.warn('⚠️ ATENÇÃO: Você está prestes a deletar', orphans.length, 'registros órfãos');
    console.warn('⚠️ Estes registros não podem ser visualizados de qualquer forma devido à RLS');
    
    // ⚠️ DESCOMENTE APENAS SE TIVER CERTEZA:
    /*
    const { error: deleteError } = await window.supabase
      .from('icp_analysis_results')
      .delete()
      .is('user_id', null);
    
    if (deleteError) {
      console.error('❌ Erro ao deletar órfãos:', deleteError);
    } else {
      console.log('✅ Registros órfãos removidos com sucesso');
    }
    */
  }
}
```

## 🎯 Solução Recomendada

1. **Execute a migration de limpeza:**
   - Acesse o Supabase Dashboard
   - Vá para SQL Editor
   - Execute: `supabase/migrations/20260116000002_cleanup_quarantine_orphans.sql`

2. **Verifique os logs no console:**
   - Abra o console do navegador (F12)
   - Navegue até "Leads > ICP Quarentena"
   - Procure por logs `[QUARENTENA]`

3. **Teste a integração novamente:**
   - Vá para "Gerenciar Empresas"
   - Clique em "Integrar ao ICP"
   - Verifique os logs no console

## 📊 Logs Esperados

Após aplicar as correções, você deve ver:

```
[QUARENTENA] 🔍 Buscando empresas para user_id: 7f919e08-3aab-4602-adb1-e42127edd697
[QUARENTENA] ✅ Query executada. Total retornado: X
[QUARENTENA] 📊 Primeiros registros: [...]
```

Se ainda aparecer "Total retornado: 0", verifique:
1. Se a migration foi aplicada
2. Se os registros foram inseridos com `user_id` correto
3. Se as políticas RLS estão corretas
