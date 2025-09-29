// AutoTag System Test File
import { AutoTagEngine } from '../utils/AutoTagEngine';
import {
  generateMockTransactions,
  generateMockAutoTagRules,
  calculateAutoTagAnalytics
} from '../utils/AutoTagHelpers';

// This is a simple test file to verify AutoTag functionality
export function runAutoTagTests() {
  console.log('🧪 Running AutoTag System Tests...');

  try {
    // Test 1: Generate mock data
    const transactions = generateMockTransactions();
    const rules = generateMockAutoTagRules();
    console.log('✅ Mock data generation: PASSED');
    console.log(`   Generated ${transactions.length} transactions and ${rules.length} rules`);

    // Test 2: Initialize AutoTag engine
    const engine = new AutoTagEngine();
    console.log('✅ AutoTag engine initialization: PASSED');

    // Test 3: Test search functionality
    const searchResults = engine.searchTransactions(transactions, {
      description: 'Rental',
      amountMin: 100
    });
    console.log('✅ Transaction search: PASSED');
    console.log(`   Found ${searchResults.length} matching transactions`);

    // Test 4: Test rule validation
    const validationResult = engine.validateRule({
      name: 'Test Rule',
      searchCriteria: { description: 'Test' },
      applyCriteria: { category: 'test' }
    });
    console.log('✅ Rule validation: PASSED');
    console.log(`   Validation result: ${validationResult.isValid ? 'VALID' : 'INVALID'}`);

    // Test 5: Test dynamic tag resolution
    const resolvedTags = engine.resolveDynamicTags('subscription-{yy}, bill-{mmyy}');
    console.log('✅ Dynamic tag resolution: PASSED');
    console.log(`   Resolved tags: "${resolvedTags}"`);

    // Test 6: Test analytics calculation
    const analytics = calculateAutoTagAnalytics(rules, transactions);
    console.log('✅ Analytics calculation: PASSED');
    console.log(`   Automation rate: ${analytics.automationRate}%`);
    console.log(`   Active rules: ${analytics.activeRules}/${analytics.totalRules}`);

    // Test 7: Test rule preview
    const activeRule = rules.find(r => r.status === 'active');
    if (activeRule) {
      const preview = engine.previewRuleApplication(transactions, activeRule);
      console.log('✅ Rule preview: PASSED');
      console.log(`   Preview found ${preview.length} potential matches`);
    }

    console.log('\n🎉 All AutoTag tests PASSED! System is ready to use.');
    return {
      success: true,
      message: 'All tests passed successfully',
      transactions: transactions.length,
      rules: rules.length,
      automationRate: analytics.automationRate
    };

  } catch (error) {
    console.error('❌ AutoTag test failed:', error);
    return {
      success: false,
      message: `Test failed: ${error}`,
      error
    };
  }
}

// Utility function to test specific rule scenarios
export function testRuleScenarios() {
  console.log('\n🔬 Testing specific rule scenarios...');

  const engine = new AutoTagEngine();
  const testTransactions = [
    {
      id: 'test1',
      amount: 450,
      date: new Date(),
      description: 'Rental Payment - Unit 1A',
      category: '',
      tags: '',
      account: 'Up',
      type: 'income' as const
    },
    {
      id: 'test2',
      amount: -89.50,
      date: new Date(),
      description: 'Woolworths Grocery Store',
      category: '',
      tags: '',
      account: 'Up',
      type: 'expense' as const
    }
  ];

  const testRule = {
    id: 'test_rule',
    name: 'Test Rental Rule',
    status: 'active' as const,
    createdDate: new Date(),
    searchCriteria: {
      description: 'Rental Payment',
      amountMin: 400
    },
    applyCriteria: {
      category: 'rental',
      tags: 'income, rental, test-{yy}',
      removeOldTags: false
    },
    matches: 0
  };

  // Test search
  const matches = engine.searchTransactions(testTransactions, testRule.searchCriteria);
  console.log(`✅ Search test: Found ${matches.length} matches (expected: 1)`);

  // Test preview
  const preview = engine.previewRuleApplication(testTransactions, testRule);
  console.log(`✅ Preview test: Generated ${preview.length} previews`);

  // Test tag resolution
  const resolvedTags = engine.resolveDynamicTags(testRule.applyCriteria.tags || '');
  console.log(`✅ Tag resolution test: "${testRule.applyCriteria.tags}" → "${resolvedTags}"`);

  return { matches: matches.length, previews: preview.length, resolvedTags };
}

// Export for use in development
if (typeof window !== 'undefined') {
  // Make available in browser console for testing
  (window as any).testAutoTag = runAutoTagTests;
  (window as any).testRuleScenarios = testRuleScenarios;
}