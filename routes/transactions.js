const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Mengambil semua daftar transaksi
 *     description: Mengambil seluruh data riwayat transaksi top-up game dari database MongoDB Atlas.
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar transaksi.
 *       500:
 *         description: Terjadi kesalahan pada server.
 *   post:
 *     summary: Membuat transaksi top-up baru
 *     description: Menyimpan data order top-up game baru ke database dengan validasi input lengkap.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game
 *               - userIdGame
 *               - nominal
 *               - harga
 *               - metodePembayaran
 *             properties:
 *               game:
 *                 type: string
 *                 example: Mobile Legends
 *               userIdGame:
 *                 type: string
 *                 example: 312713319
 *               zoneId:
 *                 type: string
 *                 example: 9655
 *               nominal:
 *                 type: string
 *                 example: 86 Diamonds
 *               harga:
 *                 type: number
 *                 example: 20000
 *               metodePembayaran:
 *                 type: string
 *                 example: QRIS
 *               userId:
 *                 type: string
 *                 example: ANGGA
 *     responses:
 *       201:
 *         description: Order Top Up Berhasil Dibuat.
 *       400:
 *         description: Validasi gagal, field wajib kurang lengkap atau tidak valid.
 */
router.post('/', async (req, res, next) => {
    try {
        const { game, userIdGame, zoneId, nominal, harga, metodePembayaran, status, userId } = req.body;
        
        if (!game || !userIdGame || !nominal || harga === undefined || !metodePembayaran) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validasi Gagal: Semua field transaksi wajib diisi secara lengkap!' 
            });
        }

        const numericHarga = Number(harga);
        if (isNaN(numericHarga) || numericHarga <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Validasi Gagal: Nominal harga harus berupa angka lebih dari 0!'
            });
        }

        const allowedStatus = ['Pending', 'Success', 'Failed'];
        const initialStatus = allowedStatus.includes(status) ? status : 'Pending';
        const cleanUserId = userId ? String(userId).trim() : null;
        const cleanGame = String(game).trim();

        const newTransaction = new Transaction({
            game: cleanGame,
            userIdGame: String(userIdGame).trim(),
            zoneId: zoneId ? String(zoneId).trim() : '-',
            nominal: String(nominal).trim(),
            harga: numericHarga,
            metodePembayaran: String(metodePembayaran).trim(),
            status: initialStatus,
            userId: cleanUserId
        });

        const savedData = await newTransaction.save();

        if (initialStatus === 'Success' && cleanUserId && cleanGame === 'Isi Saldo Galaksi') {
            await User.findOneAndUpdate(
                { username: cleanUserId },
                { $inc: { saldo: numericHarga } }
            );
        }

        res.status(201).json({ 
            success: true, 
            message: 'Order Top Up Berhasil Dibuat!', 
            data: savedData 
        });
    } catch (err) {
        next(err);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const history = await Transaction.find().sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Memperbarui status transaksi
 *     description: Mengubah status transaksi (contoh dari Pending menjadi Success) berdasarkan ID MongoDB.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Transaksi dari MongoDB
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: Success
 *     responses:
 *       200:
 *         description: Status transaksi berhasil diperbarui.
 *       404:
 *         description: Transaksi tidak ditemukan.
 *   delete:
 *     summary: Menghapus data transaksi
 *     description: Menghapus record transaksi dari database MongoDB berdasarkan ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Transaksi dari MongoDB
 *     responses:
 *       200:
 *         description: Transaksi berhasil dihapus.
 *       404:
 *         description: Transaksi tidak ditemukan.
 */
router.put('/:id', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Format ID transaksi tidak valid' });
        }

        const { status } = req.body;
        const allowedStatus = ['Pending', 'Success', 'Failed'];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ success: false, message: 'Status transaksi tidak valid' });
        }
        
        const txOld = await Transaction.findById(req.params.id);
        if (!txOld) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        const updated = await Transaction.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        // Jika status berubah menjadi 'Success', otomatis tambahkan saldo ke database User jika ini Top-Up Saldo
        if (status === 'Success' && txOld.status !== 'Success') {
            if (updated.game === 'Isi Saldo Galaksi' && updated.userId) {
                await User.findOneAndUpdate(
                    { username: String(updated.userId) },
                    { $inc: { saldo: Number(updated.harga) } }
                );
            }
        }

        res.json({ 
            success: true, 
            message: 'Status transaksi berhasil diperbarui dan saldo masuk ke database', 
            data: updated 
        });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Format ID transaksi tidak valid' });
        }

        const deleted = await Transaction.findByIdAndDelete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        res.json({ 
            success: true, 
            message: 'Transaksi berhasil dihapus' 
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;