import { useState, useEffect, useRef } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Plus, X } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

interface Tag {
  id: string;
}

interface TagsMultiSelectProps {
  selectedTags: string[];
  availableTags: Tag[];
  maxTags?: number;
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export function TagsMultiSelect({
  selectedTags,
  availableTags,
  maxTags = 6,
  onChange,
  disabled
}: TagsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter tags to exclude parent category names
  // Parent categories are: good-life, personal, home, transport, income
  const parentCategories = ['good-life', 'personal', 'home', 'transport', 'income'];
  const filteredTags = availableTags.filter(tag => !parentCategories.includes(tag.id.toLowerCase()));

  // Apply search filter
  const searchedTags = searchTerm
    ? filteredTags.filter(tag => tag.id.toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredTags;

  // Auto-focus search input and reset index when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
      setSelectedIndex(-1);
    } else {
      setSearchTerm('');
    }
  }, [open]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  const handleToggleTag = async (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId].slice(0, maxTags);

    setSaving(true);
    try {
      await onChange(newTags);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNewTag = async () => {
    if (!newTag.trim() || selectedTags.length >= maxTags) return;

    const newTags = [...selectedTags, newTag.trim()];
    setSaving(true);
    try {
      await onChange(newTags);
      setNewTag('');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const newTags = selectedTags.filter(t => t !== tagId);
    setSaving(true);
    try {
      await onChange(newTags);
    } finally {
      setSaving(false);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchedTags.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchedTags.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchedTags.length) {
          // Toggle highlighted tag
          handleToggleTag(searchedTags[selectedIndex].id);
        } else if (searchedTags.length > 0 && selectedTags.length < maxTags) {
          // Toggle first result if nothing highlighted
          handleToggleTag(searchedTags[0].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {selectedTags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="h-5 px-1.5 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
        >
          {tag}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(tag);
            }}
            disabled={disabled || saving}
            className="ml-1 hover:text-blue-900"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}

      {selectedTags.length < maxTags && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              disabled={disabled || saving}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-2">
              <div className="text-xs font-semibold flex items-center justify-between">
                <span>Select Tags ({selectedTags.length}/{maxTags})</span>
                {selectedTags.length >= maxTags && (
                  <span className="text-red-500">Max reached</span>
                )}
              </div>

              {/* Search tags */}
              <div className="pb-1 border-b">
                <Input
                  ref={searchInputRef}
                  placeholder="🔍 Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-7 text-xs"
                />
              </div>

              {/* Create new tag */}
              <div className="flex gap-1">
                <Input
                  placeholder="New tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewTag();
                    }
                  }}
                  className="h-7 text-xs"
                  disabled={selectedTags.length >= maxTags}
                />
                <Button
                  size="sm"
                  onClick={handleAddNewTag}
                  disabled={!newTag.trim() || selectedTags.length >= maxTags}
                  className="h-7 px-2"
                >
                  Add
                </Button>
              </div>

              {/* Existing tags */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {searchedTags.length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    {searchTerm ? 'No tags found' : 'No tags available'}
                  </div>
                )}
                {searchedTags.map((tag, index) => {
                  const isKeyboardSelected = index === selectedIndex;
                  const isChecked = selectedTags.includes(tag.id);
                  const isDisabled = !isChecked && selectedTags.length >= maxTags;

                  return (
                    <div
                      key={tag.id}
                      className={`flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer ${
                        isKeyboardSelected ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => !isDisabled && handleToggleTag(tag.id)}
                    >
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={isChecked}
                        onCheckedChange={() => handleToggleTag(tag.id)}
                        disabled={isDisabled}
                      />
                      <label
                        htmlFor={`tag-${tag.id}`}
                        className="text-xs flex-1 cursor-pointer"
                      >
                        {tag.id}
                      </label>
                    </div>
                  );
                })}
              </div>

              {saving && (
                <div className="text-xs text-gray-500 text-center">Saving...</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}