import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { auth, db } from "../app/config/firebase";
import { DiaryEntry } from "../components/DiaryCard";

interface DiaryContextData {
  user: User | null;
  entries: DiaryEntry[];
  loadingAuth: boolean;
  loadingEntries: boolean;
}

const DiaryContext = createContext<DiaryContextData>({
  user: null,
  entries: [],
  loadingAuth: true,
  loadingEntries: false,
});

export const DiaryProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoadingEntries(false);
      return;
    }
    setLoadingEntries(true);
    const q = query(
      collection(db, "users", user.uid, "entries"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map(
          (doc) => ({ id: doc.id, ...(doc.data() as Omit<DiaryEntry, "id">) })
        )
      );
      setLoadingEntries(false);
    });
    return unsub;
  }, [user]);

  return (
    <DiaryContext.Provider
      value={{ user, entries, loadingAuth, loadingEntries }}
    >
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => useContext(DiaryContext);
