import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ColumnConfig {
  id: string;
  columnName: string;
  displayOrder: number;
  isDefault: boolean;
}

interface ColumnConfigModalProps {
  bankId: string | null;
  bankName?: string;
  bankEmoji?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ColumnConfigModal({
  bankId,
  bankName,
  bankEmoji,
  isOpen,
  onClose,
  onSave,
}: ColumnConfigModalProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && bankId) {
      fetchColumns();
    }
  }, [isOpen, bankId]);

  const fetchColumns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bankId) params.append('bankId', bankId);

      const response = await fetch(`/api/column-configurations?${params}`);
      const data = await response.json();

      if (data.success) {
        setColumns(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch columns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/column-configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId,
          columnName: newColumnName.trim(),
          displayOrder: columns.length,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewColumnName("");
        await fetchColumns();
      }
    } catch (error) {
      console.error('Failed to add column:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColumn = async (id: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/column-configurations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchColumns();
      } else {
        alert(data.error || 'Failed to delete column');
      }
    } catch (error) {
      console.error('Failed to delete column:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
          {bankName && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm">{bankEmoji}</span>
              <p className="text-xs text-gray-400">{bankName}</p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing Columns */}
          <div className="space-y-2">
            <Label>Current Columns</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {columns.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">
                    No custom columns yet. Add one below!
                  </p>
                ) : (
                  columns.map((column) => (
                    <div
                      key={column.id}
                      className="flex items-center justify-between p-2 border rounded-md bg-gray-50"
                    >
                      <span className="text-sm font-medium">
                        {column.columnName}
                        {column.isDefault && (
                          <span className="ml-2 text-xs text-gray-400">
                            (default)
                          </span>
                        )}
                      </span>
                      {!column.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteColumn(column.id)}
                          disabled={saving}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Add New Column */}
          <div className="space-y-2">
            <Label htmlFor="newColumn">Add New Column</Label>
            <div className="flex gap-2">
              <Input
                id="newColumn"
                type="text"
                placeholder="e.g., Mortgage, Car Loan"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddColumn();
                  }
                }}
                disabled={saving}
              />
              <Button
                onClick={handleAddColumn}
                disabled={!newColumnName.trim() || saving}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Create custom columns to organize your accounts
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
