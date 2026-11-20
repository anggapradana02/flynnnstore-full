const fs = require('fs');
const path = require('path');
const { resolveGamePrice } = require('../catalog');
const { loadApiGamesProducts } = require('./apigames-products');
const ORDER_ADAPTER_SPEC = require('../data/apigames-order-adapter.json');

const DEFAULT_PRODUCT_MAP_PATH = path.join(__dirname, '..', 'data', 'apigames-product-map.json');

const loadApiGamesProductMap = (filePath = process.env.APIGAMES_PRODUCT_MAP_PATH || DEFAULT_PRODUCT_MAP_PATH) => {
    const resolvedPath = path.resolve(filePath);
    let rawMap;

    try {
        rawMap = fs.readFileSync(resolvedPath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`File mapping produk ApiGames tidak ditemukan: ${resolvedPath}`);
        }
        throw error;
    }

    try {
        const parsed = JSON.parse(rawMap);
        if (!Array.isArray(parsed.entries)) {
            throw new Error('Mapping produk harus memiliki array entries');
        }
        return parsed.entries;
    } catch (error) {
        throw new Error(`File mapping produk ApiGames tidak valid: ${resolvedPath}`);
    }
};

const resolveApiGamesOrderProduct = ({
    gameName,
    nominalName,
    promoCode,
    products = loadApiGamesProducts(),
    mappings = loadApiGamesProductMap()
}) => {
    const retail = resolveGamePrice(gameName, nominalName, promoCode);
    if (!retail) {
        return {
            success: false,
            code: 'INVALID_CATALOG_ITEM',
            message: 'Game atau nominal tidak tersedia di katalog.'
        };
    }

    const matches = mappings.filter((entry) =>
        entry.game_name === String(gameName || '').trim() &&
        entry.nominal === String(nominalName || '').trim()
    );
    if (matches.length !== 1) {
        return {
            success: false,
            code: 'MAPPING_NOT_CONFIGURED',
            message: 'Pemetaan produk ApiGames untuk game dan nominal ini belum dikonfigurasi.'
        };
    }

    const mapping = matches[0];
    if (
        !mapping.product_code ||
        mapping.operator_id === null ||
        mapping.operator_id === undefined ||
        mapping.operator_id === '' ||
        !Number.isInteger(Number(mapping.operator_id)) ||
        Number(mapping.operator_id) <= 0
    ) {
        return {
            success: false,
            code: mapping.mapping_status || 'MAPPING_NOT_CONFIGURED',
            message: 'Produk ini belum memiliki pilihan operator dan kode produk yang disetujui.'
        };
    }

    const matchingProducts = products.filter((product) =>
        product.status === 'aktif' &&
        product.product_code === mapping.product_code &&
        String(product.operator_id) === String(mapping.operator_id)
    );
    if (matchingProducts.length !== 1) {
        return {
            success: false,
            code: 'MAPPING_PRODUCT_INVALID',
            message: 'Pemetaan tidak menunjuk ke satu produk aktif yang valid.'
        };
    }

    const product = matchingProducts[0];
    const costUnit = Number(product.harga_unit);
    const costRupiah = Number(product.harga_rupiah);
    if (!Number.isFinite(costUnit) || costUnit <= 0 || !Number.isFinite(costRupiah) || costRupiah <= 0) {
        return {
            success: false,
            code: 'MAPPING_PRODUCT_INVALID',
            message: 'Data harga produk ApiGames tidak valid.'
        };
    }

    return {
        success: true,
        productCode: product.product_code,
        operatorId: Number(product.operator_id),
        productName: product.product_name,
        costUnit,
        costRupiah,
        retailBasePrice: retail.basePrice,
        retailPrice: retail.finalPrice
    };
};

const hasConfiguredParameters = (parameters) => Array.isArray(parameters) &&
    parameters.every((parameter) => parameter.required === false ||
        (parameter.required === true && Boolean(parameter.source) &&
            Boolean(parameter.location) && Boolean(parameter.name)));

const isConfiguredSignature = (signature) => {
    if (!signature || typeof signature.required !== 'boolean') return false;
    if (!signature.required) return true;
    return Boolean(
        signature.algorithm &&
        signature.inputTemplate &&
        signature.location &&
        signature.name &&
        signature.encoding
    );
};

const getApiGamesOrderConfig = (env = process.env, spec = ORDER_ADAPTER_SPEC) => {
    const endpoint = spec.endpoint || {};
    const request = spec.request || {};
    const response = spec.response || {};
    const statusValues = response.statusValues || {};
    const contractConfirmed = spec.contractConfirmed === true &&
        env.APIGAMES_ORDER_CONTRACT_CONFIRMED === 'true';
    const responseConfigured = Boolean(response.statusField) &&
        Array.isArray(statusValues.success) && statusValues.success.length > 0 &&
        Array.isArray(statusValues.failure) && statusValues.failure.length > 0;
    const adapterConfigured = Boolean(endpoint.baseUrl && endpoint.path && endpoint.method) &&
        hasConfiguredParameters(request.parameters) &&
        isConfiguredSignature(request.signature) &&
        responseConfigured;

    return {
        endpoint: {
            baseUrl: String(endpoint.baseUrl || '').trim(),
            path: String(endpoint.path || '').trim()
        },
        method: String(endpoint.method || '').trim().toUpperCase(),
        request,
        response,
        contractConfirmed,
        readyForAdapter: contractConfirmed && adapterConfigured,
        liveSubmissionEnabled: false
    };
};

const mapApiGamesStatus = (providerStatus, response = ORDER_ADAPTER_SPEC.response) => {
    const status = String(providerStatus ?? '').trim().toLowerCase();
    const values = response.statusValues || {};
    const containsStatus = (mappedValues) => Array.isArray(mappedValues) &&
        mappedValues.some((value) => String(value).trim().toLowerCase() === status);

    if (containsStatus(values.success)) return 'Success';
    if (containsStatus(values.failure)) return 'Canceled';
    return 'Pending';
};

module.exports = {
    getApiGamesOrderConfig,
    loadApiGamesProductMap,
    mapApiGamesStatus,
    resolveApiGamesOrderProduct
};
