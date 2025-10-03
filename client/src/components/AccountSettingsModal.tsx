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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2 } from "lucide-react";

interface AccountSettingsModalProps {
  accountId: string | null;
  accountName?: string;
  bankName?: string;
  bankEmoji?: string;
  currentGoalAmount?: number | null;
  currentGoalName?: string | null;
  currentCustomGroup?: string | null;
  currentIsHidden?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountId: string, settings: {
    goalAmount: number | null;
    goalName: string | null;
    customGroup: string | null;
    isHidden?: boolean;
  }) => Promise<void>;
}

const GROUPS = ['Savers', 'Spending', 'Bills', 'Goals'];

export function AccountSettingsModal({
  accountId,
  accountName,
  bankName,
  bankEmoji,
  currentGoalAmount,
  currentGoalName,
  currentCustomGroup,
  currentIsHidden,
  isOpen,
  onClose,
  onSave,
}: AccountSettingsModalProps) {
  const [goalAmount, setGoalAmount] = useState<string>('');
  const [goalName, setGoalName] = useState<string>('');
  const [customGroup, setCustomGroup] = useState<string>('');
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && accountId) {
      setGoalAmount(currentGoalAmount?.toString() || '');
      setGoalName(currentGoalName || '');
      setCustomGroup(currentCustomGroup || '');
      setIsHidden(currentIsHidden || false);
    }
  }, [isOpen, accountId, currentGoalAmount, currentGoalName, currentCustomGroup, currentIsHidden]);

  const handleSave = async () => {
    if (!accountId) return;

    setSaving(true);
    try {
      const parsedAmount = goalAmount ? parseFloat(goalAmount) : null;
      await onSave(accountId, {
        goalAmount: parsedAmount,
        goalName: goalName || null,
        customGroup: customGroup || null,
        isHidden,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save account settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearGoal = async () => {
    if (!accountId) return;

    setSaving(true);
    try {
      await onSave(accountId, {
        goalAmount: null,
        goalName: null,
        customGroup: customGroup || null,
        isHidden,
      });
      setGoalAmount('');
      setGoalName('');
      onClose();
    } catch (error) {
      console.error('Failed to clear goal:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          {accountName && (
            <p className="text-sm text-gray-500">{accountName}</p>
          )}
          {bankName && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-sm">{bankEmoji}</span>
              <p className="text-xs text-gray-400">{bankName}</p>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Goal Amount */}
          <div className="space-y-2">
            <Label htmlFor="goalAmount">Savings Goal Amount ($)</Label>
            <Input
              id="goalAmount"
              type="number"
              step="0.01"
              placeholder="e.g., 10000"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Set a target amount for this account
            </p>
          </div>

          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="goalName">Goal Name (Optional)</Label>
            <Input
              id="goalName"
              type="text"
              placeholder="e.g., Emergency Fund, Holiday"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
            />
          </div>

          {/* Custom Group */}
          <div className="space-y-2">
            <Label htmlFor="customGroup">Category</Label>
            <Select value={customGroup} onValueChange={setCustomGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {GROUPS.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Organize accounts into custom groups
            </p>
          </div>

          {/* Hide Account */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isHidden"
              checked={isHidden}
              onChange={(e) => setIsHidden(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="isHidden" className="cursor-pointer">
              Hide this account from display
            </Label>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Hidden accounts won't appear in the accounts sidebar
          </p>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClearGoal}
            disabled={saving || (!currentGoalAmount && !currentGoalName)}
          >
            Clear Goal
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
