import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WebsiteBadgeProps {
  websiteUrl?: string | null;
  domain?: string | null;
  companyName?: string | null;
  maxWidth?: string; // Default: "140px"
  showEditButton?: boolean;
  onEdit?: () => void;
}

/**
 * Componente UNIFICADO para exibir website como Badge
 * Usado em: ApprovedLeads, ICPQuarantine, CompaniesManagementPage
 */
export function WebsiteBadge({
  websiteUrl,
  domain,
  companyName = '',
  maxWidth = '140px',
  showEditButton = false,
  onEdit
}: WebsiteBadgeProps) {
  // Sanitizar domínio da URL
  const sanitizeDomain = (value?: string | null): string | null => {
    if (!value) return null;
    const v = String(value).trim();
    if (!v || /\s/.test(v)) return null;
    try {
      const url = v.startsWith('http') ? new URL(v) : new URL(`https://${v}`);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return v.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  };

  const finalDomain = domain || sanitizeDomain(websiteUrl);
  const finalWebsiteUrl = websiteUrl || (finalDomain ? `https://${finalDomain}` : null);

  // Extrair nome da empresa para exibir no badge (ex: "Merrithew®" de "Pilates Machine, Equipment & Training Leader | Merrithew®")
  const extractCompanyBrand = (name: string): string => {
    const pipeMatch = name.match(/\|\s*([^|]+?)(?:\s*\|)?$/);
    if (pipeMatch && pipeMatch[1].trim().length < 30) {
      return pipeMatch[1].trim();
    }
    const parts = name.split(/\s+[-|]\s+/);
    return parts.length > 1 && parts[parts.length - 1].length < 30 
      ? parts[parts.length - 1].trim() 
      : name.split(' ')[0];
  };

  // Determinar texto do badge baseado no domínio
  const getBadgeText = (): string => {
    if (!finalDomain) return '';
    
    // Facebook: mostrar "Facebook - [página]"
    if (finalDomain.includes('facebook.com')) {
      const path = finalWebsiteUrl?.match(/facebook\.com\/([^/?]+)/)?.[1];
      return path ? `Facebook - ${path}` : 'Facebook';
    }
    
    // LinkedIn: mostrar "LinkedIn - [empresa]" ou nome da marca
    if (finalDomain.includes('linkedin.com')) {
      return companyName ? extractCompanyBrand(companyName) : 'LinkedIn';
    }
    
    // eBay: mostrar "eBay"
    if (finalDomain.includes('ebay.')) {
      return 'eBay';
    }
    
    // Outros: mostrar apenas domínio (sem www)
    return finalDomain.replace(/^www\./, '');
  };

  if (!finalDomain) {
    return (
      <span className="text-xs text-muted-foreground">N/A</span>
    );
  }

  const maxWidthClass = showEditButton ? `max-w-[${maxWidth}]` : '';
  
  return (
    <div className={`flex items-center gap-2 ${maxWidthClass}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-primary/20 transition-colors truncate text-[10px] px-2 py-1"
              style={{ maxWidth }}
              asChild
            >
              <a
                href={finalWebsiteUrl?.startsWith('http') ? finalWebsiteUrl : `https://${finalDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {getBadgeText()}
              </a>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs font-mono break-all">{finalWebsiteUrl || `https://${finalDomain}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
