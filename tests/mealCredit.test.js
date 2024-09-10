const { renderTransactions, formatDate, createTransactionHTML } = require('../src/js/mealCredit');

describe('Meal Credit Functions', () => {
  describe('formatDate', () => {
    test('formats date correctly', () => {
      expect(formatDate('2024-09-07')).toBe('Sep 7, 2024');
    });
  });

  describe('createTransactionHTML', () => {
    test('creates HTML for a positive transaction', () => {
      const transaction = {
        name: 'Test Dining Hall',
        date: '2024-09-07',
        amount: 60.00,
        type: 'Refund'
      };
      const html = createTransactionHTML(transaction);
      expect(html).toContain('Test Dining Hall');
      expect(html).toContain('Sep 7, 2024');
      expect(html).toContain('+R60.00');
      expect(html).toContain('Refund');
      expect(html).toContain('positive');
    });

    test('creates HTML for a negative transaction', () => {
      const transaction = {
        name: 'Test Dining Hall',
        date: '2024-09-07',
        amount: -55.00,
        type: 'Lunch'
      };
      const html = createTransactionHTML(transaction);
      expect(html).toContain('Test Dining Hall');
      expect(html).toContain('Sep 7, 2024');
      expect(html).toContain('R55.00');
      expect(html).toContain('Lunch');
      expect(html).not.toContain('positive');
    });
  });

  describe('renderTransactions', () => {
    test('renders the last 4 transactions', () => {
      const html = renderTransactions();
      const transactionCount = (html.match(/class="transaction"/g) || []).length;
      expect(transactionCount).toBe(4);
    });
  });
});