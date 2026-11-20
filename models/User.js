const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        trim: true,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'USER'
    },
    level: {
        type: Number,
        default: 1
    },
    balance: {
        type: Number,
        default: 0
    },
    saldo: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);