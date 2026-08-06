/**
 * The source dictionary.
 *
 * English is the only language bundled with the entry chunk; `az` and `ru` are
 * fetched on demand (see `src/i18n/index.ts`), which is what keeps three full
 * translations out of the first-load budget.
 *
 * This object is also the *type* the other two are checked against — a missing
 * or misspelt key in `az.ts` is a compile error, not a string that silently
 * renders as `nav.plan` in production. That is what "keys extracted from day
 * one" has to mean to be worth anything.
 */
export const en = {
  common: {
    brand: 'Nocta',
    skipToContent: 'Skip to content',
    close: 'Close',
    tryAgain: 'Try again',
    reload: 'Reload',
    backHome: 'Back to home',
    free: 'Free',
    perDay: '{{amount}} / day',
    nights_one: '{{count}} night',
    nights_other: '{{count}} nights',
    days_one: '{{count}} day',
    days_other: '{{count}} days',
    stops_one: '{{count}} stop',
    stops_other: '{{count}} stops',
  },

  language: {
    label: 'Language',
    en: 'English',
    az: 'Azərbaycan',
    ru: 'Русский',
  },

  theme: {
    label: 'Colour theme',
    light: 'Light theme',
    dark: 'Dark theme',
    system: 'System theme',
    short: 'Theme',
  },

  nav: {
    main: 'Main',
    mobile: 'Mobile',
    home: 'Nocta — home',
    plan: 'Plan a trip',
    route: 'Route',
    saved: 'Saved',
    styleguide: 'Styleguide',
    startPlanning: 'Start planning',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },

  footer: {
    blurb:
      'An itinerary planner that assumes you would rather walk than queue, and that dinner is the point of the day.',
    disclaimer:
      'A portfolio project. The planner is a local service with a hand-built venue catalogue — no model is called, and no data leaves your browser.',
    product: 'Product',
    destinations: 'Destinations',
    savedTrips: 'Saved trips',
    designSystem: 'Design system',
    routeBuilder: 'Route builder',
    copyright: '© {{year}} Nocta. Built as a demonstration, not a booking service.',
    catalogue: 'Catalogue: {{cities}} cities · 100+ venues · all coordinates real',
  },

  hero: {
    badge: '{{count}} cities · 100+ venues · zero stock photos of a couple pointing',
    headline: 'Itineraries that read like a local wrote them.',
    emphasis: ['local', 'wrote'],
    body: 'Pick a city, a mood and a budget. Nocta streams back an hour-by-hour plan with real venues, real opening quirks and real walking times between them — then lets you drag the whole thing into a shape you actually like.',
    planTrip: 'Plan a trip',
    howItWorks: 'How it works',
    noAccount: 'No account. No booking funnel. Plans stay in your browser.',
  },

  howItWorks: {
    eyebrow: 'How it works',
    heading: 'Three steps, and one of them is optional.',
    body: 'Most planners hand you a wall of suggestions and call it an itinerary. This one commits to a schedule, shows its reasoning, and then lets you take it apart.',
    steps: [
      {
        title: 'Describe the trip, not the itinerary',
        body: 'A city, how many days, what you are in the mood for, and what you are willing to spend per day. Five inputs. No forms about airport preferences.',
      },
      {
        title: 'Watch it get built',
        body: 'The planner streams its work back as it goes — which venues it is reading, how it is weighting your moods, where it is optimising the walking. Days arrive one at a time, not as a spinner that ends in a wall of text.',
      },
      {
        title: 'Argue with it',
        body: 'Drag activities into a different order and the day re-times around them, walking legs included. Swap anything you do not like for a real alternative. Save it, share it, print it.',
      },
    ],
  },

  gallery: {
    eyebrow: 'The catalogue',
    heading: 'Eight cities, researched properly.',
    body: 'Not eight thousand scraped listings. Every venue in here has a real address, real coordinates and a reason to be on the list — which is why the planner can promise you a walking time and mean it.',
  },

  demo: {
    eyebrow: 'Live, on this page',
    heading: 'One day in Lisbon, generated just now.',
    body: 'Not a screenshot. Scrolling here fired a real request at the planner, and what follows arrived over the same stream the full app uses.',
    waiting: 'Waiting…',
    failedHeading: 'The planner did not answer',
    unreachable: 'The planner is unreachable right now.',
    tryProperly: 'Try it properly',
    tryProperlyBody:
      'The full planner lets you set the pace and budget, run up to seven days, drag activities between slots and swap anything you do not like.',
    openPlanner: 'Open the planner',
  },

  features: {
    eyebrow: 'What it actually does',
    heading: 'The parts most planners skip.',
    exampleDay: 'Example day fragment',
    onFoot: '{{duration}} on foot',
    items: [
      {
        title: 'Walking times, computed',
        body: 'Every leg between two activities is a real haversine distance at a real walking pace. Reorder the day and they all recalculate — including the ones that quietly become a metro ride.',
      },
      {
        title: 'Streamed, not spun',
        body: 'Days arrive one at a time over SSE, each validated against the schema before it reaches the screen.',
      },
      {
        title: 'Drag anything',
        body: 'Keyboard-operable reordering with dnd-kit. The day re-times around whatever you move.',
      },
      {
        title: 'Swap it',
        body: 'Every block offers real alternatives from the same city, filtered to your budget.',
      },
      {
        title: 'Yours, locally',
        body: 'Trips persist in your browser under a versioned schema with a real migration path. No account, no server copy.',
      },
    ],
  },

  pricing: {
    eyebrow: 'Pricing',
    heading: 'Free does the whole job.',
    body: 'This is a portfolio project, so nothing here charges anyone anything. The tiers show what a real plan structure would look like — and Free is not a crippled trial.',
    annual: 'Annual billing',
    annualNote: 'Two months free',
    perMonth: '/ month',
    mostUseful: 'Most useful',
    tiers: {
      free: {
        name: 'Free',
        blurb: 'Everything in this demo, permanently.',
        cta: 'Start planning',
        features: [
          'Unlimited plans across all {{cities}} cities',
          'Streamed generation with live reasoning',
          'Drag-to-reorder with automatic re-timing',
          'Up to 30 trips saved in your browser',
        ],
      },
      pro: {
        name: 'Pro',
        blurb: 'For people who take four trips a year, not one.',
        cta: 'Choose Pro',
        features: [
          'Everything in Free',
          'Multi-city routes with transfer planning',
          'Offline export to PDF and calendar',
          'Live opening hours and closure warnings',
          'Plans synced across your devices',
        ],
      },
      team: {
        name: 'Team',
        blurb: 'Shared planning for groups that argue over dinner.',
        cta: 'Choose Team',
        features: [
          'Everything in Pro',
          'Shared trips with per-person voting',
          'Comment threads on any activity',
          'Split-cost view across the group',
          'Priority generation queue',
        ],
      },
    },
  },

  notes: {
    eyebrow: 'Design notes',
    heading: 'Three decisions worth defending.',
    body: 'No invented customers here. These are the arguments the product is actually making — which is what a testimonial section is trying to be a proxy for anyway.',
    items: [
      {
        quote:
          'The walking times are the thing. Every other planner hands you five places across a city and lets you discover at 3pm that two of them are forty minutes apart.',
        attribution: 'The problem this was built to solve',
      },
      {
        quote:
          'Watching it work — "reading 14 venues in Lisbon", "optimising walking routes" — makes the wait feel like progress instead of a loading bar lying to you.',
        attribution: 'Why generation streams',
      },
      {
        quote:
          'A plan you cannot rearrange is a suggestion. Dragging an activity and watching the whole day re-time around it is the moment it stops being a document.',
        attribution: 'Why drag-and-drop re-times',
      },
    ],
  },

  faq: {
    eyebrow: 'FAQ',
    heading: 'The obvious questions.',
    items: {
      realAi: {
        question: 'Is this actually calling a language model?',
        answer:
          'No — and the architecture is built so that it could, with one file changed. The planner is a local service that scores a hand-researched venue catalogue against your moods, budget and pace, then streams the result back over Server-Sent Events.',
        answerTwo:
          'Both sides share one Zod schema. Swapping in a real model means handing that schema to it as a structured-output contract and forwarding its days as the same stream frames. The client, the validation and the entire UI stay exactly as they are.',
      },
      cities: {
        question: 'Why only {{count}} cities?',
        answer:
          'Because every venue in here was written by hand with a real address, real coordinates, a real duration and a real reason to be on the list. Eight cities of that is worth more than eight hundred cities of scraped listings — and it is the only way the walking times between stops can be honest.',
      },
      data: {
        question: 'Where do my trips go?',
        answer:
          'Into your browser’s local storage, under a versioned schema with a real migration path. There is no account, no server-side copy and no analytics on your itineraries. Clearing site data deletes them permanently, which is a trade-off stated here rather than buried.',
      },
      accuracy: {
        question: 'How accurate are the prices and opening hours?',
        answer:
          'Prices are typical per-person figures at the time of writing and will drift. Opening constraints that genuinely change a plan — market days, Monday closures, mandatory advance booking — are attached to the venues they affect and surface on the card. Nothing here is a booking system, so always check before you rely on it.',
      },
      motion: {
        question: 'Can I turn the animation off?',
        answer:
          'It is already off if your system says so. prefers-reduced-motion disables the smooth-scroll layer entirely, stops the globe, skips every scroll-triggered timeline and collapses component transitions to zero — enforced globally, so a component that forgets to check still behaves.',
      },
      offline: {
        question: 'What happens if the planner is unreachable?',
        answer:
          'Generation fails into an explicit error state with a retry, rather than an endless spinner — including a distinct message for being offline. Saved trips are read from local storage and stay fully browsable and editable with no network at all.',
      },
      language: {
        question: 'Which parts are translated?',
        answer:
          'The whole interface, in English, Azerbaijani and Russian. The venue catalogue itself stays in English: it is editorial writing about specific places, and running a hundred hand-written descriptions through machine translation would produce exactly the filler this project is otherwise free of.',
      },
    },
  },

  cta: {
    heading: 'Pick a city. It takes about eight seconds.',
    body: 'No account, no email, no funnel. The plan appears, and then you argue with it until it is yours.',
    plan: 'Plan a trip',
    styleguide: 'See the design system',
  },

  plan: {
    eyebrow: 'Planner',
    heading: 'Build the trip.',
    body: 'Five inputs. The planner streams its reasoning as it works, then hands you something you can take apart.',
    destinationLabel: 'Where are you going?',
    destinationPlaceholder: 'Lisbon, Tokyo, Reykjavík…',
    noCatalogue: 'No venue catalogue for “{{query}}”. Pick one of the {{count}} cities above.',
    daysLabel: 'How many days?',
    moodsLabel: 'What kind of trip?',
    moodsHint: '(pick up to four)',
    budgetLabel: 'Daily budget, per person',
    paceLabel: 'Pace',
    submit: 'Build {{count}} days in {{city}}',
    submitDisabled: 'Choose a destination',
    generating: 'Generating',
    connecting: 'Connecting to the planner…',
    progress: 'Generation progress',
    cancel: 'Cancel',
    emptyHeading: 'Nothing planned yet',
    emptyBody:
      'Choose a destination on the left and the planner will build a schedule — hour by hour, with the walking time between every stop worked out.',
    emptyNote: '{{count}} cities available. Nothing is charged, ever.',
    errorHeading: 'That did not work',
    errorFallback: 'The planner failed unexpectedly.',
    save: 'Save trip',
    saved: 'Saved',
    storageUnavailable: 'Storage unavailable',
    savedToast: 'Trip saved',
    savedToastBody: 'Find it under Saved, or share the link.',
    totals: {
      activities: 'Activities',
      free: 'Free of charge',
      cost: 'Total cost',
      onFoot: 'On foot',
    },
  },

  pace: {
    relaxed: 'Relaxed',
    relaxedDetail: '4 stops a day',
    balanced: 'Balanced',
    balancedDetail: '5 stops a day',
    intense: 'Intense',
    intenseDetail: '6 stops a day',
  },

  moods: {
    relax: 'Relax',
    relaxDetail: 'Fewer stops, longer sits, nothing before nine.',
    adventure: 'Adventure',
    adventureDetail: 'Hikes, day trips, and things that need proper shoes.',
    food: 'Food',
    foodDetail: 'Markets, counters, and dinners worth planning the day around.',
    culture: 'Culture',
    cultureDetail: 'Museums, architecture, and the buildings people argue about.',
    nightlife: 'Nightlife',
    nightlifeDetail: 'Bars, live music, and a finish after midnight.',
    nature: 'Nature',
    natureDetail: 'Parks, coastline, and somewhere green to stop.',
  },

  kinds: {
    landmark: 'Landmark',
    museum: 'Museum',
    food: 'Meal',
    cafe: 'Coffee',
    nightlife: 'Nightlife',
    nature: 'Outdoors',
    shopping: 'Shopping',
    transit: 'Getting there',
    stay: 'Stay',
    experience: 'Experience',
  },

  itinerary: {
    day: 'Day {{count}}',
    cost: 'Cost',
    onFoot: 'On foot',
    ends: 'Ends',
    reorder: 'Reorder {{title}}',
    options: 'Options for {{title}}',
    swap: 'Swap this',
    remove: 'Remove',
    removed: 'Removed',
    removedBody: 'The rest of the day has been re-timed around it.',
    lastActivity: 'That is the last activity',
    lastActivityBody: 'A day cannot be left empty — swap it instead.',
    swapped: 'Swapped',
    swappedBody: '{{title}} is now in that slot.',
    alternatives: 'Alternatives',
    alternativesHeading: 'Something else, {{kind}}-ish',
    alternativesBody: 'Picking one re-times the rest of the day around its duration and location.',
    alternativesEmpty: 'No alternatives left in this city that fit your budget. Try raising it.',
    alternativesFailed: 'Could not load alternatives.',
    closeAlternatives: 'Close alternatives',
    dragStart: 'Picked up {{title}}.',
    dragOver: 'Now over position of {{title}}.',
    dragEnd: 'Dropped. The day has been re-timed around the new order.',
    dragCancel: 'Reorder cancelled.',
    dragOutside: 'Dropped outside the list. Nothing changed.',
  },

  route: {
    eyebrow: 'Route builder',
    heading: 'One trip, several cities.',
    body: 'Chain up to six of them. Nocta measures every hop along the great circle, works out how long each city is actually worth, and totals the whole thing — then hands each stop to the planner.',
    yourRoute: 'Your route',
    counter: '{{count}} of {{max}}',
    empty: 'Add a city below and the map will start drawing.',
    wholeTrip: 'The whole trip',
    length: 'Length',
    lengthNote: '{{nights}} nights, {{legs}} in transit',
    ground: 'Ground covered',
    groundNote: '{{duration}} travelling',
    singleCity: 'a single city',
    cost: 'Rough cost',
    costNote: 'lodging and living, per person',
    perDay: 'Per day',
    perDayNote: 'averaged across the stops',
    method:
      'Nights come from how much each city has in the catalogue, not from a fixed number. Transit days are counted — you do not land and start sightseeing.',
    addCity: 'Add a city',
    reset: 'Reset',
    full: 'Six stops is the limit. Beyond that it stops being a trip and starts being a tour.',
    moveEarlier: 'Move {{city}} earlier',
    moveLater: 'Move {{city}} later',
    removeStop: 'Remove {{city}} from the route',
    planStop: 'Plan {{count}} days in {{city}} →',
    fly: 'Fly',
    rail: 'Rail',
  },

  destination: {
    allDestinations: '← All destinations',
    breadcrumb: 'Breadcrumb',
    averageDay: 'Average day',
    averageDayNote: 'per person, all in',
    typicalHigh: 'Typical high',
    bestSeasons: 'Best seasons',
    inCatalogue: 'In the catalogue',
    inCatalogueNote: 'venues · {{count}} day trips',
    highlights: 'Three things worth building a day around',
    others: 'Other destinations',
    planCity: 'Plan {{city}}',
    aboutCity: 'About {{city}}',
  },

  map: {
    destinations: 'Destinations',
    destinationCount: '{{count}} destinations',
    closeCity: 'Close {{city}}',
    perDayLabel: 'Per day',
    now: 'Now',
    best: 'Best',
    bestSeasons: 'Best seasons: {{seasons}}.',
  },

  seasons: {
    spring: 'Spring',
    summer: 'Summer',
    autumn: 'Autumn',
    winter: 'Winter',
  },

  saved: {
    eyebrow: 'Saved',
    heading: 'Your trips.',
    body: 'Stored in this browser under a versioned schema — never uploaded, never synced. Clearing site data removes them permanently.',
    unavailableHeading: 'Local storage is unavailable',
    unavailableBody:
      'Your browser is refusing to store data — most often private browsing, or a policy blocking site storage. You can still plan trips; they just will not persist between visits.',
    emptyHeading: 'Nothing saved yet',
    emptyBody:
      'Build a plan and hit save. It will show up here with its totals, ready to keep editing.',
    activities: 'Activities',
    cost: 'Cost',
    savedAt: 'Saved',
    open: 'Open',
    delete: 'Delete',
    removed: 'Trip removed',
    couldNotRead: 'Saved trips could not be read',
    couldNotReadBody:
      'The stored data was in an unexpected format. It has been set aside rather than deleted.',
    couldNotSave: 'Could not save',
    couldNotSaveBody:
      'Your browser refused to write to local storage — it may be full or in private mode.',
    defaultName: '{{count}} days in {{city}}',
  },

  trip: {
    allSaved: '← All saved trips',
    savedOn: 'saved {{date}}',
    days: 'Days',
    activities: 'Activities',
    cost: 'Total cost',
    onFoot: 'On foot',
    print: 'Print or save as PDF',
    copyLink: 'Copy link',
    notFoundHeading: 'That trip is not in this browser',
    notFoundBody:
      'Trips are stored locally and never uploaded, so a link only opens on the device that created it. Build it again — the planner is deterministic, so the same inputs produce the same plan.',
    openPlanner: 'Open the planner',
    notFoundEyebrow: 'Not found',
  },

  notFound: {
    eyebrow: '404',
    heading: 'You have wandered off the map.',
    body: 'Which is usually the right instinct in a city and the wrong one in a URL bar.',
  },

  errors: {
    eyebrow: 'Error',
    routeMissing: 'That page does not exist',
    routeMissingBody: 'The link may be out of date, or the trip it pointed to was deleted.',
    routeBroken: 'Something broke on our side',
    routeBrokenBody: 'This route failed to load. Your saved trips are untouched.',
    sectionBroken: 'This section stopped responding',
    sectionBrokenBody: 'The rest of the app is still fine. Try again, or head back to the planner.',
    status: 'Error {{status}}',
    generationFailed: 'Generation failed',
    couldNotBuild: 'Could not build your plan',
    offline: 'You appear to be offline. Your saved trips are still available.',
    network: 'We could not reach the planner. Check your connection and try again.',
    timeout: 'The planner took too long to respond. Try again in a moment.',
    aborted: 'Generation cancelled.',
    validation: 'The planner returned something we could not read. This one is on us.',
    notFound: 'We could not find that trip. It may have been deleted.',
    rateLimited: 'Too many plans at once. Give it a minute and try again.',
    server: 'The planner hit an error. We have logged it — please try again.',
  },

  loading: {
    page: 'Loading page',
    ellipsis: 'Loading…',
  },
};

/**
 * Plural forms beyond the two English needs.
 *
 * Russian selects between three (`одна ночь`, `две ночи`, `пять ночей`), and
 * i18next picks the suffix from the count. They are optional here because
 * English genuinely has no `_few` — a language that needs one supplies it, a
 * language that does not is not forced to invent it.
 */
type ExtraPlurals = Partial<
  Record<
    | 'nights_zero'
    | 'nights_two'
    | 'nights_few'
    | 'nights_many'
    | 'days_zero'
    | 'days_two'
    | 'days_few'
    | 'days_many'
    | 'stops_zero'
    | 'stops_two'
    | 'stops_few'
    | 'stops_many',
    string
  >
>;

/**
 * The shape every translation must satisfy.
 *
 * Deliberately not `as const`: literal types would demand that a translation
 * contain the *English strings*, which is the opposite of the point. What is
 * enforced is the set of keys and their structure.
 */
export type Dictionary = Omit<typeof en, 'common'> & {
  common: typeof en.common & ExtraPlurals;
};
