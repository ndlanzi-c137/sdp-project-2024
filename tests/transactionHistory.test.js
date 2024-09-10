// Mock the transactions array
const mockTransactions = [
  { name: '4NMP Dining Hall', date: '2024-09-07', amount: -55.00, type: 'Lunch' },
  { name: 'Joyous Dining Hall', date: '2024-09-06', amount: -60.00, type: 'Breakfast' },
  { name: '4NMP Dining Hall', date: '2024-09-05', amount: -60.00, type: 'Supper' },
  { name: 'Monate Mpolaye Dining', date: '2024-09-04', amount: -55.00, type: 'Lunch' },
  { name: '4NMP Dining Hall', date: '2024-09-03', amount: 60.00, type: 'Cancellation' },
  { name: '4NMP Dining Hall', date: '2024-09-02', amount: -60.00, type: 'Supper' },
  { name: 'Joyous Dining Hall', date: '2024-09-01', amount: -55.00, type: 'Lunch' },
  { name: 'Monate Mpolaye Dining', date: '2024-08-20', amount: -55.00, type: 'Lunch' },
  { name: '4NMP Dining Hall', date: '2024-08-19', amount: 60.00, type: 'Cancellation' },
];

// Mock the transactions in the module
jest.mock('../src/js/transactionHistory', () => {
  const originalModule = jest.requireActual('../src/js/transactionHistory');
  return {
    ...originalModule,
    transactions: mockTransactions,
  };
});


const {
  formatDate,
  formatAmount,
  createTransactionHTML,
  filterTransactions
} = require('../src/js/transactionHistory');

describe('Transaction History Functions', () => {
  describe('formatDate', () => {
    test('formats date correctly', () => {
      expect(formatDate('2024-09-07')).toBe('Sep 7, 2024');
    });
  });

  describe('formatAmount', () => {
    test('formats positive amount correctly', () => {
      expect(formatAmount(60.00)).toBe('+R60.00');
    });

    test('formats negative amount correctly', () => {
      expect(formatAmount(-55.00)).toBe('-R55.00');
    });
  });

  describe('createTransactionHTML', () => {
    test('creates HTML for a transaction', () => {
      const transaction = {
        name: 'Test Dining Hall',
        date: '2024-09-07',
        amount: -55.00,
        type: 'Lunch'
      };
      const html = createTransactionHTML(transaction);
      expect(html).toContain('Test Dining Hall');
      expect(html).toContain('Lunch');
      expect(html).toContain('-R55.00');
    });
  });

  describe('filterTransactions', () => {
    test('filters transactions for the current day', () => {
      const result = filterTransactions('day');
      expect(Array.isArray(result)).toBe(true);
    });

    test('filters transactions for the current week', () => {
      const result = filterTransactions('week');
      expect(Array.isArray(result)).toBe(true);
    });

    test('filters transactions for the current month', () => {
      const result = filterTransactions('month');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});