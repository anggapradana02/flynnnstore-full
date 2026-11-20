import { auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, History, User, LogOut, 
  Search, ArrowLeft, CheckCircle2, Wallet, QrCode, 
  Banknote, CreditCard as CardIcon, 
  Smartphone as PhoneIcon, Timer, Flame, 
  Lock, LogIn, ShieldAlert, ChevronRight, UserCheck, Shield, Trash2, RefreshCw, KeyRound, PlusCircle, MessageSquare, ChevronLeft, Sparkles, Check
} from 'lucide-react';
import { Screen, Game, UserProfile } from '../types';
import { MOCK_GAMES } from '../constants';
import { db } from '../db';
import GlassCard from '../components/GlassCard';

declare global {
  interface Window {
    snap: any;
  }
}

const TechLogo = ({ size = 40, animated = false }: { size?: number, animated?: boolean }) => (
  <div style={{ width: size, height: size }} className={`relative shrink-0 ${animated ? 'animate-pulse' : 'drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]'}`}>
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="hexG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#00E5FF"/><stop offset="100%" stopColor="#D500F9"/></linearGradient>
      </defs>
      <path d="M100 10 L180 55 L180 145 L100 190 L20 145 L20 55 Z" stroke="url(#hexG)" strokeWidth="2.5" fill="rgba(0, 229, 255, 0.08)"/>
      <path d="M100 40 L155 70 L155 130 L100 160 L45 130 L45 70 Z" fill="#14082E" stroke="url(#hexG)" strokeWidth="4"/>
      <path d="M75 70 H130 L135 85 H95 V105 H125 L130 120 H100 L95 145 H75 L80 120 L85 105 L90 85 L75 70Z" fill="white"/>
      <path d="M85 125 L115 100" stroke="#00E5FF" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  </div>
);

const StoreTitle = ({ className = "" }) => (
  <h1 className={`text-xl sm:text-2xl font-black italic tracking-tighter bg-gradient-to-r from-[#00E5FF] via-white to-[#D500F9] bg-clip-text text-transparent uppercase leading-none ${className}`}>
    FLYNNNSTORE
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

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const [userIdGame, setUserIdGame] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [verifiedNickname, setVerifiedNickname] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [topupAmountInput, setTopupAmountInput] = useState('');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInputName, setAuthInputName] = useState('');
  const [authInputPassword, setAuthInputPassword] = useState('');
  const [authInputPhone, setAuthInputPhone] = useState('');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [serverOtp, setServerOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');

  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [allDbTransactions, setAllDbTransactions] = useState<any[]>([]);

  const getAuthHeaders = (json = false) => {
    const sessionToken = user?.token || JSON.parse(localStorage.getItem('flynnn_active_session') || '{}')?.token;
    return {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {})
    };
  };

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

  const saveActiveSession = (userData: any) => {
    localStorage.setItem('flynnn_active_session', JSON.stringify(userData));
  };

  const creditBalanceSafely = async (orderId: string, amountToAdd: number) => {
    const creditedOrders = JSON.parse(localStorage.getItem('flynnn_credited_orders') || '[]');
    if (creditedOrders.includes(orderId)) return;

    creditedOrders.push(orderId);
    localStorage.setItem('flynnn_credited_orders', JSON.stringify(creditedOrders));

    const currentProfile = user.username ? user : await db.getUserProfile();
    if (!currentProfile || currentProfile.role === 'GUEST') return;

    const registeredUsers = JSON.parse(localStorage.getItem('flynnn_registered_users') || '{}');
    const currentBal = registeredUsers[currentProfile.username]?.balance ?? currentProfile.balance ?? 0;
    const newBal = currentBal + amountToAdd;

    const updatedUser = { ...currentProfile, balance: newBal };
    await db.updateUserProfile(updatedUser);
    setUser(updatedUser);
    setBalance(newBal);
    saveActiveSession(updatedUser);

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
        method: 'POST',
        headers: getAuthHeaders()
      });
      const verifyData = await res.json();

      if (verifyData.success && verifyData.data) {
        if (verifyData.data.status === 'Success' && verifyData.data.game === 'Isi Saldo Galaksi') {
          await creditBalanceSafely(returnedOrderId, Number(verifyData.data.harga));
        }

        const activeSession = JSON.parse(localStorage.getItem('flynnn_active_session') || '{}');
        if (activeSession.username) {
          setUser(activeSession);
          setBalance(activeSession.balance || 0);
        }

        await fetchDatabaseTransactions(activeSession.username, activeSession.role);
        setScreen('DASHBOARD');

        if (verifyData.data.status === 'Success') {
          alert('Pembayaran Midtrans Berhasil! Saldo/Pesanan kamu telah diproses.');
        } else {
          alert('Transaksi tercatat. Cek riwayat transaksi untuk info status.');
        }
      }
    } catch (err) {
      console.error('Gagal memverifikasi redirect Midtrans:', err);
      const activeSession = JSON.parse(localStorage.getItem('flynnn_active_session') || '{}');
      if (activeSession.username) {
        setUser(activeSession);
        setBalance(activeSession.balance || 0);
        await fetchDatabaseTransactions(activeSession.username, activeSession.role);
        setScreen('DASHBOARD');
      }
    }
  };

  const loadData = async () => {
    const activeSession = JSON.parse(localStorage.getItem('flynnn_active_session') || '{}');
    if (activeSession.username) {
      setUser(activeSession);
      setBalance(activeSession.balance || 0);
      setDbSynced(true);
      await fetchDatabaseTransactions(activeSession.username, activeSession.role);
      setScreen('DASHBOARD');
      return;
    }

    const p = await db.getUserProfile();
    if (!p || p.role === 'GUEST') {
      const guestProfile = { username: 'GUEST COMMANDER', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest', status: 'Guest User', level: 1, balance: 0, role: 'GUEST' };
      setUser(guestProfile);
      setBalance(0);
      saveActiveSession(guestProfile);
    } else {
      const registeredUsers = JSON.parse(localStorage.getItem('flynnn_registered_users') || '{}');
      if (registeredUsers[p.username]) {
        p.balance = registeredUsers[p.username].balance;
      }
      setUser(p);
      setBalance(p.balance || 0);
      saveActiveSession(p);
    }
    setDbSynced(true);
    await fetchDatabaseTransactions(user.username, user.role);
  };

  const fetchDatabaseTransactions = async (currentUsername?: string, currentRole?: string) => {
    try {
      const uname = currentUsername || user.username;
      const urole = currentRole || user.role;

      const url = (urole === 'ADMIN') 
        ? `${API_BASE}/api/transactions` 
        : `${API_BASE}/api/transactions?userId=${encodeURIComponent(uname || '')}`;

      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAllDbTransactions(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data dari MongoDB Atlas:', err);
    }
  };

  const handleVerifyId = async () => {
    if (!userIdGame) {
      alert('Masukkan User ID Game terlebih dahulu!');
      return;
    }
    setIsVerifying(true);
    setVerifiedNickname('');

    try {
      const response = await fetch(`${API_BASE}/api/games/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameCode: selectedGame?.name.toLowerCase().includes('mobile legends') ? 'mobile-legends' : 'free-fire',
          userId: userIdGame.trim(),
          zoneId: zoneId.trim()
        })
      });

      const data = await response.json();
      setIsVerifying(false);

      if (response.ok && data.success && data.nickname) {
        setVerifiedNickname(data.nickname);
      } else {
        alert(data.message || 'Gagal memverifikasi ID game. Periksa kembali User ID & Zone ID.');
      }
    } catch (err) {
      setIsVerifying(false);
      console.error('Network Error:', err);
      alert('Terjadi kesalahan jaringan saat menghubungi server game.');
    }
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
          const verifyRes = await fetch(`${API_BASE}/api/transactions/verify/${orderId}`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
          const verifyData = await verifyRes.json();
          
          if (verifyRes.ok && verifyData.success && verifyData.data?.status === 'Success' && isBalanceTopup) {
            await creditBalanceSafely(orderId, amount);
          }
        } catch (err) {
          console.error('Gagal verifikasi otomatis ke backend:', err);
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
        try {
          await fetch(`${API_BASE}/api/transactions/verify/${orderId}`, {
            method: 'POST',
            headers: getAuthHeaders()
          });
        } catch (e) {}

        alert('Jendela pembayaran ditutup. Status transaksi diperbarui.');
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

    if (method === 'WALLET' && pending.type === 'GAME') {
      if (balance < finalPrice) {
        alert(`Saldo tidak cukup! Saldo kamu Rp ${balance?.toLocaleString() ?? 0}. Silakan isi saldo terlebih dahulu.`);
        return;
      }

      setIsProcessingPayment(true);
      try {
        await fetch(`${API_BASE}/api/transactions`, {
          method: 'POST',
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            game: pending.gameName,
            userIdGame: `${userIdGame} (${verifiedNickname || 'Unverified'})`,
            zoneId: zoneId || '-',
            nominal: pending.nominal,
            harga: finalPrice,
            metodePembayaran: method,
            status: 'Success',
            userId: user.username,
            promoCode
          })
        });

        const newBal = Math.max(0, balance - finalPrice);
        const updatedUser = { ...user, balance: newBal };
        await db.updateUserProfile(updatedUser);
        setUser(updatedUser);
        setBalance(newBal);
        saveActiveSession(updatedUser);

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

    setIsProcessingPayment(true);
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          game: pending.gameName,
          userIdGame: pending.type === 'BALANCE' ? `${user.username} (Topup Saldo)` : `${userIdGame} (${verifiedNickname || 'Unverified'})`,
          zoneId: zoneId || '-',
          nominal: pending.nominal,
          harga: finalPrice,
          metodePembayaran: method,
          status: 'Pending',
          userId: user.username,
          whatsapp,
          promoCode
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
    await fetchDatabaseTransactions(user.username, user.role);
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
    await fetch(`${API_BASE}/api/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    fetchDatabaseTransactions(user.username, user.role);
  };

  const handleUpdateStatusAdmin = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Success' ? 'Pending' : 'Success';
    try {
      await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ status: nextStatus })
      });
      fetchDatabaseTransactions(user.username, user.role);
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

    try {
      let targetPhone = phone;

      if (authMode === 'LOGIN') {
        const checkRes = await fetch(`${API_BASE}/api/auth/login-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const checkData = await checkRes.json();

        if (!checkRes.ok || !checkData.success) {
          alert(checkData.message || 'Gagal memeriksa akun.');
          return;
        }
        targetPhone = checkData.user?.phone || phone || '081234567890';
      }

      const res = await fetch(`${API_BASE}/api/auth/send-whatsapp-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone })
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
      alert('Gagal terhubung ke server. Pastikan server backend aktif.');
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

    try {
      if (authMode === 'REGISTER') {
        const regRes = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, phone })
        });
        const regData = await regRes.json();

        if (!regRes.ok || !regData.success) {
          alert(regData.message || 'Gagal menyimpan akun baru ke database.');
          return;
        }

        const newUser = { ...regData.user, token: regData.token };
        await db.updateUserProfile(newUser);
        setUser(newUser);
        setBalance(newUser.balance || 0);
        saveActiveSession(newUser);

        setShowAuthModal(false);
        setIsOtpStep(false);
        setInputOtp('');
        setAuthInputName('');
        setAuthInputPassword('');
        setAuthInputPhone('');
        setScreen('DASHBOARD');
        await fetchDatabaseTransactions(username, 'USER');
        alert(`Pendaftaran Berhasil & Tersimpan di Database! Selamat Datang, ${username}.`);
      } else {
        const loginRes = await fetch(`${API_BASE}/api/auth/login-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok || !loginData.success) {
          alert(loginData.message || 'Gagal memuat data akun.');
          return;
        }

        const existingUser = { ...loginData.user, token: loginData.token };
        await db.updateUserProfile(existingUser);
        setUser(existingUser);
        setBalance(existingUser.balance || 0);
        saveActiveSession(existingUser);

        setShowAuthModal(false);
        setIsOtpStep(false);
        setInputOtp('');
        setAuthInputName('');
        setAuthInputPassword('');
        setAuthInputPhone('');
        setScreen('DASHBOARD');
        await fetchDatabaseTransactions(username, 'USER');
        alert(`Login Berhasil & Terverifikasi WhatsApp OTP! Selamat Datang Kembali, ${username}.`);
      }
    } catch (err) {
      console.error('Error verifikasi akun:', err);
      alert('Terjadi kesalahan saat menyimpan/memuat akun dari server.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      const requestedUser = {
        username: googleUser.displayName ? googleUser.displayName.toUpperCase() : 'GOOGLE USER',
        email: googleUser.email,
        avatar: googleUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=Google'
      };

      const backendRes = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestedUser)
      });
      const backendData = await backendRes.json();
      if (!backendRes.ok || !backendData.success) {
        throw new Error(backendData.message || 'Gagal membuat sesi Google');
      }

      const userData = { ...backendData.user, token: backendData.token };

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
      saveActiveSession(userData);

      setShowAuthModal(false);
      setScreen('DASHBOARD');
      await fetchDatabaseTransactions(userData.username, 'USER');
      
      alert(`Berhasil Masuk dengan Akun Google: ${userData.username}`);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('Gagal masuk menggunakan Google. Pastikan konfigurasi Firebase sudah benar.');
    }
  };

  const handleSelectGuest = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/guest`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal membuat sesi guest');
      }

      const guestProfile = { ...data.user, token: data.token };
      await db.updateUserProfile(guestProfile);
      setUser(guestProfile);
      setBalance(0);
      saveActiveSession(guestProfile);
      setScreen('DASHBOARD');
      await fetchDatabaseTransactions(guestProfile.username, 'GUEST');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal masuk sebagai guest');
    }
  };

  const handleAdminAuthSubmit = async () => {
    const userClean = adminUsernameInput.trim();
    const passClean = adminPasswordInput.trim();

    try {
      const res = await fetch(`${API_BASE}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userClean, password: passClean })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || 'Akses Ditolak!');
        return;
      }

      const p = { ...data.user, token: data.token };
      await db.updateUserProfile(p);
      setUser(p);
      setBalance(p.balance);
      saveActiveSession(p);

      setShowAdminLoginModal(false);
      setAdminUsernameInput('');
      setAdminPasswordInput('');
      setScreen('ADMIN');
      await fetchDatabaseTransactions(p.username, 'ADMIN');
      alert('Akses Diterima! Selamat Datang, Administrator.');
    } catch (error) {
      alert('Gagal terhubung ke server administrasi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('flynnn_active_session');
    const guestProfile = { username: 'GUEST COMMANDER', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest', status: 'Guest User', level: 1, balance: 0, role: 'GUEST' };
    setUser(guestProfile);
    setBalance(0);
    setScreen('SPLASH');
  };

  const filteredGames = MOCK_GAMES.filter(g => {
    const matchCat = selectedCategory === 'Semua' || g.category === selectedCategory;
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const flashSaleGames = MOCK_GAMES.filter(g => g.discount > 0);

  return (
    <div className="min-h-screen relative text-white bg-[#070114] selection:bg-[#00E5FF] selection:text-black overflow-x-hidden">
      <style>{`
        .glass {
          background: rgba(20, 10, 46, 0.68);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Ambient Luxury Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full bg-[#00E5FF]/10 blur-[140px]"></div>
        <div className="absolute top-1/3 right-0 w-[420px] h-[420px] rounded-full bg-[#D500F9]/10 blur-[140px]"></div>
      </div>

      {/* TOP NAVIGATION BAR */}
      {screen !== 'SPLASH' && (
        <header className="fixed top-0 left-0 right-0 h-20 z-[250] bg-[#09021A]/85 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
            <button onClick={() => setScreen('DASHBOARD')} className="flex items-center gap-3 text-left group">
              <TechLogo size={42} />
              <div className="flex flex-col">
                <StoreTitle />
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${dbSynced ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]' : 'bg-rose-500'}`}></span>
                  <span className="text-[8px] sm:text-[9px] text-white/60 uppercase font-black tracking-wider">
                    {dbSynced ? 'MONGODB & MIDTRANS LIVE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            </button>

            {/* Desktop Quick Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              {[
                { id: 'DASHBOARD', label: 'Katalog', icon: <LayoutDashboard size={15} /> },
                { id: 'HISTORY', label: 'Riwayat', icon: <History size={15} /> },
                { id: 'PROFILE', label: 'Akun', icon: <User size={15} /> }
              ].map((nav) => (
                <button
                  key={nav.id}
                  onClick={() => setScreen(nav.id as Screen)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    screen === nav.id
                      ? 'bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] text-black shadow-[0_0_20px_rgba(0,229,255,0.35)]'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {nav.icon}
                  {nav.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {user?.role !== 'GUEST' && (
                <button
                  onClick={() => setScreen('TOPUP_BALANCE')}
                  className="hidden sm:flex items-center gap-2 glass px-3.5 py-2 rounded-xl border border-[#00E5FF]/30 hover:border-[#00E5FF] transition-all"
                >
                  <Wallet size={15} className="text-[#00E5FF]" />
                  <span className="text-xs font-black text-white">Rp {balance?.toLocaleString() ?? 0}</span>
                </button>
              )}

              {user?.role === 'ADMIN' ? (
                <button
                  onClick={() => { fetchDatabaseTransactions(user.username, user.role); setScreen('ADMIN'); }}
                  className="bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 px-3.5 py-2 rounded-xl text-xs font-black uppercase text-[#00E5FF] border border-[#00E5FF]/40 flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all"
                >
                  <Shield size={15} /> Panel Admin
                </button>
              ) : (
                <button
                  onClick={() => setShowAdminLoginModal(true)}
                  title="Login Administrator"
                  className="glass p-2.5 rounded-xl text-white/40 hover:text-[#00E5FF] border border-white/10 hover:border-[#00E5FF]/40 transition-all"
                >
                  <Lock size={15} />
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* SPLASH / GATEWAY SCREEN */}
      {screen === 'SPLASH' && (
        <div className="min-h-screen bg-[#070114] relative flex flex-col items-center justify-center px-6 py-12 text-center z-[500]">
          <div className="w-full max-w-md glass border border-white/10 rounded-[2rem] p-7 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative">
            <div className="flex flex-col items-center">
              <TechLogo size={104} animated />
              <StoreTitle className="mt-5 text-2xl sm:text-3xl" />
              <p className="text-white/55 text-xs mt-2 font-medium">
                Platform Top-Up Game Instan • Terhubung MongoDB & Midtrans
              </p>
            </div>

            {!showAuthModal ? (
              <div className="mt-8 flex flex-col gap-3 w-full">
                <button
                  onClick={() => { setAuthMode('LOGIN'); setShowAuthModal(true); setIsOtpStep(false); }}
                  className="w-full bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] text-black py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn size={17} /> Masuk Akun
                </button>
                <button
                  onClick={() => { setAuthMode('REGISTER'); setShowAuthModal(true); setIsOtpStep(false); }}
                  className="w-full bg-white/5 hover:bg-white/10 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest text-[#00E5FF] border border-[#00E5FF]/35 active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
                >
                  <PlusCircle size={17} /> Daftar Akun Baru (WhatsApp OTP)
                </button>
                
                <button 
                  onClick={handleGoogleLogin} 
                  className="w-full bg-white/5 hover:bg-white/10 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest text-white border border-white/15 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                  Masuk dengan Akun Google
                </button>

                <button
                  onClick={handleSelectGuest}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.07] py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest text-white/75 border border-white/10 active:scale-[0.98] flex items-center justify-center gap-2 transition-all"
                >
                  <UserCheck size={17} /> Lanjut Sebagai Guest
                </button>
                
                <button
                  onClick={() => setShowAdminLoginModal(true)}
                  className="mt-3 text-[11px] font-bold uppercase text-white/35 hover:text-[#00E5FF] tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                >
                  <KeyRound size={13} /> Login Khusus Administrator
                </button>
              </div>
            ) : (
              <div className="mt-7 bg-[#0E0524]/90 border border-white/10 p-5 sm:p-6 rounded-3xl w-full space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-sm uppercase text-[#00E5FF] tracking-wide">
                    {!isOtpStep 
                      ? (authMode === 'LOGIN' ? 'Masuk ke Akun Kamu' : 'Pendaftaran Akun Baru') 
                      : 'Verifikasi WhatsApp OTP'}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                    {authMode}
                  </span>
                </div>

                {!isOtpStep ? (
                  <>
                    <div className="space-y-2.5">
                      <input 
                        placeholder="Username..." 
                        value={authInputName} 
                        onChange={(e) => setAuthInputName(e.target.value)} 
                        className="w-full bg-white/5 border border-white/15 focus:border-[#00E5FF] px-4 py-3 rounded-xl text-xs font-bold outline-none uppercase text-[#00E5FF] placeholder:text-white/30" 
                      />
                      <input 
                        type="password" 
                        placeholder="Password..." 
                        value={authInputPassword} 
                        onChange={(e) => setAuthInputPassword(e.target.value)} 
                        className="w-full bg-white/5 border border-white/15 focus:border-[#00E5FF] px-4 py-3 rounded-xl text-xs font-bold outline-none text-white placeholder:text-white/30" 
                      />
                      {authMode === 'REGISTER' && (
                        <input 
                          type="text" 
                          placeholder="Nomor WhatsApp (Contoh: 0812...)" 
                          value={authInputPhone} 
                          onChange={(e) => setAuthInputPhone(e.target.value)} 
                          className="w-full bg-white/5 border border-white/15 focus:border-[#00E5FF] px-4 py-3 rounded-xl text-xs font-bold outline-none text-white placeholder:text-white/30" 
                        />
                      )}
                    </div>

                    <button
                      onClick={handleRequestOtp}
                      className="w-full bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] text-black py-3.5 rounded-xl font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.3)] flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <MessageSquare size={16} /> Kirim Kode OTP WhatsApp
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink mx-3 text-white/35 text-[10px] uppercase font-bold">Atau</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <button 
                      onClick={handleGoogleLogin} 
                      className="w-full bg-white/5 hover:bg-white/10 py-3 rounded-xl font-black uppercase text-[11px] tracking-wider text-white border border-white/15 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                      Lanjutkan dengan Google
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-white/65 leading-relaxed">
                      Kode verifikasi OTP telah dikirim ke WhatsApp Anda. Masukkan 4 digit kode di bawah:
                    </p>
                    <input 
                      type="text"
                      maxLength={4}
                      placeholder="• • • •" 
                      value={inputOtp} 
                      onChange={(e) => setInputOtp(e.target.value)} 
                      className="w-full bg-white/5 border border-[#00E5FF]/50 py-3.5 rounded-xl text-xl font-black tracking-[0.55em] outline-none text-center text-[#00E5FF]" 
                    />
                    <button
                      onClick={handleVerifyOtp}
                      className="w-full bg-emerald-400 hover:bg-emerald-300 text-black py-3.5 rounded-xl font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(52,211,153,0.4)] active:scale-[0.98]"
                    >
                      Verifikasi OTP & Selesai
                    </button>
                  </>
                )}

                <button
                  onClick={() => { setShowAuthModal(false); setIsOtpStep(false); }}
                  className="w-full text-center text-xs text-white/45 hover:text-white underline font-semibold pt-1"
                >
                  Kembali
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ADMIN */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[600] p-6">
          <GlassCard className="w-full max-w-sm border border-[#00E5FF]/40 p-6 sm:p-7 space-y-4 text-center rounded-3xl">
            <div className="w-12 h-12 bg-[#00E5FF]/15 border border-[#00E5FF]/30 rounded-2xl flex items-center justify-center mx-auto text-[#00E5FF]">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-base font-black italic uppercase text-[#00E5FF]">Otentikasi Administrator</h3>
              <p className="text-xs text-white/50 mt-1">Masuk ke panel kontrol transaksi Flynnnstore</p>
            </div>
            <div className="space-y-3 text-left">
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 block mb-1">Username Admin</label>
                <input type="text" placeholder="Username..." value={adminUsernameInput} onChange={(e) => setAdminUsernameInput(e.target.value)} className="w-full bg-white/5 border border-white/15 focus:border-[#00E5FF] px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none text-white" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 block mb-1">Password Secret</label>
                <input type="password" placeholder="••••••••" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className="w-full bg-white/5 border border-white/15 focus:border-[#00E5FF] px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none text-white" />
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button onClick={handleAdminAuthSubmit} className="flex-1 bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] text-black py-3 rounded-xl font-black text-xs uppercase shadow-[0_0_20px_rgba(0,229,255,0.35)]">Verifikasi Admin</button>
              <button onClick={() => setShowAdminLoginModal(false)} className="px-4 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-xl font-bold border border-white/10">Batal</button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      {screen !== 'SPLASH' && (
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-32 md:pb-16">
          {/* DASHBOARD / KATALOG */}
          {screen === 'DASHBOARD' && (
            <div className="space-y-8">
              {/* Top Grid: Hero Banner + Wallet Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Hero Banner */}
                <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-[#00E5FF]/30 shadow-[0_20px_60px_rgba(0,0,0,0.65)] bg-gradient-to-r from-[#1A0B3B] via-[#0B011E] to-[#1A0B3B] min-h-[240px] sm:min-h-[280px] flex items-center">
                  <div className="absolute inset-0 z-0 opacity-45">
                    <img
                      src={PROMO_BANNERS[currentBannerIndex].image}
                      alt={PROMO_BANNERS[currentBannerIndex].title}
                      className="w-full h-full object-cover filter brightness-75 scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#070114] via-[#070114]/85 to-transparent"></div>
                  </div>

                  <div className="relative z-10 w-full px-6 sm:px-10 py-8 flex flex-col justify-between space-y-3.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-max flex items-center gap-1.5">
                        <Sparkles size={12} /> {PROMO_BANNERS[currentBannerIndex].badge}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-md max-w-xl">
                      {PROMO_BANNERS[currentBannerIndex].title}
                    </h2>
                    
                    <p className="text-white/80 text-xs sm:text-sm font-medium max-w-lg leading-relaxed">
                      {PROMO_BANNERS[currentBannerIndex].subtitle}
                    </p>

                    <div className="pt-2">
                      <button
                        onClick={() => {
                          const target = flashSaleGames[0] || MOCK_GAMES[0];
                          if (target) {
                            setSelectedGame(target);
                            setScreen('GAME_DETAIL');
                          }
                        }}
                        className="bg-gradient-to-r from-[#FFCC00] to-[#FFB300] hover:brightness-110 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(255,204,0,0.4)] active:scale-95 transition-all"
                      >
                        {PROMO_BANNERS[currentBannerIndex].buttonText}
                      </button>
                    </div>
                  </div>

                  {/* Banner Dots */}
                  <div className="absolute bottom-4 right-5 z-20 flex gap-2">
                    {PROMO_BANNERS.map((_, idx) => (
                      <button 
                        key={`dot-${idx}`}
                        onClick={() => setCurrentBannerIndex(idx)}
                        aria-label={`Slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all ${currentBannerIndex === idx ? 'w-6 bg-[#00E5FF]' : 'w-2 bg-white/35 hover:bg-white/60'}`}
                      />
                    ))}
                  </div>

                  <button 
                    onClick={() => setCurrentBannerIndex((prev) => (prev === 0 ? PROMO_BANNERS.length - 1 : prev - 1))}
                    aria-label="Banner Sebelumnya"
                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/15 items-center justify-center text-white hover:border-[#00E5FF] transition-all z-20"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % PROMO_BANNERS.length)}
                    aria-label="Banner Berikutnya"
                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/15 items-center justify-center text-white hover:border-[#00E5FF] transition-all z-20"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* User & Saldo Galaksi Card */}
                <div className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-[#1B0C3E] via-[#100626] to-[#090218] border border-white/15 p-6 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center gap-4">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-14 h-14 rounded-2xl border-2 border-[#00E5FF] object-cover bg-white/5 shadow-[0_0_20px_rgba(0,229,255,0.25)]"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-sm sm:text-base uppercase italic tracking-tight truncate">{user.username}</h3>
                      <p className="text-[#00E5FF] text-[10px] font-black uppercase tracking-widest mt-0.5">
                        {user.status} • LV. {user.level}
                      </p>
                    </div>
                    {user.role === 'GUEST' && (
                      <button
                        onClick={() => setScreen('SPLASH')}
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 rounded-xl font-black uppercase tracking-wider transition-all"
                      >
                        Login
                      </button>
                    )}
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-white/45 text-[10px] font-black uppercase tracking-widest">Saldo Galaksi</p>
                      <p className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white mt-1">
                        {user.role === 'GUEST' ? 'Rp 0' : `Rp ${balance?.toLocaleString() ?? 0}`}
                      </p>
                      {user.role === 'GUEST' && (
                        <span className="text-[10px] text-amber-300/80 font-semibold">Mode Guest — Masuk untuk top-up saldo</span>
                      )}
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
                      className="bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] hover:brightness-110 text-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.35)] shrink-0 transition-all"
                    >
                      + Isi Saldo
                    </button>
                  </div>
                </div>
              </div>

              {/* Flash Sale Section */}
              {flashSaleGames.length > 0 && (
                <section className="space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <Flame className="animate-pulse" size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black uppercase italic tracking-wider text-white">Flash Sale Galaksi</h3>
                        <p className="text-[11px] text-white/45">Harga spesial untuk pilihan game populer</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/30 text-xs font-black text-rose-300">
                      <Timer size={14} /> Berakhir dalam 28d 23h
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {flashSaleGames.map(g => (
                      <div
                        key={`fs-${g.id}`}
                        onClick={() => { setSelectedGame(g); setScreen('GAME_DETAIL'); }}
                        className="rounded-2xl overflow-hidden relative group border border-white/10 hover:border-[#00E5FF]/60 bg-[#12072B] cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
                      >
                        <div className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-md">
                          -{g.discount}%
                        </div>
                        <img
                          src={g.image}
                          alt={g.name}
                          className="w-full h-36 sm:h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070114] via-[#070114]/30 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-xs font-black uppercase italic truncate text-white">{g.name}</p>
                          <p className="text-[#00E5FF] text-[10px] font-bold uppercase tracking-wider">{g.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.03] border border-white/10 p-4 rounded-2xl">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap border transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.35)]'
                          : 'bg-white/5 text-white/65 border-white/10 hover:text-white hover:border-white/25'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Cari nama game..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#00E5FF] pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none text-white placeholder:text-white/35"
                  />
                </div>
              </div>

              {/* All Games Grid */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-black uppercase italic tracking-wider">
                    Semua Game ({filteredGames.length})
                  </h3>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-[#00E5FF] hover:underline font-bold"
                    >
                      Reset Pencarian
                    </button>
                  )}
                </div>

                {filteredGames.length === 0 ? (
                  <div className="glass border border-white/10 rounded-3xl py-16 px-6 text-center space-y-2">
                    <p className="text-sm font-black uppercase text-white/60">Game tidak ditemukan</p>
                    <p className="text-xs text-white/40">Coba kata kunci lain atau pilih kategori &quot;Semua&quot;.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                    {filteredGames.map(g => (
                      <div
                        key={g.id}
                        onClick={() => { setSelectedGame(g); setScreen('GAME_DETAIL'); }}
                        className="rounded-2xl overflow-hidden h-44 sm:h-52 relative group border border-white/10 hover:border-[#00E5FF]/60 bg-[#12072B] cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-lg"
                      >
                        <img
                          src={g.image}
                          alt={g.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#070114] via-[#070114]/25 to-transparent"></div>
                        {g.discount > 0 && (
                          <span className="absolute top-2.5 right-2.5 bg-rose-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            -{g.discount}%
                          </span>
                        )}
                        <div className="absolute bottom-3 left-3 right-3">
                          <p className="text-xs sm:text-sm font-black uppercase italic truncate text-white">{g.name}</p>
                          <p className="text-[#00E5FF] text-[10px] font-bold uppercase tracking-wider">{g.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ISI SALDO GALAKSI */}
          {screen === 'TOPUP_BALANCE' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setScreen('DASHBOARD')} className="glass p-2.5 rounded-xl border border-white/15 hover:border-[#00E5FF]">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">Isi Saldo Galaksi</h2>
                  <p className="text-xs text-white/50">Saldo tersimpan di akun kamu untuk transaksi cepat</p>
                </div>
              </div>

              <GlassCard className="p-6 sm:p-8 border border-[#00E5FF]/30 rounded-3xl space-y-5">
                <div>
                  <label className="text-xs font-black uppercase text-white/60 block mb-2">Nominal Pengisian (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="Contoh: 50000" 
                    value={topupAmountInput} 
                    onChange={(e) => setTopupAmountInput(e.target.value)} 
                    className="w-full bg-white/5 border border-white/15 focus:border-[#00E5FF] p-3.5 rounded-2xl text-xl font-black outline-none text-[#00E5FF]" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {[20000, 50000, 100000, 200000, 500000, 1000000].map(amt => (
                    <button 
                      key={amt} 
                      onClick={() => setTopupAmountInput(amt.toString())} 
                      className="bg-white/5 hover:bg-[#00E5FF]/15 py-2.5 rounded-xl text-xs font-black text-white hover:text-[#00E5FF] border border-white/10 hover:border-[#00E5FF]/40 transition-all"
                    >
                      Rp {amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleProceedTopupPayment} 
                  className="w-full bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(0,229,255,0.35)] flex items-center justify-center gap-2"
                >
                  <PlusCircle size={17} /> Lanjut ke Pembayaran
                </button>
              </GlassCard>
            </div>
          )}

          {/* DETAIL GAME */}
          {screen === 'GAME_DETAIL' && selectedGame && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setScreen('DASHBOARD')} className="glass p-2.5 rounded-xl border border-white/15 hover:border-[#00E5FF]">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <span className="text-[#00E5FF] text-[10px] font-black uppercase tracking-widest">{selectedGame.category}</span>
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">{selectedGame.name}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Game Poster & Info */}
                <div className="lg:col-span-4 space-y-4">
                  <GlassCard className="p-4 border border-white/10 rounded-3xl space-y-4">
                    <img
                      src={selectedGame.image}
                      alt={selectedGame.name}
                      className="w-full h-56 sm:h-64 rounded-2xl object-cover border border-white/10"
                    />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-base uppercase italic">{selectedGame.name}</h3>
                        {selectedGame.discount > 0 && (
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            HEMAT {selectedGame.discount}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">
                        Pengiriman otomatis terhubung sistem setelah pembayaran terverifikasi. Pastikan User ID dan Zone ID sesuai.
                      </p>
                    </div>
                  </GlassCard>
                </div>

                {/* Right Column: Steps 1 -> 2 -> 3 */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Step 1: User ID & Nickname */}
                  <GlassCard className="p-5 sm:p-6 border border-white/10 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#00E5FF] text-black font-black text-xs flex items-center justify-center">1</span>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">Masukkan Data Akun & Cek Nickname</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        placeholder="USER ID GAME"
                        value={userIdGame}
                        onChange={(e) => setUserIdGame(e.target.value)}
                        className="sm:col-span-2 bg-white/5 border border-white/15 focus:border-[#00E5FF] px-4 py-3 rounded-xl text-white font-black text-xs outline-none uppercase placeholder:text-white/30"
                      />
                      <input
                        placeholder="ZONE ID (OPSIONAL)"
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                        className="bg-white/5 border border-white/15 focus:border-[#00E5FF] px-4 py-3 rounded-xl text-white font-black text-xs outline-none uppercase placeholder:text-white/30"
                      />
                    </div>

                    <button
                      onClick={handleVerifyId}
                      className="w-full sm:w-auto bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 text-[#00E5FF] px-5 py-2.5 rounded-xl font-black text-xs uppercase border border-[#00E5FF]/40 transition-all"
                    >
                      {isVerifying ? 'Memeriksa ID...' : 'Cek Nickname ID Game'}
                    </button>

                    {verifiedNickname && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        <span className="text-xs font-black text-emerald-300 uppercase">Nickname Valid: {verifiedNickname}</span>
                      </div>
                    )}
                  </GlassCard>

                  {/* Step 2: Nominals */}
                  <GlassCard className="p-5 sm:p-6 border border-white/10 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[#00E5FF] text-black font-black text-xs flex items-center justify-center">2</span>
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">Pilih Nominal Top Up</h3>
                      </div>
                      {discountAmount > 0 && (
                        <span className="text-xs font-bold text-emerald-400">- Rp {discountAmount.toLocaleString()} promo aktif</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedGame.nominals.map(n => {
                        const isDisc = selectedGame.discount > 0;
                        const basePrice = isDisc ? Math.round(n.price * (1 - selectedGame.discount / 100)) : n.price;
                        const finalPrice = Math.max(0, basePrice - discountAmount);

                        return (
                          <button
                            key={n.id}
                            onClick={() => { setPending({ type: 'GAME', gameName: selectedGame.name, gameIcon: selectedGame.image, nominal: n.amount, price: basePrice, finalPrice: finalPrice }); setScreen('PAYMENT'); }}
                            className="flex flex-col items-start justify-between p-4 rounded-2xl bg-white/[0.04] hover:bg-[#00E5FF]/10 border border-white/10 hover:border-[#00E5FF] text-left transition-all group"
                          >
                            <span className="font-black text-xs sm:text-sm uppercase text-white group-hover:text-[#00E5FF] transition-colors">{n.amount}</span>
                            <div className="mt-2">
                              {isDisc && (
                                <span className="block text-[10px] text-white/35 line-through font-bold">
                                  Rp {n.price.toLocaleString()}
                                </span>
                              )}
                              <span className="text-[#00E5FF] text-xs font-black">Rp {finalPrice.toLocaleString()}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </GlassCard>

                  {/* Step 3: WhatsApp & Promo */}
                  <GlassCard className="p-5 sm:p-6 border border-white/10 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#00E5FF] text-black font-black text-xs flex items-center justify-center">3</span>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">Nomor WhatsApp & Kode Promo</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-white/50 block mb-1.5">Nomor WhatsApp Bukti Resi</label>
                        <input
                          placeholder="Contoh: 081234567890"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          className="w-full bg-white/5 border border-white/15 focus:border-[#00E5FF] px-4 py-3 rounded-xl text-white font-bold text-xs outline-none placeholder:text-white/30"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-white/50 block mb-1.5">Kode Promo (Gunakan: ANGGATAMPAN)</label>
                        <div className="flex gap-2">
                          <input
                            placeholder="Kode promo..."
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/15 focus:border-[#00E5FF] px-4 py-3 rounded-xl text-xs font-black uppercase outline-none text-[#00E5FF] placeholder:text-white/30"
                          />
                          <button
                            onClick={handleApplyPromo}
                            className="bg-indigo-600 hover:bg-indigo-500 px-4 rounded-xl text-xs font-black uppercase transition-all"
                          >
                            Pakai
                          </button>
                        </div>
                        {promoSuccess && (
                          <p className="text-[11px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                            <Check size={13} /> Promo Diskon Rp 10.000 Berhasil Dipasang!
                          </p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          )}

          {/* METODE PEMBAYARAN */}
          {screen === 'PAYMENT' && pending && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setScreen(pending.type === 'BALANCE' ? 'TOPUP_BALANCE' : 'GAME_DETAIL')} className="glass p-2.5 rounded-xl border border-white/15 hover:border-[#00E5FF]">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">Pilih Metode Pembayaran</h2>
                  <p className="text-xs text-white/50">Selesaikan pembayaran melalui Saldo Galaksi atau Midtrans Snap</p>
                </div>
              </div>
              
              <GlassCard className="p-5 sm:p-6 bg-gradient-to-r from-[#00E5FF]/10 via-[#150830] to-[#D500F9]/10 border border-[#00E5FF]/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#00E5FF] tracking-widest">Ringkasan Pesanan</span>
                  <h3 className="text-base sm:text-lg font-black uppercase text-white mt-0.5">{pending.gameName}</h3>
                  <p className="text-xs font-bold text-white/70">{pending.nominal}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-black uppercase text-white/50">Total Pembayaran</p>
                  <p className="text-2xl sm:text-3xl font-black italic text-[#00E5FF]">
                    Rp {pending.finalPrice?.toLocaleString() ?? pending.price?.toLocaleString() ?? 0}
                  </p>
                </div>
              </GlassCard>

              {isProcessingPayment && (
                <div className="p-4 glass border border-[#00E5FF]/50 rounded-2xl text-center text-xs font-black uppercase text-[#00E5FF] animate-pulse">
                  Menghubungkan ke Payment Gateway Midtrans...
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PAYMENT_METHODS.filter(m => !(pending.type === 'BALANCE' && m.id === 'WALLET')).map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleInitiatePayment(m.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] hover:bg-[#00E5FF]/10 border border-white/10 hover:border-[#00E5FF] transition-all text-left group"
                  >
                    <div className="text-[#00E5FF] p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-[#00E5FF]/40">
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-white truncate">{m.name}</p>
                      <p className="text-[10px] text-white/45 font-bold uppercase mt-0.5">{m.category}</p>
                    </div>
                    <ChevronRight size={18} className="text-white/30 group-hover:text-[#00E5FF] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DASHBOARD ADMIN */}
          {screen === 'ADMIN' && (
            user?.role === 'ADMIN' ? (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setScreen('DASHBOARD')} className="glass p-2.5 rounded-xl border border-white/15 hover:border-[#00E5FF]">
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black italic uppercase text-[#00E5FF]">Admin Control Panel</h2>
                      <p className="text-xs text-white/50">Kelola seluruh transaksi klien di MongoDB Atlas</p>
                    </div>
                  </div>
                  <button onClick={() => fetchDatabaseTransactions(user.username, user.role)} className="glass px-3.5 py-2 rounded-xl border border-white/15 text-white/75 hover:text-[#00E5FF] text-xs font-bold flex items-center gap-1.5">
                    <RefreshCw size={15} /> Refresh Data
                  </button>
                </div>

                <div className="space-y-3">
                  {allDbTransactions.length === 0 ? (
                    <div className="glass border border-white/10 rounded-3xl py-16 text-center text-xs text-white/40 font-bold uppercase tracking-widest">
                      Belum ada data transaksi tersimpan.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allDbTransactions.map((tx: any) => (
                        <GlassCard key={tx._id} className="p-5 space-y-3 border border-white/10 rounded-2xl text-left">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h4 className="font-black text-sm uppercase text-[#00E5FF] truncate">{tx.game}</h4>
                              <p className="text-[11px] text-white/65 font-mono truncate">User: {tx.userId || 'Guest'} • {tx.orderId}</p>
                              <p className="text-xs text-white/80 font-bold mt-0.5">ID: {tx.userIdGame} (Server: {tx.zoneId})</p>
                              <p className="text-[10px] text-white/40 mt-0.5">{new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shrink-0 ${tx.status === 'Success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                              {tx.status}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-white/10">
                            <div>
                              <p className="text-xs font-bold text-white/75">{tx.nominal}</p>
                              <p className="text-sm font-black text-[#00E5FF]">Rp {tx.harga?.toLocaleString()}</p>
                            </div>

                            <div className="flex gap-2">
                              <button onClick={() => handleUpdateStatusAdmin(tx._id, tx.status)} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all">
                                Ubah Status
                              </button>
                              <button onClick={() => handleDeleteAdminTx(tx._id)} className="bg-rose-600 hover:bg-rose-500 px-2.5 py-1.5 rounded-xl text-white transition-all" aria-label="Hapus Transaksi">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center space-y-4 max-w-md mx-auto">
                <ShieldAlert size={48} className="text-rose-500 mx-auto" />
                <h3 className="text-lg font-black uppercase text-rose-400">Akses Ditolak!</h3>
                <p className="text-xs text-white/55">Anda tidak memiliki otoritas Administrator untuk melihat halaman ini.</p>
                <button onClick={() => setScreen('DASHBOARD')} className="bg-[#00E5FF] text-black px-6 py-3 rounded-xl text-xs font-black uppercase">
                  Kembali ke Dashboard
                </button>
              </div>
            )
          )}

          {/* RIWAYAT TRANSAKSI KLIEN */}
          {screen === 'HISTORY' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">Riwayat Transaksi Saya</h2>
                  <p className="text-xs text-white/50">Pantau status pembayaran dan pengiriman pesanan kamu</p>
                </div>
                <button onClick={() => fetchDatabaseTransactions(user.username, user.role)} className="glass p-2.5 rounded-xl border border-white/15 text-white/70 hover:text-[#00E5FF]">
                  <RefreshCw size={17} />
                </button>
              </div>

              {allDbTransactions.length === 0 ? (
                <div className="glass border border-white/10 rounded-3xl py-20 px-6 text-center text-white/35 uppercase font-black tracking-widest text-xs">
                  BELUM ADA RIWAYAT TRANSAKSI
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allDbTransactions.map((tx: any) => (
                    <GlassCard key={tx._id} className="p-4 sm:p-5 flex items-center gap-4 border border-white/10 rounded-2xl">
                      <div className="w-12 h-12 rounded-2xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF] font-black text-xs uppercase shrink-0">
                        {tx.game ? tx.game.slice(0, 3) : 'TOP'}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-xs sm:text-sm font-black italic uppercase truncate">{tx.game}</h4>
                        <p className="text-[10px] text-white/45 font-bold truncate mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString()} • {tx.userIdGame}
                        </p>
                        <p className="text-[10px] text-[#00E5FF] font-bold uppercase mt-0.5">{tx.metodePembayaran}</p>
                      </div>
                      <div className="text-right space-y-1.5 shrink-0">
                        <p className="text-[#00E5FF] font-black text-xs sm:text-sm">Rp {tx.harga?.toLocaleString()}</p>
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${tx.status === 'Success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          {tx.status}
                        </span>
                        {tx.status === 'Pending' && tx.orderId && (
                          <div className="flex gap-1.5 pt-1 justify-end">
                            {tx.snapToken && (
                              <button
                                onClick={() => openMidtransSnap(tx.snapToken, tx.orderId, tx.game === 'Isi Saldo Galaksi', tx.harga)}
                                className="bg-[#00E5FF] text-black px-2.5 py-1 rounded-lg text-[10px] font-black uppercase"
                              >
                                Bayar
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`${API_BASE}/api/transactions/verify/${tx.orderId}`, {
                                    method: 'POST',
                                    headers: getAuthHeaders()
                                  });
                                  const data = await res.json();
                                  if (data.success && data.data.status === 'Success') {
                                    if (tx.game === 'Isi Saldo Galaksi') {
                                      await creditBalanceSafely(tx.orderId, tx.harga);
                                    }
                                    alert('Status berhasil diverifikasi menjadi Success!');
                                    await fetchDatabaseTransactions(user.username, user.role);
                                  } else {
                                    alert(`Status di Midtrans saat ini: ${data.midtransStatus || 'Belum Lunas'}`);
                                  }
                                } catch (e) {
                                  alert('Gagal mengecek status.');
                                }
                              }}
                              className="bg-white/5 hover:bg-white/10 border border-[#00E5FF]/40 text-[#00E5FF] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase"
                            >
                              Cek Status
                            </button>
                          </div>
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
            <div className="max-w-lg mx-auto py-8">
              <GlassCard className="p-8 border border-white/10 rounded-3xl flex flex-col items-center text-center">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#00E5FF] p-1 shadow-[0_0_30px_rgba(0,229,255,0.35)] object-cover bg-white/5 mb-4"
                />
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter">{user.username}</h2>
                <span className="text-[#00E5FF] text-xs font-black uppercase tracking-widest mt-1 mb-6 block">
                  {user.status} • LV. {user.level}
                </span>

                <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between">
                  <span className="text-xs font-bold text-white/60 uppercase">Saldo Galaksi</span>
                  <span className="text-lg font-black text-[#00E5FF]">
                    {user.role === 'GUEST' ? 'Rp 0' : `Rp ${balance?.toLocaleString() ?? 0}`}
                  </span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 py-3.5 rounded-2xl text-rose-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 border border-rose-500/30 transition-all"
                >
                  <LogOut size={17} /> Keluar / Ganti Akun
                </button>
              </GlassCard>
            </div>
          )}
        </main>
      )}

      {/* MOBILE BOTTOM NAV BAR */}
      {!['SPLASH', 'GAME_DETAIL', 'PAYMENT', 'ADMIN'].includes(screen) && (
        <div className="md:hidden fixed bottom-5 left-5 right-5 h-16 glass rounded-2xl flex items-center justify-around z-[150] shadow-[0_10px_40px_rgba(0,0,0,0.85)] border border-white/15">
          {[
            { id: 'DASHBOARD', icon: <LayoutDashboard size={20} />, label: 'Katalog' },
            { id: 'HISTORY', icon: <History size={20} />, label: 'Riwayat' },
            { id: 'PROFILE', icon: <User size={20} />, label: 'Akun' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id as Screen)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
                screen === item.id ? 'text-[#00E5FF]' : 'text-white/40 hover:text-white/75'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;