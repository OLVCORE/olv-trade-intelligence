import { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function CollapsibleCard({ 
  title, 
  icon: Icon, 
  children, 
  defaultExpanded = false,
  className = ''
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={`glass-card ${className}`}>
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-primary" />}
            <span>{title}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

