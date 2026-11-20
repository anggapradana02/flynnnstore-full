const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const midtransClient = require('midtrans-client');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');
const {
    getApiGamesOrderConfig,
    resolveApiGamesOrderProduct
} = require('../utils/apigames-orders');

const getSnapClient = () => {
    return new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY
    });
};

const deferPaidApiGamesOrder = async (tx) => {
    const config = getApiGamesOrderConfig();
    const nextState = config.readyForAdapter
        ? 'AWAITING_API_ORDER_ADAPTER'
        : 'AWAITING_ENDPOINT_CONFIRMATION';

    const updated = await Transaction.findOneAndUpdate(
        {
            _id: tx._id,
            status: 'Pending',
            $or: [
                { apigamesOrderState: 'WAITING_FOR_PAYMENT' },
                { apigamesOrderState: { $exists: false } }
            ]
        },
        {
            $set: {
                apigamesOrderState: nextState,
                apigamesPaidAt: new Date(),
                apigamesRefId: tx.orderId
            }
        },
        { new: true }
    );

    return updated || Transaction.findById(tx._id);
};

// POST: Buat Transaksi Baru + Minta Snap Token ke Midtrans
router.post('/', requireAuth, async (req, res) => {
    try {
        const { game, userIdGame, zoneId, nominal, metodePembayaran, whatsapp, promoCode } = req.body;

        if (!game || !userIdGame || !nominal || !metodePembayaran) {
            return res.status(400).json({
                success: false,
                message: 'Validasi Gagal: Semua field transaksi wajib diisi secara lengkap!'
            });
        }

        let numericHarga;
        let apiGamesProduct = null;
        if (game === 'Isi Saldo Galaksi') {
            numericHarga = Math.round(Number(req.body.harga));
            if (isNaN(numericHarga) || numericHarga < 10000) {
                return res.status(400).json({
                    success: false,
                    message: 'Validasi Gagal: Nominal isi saldo minimal Rp 10.000!'
                });
            }
        } else {
            try {
                apiGamesProduct = resolveApiGamesOrderProduct({
                    gameName: game,
                    nominalName: nominal,
                    promoCode
                });
            } catch (error) {
                console.error('[APIGAMES ORDER MAPPING] Gagal memuat katalog atau mapping lokal:', error.message);
                return res.status(503).json({
                    success: false,
                    message: 'Katalog atau mapping produk ApiGames belum tersedia di server.'
                });
            }

            if (!apiGamesProduct.success) {
                const statusCode = apiGamesProduct.code === 'INVALID_CATALOG_ITEM' ? 400 : 409;
                return res.status(statusCode).json({
                    success: false,
                    code: apiGamesProduct.code,
                    message: apiGamesProduct.message
                });
            }
            numericHarga = apiGamesProduct.retailPrice;
        }

        if (numericHarga <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Validasi Gagal: Nominal harga harus lebih dari Rp 0!'
            });
        }

        const cleanGame = String(game).trim();
        const cleanUserId = req.user.username;
        const cleanMethod = String(metodePembayaran).trim();
        const orderId = `FLYNNN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

        if (cleanMethod === 'WALLET') {
            return res.status(503).json({
                success: false,
                message: 'Pembayaran Saldo Galaksi untuk order game dinonaktifkan sampai pemrosesan ApiGames dikonfirmasi.'
            });
        }

        if (!process.env.MIDTRANS_SERVER_KEY) {
            return res.status(500).json({
                success: false,
                message: 'MIDTRANS_SERVER_KEY belum diatur di server!'
            });
        }

        const snap = getSnapClient();
        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: numericHarga
            },
            item_details: [
                {
                    id: cleanGame.toLowerCase().replace(/\s+/g, '-').slice(0, 20),
                    price: numericHarga,
                    quantity: 1,
                    name: `${cleanGame} - ${String(nominal).trim()}`.slice(0, 50)
                }
            ],
            customer_details: {
                first_name: cleanUserId || 'Customer Flynnnstore',
                phone: whatsapp ? String(whatsapp).trim() : '081234567890'
            },
            callbacks: {
                finish: 'https://flynnnstore.web.app'
            }
        };

        const midtransTx = await snap.createTransaction(parameter);

        const newTransaction = new Transaction({
            orderId,
            game: cleanGame,
            userIdGame: String(userIdGame).trim(),
            zoneId: zoneId ? String(zoneId).trim() : '-',
            nominal: String(nominal).trim(),
            harga: numericHarga,
            metodePembayaran: cleanMethod,
            snapToken: midtransTx.token,
            status: 'Pending',
            userId: cleanUserId,
            apigamesProductCode: apiGamesProduct?.productCode,
            apigamesOperatorId: apiGamesProduct?.operatorId,
            apigamesProductName: apiGamesProduct?.productName,
            apigamesCostUnit: apiGamesProduct?.costUnit,
            apigamesCostRupiah: apiGamesProduct?.costRupiah,
            apigamesRefId: orderId,
            apigamesOrderState: apiGamesProduct ? 'WAITING_FOR_PAYMENT' : 'NOT_REQUIRED'
        });

        const savedData = await newTransaction.save();

        res.status(201).json({
            success: true,
            message: 'Sesi pembayaran Midtrans berhasil dibuat!',
            data: savedData,
            snapToken: midtransTx.token,
            redirectUrl: midtransTx.redirect_url
        });
    } catch (err) {
        console.error('Midtrans Error:', err.message);
        res.status(500).json({
            success: false,
            message: `Gagal memproses pembayaran Midtrans: ${err.message}`
        });
    }
});

// POST: Verifikasi Status Transaksi Langsung ke API Midtrans
router.post('/verify/:orderId', optionalAuth, async (req, res, next) => {
    try {
        const orderId = String(req.params.orderId).trim();
        const tx = await Transaction.findOne({ orderId });

        if (!tx) {
            return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
        }
        if (req.user && req.user.role !== 'ADMIN' && tx.userId !== req.user.username) {
            return res.status(403).json({ success: false, message: 'Akses transaksi ditolak' });
        }

        const snap = getSnapClient();
        const statusResponse = await snap.transaction.status(orderId);
        const txStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;
        const midtransGrossAmount = Math.round(Number(statusResponse.gross_amount));
        const databaseGrossAmount = Math.round(Number(tx.harga));

        if (
            !Number.isFinite(midtransGrossAmount) ||
            midtransGrossAmount !== databaseGrossAmount
        ) {
            return res.status(409).json({
                success: false,
                message: 'Gross amount Midtrans tidak cocok dengan data transaksi'
            });
        }

        if ((txStatus === 'capture' && fraudStatus === 'accept') || txStatus === 'settlement') {
            if (tx.game === 'Isi Saldo Galaksi') {
                tx.status = 'Success';
                tx.apigamesOrderState = 'NOT_REQUIRED';
                await tx.save();
            } else {
                await deferPaidApiGamesOrder(tx);
            }
        } else if (['cancel', 'deny', 'expire'].includes(txStatus)) {
            if (tx.status !== 'Success') {
                tx.status = 'Canceled';
                tx.apigamesOrderState = 'CANCELED';
                await tx.save();
            }
        }

        const latestTx = await Transaction.findOne({ orderId });
        res.json({
            success: true,
            midtransStatus: txStatus,
            data: latestTx || tx
        });
    } catch (err) {
        next(err);
    }
});

// POST: Webhook Resmi dari Server Midtrans
router.post('/midtrans-notification', async (req, res) => {
    try {
        const notification = req.body || {};
        const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = notification;

        if (!order_id || !status_code || !gross_amount || !signature_key) {
            return res.status(400).json({ success: false, message: 'Payload notifikasi tidak lengkap' });
        }

        const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
        const expectedSignature = crypto
            .createHash('sha512')
            .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
            .digest('hex');

        if (signature_key !== expectedSignature) {
            return res.status(403).json({ success: false, message: 'Invalid Signature Key' });
        }

        // Balas HTTP 200 lebih dulu agar Midtrans tidak mengalami timeout saat Render bangun atau memproses supplier
        res.status(200).json({ success: true, message: 'Webhook diterima' });

        setImmediate(async () => {
            try {
                const tx = await Transaction.findOne({ orderId: String(order_id) });
                if (!tx) {
                    console.log(`[WEBHOOK] Transaksi ${order_id} tidak ditemukan di database.`);
                    return;
                }

                const webhookGrossAmount = Math.round(Number(gross_amount));
                const databaseGrossAmount = Math.round(Number(tx.harga));
                if (!Number.isFinite(webhookGrossAmount) || webhookGrossAmount !== databaseGrossAmount) {
                    console.error(`[WEBHOOK] Gross amount tidak cocok untuk ${order_id}`);
                    return;
                }

                if ((transaction_status === 'capture' && fraud_status === 'accept') || transaction_status === 'settlement') {
                    if (tx.game === 'Isi Saldo Galaksi') {
                        tx.status = 'Success';
                        tx.apigamesOrderState = 'NOT_REQUIRED';
                        await tx.save();
                    } else {
                        await deferPaidApiGamesOrder(tx);
                    }
                } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
                    if (tx.status !== 'Success') {
                        tx.status = 'Canceled';
                        tx.apigamesOrderState = 'CANCELED';
                        await tx.save();
                    }
                }
            } catch (bgErr) {
                console.error('[WEBHOOK BACKGROUND ERROR]:', bgErr.message);
            }
        });
    } catch (err) {
        console.error('Webhook Error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
});

// GET: Ambil Riwayat Transaksi (Difilter per user atau semua untuk admin)
router.get('/', requireAuth, async (req, res, next) => {
    try {
        let query = {};

        if (req.user.role !== 'ADMIN') {
            query = { userId: req.user.username };
        }

        const history = await Transaction.find(query).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        next(err);
    }
});

// PUT: Update Status Transaksi (Admin Panel)
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Format ID transaksi tidak valid' });
        }

        const { status } = req.body;
        const updated = await Transaction.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        res.json({ success: true, message: 'Status transaksi berhasil diperbarui', data: updated });
    } catch (err) {
        next(err);
    }
});

// DELETE: Hapus Transaksi (Admin Panel)
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Format ID transaksi tidak valid' });
        }

        const deleted = await Transaction.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        res.json({ success: true, message: 'Transaksi berhasil dihapus' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;