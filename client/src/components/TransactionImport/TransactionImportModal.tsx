import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CSVUploadTab } from './CSVUploadTab';
import { ManualEntryGrid } from './ManualEntryGrid';

interface TransactionImportModalProps {
  open: boolean;
  onClose: () => void;
  banks: any[];
  onImportSuccess: () => void;
}

export function TransactionImportModal({
  open,
  onClose,
  banks,
  onImportSuccess
}: TransactionImportModalProps) {
  const [activeTab, setActiveTab] = useState('csv');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Transactions</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">📤 Upload CSV</TabsTrigger>
            <TabsTrigger value="manual">✏️ Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="flex-1 overflow-auto mt-4">
            <CSVUploadTab
              banks={banks}
              onImportSuccess={() => {
                onImportSuccess();
                onClose();
              }}
            />
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-auto mt-4">
            <ManualEntryGrid
              banks={banks}
              onImportSuccess={() => {
                onImportSuccess();
                onClose();
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
