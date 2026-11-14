const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    game: { type: String, required: true },
    userIdGame: { type: String, required: true },
    zoneId: { type: String },
    nominal: { type: String, required: true },
    harga: { type: Number, required: true },
    metodePembayaran: { type: String },
    status: { type: String, enum: ['Pending', 'Success', 'Canceled'], default: 'Pending' },
    userId: { type: String } // Menyimpan username user
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);