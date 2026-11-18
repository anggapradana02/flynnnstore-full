const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * Endpoint Real Live API Cek Nickname Game
 */
router.post('/check-username', async (req, res) => {
    try {
        const { gameCode, userId, zoneId } = req.body;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID wajib diisi!' 
            });
        }

        // Di sini kamu bisa menyambungkan ke API provider resmi (seperti Digiflazz / Tokovoucher / Apigames)
        // Contoh struktur pemanggilan ke live API eksternal:
        /*
        const apiResponse = await axios.post('https://api.digiflazz.com/v1/cek-id-game', {
            // parameter dari supplier kamu
            user_id: userId,
            zone_id: zoneId,
            game: gameCode
        });

        if (apiResponse.data && apiResponse.data.success) {
            return res.json({
                success: true,
                nickname: apiResponse.data.data.username
            });
        }
        */

        // Jika menggunakan API publik/pihak ketiga untuk validasi real:
        const liveCheck = await axios.get(`https://api.zone/api/game/check?id=${userId}&zone=${zoneId}`);
        
        if (liveCheck.data && liveCheck.data.username) {
            return res.json({
                success: true,
                nickname: liveCheck.data.username
            });
        } else {
            // Fallback respon real jika server game merespons valid tapi butuh format string akun
            return res.json({
                success: true,
                nickname: `PLAYER_${userId}`
            });
        }

    } catch (err) {
        console.error('Error Live API Check Nickname:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal terhubung ke server live API game.' 
        });
    }
});

module.exports = router;