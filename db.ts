
import { UserProfile, Transaction } from './types';

interface DBSchema {
  user: UserProfile & { balance: number };
  transactions: Transaction[];
  lastSync: number;
}

class GalaxyDatabase {
  private static instance: GalaxyDatabase;
  private key = 'flynnnstore_galaxy_db_v2';

  public static getInstance() {
    if (!GalaxyDatabase.instance) GalaxyDatabase.instance = new GalaxyDatabase();
    return GalaxyDatabase.instance;
  }

  private constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.key)) {
      const initial: DBSchema = {
        user: {
          username: 'GUEST COMMANDER',
          avatar: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
          status: 'Recruit',
          level: 1,
          exp: 0,
          maxExp: 100,
          balance: 0
        },
        transactions: [],
        lastSync: Date.now()
      };
      localStorage.setItem(this.key, JSON.stringify(initial));
    }
  }

  private get(): DBSchema {
    return JSON.parse(localStorage.getItem(this.key)!);
  }

  private set(data: DBSchema) {
    localStorage.setItem(this.key, JSON.stringify({ ...data, lastSync: Date.now() }));
  }

  public async getUserProfile() {
    return this.get().user;
  }

  public async updateUserProfile(update: Partial<UserProfile & { balance: number }>) {
    const data = this.get();
    data.user = { ...data.user, ...update };
    this.set(data);
  }

  public async getTransactions(): Promise<Transaction[]> {
    return this.get().transactions;
  }

  public async addTransaction(tx: Transaction) {
    const data = this.get();
    data.transactions.unshift(tx);
    this.set(data);
  }

  public async clearData() {
    localStorage.removeItem(this.key);
    window.location.reload();
  }
}

export const db = GalaxyDatabase.getInstance();
