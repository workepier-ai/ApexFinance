import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, BarChart3, TrendingUp } from "lucide-react";

interface ModernHeaderProps {
  onMenuToggle?: () => void;
}

export function BrutalHeader({ onMenuToggle }: ModernHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    console.log('Menu toggled');
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.();
  };

  return (
    <header className="modern-card bg-card border-b border-border/50 p-6 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">FinanceFlow</h1>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-2">
          <Button 
            variant="ghost" 
            className="modern-text text-foreground rounded-full px-6 py-2 hover-elevate"
            data-testid="button-dashboard"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className="modern-text text-foreground rounded-full px-6 py-2 hover-elevate"
            data-testid="button-rent"
          >
            Rent
          </Button>
          <Button 
            variant="ghost" 
            className="modern-text text-foreground rounded-full px-6 py-2 hover-elevate"
            data-testid="button-bills"
          >
            Bills
          </Button>
          <Button 
            variant="ghost" 
            className="modern-text text-foreground rounded-full px-6 py-2 hover-elevate"
            data-testid="button-data"
          >
            Analytics
          </Button>
        </nav>
      </div>

      {/* Status Indicator */}
      <div className="hidden lg:flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-sm text-muted-foreground modern-mono">Live</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-foreground">$14,234.67</div>
          <div className="text-xs text-success modern-text">+2.3% today</div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden rounded-full hover-elevate"
        onClick={handleMenuClick}
        data-testid="button-mobile-menu"
      >
        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>
    </header>
  );
}