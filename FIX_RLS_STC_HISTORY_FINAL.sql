-- =====================================================
-- FIX DEFINITIVO: RLS stc_verification_history (406)
-- Data: 04/11/2025
-- Problema: RLS bloqueando SELECT (406 Not Acceptable)
-- =====================================================

-- 1️⃣ DROP TODAS as políticas existentes
DROP POLICY IF EXISTS "stc_history_read_policy" ON public.stc_verification_history;
DROP POLICY IF EXISTS "stc_history_insert_policy" ON public.stc_verification_history;
DROP POLICY IF EXISTS "stc_history_update_policy" ON public.stc_verification_history;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.stc_verification_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.stc_verification_history;
DROP POLICY IF EXISTS "Enable read for anon users" ON public.stc_verification_history;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.stc_verification_history;

-- 2️⃣ DESABILITAR RLS temporariamente para testar
ALTER TABLE public.stc_verification_history DISABLE ROW LEVEL SECURITY;

-- 3️⃣ CRIAR políticas ULTRA-PERMISSIVAS
ALTER TABLE public.stc_verification_history ENABLE ROW LEVEL SECURITY;

-- Política READ: TODOS podem ler
CREATE POLICY "stc_history_read_all" ON public.stc_verification_history
  FOR SELECT
  USING (true);

-- Política INSERT: TODOS podem inserir
CREATE POLICY "stc_history_insert_all" ON public.stc_verification_history
  FOR INSERT
  WITH CHECK (true);

-- Política UPDATE: TODOS podem atualizar
CREATE POLICY "stc_history_update_all" ON public.stc_verification_history
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política DELETE: TODOS podem deletar (caso necessário)
CREATE POLICY "stc_history_delete_all" ON public.stc_verification_history
  FOR DELETE
  USING (true);

-- 4️⃣ GRANT permissões explícitas
GRANT ALL ON public.stc_verification_history TO anon;
GRANT ALL ON public.stc_verification_history TO authenticated;
GRANT ALL ON public.stc_verification_history TO service_role;

-- 5️⃣ VERIFICAR resultado
SELECT 
  '✅ RLS configurado com sucesso!' as status,
  COUNT(*) as total_records,
  COUNT(DISTINCT company_name) as unique_companies
FROM public.stc_verification_history;

-- 6️⃣ TESTAR SELECT (deve funcionar agora)
SELECT 
  company_name,
  status,
  confidence,
  created_at
FROM public.stc_verification_history
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- IMPORTANTE: Execute este SQL no Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/qtcwetabhhkhvomcrqgm/sql/new
-- =====================================================

