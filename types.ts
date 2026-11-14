export type Screen = 'SPLASH' | 'DASHBOARD' | 'GAME_DETAIL' | 'PAYMENT' | 'HISTORY' | 'PROFILE' | 'TOPUP_BALANCE' | 'ADMIN';

export interface Nominal {
  id: string;
  amount: string;
  price: number;
}

export interface Game {
  id: string;
  name: string;
  category: string;
  image: string;
  isFlashSale: boolean;
  discount: number;
  nominals: Nominal[];
}

export interface UserProfile {
  username: string;
  avatar: string;
  status: string;
  level: number;
  balance: number;
  role?: string;
  password?: string;
}

export interface Transaction {
  _id?: string;
  game: string;
  userIdGame: string;
  zoneId?: string;
  nominal: string;
  harga: number;
  metodePembayaran: string;
  status: 'Pending' | 'Success' | 'Canceled';
  createdAt?: string;
}