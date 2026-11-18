import { auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Gamepad2, History, User, Trophy, LogOut, 
  Search, ArrowLeft, Zap, CheckCircle2, Wallet, QrCode, Headset, Send,
  Rocket, Target, Sun, Moon, Languages, 
  Banknote, CreditCard as CardIcon, ShieldCheck, ShoppingCart, 
  Smartphone as PhoneIcon, Filter, Info, Camera, Edit2, Save, Timer, Flame, TrendingDown,
  Mail, Lock, LogIn, ShieldAlert, MessageCircle, Database, ChevronRight, UserCheck, Check, Tag, Shield, Trash2, RefreshCw, KeyRound, PlusCircle, MessageSquare, ChevronLeft
} from 'lucide-react';
import { Screen, Game, Transaction, UserProfile } from '../types';
import { MOCK_GAMES } from '../constants';
import { db } from '../db';
import GlassCard from '../components/GlassCard';

declare global {
  interface Window {
    snap: any;
  }
}

const TechLogo = ({ size = 40, animated = false }: { size?: number, animated?: boolean }) => (
  <div style={{ width: size, height: size }} className={`relative ${animated ? 'animate-energy' : 'drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]'}`}>
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="hexG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00E5FF"/><stop offset="100%" stopColor="#D500F9"/></linearGradient>
      </defs>
      <path d="M100 10 L180 55 L180 145 L100 190 L20 145 L20 55 Z" stroke="url(#hexG)" strokeWidth="2" fill="rgba(0, 255, 255, 0.05)"/>
      <path d="M100 40 L155 70 L155 130 L100 160 L45 130 L45 70 Z" fill="#1A0B3B" stroke="url(#hexG)" strokeWidth="4"/>
      <path d="M75 70 H130 L135 85 H95 V105 H125 L130 120 H100 L95 145 H75 L80 120 L85 105 L90 85 L75 70Z" fill="white" className="drop-shadow-[0_0_8px_white]"/>
      <path d="M85 125 L115 100" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
    {animated && <div className="scan-line"></div>}
  </div>
);

const StoreTitle = ({ className = "" }) => (
  <h1 className={`text-2xl font-black italic tracking-tighter tech-gradient-text uppercase ${className}`}>
    FLYNNNSTORE
    <div className="glitch-line"></div>
  </h1>
);

const PAYMENT_METHODS = [
  { id: 'WALLET', name: 'Saldo Galaksi (Dompet Akun)', category: 'Instant Balance', icon: <Wallet size={20} /> },
  { id: 'QRIS', name: 'QRIS (Semua E-Wallet / Bank)', category: 'Midtrans Snap', icon: <QrCode size={20} /> },
  { id: 'GOPAY', name: 'GoPay / E-Wallet', category: 'Midtrans Snap', icon: <PhoneIcon size={20} /> },
  { id: 'VA_BCA', name: 'BCA Virtual Account', category: 'Midtrans Snap', icon: <Banknote size={20} /> },
  { id: 'VA_MANDIRI', name: 'Mandiri Virtual Account', category: 'Midtrans Snap', icon: <Banknote size={20} /> },
  { id: 'RETAIL', name: 'Indomaret / Alfamart', category: 'Midtrans Snap', icon: <CardIcon size={20} /> }
];

const CATEGORIES = ['Semua', 'MOBA', 'FPS', 'Battle Royale', 'RPG', 'Sports'];

const PROMO_BANNERS = [
  {
    title: "NEW PRODUCT JOKI FREE FIRE",
    subtitle: "JOKI FREE FIRE UDAH ADA NIH DI FLYNNNSTORE, MAU JOKI CLASH SQUAD ADA, JOKI BATTLE ROYAL JUGA ADA, LANGSUNG ORDER AJA DISINI.",
    badge: "PROMO SPESIAL",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80",
    buttonText: "ORDER DISINI"
  },
  {
    title: "FLASH SALE 50% OFF",
    subtitle: "NIKMATI DISKON BESAR-BESARAN DIAMOND & UC MINGGU INI DI SELURUH SERVER GALAKSI",
    badge: "LIMITED TIME",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80",
    buttonText: "AMBIL DISKON"
  },
  {
    title: "GARANSI 100% AMAN & LEGAL",
    subtitle: "TERINTEGRASI FIREBASE OAUTH, MONGODB ATLAS & MIDTRANS PAYMENT GATEWAY RESMI",
    badge: "OFFICIAL VENDOR",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    buttonText: "CEK KEAMANAN"
  }
];

const API_BASE = 'https://flynnnstore-full.onrender.com';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('SPLASH');
  const [user, setUser] = useState<UserProfile | any>({});
  const [balance, setBalance] = useState(0);
  const [dbSynced, setDbSynced] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [pending, setPending] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Banner Promo State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Form Inputs
  const [userIdGame, setUserIdGame] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [verifiedNickname, setVerifiedNickname] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  
  // Voucher & Filter
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Top Up Saldo State
  const [topupAmountInput, setTopupAmountInput] = useState('');

  // Authentication State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInputName, setAuthInputName] = useState('');
  const [authInputPassword, setAuthInputPassword] = useState('');
  const [authInputPhone, setAuthInputPhone] = useState('');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // State OTP WhatsApp
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [serverOtp, setServerOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');

  // State Login Admin & Transaksi Database Terpusat
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [allDbTransactions, setAllDbTransactions] = useState<any[]>([]);

  useEffect(() => {
    const initApp = async () => {
      await loadData();
      await handleMidtransRedirectReturn();
    };
    initApp();

    const bannerTimer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 5000);
    return () => clearInterval(bannerTimer);
  }, []);

  const creditBalanceSafely = async (orderId: string, amountToAdd: number) => {
    const creditedOrders = JSON.parse(localStorage.getItem('flynnn_credited_orders') || '[]');
    if (creditedOrders.includes(orderId)) return;

    creditedOrders.push(orderId);
    localStorage.setItem('flynnn_credited_orders', JSON.stringify(creditedOrders));

    const currentProfile = await db.getUserProfile();
    if (!currentProfile || currentProfile.role === 'GUEST') return;

    const registeredUsers = JSON.parse(localStorage.getItem('flynnn_registered_users') || '{}');
    const currentBal = registeredUsers[currentProfile.username]?.balance ?? currentProfile.balance ?? 0;
    const newBal = currentBal + amountToAdd;

    const updatedUser = { ...currentProfile, balance: newBal };
    await db.updateUserProfile(updatedUser);
    setUser(updatedUser);
    setBalance(newBal);

    if (registeredUsers[currentProfile.username]) {
      registeredUsers[currentProfile.username].balance = newBal;
      localStorage.setItem('flynnn_registered_users', JSON.stringify(registeredUsers));
    }
  };

  const handleMidtransRedirectReturn = async () => {
    const params = new URLSearchParams(window.location.search);
    const returnedOrderId = params.get('order_id');
    if (!returnedOrderId) return;

    window.history.replaceState({}, document.title, window.location.pathname);

    try {
      const res = await fetch(`${API_BASE}/api/transactions/verify/${returnedOrderId}`, {
        method: 'POST'
      });
      const verifyData = await res.json();

      if (verifyData.success && verifyData.data) {
        if (verifyData.data.status === 'Success' && verifyData.data.game === 'Isi Saldo Galaksi') {
          await creditBalanceSafely(returnedOrderId, Number(verifyData.data.harga));
        }

        await fetchDatabaseTransactions();
        setScreen('HISTORY');

        if (verifyData.data.status === 'Success') {
          alert('Pembayaran Midtrans Berhasil! Transaksi kamu telah lunas dan diproses.');
        } else {
          alert('Transaksi tercatat. Kamu dapat mengecek atau melanjutkan pembayaran di Riwayat Transaksi.');
        }
      }
    } catch (err) {
      console.error('Gagal memverifikasi hasil redirect Midtrans:', err);
      await fetchDatabaseTransactions();
      setScreen('HISTORY');
    }
  };

  const loadData = async () => {
    const p = await db.getUserProfile();
    if (!p || p.role === 'GUEST') {
      const guestProfile = { username: 'GUEST COMMANDER', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest', status: 'Guest User', level: 1, balance: 0, role: 'GUEST' };
      setUser(guestProfile);
      setBalance(0);
    } else {
      const registeredUsers = JSON.parse(localStorage.getItem('flynnn_registered_users') || '{}');
      if (registeredUsers[p.username]) {
        p.balance = registeredUsers[p.username].balance;
      }
      setUser(p);
      setBalance(p.balance || 0);
    }
    setDbSynced(true);
    await fetchDatabaseTransactions();
  };

  const fetchDatabaseTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions`);
      if (res.ok) {
        const data = await res.json();
        setAllDbTransactions(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data dari MongoDB Atlas:', err);
    }
  };

  const handleVerifyId = () => {
    if (!userIdGame) {
      alert('Masukkan User ID Game terlebih dahulu!');
      return;
    }
    setIsVerifying(true);
    
    setTimeout(() => {
      setIsVerifying(false);
      if (userIdGame.trim() === '312713319' && (zoneId.trim() === '9655' || !zoneId)) {
        setVerifiedNickname('Anka_*');
      } else {
        setVerifiedNickname(`PLAYER_${userIdGame.slice(-4) || '88'}_PRO`);
      }
    }, 800);
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'ANGGATAMPAN') {
      setDiscountAmount(10000);
      setPromoSuccess(true);
      alert('Selamat! Kode Promo ANGGATAMPAN Berhasil Digunakan (Potongan Rp 10.000)');
    } else {
      alert('Kode promo tidak valid! Coba pakai kode: ANGGATAMPAN');
    }
  };

  const handleProceedTopupPayment = () => {
    if (user.role === 'GUEST') {
      alert('Mode Guest tidak dapat mengisi atau menyimpan saldo. Silakan masuk / daftar akun terlebih dahulu!');
      setScreen('SPLASH');
      return;
    }

    const amount = parseInt(topupAmountInput, 10);
    if (isNaN(amount) || amount < 10000) {
      alert('Minimal isi saldo adalah Rp 10.000');
      return;
    }

    setPending({
      type: 'BALANCE',
      gameName: 'Isi Saldo Galaksi',
      gameIcon: 'https://api.dicebear.com/7.x/shapes/svg?seed=Wallet',
      nominal: `Rp ${amount.toLocaleString()}`,
      price: amount,
      finalPrice: amount
    });
    setScreen('PAYMENT');
  };

  const openMidtransSnap = (snapToken: string, orderId: string, isBalanceTopup: boolean, amount: number) => {
    if (!window.snap) {
      alert('Skrip Midtrans Snap belum termuat. Silakan refresh halaman!');
      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: async () => {
        try {
          await fetch(`${API_BASE}/api/transactions/verify/${orderId}`, {
            method: 'POST'
          });
        } catch (err) {
          console.error('Gagal verifikasi otomatis ke backend:', err);
        }

        if (isBalanceTopup) {
          await creditBalanceSafely(orderId, amount);
        }

        alert('Pembayaran Berhasil Diterima oleh Midtrans! Pesanan kamu sedang diproses.');
        await resetAndGoToHistory();
      },
      onPending: async () => {
        alert('Tagihan berhasil dibuat! Silakan selesaikan pembayaran sesuai instruksi.');
        await resetAndGoToHistory();
      },
      onError: () => {
        alert('Pembayaran gagal diproses. Silakan coba lagi.');
      },
      onClose: async () => {
        alert('Jendela pembayaran ditutup. Kamu dapat melanjutkan pembayaran melalui menu Riwayat Transaksi.');
        await resetAndGoToHistory();
      }
    });
  };

  const handleInitiatePayment = async (method: string) => {
    if (isProcessingPayment) return;

    if (pending.type === 'GAME') {
      if (!userIdGame) {
        alert('Harap isi User ID Game kamu dulu!');
        return;
      }
      if (!whatsapp) {
        alert('Harap isi Nomor WhatsApp untuk penerimaan bukti resi!');
        return;
      }
    }

    if (pending.type === 'BALANCE' && method === 'WALLET') {
      alert('Pilih metode pembayaran QRIS, E-Wallet, Virtual Account, atau Gerai Ritel untuk mengisi Saldo Galaksi.');
      return;
    }

    const finalPrice = pending.type === 'GAME' ? Math.max(0, pending.price - discountAmount) : pending.price;

    // 1. Pembayaran menggunakan Saldo Galaksi (Dompet Akun)
    if (method === 'WALLET' && pending.type === 'GAME') {
      if (balance < finalPrice) {
        alert(`Saldo tidak cukup! Saldo kamu Rp ${balance?.toLocaleString() ?? 0}. Silakan isi saldo terlebih dahulu.`);
        return;
      }

      setIsProcessingPayment(true);
      try {
        await fetch(`${API_BASE}/api/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game: pending.gameName,
            userIdGame: `${userIdGame} (${verifiedNickname || 'Unverified'})`,
            zoneId: zoneId || '-',
            nominal: pending.nominal,
            harga: finalPrice,
            metodePembayaran: method,
            status: 'Success',
            userId: user.username
          })
        });

        const newBal = Math.max(0, balance - finalPrice);
        const updatedUser = { ...user, balance: newBal };
        await db.updateUserProfile(updatedUser);
        setUser(updatedUser);
        setBalance(newBal);

        const registeredUsers = JSON.parse(localStorage.getItem('flynnn_registered_users') || '{}');
        if (registeredUsers[user.username]) {
          registeredUsers[user.username].balance = newBal;
          localStorage.setItem('flynnn_registered_users', JSON.stringify(registeredUsers));
        }

        await resetAndGoToHistory();
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    // 2. Pembayaran via Midtrans Snap (QRIS, GoPay, VA BCA, VA Mandiri, Retail)
    setIsProcessingPayment(true);
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: pending.gameName,
          userIdGame: pending.type === 'BALANCE' ? `${user.username} (Topup Saldo)` : `${userIdGame} (${verifiedNickname || 'Unverified'})`,
          zoneId: zoneId || '-',
          nominal: pending.nominal,
          harga: finalPrice,
          metodePembayaran: method,
          status: 'Pending',
          userId: user.username,
          whatsapp
        })
      });

      const resData = await res.json();
      if (!res.ok || !resData.snapToken) {
        alert(resData.message || 'Gagal membuat sesi pembayaran Midtrans.');
        return;
      }

      openMidtransSnap(
        resData.snapToken,
        resData.data.orderId,
        pending.type === 'BALANCE',
        finalPrice
      );
    } catch (err) {
      console.error('Gagal memproses transaksi Midtrans:', err);
      alert('Terjadi kesalahan koneksi ke server pembayaran. Pastikan server Render aktif.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetAndGoToHistory = async () => {
    await fetchDatabaseTransactions();
    setPending(null);
    setUserIdGame('');
    setZoneId('');
    setVerifiedNickname('');
    setPromoCode('');
    setDiscountAmount(0);
    setPromoSuccess(false);
    setTopupAmountInput('');
    setScreen('HISTORY');
  };

  const handleDeleteAdminTx = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data transaksi ini dari MongoDB Atlas?')) return;
    await fetch(`${API_BASE}/api/transactions/${id}`, { method: 'DELETE' });
    fetchDatabaseTransactions();
  };

  const handleUpdateStatusAdmin = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Success' ? 'Pending' : 'Success';
    try {
      await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchDatabaseTransactions();
    } catch (err) {
      console.error('Gagal merubah status dari admin:', err);
    }
  };

  const handleRequestOtp = async () => {
    const username = authInputName.trim().toUpperCase();
    const password = authInputPassword.trim();
    const phone = authInputPhone.trim();

    if (!username || !password) {
      alert('Username dan Password wajib diisi!');
      return;
    }

    if (authMode === 'REGISTER' && !phone) {
      alert('Nomor WhatsApp wajib diisi untuk pendaftaran akun!');
      return;
    }

    const registeredUsers = JSON.parse(localStorage.getItem('flynnn_registered_users') || '{}');

    if (authMode === 'REGISTER' && registeredUsers[username]) {
      alert(`Username "${username}" sudah terdaftar! Silakan gunakan menu Masuk Akun.`);
      return;
    }

    if (authMode === 'LOGIN') {
      if (!registeredUsers[username]) {
        alert(`Username "${username}" belum terdaftar! Silakan daftar terlebih dahulu.`);
        return;
      }
      if (registeredUsers[username].password !== password) {
        alert('Password salah! Periksa kembali password kamu.');
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-whatsapp-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || registeredUsers[username]?.phone || '081234567890' })
      });

      const data = await res.json();
      if (data.success) {
        setServerOtp(data.otp);
        setIsOtpStep(true);
        alert(`[WHATSAPP OTP GATEWAY]\nKode OTP Anda telah dikirim ke WhatsApp.\n(Kode untuk uji coba sidang: ${data.otp})`);
      } else {
        alert(data.message || 'Gagal mengirim OTP ke WhatsApp.');
      }
    } catch (err) {
      console.error('Error OTP:', err);
      const fallbackOtp = '1234';
      setServerOtp(fallbackOtp);
      setIsOtpStep(true);
      alert(`[SIMULASI OFFLINE OTP]\nKode OTP Anda: ${fallbackOtp}`);
    }
  };

  const handleVerifyOtp = async () => {
    if (inputOtp.trim() !== serverOtp) {
      alert('Kode OTP salah! Periksa kembali kode yang dikirim ke WhatsApp.');
      return;
    }

    const username = authInputName.trim().toUpperCase();
    const password = authInputPassword.trim();
    const phone = authInputPhone.trim();
    const registeredUsers = JSON.parse(localStorage.getItem('flynnn_registered_users') || '{}');

    if (authMode === 'REGISTER') {
      const newUser = {
        username,
        password,
        phone,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        status: 'Verified Security User',
        role: 'USER',
        level: 1,
        balance: 0
      };
      registeredUsers[username] = newUser;
      localStorage.setItem('flynnn_registered_users', JSON.stringify(registeredUsers));

      await db.updateUserProfile(newUser);
      setUser(newUser);
      setBalance(0);

      setShowAuthModal(false);
      setIsOtpStep(false);
      setInputOtp('');
      setAuthInputName('');
      setAuthInputPassword('');
      setAuthInputPhone('');
      setScreen('DASHBOARD');
      alert(`Pendaftaran Berhasil & Terverifikasi WhatsApp OTP! Selamat Datang, ${username}.`);
    } else {
      const existingUser = registeredUsers[username];
      await db.updateUserProfile(existingUser);
      setUser(existingUser);
      setBalance(existingUser.balance || 0);

      setShowAuthModal(false);
      setIsOtpStep(false);
      setInputOtp('');
      setAuthInputName('');
      setAuthInputPassword('');
      setAuthInputPhone('');
      setScreen('DASHBOARD');
      alert(`Login Berhasil & Terverifikasi WhatsApp OTP! Selamat Datang Kembali, ${username}.`);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      const userData = {
        username: googleUser.displayName ? googleUser.displayName.toUpperCase() : 'GOOGLE USER',
        email: googleUser.email,
        avatar: googleUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=Google',
        status: 'Google Verified User',
        role: 'USER',
        level: 1,
        balance: 0
      };

      const registeredUsers = JSON.parse(localStorage.getItem('flynnn_registered_users') || '{}');
      if (!registeredUsers[userData.username]) {
        registeredUsers[userData.username] = userData;
        localStorage.setItem('flynnn_registered_users', JSON.stringify(registeredUsers));
      } else {
        userData.balance = registeredUsers[userData.username].balance || 0;
      }

      await db.updateUserProfile(userData);
      setUser(userData);
      setBalance(userData.balance);
      setShowAuthModal(false);
      setScreen('DASHBOARD');
      
      alert(`Berhasil Masuk dengan Akun Google: ${userData.username}`);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('Gagal masuk menggunakan Google. Pastikan konfigurasi Firebase sudah benar.');
    }
  };

  const handleSelectGuest = async () => {
    const guestProfile = { 
      username: `GUEST_${Math.floor(1000 + Math.random() * 9000)}`, 
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest', 
      status: 'Guest User', 
      level: 1, 
      balance: 0, 
      role: 'GUEST' 
    };

    await db.updateUserProfile(guestProfile);
    setUser(guestProfile);
    setBalance(0);
    setScreen('DASHBOARD');
  };

  const handleAdminAuthSubmit = async () => {
    const userClean = adminUsernameInput.trim();
    const passClean = adminPasswordInput.trim();

    if ((userClean === 'admin' || userClean === 'ADMIN') && (passClean === 'admin123' || passClean === 'flynnn2026')) {
      const p = { 
        username: 'ADMINISTRATOR', 
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminFlynnn', 
        status: 'System Administrator', 
        role: 'ADMIN',
        level: 99, 
        balance: 9999999 
      };

      await db.updateUserProfile(p);
      setUser(p);
      setBalance(p.balance);
      setShowAdminLoginModal(false);
      setAdminUsernameInput('');
      setAdminPasswordInput('');
      setScreen('ADMIN');
      alert('Akses Diterima! Selamat Datang, Administrator.');
    } else {
      alert('Akses Ditolak! Username atau Password Admin salah.');
    }
  };

  const filteredGames = MOCK_GAMES.filter(g => {
    const matchCat = selectedCategory === 'Semua' || g.category === selectedCategory;
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const flashSaleGames = MOCK_GAMES.filter(g => g.discount > 0);
  const myTransactions = allDbTransactions.filter((tx: any) => !tx.userId || tx.userId === user.username);

  return (
    <div className="min-h-screen relative text-white pb-10">
      {screen !== 'SPLASH' && (
        <div className="fixed top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-[250] pointer-events-auto bg-[#0B011E]/80 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-3">
            <TechLogo size={40} />
            <div className="flex flex-col">
              <StoreTitle />
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${dbSynced ? 'bg-green-500 shadow-[0_0_5px_#22C55E]' : 'bg-red-500'}`}></div>
                <span className="text-[7px] text-white/50 uppercase font-black">{dbSynced ? 'MONGODB & MIDTRANS ONLINE' : 'OFFLINE'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'ADMIN' ? (
              <button onClick={() => { fetchDatabaseTransactions(); setScreen('ADMIN'); }} className="glass px-3 py-1.5 rounded-xl text-xs font-black uppercase text-[#00FFFF] border-[#00FFFF]/30 flex items-center gap-1 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                <Shield size={14} /> Panel Admin
              </button>
            ) : (
              <button onClick={() => setShowAdminLoginModal(true)} className="glass p-2 rounded-xl text-white/30 hover:text-[#00FFFF] border-white/5 transition-all">
                <Lock size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* SPLASH SCREEN */}
      {screen === 'SPLASH' && (
        <div className="fixed inset-0 bg-[#0B011E] flex flex-col items-center justify-center z-[500] px-6 text-center">
          <TechLogo size={140} animated />
          <StoreTitle className="mt-6 scale-125" />
          <p className="text-white/40 text-xs mt-2 font-semibold">Pusat Top-Up Game Tercepat & Terpercaya Galaksi</p>

          {!showAuthModal ? (
            <div className="mt-12 flex flex-col gap-3 w-full max-w-xs">
              <button onClick={() => { setAuthMode('LOGIN'); setShowAuthModal(true); setIsOtpStep(false); }} className="bg-[#00FFFF] text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_30px_#00FFFF44] active:scale-95 flex items-center justify-center gap-2">
                <LogIn size={18} /> Masuk Akun
              </button>
              <button onClick={() => { setAuthMode('REGISTER'); setShowAuthModal(true); setIsOtpStep(false); }} className="glass py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-[#00FFFF] border-[#00FFFF]/30 active:scale-95 flex items-center justify-center gap-2">
                <PlusCircle size={18} /> Daftar Akun Baru (WhatsApp OTP)
              </button>
              
              <button 
                onClick={handleGoogleLogin} 
                className="w-full glass py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white border-white/20 flex items-center justify-center gap-3 active:scale-95 hover:bg-white/10 transition-all"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
                Masuk dengan Akun Google
              </button>

              <button onClick={handleSelectGuest} className="glass py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white/70 border-white/10 active:scale-95 flex items-center justify-center gap-2">
                <UserCheck size={18} /> Lanjut Sebagai Guest
              </button>
              
              <button onClick={() => setShowAdminLoginModal(true)} className="mt-4 text-[10px] font-black uppercase text-white/30 hover:text-[#00FFFF] tracking-widest flex items-center justify-center gap-1">
                <KeyRound size={12} /> Login khusus Administrator
              </button>
            </div>
          ) : (
            <div className="mt-8 glass p-6 rounded-3xl w-full max-w-xs space-y-3 animate-in fade-in">
              <h3 className="font-black text-sm uppercase text-[#00FFFF]">
                {!isOtpStep 
                  ? (authMode === 'LOGIN' ? 'Masuk ke Akun Kamu' : 'Pendaftaran Akun Baru') 
                  : 'Verifikasi WhatsApp OTP'}
              </h3>

              {!isOtpStep ? (
                <>
                  <input 
                    placeholder="Username..." 
                    value={authInputName} 
                    onChange={(e) => setAuthInputName(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none uppercase text-center text-[#00FFFF]" 
                  />
                  <input 
                    type="password" 
                    placeholder="Password..." 
                    value={authInputPassword} 
                    onChange={(e) => setAuthInputPassword(e.target.value)} 
                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none text-center text-white" 
                  />
                  {authMode === 'REGISTER' && (
                    <input 
                      type="text" 
                      placeholder="Nomor WhatsApp (Contoh: 0812...)" 
                      value={authInputPhone} 
                      onChange={(e) => setAuthInputPhone(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none text-center text-white" 
                    />
                  )}
                  <button onClick={handleRequestOtp} className="w-full bg-[#00FFFF] text-black py-3 rounded-xl font-black uppercase text-xs shadow-[0_0_15px_#00FFFF44] flex items-center justify-center gap-2">
                    <MessageSquare size={16} /> Kirim Kode OTP WhatsApp
                  </button>
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-3 text-white/30 text-[8px] uppercase font-bold">Atau</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  <button 
                    onClick={handleGoogleLogin} 
                    className="w-full glass py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-white border-white/20 flex items-center justify-center gap-2 active:scale-95 hover:bg-white/10 transition-all"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
                    Daftar dengan Akun Google
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-white/60 font-semibold leading-relaxed">
                    Kode verifikasi OTP telah dikirim melalui WhatsApp Gateway ke nomor Anda. Masukkan 4 digit kodenya di bawah:
                  </p>
                  <input 
                    type="text"
                    maxLength={4}
                    placeholder="• • • •" 
                    value={inputOtp} 
                    onChange={(e) => setInputOtp(e.target.value)} 
                    className="w-full bg-white/5 border border-[#00FFFF]/40 p-3 rounded-xl text-lg font-black tracking-[0.5em] outline-none text-center text-[#00FFFF]" 
                  />
                  <button onClick={handleVerifyOtp} className="w-full bg-green-400 text-black py-3 rounded-xl font-black uppercase text-xs shadow-[0_0_15px_#22C55E66]">
                    Verifikasi OTP & Selesai
                  </button>
                </>
              )}

              <button onClick={() => { setShowAuthModal(false); setIsOtpStep(false); }} className="text-xs text-white/40 underline font-semibold pt-2">Batal</button>
            </div>
          )}
        </div>
      )}

      {/* MODAL ADMIN */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[600] p-6">
          <GlassCard className="w-full max-w-xs border-[#00FFFF]/40 p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-[#00FFFF]/10 rounded-full flex items-center justify-center mx-auto text-[#00FFFF]">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-sm font-black italic uppercase text-[#00FFFF]">Otentikasi Administrator</h3>
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase text-white/40">Username Admin</label>
              <input type="text" placeholder="Username..." value={adminUsernameInput} onChange={(e) => setAdminUsernameInput(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs font-bold outline-none text-white" />
              <label className="text-[9px] font-black uppercase text-white/40">Password Secret</label>
              <input type="password" placeholder="••••••••" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className="w-full bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs font-bold outline-none text-white" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleAdminAuthSubmit} className="flex-1 bg-[#00FFFF] text-black py-2.5 rounded-xl font-black text-xs uppercase shadow-[0_0_15px_#00FFFF66]">Verifikasi Admin</button>
              <button onClick={() => setShowAdminLoginModal(false)} className="px-3 glass text-white/40 text-xs rounded-xl font-bold">Batal</button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* DASHBOARD */}
      {screen === 'DASHBOARD' && (
        <div className="px-6 pt-24 pb-32 space-y-6 animate-in fade-in duration-500">
          
          {/* BANNER PROMOSI WIDESCREEN */}
          <div className="relative w-full rounded-2xl overflow-hidden glass border border-[#00FFFF]/30 shadow-xl bg-gradient-to-r from-[#1A0B3B] via-[#0B011E] to-[#1A0B3B] min-h-[220px] flex items-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.15)_0%,transparent_75%)] pointer-events-none"></div>
            
            <div className="absolute inset-0 z-0 opacity-40">
              <img src={PROMO_BANNERS[currentBannerIndex].image} className="w-full h-full object-cover filter brightness-75 scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B011E] via-[#0B011E]/80 to-transparent"></div>
            </div>

            <div className="relative z-10 w-full px-6 py-6 flex flex-col justify-between space-y-3">
              <span className="bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/40 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest w-max shadow-[0_0_10px_rgba(0,255,255,0.3)]">
                {PROMO_BANNERS[currentBannerIndex].badge}
              </span>
              
              <h2 className="text-lg md:text-2xl font-black italic tracking-tighter uppercase text-white drop-shadow-md">
                {PROMO_BANNERS[currentBannerIndex].title}
              </h2>
              
              <p className="text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-wider max-w-md leading-relaxed">
                {PROMO_BANNERS[currentBannerIndex].subtitle}
              </p>

              <div className="pt-1">
                <button onClick={() => setScreen('DASHBOARD')} className="bg-[#FFCC00] hover:bg-[#ffdb4d] text-black px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(255,204,0,0.4)] active:scale-95 transition-all">
                  {PROMO_BANNERS[currentBannerIndex].buttonText}
                </button>
              </div>
            </div>

            {/* Slider Dots */}
            <div className="absolute bottom-3 right-4 z-20 flex gap-1.5">
              {PROMO_BANNERS.map((_, idx) => (
                <button 
                  key={`dot-${idx}`}
                  onClick={() => setCurrentBannerIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${currentBannerIndex === idx ? 'w-5 bg-[#00FFFF]' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>

            <button 
              onClick={() => setCurrentBannerIndex((prev) => (prev === 0 ? PROMO_BANNERS.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full glass border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all text-xs z-20"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % PROMO_BANNERS.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full glass border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all text-xs z-20"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <GlassCard className="bg-gradient-to-br from-[#1A0B3B] to-[#0B011E] border-white/10">
            <div className="flex gap-4 items-center mb-4">
              <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-[#00FFFF] object-cover bg-white/5" />
              <div className="flex-1">
                <h3 className="font-black text-xs uppercase italic tracking-tighter">{user.username}</h3>
                <p className="text-[#00FFFF] text-[8px] font-bold uppercase tracking-widest">{user.status} LV. {user.level}</p>
              </div>
              {user.role === 'GUEST' && (
                <button onClick={() => setScreen('SPLASH')} className="text-[8px] bg-indigo-600 px-3 py-1.5 rounded-lg font-black uppercase">Login</button>
              )}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <div>
                <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">Saldo Galaksi</p>
                <p className="text-xl font-black italic tracking-tighter">
                  {user.role === 'GUEST' ? 'Rp 0 (Mode Guest)' : `Rp ${balance?.toLocaleString() ?? 0}`}
                </p>
              </div>
              <button 
                onClick={() => {
                  if (user.role === 'GUEST') {
                    alert('Mode Guest tidak bisa menyimpan saldo. Silakan masuk / daftar akun terlebih dahulu!');
                    setScreen('SPLASH');
                  } else {
                    setScreen('TOPUP_BALANCE');
                  }
                }} 
                className="bg-[#00FFFF] text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_#00FFFF44]"
              >
                Isi Saldo
              </button>
            </div>
          </GlassCard>

          {/* FLASH SALE SECTION */}
          {flashSaleGames.length > 0 && (
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Flame className="text-red-500 animate-pulse" size={18} />
                  <h3 className="text-xs font-black uppercase italic tracking-widest text-red-400">Flash Sale Galaksi</h3>
                </div>
                <div className="flex items-center gap-1 glass px-2.5 py-1 rounded-lg border-red-500/30 text-[9px] font-black text-red-400">
                  <Timer size={12} /> 28d 23h
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {flashSaleGames.map(g => (
                  <GlassCard key={`fs-${g.id}`} onClick={() => { setSelectedGame(g); setScreen('GAME_DETAIL'); }} className="min-w-[140px] p-0 overflow-hidden relative group border-red-500/20" hoverEffect>
                    <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase shadow-lg">
                      -{g.discount}%
                    </div>
                    <img src={g.image} className="w-full h-28 object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B011E] via-transparent to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-[10px] font-black uppercase italic truncate">{g.name}</p>
                      <p className="text-[#00FFFF] text-[8px] font-bold uppercase">{g.category}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          )}

          {/* FILTER KATEGORI GAME */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border ${selectedCategory === cat ? 'bg-[#00FFFF] text-black border-[#00FFFF]' : 'glass text-white/60 border-white/5'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* KATALOG GAME */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase italic tracking-widest">Semua Game</h3>
            <div className="grid grid-cols-2 gap-4">
              {filteredGames.map(g => (
                <GlassCard key={g.id} onClick={() => { setSelectedGame(g); setScreen('GAME_DETAIL'); }} className="p-0 overflow-hidden h-36 relative group border-white/5" hoverEffect>
                  <img src={g.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B011E] via-transparent to-transparent"></div>
                  <div className="absolute bottom-2 left-2">
                    <p className="text-[10px] font-black uppercase italic">{g.name}</p>
                    <p className="text-[#00FFFF] text-[7px] font-bold uppercase">{g.category}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ISI SALDO GALAKSI - NOMINAL */}
      {screen === 'TOPUP_BALANCE' && (
        <div className="px-6 pt-24 pb-32 space-y-6 animate-in slide-in-from-bottom-8">
          <button onClick={() => setScreen('DASHBOARD')} className="glass p-2 rounded-xl border-white/10"><ArrowLeft size={18} /></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Isi Saldo Galaksi</h2>

          <GlassCard className="p-6 border-[#00FFFF]/30 space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-white/40 block mb-2">Nominal Pengisian (Rp)</label>
              <input 
                type="number" 
                placeholder="Contoh: 50000" 
                value={topupAmountInput} 
                onChange={(e) => setTopupAmountInput(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-lg font-black outline-none text-[#00FFFF]" 
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[20000, 50000, 100000, 200000, 500000, 1000000].map(amt => (
                <button 
                  key={amt} 
                  onClick={() => setTopupAmountInput(amt.toString())} 
                  className="glass py-2 rounded-xl text-[10px] font-black text-white hover:text-[#00FFFF] border-white/5"
                >
                  Rp {amt.toLocaleString()}
                </button>
              ))}
            </div>

            <button 
              onClick={handleProceedTopupPayment} 
              className="w-full bg-[#00FFFF] text-black py-3.5 rounded-xl font-black text-xs uppercase shadow-[0_0_20px_#00FFFF66] flex items-center justify-center gap-2"
            >
              <PlusCircle size={16} /> Lanjut ke Pembayaran
            </button>
          </GlassCard>
        </div>
      )}

      {/* DETAIL GAME */}
      {screen === 'GAME_DETAIL' && selectedGame && (
        <div className="px-6 pt-24 pb-32 space-y-6 animate-in slide-in-from-bottom-8">
          <button onClick={() => setScreen('DASHBOARD')} className="glass p-2 rounded-xl border-white/10"><ArrowLeft size={18} /></button>
          <div className="flex gap-4 items-center">
            <img src={selectedGame.image} className="w-20 h-20 rounded-2xl border-2 border-white/10 object-cover shadow-2xl" />
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter">{selectedGame.name}</h2>
              <span className="text-[#00FFFF] text-[10px] font-black uppercase tracking-widest">{selectedGame.category}</span>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest">Masukkan Data Akun & Cek Nickname</h3>
            <div className="glass p-4 rounded-2xl space-y-3 border-white/10">
              <div className="flex gap-3">
                <input placeholder="USER ID GAME" value={userIdGame} onChange={(e) => setUserIdGame(e.target.value)} className="bg-transparent text-white font-black text-xs outline-none w-full uppercase" />
                <div className="w-[1px] bg-white/10 h-6"></div>
                <input placeholder="ZONE ID" value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="bg-transparent text-white font-black text-xs outline-none w-24 uppercase" />
              </div>
              <button onClick={handleVerifyId} className="w-full bg-white/10 text-[#00FFFF] py-2 rounded-xl font-black text-[10px] uppercase border border-[#00FFFF]/30">
                {isVerifying ? 'Memeriksa ID...' : 'Cek Nickname ID Game'}
              </button>
              {verifiedNickname && (
                <div className="p-2.5 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <span className="text-xs font-black text-green-400 uppercase">Nickname Valid: {verifiedNickname}</span>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest">Nomor WhatsApp Bukti Resi</h3>
            <div className="glass p-3 rounded-2xl border-white/10">
              <input placeholder="Contoh: 081234567890" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="bg-transparent text-white font-black text-xs outline-none w-full" />
            </div>
          </section>

          {/* KODE PROMO */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest">Kode Promo (Gunakan: ANGGATAMPAN)</h3>
            <div className="flex gap-2">
              <input placeholder="Masukkan Kode Promo..." value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="flex-1 glass p-3 rounded-xl text-xs font-black uppercase outline-none text-[#00FFFF]" />
              <button onClick={handleApplyPromo} className="bg-indigo-600 px-4 rounded-xl text-xs font-black uppercase">Pakai</button>
            </div>
            {promoSuccess && <p className="text-[9px] text-green-400 font-bold uppercase">Promo Diskon Rp 10.000 Berhasil Dipasang!</p>}
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest">Pilih Nominal Top Up</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedGame.nominals.map(n => {
                const isDisc = selectedGame.discount > 0;
                const basePrice = isDisc ? Math.round(n.price * (1 - selectedGame.discount / 100)) : n.price;
                const finalPrice = Math.max(0, basePrice - discountAmount);

                return (
                  <GlassCard key={n.id} onClick={() => { setPending({ type: 'GAME', gameName: selectedGame.name, gameIcon: selectedGame.image, nominal: n.amount, price: basePrice, finalPrice: finalPrice }); setScreen('PAYMENT'); }} className="flex flex-col items-center py-5 border-white/5" hoverEffect>
                    <span className="font-black text-xs italic uppercase text-center">{n.amount}</span>
                    <span className="text-[#00FFFF] text-[10px] font-black tracking-widest mt-1">Rp {finalPrice.toLocaleString()}</span>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* METODE PEMBAYARAN */}
      {screen === 'PAYMENT' && pending && (
        <div className="px-6 pt-24 pb-32 space-y-6 animate-in slide-in-from-right-8">
          <button onClick={() => setScreen(pending.type === 'BALANCE' ? 'TOPUP_BALANCE' : 'GAME_DETAIL')} className="glass p-2 rounded-xl border-white/10"><ArrowLeft size={18} /></button>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Pilih Metode Pembayaran</h2>
          
          <GlassCard className="bg-[#00FFFF]/5 border-[#00FFFF]/20">
            <p className="text-[9px] font-black uppercase text-white/40">Pesanan: {pending.gameName}</p>
            <p className="text-xs font-black uppercase text-white mb-2">{pending.nominal}</p>
            <p className="text-[9px] font-black uppercase text-white/40">Total Pembayaran</p>
            <p className="text-2xl font-black italic text-[#00FFFF]">Rp {pending.finalPrice?.toLocaleString() ?? pending.price?.toLocaleString() ?? 0}</p>
          </GlassCard>

          {isProcessingPayment && (
            <div className="p-4 glass border border-[#00FFFF]/40 rounded-2xl text-center text-xs font-black uppercase text-[#00FFFF] animate-pulse">
              Menghubungkan ke Payment Gateway Midtrans...
            </div>
          )}

          <div className="space-y-3">
            {PAYMENT_METHODS.filter(m => !(pending.type === 'BALANCE' && m.id === 'WALLET')).map(m => (
              <GlassCard key={m.id} onClick={() => handleInitiatePayment(m.id)} className="flex items-center gap-4 border-white/5" hoverEffect>
                <div className="text-[#00FFFF] p-2 bg-white/5 rounded-lg">{m.icon}</div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-black uppercase tracking-widest">{m.name}</p>
                  <p className="text-[8px] text-white/40 font-bold uppercase">{m.category}</p>
                </div>
                <ChevronRight size={16} className="text-white/20" />
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* DASHBOARD ADMIN */}
      {screen === 'ADMIN' && (
        user?.role === 'ADMIN' ? (
          <div className="px-6 pt-24 pb-32 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <button onClick={() => setScreen('DASHBOARD')} className="glass p-2 rounded-xl border-white/10"><ArrowLeft size={18} /></button>
              <h2 className="text-lg font-black italic uppercase text-[#00FFFF]">Admin Control Panel</h2>
              <button onClick={fetchDatabaseTransactions} className="glass p-2 rounded-xl text-white/60"><RefreshCw size={16} /></button>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Semua Transaksi Real-Time di Database MongoDB Atlas</h3>
              {allDbTransactions.length === 0 ? (
                <p className="text-center text-xs text-white/20 py-10">Belum ada data transaksi tersimpan.</p>
              ) : (
                allDbTransactions.map((tx: any) => (
                  <GlassCard key={tx._id} className="p-4 space-y-3 border-white/10 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-xs uppercase text-[#00FFFF]">{tx.game}</h4>
                        {tx.orderId && <p className="text-[8px] text-white/50 font-mono">{tx.orderId}</p>}
                        <p className="text-[9px] text-white/70 font-bold">ID / User: {tx.userIdGame} (Server: {tx.zoneId})</p>
                        <p className="text-[8px] text-white/40">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${tx.status === 'Success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>{tx.status}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <div>
                        <p className="text-[9px] font-black text-white">{tx.nominal}</p>
                        <p className="text-[10px] font-black text-[#00FFFF]">Rp {tx.harga?.toLocaleString()}</p>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleUpdateStatusAdmin(tx._id, tx.status)} className="bg-indigo-600 px-3 py-1 rounded text-[8px] font-black uppercase">Ubah Status</button>
                        <button onClick={() => handleDeleteAdminTx(tx._id)} className="bg-red-600 px-2 py-1 rounded text-[8px] font-black text-white"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 pt-32 text-center space-y-4">
            <ShieldAlert size={48} className="text-red-500 mx-auto" />
            <h3 className="text-lg font-black uppercase text-red-500">Akses Ditolak!</h3>
            <p className="text-xs text-white/50">Anda tidak memiliki otoritas Administrator untuk melihat halaman ini.</p>
            <button onClick={() => setScreen('DASHBOARD')} className="bg-[#00FFFF] text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase">Kembali ke Dashboard</button>
          </div>
        )
      )}

      {/* RIWAYAT TRANSAKSI CUSTOMER */}
      {screen === 'HISTORY' && (
        <div className="px-6 pt-24 pb-32 space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Riwayat Transaksi Saya</h2>
            <button onClick={fetchDatabaseTransactions} className="glass p-2 rounded-xl text-white/60"><RefreshCw size={16} /></button>
          </div>
          {myTransactions.length === 0 ? (
            <div className="py-20 text-center text-white/20 uppercase font-black tracking-[0.3em] text-xs">BELUM ADA RIWAYAT TRANSAKSI</div>
          ) : (
            <div className="space-y-3">
              {myTransactions.map((tx: any) => (
                <GlassCard key={tx._id} className="flex items-center gap-4 border-white/5">
                  <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[#00FFFF] font-black text-xs uppercase">
                    {tx.game ? tx.game.slice(0, 3) : 'TOP'}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-[10px] font-black italic uppercase tracking-tighter">{tx.game}</h4>
                    <p className="text-[7px] text-white/40 font-bold uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString()} | {tx.userIdGame}</p>
                    <p className="text-[7px] text-[#00FFFF] font-bold uppercase">{tx.metodePembayaran}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[#00FFFF] font-black text-xs tracking-tighter">Rp {tx.harga?.toLocaleString()}</p>
                    <span className={`block text-[7px] font-black uppercase tracking-[0.2em] ${tx.status === 'Success' ? 'text-green-400' : 'text-yellow-400'}`}>{tx.status}</span>
                    {tx.status === 'Pending' && tx.snapToken && tx.orderId && (
                      <button
                        onClick={() => openMidtransSnap(tx.snapToken, tx.orderId, tx.game === 'Isi Saldo Galaksi', tx.harga)}
                        className="bg-[#00FFFF] text-black px-2.5 py-1 rounded-lg text-[8px] font-black uppercase"
                      >
                        Bayar Sekarang
                      </button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROFIL */}
      {screen === 'PROFILE' && (
        <div className="px-6 pt-32 pb-32 flex flex-col items-center text-center animate-in fade-in">
          <div className="relative mb-6">
            <img src={user.avatar} className="w-28 h-28 rounded-full border-4 border-[#00FFFF] p-1.5 shadow-[0_0_30px_#00FFFF66] object-cover bg-white/5" />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">{user.username}</h2>
          <span className="text-[#00FFFF] text-[10px] font-black uppercase tracking-[0.5em] mb-8 block">{user.status}</span>
          
          <button onClick={() => setScreen('SPLASH')} className="w-full glass py-4 rounded-2xl text-red-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 border-red-500/20 active:bg-red-500/10">
            <LogOut size={18} /> KELUAR / GANTI AKUN
          </button>
        </div>
      )}

      {/* BOTTOM NAV BAR */}
      {!['SPLASH', 'GAME_DETAIL', 'PAYMENT', 'ADMIN'].includes(screen) && (
        <div className="fixed bottom-6 left-6 right-6 h-16 glass rounded-2xl flex items-center justify-around z-[150] shadow-[0_10px_40px_rgba(0,0,0,0.8)] border-white/10">
          {[
            { id: 'DASHBOARD', icon: <LayoutDashboard size={20} /> },
            { id: 'HISTORY', icon: <History size={20} /> },
            { id: 'PROFILE', icon: <User size={20} /> }
          ].map(item => (
            <button key={item.id} onClick={() => setScreen(item.id as Screen)} className={`p-3 rounded-xl transition-all active:scale-75 ${screen === item.id ? 'text-[#00FFFF] drop-shadow-[0_0_8px_#00FFFF]' : 'text-white/20'}`}>{item.icon}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;