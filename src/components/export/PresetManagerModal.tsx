/**
 * PRESET MANAGER MODAL
 * 
 * Modal para criar/editar presets de uso final
 * Suporta:
 * - Criação de novos presets
 * - Edição de presets existentes
 * - Seleção de HS Codes com descrições
 * - Geração automática via IA
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HSCodeAutocomplete } from './HSCodeAutocomplete';
import { X, Plus, Sparkles, Loader2, Save, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  createPreset,
  updatePreset,
  deletePreset,
  type UsageContextPresetDB,
  type CreatePresetData,
  type HSCodeWithDescription,
} from '@/services/usageContextPresetsService';
import { useTenant } from '@/contexts/TenantContext';
import { generateSearchPlan, type SearchPlan } from '@/services/aiSearchPlanner';

interface PresetManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: UsageContextPresetDB | null; // Se fornecido, edita; se não, cria novo
  onPresetSaved?: () => void;
}

export function PresetManagerModal({
  open,
  onOpenChange,
  preset,
  onPresetSaved,
}: PresetManagerModalProps) {
  const { currentTenant, currentWorkspace } = useTenant();
  const queryClient = useQueryClient();

  // Estados do formulário
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [description, setDescription] = useState('');
  const [usageInclude, setUsageInclude] = useState<string[]>([]);
  const [usageExclude, setUsageExclude] = useState<string[]>([]);
  const [hsCodes, setHsCodes] = useState<HSCodeWithDescription[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [hsCodeInput, setHsCodeInput] = useState('');
  const [usageIncludeInput, setUsageIncludeInput] = useState('');
  const [usageExcludeInput, setUsageExcludeInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  // ✅ Campos de bulk input
  const [hsCodeBulkInput, setHsCodeBulkInput] = useState('');
  const [usageIncludeBulkInput, setUsageIncludeBulkInput] = useState('');
  const [usageExcludeBulkInput, setUsageExcludeBulkInput] = useState('');
  const [keywordsBulkInput, setKeywordsBulkInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Carregar dados do preset se estiver editando
  useEffect(() => {
    if (preset && open) {
      setName(preset.name || '');
      setSector(preset.sector || '');
      setDescription(preset.description || '');
      setUsageInclude(preset.usage_context_include || []);
      setUsageExclude(preset.usage_context_exclude || []);
      setHsCodes(preset.hs_codes || []);
      setKeywords(preset.keywords || []);
      // ✅ Resetar campos de bulk input
      setHsCodeBulkInput('');
      setUsageIncludeBulkInput('');
      setUsageExcludeBulkInput('');
      setKeywordsBulkInput('');
    } else if (open && !preset) {
      // Reset para novo preset
      setName('');
      setSector('');
      setDescription('');
      setUsageInclude([]);
      setUsageExclude([]);
      setHsCodes([]);
      setKeywords([]);
      // ✅ Resetar campos de bulk input
      setHsCodeBulkInput('');
      setUsageIncludeBulkInput('');
      setUsageExcludeBulkInput('');
      setKeywordsBulkInput('');
    }
  }, [preset, open]);

  // Mutation para salvar preset
  const saveMutation = useMutation({
    mutationFn: async (data: CreatePresetData) => {
      if (!currentTenant?.id) throw new Error('Tenant não encontrado');

      if (preset) {
        return await updatePreset(preset.id, data);
      } else {
        return await createPreset(currentTenant.id, {
          ...data,
          workspace_id: currentWorkspace?.id,
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usage-context-presets'] });
      if (preset?.is_system_preset) {
        toast.success('Cópia personalizada do preset criada com sucesso!', {
          description: 'O preset do sistema foi copiado como uma versão personalizada que você pode editar.',
        });
      } else {
        toast.success(preset ? 'Preset atualizado com sucesso!' : 'Preset criado com sucesso!');
      }
      onPresetSaved?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar preset', {
        description: error.message || 'Verifique o console',
      });
    },
  });

  // Mutation para deletar preset
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!preset) return;
      return await deletePreset(preset.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-context-presets'] });
      toast.success('Preset deletado com sucesso!');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao deletar preset', {
        description: error.message || 'Verifique o console',
      });
    },
  });

  // Função para gerar preset via IA
  const handleGenerateAI = async () => {
    if (!name || usageInclude.length === 0) {
      toast.warning('Preencha nome e pelo menos 1 termo de uso final antes de gerar via IA.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const searchPlan: SearchPlan | null = await generateSearchPlan({
        hsCodes: hsCodes.map(h => h.code),
        productKeywords: keywords,
        usageInclude: usageInclude,
        usageExclude: usageExclude,
        countries: [], // Não necessário para gerar preset
      });

      if (searchPlan) {
        // Aplicar sugestões da IA
        setUsageInclude((prev) => [
          ...new Set([...prev, ...searchPlan.mustIncludePhrases]),
        ]);
        setUsageExclude((prev) => [
          ...new Set([...prev, ...searchPlan.mustExcludeTerms]),
        ]);
        toast.success('Preset gerado via IA!', {
          description: 'Revisar e ajustar antes de salvar.',
        });
      } else {
        toast.warning('IA não conseguiu gerar sugestões. Preencha manualmente.');
      }
    } catch (error: any) {
      toast.error('Erro ao gerar preset via IA', {
        description: error.message || 'Verifique o console',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ✅ Função para parsear texto em massa (vírgula ou quebra de linha)
  const parseBulkText = (text: string): string[] => {
    return text
      .split(/[,\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .filter((item, index, array) => array.indexOf(item) === index); // Remover duplicatas
  };

  // ✅ Adicionar HS Codes em massa
  const handleAddHSCodesBulk = async () => {
    if (!hsCodeBulkInput.trim()) return;
    
    const codes = parseBulkText(hsCodeBulkInput);
    let added = 0;
    let skipped = 0;
    const newHSCodes: HSCodeWithDescription[] = [];

    // Buscar descrições em lote
    try {
      const response = await fetch('/hs-codes.json');
      if (response.ok) {
        const data = await response.json();
        const allCodes = data.results || [];
        
        for (const code of codes) {
          if (!hsCodes.find(h => h.code === code)) {
            const foundCode = allCodes.find((c: any) => c.id === code);
            newHSCodes.push({
              code: code,
              description: foundCode?.text || '',
            });
            added++;
          } else {
            skipped++;
          }
        }
        
        if (newHSCodes.length > 0) {
          setHsCodes([...hsCodes, ...newHSCodes]);
          setHsCodeBulkInput('');
          toast.success(`${added} HS Code(s) adicionado(s)${skipped > 0 ? `, ${skipped} já existiam` : ''}`);
        } else if (skipped > 0) {
          setHsCodeBulkInput('');
          toast.warning(`Todos os ${skipped} HS Code(s) já existem`);
        }
      } else {
        // Adicionar sem descrição se não conseguir buscar
        for (const code of codes) {
          if (!hsCodes.find(h => h.code === code)) {
            newHSCodes.push({
              code: code,
              description: '',
            });
            added++;
          } else {
            skipped++;
          }
        }
        
        if (newHSCodes.length > 0) {
          setHsCodes([...hsCodes, ...newHSCodes]);
          setHsCodeBulkInput('');
          toast.success(`${added} HS Code(s) adicionado(s) (sem descrição)${skipped > 0 ? `, ${skipped} já existiam` : ''}`);
        }
      }
    } catch (error) {
      console.error('[PRESET-MODAL] Erro ao buscar descrições dos HS Codes:', error);
      // Adicionar sem descrição se houver erro
      for (const code of codes) {
        if (!hsCodes.find(h => h.code === code)) {
          newHSCodes.push({
            code: code,
            description: '',
          });
          added++;
        } else {
          skipped++;
        }
      }
      
      if (newHSCodes.length > 0) {
        setHsCodes([...hsCodes, ...newHSCodes]);
        setHsCodeBulkInput('');
        toast.success(`${added} HS Code(s) adicionado(s) (sem descrição)${skipped > 0 ? `, ${skipped} já existiam` : ''}`);
      }
    }
  };

  // ✅ Adicionar termos incluídos em massa
  const handleAddUsageIncludeBulk = () => {
    if (!usageIncludeBulkInput.trim()) return;
    
    const terms = parseBulkText(usageIncludeBulkInput);
    const newTerms = terms.filter(term => !usageInclude.includes(term));
    
    if (newTerms.length > 0) {
      setUsageInclude([...usageInclude, ...newTerms]);
      setUsageIncludeBulkInput('');
      toast.success(`${newTerms.length} termo(s) adicionado(s)`);
    } else {
      toast.warning('Todos os termos já existem');
    }
  };

  // ✅ Adicionar termos excluídos em massa
  const handleAddUsageExcludeBulk = () => {
    if (!usageExcludeBulkInput.trim()) return;
    
    const terms = parseBulkText(usageExcludeBulkInput);
    const newTerms = terms.filter(term => !usageExclude.includes(term));
    
    if (newTerms.length > 0) {
      setUsageExclude([...usageExclude, ...newTerms]);
      setUsageExcludeBulkInput('');
      toast.success(`${newTerms.length} termo(s) adicionado(s)`);
    } else {
      toast.warning('Todos os termos já existem');
    }
  };

  // ✅ Adicionar keywords em massa
  const handleAddKeywordsBulk = () => {
    if (!keywordsBulkInput.trim()) return;
    
    const terms = parseBulkText(keywordsBulkInput);
    const newTerms = terms.filter(term => !keywords.includes(term));
    
    if (newTerms.length > 0) {
      setKeywords([...keywords, ...newTerms]);
      setKeywordsBulkInput('');
      toast.success(`${newTerms.length} keyword(s) adicionada(s)`);
    } else {
      toast.warning('Todas as keywords já existem');
    }
  };

  // Adicionar HS Code (com descrição)
  const handleAddHSCode = async (code: string) => {
    // Buscar descrição da API
    try {
      const response = await fetch('/hs-codes.json');
      if (response.ok) {
        const data = await response.json();
        const allCodes = data.results || [];
        const foundCode = allCodes.find((c: any) => c.id === code);
        
        if (foundCode) {
          const hsCodeWithDesc: HSCodeWithDescription = {
            code: code,
            description: foundCode.text || '',
          };
          
          if (!hsCodes.find(h => h.code === code)) {
            setHsCodes([...hsCodes, hsCodeWithDesc]);
            setHsCodeInput('');
            toast.success(`HS Code ${code} adicionado!`);
          }
        }
      }
    } catch (error) {
      console.error('[PRESET-MODAL] Erro ao buscar descrição do HS Code:', error);
      // Adicionar mesmo sem descrição
      const hsCodeWithDesc: HSCodeWithDescription = {
        code: code,
        description: '',
      };
      if (!hsCodes.find(h => h.code === code)) {
        setHsCodes([...hsCodes, hsCodeWithDesc]);
        setHsCodeInput('');
      }
    }
  };

  // Adicionar termo de uso final
  const handleAddUsageInclude = () => {
    const trimmed = usageIncludeInput.trim();
    if (trimmed && !usageInclude.includes(trimmed)) {
      setUsageInclude([...usageInclude, trimmed]);
      setUsageIncludeInput('');
    }
  };

  // Adicionar termo de exclusão
  const handleAddUsageExclude = () => {
    const trimmed = usageExcludeInput.trim();
    if (trimmed && !usageExclude.includes(trimmed)) {
      setUsageExclude([...usageExclude, trimmed]);
      setUsageExcludeInput('');
    }
  };

  // Adicionar keyword
  const handleAddKeyword = () => {
    const trimmed = keywordsInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordsInput('');
    }
  };

  // Remover item
  const handleRemove = (array: string[], setter: (val: string[]) => void, item: string) => {
    setter(array.filter(i => i !== item));
  };

  // Remover HS Code
  const handleRemoveHSCode = (code: string) => {
    setHsCodes(hsCodes.filter(h => h.code !== code));
  };

  // Salvar preset
  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nome do preset é obrigatório');
      return;
    }
    if (usageInclude.length === 0) {
      toast.error('Adicione pelo menos 1 termo de uso final (INCLUIR)');
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      sector: sector.trim() || undefined,
      description: description.trim() || undefined,
      usage_context_include: usageInclude,
      usage_context_exclude: usageExclude.length > 0 ? usageExclude : undefined,
      hs_codes: hsCodes.length > 0 ? hsCodes : undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            {preset ? 'Editar Preset' : 'Criar Novo Preset'}
          </DialogTitle>
          <DialogDescription>
            Configure um preset de uso final para facilitar buscas futuras. A IA pode gerar sugestões automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome e Setor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">
                Nome do Preset <span className="text-red-500">*</span>
              </Label>
              <Input
                id="preset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pilates Profissional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-sector">Setor/Segmento/Nicho</Label>
              <Input
                id="preset-sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ex: Fitness & Wellness, Aerospace"
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="preset-description">Descrição</Label>
            <Textarea
              id="preset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o preset..."
              rows={2}
            />
          </div>

          {/* HS Codes */}
          <div className="space-y-2">
            <Label>HS Codes (com descrições)</Label>
            <HSCodeAutocomplete
              value={hsCodeInput}
              onSelect={handleAddHSCode}
              placeholder="Selecione HS Codes..."
            />
            {/* ✅ Campo de bulk input para HS Codes */}
            <div className="space-y-2 mt-2 p-3 bg-muted/50 rounded-lg border border-dashed">
              <Label className="text-xs text-muted-foreground">Adicionar em massa (separado por vírgula ou quebra de linha)</Label>
              <div className="flex gap-2">
                <Textarea
                  value={hsCodeBulkInput}
                  onChange={(e) => setHsCodeBulkInput(e.target.value)}
                  placeholder="Ex: 950691, 950699, 950691&#10;ou um por linha"
                  rows={2}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddHSCodesBulk}
                  disabled={!hsCodeBulkInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {hsCodes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {hsCodes.map((hs) => (
                  <Badge
                    key={hs.code}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <span className="font-mono font-bold">{hs.code}</span>
                    {hs.description && (
                      <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {hs.description}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveHSCode(hs.code)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Uso Final - INCLUIR */}
          <div className="space-y-2">
            <Label>
              Termos INCLUIR (Uso Final Obrigatório) <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={usageIncludeInput}
                onChange={(e) => setUsageIncludeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUsageInclude();
                  }
                }}
                placeholder="Ex: pilates studio, equipamento pilates"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddUsageInclude}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* ✅ Campo de bulk input para termos incluídos */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-dashed">
              <Label className="text-xs text-muted-foreground">Adicionar em massa (separado por vírgula ou quebra de linha)</Label>
              <div className="flex gap-2">
                <Textarea
                  value={usageIncludeBulkInput}
                  onChange={(e) => setUsageIncludeBulkInput(e.target.value)}
                  placeholder="Ex: pilates studio, equipamento pilates, aparelho pilates&#10;ou um por linha"
                  rows={2}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddUsageIncludeBulk}
                  disabled={!usageIncludeBulkInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {usageInclude.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {usageInclude.map((term) => (
                  <Badge key={term} variant="default" className="flex items-center gap-1">
                    {term}
                    <button
                      type="button"
                      onClick={() => handleRemove(usageInclude, setUsageInclude, term)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Uso Final - EXCLUIR */}
          <div className="space-y-2">
            <Label>Termos EXCLUIR (Invalidam o uso)</Label>
            <div className="flex gap-2">
              <Input
                value={usageExcludeInput}
                onChange={(e) => setUsageExcludeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUsageExclude();
                  }
                }}
                placeholder="Ex: home gym, uso doméstico"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddUsageExclude}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* ✅ Campo de bulk input para termos excluídos */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-dashed">
              <Label className="text-xs text-muted-foreground">Adicionar em massa (separado por vírgula ou quebra de linha)</Label>
              <div className="flex gap-2">
                <Textarea
                  value={usageExcludeBulkInput}
                  onChange={(e) => setUsageExcludeBulkInput(e.target.value)}
                  placeholder="Ex: home gym, uso doméstico, hobby&#10;ou um por linha"
                  rows={2}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddUsageExcludeBulk}
                  disabled={!usageExcludeBulkInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {usageExclude.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {usageExclude.map((term) => (
                  <Badge key={term} variant="destructive" className="flex items-center gap-1">
                    {term}
                    <button
                      type="button"
                      onClick={() => handleRemove(usageExclude, setUsageExclude, term)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Keywords Sugeridas</Label>
            <div className="flex gap-2">
              <Input
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Ex: pilates reformer, pilates equipment"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddKeyword}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {/* ✅ Campo de bulk input para keywords */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-dashed">
              <Label className="text-xs text-muted-foreground">Adicionar em massa (separado por vírgula ou quebra de linha)</Label>
              <div className="flex gap-2">
                <Textarea
                  value={keywordsBulkInput}
                  onChange={(e) => setKeywordsBulkInput(e.target.value)}
                  placeholder="Ex: pilates reformer, pilates cadillac, pilates equipment&#10;ou um por linha"
                  rows={2}
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddKeywordsBulk}
                  disabled={!keywordsBulkInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="flex items-center gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemove(keywords, setKeywords, keyword)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Botão Gerar via IA */}
          <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div>
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                🧠 Gerar Preset via IA
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                A IA vai sugerir termos adicionais baseado no nome, setor e uso final definido
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateAI}
              disabled={isGeneratingAI || !name || usageInclude.length === 0}
            >
              {isGeneratingAI ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Gerar via IA
            </Button>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {preset && !preset.is_system_preset && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm('Tem certeza que deseja deletar este preset?')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Deletar
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saveMutation.isPending || !name.trim() || usageInclude.length === 0}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {preset ? 'Salvar Alterações' : 'Criar Preset'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
