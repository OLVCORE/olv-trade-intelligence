import { ProductCatalogManagerPro } from '@/components/admin/ProductCatalogManagerPro';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function ProductCatalogPage() {
  // Build timestamp: 2025-11-11T20:30:00Z - ProductCatalogManagerPro COMPLETO
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Catálogo de Produtos PRO
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os produtos do seu catálogo. Importe do seu site ou adicione manualmente. Upload CSV/Excel disponível!
          </p>
        </div>
      </div>

      {/* CATALOG MANAGER PRO - COM UPLOAD CSV/EXCEL */}
      <ProductCatalogManagerPro />
    </div>
  );
}

