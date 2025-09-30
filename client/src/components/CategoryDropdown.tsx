import { useState, useMemo, useEffect, useRef } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Input } from "./ui/input";
import { Check } from "lucide-react";

interface Category {
  id: string;
  attributes: {
    name: string;
  };
  relationships?: {
    parent?: {
      data: {
        id: string;
      } | null;
    };
    children?: {
      data: Array<{ id: string }>;
    };
  };
}

interface CategoryDropdownProps {
  value: string;
  categories: Category[];
  onChange: (categoryId: string) => void;
  disabled?: boolean;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  'good-life': 'bg-purple-100 text-purple-700 border-purple-200',
  'transport': 'bg-blue-100 text-blue-700 border-blue-200',
  'groceries': 'bg-green-100 text-green-700 border-green-200',
  'takeaway': 'bg-orange-100 text-orange-700 border-orange-200',
  'personal': 'bg-pink-100 text-pink-700 border-pink-200',
  'home': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'income': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'uncategorized': 'bg-gray-100 text-gray-700 border-gray-200',
};

export function CategoryDropdown({ value, categories, onChange, disabled }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (newValue: string) => {
    setSaving(true);
    setOpen(false);
    setSearchTerm(''); // Clear search on selection
    try {
      await onChange(newValue);
    } finally {
      setSaving(false);
    }
  };

  // Auto-focus input and reset index when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setSelectedIndex(-1);
    } else {
      setSearchTerm(''); // Clear search when closing
    }
  }, [open]);

  // Organize categories hierarchically
  const { parentCategories, childCategories } = useMemo(() => {
    const parents: Category[] = [];
    const children: Category[] = [];

    categories.forEach(cat => {
      if (cat.relationships?.parent?.data === null) {
        parents.push(cat);
      } else {
        children.push(cat);
      }
    });

    return { parentCategories: parents, childCategories: children };
  }, [categories]);

  // Filter categories based on search term
  const filteredChildren = useMemo(() => {
    if (!searchTerm) return childCategories;
    return childCategories.filter(cat =>
      cat.attributes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [childCategories, searchTerm]);

  // Group children by parent
  const groupedCategories = useMemo(() => {
    const groups: { [parentId: string]: Category[] } = {};

    parentCategories.forEach(parent => {
      groups[parent.id] = filteredChildren.filter(child =>
        child.relationships?.parent?.data?.id === parent.id
      );
    });

    return groups;
  }, [parentCategories, filteredChildren]);

  // Check if uncategorized should be shown
  const showUncategorized = !searchTerm || 'uncategorized'.includes(searchTerm.toLowerCase());

  // Flatten results for keyboard navigation
  const flattenedResults = useMemo(() => {
    const results: Array<{ id: string; name: string }> = [];

    if (showUncategorized) {
      results.push({ id: 'uncategorized', name: 'Uncategorized' });
    }

    filteredChildren.forEach(child => {
      results.push({ id: child.id, name: child.attributes.name });
    });

    return results;
  }, [filteredChildren, showUncategorized]);

  const currentCategory = categories.find(c => c.id === value);
  const displayName = currentCategory?.attributes.name || value || 'uncategorized';

  // Get parent category for color mapping
  const categoryKey = value?.split('/')[0] || 'uncategorized';
  const colorClass = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS['uncategorized'];

  const getBgColor = (catId: string) => {
    const catKey = catId.split('/')[0];
    const color = CATEGORY_COLORS[catKey] || CATEGORY_COLORS['uncategorized'];
    const bgColor = color.match(/bg-(\w+)-/)?.[1] || 'gray';
    return bgColor;
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flattenedResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flattenedResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
          // Select highlighted item
          handleChange(flattenedResults[selectedIndex].id);
        } else if (flattenedResults.length > 0) {
          // Select first result if nothing highlighted
          handleChange(flattenedResults[0].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="h-7 w-[140px] p-0 hover:bg-transparent"
          disabled={disabled || saving}
        >
          <Badge className={`${colorClass} text-xs font-normal hover:${colorClass}`}>
            {saving ? 'Saving...' : displayName}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            placeholder="🔍 Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {/* Uncategorized */}
          {showUncategorized && (
            <div
              onClick={() => handleChange('uncategorized')}
              className={`flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                selectedIndex === 0 ? 'bg-blue-100' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span className="text-xs">Uncategorized</span>
              </div>
              {value === 'uncategorized' && <Check className="w-3 h-3" />}
            </div>
          )}

          {/* Grouped categories by parent */}
          {parentCategories.map(parent => {
            const children = groupedCategories[parent.id] || [];
            if (children.length === 0 && searchTerm) return null;

            const bgColor = getBgColor(parent.id);

            return (
              <div key={parent.id} className="border-t">
                <div className="px-3 py-1.5 bg-gray-50 text-xs font-semibold text-gray-600 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full bg-${bgColor}-400`}></span>
                  {parent.attributes.name}
                </div>
                {children.map(child => {
                  const childBgColor = getBgColor(child.id);
                  // Find index in flattened results for keyboard highlight
                  const flatIndex = flattenedResults.findIndex(r => r.id === child.id);
                  const isKeyboardSelected = flatIndex === selectedIndex;

                  return (
                    <div
                      key={child.id}
                      onClick={() => handleChange(child.id)}
                      className={`flex items-center justify-between px-3 py-2 pl-6 hover:bg-gray-100 cursor-pointer ${
                        isKeyboardSelected ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-${childBgColor}-400`}></span>
                        <span className="text-xs">{child.attributes.name}</span>
                      </div>
                      {value === child.id && <Check className="w-3 h-3 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filteredChildren.length === 0 && searchTerm && (
            <div className="text-center py-4 text-xs text-gray-500">
              No categories found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}