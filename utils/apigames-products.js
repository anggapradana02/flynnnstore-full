const fs = require('fs');
const path = require('path');

const DEFAULT_PRODUCTS_PATH = path.join(__dirname, '..', 'data', 'apigames-products.json');
const PRODUCT_CODE_FIELDS = ['product_code', 'productCode', 'kode_produk', 'kodeProduk', 'sku', 'code'];
const GAME_FIELDS = ['game_code', 'gameCode', 'game_name', 'game', 'category', 'kategori'];
const NAME_FIELDS = ['product_name', 'productName', 'nama_produk', 'namaProduk', 'name', 'nama', 'title', 'description'];

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const readFirstString = (record, fields) => {
    for (const field of fields) {
        if (typeof record[field] === 'string' && record[field].trim()) {
            return record[field].trim();
        }
    }
    return '';
};

const normalizeSearchTokens = (value) => String(value || '')
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.map((token) => token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token) || [];

const normalizeSearchText = (value) => normalizeSearchTokens(value).join('');
const hasTokenSequence = (tokens, sequence) => sequence.length > 0 &&
    tokens.some((_, index) => sequence.every((token, offset) => tokens[index + offset] === token));

const collectProductRows = (value, rows = []) => {
    if (Array.isArray(value)) {
        for (const item of value) collectProductRows(item, rows);
        return rows;
    }

    if (!value || typeof value !== 'object') return rows;

    if (PRODUCT_CODE_FIELDS.some((field) => typeof value[field] === 'string') &&
        (GAME_FIELDS.some((field) => typeof value[field] === 'string') ||
            NAME_FIELDS.some((field) => typeof value[field] === 'string'))) {
        rows.push(value);
        return rows;
    }

    for (const [key, nestedValue] of Object.entries(value)) {
        if (['data', 'products', 'produk', 'items', 'result'].includes(key.toLowerCase())) {
            collectProductRows(nestedValue, rows);
        }
    }
    return rows;
};

const getGameAliases = (gameName) => {
    const normalized = normalize(gameName);
    if (['mobilelegend', 'mobilelegends', 'mlbb'].includes(normalized)) {
        return ['mobilelegend', 'mobilelegends', 'mlbb'];
    }
    if (['freefire', 'ff'].includes(normalized)) {
        return ['freefire', 'ff'];
    }
    return [normalized];
};

const findApiGamesProductCandidates = (productsJson, gameName, nominalName, options = {}) => {
    const games = getGameAliases(gameName).filter(Boolean);
    const nominal = normalizeSearchTokens(nominalName);
    if (!games.length || !nominal) return [];

    return collectProductRows(productsJson).filter((product) => {
        const productCode = readFirstString(product, PRODUCT_CODE_FIELDS);
        if (!productCode) return false;
        if (typeof product.status === 'string' && product.status.trim().toLowerCase() !== 'aktif') {
            return false;
        }
        if (
            options.operatorId !== undefined &&
            String(product.operator_id ?? product.operatorId) !== String(options.operatorId)
        ) {
            return false;
        }

        const gameText = GAME_FIELDS
            .map((field) => product[field])
            .filter((value) => typeof value === 'string')
            .map(normalizeSearchText)
            .join(' ');
        const nameValues = NAME_FIELDS
            .map((field) => product[field])
            .filter((value) => typeof value === 'string');
        const nameText = nameValues.map(normalizeSearchText).join(' ');
        const nameTokens = nameValues.flatMap(normalizeSearchTokens);
        const allText = `${gameText} ${nameText}`;
        const gameMatches = games.some((alias) => gameText.includes(alias) || nameText.includes(alias));
        const nominalMatches = hasTokenSequence(nameTokens, nominal);
        return gameMatches && nominalMatches && Boolean(allText.trim());
    });
};

const resolveApiGamesProductCode = (productsJson, gameName, nominalName, options = {}) => {
    const matches = findApiGamesProductCandidates(productsJson, gameName, nominalName, options);
    if (matches.length !== 1) return null;
    return readFirstString(matches[0], PRODUCT_CODE_FIELDS);
};

const loadApiGamesProducts = (filePath = process.env.APIGAMES_PRODUCTS_JSON_PATH || DEFAULT_PRODUCTS_PATH) => {
    const resolvedPath = path.resolve(filePath);
    let rawProducts;

    try {
        rawProducts = fs.readFileSync(resolvedPath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File JSON produk ApiGames tidak ditemukan: ${resolvedPath}`);
        }
        throw error;
    }

    try {
        return JSON.parse(rawProducts);
    } catch (error) {
        throw new Error(`File JSON produk ApiGames tidak valid: ${resolvedPath}`);
    }
};

module.exports = {
    collectProductRows,
    findApiGamesProductCandidates,
    loadApiGamesProducts,
    resolveApiGamesProductCode
};
