import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2 } from "lucide-react";

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

const ACCOUNT_TYPE_EMOJI: { [key: string]: string } = {
  'SAVER': '💰',
  'TRANSACTIONAL': '🏦',
  'default': '🏦'
};

export function AccountsSidebar() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      // Fetch accounts from UP Bank directly
      const accountsResponse = await fetch('/api/up-bank/accounts');
      console.log('Accounts response status:', accountsResponse.status);

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        console.log('Accounts data:', accountsData);
        setAccounts(accountsData.data || []);
      } else {
        const errorText = await accountsResponse.text();
        console.error('Accounts fetch failed:', errorText);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAccountEmoji = (accountType: string): string => {
    return ACCOUNT_TYPE_EMOJI[accountType] || ACCOUNT_TYPE_EMOJI.default;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
    }).format(amount / 100); // Convert cents to dollars
  };

  const totalBalance = accounts.reduce((sum, acc) =>
    sum + (acc.attributes?.balance?.valueInBaseUnits || 0), 0
  );

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
    <div className="space-y-3">
      {/* Total Balance Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Total Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-gray-600 mt-1">{accounts.length} accounts</p>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts.map((account) => {
            const balance = account.attributes?.balance?.valueInBaseUnits || 0;
            const isPositive = balance >= 0;

            return (
              <div
                key={account.id}
                className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{getAccountEmoji(account.attributes.accountType)}</span>
                    <span className="text-xs font-medium text-gray-900 truncate">
                      {account.attributes.displayName}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-4"
                  >
                    {account.attributes.accountType.toLowerCase()}
                  </Badge>
                </div>
                <div className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance)}
                </div>
              </div>
            );
          })}

          {accounts.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-xs">
              No accounts found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}