-- ============================================================================
-- SOLUÇÃO DEFINITIVA: Criar coluna "name" como alias/cópia de "company_name"
-- Para compatibilidade total com código antigo/novo
-- ============================================================================

-- 1. Adicionar coluna "name" se não existir
ALTER TABLE companies 
  ADD COLUMN IF NOT EXISTS name TEXT;

-- 2. Copiar todos os valores de company_name para name
UPDATE companies 
SET name = company_name 
WHERE name IS NULL OR name != company_name;

-- 3. Criar trigger para manter sincronizado
CREATE OR REPLACE FUNCTION sync_company_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar name com company_name
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.company_name IS NOT NULL THEN
      NEW.name := NEW.company_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger
DROP TRIGGER IF EXISTS trigger_sync_company_name ON companies;
CREATE TRIGGER trigger_sync_company_name
  BEFORE INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_name();

-- 5. Verificar
SELECT id, company_name, name, cnpj FROM companies LIMIT 5;

