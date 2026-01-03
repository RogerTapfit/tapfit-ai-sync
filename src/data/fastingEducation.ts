export interface FastingBenefit {
  title: string;
  description: string;
  icon: string;
}

export interface FastingTip {
  title: string;
  content: string;
}

export const FASTING_BENEFITS: FastingBenefit[] = [
  {
    title: 'Weight Loss',
    description: 'Fasting naturally reduces calorie intake and boosts metabolism through ketosis.',
    icon: '⚖️'
  },
  {
    title: 'Autophagy',
    description: 'Cellular cleanup process that removes damaged proteins and regenerates new cells.',
    icon: '♻️'
  },
  {
    title: 'Insulin Sensitivity',
    description: 'Improved blood sugar regulation and reduced risk of type 2 diabetes.',
    icon: '💉'
  },
  {
    title: 'Brain Health',
    description: 'Ketones fuel the brain efficiently and may improve cognitive function.',
    icon: '🧠'
  },
  {
    title: 'Longevity',
    description: 'Studies show fasting may extend lifespan and improve healthspan.',
    icon: '⏳'
  },
  {
    title: 'Inflammation',
    description: 'Reduces chronic inflammation linked to many diseases.',
    icon: '🔥'
  }
];

export const AUTOPHAGY_INFO = {
  title: 'What is Autophagy?',
  description: 'Autophagy (from Greek "self-eating") is your body\'s cellular cleanup system. During fasting, cells break down and recycle damaged components, creating new, healthy cellular material.',
  timeline: [
    { hours: 12, stage: 'Beginning', description: 'Autophagy starts as glucose depletes' },
    { hours: 16, stage: 'Active', description: 'Significant autophagy in most tissues' },
    { hours: 24, stage: 'Peak', description: 'Maximum cellular cleanup occurring' },
    { hours: 48, stage: 'Extended', description: 'Deep tissue regeneration' }
  ],
  benefits: [
    'Removes damaged proteins',
    'Destroys pathogens in cells',
    'Recycles cellular components',
    'May slow aging process',
    'Supports immune function'
  ]
};

export const SAFETY_WARNINGS = {
  title: '⚠️ Important Safety Information',
  shouldNotFast: [
    'Pregnant or breastfeeding women',
    'Children and teenagers under 18',
    'People with eating disorder history',
    'Type 1 diabetics or diabetics on insulin',
    'People on medications that require food',
    'Those underweight or malnourished',
    'People with severe chronic diseases'
  ],
  breakFastIf: [
    'Feeling dizzy or lightheaded',
    'Experiencing severe weakness',
    'Heart palpitations',
    'Confusion or disorientation',
    'Severe hunger that doesn\'t pass'
  ],
  tips: [
    'Always consult a doctor before extended fasts',
    'Stay hydrated with water and electrolytes',
    'Break fasts gently with small, easy meals',
    'Listen to your body',
    'Don\'t exercise intensely during extended fasts'
  ]
};

export const PROTOCOL_EDUCATION: Record<string, { overview: string; bestFor: string[]; tips: string[] }> = {
  '16:8': {
    overview: 'The most popular and sustainable intermittent fasting method. Skip breakfast, eat lunch around noon, and finish dinner by 8 PM.',
    bestFor: ['Beginners', 'Weight maintenance', 'Daily routine', 'Long-term sustainability'],
    tips: [
      'Start by pushing breakfast later gradually',
      'Black coffee and tea are fine during the fast',
      'Focus on nutrient-dense meals during eating window'
    ]
  },
  '18:6': {
    overview: 'A step up from 16:8, providing deeper autophagy benefits while still being manageable for most people.',
    bestFor: ['Intermediate fasters', 'Enhanced fat burning', 'Those comfortable with 16:8'],
    tips: [
      'Transition from 16:8 after 2-4 weeks',
      'Consider eating 2 larger meals instead of 3',
      'Stay busy during the extra fasting hours'
    ]
  },
  '20:4': {
    overview: 'Known as the Warrior Diet, this involves eating all calories in a 4-hour window, typically in the evening.',
    bestFor: ['Experienced fasters', 'Maximum autophagy', 'Simplified meal planning'],
    tips: [
      'Focus on getting enough calories in the window',
      'Include protein-rich foods',
      'Take a multivitamin if needed'
    ]
  },
  'OMAD': {
    overview: 'One Meal A Day means eating your entire daily calories in a single sitting. Maximum simplicity and fasting benefits.',
    bestFor: ['Simplified eating', 'Deep autophagy', 'Experienced fasters'],
    tips: [
      'Make your one meal count - balanced and nutrient-dense',
      'Consider eating slowly to aid digestion',
      'May not be suitable for high-calorie needs'
    ]
  },
  'water_fast': {
    overview: 'Only water is consumed. This provides the deepest fasting benefits but requires careful preparation and execution.',
    bestFor: ['Spiritual practice', 'Deep healing', 'Experienced fasters only'],
    tips: [
      'Add electrolytes (sodium, potassium, magnesium)',
      'Rest and avoid strenuous activity',
      'Plan your refeeding carefully'
    ]
  },
  'liquid_fast': {
    overview: 'Allows broths, juices, and other liquids while giving the digestive system a break from solid food.',
    bestFor: ['Gut healing', 'Transition to water fasting', 'Those who need some calories'],
    tips: [
      'Include bone broth for minerals and collagen',
      'Vegetable juices provide nutrients',
      'Easier to maintain than water fasting'
    ]
  },
  'alternate_day': {
    overview: 'Alternating between eating days and fasting days (36+ hours). Highly effective for weight loss.',
    bestFor: ['Significant weight loss', 'Metabolic flexibility', 'Those who prefer longer fasts'],
    tips: [
      'Don\'t overeat on eating days',
      'Stay hydrated on fasting days',
      'Consider modified ADF (500 cal on fast days) to start'
    ]
  }
};

export const FASTING_TIPS_BY_PHASE = {
  early: [
    'Drink plenty of water',
    'Black coffee or tea can help suppress hunger',
    'Stay busy to distract from hunger',
    'Light activity is fine and beneficial'
  ],
  middle: [
    'Hunger typically peaks then subsides',
    'You may feel mental clarity as ketones rise',
    'Continue hydrating with electrolytes',
    'Light walking can boost fat burning'
  ],
  late: [
    'Autophagy is in full effect',
    'Rest if you feel tired',
    'Plan your breaking meal',
    'Avoid intense exercise'
  ]
};
