import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealerPerformanceDashboard } from '@/components/dealer/DealerPerformanceDashboard';
import { DealerOrderManager } from '@/components/dealer/DealerOrderManager';
import { MarketingMaterialsLibrary } from '@/components/dealer/MarketingMaterialsLibrary';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Image, 
  BarChart,
  Building2
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

export default function DealerPortalPage() {
  const { currentTenant } = useTenant();

  // TODO: Na prática, pegar dealer_id do auth.uid() ou session
  // Por enquanto, simular um dealer logado
  const currentDealerId = 'placeholder-dealer-id';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Dealer Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Self-service para dealers - Pedidos, Performance, Catálogo
          </p>
        </div>

        {/* Logo do Tenant */}
        {currentTenant?.logo_url && (
          <img src={currentTenant.logo_url} alt={currentTenant.name} className="h-12" />
        )}
      </div>

      {/* TABS */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <Package className="h-4 w-4" />
            Catálogo
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2">
            <Image className="h-4 w-4" />
            Marketing
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* TAB: Dashboard */}
        <TabsContent value="dashboard" className="mt-6">
          <DealerPerformanceDashboard dealerId={currentDealerId} />
        </TabsContent>

        {/* TAB: Pedidos */}
        <TabsContent value="orders" className="mt-6">
          <DealerOrderManager dealerId={currentDealerId} />
        </TabsContent>

        {/* TAB: Catálogo */}
        <TabsContent value="catalog" className="mt-6">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Catálogo de produtos disponível em breve
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Marketing */}
        <TabsContent value="marketing" className="mt-6">
          <MarketingMaterialsLibrary dealerId={currentDealerId} />
        </TabsContent>

        {/* TAB: Relatórios */}
        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Relatórios de performance disponíveis em breve
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

