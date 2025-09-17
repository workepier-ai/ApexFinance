import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Eye } from "lucide-react";

interface FinancialCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  trend?: string;
  status?: 'positive' | 'negative' | 'neutral';
  onClick?: () => void;
  actionText?: string;
}

export function FinancialCard({ 
  title, 
  amount, 
  subtitle, 
  trend, 
  status = 'neutral',
  onClick,
  actionText = 'View Details'
}: FinancialCardProps) {
  const getTrendIcon = () => {
    switch (status) {
      case 'positive': return <ArrowUpRight className="w-4 h-4" />;
      case 'negative': return <ArrowDownRight className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (status) {
      case 'positive': return 'trend-positive';
      case 'negative': return 'trend-negative';
      default: return 'trend-neutral';
    }
  };

  const handleClick = () => {
    console.log(`${title} card clicked`);
    onClick?.();
  };

  return (
    <Card className="data-block group hover-elevate">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h3 className="modern-text text-sm font-medium text-muted-foreground uppercase tracking-wide" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </h3>
          <div className="metric-large" data-testid={`amount-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {amount}
          </div>
        </div>
        <div className="p-2 bg-primary/10 rounded-xl">
          {getTrendIcon()}
        </div>
      </div>
      
      {subtitle && (
        <div className="text-sm text-muted-foreground mb-3 modern-text" data-testid={`subtitle-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {subtitle}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        {trend && (
          <div className={`flex items-center space-x-2 ${getTrendColor()}`} data-testid={`trend-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
        <Button 
          variant="ghost"
          size="sm"
          className="opacity-60 group-hover:opacity-100 transition-opacity rounded-full"
          onClick={handleClick}
          data-testid={`button-${title.toLowerCase().replace(/\s+/g, '-')}-action`}
        >
          <Eye className="w-4 h-4 mr-2" />
          {actionText}
        </Button>
      </div>
    </Card>
  );
}