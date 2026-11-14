import { Game } from './types';

export const MOCK_GAMES: Game[] = [
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    category: 'MOBA',
    image: '/mlbb.webp',
    isFlashSale: true,
    discount: 30,
    nominals: [
      { id: 'ml-1', amount: '3 Diamonds', price: 1500 },
      { id: 'ml-2', amount: '19 Diamonds', price: 6000 },
      { id: 'ml-3', amount: '36 Diamonds', price: 10000 },
      { id: 'ml-4', amount: '86 Diamonds', price: 22000 },
      { id: 'ml-5', amount: '172 Diamonds', price: 44000 },
      { id: 'ml-6', amount: '257 Diamonds', price: 65000 },
      { id: 'ml-7', amount: '344 Diamonds', price: 88000 },
      { id: 'ml-8', amount: '514 Diamonds', price: 130000 },
      { id: 'ml-9', amount: '706 Diamonds', price: 175000 },
      { id: 'ml-10', amount: '963 Diamonds', price: 240000 },
      { id: 'ml-11', amount: '1412 Diamonds', price: 350000 },
      { id: 'ml-12', amount: 'Weekly Diamond Pass', price: 28000 },
      { id: 'ml-13', amount: 'Twilight Pass', price: 150000 }
    ]
  },
  {
    id: 'pb',
    name: 'Point Blank',
    category: 'FPS',
    image: '/pb.avif',
    isFlashSale: true,
    discount: 25,
    nominals: [
      { id: 'pb-1', amount: '1.200 Cash', price: 10000 },
      { id: 'pb-2', amount: '2.400 Cash', price: 20000 },
      { id: 'pb-3', amount: '6.000 Cash', price: 50000 },
      { id: 'pb-4', amount: '12.000 Cash', price: 100000 },
      { id: 'pb-5', amount: '24.000 Cash', price: 200000 },
      { id: 'pb-6', amount: '36.000 Cash', price: 300000 },
      { id: 'pb-7', amount: '60.000 Cash', price: 500000 }
    ]
  },
  {
    id: 'ff',
    name: 'Free Fire',
    category: 'Battle Royale',
    image: '/ff.webp',
    isFlashSale: true,
    discount: 20,
    nominals: [
      { id: 'ff-1', amount: '5 Diamonds', price: 1000 },
      { id: 'ff-2', amount: '50 Diamonds', price: 8000 },
      { id: 'ff-3', amount: '140 Diamonds', price: 20000 },
      { id: 'ff-4', amount: '355 Diamonds', price: 50000 },
      { id: 'ff-5', amount: '720 Diamonds', price: 100000 },
      { id: 'ff-6', amount: '1450 Diamonds', price: 200000 },
      { id: 'ff-7', amount: '3640 Diamonds', price: 500000 },
      { id: 'ff-8', amount: 'Membership Mingguan', price: 30000 },
      { id: 'ff-9', amount: 'Membership Bulanan', price: 115000 }
    ]
  },
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    category: 'Battle Royale',
    image: '/pubg.webp',
    isFlashSale: false,
    discount: 0,
    nominals: [
      { id: 'pubg-1', amount: '60 UC', price: 15000 },
      { id: 'pubg-2', amount: '325 UC', price: 75000 },
      { id: 'pubg-3', amount: '660 UC', price: 150000 },
      { id: 'pubg-4', amount: '1800 UC', price: 400000 },
      { id: 'pubg-5', amount: '3850 UC', price: 750000 },
      { id: 'pubg-6', amount: '8100 UC', price: 1500000 },
      { id: 'pubg-7', amount: 'Royale Pass Elite', price: 150000 },
      { id: 'pubg-8', amount: 'Royale Pass Plus', price: 380000 }
    ]
  },
  {
    id: 'valo',
    name: 'Valorant',
    category: 'FPS',
    image: '/valo.webp',
    isFlashSale: false,
    discount: 0,
    nominals: [
      { id: 'val-1', amount: '125 VP', price: 15000 },
      { id: 'val-2', amount: '425 VP', price: 50000 },
      { id: 'val-3', amount: '475 VP', price: 55000 },
      { id: 'val-4', amount: '1000 VP', price: 110000 },
      { id: 'val-5', amount: '2050 VP', price: 220000 },
      { id: 'val-6', amount: '3650 VP', price: 385000 },
      { id: 'val-7', amount: '5350 VP', price: 550000 },
      { id: 'val-8', amount: '11000 VP', price: 1100000 }
    ]
  },
  {
    id: 'genshin',
    name: 'Genshin Impact',
    category: 'RPG',
    image: '/genshin.avif',
    isFlashSale: false,
    discount: 0,
    nominals: [
      { id: 'gi-1', amount: '60 Genesis Crystals', price: 16000 },
      { id: 'gi-2', amount: '300 Genesis Crystals', price: 79000 },
      { id: 'gi-3', amount: '980 Genesis Crystals', price: 249000 },
      { id: 'gi-4', amount: '1980 Genesis Crystals', price: 479000 },
      { id: 'gi-5', amount: '3280 Genesis Crystals', price: 799000 },
      { id: 'gi-6', amount: '6480 Genesis Crystals', price: 1599000 },
      { id: 'gi-7', amount: 'Blessing of Welkin Moon', price: 79000 }
    ]
  },
  {
    id: 'hsr',
    name: 'Honkai: Star Rail',
    category: 'RPG',
    image: '/hsr.jpg',
    isFlashSale: false,
    discount: 0,
    nominals: [
      { id: 'hsr-1', amount: '60 Oneiric Shards', price: 16000 },
      { id: 'hsr-2', amount: '300 Oneiric Shards', price: 79000 },
      { id: 'hsr-3', amount: '980 Oneiric Shards', price: 249000 },
      { id: 'hsr-4', amount: '1980 Oneiric Shards', price: 479000 },
      { id: 'hsr-5', amount: '3280 Oneiric Shards', price: 799000 },
      { id: 'hsr-6', amount: '6480 Oneiric Shards', price: 1599000 },
      { id: 'hsr-7', amount: 'Express Supply Pass', price: 79000 }
    ]
  },
  {
    id: 'codm',
    name: 'Call of Duty: Mobile',
    category: 'FPS',
    image: '/codm.jpg',
    isFlashSale: false,
    discount: 0,
    nominals: [
      { id: 'codm-1', amount: '31 CP', price: 5000 },
      { id: 'codm-2', amount: '62 CP', price: 10000 },
      { id: 'codm-3', amount: '131 CP', price: 20000 },
      { id: 'codm-4', amount: '321 CP', price: 50000 },
      { id: 'codm-5', amount: '675 CP', price: 100000 },
      { id: 'codm-6', amount: '1410 CP', price: 200000 },
      { id: 'codm-7', amount: '3780 CP', price: 500000 }
    ]
  },
  {
    id: 'roblox',
    name: 'Roblox',
    category: 'RPG',
    image: '/roblox.jpg',
    isFlashSale: true,
    discount: 10,
    nominals: [
      { id: 'rbx-1', amount: '400 Robux', price: 75000 },
      { id: 'rbx-2', amount: '800 Robux', price: 150000 },
      { id: 'rbx-3', amount: '1700 Robux', price: 300000 },
      { id: 'rbx-4', amount: '4500 Robux', price: 750000 },
      { id: 'rbx-5', amount: '10000 Robux', price: 1500000 }
    ]
  },
  {
    id: 'hok',
    name: 'Honor of Kings',
    category: 'MOBA',
    image: '/hok.webp',
    isFlashSale: true,
    discount: 15,
    nominals: [
      { id: 'hok-1', amount: '8 Tokens', price: 2000 },
      { id: 'hok-2', amount: '80 Tokens', price: 16000 },
      { id: 'hok-3', amount: '240 Tokens', price: 48000 },
      { id: 'hok-4', amount: '400 Tokens', price: 80000 },
      { id: 'hok-5', amount: '800 Tokens', price: 160000 },
      { id: 'hok-6', amount: '1200 Tokens', price: 240000 },
      { id: 'hok-7', amount: '2400 Tokens', price: 480000 }
    ]
  },
  {
    id: 'efootball',
    name: 'eFootball 2026',
    category: 'Sports',
    image: '/efootball.webp',
    isFlashSale: false,
    discount: 0,
    nominals: [
      { id: 'ef-1', amount: '130 eFootball Coins', price: 16000 },
      { id: 'ef-2', amount: '550 eFootball Coins', price: 65000 },
      { id: 'ef-3', amount: '1040 eFootball Coins', price: 125000 },
      { id: 'ef-4', amount: '2130 eFootball Coins', price: 240000 },
      { id: 'ef-5', amount: '3250 eFootball Coins', price: 360000 },
      { id: 'ef-6', amount: '5700 eFootball Coins', price: 600000 }
    ]
  }
];