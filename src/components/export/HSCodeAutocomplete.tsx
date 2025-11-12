import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HSCode {
  code: string;
  description: string;
  parent?: string;
}

interface HSCodeAutocompleteProps {
  value: string;
  onSelect: (code: string) => void; // Chamado quando seleciona um código
  placeholder?: string;
}

export function HSCodeAutocomplete({ value, onSelect, placeholder }: HSCodeAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [codes, setCodes] = useState<HSCode[]>([]);

  // Buscar HS Codes do cache local (SUPER RÁPIDO!)
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      console.log(`[HS-AUTOCOMPLETE] 🔍 Buscando: "${query}"`);
      
      // Buscar do arquivo público (cached da UN Comtrade)
      const response = await fetch('/hs-codes.json');
      
      if (!response.ok) {
        throw new Error('Cache HS Codes não encontrado');
      }

      const data = await response.json();
      const allCodes = data.results || [];

      console.log(`[HS-AUTOCOMPLETE] ✅ Cache carregado: ${allCodes.length} códigos`);

      // Filtrar por query
      const filtered = query
        ? allCodes.filter((code: any) => {
            const text = `${code.id} ${code.text}`.toLowerCase();
            return text.includes(query.toLowerCase());
          })
        : allCodes.slice(0, 100);

      console.log(`[HS-AUTOCOMPLETE] ✅ Filtrados: ${filtered.length}`);

      return {
        total: filtered.length,
        codes: filtered.slice(0, 50).map((c: any) => ({
          code: c.id,
          description: c.text,
        })),
      };
    },
    onSuccess: (data) => {
      console.log(`[HS-AUTOCOMPLETE] ✅ ${data?.codes?.length || 0} códigos no dropdown`);
      setCodes(data?.codes || []);
    },
    onError: (error) => {
      console.error('[HS-AUTOCOMPLETE] ❌:', error);
    },
  });

  // Buscar conforme usuário digita (debounce)
  useEffect(() => {
    if (search.length >= 2) {
      const timer = setTimeout(() => {
        searchMutation.mutate(search);
      }, 300); // 300ms debounce

      return () => clearTimeout(timer);
    } else if (search.length === 0) {
      // Carregar códigos iniciais (95xx para Pilates)
      searchMutation.mutate('95');
    }
  }, [search]);

  const selectedCode = codes.find(c => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-mono"
        >
          {value ? (
            <span className="flex items-center gap-2 flex-1 text-left">
              <Check className="h-4 w-4 text-green-600 shrink-0" />
              <span className="font-bold">{value}</span>
              {selectedCode && (
                <span className="text-xs text-muted-foreground font-normal truncate">
                  - {selectedCode.description}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground font-normal">
              {placeholder || 'Digite HS Code ou nome do produto...'}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[700px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Digite código (ex: 9506) ou produto (ex: pilates, furniture, footwear)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {searchMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>
              {searchMutation.isPending ? (
                <div className="py-6 text-center text-sm">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Buscando códigos HS...
                </div>
              ) : (
                <div className="py-6 text-center text-sm">
                  <p>Nenhum código encontrado.</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Digite pelo menos 2 caracteres (ex: "95" para esportes)
                  </p>
                </div>
              )}
            </CommandEmpty>
            
            <CommandGroup>
              {codes.map((code) => (
                <CommandItem
                  key={code.code}
                  value={code.code}
                  onSelect={() => {
                    onSelect(code.code); // ✅ Adiciona código à lista
                    setSearch(''); // Limpa busca
                    setOpen(false);
                  }}
                  className="flex items-start gap-3 py-3"
                >
                  <Check
                    className={cn(
                      'mt-1 h-4 w-4 shrink-0',
                      value === code.code ? 'opacity-100 text-green-600' : 'opacity-0'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-base">{code.code}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {code.description}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>

          {/* Footer com stats */}
          {codes.length > 0 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/30">
              Mostrando {codes.length} de {searchMutation.data?.total || 0} códigos
              {searchMutation.data?.total > 50 && (
                <span className="ml-2 text-amber-600">
                  • Digite mais caracteres para refinar
                </span>
              )}
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

