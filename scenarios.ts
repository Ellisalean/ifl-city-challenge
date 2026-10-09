export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface GrammarChallenge {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'SLOT_FILL' | 'DIALOGUE_TREE';
  speaker: string;
  prompt: string;
  dialogueContext: string;
  ruleTag: 'Months' | 'Possessive Adjectives' | 'Possessive Pronouns' | 'Prepositions of Time';
  hint: string;
  options: QuestionOption[];
  // For slot fill questions:
  sentenceWithBlank?: string;
  slotTokens?: string[];
  correctToken?: string;
}

export interface ScenarioChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  location: string;
  npcName: string;
  npcRole: string;
  avatarBgColor: string;
  bgKey: string;
  iconKey: string;
  introDialogue: string[];
  outroDialogue: string[];
  challenges: GrammarChallenge[];
}

export const SCENARIO_CHAPTERS: ScenarioChapter[] = [
  {
    id: 'cafe',
    chapterNumber: 1,
    title: 'Artisan Specialty Cafe',
    subtitle: 'Morning Rush & Customer Loyalty',
    location: 'Metropolitan Roasters, 5th Avenue',
    npcName: 'Elena Rostova',
    npcRole: 'Lead Barista & Cafe Manager',
    avatarBgColor: 'from-amber-600 to-amber-900',
    bgKey: 'bg_corporate_cafe',
    iconKey: 'icon_coffee_cup',
    introDialogue: [
      'Good morning! Welcome to Metropolitan Roasters.',
      'We are updating our seasonal drink calendar and our customer loyalty accounts.',
      'Let us see if you can help verify the orders and schedule our seasonal specials!'
    ],
    outroDialogue: [
      'Outstanding work! Your communication is polished and precise.',
      'Here is your specialty caramel macchiato on the house. See you next visit!'
    ],
    challenges: [
      {
        id: 'cafe_q1',
        type: 'MULTIPLE_CHOICE',
        speaker: 'Elena',
        prompt: 'Elena holds up a takeaway cup left on the pickup counter.',
        dialogueContext: '"Excuse me, someone left this oat milk latte on the counter. Is this drink ______?"',
        ruleTag: 'Possessive Pronouns',
        hint: 'Use "yours" (possessive pronoun) when standing alone without a following noun. "Your" is an adjective that must precede a noun.',
        options: [
          { id: 'a', text: 'yours', isCorrect: true, explanation: 'Correct! "Yours" is a possessive pronoun that stands alone without needing a noun after it.' },
          { id: 'b', text: 'your', isCorrect: false, explanation: '"Your" is a possessive adjective and must be followed by a noun (e.g., "your coffee").' },
          { id: 'c', text: 'you', isCorrect: false, explanation: '"You" is a subject/object pronoun, not a possessive.' },
          { id: 'd', text: 'your’s', isCorrect: false, explanation: 'Incorrect punctuation! Possessive pronouns never take apostrophes.' }
        ]
      },
      {
        id: 'cafe_q2',
        type: 'SLOT_FILL',
        speaker: 'Elena',
        prompt: 'Elena checks the seasonal drink rollout schedule on the blackboard.',
        dialogueContext: '"We start serving our artisan Pumpkin Spice blend ______ every year."',
        ruleTag: 'Months',
        hint: 'We use the preposition "in" before months of the year without a specific calendar date (e.g., in September, in October).',
        sentenceWithBlank: 'We start serving our artisan Pumpkin Spice blend _____ every year.',
        slotTokens: ['in October', 'at October', 'on October', 'during October 1st'],
        correctToken: 'in October',
        options: [
          { id: 'a', text: 'in October', isCorrect: true, explanation: 'Spot on! The preposition "in" is strictly used with months (e.g., "in October").' },
          { id: 'b', text: 'at October', isCorrect: false, explanation: '"At" is used for clock times (e.g., at 9:00 AM), not for months.' },
          { id: 'c', text: 'on October', isCorrect: false, explanation: '"On" is used for specific days or dates (e.g., on October 15th), not months alone.' },
          { id: 'd', text: 'by October 1st', isCorrect: false, explanation: '"In October" is the standard seasonal phrase for month-long events.' }
        ]
      },
      {
        id: 'cafe_q3',
        type: 'MULTIPLE_CHOICE',
        speaker: 'Elena',
        prompt: 'A customer points toward a loyalty card forgotten at the register.',
        dialogueContext: '"That businessman forgot his VIP stamp card. Can you confirm if this is ______?"',
        ruleTag: 'Possessive Pronouns',
        hint: '"His" serves as both possessive adjective and possessive pronoun for masculine singular entities.',
        options: [
          { id: 'a', text: 'his', isCorrect: true, explanation: 'Excellent! "His" functions correctly as both a possessive adjective ("his card") and a standalone possessive pronoun ("It is his").' },
          { id: 'b', text: 'him', isCorrect: false, explanation: '"Him" is an object pronoun, not possessive.' },
          { id: 'c', text: 'he\'s', isCorrect: false, explanation: '"He\'s" is a contraction for "he is" or "he has".' },
          { id: 'd', text: 'his\'s', isCorrect: false, explanation: '"His\'s" is grammatically invalid.' }
        ]
      },
      {
        id: 'cafe_q4',
        type: 'SLOT_FILL',
        speaker: 'Elena',
        prompt: 'Elena discusses the annual summer iced beverage campaign.',
        dialogueContext: '"Our highest iced cold brew sales always peak during the third quarter, especially ______."',
        ruleTag: 'Months',
        hint: 'Remember: July and August are key third-quarter summer months. Months of the year must always be capitalized.',
        sentenceWithBlank: 'Our highest iced cold brew sales always peak during the third quarter, especially _____.',
        slotTokens: ['in August', 'on August', 'in august', 'at August'],
        correctToken: 'in August',
        options: [
          { id: 'a', text: 'in August', isCorrect: true, explanation: 'Perfect! Months in English must always begin with a capital letter and take the preposition "in".' },
          { id: 'b', text: 'in august', isCorrect: false, explanation: 'Capitalization rule: Months of the year in English MUST always start with a capital letter.' },
          { id: 'c', text: 'on August', isCorrect: false, explanation: '"On" is for specific dates, not general months.' },
          { id: 'd', text: 'at August', isCorrect: false, explanation: '"At" is incorrect for months.' }
        ]
      },
      {
        id: 'cafe_q5',
        type: 'DIALOGUE_TREE',
        speaker: 'Elena',
        prompt: 'Elena asks you to clarify ownership of a table order between two groups.',
        dialogueContext: '"Both tables ordered croissants, but Table 4 says the chocolate pastry is ______."',
        ruleTag: 'Possessive Pronouns',
        hint: '"Theirs" replaces "their pastry" when functioning as a possessive pronoun.',
        options: [
          { id: 'a', text: 'theirs', isCorrect: true, explanation: 'Brilliant! "Theirs" is the 3rd person plural possessive pronoun representing "their croissant".' },
          { id: 'b', text: 'their', isCorrect: false, explanation: '"Their" requires a following noun (e.g., "their order").' },
          { id: 'c', text: 'there\'s', isCorrect: false, explanation: '"There\'s" means "there is".' },
          { id: 'd', text: 'they\'re', isCorrect: false, explanation: '"They\'re" is a contraction of "they are".' }
        ]
      }
    ]
  },
  {
    id: 'bank',
    chapterNumber: 2,
    title: 'Bank Consultation Suite',
    subtitle: 'Fiscal Quarters & Account Portfolio',
    location: 'Apex International Financial Tower, 24th Floor',
    npcName: 'David Sterling',
    npcRole: 'Senior Wealth Consultant',
    avatarBgColor: 'from-blue-600 to-slate-900',
    bgKey: 'bg_bank_consultation',
    iconKey: 'icon_contract_folder',
    introDialogue: [
      'Welcome to Apex Financial Services. Please have a seat.',
      'We are conducting our quarterly fiscal reviews and auditing institutional accounts.',
      'Precision in language prevents costly contractual misunderstandings. Let us review the files.'
    ],
    outroDialogue: [
      'Flawless documentation analysis. Your command of fiscal timelines and possessive contracts is exceptional.',
      'I will execute these account transfers immediately.'
    ],
    challenges: [
      {
        id: 'bank_q1',
        type: 'MULTIPLE_CHOICE',
        speaker: 'David',
        prompt: 'David presents an audited financial statement.',
        dialogueContext: '"The executive board approved ______ budget allocation during the Q1 conference."',
        ruleTag: 'Possessive Adjectives',
        hint: 'Use "its" (possessive adjective without apostrophe) for neuter singular entities like a board or company.',
        options: [
          { id: 'a', text: 'its', isCorrect: true, explanation: 'Spot on! "Its" without an apostrophe indicates possession for an organization or singular neutral entity.' },
          { id: 'b', text: 'it\'s', isCorrect: false, explanation: '"It\'s" is a contraction for "it is" or "it has". It is never a possessive adjective.' },
          { id: 'c', text: 'its\'', isCorrect: false, explanation: '"Its\'" does not exist in the English language.' },
          { id: 'd', text: 'their', isCorrect: false, explanation: '"The executive board" is treated here as a singular collective entity with singular possessive "its".' }
        ]
      },
      {
        id: 'bank_q2',
        type: 'SLOT_FILL',
        speaker: 'David',
        prompt: 'David discusses corporate audit schedules across the calendar.',
        dialogueContext: '"Our annual external audit concludes in Q2, specifically ______."',
        ruleTag: 'Months',
        hint: 'The second calendar quarter (Q2) comprises April, May, and June.',
        sentenceWithBlank: 'Our annual external audit concludes in Q2, specifically _____.',
        slotTokens: ['in June', 'on June', 'in January', 'at June'],
        correctToken: 'in June',
        options: [
          { id: 'a', text: 'in June', isCorrect: true, explanation: 'Correct! June is the closing month of the second quarter (Q2: April, May, June).' },
          { id: 'b', text: 'in January', isCorrect: false, explanation: 'January is in Q1 (first quarter), not Q2.' },
          { id: 'c', text: 'on June', isCorrect: false, explanation: 'Preposition error: months require "in", not "on".' },
          { id: 'd', text: 'at June', isCorrect: false, explanation: '"At" is for specific times of day.' }
        ]
      },
      {
        id: 'bank_q3',
        type: 'MULTIPLE_CHOICE',
        speaker: 'David',
        prompt: 'David checks two portfolio folders on the desk.',
        dialogueContext: '"We finalized our investment strategy yesterday. Has Ms. Vance finalized ______?"',
        ruleTag: 'Possessive Pronouns',
        hint: 'Use "hers" as the feminine singular possessive pronoun replacing "her investment strategy".',
        options: [
          { id: 'a', text: 'hers', isCorrect: true, explanation: 'Exact! "Hers" is the standalone possessive pronoun referring to Ms. Vance\'s portfolio/strategy.' },
          { id: 'b', text: 'her', isCorrect: false, explanation: '"Her" is a possessive adjective and requires a noun (e.g., "her strategy").' },
          { id: 'c', text: 'her\'s', isCorrect: false, explanation: 'Possessive pronouns NEVER use apostrophes.' },
          { id: 'd', text: 'she', isCorrect: false, explanation: '"She" is a subject pronoun.' }
        ]
      },
      {
        id: 'bank_q4',
        type: 'SLOT_FILL',
        speaker: 'David',
        prompt: 'David reviews the quarterly tax submission deadline.',
        dialogueContext: '"First quarter corporate tax returns are formally submitted ______."',
        ruleTag: 'Months',
        hint: 'Q1 closes on March 31, and fiscal filings occur in April. Remember capital letters and the preposition "in".',
        sentenceWithBlank: 'First quarter corporate tax returns are formally submitted _____.',
        slotTokens: ['in April', 'on April', 'in april', 'at April'],
        correctToken: 'in April',
        options: [
          { id: 'a', text: 'in April', isCorrect: true, explanation: 'Precisely right! "In April" follows correct capitalization and preposition rules.' },
          { id: 'b', text: 'in april', isCorrect: false, explanation: 'English calendar months must always start with an uppercase letter.' },
          { id: 'c', text: 'on April', isCorrect: false, explanation: 'Use "on" only when an exact date number is stated (e.g., on April 15th).' },
          { id: 'd', text: 'at April', isCorrect: false, explanation: '"At" is incorrect for calendar months.' }
        ]
      },
      {
        id: 'bank_q5',
        type: 'DIALOGUE_TREE',
        speaker: 'David',
        prompt: 'David clarifies shared joint partnership funds.',
        dialogueContext: '"The consulting firm claims this trust is their private asset, but in fact, it is ______."',
        ruleTag: 'Possessive Pronouns',
        hint: '"Ours" represents "our asset" as a first-person plural possessive pronoun.',
        options: [
          { id: 'a', text: 'ours', isCorrect: true, explanation: 'Superb! "Ours" is the standalone possessive pronoun for the first-person plural.' },
          { id: 'b', text: 'our', isCorrect: false, explanation: '"Our" must be attached to a noun (e.g., "our trust").' },
          { id: 'c', text: 'our\'s', isCorrect: false, explanation: 'Incorrect punctuation! "Our\'s" is not a word.' },
          { id: 'd', text: 'us', isCorrect: false, explanation: '"Us" is an object pronoun.' }
        ]
      }
    ]
  },
  {
    id: 'mixer',
    chapterNumber: 3,
    title: 'Corporate Networking Mixer',
    subtitle: 'Rooftop Terrace & Strategic Partnerships',
    location: 'Skyline Vista Terrace, Grand Central Plaza',
    npcName: 'Chloe Vance',
    npcRole: 'VP of Strategic Marketing',
    avatarBgColor: 'from-emerald-600 to-teal-950',
    bgKey: 'bg_networking_mixer',
    iconKey: 'icon_business_card',
    introDialogue: [
      'Good evening! What an exhilarating view of the city skyline.',
      'Industry leaders from tech, finance, and marketing are networking tonight.',
      'Let us make introductions, coordinate team schedules, and exchange strategic cards!'
    ],
    outroDialogue: [
      'Incredible poise and eloquence! You navigated the executive mixer with total confidence.',
      'Here is my executive card — let us schedule a partnership meeting next week!'
    ],
    challenges: [
      {
        id: 'mixer_q1',
        type: 'MULTIPLE_CHOICE',
        speaker: 'Chloe',
        prompt: 'Chloe introduces two project teams collaborating on a global summit.',
        dialogueContext: '"Our design team will deliver the campaign mockups, while ______ team prepares the media analytics."',
        ruleTag: 'Possessive Adjectives',
        hint: '"Your" modifies the noun "team" as a possessive adjective.',
        options: [
          { id: 'a', text: 'your', isCorrect: true, explanation: 'Correct! "Your" modifies the noun "team" as a possessive adjective.' },
          { id: 'b', text: 'yours', isCorrect: false, explanation: '"Yours" is a pronoun and cannot directly precede the noun "team".' },
          { id: 'c', text: 'you\'re', isCorrect: false, explanation: '"You\'re" means "you are".' },
          { id: 'd', text: 'you', isCorrect: false, explanation: '"You" is a subject pronoun, not possessive.' }
        ]
      },
      {
        id: 'mixer_q2',
        type: 'SLOT_FILL',
        speaker: 'Chloe',
        prompt: 'Chloe discusses the annual tech innovation expo schedule.',
        dialogueContext: '"The global innovation conference takes place right before winter, usually ______."',
        ruleTag: 'Months',
        hint: 'Late autumn leading into winter in the northern hemisphere is November.',
        sentenceWithBlank: 'The global innovation conference takes place right before winter, usually _____.',
        slotTokens: ['in November', 'on November', 'in november', 'at November'],
        correctToken: 'in November',
        options: [
          { id: 'a', text: 'in November', isCorrect: true, explanation: 'Spot on! "In November" follows proper capitalization and preposition usage for months.' },
          { id: 'b', text: 'in november', isCorrect: false, explanation: 'Months must always be capitalized.' },
          { id: 'c', text: 'on November', isCorrect: false, explanation: '"On" is used only for specific calendar dates.' },
          { id: 'd', text: 'at November', isCorrect: false, explanation: '"At" is invalid for months.' }
        ]
      },
      {
        id: 'mixer_q3',
        type: 'MULTIPLE_CHOICE',
        speaker: 'Chloe',
        prompt: 'Chloe exchanges business cards with you.',
        dialogueContext: '"I have given you my executive contact card. May I please have ______?"',
        ruleTag: 'Possessive Pronouns',
        hint: 'Use "yours" to replace "your card" without repeating the noun.',
        options: [
          { id: 'a', text: 'yours', isCorrect: true, explanation: 'Exactly right! "Yours" is the possessive pronoun replacing "your card" to avoid redundancy.' },
          { id: 'b', text: 'your', isCorrect: false, explanation: '"Your" must precede a noun (e.g., "your card").' },
          { id: 'c', text: 'you\'s', isCorrect: false, explanation: 'Invalid word format.' },
          { id: 'd', text: 'you', isCorrect: false, explanation: '"You" is not a possessive form.' }
        ]
      },
      {
        id: 'mixer_q4',
        type: 'SLOT_FILL',
        speaker: 'Chloe',
        prompt: 'Chloe outlines the beginning of the new fiscal year.',
        dialogueContext: '"All strategic department budgets reset at the start of the year ______."',
        ruleTag: 'Months',
        hint: 'The first month of the calendar year is January.',
        sentenceWithBlank: 'All strategic department budgets reset at the start of the year _____.',
        slotTokens: ['in January', 'on January', 'in january', 'at January'],
        correctToken: 'in January',
        options: [
          { id: 'a', text: 'in January', isCorrect: true, explanation: 'Perfect! January is the initial month of the year, framed with preposition "in".' },
          { id: 'b', text: 'in january', isCorrect: false, explanation: 'Capitalization is mandatory for months.' },
          { id: 'c', text: 'on January', isCorrect: false, explanation: '"On" requires a calendar day number.' },
          { id: 'd', text: 'by January 1st', isCorrect: false, explanation: '"In January" is the standard phrase for month timing.' }
        ]
      },
      {
        id: 'mixer_q5',
        type: 'DIALOGUE_TREE',
        speaker: 'Chloe',
        prompt: 'Chloe compares campaign pitches between two tech startups.',
        dialogueContext: '"Their presentation was compelling, but our executive board voted that the contract should be ______."',
        ruleTag: 'Possessive Pronouns',
        hint: 'Use "ours" as the possessive pronoun replacing "our contract/victory".',
        options: [
          { id: 'a', text: 'ours', isCorrect: true, explanation: 'Outstanding! "Ours" functions as the predicate possessive pronoun.' },
          { id: 'b', text: 'our', isCorrect: false, explanation: '"Our" requires a noun directly following it.' },
          { id: 'c', text: 'our\'s', isCorrect: false, explanation: 'Possessive pronouns do not take apostrophes.' },
          { id: 'd', text: 'us', isCorrect: false, explanation: '"Us" is an objective pronoun.' }
        ]
      }
    ]
  }
];

export interface GrammarRuleGuide {
  title: string;
  category: string;
  summary: string;
  examples: { rule: string; correct: string; incorrect: string }[];
}

export const GRAMMAR_GUIDES: GrammarRuleGuide[] = [
  {
    title: 'Possessive Adjectives vs. Possessive Pronouns',
    category: 'Lesson 4 Core Grammar',
    summary: 'Possessive Adjectives must sit directly in front of a noun (my coffee, your card). Possessive Pronouns stand alone and replace the noun entirely (mine, yours, his, hers, ours, theirs). Never use apostrophes with possessive pronouns!',
    examples: [
      { rule: '1st Person Singular', correct: 'This is my card. / The card is mine.', incorrect: 'The card is my. / The card is mine\'s.' },
      { rule: '2nd Person', correct: 'Is this your drink? / Is this drink yours?', incorrect: 'Is this drink your? / Is this drink your\'s?' },
      { rule: '3rd Person Singular (M/F)', correct: 'It is his report. / It is hers.', incorrect: 'It is her\'s. / The report is him.' },
      { rule: '1st & 3rd Person Plural', correct: 'Our launch is ready. / The victory is ours.', incorrect: 'The victory is our. / The victory is our\'s.' }
    ]
  },
  {
    title: 'Months of the Year & Time Prepositions',
    category: 'Lesson 3 Core Calendar',
    summary: 'Always capitalize the 12 months: January, February, March, April, May, June, July, August, September, October, November, December. Use preposition "in" with months alone ("in October"), and "on" only when a specific date number is provided ("on October 15th").',
    examples: [
      { rule: 'Preposition with Months', correct: 'Our fiscal audit is in April.', incorrect: 'Our fiscal audit is on April. / at April.' },
      { rule: 'Mandatory Capitalization', correct: 'The summit is in November.', incorrect: 'The summit is in november.' },
      { rule: 'Quarterly Breakdown', correct: 'Q1 (Jan, Feb, Mar), Q2 (Apr, May, Jun), Q3 (Jul, Aug, Sep), Q4 (Oct, Nov, Dec).', incorrect: 'Q2 ends in July.' }
    ]
  }
];
