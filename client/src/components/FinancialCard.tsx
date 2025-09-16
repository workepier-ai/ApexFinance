import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  actionText = 'ACTION'
}: FinancialCardProps) {
  const statusColor = {
    positive: 'status-paid',
    negative: 'status-late', 
    neutral: 'bg-gray-200 text-black'
  }[status];

  const handleClick = () => {
    console.log(`${title} card clicked`);
    onClick?.();
  };

  return (
    <Card className="brutal-border brutal-shadow bg-white p-6 min-h-[200px] flex flex-col justify-between">
      <div>
        <h3 className="brutal-text text-lg mb-4" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {title}
        </h3>
        <div className="brutal-mono text-3xl font-black mb-2" data-testid={`amount-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {amount}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-600 mb-2" data-testid={`subtitle-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {subtitle}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        {trend && (
          <div className={`px-3 py-1 ${statusColor} brutal-text text-sm`} data-testid={`trend-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {trend}
          </div>
        )}
        <Button 
          variant="default"
          className="brutal-border brutal-shadow bg-black text-white hover:bg-white hover:text-black brutal-button ml-auto"
          onClick={handleClick}
          data-testid={`button-${title.toLowerCase().replace(/\s+/g, '-')}-action`}
        >
          {actionText}
        </Button>
      </div>
    </Card>
  );
}