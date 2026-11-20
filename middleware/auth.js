const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
        ? authorization.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Autentikasi diperlukan'
        });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Sesi tidak valid atau sudah kedaluwarsa'
        });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Akses administrator diperlukan'
        });
    }
    next();
};

const optionalAuth = (req, res, next) => {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
        ? authorization.slice(7)
        : null;

    if (!token) {
        return next();
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        req.user = null;
    }

    next();
};

module.exports = { requireAuth, requireAdmin, optionalAuth };
