import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { FinancialAccount, Transaction, UserProfile } from '../types';

export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId || undefined,
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with specific databaseId
export const db = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Helper to convert Firebase User to UserProfile
export const mapFirebaseUserToProfile = async (
  fbUser: FirebaseUser,
  customPin: string = '123456'
): Promise<UserProfile> => {
  const userDocRef = doc(db, 'users', fbUser.uid);
  try {
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        id: fbUser.uid,
        username: data.username || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email || undefined,
        displayName: data.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || '记账用户',
        avatar: data.avatar || fbUser.photoURL || undefined,
        passwordHash: '',
        pinCode: data.pinCode || customPin,
        autoLockMinutes: data.autoLockMinutes ?? 15,
        privacyMode: data.privacyMode ?? false,
        lastLoginTime: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Could not fetch user profile document from Firestore, using auth fallback', err);
  }

  const newProfile: UserProfile = {
    id: fbUser.uid,
    username: fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email || undefined,
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || '记账用户',
    avatar: fbUser.photoURL || undefined,
    passwordHash: '',
    pinCode: customPin,
    autoLockMinutes: 15,
    privacyMode: false,
    lastLoginTime: new Date().toISOString(),
  };

  // Persist user record
  try {
    await setDoc(userDocRef, {
      ...newProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('Failed to initialize user document in Firestore', e);
  }

  return newProfile;
};

// =================== FIRESTORE CLOUD OPERATIONS ===================

/**
 * Real-time synchronization listener for Accounts and Transactions
 */
export const subscribeToCloudData = (
  userId: string,
  onData: (accounts: FinancialAccount[], transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  let localAccounts: FinancialAccount[] = [];
  let localTransactions: Transaction[] = [];
  let accountsReady = false;
  let txReady = false;

  const emit = () => {
    if (accountsReady && txReady) {
      onData([...localAccounts], [...localTransactions]);
    }
  };

  const accountsColl = collection(db, 'users', userId, 'accounts');
  const txColl = collection(db, 'users', userId, 'transactions');

  const unsubAccounts: Unsubscribe = onSnapshot(
    accountsColl,
    (snapshot) => {
      localAccounts = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as FinancialAccount;
        return { ...data, id: docSnap.id };
      });
      accountsReady = true;
      emit();
    },
    (err) => {
      console.error('Firestore accounts subscription error:', err);
      if (onError) onError(err);
    }
  );

  const unsubTx: Unsubscribe = onSnapshot(
    txColl,
    (snapshot) => {
      localTransactions = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Transaction;
        return { ...data, id: docSnap.id };
      });
      // Sort transactions descending by date & createdAt
      localTransactions.sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
      txReady = true;
      emit();
    },
    (err) => {
      console.error('Firestore transactions subscription error:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubAccounts();
    unsubTx();
  };
};

/**
 * Save single account to Cloud Firestore
 */
export const saveAccountCloud = async (userId: string, account: FinancialAccount): Promise<void> => {
  if (!userId) return;
  const accountRef = doc(db, 'users', userId, 'accounts', account.id);
  await setDoc(accountRef, {
    ...account,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

/**
 * Delete single account from Cloud Firestore
 */
export const deleteAccountCloud = async (userId: string, accountId: string): Promise<void> => {
  if (!userId) return;
  const accountRef = doc(db, 'users', userId, 'accounts', accountId);
  await deleteDoc(accountRef);
};

/**
 * Save single transaction to Cloud Firestore
 */
export const saveTransactionCloud = async (userId: string, transaction: Transaction): Promise<void> => {
  if (!userId) return;
  const txRef = doc(db, 'users', userId, 'transactions', transaction.id);
  await setDoc(txRef, {
    ...transaction,
    createdAt: transaction.createdAt || new Date().toISOString(),
  }, { merge: true });
};

/**
 * Delete single transaction from Cloud Firestore
 */
export const deleteTransactionCloud = async (userId: string, transactionId: string): Promise<void> => {
  if (!userId) return;
  const txRef = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(txRef);
};

/**
 * Batch upload / initialize accounts to Cloud
 */
export const uploadInitialAccountsCloud = async (userId: string, accounts: FinancialAccount[]): Promise<void> => {
  if (!userId || accounts.length === 0) return;
  const batch = writeBatch(db);
  accounts.forEach((acc) => {
    const ref = doc(db, 'users', userId, 'accounts', acc.id);
    batch.set(ref, { ...acc, updatedAt: new Date().toISOString() }, { merge: true });
  });
  await batch.commit();
};

/**
 * Batch upload / initialize transactions to Cloud
 */
export const uploadInitialTransactionsCloud = async (userId: string, transactions: Transaction[]): Promise<void> => {
  if (!userId || transactions.length === 0) return;
  const batch = writeBatch(db);
  transactions.forEach((tx) => {
    const ref = doc(db, 'users', userId, 'transactions', tx.id);
    batch.set(ref, { ...tx, createdAt: tx.createdAt || new Date().toISOString() }, { merge: true });
  });
  await batch.commit();
};

/**
 * Update user profile in Cloud Firestore
 */
export const updateUserProfileCloud = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

/**
 * Fetch all accounts once
 */
export const fetchCloudAccountsOnce = async (userId: string): Promise<FinancialAccount[]> => {
  if (!userId) return [];
  const coll = collection(db, 'users', userId, 'accounts');
  const snap = await getDocs(coll);
  return snap.docs.map((d) => ({ ...(d.data() as FinancialAccount), id: d.id }));
};

/**
 * Fetch all transactions once
 */
export const fetchCloudTransactionsOnce = async (userId: string): Promise<Transaction[]> => {
  if (!userId) return [];
  const coll = collection(db, 'users', userId, 'transactions');
  const snap = await getDocs(coll);
  const list = snap.docs.map((d) => ({ ...(d.data() as Transaction), id: d.id }));
  list.sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
  return list;
};
