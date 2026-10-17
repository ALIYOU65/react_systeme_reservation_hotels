import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null); // Ajout du token

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setToken(storedToken); // Stocke le token dans l’état
        // Décode le rôle depuis le user ou le JWT
        setUserRole(
          parsedUser.role ||
            (() => {
              try {
                const payload = JSON.parse(atob(storedToken.split('.')[1]));
                return payload.role || null;
              } catch {
                return null;
              }
            })()
        );
      } catch {
        // Si erreur de parsing → nettoyage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setToken(null);
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
      setToken(null);
    }
  }, []);

  // Connexion 
  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    
    const role = userData.role ? userData.role.toUpperCase() : null;
    setUserRole(role);
    setToken(token);
  
    console.log('Login - User set:', userData);
    console.log('Login - Role set:', role);
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
    setToken(null);
  };

  //  Fournit le token à tout le frontend
  const value = { user, isAuthenticated, userRole, token, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

























