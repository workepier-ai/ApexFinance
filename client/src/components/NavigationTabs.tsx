import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  Zap,
  Tags,
  Settings
} from "lucide-react";

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Dashboard overview and key metrics'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
      description: 'Transaction history and management'
    },
    {
      id: 'bills',
      label: 'Bills',
      icon: FileText,
      description: 'Bill management and tracking'
    },
    {
      id: 'bills-advanced',
      label: 'Bills Advanced',
      icon: FileText,
      description: 'Advanced bill management with automation'
    },
    {
      id: 'mortgage',
      label: 'Mortgage',
      icon: Home,
      description: 'Mortgage details and payment history'
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: Zap,
      description: 'Recurring subscription management'
    },
    {
      id: 'auto-tag',
      label: 'Auto-tag',
      icon: Tags,
      description: 'Automatic transaction categorization'
    },
    {
      id: 'property',
      label: 'Property',
      icon: Home,
      description: 'Property management dashboard'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'API configuration and system settings'
    }
  ];

  return (
    <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-sm">
      <div className="flex flex-wrap gap-1 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-2 transition-all duration-200
                ${isActive
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
}