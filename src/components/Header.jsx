import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import './Header.css';

const Header = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        width: '100%',
        margin: 0,
        padding: 0,
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      <nav className="navbar">
        {/* Logo */}
        <Link to="/" className="navbar-brand">HOTELBOOKING</Link>
        
      {/* Liens du menu */}
   <ul className="nav-links">
  <li><Link className="nav-link" to="/">Accueil</Link></li>
  </ul>

   {/* Hôtels OU Dashboard Client + Mes Réservations */}
   <ul className="nav-links">
    <li>
      {isAuthenticated && user?.role === 'CLIENT' ? (
      <>
        <Link className="nav-link" to="/dashboard/client">Dashboard Client</Link>
      </>
       ) : (
      <Link className="nav-link" to="/hotels">Hôtels</Link>
      )}
     </li>

     {/* Lien « Mes Réservations » uniquement pour les clients connectés */}
     {isAuthenticated && user?.role === 'CLIENT' && (
    <li>
      <Link className="nav-link" to="/mes-reservations">Mes Réservations</Link>
    </li>
     )}
     </ul>

        {/* Liens conditionnels pour les rôles */}
        {user?.role === 'PERSONNEL' && (
          <Link className="nav-link" to="/dashboard/personnel">Dashboard Personnel</Link>
        )}
        {user?.role === 'MODERATEUR' && (
          <Link className="nav-link" to="/dashboard/admin">Dashboard Admin</Link>
        )}

        {/* Bouton Connexion / Déconnexion */}
        <div className="auth-section">
          {isAuthenticated ? (
            <>
              <span style={{ color: 'white', marginRight: '15px' }}>
                Bienvenue, <strong style={{ color: "#f59e0b" }}>{user?.prenom} {user?.nom}</strong>
              </span>
              <button
                className="btn-outline-light"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link className="btn-outline-light" to="/login">
              Connexion / Inscription
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;


















