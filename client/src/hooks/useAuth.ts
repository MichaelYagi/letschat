import { createContext, useContext } from 'react';

type AuthContextType = {
  user: any | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  return (
    context || { user: null, login: async () => {}, logout: async () => {} }
  );
};

export default AuthContext;
