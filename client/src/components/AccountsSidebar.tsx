import { useState, useEffect } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Loader2, Edit, Pin, Settings, GripVertical } from "lucide-react";
import { useAccountSettings } from "../hooks/useAccountSettings";
import { useToast } from "../hooks/use-toast";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { ColumnConfigModal } from "./ColumnConfigModal";
import {
  DndContext,
  closestCenter,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Account {
  id: string;
  type: string;
  attributes: {
    displayName: string;
    accountType: string;
    balance: {
      currencyCode: string;
      value: string;
      valueInBaseUnits: number;
    };
    createdAt: string;
  };
}

interface EnrichedAccount extends Account {
  displayOrder: number;
  isPinned: boolean;
  goalAmount: number | null;
  goalName: string | null;
  customGroup: string | null;
  isHidden: boolean;
  bankId: string | null;
  bankName: string;
  bankEmoji: string;
}

const ACCOUNT_TYPE_EMOJI: { [key: string]: string } = {
  'SAVER': '💰',
  'TRANSACTIONAL': '🏦',
  'default': '🏦'
};

const DEFAULT_GROUPS = ['Savers', 'Spending', 'Bills', 'Goals'];

// Droppable Container Component
function DroppableContainer({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className="min-h-[300px] flex-1 flex flex-col">
      {children}
    </div>
  );
}

// Draggable Account Component
function DraggableAccount({
  account,
  editMode,
  onPinToggle,
  onOpenSettings,
}: {
  account: EnrichedAccount;
  editMode: boolean;
  onPinToggle: (accountId: string, isPinned: boolean) => void;
  onOpenSettings: (accountId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const balance = account.attributes?.balance?.valueInBaseUnits || 0;
  const isPositive = balance >= 0;
  const hasGoal = account.goalAmount !== null && account.goalAmount > 0;
  const progress = hasGoal ? Math.min((balance / 100) / account.goalAmount! * 100, 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const getAccountEmoji = (accountType: string): string => {
    const ACCOUNT_TYPE_EMOJI: { [key: string]: string } = {
      'SAVER': '💰',
      'TRANSACTIONAL': '🏦',
      'default': '🏦'
    };
    return ACCOUNT_TYPE_EMOJI[accountType] || ACCOUNT_TYPE_EMOJI.default;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(editMode ? { ...attributes, ...listeners } : {})}
      className={`px-2 py-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors relative ${editMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Pin indicator */}
      {account.isPinned && (
        <div className="absolute top-0.5 right-0.5">
          <Pin className="w-3 h-3 text-blue-500 fill-blue-500" />
        </div>
      )}

      {/* Account name and balance inline */}
      <div className="flex items-center justify-between gap-1.5 mb-0.5">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {editMode && (
            <div className="pointer-events-none">
              <GripVertical className="w-3.5 h-3.5 text-gray-400" />
            </div>
          )}
          <span className="text-base">{getAccountEmoji(account.attributes.accountType)}</span>
          <span className="text-xs font-medium text-gray-900 truncate">
            {account.attributes.displayName}
          </span>
        </div>
        <div className={`text-xs font-semibold whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(balance)}
        </div>
      </div>

      {/* Progress bar for goals */}
      {hasGoal && (
        <div className="space-y-0.5">
          <Progress
            value={progress}
            className="h-1.5"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 truncate">
              {account.goalName || 'Goal'}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">
              {formatCurrency(account.goalAmount! * 100)}
            </span>
          </div>
        </div>
      )}

      {/* Empty progress bar for $0 balance savers without goal */}
      {balance === 0 && !hasGoal && account.attributes.accountType === 'SAVER' && (
        <div className="mt-0.5">
          <Progress value={0} className="h-1 opacity-30" />
        </div>
      )}

      {/* Edit mode actions */}
      {editMode && (
        <div className="flex gap-1 mt-1" onPointerDown={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-[10px] px-1 cursor-pointer"
            onClick={() => onPinToggle(account.id, account.isPinned)}
          >
            <Pin className="w-3 h-3 mr-0.5" />
            {account.isPinned ? 'Unpin' : 'Pin'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-[10px] px-1 cursor-pointer"
            onClick={() => onOpenSettings(account.id)}
          >
            <Settings className="w-3 h-3 mr-0.5" />
            Goal
          </Button>
        </div>
      )}
    </div>
  );
}

interface ColumnConfig {
  id: string;
  columnName: string;
  displayOrder: number;
  isDefault: boolean;
  bankId: string | null;
}

export function AccountsSidebar() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [columnConfigs, setColumnConfigs] = useState<ColumnConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [columnConfigBank, setColumnConfigBank] = useState<{ id: string | null; name: string; emoji: string } | null>(null);

  const { settings, updateAccountSettings, checkRemovedAccounts } = useAccountSettings();
  const { toast } = useToast();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchAccounts();
    fetchColumns();
  }, []);

  useEffect(() => {
    // Check for removed accounts when accounts are fetched
    if (accounts.length > 0) {
      const currentIds = accounts.map(acc => acc.id);
      checkRemovedAccounts(currentIds).then(removed => {
        if (removed.length > 0) {
          toast({
            title: "Accounts Removed",
            description: `${removed.length} account(s) no longer found in UP Bank`,
            variant: "destructive",
          });
        }
      });
    }
  }, [accounts]);

  const fetchAccounts = async () => {
    try {
      const accountsResponse = await fetch('/api/up-bank/accounts');
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        setAccounts(accountsData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchColumns = async () => {
    try {
      const response = await fetch('/api/column-configurations');
      if (response.ok) {
        const data = await response.json();
        setColumnConfigs(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch column configurations:', err);
    }
  };

  const getAccountEmoji = (accountType: string): string => {
    return ACCOUNT_TYPE_EMOJI[accountType] || ACCOUNT_TYPE_EMOJI.default;
  };

  // Get columns for a specific bank, or fallback to global defaults
  const getColumnsForBank = (bankId: string | null): string[] => {
    if (columnConfigs.length === 0) {
      // Fallback to hardcoded defaults if no configs loaded
      return ['Spending', 'Bills', 'Savers'];
    }

    // First, try to find columns specific to this bank
    const bankColumns = columnConfigs
      .filter(col => col.bankId === bankId)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(col => col.columnName);

    if (bankColumns.length > 0) {
      return bankColumns;
    }

    // If no bank-specific columns, use global defaults (bankId === null)
    const globalColumns = columnConfigs
      .filter(col => col.bankId === null)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(col => col.columnName);

    return globalColumns.length > 0 ? globalColumns : ['Spending', 'Bills', 'Savers'];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  // Enrich accounts with settings
  const enrichedAccounts: EnrichedAccount[] = accounts.map(acc => {
    const accountSetting = settings.find(s => s.upAccountId === acc.id);
    // @ts-ignore - bank info will be added by API
    const bankInfo = acc.bank || { id: null, name: 'UP Bank', emoji: '🟠' };
    return {
      ...acc,
      displayOrder: accountSetting?.displayOrder ?? 999,
      isPinned: accountSetting?.isPinned ?? false,
      goalAmount: accountSetting?.goalAmount ? parseFloat(accountSetting.goalAmount) : null,
      goalName: accountSetting?.goalName ?? null,
      customGroup: accountSetting?.customGroup ?? null,
      isHidden: accountSetting?.isHidden ?? false,
      bankId: bankInfo.id,
      bankName: bankInfo.name,
      bankEmoji: bankInfo.emoji,
    };
  }).filter(acc => !acc.isHidden);

  // Sort accounts: pinned first, then by balance > 0, then $0 balance
  const sortedAccounts = [...enrichedAccounts].sort((a, b) => {
    const balanceA = a.attributes.balance.valueInBaseUnits;
    const balanceB = b.attributes.balance.valueInBaseUnits;

    // Pinned accounts first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Then by display order
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }

    // Then accounts with balance > 0
    if (balanceA > 0 && balanceB === 0) return -1;
    if (balanceA === 0 && balanceB > 0) return 1;

    // Within same category, sort by balance descending
    return balanceB - balanceA;
  });

  // Group accounts by bank first
  const accountsByBank = sortedAccounts.reduce((acc, account) => {
    const bankKey = account.bankName || 'UP Bank';
    if (!acc[bankKey]) {
      acc[bankKey] = {
        name: bankKey,
        emoji: account.bankEmoji || '🟠',
        accounts: []
      };
    }
    acc[bankKey].accounts.push(account);
    return acc;
  }, {} as Record<string, { name: string; emoji: string; accounts: EnrichedAccount[] }>);

  // Then group by customGroup within each bank
  const bankGroupedAccounts = Object.entries(accountsByBank).reduce((acc, [bankKey, bankData]) => {
    // Get the bank ID from the first account in this bank
    const bankId = bankData.accounts[0]?.bankId || null;

    // Get columns for this specific bank (or global defaults)
    const bankColumns = getColumnsForBank(bankId);

    acc[bankKey] = {
      ...bankData,
      columns: bankColumns, // Store the columns for this bank
      groups: bankColumns.reduce((groups, group) => {
        groups[group] = bankData.accounts.filter(account => {
          if (account.customGroup) {
            return account.customGroup === group;
          }
          // Auto-assign based on account type
          if (group === 'Savers' && account.attributes.accountType === 'SAVER') return true;
          if (group === 'Spending' && account.attributes.accountType === 'TRANSACTIONAL') return true;
          return false;
        });
        return groups;
      }, {} as Record<string, EnrichedAccount[]>)
    };
    return acc;
  }, {} as Record<string, { name: string; emoji: string; accounts: EnrichedAccount[]; columns: string[]; groups: Record<string, EnrichedAccount[]> }>);

  // Legacy groupedAccounts for backward compatibility with Spending section
  const groupedAccounts = DEFAULT_GROUPS.reduce((acc, group) => {
    acc[group] = sortedAccounts.filter(account => {
      if (account.customGroup) {
        return account.customGroup === group;
      }
      // Auto-assign based on account type
      if (group === 'Savers' && account.attributes.accountType === 'SAVER') return true;
      if (group === 'Spending' && account.attributes.accountType === 'TRANSACTIONAL') return true;
      return false;
    });
    return acc;
  }, {} as Record<string, EnrichedAccount[]>);

  // Calculate totals
  const totalBalance = sortedAccounts.reduce((sum, acc) =>
    sum + (acc.attributes?.balance?.valueInBaseUnits || 0), 0
  );

  const groupTotals = Object.entries(groupedAccounts).reduce((acc, [group, accs]) => {
    acc[group] = accs.reduce((sum, account) =>
      sum + (account.attributes?.balance?.valueInBaseUnits || 0), 0
    );
    return acc;
  }, {} as Record<string, number>);

  const handlePinToggle = async (accountId: string, currentlyPinned: boolean) => {
    await updateAccountSettings(accountId, { isPinned: !currentlyPinned });
    fetchAccounts(); // Refresh to show updated order
  };

  const handleSaveSettings = async (
    accountId: string,
    settings: { goalAmount: number | null; goalName: string | null; customGroup: string | null; isHidden?: boolean }
  ) => {
    await updateAccountSettings(accountId, {
      goalAmount: settings.goalAmount?.toString() || null,
      goalName: settings.goalName,
      customGroup: settings.customGroup,
      isHidden: settings.isHidden,
    });
    fetchAccounts(); // Refresh to show updated goals
    setSelectedAccount(null);
  };

  const selectedAccountData = selectedAccount
    ? enrichedAccounts.find(acc => acc.id === selectedAccount)
    : null;

  // State to track active drag
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Handle drag start
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  // Handle drag over - allows visual feedback
  const handleDragOver = (event: DragOverEvent) => {
    // This allows the drag preview to follow the cursor smoothly
  };

  // Handle drag end - update account group
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    // Find the dragged account
    const draggedAccount = enrichedAccounts.find(acc => acc.id === active.id);
    if (!draggedAccount) return;

    // Get all valid column names from all banks
    const allColumnNames = new Set<string>();
    columnConfigs.forEach(config => allColumnNames.add(config.columnName));

    // Determine the new group based on the over container or item
    let newGroup: string | null = null;

    // Check if we're over a column container (any valid column name)
    if (typeof over.id === 'string' && allColumnNames.has(over.id)) {
      newGroup = over.id;
    } else {
      // We're over another account - find which group it belongs to
      const overAccount = enrichedAccounts.find(acc => acc.id === over.id);
      if (overAccount) {
        newGroup = overAccount.customGroup ||
          (overAccount.attributes.accountType === 'SAVER' ? 'Savers' :
           overAccount.attributes.accountType === 'TRANSACTIONAL' ? 'Spending' : 'Bills');
      }
    }

    const currentGroup = draggedAccount.customGroup ||
      (draggedAccount.attributes.accountType === 'SAVER' ? 'Savers' :
       draggedAccount.attributes.accountType === 'TRANSACTIONAL' ? 'Spending' : 'Bills');

    // Only update if group changed and newGroup is a valid column
    if (newGroup && currentGroup !== newGroup && allColumnNames.has(newGroup)) {
      await updateAccountSettings(draggedAccount.id, { customGroup: newGroup });
      fetchAccounts(); // Refresh to show updated grouping
      toast({
        title: "Account Moved",
        description: `${draggedAccount.attributes.displayName} moved to ${newGroup}`,
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Total Balance Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Accounts</CardTitle>
                <p className="text-xs text-gray-600 mt-1">{sortedAccounts.length} accounts</p>
              </div>
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit className="w-3 h-3 mr-1" />
                {editMode ? 'Done' : 'Edit'}
              </Button>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalBalance)}
            </div>
          </CardHeader>
        </Card>

        {/* Bank-Grouped Sections */}
        {Object.entries(bankGroupedAccounts).map(([bankKey, bankData]) => {
          // Spending accounts (full width at top)
          const spendingAccounts = bankData.groups['Spending'] || [];
          const spendingTotal = spendingAccounts.reduce(
            (sum, acc) => sum + (acc.attributes?.balance?.valueInBaseUnits || 0),
            0
          );

          // Other columns (Bills, Savers, custom columns - exclude Spending)
          const gridColumns = bankData.columns.filter(col => col !== 'Spending');
          const numColumns = gridColumns.length;

          return (
            <div key={bankKey} className="space-y-2">
              {/* Bank Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{bankData.emoji}</span>
                  <h3 className="text-sm font-semibold text-gray-700">{bankData.name}</h3>
                </div>
                {editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => {
                      // Get bankId from first account in this bank
                      const firstAccount = bankData.accounts[0];
                      setColumnConfigBank({
                        id: firstAccount?.bankId || null,
                        name: bankData.name,
                        emoji: bankData.emoji
                      });
                    }}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Spending Section - Full Width */}
              <Card className="bg-white border-gray-200 flex flex-col">
                <CardHeader className="pb-1 pt-2 px-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold text-gray-700">Spending</CardTitle>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatCurrency(spendingTotal)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 p-3 flex flex-col flex-1">
                  <DroppableContainer id="Spending">
                    <SortableContext
                      items={spendingAccounts.map(acc => acc.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex-1 space-y-1">
                        {spendingAccounts.length > 0 ? (
                          spendingAccounts.map((account) => (
                            <DraggableAccount
                              key={account.id}
                              account={account}
                              editMode={editMode}
                              onPinToggle={handlePinToggle}
                              onOpenSettings={setSelectedAccount}
                            />
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-xs">
                            {editMode ? 'Drag accounts here' : 'No spending accounts'}
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </DroppableContainer>
                </CardContent>
              </Card>

              {/* Other Columns Grid (Bills, Savers, Custom) */}
              {numColumns > 0 && (
                <div
                  className="grid gap-4 items-stretch"
                  style={{ gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))` }}
                >
                  {gridColumns.map((columnName) => {
                    const columnAccounts = bankData.groups[columnName] || [];
                    const columnTotal = columnAccounts.reduce(
                      (sum, acc) => sum + (acc.attributes?.balance?.valueInBaseUnits || 0),
                      0
                    );

                    return (
                      <Card key={columnName} className="bg-white border-gray-200 flex flex-col">
                        <CardHeader className="pb-1 pt-2 px-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xs font-semibold text-gray-700">
                              {columnName}
                            </CardTitle>
                            <span className="text-xs text-gray-500 font-medium">
                              {formatCurrency(columnTotal)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1 p-3 flex flex-col flex-1">
                          <DroppableContainer id={columnName}>
                            <SortableContext
                              items={columnAccounts.map(acc => acc.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="flex-1 space-y-1">
                                {columnAccounts.length > 0 ? (
                                  columnAccounts.map((account) => (
                                    <DraggableAccount
                                      key={account.id}
                                      account={account}
                                      editMode={editMode}
                                      onPinToggle={handlePinToggle}
                                      onOpenSettings={setSelectedAccount}
                                    />
                                  ))
                                ) : (
                                  <div className="text-center py-4 text-gray-400 text-xs">
                                    {editMode ? 'Drag accounts here' : `No ${columnName.toLowerCase()} accounts`}
                                  </div>
                                )}
                              </div>
                            </SortableContext>
                          </DroppableContainer>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {sortedAccounts.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-xs">
            No accounts found
          </div>
        )}
      </div>

      {/* Settings Modal - Outside DndContext */}
      <AccountSettingsModal
        accountId={selectedAccount}
        accountName={selectedAccountData?.attributes.displayName}
        bankName={selectedAccountData?.bankName}
        bankEmoji={selectedAccountData?.bankEmoji}
        currentGoalAmount={selectedAccountData?.goalAmount}
        currentGoalName={selectedAccountData?.goalName}
        currentCustomGroup={selectedAccountData?.customGroup}
        currentIsHidden={selectedAccountData?.isHidden}
        isOpen={selectedAccount !== null}
        onClose={() => setSelectedAccount(null)}
        onSave={handleSaveSettings}
      />

      {/* Column Configuration Modal */}
      <ColumnConfigModal
        bankId={columnConfigBank?.id || null}
        bankName={columnConfigBank?.name}
        bankEmoji={columnConfigBank?.emoji}
        isOpen={columnConfigBank !== null}
        onClose={() => setColumnConfigBank(null)}
        onSave={() => {
          // Refresh column configurations and accounts
          fetchColumns();
          fetchAccounts();
        }}
      />

      {/* Drag Overlay - Shows dragged item following cursor */}
      <DragOverlay>
        {activeId ? (
          <div className="px-2 py-1.5 bg-gray-50 rounded shadow-lg border-2 border-blue-500 cursor-grabbing">
            {(() => {
              const draggedAccount = enrichedAccounts.find(acc => acc.id === activeId);
              if (!draggedAccount) return null;

              const balance = draggedAccount.attributes?.balance?.valueInBaseUnits || 0;
              const isPositive = balance >= 0;

              return (
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-base">{getAccountEmoji(draggedAccount.attributes.accountType)}</span>
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {draggedAccount.attributes.displayName}
                    </span>
                  </div>
                  <div className={`text-xs font-semibold whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
