# 🚀 APLICAR MIGRAÇÃO: CORREÇÃO DA POLÍTICA RLS DE PRESETS

## ⚡ SOLUÇÃO RÁPIDA (2 minutos)

### 1️⃣ Acessar SQL Editor do Supabase

**Link direto:** https://supabase.com/dashboard/project/kdalsopwfkrxiaxxophh/sql/new

### 2️⃣ Copiar e Colar o SQL abaixo

```sql
-- ========================================
-- MIGRATION: FIX UPDATE POLICY FOR USAGE CONTEXT PRESETS
-- OBJETIVO: Corrigir política RLS de UPDATE para permitir atualização de presets
-- ========================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Users can update their presets" ON public.usage_context_presets;

-- Recriar política de UPDATE corrigida
CREATE POLICY "Users can update their presets"
  ON public.usage_context_presets
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
    AND (
      created_by = auth.uid()
      OR (is_system_preset = false AND created_by IS NULL)
    )
  )
  WITH CHECK (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.id = auth.uid())
  );

-- Comentário
COMMENT ON POLICY "Users can update their presets" ON public.usage_context_presets IS 
  'Permite que usuários atualizem presets que criaram ou presets não-sistema sem criador. Presets do sistema não podem ser atualizados diretamente (devem ser copiados).';
```

### 3️⃣ Clicar em "RUN" (ou Ctrl+Enter)

### 4️⃣ Verificar sucesso

Deve aparecer: **"Success. No rows returned"** ✅

---

## ✅ O QUE ESTA MIGRAÇÃO FAZ:

1. **Remove a política RLS antiga** que estava causando erro 406
2. **Recria a política corrigida** sem a condição `updated_by = auth.uid()` no `WITH CHECK` (o trigger preenche automaticamente)
3. **Permite atualização** de presets criados pelo usuário ou presets não-sistema sem criador

---

## 📝 NOTA IMPORTANTE:

A lógica no código TypeScript já foi ajustada para:
- **Detectar presets do sistema** e criar uma **cópia personalizada** automaticamente
- **Permitir edição** de presets do sistema (criando cópia)
- **Atualizar normalmente** presets criados pelo usuário

Após aplicar esta migração, o erro 406 será resolvido! 🎉
