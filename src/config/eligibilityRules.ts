/**
 * Copy for the "Why isn't this counted?" screen (/eligibility).
 *
 * Summarised in plain English from the two documents in RULE_SOURCES. Each
 * rule names the clauses it comes from. When OCBC publishes a new version,
 * update the text, the clause references and the version dates together.
 *
 * A "Not eligible" transaction points at one rule through its
 * `ineligibleRuleId`; its "Why?" link then opens that rule.
 */
export interface EligibilityRule {
  id: string;
  title: string;
  body: string;
  /** Shown as a bulleted list under the body. */
  points?: readonly string[];
  /** Where the rule comes from, e.g. "T&Cs clauses 2A, 3(a)". */
  source: string;
}

export const RULE_SOURCES = {
  terms: {
    title: 'OCBC 365 Credit Card Cashback Programme terms',
    version: 'version 1 November 2026',
    url: 'https://www.ocbc.com/iwov-resources/sg/ocbc/personal/pdf/cards/tncs-governing-365-cc-cashback-programme-wef1nov26.pdf',
  },
  exclusions: {
    title: 'OCBC Cards Rewards Transaction Exclusion List',
    version: 'updated 24 September 2026',
    url: 'https://www.ocbc.com/iwov-resources/sg/ocbc/personal/pdf/cards/ocbc-cards-rewards-transaction-exclusion-list.pdf',
  },
} as const;

export const ELIGIBILITY_RULES: readonly EligibilityRule[] = [
  {
    id: 'minimum-and-cap',
    title: 'How the S$800 minimum and S$160 cap work',
    body:
      'Spend at least S$800 in a calendar month on posted, eligible transactions. Spending on the main and supplementary cards adds up together.',
    points: [
      'Once you reach S$800, dining, groceries, land transport and petrol earn 6% cashback, and Watsons earns 3% until 31 March 2027. This bonus cashback is capped at S$160 a month.',
      'Everything else, and all spending in a month under S$800, earns 0.25% base cashback. The base rate has no minimum.',
      'Selected property-listing and Meta advertising payments earn 1% (0.5% when paid in instalments), with no minimum and no cap.',
      'Cashback is worked out on the month’s posted transactions and credited the following month, against your bill.',
    ],
    source: 'T&Cs clauses 2, 3(a)–(b) and 4(a)–(c)',
  },
  {
    id: 'posted-only',
    title: 'Only posted purchases count',
    body:
      'A purchase counts once it is posted to your card account, which can take a few days. Until then it shows as Pending and does not count towards the minimum or earn cashback. A refunded or reversed purchase is taken back out, and cashback already credited on it can be deducted later.',
    source: 'T&Cs clauses 1(b), 4(e) and 4(f)',
  },
  {
    id: 'fees-and-instalments',
    title: 'Bank fees, interest and instalment plans',
    body: 'Charges from the bank itself never count, and neither do instalment plans:',
    points: [
      'Annual fees, interest and finance charges',
      'Late payment, cash advance, balance transfer and instalment processing fees',
      'Foreign exchange and dynamic currency conversion fees',
      'Cash-on-Instalment, Instalment Payment Plan and PayLite transactions',
    ],
    source: 'Exclusion List 4(a)–(b)',
  },
  {
    id: 'payments-and-top-ups',
    title: 'Bill payments, top-ups and transfers',
    body:
      'Moving money around does not count as spending. The exception is utility bills charged straight to the card, which do count on the OCBC 365 Credit Card.',
    points: [
      'Payments made through AXS or SAM',
      'EZ-Link, Transit Link and ShopeePay top-ups, and loading other stored-value cards or e-wallets',
      'Cash withdrawals, money transfers and buying foreign currency',
      'Repaying loans or other financial institutions, and paying brokers for securities',
    ],
    source: 'Exclusion List 4(c)–(d): MCCs 4829, 6010, 6012, 6051, 6211 and 6540',
  },
  {
    id: 'insurance-education-health',
    title: 'Insurance, education and healthcare',
    body: 'These payments do not count:',
    points: [
      'Insurance premiums, including insurance sold by direct marketing',
      'School, university and other course fees',
      'Hospital bills, and medical, dental or optical equipment and supplies',
    ],
    source: 'Exclusion List 4(c): MCCs 5047, 5960, 6300, 8062 and 8211–8299',
  },
  {
    id: 'government-and-other',
    title: 'Government, charity and other payments',
    body: 'These do not count either:',
    points: [
      'Taxes, fines, court costs, bail and other government services, including government postal services',
      'Donations to charities, and to political or religious organisations',
      'Membership fees for associations, unions and motoring associations',
      'Tolls, parking, property agents and property management, and cleaning and maintenance services',
      'Betting, lotteries and gambling, cigar shops, and merchants coded as general non-durable goods',
    ],
    source: 'Exclusion List 4(c): MCCs 4784, 5199, 5993, 6513, 7349, 7523, 7995, 8398–8699 and 9211–9405',
  },
  {
    id: 'merchant-codes',
    title: 'The merchant’s code decides',
    body:
      'Whether a purchase counts, and at which rate, depends on the merchant category code (MCC) that the merchant’s own bank assigns. It may not match what the shop seems to sell. Hotel dining, for example, only earns the dining rate when the outlet is coded as a restaurant, fast-food outlet or caterer, and phone or mail orders never do. EZ-Link and Transit Link top-ups and fleet petrol cards do not earn the transport or petrol rate.',
    source: 'T&Cs clauses 1(e), 2A and 4(l)',
  },
];

/** The rules a "Not eligible" transaction can point to: the exclusions, not the general rules. */
export const EXCLUSION_RULE_IDS = [
  'fees-and-instalments',
  'payments-and-top-ups',
  'insurance-education-health',
  'government-and-other',
] as const;
