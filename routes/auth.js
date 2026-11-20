const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');

const formatUserResponse = (u) => ({
    username: u.username,
    phone: u.phone || '',
    email: u.email || '',
    role: u.role || 'USER',
    level: u.level || 1,
    balance: typeof u.balance === 'number' ? u.balance : (u.saldo || 0),
    status: 'Verified Security User',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`
});

// POST: Cek kredensial saat LOGIN sebelum kirim OTP
router.post('/login-check', async (req, res, next) => {
    try {
        const { username, password } = req.body || {};
        const cleanUsername = String(username || '').trim().toUpperCase();
        const cleanPassword = String(password || '').trim();

        if (!cleanUsername || !cleanPassword) {
            return res.status(400).json({
                success: false,
                message: 'Username dan Password wajib diisi!'
            });
        }

        const foundUser = await User.findOne({ username: cleanUsername });
        if (!foundUser) {
            return res.status(404).json({
                success: false,
                message: `Username "${cleanUsername}" belum terdaftar! Silakan daftar terlebih dahulu.`
            });
        }

        if (foundUser.password !== cleanPassword) {
            return res.status(401).json({
                success: false,
                message: 'Password salah! Periksa kembali password kamu.'
            });
        }

        res.json({
            success: true,
            user: formatUserResponse(foundUser)
        });
    } catch (err) {
        next(err);
    }
});

// POST: Daftarkan akun baru ke MongoDB Atlas setelah OTP valid
router.post('/register', async (req, res, next) => {
    try {
        const { username, password, phone, email } = req.body || {};
        const cleanUsername = String(username || '').trim().toUpperCase();
        const cleanPassword = String(password || '').trim();
        const cleanPhone = String(phone || '').trim();
        const cleanEmail = String(email || '').trim();

        if (!cleanUsername || !cleanPassword || !cleanPhone) {
            return res.status(400).json({
                success: false,
                message: 'Username, Password, dan Nomor WhatsApp wajib diisi!'
            });
        }

        const existing = await User.findOne({ username: cleanUsername });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: `Username "${cleanUsername}" sudah terdaftar! Silakan gunakan menu Masuk Akun.`
            });
        }

        const created = await User.create({
            username: cleanUsername,
            password: cleanPassword,
            phone: cleanPhone,
            email: cleanEmail,
            role: 'USER',
            level: 1,
            balance: 0,
            saldo: 0
        });

        res.status(201).json({
            success: true,
            message: 'Akun berhasil didaftarkan ke database!',
            user: formatUserResponse(created)
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /api/auth/send-whatsapp-otp:
 *   post:
 *     summary: Mengirim kode OTP ke WhatsApp
 *     description: Mengirimkan 4 digit kode verifikasi OTP ke nomor WhatsApp user menggunakan Fonnte WhatsApp Gateway API.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 example: 081234567890
 *     responses:
 *       200:
 *         description: OTP berhasil dikirim.
 *       400:
 *         description: Nomor WhatsApp wajib diisi atau format tidak valid.
 */
router.post('/send-whatsapp-otp', async (req, res, next) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Nomor WhatsApp wajib diisi untuk verifikasi OTP!'
            });
        }

        let cleanPhone = String(phone).trim();
        if (!/^[0-9+]{9,15}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Format nomor WhatsApp tidak valid (gunakan 9-15 digit angka)!'
            });
        }

        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.slice(1);
        }

        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const tokenFonnte = process.env.FONNTE_TOKEN;

        if (!tokenFonnte) {
            console.log('[WARNING] FONNTE_TOKEN belum diatur di Environment Variables Render!');
        } else {
            try {
                await axios.post('https://api.fonnte.com/send', {
                    target: cleanPhone,
                    message: `*FLYNNNSTORE - VERIFIKASI OTP*\n\nKode verifikasi OTP Anda adalah: *${otpCode}*\n\nJangan berikan kode ini kepada siapa pun termasuk pihak Flynnnstore. Terima kasih, Angga Tampan!`,
                    countryCode: '62'
                }, {
                    headers: {
                        Authorization: tokenFonnte
                    }
                });
                console.log(`[FONNTE SUCCESS] OTP ${otpCode} berhasil dikirim ke nomor ${cleanPhone}`);
            } catch (apiErr) {
                console.error('[FONNTE ERROR] Gagal mengirim pesan WhatsApp:', apiErr.response?.data || apiErr.message);
            }
        }

        res.json({
            success: true,
            message: 'Kode OTP berhasil dikirim ke nomor WhatsApp!',
            otp: otpCode
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;