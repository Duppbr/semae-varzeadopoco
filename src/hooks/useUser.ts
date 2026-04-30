// src/hooks/useUser.ts
import { useEffect, useState } from 'react';

interface User {
  isLoggedIn: boolean;
  identificador: string;
  nome: string;
  role: string;
  lojaId: number;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn) {
          setUser(data);
        } else {
          setUser(null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { user, loading };
}