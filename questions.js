'use strict';

module.exports = [
  {
    question: 'Before entering a trade, what should you define first?',
    options: [
      'How much you are willing to lose',
      'How quickly you want to double your account',
      'How much the last trader made'
    ],
    correctIndex: 0,
    explanation:
      'Your maximum planned loss helps you choose a position size that fits your risk limit.'
  },
  {
    question:
      'You have a $10,000 account and choose to risk 1% on a trade. What is your planned risk?',
    options: [
      '$10',
      '$100',
      '$1,000'
    ],
    correctIndex: 1,
    explanation:
      '1% of $10,000 is $100. Actual losses can differ because of slippage and execution costs.'
  },
  {
    question:
      'You widen your stop distance but want to keep the same planned dollar risk. What should you do?',
    options: [
      'Increase your position size',
      'Keep your position size unchanged',
      'Reduce your position size'
    ],
    correctIndex: 2,
    explanation:
      'A wider stop requires a smaller position to maintain the same planned risk.'
  },
  {
    question:
      'After three losing trades, what is the most disciplined response?',
    options: [
      'Double your next position to recover',
      'Follow your loss limits and review your decisions',
      'Take any available setup'
    ],
    correctIndex: 1,
    explanation:
      'A losing streak does not justify changing your rules or increasing your risk.'
  },
  {
    question: 'What is revenge trading?',
    options: [
      'Taking impulsive trades to recover a loss',
      'Reviewing a losing trade',
      'Closing a position at your planned stop'
    ],
    correctIndex: 0,
    explanation:
      'Revenge trading puts the need to recover ahead of the quality of the next decision.'
  },
  {
    question:
      'You open several positions that tend to move together. What should you watch?',
    options: [
      'Only the risk of the smallest position',
      'Only the number of positions',
      'Your combined exposure'
    ],
    correctIndex: 2,
    explanation:
      'Correlated positions can lose together, concentrating your risk.'
  },
  {
    question: 'What is the purpose of a daily loss limit?',
    options: [
      'Guarantee a profitable week',
      'Limit further losses during a difficult session',
      'Remove the need for individual trade stops'
    ],
    correctIndex: 1,
    explanation:
      'A daily loss limit creates a stopping point before losses keep accumulating.'
  },
  {
    question:
      'You risk $100 to target a $200 profit. What is the planned reward-to-risk ratio?',
    options: [
      '2:1',
      '1:2',
      '1:1'
    ],
    correctIndex: 0,
    explanation:
      'The planned reward is twice the planned risk. This ratio alone does not guarantee a profitable strategy.'
  },
  {
    question:
      'Your account falls from $10,000 to $9,000. What percentage gain would bring it back to $10,000?',
    options: [
      '10%',
      'About 11.1%',
      '20%'
    ],
    correctIndex: 1,
    explanation:
      'You need to gain $1,000 on the remaining $9,000, which is approximately 11.1%.'
  },
  {
    question:
      'Which statement best describes good risk management?',
    options: [
      'It prevents every losing trade',
      'It means winning more trades than you lose',
      'It limits exposure so individual losses remain manageable'
    ],
    correctIndex: 2,
    explanation:
      'Risk management helps protect your capital while allowing for the possibility of losing trades.'
  }
];
