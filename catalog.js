const games = {
    'Mobile Legends': {
        discount: 30,
        skuPrefix: 'ml',
        nominals: [
            ['3 Diamonds', 1500], ['19 Diamonds', 6000], ['36 Diamonds', 10000],
            ['86 Diamonds', 22000], ['172 Diamonds', 44000], ['257 Diamonds', 65000],
            ['344 Diamonds', 88000], ['514 Diamonds', 130000], ['706 Diamonds', 175000],
            ['963 Diamonds', 240000], ['1412 Diamonds', 350000],
            ['Weekly Diamond Pass', 28000], ['Twilight Pass', 150000]
        ]
    },
    'Point Blank': {
        discount: 25,
        skuPrefix: 'pb',
        nominals: [
            ['1.200 Cash', 10000], ['2.400 Cash', 20000], ['6.000 Cash', 50000],
            ['12.000 Cash', 100000], ['24.000 Cash', 200000],
            ['36.000 Cash', 300000], ['60.000 Cash', 500000]
        ]
    },
    'Free Fire': {
        discount: 20,
        skuPrefix: 'ff',
        nominals: [
            ['5 Diamonds', 1000], ['50 Diamonds', 8000], ['140 Diamonds', 20000],
            ['355 Diamonds', 50000], ['720 Diamonds', 100000], ['1450 Diamonds', 200000],
            ['3640 Diamonds', 500000], ['Membership Mingguan', 30000],
            ['Membership Bulanan', 115000]
        ]
    },
    'PUBG Mobile': {
        discount: 0,
        skuPrefix: 'pubg',
        nominals: [
            ['60 UC', 15000], ['325 UC', 75000], ['660 UC', 150000],
            ['1800 UC', 400000], ['3850 UC', 750000], ['8100 UC', 1500000],
            ['Royale Pass Elite', 150000], ['Royale Pass Plus', 380000]
        ]
    },
    'Valorant': {
        discount: 0,
        skuPrefix: 'val',
        nominals: [
            ['125 VP', 15000], ['425 VP', 50000], ['475 VP', 55000],
            ['1000 VP', 110000], ['2050 VP', 220000], ['3650 VP', 385000],
            ['5350 VP', 550000], ['11000 VP', 1100000]
        ]
    },
    'Genshin Impact': {
        discount: 0,
        skuPrefix: 'gi',
        nominals: [
            ['60 Genesis Crystals', 16000], ['300 Genesis Crystals', 79000],
            ['980 Genesis Crystals', 249000], ['1980 Genesis Crystals', 479000],
            ['3280 Genesis Crystals', 799000], ['6480 Genesis Crystals', 1599000],
            ['Blessing of Welkin Moon', 79000]
        ]
    },
    'Honkai: Star Rail': {
        discount: 0,
        skuPrefix: 'hsr',
        nominals: [
            ['60 Oneiric Shards', 16000], ['300 Oneiric Shards', 79000],
            ['980 Oneiric Shards', 249000], ['1980 Oneiric Shards', 479000],
            ['3280 Oneiric Shards', 799000], ['6480 Oneiric Shards', 1599000],
            ['Express Supply Pass', 79000]
        ]
    },
    'Call of Duty: Mobile': {
        discount: 0,
        skuPrefix: 'codm',
        nominals: [
            ['31 CP', 5000], ['62 CP', 10000], ['131 CP', 20000],
            ['321 CP', 50000], ['675 CP', 100000], ['1410 CP', 200000],
            ['3780 CP', 500000]
        ]
    },
    'Roblox': {
        discount: 10,
        skuPrefix: 'rbx',
        nominals: [
            ['400 Robux', 75000], ['800 Robux', 150000], ['1700 Robux', 300000],
            ['4500 Robux', 750000], ['10000 Robux', 1500000]
        ]
    },
    'Honor of Kings': {
        discount: 15,
        skuPrefix: 'hok',
        nominals: [
            ['8 Tokens', 2000], ['80 Tokens', 16000], ['240 Tokens', 48000],
            ['400 Tokens', 80000], ['800 Tokens', 160000],
            ['1200 Tokens', 240000], ['2400 Tokens', 480000]
        ]
    },
    'eFootball 2026': {
        discount: 0,
        skuPrefix: 'ef',
        nominals: [
            ['130 eFootball Coins', 16000], ['550 eFootball Coins', 65000],
            ['1040 eFootball Coins', 125000], ['2130 eFootball Coins', 240000],
            ['3250 eFootball Coins', 360000], ['5700 eFootball Coins', 600000]
        ]
    }
};

const resolveGamePrice = (gameName, nominalName, promoCode) => {
    const game = games[String(gameName || '').trim()];
    if (!game) return null;

    const nominal = game.nominals.find(([name]) => name === String(nominalName || '').trim());
    if (!nominal) return null;

    const discountedPrice = Math.round(nominal[1] * (1 - game.discount / 100));
    const promoDiscount = String(promoCode || '').trim().toUpperCase() === 'ANGGATAMPAN'
        ? 10000
        : 0;

    return {
        basePrice: nominal[1],
        finalPrice: Math.max(0, discountedPrice - promoDiscount),
        skuPrefix: game.skuPrefix
    };
};

module.exports = { games, resolveGamePrice };
