import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface BrutalHeaderProps {
  onMenuToggle?: () => void;
}

export function BrutalHeader({ onMenuToggle }: BrutalHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    console.log('Menu toggled');
    setIsMenuOpen(!isMenuOpen);
    onMenuToggle?.();
  };

  return (
    <header className="brutal-border brutal-shadow bg-white p-6 flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <h1 className="brutal-text text-4xl font-black">FINANCEFLOW</h1>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Button 
            variant="ghost" 
            className="brutal-text text-lg font-bold hover:bg-black hover:text-white"
            data-testid="button-dashboard"
          >
            DASHBOARD
          </Button>
          <Button 
            variant="ghost" 
            className="brutal-text text-lg font-bold hover:bg-black hover:text-white"
            data-testid="button-rent"
          >
            RENT
          </Button>
          <Button 
            variant="ghost" 
            className="brutal-text text-lg font-bold hover:bg-black hover:text-white"
            data-testid="button-bills"
          >
            BILLS
          </Button>
          <Button 
            variant="ghost" 
            className="brutal-text text-lg font-bold hover:bg-black hover:text-white"
            data-testid="button-data"
          >
            DATA
          </Button>
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden brutal-border brutal-shadow bg-white"
        onClick={handleMenuClick}
        data-testid="button-mobile-menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>
    </header>
  );
}