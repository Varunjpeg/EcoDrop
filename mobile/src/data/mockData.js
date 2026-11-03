// ─── EcoDrop-CA Mock Data ───────────────────────────────────────────────────
// All data used for offline demo. Replace with Supabase calls in production.

export const MOCK_USER = {
  id: 'usr_001',
  name: 'Varun Kumar',
  email: 'varun.kumar@university.edu.in',
  department: 'CSE',
  year: 3,
  avatar: 'VK',
  coins: 847,
  totalEarned: 1240,
  totalSpent: 393,
  totalItems: 38,
  streak: 5,
  referralCode: 'VARUN2024',
  joinDate: '2024-08-01',
  rank: 'Gold',
  co2Saved: 4.2,
};

export const ITEM_TYPES = {
  plastic_bottle: { label: 'Plastic Bottle', icon: '🧴', color: '#3B82F6', bin: 1 },
  textbook:       { label: 'Textbook',        icon: '📚', color: '#8B5CF6', bin: 3 },
  pen:            { label: 'Ballpoint Pen',   icon: '✏️', color: '#EC4899', bin: 2 },
  cardboard:      { label: 'Cardboard',       icon: '📦', color: '#F59E0B', bin: 3 },
  earphones:      { label: 'Earphones',       icon: '🎧', color: '#EF4444', bin: 4 },
  paper_bundle:   { label: 'Paper Bundle',    icon: '📄', color: '#10B981', bin: 3 },
  charger:        { label: 'USB Charger',     icon: '🔌', color: '#F97316', bin: 4 },
  notebook:       { label: 'Notebook',        icon: '📓', color: '#6366F1', bin: 3 },
};

export const MOCK_AI_RESULTS = [
  { type: 'plastic_bottle', condition: 'Good',      baseCoins: 20, condMult: 0.85, recycle: 0.95, co2: 0.10, confidence: 94 },
  { type: 'textbook',       condition: 'Fair',      baseCoins: 35, condMult: 0.65, recycle: 0.80, co2: 0.50, confidence: 91 },
  { type: 'pen',            condition: 'Good',      baseCoins: 8,  condMult: 0.85, recycle: 0.60, co2: 0.02, confidence: 88 },
  { type: 'cardboard',      condition: 'Excellent', baseCoins: 10, condMult: 1.00, recycle: 0.85, co2: 0.15, confidence: 96 },
  { type: 'earphones',      condition: 'Good',      baseCoins: 60, condMult: 0.85, recycle: 0.70, co2: 1.20, confidence: 82 },
  { type: 'paper_bundle',   condition: 'Good',      baseCoins: 12, condMult: 0.85, recycle: 0.90, co2: 0.08, confidence: 93 },
  { type: 'charger',        condition: 'Fair',      baseCoins: 50, condMult: 0.65, recycle: 0.70, co2: 0.90, confidence: 79 },
  { type: 'notebook',       condition: 'Good',      baseCoins: 20, condMult: 0.85, recycle: 0.80, co2: 0.30, confidence: 90 },
];

export const CONDITION_COLORS = {
  Excellent: '#00FFA3',
  Good:      '#10B981',
  Fair:      '#F59E0B',
  Poor:      '#EF4444',
  Contaminated: '#6B7280',
};

export const MOCK_TRANSACTIONS = [
  { id: 't1',  type: 'earn',  item: 'plastic_bottle', condition: 'Good',      coins: +16, date: '2024-09-06T14:23:00', machine: 'Main Block' },
  { id: 't2',  type: 'spend', item: null,              condition: null,        coins: -120,date: '2024-09-06T11:05:00', partner: 'Gazebo', voucher: 'GAZ-AB3F2C' },
  { id: 't3',  type: 'earn',  item: 'textbook',        condition: 'Fair',      coins: +18, date: '2024-09-05T16:45:00', machine: 'Library Block' },
  { id: 't4',  type: 'earn',  item: 'earphones',       condition: 'Good',      coins: +42, date: '2024-09-05T10:12:00', machine: 'AB3 Block' },
  { id: 't5',  type: 'earn',  item: 'cardboard',       condition: 'Excellent', coins: +9,  date: '2024-09-04T15:30:00', machine: 'Main Block' },
  { id: 't6',  type: 'spend', item: null,              condition: null,        coins: -50, date: '2024-09-04T09:00:00', partner: 'AB3 Canteen', voucher: 'AB3-FFDE12' },
  { id: 't7',  type: 'earn',  item: 'pen',             condition: 'Good',      coins: +4,  date: '2024-09-03T13:20:00', machine: 'Gymkhana' },
  { id: 't8',  type: 'earn',  item: 'paper_bundle',    condition: 'Good',      coins: +9,  date: '2024-09-03T11:00:00', machine: 'Library Block' },
  { id: 't9',  type: 'earn',  item: 'plastic_bottle',  condition: 'Fair',      coins: +8,  date: '2024-09-02T17:10:00', machine: 'Hostel A' },
  { id: 't10', type: 'spend', item: null,              condition: null,        coins: -100,date: '2024-09-02T08:45:00', partner: 'Library', voucher: 'LIB-3A9D45' },
  { id: 't11', type: 'earn',  item: 'charger',         condition: 'Fair',      coins: +23, date: '2024-09-01T14:55:00', machine: 'AB3 Block' },
  { id: 't12', type: 'earn',  item: 'notebook',        condition: 'Good',      coins: +14, date: '2024-09-01T10:30:00', machine: 'Main Block' },
  { id: 't13', type: 'earn',  item: 'plastic_bottle',  condition: 'Excellent', coins: +19, date: '2024-08-31T16:00:00', machine: 'Library Block' },
  { id: 't14', type: 'earn',  item: 'textbook',        condition: 'Good',      coins: +24, date: '2024-08-30T14:20:00', machine: 'Main Block' },
  { id: 't15', type: 'earn',  item: 'pen',             condition: 'Fair',      coins: +3,  date: '2024-08-29T11:45:00', machine: 'AB3 Block' },
];

export const MONTHLY_COINS = [
  { month: 'Apr', earned: 120, spent: 50  },
  { month: 'May', earned: 185, spent: 120 },
  { month: 'Jun', earned: 95,  spent: 0   },
  { month: 'Jul', earned: 220, spent: 150 },
  { month: 'Aug', earned: 310, spent: 123 },
  { month: 'Sep', earned: 310, spent: 120 },
];

export const LEADERBOARD_USERS = [
  { rank: 1,  id: 'u1',  name: 'Priya Sharma',       dept: 'ECE',  coins: 3240, items: 112, avatar: 'PS' },
  { rank: 2,  id: 'u2',  name: 'Arjun Mehta',        dept: 'CSE',  coins: 2980, items: 98,  avatar: 'AM' },
  { rank: 3,  id: 'u3',  name: 'Sneha Reddy',        dept: 'CE',   coins: 2750, items: 91,  avatar: 'SR' },
  { rank: 4,  id: 'u4',  name: 'Karthik Nair',       dept: 'ME',   coins: 2310, items: 77,  avatar: 'KN' },
  { rank: 5,  id: 'u5',  name: 'Divya Pillai',       dept: 'EE',   coins: 2100, items: 70,  avatar: 'DP' },
  { rank: 6,  id: 'u6',  name: 'Rahul Gupta',        dept: 'CSE',  coins: 1890, items: 63,  avatar: 'RG' },
  { rank: 7,  id: 'u7',  name: 'Anjali Singh',       dept: 'ECE',  coins: 1670, items: 55,  avatar: 'AS' },
  { rank: 8,  id: 'u8',  name: 'Vikram Patel',       dept: 'ME',   coins: 1540, items: 52,  avatar: 'VP' },
  { rank: 9,  id: 'u9',  name: 'Pooja Iyer',         dept: 'CE',   coins: 1320, items: 44,  avatar: 'PI' },
  { rank: 10, id: 'u10', name: 'Rohan Verma',        dept: 'CSE',  coins: 1150, items: 39,  avatar: 'RV' },
  { rank: 11, id: 'u11', name: 'Nisha Krishnan',     dept: 'EE',   coins: 980,  items: 33,  avatar: 'NK' },
  { rank: 12, id: 'u12', name: 'Siddharth Joshi',    dept: 'ME',   coins: 910,  items: 31,  avatar: 'SJ' },
  { rank: 13, id: 'u13', name: 'Varun Kumar',        dept: 'CSE',  coins: 847,  items: 38,  avatar: 'VK', isMe: true },
  { rank: 14, id: 'u14', name: 'Meera Nambiar',      dept: 'ECE',  coins: 790,  items: 27,  avatar: 'MN' },
  { rank: 15, id: 'u15', name: 'Aditya Bhatt',       dept: 'CE',   coins: 720,  items: 24,  avatar: 'AB' },
];

export const WEEKLY_LEADERBOARD = [
  { rank: 1,  name: 'Arjun Mehta',     dept: 'CSE', coins: 187, items: 12, avatar: 'AM' },
  { rank: 2,  name: 'Priya Sharma',    dept: 'ECE', coins: 165, items: 10, avatar: 'PS' },
  { rank: 3,  name: 'Varun Kumar',     dept: 'CSE', coins: 140, items: 9,  avatar: 'VK', isMe: true },
  { rank: 4,  name: 'Divya Pillai',    dept: 'EE',  coins: 112, items: 7,  avatar: 'DP' },
  { rank: 5,  name: 'Karthik Nair',    dept: 'ME',  coins: 98,  items: 6,  avatar: 'KN' },
  { rank: 6,  name: 'Anjali Singh',    dept: 'ECE', coins: 87,  items: 5,  avatar: 'AS' },
  { rank: 7,  name: 'Rohan Verma',     dept: 'CSE', coins: 76,  items: 5,  avatar: 'RV' },
  { rank: 8,  name: 'Sneha Reddy',     dept: 'CE',  coins: 65,  items: 4,  avatar: 'SR' },
];

export const FORUM_POSTS = [
  {
    id: 'p1', topic: 'Eco Tips', likes: 24, comments: 8, timeAgo: '2h ago',
    author: { name: 'Priya Sharma', dept: 'ECE', avatar: 'PS' },
    title: '5 tips to get maximum E-Coins from plastic bottles',
    body: 'I\'ve been using EcoDrop for 2 months and discovered that rinsing your bottles before depositing can bump your condition rating from "Fair" to "Good" — that\'s almost double the coins! Here are all 5 tips I\'ve found...',
    commentsList: [
      { id: 'c1', author: 'Arjun Mehta', avatar: 'AM', body: 'This is super helpful! I didn\'t know rinsing made a difference.', timeAgo: '1h ago' },
      { id: 'c2', author: 'Varun Kumar', avatar: 'VK', body: 'Thanks Priya! Just tried it and got 19 coins for a bottle 🎉', timeAgo: '45m ago' },
    ],
  },
  {
    id: 'p2', topic: 'Campus News', likes: 18, comments: 5, timeAgo: '4h ago',
    author: { name: 'Sneha Reddy', dept: 'CE', avatar: 'SR' },
    title: 'New EcoDrop machine installed at Hostel Block A! 🎉',
    body: 'Just spotted a brand new EcoDrop machine outside Hostel Block A near the common room. It\'s faster than the Main Block one. Go check it out!',
    commentsList: [
      { id: 'c3', author: 'Karthik Nair', avatar: 'KN', body: 'Yes! Tried it this morning. Super quick!', timeAgo: '3h ago' },
    ],
  },
  {
    id: 'p3', topic: 'General', likes: 45, comments: 12, timeAgo: '1d ago',
    author: { name: 'Arjun Mehta', dept: 'CSE', avatar: 'AM' },
    title: 'Just hit Gold rank! Here\'s my recycling journey 🏆',
    body: 'Started in August with 0 coins. Today I hit Gold rank (2980 coins). My most profitable items: earphones (42 coins each!), textbooks in good condition (24 coins), and consistent plastic bottles. The streak bonus is key — don\'t miss a day!',
    commentsList: [
      { id: 'c4', author: 'Priya Sharma', avatar: 'PS', body: 'Congratulations! See you at Platinum soon 😄', timeAgo: '20h ago' },
      { id: 'c5', author: 'Varun Kumar',  avatar: 'VK', body: 'Inspiring! I\'m at Gold too now. Race to Platinum?', timeAgo: '15h ago' },
    ],
  },
  {
    id: 'p4', topic: 'Challenges', likes: 31, comments: 9, timeAgo: '2d ago',
    author: { name: 'Divya Pillai', dept: 'EE', avatar: 'DP' },
    title: 'Weekly Challenge COMPLETED ✅ — Recycled 5 plastic bottles!',
    body: 'Finally completed this week\'s challenge. 100 bonus coins credited instantly. The challenge system really pushes you to be more consistent. Who else finished it?',
    commentsList: [],
  },
  {
    id: 'p5', topic: 'Eco Tips', likes: 16, comments: 4, timeAgo: '2d ago',
    author: { name: 'Karthik Nair', dept: 'ME', avatar: 'KN' },
    title: 'Did you know? Cardboard has 85% recyclability rating in EcoDrop',
    body: 'Ran some tests — cardboard in excellent condition gives 8.5 coins per 100g. If you have old boxes from deliveries, flatten them and bring them in. I brought 3 big boxes and got 34 coins in one go!',
    commentsList: [],
  },
  {
    id: 'p6', topic: 'Campus News', likes: 22, comments: 7, timeAgo: '3d ago',
    author: { name: 'Anjali Singh', dept: 'ECE', avatar: 'AS' },
    title: 'Gymkhana 3-day pass is incredible value at 400 coins',
    body: 'Redeemed the Gymkhana 3-day pass this weekend. Entry is normally ₹150/day so you\'re getting ₹450 worth for just 400 coins. At current earning rates that\'s about 25 plastic bottles. 100% recommend.',
    commentsList: [],
  },
  {
    id: 'p7', topic: 'General', likes: 8, comments: 3, timeAgo: '4d ago',
    author: { name: 'Rahul Gupta', dept: 'CSE', avatar: 'RG' },
    title: 'The AI actually identified my old Nokia charger correctly! 😮',
    body: 'Wasn\'t sure if the machine would recognize a 15-year-old Nokia charger. It identified it as "USB Charger (E-waste)" with 89% confidence and gave me 23 coins. The AI is impressive for edge cases.',
    commentsList: [],
  },
  {
    id: 'p8', topic: 'Eco Tips', likes: 12, comments: 2, timeAgo: '5d ago',
    author: { name: 'Rohan Verma', dept: 'CSE', avatar: 'RV' },
    title: 'Best time to use EcoDrop: early morning (less wait time)',
    body: 'Noticed the machines are almost always free between 7-8 AM. Session completes in under 60 seconds at that time. Afternoon queues can be 3-4 people. Plan accordingly!',
    commentsList: [],
  },
];

export const MOCK_VOUCHERS = [
  { id: 'v1', partner: 'Gazebo',     icon: '🍔', desc: '₹50 Off Any Order',    code: 'GAZ-AB3F2C', status: 'active',  expiry: '2024-10-06', coins: 120 },
  { id: 'v2', partner: 'AB3 Canteen',icon: '🍱', desc: '₹20 Off Any Order',    code: 'AB3-FFDE12', status: 'active',  expiry: '2024-10-06', coins: 50  },
  { id: 'v3', partner: 'Library',    icon: '📚', desc: 'Fine Waiver (₹50)',     code: 'LIB-3A9D45', status: 'used',    expiry: '2024-12-02', coins: 100 },
  { id: 'v4', partner: 'North Square',icon:'🍕', desc: '₹20 Off Any Order',    code: 'NSQ-9BC123', status: 'expired', expiry: '2024-09-01', coins: 50  },
  { id: 'v5', partner: 'Gymkhana',   icon: '🏋️', desc: '1-Day Gym Pass',       code: 'GYM-7F4E89', status: 'active',  expiry: '2024-09-13', coins: 150 },
];

export const REWARDS_CATALOG = [
  { id: 'r1',  partner: 'Gazebo',      icon: '🍔', desc: '₹20 Off Any Order',       coins: 50,  category: 'food'     },
  { id: 'r2',  partner: 'Gazebo',      icon: '🍔', desc: '₹50 Off Any Order',       coins: 120, category: 'food'     },
  { id: 'r3',  partner: 'Gazebo',      icon: '🍔', desc: '₹100 Off Any Order',      coins: 220, category: 'food'     },
  { id: 'r4',  partner: 'North Square',icon: '🍕', desc: '₹20 Off Any Order',       coins: 50,  category: 'food'     },
  { id: 'r5',  partner: 'North Square',icon: '🍕', desc: '₹50 Off Any Order',       coins: 120, category: 'food'     },
  { id: 'r6',  partner: 'North Square',icon: '🍕', desc: '₹100 Off Any Order',      coins: 220, category: 'food'     },
  { id: 'r7',  partner: 'Hunger',      icon: '🥗', desc: '₹20 Off Any Order',       coins: 50,  category: 'food'     },
  { id: 'r8',  partner: 'Hunger',      icon: '🥗', desc: '₹50 Off Any Order',       coins: 120, category: 'food'     },
  { id: 'r9',  partner: 'Gymkhana',    icon: '🏋️', desc: '1-Day Gym Pass',          coins: 150, category: 'sports'   },
  { id: 'r10', partner: 'Gymkhana',    icon: '🏋️', desc: '3-Day Gym Pass',          coins: 400, category: 'sports'   },
  { id: 'r11', partner: 'AB3 Canteen', icon: '🍱', desc: '₹20 Off Any Order',       coins: 50,  category: 'food'     },
  { id: 'r12', partner: 'AB3 Canteen', icon: '🍱', desc: '₹50 Off Any Order',       coins: 120, category: 'food'     },
  { id: 'r13', partner: 'Library',     icon: '📚', desc: 'Fine Waiver (up to ₹50)', coins: 100, category: 'academic' },
  { id: 'r14', partner: 'Campus Store',icon: '🛒', desc: '₹50 Off Stationery',      coins: 100, category: 'shopping' },
  { id: 'r15', partner: 'Campus Store',icon: '🛒', desc: '₹100 Off Stationery',     coins: 200, category: 'shopping' },
];

export const ACHIEVEMENTS = [
  { id: 'a1', key: 'first_deposit',     icon: '🌱', label: 'First Deposit',         desc: 'Made your first deposit',              earned: true  },
  { id: 'a2', key: 'plastic_champion',  icon: '🧴', label: 'Plastic Champion',      desc: 'Recycled 10 plastic bottles',          earned: true  },
  { id: 'a3', key: 'bookworm',          icon: '📚', label: 'Bookworm',              desc: 'Deposited 5 books',                    earned: true  },
  { id: 'a4', key: 'e_warrior',         icon: '⚡', label: 'E-Warrior',             desc: 'Recycled 3 e-waste items',             earned: true  },
  { id: 'a5', key: 'week_streak',       icon: '🔥', label: 'Week Streak',           desc: 'Recycled for 7 consecutive days',      earned: false },
  { id: 'a6', key: 'top10',            icon: '🏆', label: 'Top 10 Campus',         desc: 'Reached top 10 on campus leaderboard', earned: false },
  { id: 'a7', key: 'carbon_saver',     icon: '🌍', label: 'Carbon Saver',          desc: 'Saved 5kg CO₂ equivalent',             earned: false },
  { id: 'a8', key: 'community_voice',  icon: '💬', label: 'Community Voice',       desc: 'Posted 5 forum topics',                earned: false },
  { id: 'a9', key: 'coin_hoarder',     icon: '🪙', label: 'Coin Hoarder',          desc: 'Accumulated 1000 coins at once',       earned: false },
  { id: 'a10',key: 'eco_champion',     icon: '🌟', label: 'Eco Champion',          desc: 'Reached Platinum rank',                earned: false },
];

export const MACHINES = [
  { id: 'MACH_001', name: 'EcoDrop #001', location: 'Main Block Entrance',  status: 'active',      distance: '50m'  },
  { id: 'MACH_002', name: 'EcoDrop #002', location: 'Library Block',        status: 'active',      distance: '120m' },
  { id: 'MACH_003', name: 'EcoDrop #003', location: 'AB3 Block Corridor',   status: 'maintenance', distance: '200m' },
  { id: 'MACH_004', name: 'EcoDrop #004', location: 'Gymkhana Entry',       status: 'active',      distance: '350m' },
  { id: 'MACH_005', name: 'EcoDrop #005', location: 'Hostel Block A',       status: 'active',      distance: '480m' },
];

export const CAMPUS_STATS = {
  itemsToday: 342,
  co2Today: 28.5,
  coinsToday: 4820,
  totalUsers: 1247,
  totalItemsAllTime: 18432,
  totalCo2AllTime: 1543.2,
};

export const ITEM_CO2 = {
  plastic_bottle: 0.10,
  textbook:       0.50,
  pen:            0.02,
  cardboard:      0.15,
  earphones:      1.20,
  paper_bundle:   0.08,
  charger:        0.90,
  notebook:       0.30,
};
