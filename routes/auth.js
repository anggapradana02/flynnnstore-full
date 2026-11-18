const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * @swagger
 * /api/auth/send-whatsapp-otp:
 *   post:
 *     summary: Mengirim kode OTP ke WhatsApp
 *     description: Mengirimkan 4 digit kode verifikasi OTP ke nomor WhatsApp user menggunakan WhatsApp Gateway API.
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

        const cleanPhone = String(phone).trim();
        if (!/^[0-9+]{9,15}$/.test(cleanPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Format nomor WhatsApp tidak valid (gunakan 9-15 digit angka)!'
            });
        }

        // Generate 4 digit kode OTP acak
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Token Fonnte (Bisa didapat gratis di fonnte.com atau dikosongkan jika mode simulasi sidang)
        const tokenFonnte = process.env.FONNTE_TOKEN || 'ISI_TOKEN_FONNTE_ANDA';

        try {
            await axios.post('https://api.fonnte.com/send', {
                target: cleanPhone,
                message: `[FLYNNNSTORE SECURITY] Kode verifikasi OTP Anda adalah: *${otpCode}*. Berlaku selama 5 menit. Jangan bagikan ke siapa pun.`
            }, {
                headers: { Authorization: tokenFonnte }
            });
        } catch (apiErr) {
            console.log('Catatan Fonnte API (Mode lokal/simulasi aktif):', apiErr.message);
        }

        // Mengirimkan response sukses beserta kode OTP (sangat berguna untuk ditunjukkan ke dosen saat sidang)
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