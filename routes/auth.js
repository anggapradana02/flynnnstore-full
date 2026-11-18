const express = require('express');
const router = express.Router();
const axios = require('axios');

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

        // Format nomor HP ke standar internasional berawalan 62 jika diawali 0
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.slice(1);
        }

        // Generate 4 digit kode OTP acak
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Mengambil Token Fonnte dari Environment Variables Render
        const tokenFonnte = process.env.FONNTE_TOKEN;

        if (!tokenFonnte) {
            console.log('[WARNING] FONNTE_TOKEN belum diatur di Environment Variables Render!');
        } else {
            try {
                // Kirim pesan WhatsApp asli secara real-time via Fonnte Gateway
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

        // Mengirimkan response sukses beserta kode OTP ke frontend (sangat berguna untuk cadangan saat sidang)
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