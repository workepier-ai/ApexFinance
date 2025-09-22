import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Search,
  Users,
  CreditCard,
  Home,
  Plus,
  Calculator,
  FileText,
  Zap,
  Settings
} from "lucide-react";

interface QuickActionsProps {
  tenants?: Array<{
    id: string;
    bedNumber: string;
    status: string;
    amount: number;
  }>;
  className?: string;
}

export function QuickActions({ tenants = [], className = "" }: QuickActionsProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const quickActionItems = [
    {
      icon: Users,
      label: "Search Tenant",
      category: "Tenants",
      action: () => console.log("Search tenant"),
      shortcut: "⌘T"
    },
    {
      icon: CreditCard,
      label: "Record Payment",
      category: "Payments",
      action: () => console.log("Record payment"),
      shortcut: "⌘P"
    },
    {
      icon: Plus,
      label: "Add New Bill",
      category: "Bills",
      action: () => console.log("Add bill"),
      shortcut: "⌘B"
    },
    {
      icon: Calculator,
      label: "Mortgage Calculator",
      category: "Mortgage",
      action: () => console.log("Open calculator"),
      shortcut: "⌘M"
    },
    {
      icon: FileText,
      label: "Generate Report",
      category: "Reports",
      action: () => console.log("Generate report"),
      shortcut: "⌘R"
    },
    {
      icon: Home,
      label: "Property Overview",
      category: "Properties",
      action: () => console.log("Property overview"),
      shortcut: "⌘O"
    }
  ];

  const filteredTenants = tenants.filter(tenant =>
    tenant.bedNumber.toLowerCase().includes(searchValue.toLowerCase())
  );

  const filteredActions = quickActionItems.filter(item =>
    item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.category.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      <Card className={`modern-card p-4 ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h3>
            <Zap className="w-4 h-4 text-primary" />
          </div>

          <Button
            variant="outline"
            className="w-full justify-start text-left hover-elevate"
            onClick={() => setOpen(true)}
          >
            <Search className="w-4 h-4 mr-2" />
            Search tenants, actions...
            <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            {quickActionItems.slice(0, 4).map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className="h-auto p-3 flex flex-col items-center space-y-1 hover-elevate"
                onClick={item.action}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-xs text-center">{item.label}</span>
              </Button>
            ))}
          </div>

          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              More actions...
            </Button>
          </div>
        </div>
      </Card>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search tenants, bills, actions..."
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {filteredTenants.length > 0 && (
            <CommandGroup heading="Tenants">
              {filteredTenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  onSelect={() => {
                    console.log(`Selected tenant: ${tenant.bedNumber}`);
                    setOpen(false);
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  <div className="flex-1">
                    <div className="font-medium">{tenant.bedNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      ${tenant.amount.toLocaleString()} • {tenant.status}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredTenants.length > 0 && filteredActions.length > 0 && (
            <CommandSeparator />
          )}

          {filteredActions.length > 0 && (
            <CommandGroup heading="Quick Actions">
              {filteredActions.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() => {
                    item.action();
                    setOpen(false);
                  }}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground">{item.category}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.shortcut}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}