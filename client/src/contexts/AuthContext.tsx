import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '../types/auth';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: { user: User; token: string } }
  | { type: 'CLEAR_AUTH' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_AUTH':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('letschat_token');
      if (token) {
        try {
          // For mock token, try to get stored user data
          if (token === 'mock-jwt-token') {
            const storedUser = localStorage.getItem('letschat_user');
            if (storedUser) {
              const user = JSON.parse(storedUser);
              dispatch({
                type: 'SET_AUTH',
                payload: { user, token },
              });
            } else {
              dispatch({ type: 'CLEAR_AUTH' });
            }
            return;
          } else {
            // For real JWT tokens, decode and validate
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const userData = JSON.parse(atob(tokenParts[1]));
              if (userData.userId && userData.username) {
                dispatch({
                  type: 'SET_AUTH',
                  payload: {
                    user: {
                      id: userData.userId.toString(),
                      username: userData.username,
                      status: 'online',
                      lastSeen: new Date().toISOString(),
                    },
                    token,
                  },
                });
              } else {
                throw new Error('Invalid token format');
              }
            } else {
              throw new Error('Invalid token structure');
            }
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('letschat_token');
          localStorage.removeItem('letschat_user');
          dispatch({ type: 'CLEAR_AUTH' });
        }
      } else {
        dispatch({ type: 'CLEAR_AUTH' });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response: AuthResponse = await authApi.login(credentials);
      dispatch({
        type: 'SET_AUTH',
        payload: { user: response.user, token: response.token },
      });
      // Store user data for mock tokens
      localStorage.setItem('letschat_user', JSON.stringify(response.user));
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Login failed' });
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response: AuthResponse = await authApi.register(data);
      dispatch({
        type: 'SET_AUTH',
        payload: { user: response.user, token: response.token },
      });
      // Store user data for mock tokens
      localStorage.setItem('letschat_user', JSON.stringify(response.user));
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message || 'Registration failed',
      });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('letschat_token');
      localStorage.removeItem('letschat_user');
      dispatch({ type: 'CLEAR_AUTH' });
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authApi.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
