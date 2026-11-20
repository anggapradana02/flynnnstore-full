const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    orderId: { type: String, unique: true, sparse: true },
    game: { type: String, required: true },
    userIdGame: { type: String, required: true },
    zoneId: { type: String },
    nominal: { type: String, required: true },
    harga: { type: Number, required: true },
    metodePembayaran: { type: String },
    snapToken: { type: String },
    status: { type: String, enum: ['Pending', 'Success', 'Canceled'], default: 'Pending' },
    userId: { type: String },
    supplierProcessed: { type: Boolean, default: false },
    apigamesProductCode: { type: String },
    apigamesOperatorId: { type: Number },
    apigamesProductName: { type: String },
    apigamesCostUnit: { type: Number },
    apigamesCostRupiah: { type: Number },
    apigamesRefId: { type: String },
    apigamesOrderState: {
        type: String,
        enum: [
            'NOT_REQUIRED',
            'WAITING_FOR_MAPPING',
            'WAITING_FOR_PAYMENT',
            'AWAITING_ENDPOINT_CONFIRMATION',
            'AWAITING_API_ORDER_ADAPTER',
            'CANCELED'
        ]
    },
    apigamesProviderStatus: { type: String },
    apigamesPaidAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);