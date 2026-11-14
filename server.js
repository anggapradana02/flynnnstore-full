require('dotenv').config(); // <--- WAJIB ADA DI BARIS PALING ATAS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const transactionRoutes = require('./routes/transactions');

const app = express();

// --- KEAMANAN WEB & CORS (Materi Minggu 9) ---
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- DOKUMENTASI API SWAGGER / OPENAPI ) ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation - Flynnnstore Galaxy Top-Up',
      version: '1.0.0',
      description: 'Dokumentasi resmi endpoint backend Flynnnstore sesuai standar industri',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server Backend',
      },
    ],
  },
  apis: ['./server.js', './routes/*.js'],
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- ROUTES API TRANSAKSI ---
app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', require('./routes/auth'));

// --- MIDDLEWARE VALIDASI & ERROR HANDLING (Materi Minggu 3 & 8) ---
app.use((req, res, next) => {
  const error = new Error(`Endpoint tidak ditemukan - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

// Koneksi MongoDB Atlas menggunakan file .env lalu jalankan server
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log('MongoDB Atlas Berhasil Terhubung!');
  app.listen(PORT, () => {
    console.log(`Server Backend berjalan di port ${PORT}`);
    console.log(`Dokumentasi Swagger dapat diakses di http://localhost:${PORT}/api-docs`);
  });
})
.catch(err => console.error('Koneksi Database Gagal:', err));