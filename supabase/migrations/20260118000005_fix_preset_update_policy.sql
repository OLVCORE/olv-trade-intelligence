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
