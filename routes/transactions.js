const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const midtransClient = require('midtrans-client');
const router = express.Router();
const Transaction = require('../models/Transaction');

const getSnapClient = () => {
    return new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY
    });
};

// POST: Buat Transaksi Baru + Minta Snap Token ke Midtrans
router.post('/', async (req, res) => {
    try {
        const { game, userIdGame, zoneId, nominal, harga, metodePembayaran, status, userId, whatsapp } = req.body;

        if (!game || !userIdGame || !nominal || harga === undefined || !metodePembayaran) {
            return res.status(400).json({
                success: false,
                message: 'Validasi Gagal: Semua field transaksi wajib diisi secara lengkap!'
            });
        }

        const numericHarga = Math.round(Number(harga));
        if (isNaN(numericHarga) || numericHarga <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Validasi Gagal: Nominal harga harus lebih dari Rp 0!'
            });
        }

        const cleanGame = String(game).trim();
        const cleanUserId = userId ? String(userId).trim() : null;
        const cleanMethod = String(metodePembayaran).trim();
        const orderId = `FLYNNN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

        if (cleanMethod === 'WALLET') {
            const newTransaction = new Transaction({
                orderId,
                game: cleanGame,
                userIdGame: String(userIdGame).trim(),
                zoneId: zoneId ? String(zoneId).trim() : '-',
                nominal: String(nominal).trim(),
                harga: numericHarga,
                metodePembayaran: cleanMethod,
                status: status === 'Success' ? 'Success' : 'Pending',
                userId: cleanUserId
            });

            const savedData = await newTransaction.save();
            return res.status(201).json({
                success: true,
                message: 'Transaksi Saldo Galaksi Berhasil!',
                data: savedData
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
            userId: cleanUserId
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
router.post('/verify/:orderId', async (req, res, next) => {
    try {
        const orderId = String(req.params.orderId).trim();
        const tx = await Transaction.findOne({ orderId });

        if (!tx) {
            return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
        }

        const snap = getSnapClient();
        const statusResponse = await snap.transaction.status(orderId);
        const txStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        if ((txStatus === 'capture' && fraudStatus === 'accept') || txStatus === 'settlement') {
            tx.status = 'Success';
            await tx.save();
        } else if (['cancel', 'deny', 'expire'].includes(txStatus)) {
            tx.status = 'Canceled';
            await tx.save();
        }

        res.json({
            success: true,
            midtransStatus: txStatus,
            data: tx
        });
    } catch (err) {
        next(err);
    }
});

// POST: Webhook Resmi dari Server Midtrans
router.post('/midtrans-notification', async (req, res) => {
    try {
        const notification = req.body;
        const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = notification;

        const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
        const expectedSignature = crypto
            .createHash('sha512')
            .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
            .digest('hex');

        if (signature_key !== expectedSignature) {
            return res.status(403).json({ success: false, message: 'Invalid Signature Key' });
        }

        const tx = await Transaction.findOne({ orderId: String(order_id) });
        if (!tx) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        if ((transaction_status === 'capture' && fraud_status === 'accept') || transaction_status === 'settlement') {
            tx.status = 'Success';
            await tx.save();
        } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
            tx.status = 'Canceled';
            await tx.save();
        }

        res.status(200).json({ success: true, message: 'Webhook diterima' });
    } catch (err) {
        console.error('Webhook Error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: Ambil Riwayat Transaksi (Bisa difilter berdasarkan userId klien atau semua untuk admin)
router.get('/', async (req, res, next) => {
    try {
        const { userId } = req.query;
        let query = {};
        
        // Jika ada parameter userId dan bukan admin, filter khusus milik user tersebut
        if (userId && userId !== 'ADMINISTRATOR') {
            query = { userId: String(userId).trim() };
        }

        const history = await Transaction.find(query).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        next(err);
    }
});

// PUT: Update Status Transaksi (Admin Panel)
router.put('/:id', async (req, res, next) => {
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
router.delete('/:id', async (req, res, next) => {
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