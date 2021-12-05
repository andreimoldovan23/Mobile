import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Plugins } from '@capacitor/core';
import { getLogger } from '../core';
import { login as loginApi } from './authApi';

const { Storage } = Plugins;

const log = getLogger('AuthProvider');

type LoginFn = (username?: string, password?: string) => void;
type LogoutFn = () => void;

export interface AuthState {
  authenticationError: any;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login?: LoginFn;
  logout?: LogoutFn;
  pendingAuthentication?: boolean;
  username?: string;
  password?: string;
  token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isAuthenticating: false,
  authenticationError: null,
  pendingAuthentication: false,
  token: '',
};

export const AuthContext = React.createContext<AuthState>(initialState);

interface AuthProviderProps {
  children: PropTypes.ReactNodeLike,
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);
  const { isAuthenticated, isAuthenticating, authenticationError, pendingAuthentication, token } = state;

  const login = useCallback<LoginFn>(loginCallback, []);
  const logout = useCallback<LogoutFn>(logoutCallback, []);

  useEffect(isLoggedInEffect, []);
  useEffect(authenticationEffect, [pendingAuthentication]);
  useEffect(saveTokenEffect, [token]);
  
  const value = { isAuthenticated, login, logout, isAuthenticating, authenticationError, token };
  
  log('render');
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );

  function logoutCallback() : void {
    log('log out');
    setState({ ...state, isAuthenticated: false, token: null });
  }

  function loginCallback(username?: string, password?: string): void {
    log('login');
    setState({ ...state, pendingAuthentication: true, username, password });
  }

  function authenticationEffect() {
    let canceled = false;
    authenticate();
    return () => { canceled = true; }

    async function authenticate() {
      if (!pendingAuthentication) {
        log('authenticate, !pendingAuthentication, return');
        return;
      }

      try {
        setState({ ...state, isAuthenticating: true, });
        const { username, password } = state;
        const { token } = await loginApi(username, password);
        
        if (canceled) { return; }
        setState({ ...state, token, pendingAuthentication: false, isAuthenticated: true, isAuthenticating: false, });
      } catch (error) {
        if (canceled) { return; }
        setState({ ...state, authenticationError: error, pendingAuthentication: false, isAuthenticating: false, });
      }
    }
  }

  function saveTokenEffect() {
    (async () => {
      if (token && token !== '') {
        log("Saving token to local storage: ", token);
        await Storage.set({
          key: 'token',
          value: token,
        });
      } else if (token == null) {
        log("Removing token from local storage")
        await Storage.remove({ key: 'token' });
      }
    })();
  }

  function isLoggedInEffect() {
    let canceled = false;

    (async () => {
      const storedToken = await Storage.get({ key: 'token' });
      log("Stored token is: ", storedToken.value);
      if (storedToken.value && storedToken.value !== '') {
        if (canceled) { return; }
        setState({...state, token: storedToken.value, isAuthenticated: true });
      }
    })();

    return () => { canceled = true; };
  }
};
