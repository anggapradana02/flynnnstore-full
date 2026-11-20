const crypto = require('crypto');
const express = require('express');
const axios = require('axios');

const router = express.Router();
const APIGAMES_BASE_URL = 'https://v1.apigames.id';
const APIGAMES_TIMEOUT_MS = 8000;

const resolveGameCode = (gameCode) => {
    const normalized = String(gameCode || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (['mobilelegend', 'mobilelegends', 'mlbb'].includes(normalized)) {
        return 'mobilelegend';
    }
    if (['freefire', 'ff'].includes(normalized)) {
        return 'freefire';
    }
    return null;
};

const sendError = (res, status, message) => res.status(status).json({
    success: false,
    message
});

const isTlsError = (code = '') => /(?:CERT|TLS|SSL|SELF_SIGNED)/i.test(code);

router.post('/check-username', async (req, res) => {
    const { gameCode, userId, zoneId } = req.body || {};
    const cleanUserId = String(userId || '').trim();
    const cleanZoneId = String(zoneId || '').trim();
    const apiGameCode = resolveGameCode(gameCode);

    if (!cleanUserId) {
        return sendError(res, 400, 'User ID wajib diisi!');
    }
    if (cleanUserId.length > 64 || cleanZoneId.length > 32) {
        return sendError(res, 400, 'User ID atau Zone ID terlalu panjang.');
    }
    if (!apiGameCode) {
        return sendError(res, 400, 'Cek nickname saat ini hanya tersedia untuk Mobile Legends dan Free Fire.');
    }
    if (apiGameCode === 'mobilelegend' && !cleanZoneId) {
        return sendError(res, 400, 'Zone ID wajib diisi untuk Mobile Legends.');
    }

    const merchantId = process.env.APIGAMES_MERCHANT_ID;
    const secretKey = process.env.APIGAMES_SECRET_KEY;
    if (!merchantId || !secretKey) {
        return sendError(res, 503, 'Layanan cek akun game belum dikonfigurasi.');
    }

    const accountId = apiGameCode === 'mobilelegend'
        ? `${cleanUserId}(${cleanZoneId})`
        : cleanUserId;
    const signature = crypto
        .createHash('md5')
        .update(`${merchantId}${secretKey}`)
        .digest('hex');
    const endpoint = `${APIGAMES_BASE_URL}/merchant/${encodeURIComponent(merchantId)}/cek-username/${apiGameCode}`;

    try {
        const response = await axios.get(endpoint, {
            params: {
                user_id: accountId,
                signature
            },
            timeout: APIGAMES_TIMEOUT_MS,
            transitional: {
                clarifyTimeoutError: true
            }
        });

        const result = response.data;
        if (result?.data?.is_valid === true && typeof result.data.username === 'string' && result.data.username.trim()) {
            return res.json({
                success: true,
                nickname: result.data.username.trim()
            });
        }

        if (result?.data?.is_valid === false) {
            return sendError(res, 400, 'User ID atau Zone ID tidak ditemukan. Periksa kembali data akun game.');
        }

        console.error('[APIGAMES CHECK USERNAME] Respons API tidak sesuai format yang diharapkan.');
        return sendError(res, 502, 'Layanan cek akun game memberikan respons yang tidak dapat diproses.');
    } catch (error) {
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            return sendError(res, 504, 'Layanan cek akun game terlalu lama merespons. Silakan coba lagi.');
        }

        if (isTlsError(error.code)) {
            console.error('[APIGAMES CHECK USERNAME] Validasi sertifikat TLS gagal.');
            return sendError(res, 502, 'Koneksi aman ke layanan cek akun game gagal. Silakan coba lagi nanti.');
        }

        if (error.response) {
            console.error(`[APIGAMES CHECK USERNAME] API merespons dengan HTTP ${error.response.status}.`);
            return sendError(res, 502, 'Layanan cek akun game sedang bermasalah. Silakan coba lagi nanti.');
        }

        console.error('[APIGAMES CHECK USERNAME] Tidak dapat terhubung ke API.');
        return sendError(res, 503, 'Tidak dapat terhubung ke layanan cek akun game. Silakan coba lagi.');
    }
});

module.exports = router;
