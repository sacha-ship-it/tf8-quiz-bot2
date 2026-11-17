'use strict';

module.exports = [
  {
    question: 'What does one candle represent on a 15-minute chart?',
    choices: [
      'The last 15 trades',
      'One 15-minute period',
      'The first 15 price changes',
      'The average price over 15 minutes'
    ],
    answer: 'B'
  },
  {
    question: 'A candle opens at 100 and closes at 104. How large is its body?',
    choices: [
      '2 points',
      '8 points',
      'You need the high and low to calculate it',
      '4 points'
    ],
    answer: 'D'
  },
  {
    question: 'A candle opens at 105 and closes at 101. What does that tell you?',
    choices: [
      'Price closed below where it opened',
      'Price stayed below 105 for the entire candle',
      'The next candle will close lower',
      'The low was exactly 101'
    ],
    answer: 'A'
  },
  {
    question: 'A candle opens at 100, closes at 104 and reaches a high of 107. How long is its upper wick?',
    choices: [
      '7 points',
      '4 points',
      '3 points',
      'The low is needed to calculate it'
    ],
    answer: 'C'
  },
  {
    question: 'A candle reaches a high of 112 and a low of 103. What is its full range?',
    choices: [
      '4 points',
      '9 points',
      '15 points',
      'The closing price is needed to calculate it'
    ],
    answer: 'B'
  },
  {
    question: 'A candle trades above 150 but closes at 148. Which statement is correct?',
    choices: [
      'Price traded above 150 and ended the period below it',
      'Price closed above 150',
      'Price opened at 150',
      'Price will stay below 150 on the next candle'
    ],
    answer: 'A'
  },
  {
    question: 'A candle has a long lower wick. What can you tell from the wick alone?',
    choices: [
      'Price closed at the low of the period',
      'The next candle will be bullish',
      'Most trades happened near the low',
      'Price traded below both the open and close during the period'
    ],
    answer: 'D'
  },
  {
    question: 'There are two minutes left before a five-minute candle closes. Which value is already fixed?',
    choices: [
      'The closing price',
      'The final high',
      'The opening price',
      'The final low'
    ],
    answer: 'C'
  },
  {
    question: 'Two candles have the same open, high, low and close. What could still be different?',
    choices: [
      'The order in which they reached the high and the low',
      'The total range of each candle',
      'The size of each candle body',
      'Whether each candle closed above its open'
    ],
    answer: 'A'
  },
  {
    question: 'A candle has a 10-point range and a 1-point body. What does that tell you?',
    choices: [
      'Price only moved by 1 point during the period',
      'The open and close were close together despite a wider range',
      'The candle closed exactly halfway between its high and low',
      'The next candle will also have a 10-point range'
    ],
    answer: 'B'
  }
];
