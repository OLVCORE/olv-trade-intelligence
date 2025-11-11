import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Info, 
  Loader2, 
  Globe,
  DollarSign,
  Ruler,
  Weight,
  Target,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface TenantProduct {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category: string | null;
  hs_code: string | null;
  price_usd: number | null;
  price_brl: number | null;
  moq: number | null;
  weight_kg: number | null;
  dimensions_cm: string | null;
  volume_m3: number | null;
  images: string[] | null;
  main_image: string | null;
  image_url: string | null;
  sku: string | null;
  brand: string | null;
  materials: string | null;
  warranty_months: number | null;
  technical_specs: any | null;
  is_active: boolean;
  created_at: string;
}

type SortField = 'name' | 'category' | 'price_usd' | 'moq' | 'weight_kg' | 'created_at';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductCatalogManagerPro() {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();

  // States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');

  const itemsPerPage = 20;

  // ============================================================================
  // FETCH PRODUCTS
  // ============================================================================

  const { data: products, isLoading } = useQuery({
    queryKey: ['tenant-products', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant?.id) return [];

      const { data, error } = await supabase
        .from('tenant_products')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TenantProduct[];
    },
    enabled: !!currentTenant?.id,
  });

  // ============================================================================
  // FILTERING & SORTING & PAGINATION
  // ============================================================================

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.sku?.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter((p) => (p.price_usd || 0) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((p) => (p.price_usd || 0) <= parseFloat(maxPrice));
    }

    // Sorting
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, search, categoryFilter, minPrice, maxPrice, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Categories for filter
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return uniqueCategories as string[];
  }, [products]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-3 w-3 ml-1" /> : 
      <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  // Bulk Delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const { error } = await supabase
        .from('tenant_products')
        .delete()
        .in('id', productIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-products'] });
      setSelectedProducts(new Set());
      toast.success(`${selectedProducts.size} produto(s) deletado(s)`);
    },
  });

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) return;

    if (confirm(`Deletar ${selectedProducts.size} produto(s) selecionado(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedProducts));
    }
  };

  // Deep Import
  const handleDeepImport = async () => {
    if (!importUrl || !currentTenant?.id) return;

    setIsImporting(true);

    try {
      toast.info('🔍 Deep Scraping iniciado...', {
        description: 'Buscando equipamentos principais com fotos e especificações. Aguarde 1-2 minutos.',
        duration: 5000,
      });

      const { data, error } = await supabase.functions.invoke('import-product-catalog-deep', {
        body: {
          tenant_id: currentTenant.id,
          website_url: importUrl,
        },
      });

      if (error) throw error;

      toast.success('✅ Equipamentos importados!', {
        description: `${data.products_imported || 0} produtos com fotos e specs`,
        duration: 5000,
      });

      queryClient.invalidateQueries({ queryKey: ['tenant-products'] });
      setImportUrl('');
    } catch (err: any) {
      console.error('[CATALOG] Erro:', err);
      toast.error('Erro no deep import', { description: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  // CSV Upload
  const handleCSVUpload = async (file: File) => {
    // TODO: Implementar parser CSV
    toast.info('CSV Upload em desenvolvimento');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Catálogo de Produtos - Professional B2B
            </CardTitle>
            <CardDescription>
              {filteredAndSortedProducts.length} produto(s) no catálogo
              {selectedProducts.size > 0 && ` • ${selectedProducts.size} selecionado(s)`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkDelete} disabled={selectedProducts.size === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar ({selectedProducts.size})
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-muted/30 rounded-lg">
          <div className="md:col-span-2">
            <Label className="text-xs mb-2 flex items-center gap-1">
              <Search className="h-3 w-3" /> Buscar
            </Label>
            <Input
              placeholder="Nome, SKU, categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-xs mb-2 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Categoria
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-2 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Preço Min (USD)
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-xs mb-2 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Preço Máx (USD)
            </Label>
            <Input
              type="number"
              placeholder="10000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* IMPORT SECTION */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <Label className="flex items-center gap-2 mb-3 font-semibold">
            <Globe className="h-4 w-4 text-blue-600" />
            Importar Produtos (Múltiplas Opções)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                placeholder="https://metalifepilates.com.br/"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                disabled={isImporting}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDeepImport}
                disabled={!importUrl || isImporting}
                size="sm"
                className="flex-1"
              >
                {isImporting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Importando...</>
                ) : (
                  <><Target className="h-4 w-4 mr-2" />Deep Import</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                title="Em desenvolvimento"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                CSV/Excel
              </Button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[80px]">Foto</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Produto {getSortIcon('name')}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('category')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Categoria {getSortIcon('category')}
                  </button>
                </TableHead>
                <TableHead>HS Code</TableHead>
                <TableHead>Especificações</TableHead>
                <TableHead>
                  <button
                    onClick={() => toggleSort('price_usd')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Preços {getSortIcon('price_usd')}
                  </button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhum produto encontrado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use "Deep Import" para importar equipamentos principais
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => toggleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {product.main_image || product.image_url ? (
                        <img
                          src={product.main_image || product.image_url || ''}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-sm">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.hs_code ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {product.hs_code}
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        {product.weight_kg && (
                          <div className="flex items-center gap-1">
                            <Weight className="h-3 w-3 text-muted-foreground" />
                            {product.weight_kg} kg
                          </div>
                        )}
                        {product.dimensions_cm && (
                          <div className="flex items-center gap-1">
                            <Ruler className="h-3 w-3 text-muted-foreground" />
                            {product.dimensions_cm}
                          </div>
                        )}
                        {product.moq && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            MOQ: {product.moq}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        {product.price_usd && (
                          <div className="font-medium">USD {product.price_usd.toLocaleString()}</div>
                        )}
                        {product.price_brl && (
                          <div className="text-muted-foreground">
                            R$ {product.price_brl.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)} de{' '}
              {filteredAndSortedProducts.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

