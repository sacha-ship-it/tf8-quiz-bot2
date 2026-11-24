'use strict';

// TF8 - Season 1 - Quiz #4
// Theme: Review Your Trading
// Correct answers use letters A-D, matching the previous TF8 question file.
// Educational references:
// https://www.cmegroup.com/education/courses/trading-psychology/the-mathematics-of-trading-success
// https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-14

module.exports = [
  {
    question: 'Which information do you need to assess profitability beyond win rate?',
    choices: [
      'Only the number of winning trades',
      'Average win, average loss and trading costs',
      'Only the biggest winning trade',
      'Only the number of trading sessions'
    ],
    answer: 'B'
  },
  {
    question: 'A test has 40% winners at +2R and 60% losers at -1R. What is the average result per trade, before costs?',
    choices: [
      '-0.20R',
      '+0.40R',
      '+1.00R',
      '+0.20R'
    ],
    answer: 'D'
  },
  {
    question: 'You have six wins of $100 and four losses of $150. What is the total result before costs?',
    choices: [
      '$0',
      '+$200',
      '+$600',
      '-$150'
    ],
    answer: 'A'
  },
  {
    question: 'A trade followed your tested rules but lost. What should your review distinguish?',
    choices: [
      'Whether someone else made money on the same move',
      'Whether you could hide the loss from your journal',
      'Whether you followed the plan, separately from the financial outcome',
      'Whether changing the original record would improve your statistics'
    ],
    answer: 'C'
  },
  {
    question: 'A setup produces three wins in a row. What can you conclude from those trades alone?',
    choices: [
      'It will remain profitable in every market condition',
      'The sample is too small to establish reliable long-term performance',
      'The next trade cannot lose',
      'Trading costs no longer matter'
    ],
    answer: 'B'
  },
  {
    question: 'Account equity falls from a peak of $10,000 to $8,000. What is the drawdown from that peak?',
    choices: [
      '20%',
      '25%',
      '8%',
      '2%'
    ],
    answer: 'A'
  },
  {
    question: 'After falling from $10,000 to $8,000, what percentage gain is needed to return to $10,000?',
    choices: [
      '10%',
      '20%',
      '50%',
      '25%'
    ],
    answer: 'D'
  },
  {
    question: 'A stock stop-market sell order is triggered during a sharp price gap. Which statement is correct?',
    choices: [
      'It must execute at the exact stop price',
      'It automatically becomes a limit order',
      'The execution price can be lower than the stop price',
      'The order guarantees the planned maximum loss'
    ],
    answer: 'C'
  },
  {
    question: 'Which note gives you a specific behaviour to measure in your next trading review?',
    choices: [
      'I need to win every trade next week',
      'Record whether I completed my written entry checklist before each trade',
      'Ignore losing trades if the weekly result is positive',
      'Judge every decision only by whether it made money'
    ],
    answer: 'B'
  },
  {
    question: 'Price has bounced from a support level twice. What do those past bounces establish?',
    choices: [
      'The next bounce is guaranteed',
      'Price cannot trade below that level',
      'The level removes the risk of a long position',
      'Price previously reacted there, but the next outcome remains uncertain'
    ],
    answer: 'D'
  }
];
