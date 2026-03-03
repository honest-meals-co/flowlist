import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, db } from './firebase';

// ─── Auth ───
export async function signUp(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  return userCredential;
}

export async function signIn(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return await firebaseSignOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── Save & Load App State ───
// We store the entire app state as JSON under user_data/{userId}.
// Each user can only read/write their own path (enforced by Realtime DB rules).

export async function saveAppState(userId, state) {
  const userRef = ref(db, 'user_data/' + userId);
  await set(userRef, {
    hats: state.hats,
    archives: state.archives,
    day_state: state.dayState,
    day_start_time: state.dayStartTime,
    day_date: state.dayDate,
    updated_at: new Date().toISOString()
  });
}

export async function loadAppState(userId) {
  const userRef = ref(db, 'user_data/' + userId);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) return null;

  const data = snapshot.val();

  // Firebase quirk: it drops empty arrays (stores them as nothing) and
  // sometimes returns arrays as objects {0:{...}, 1:{...}} instead of [{...}].
  // toArr() converts both cases back to a proper JavaScript array.
  const toArr = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return Object.values(val);
  };

  return {
    ...data,
    hats: toArr(data.hats).map(hat => ({
      ...hat,
      todos: toArr(hat.todos).map(todo => ({
        ...todo,
        subTodos: toArr(todo.subTodos),
        dueDate: todo.dueDate ?? null,
        actualTime: todo.actualTime ?? null,
      }))
    })),
    archives: toArr(data.archives),
  };
}
