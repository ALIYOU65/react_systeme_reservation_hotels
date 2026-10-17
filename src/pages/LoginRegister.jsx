import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';                // Contexte global d'authentification
import { jwtDecode } from 'jwt-decode';                 // Pour décoder le token JWT côté client
import './LoginRegister.css';

const API_BASE_URL = 'http://localhost:3000/api/users';   // URL de base des routes auth (backend)

const LoginRegister = () => {
  const navigate = useNavigate();                         // Permet la redirection programmatique
  const { login } = useAuth();                             // Fonction du contexte qui met à jour l'état global connecté

  const [isLoginMode, setIsLoginMode] = useState(true);    // true = mode Connexion, false = mode Inscription
  const [formData, setFormData] = useState({               // État du formulaire
    email: '',
    password: '',
    prenom: '',
    nom: '',
    role: 'CLIENT',                                        
  });

  const [error, setError] = useState('');                  // Message d'erreur à afficher
  const [successMessage, setSuccessMessage] = useState(''); // Message de succès après opération
  const [isLoading, setIsLoading] = useState(false);       // Indicateur de chargement (UX + empêche double clic)

 
  console.log('État formData actuel :', formData);

  // Gestion des changements dans les inputs → mise à jour de formData + efface messages
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error || successMessage) {
      setError('');
      setSuccessMessage('');
    }
    console.log('formData après changement :', formData);
  };

  // Soumission du formulaire (connexion OU inscription)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Choix de l'URL selon le mode
    const url = isLoginMode ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;

    // Données minimales communes
    let dataToSend = {
      email: formData.email,
      password: formData.password,
    };

    // Si mode inscription → on ajoute prénom, nom et rôle
    if (!isLoginMode) {
      dataToSend = {
        ...dataToSend,
        prenom: formData.prenom,
        nom: formData.nom,
        role: formData.role,
      };
    }

    try {
      // Appel API (login ou register)
      const response = await axios.post(url, dataToSend, {
        headers: { 'Content-Type': 'application/json' }
      });

      const { user, token } = response.data;

      // Décodage sécurisé du token pour extraire le rôle (gestion robuste des cas)
      let userRole = null;
      try {
        const decoded = jwtDecode(token);
        const roleFromToken = Array.isArray(decoded.role) ? decoded.role : [decoded.role || ''];
        userRole = roleFromToken.find(r =>
          r?.toLowerCase().includes('client') ||
          r?.toLowerCase().includes('moderateur') ||
          r?.toLowerCase().includes('personnel')
        );
        userRole = userRole ? userRole.toLowerCase() : null;
      } catch (decodeErr) {
        console.error('Erreur décodage JWT:', decodeErr);
        userRole = user.role ? user.role.toLowerCase() : null;   // Fallback sur le rôle renvoyé par le backend
      }

      // Stockage du token dans localStorage (persistance entre rafraîchissements)
      localStorage.setItem('token', token);
      console.log('Token stocké localStorage:', localStorage.getItem('token').substring(0, 20) + '...');

      // Mise à jour du contexte global d'authentification (état connecté + rôle)
      login(token, user, userRole);

      // Message de succès personnalisé
      setSuccessMessage(
        isLoginMode
          ? `Connexion réussie ! Bienvenue ${user.prenom}.`
          : `Inscription réussie ! Bienvenue ${user.prenom}. Vous êtes maintenant connecté.`
      );

      // Redirection intelligente selon le rôle
      let targetRoute = '/';
      if (userRole === 'client') {
        targetRoute = '/dashboard/client';
      } else if (userRole === 'moderateur') {
        targetRoute = '/dashboard/admin';
      } else if (userRole === 'personnel') {
        targetRoute = '/dashboard/personnel';
      }

      // Délai pour laisser le temps de lire le message de succès avant redirection
      setTimeout(() => {
        navigate(targetRoute);
      }, 1500);

    } catch (err) {
      console.error('Erreur login/register:', err.response || err);

      // Gestion fine des erreurs selon leur origine
      if (err.response) {
        const message = err.response.data.message || "Une erreur est survenue lors de l'opération.";
        setError(message);
      } else if (err.request) {
        setError("Impossible de contacter le serveur. Veuillez vérifier votre connexion.");
      } else {
        setError("Une erreur inattendue est survenue.");
      }
      setSuccessMessage('');
    } finally {
      setIsLoading(false);         // Fin du chargement, quel que soit le résultat
    }
  };

  // Bascule entre mode Connexion et Inscription
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setSuccessMessage('');
    setFormData({ email: '', password: '', prenom: '', nom: '', role: 'CLIENT' }); // Reset formulaire
  };

  return (
    <div className="login-register-container">
      <h2>{isLoginMode ? 'Connexion' : 'Inscription'}</h2>

      {/* Affichage des messages d'erreur */}
      {error && (
        <div className="alert alert-error">
          Erreur : {error}
        </div>
      )}

      {/* Affichage des messages de succès */}
      {successMessage && (
        <div className="alert alert-success">
          Succès : {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Champs visibles uniquement en mode Inscription */}
        {!isLoginMode && (
          <>
            <input
              type="text"
              name="prenom"
              placeholder="Prénom"
              value={formData.prenom}
              onChange={handleChange}
              required
              className="form-input"
              disabled={isLoading}
            />
            <input
              type="text"
              name="nom"
              placeholder="Nom"
              value={formData.nom}
              onChange={handleChange}
              required
              className="form-input"
              disabled={isLoading}
            />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="form-input"
              disabled={isLoading}
            >
              <option value="CLIENT">Client</option>
              <option value="MODERATEUR">Modérateur</option>
              <option value="PERSONNEL">Personnel</option>
            </select>
          </>
        )}

        {/* Champs communs */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="form-input"
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={handleChange}
          required
          className="form-input"
          disabled={isLoading}
        />

        <button type="submit" className="btn-submit" disabled={isLoading}>
          {isLoading ? 'Chargement...' : isLoginMode ? 'Se connecter' : "S'inscrire"}
        </button>
      </form>

      {/* Lien pour basculer entre les deux modes */}
      <p className="toggle-text">
        {isLoginMode ? "Pas encore de compte ?" : "Déjà un compte ?"}
        <span className="toggle-link" onClick={toggleMode}>
          {isLoginMode ? "S'inscrire" : "Se connecter"}
        </span>
      </p>
    </div>
  );
};

export default LoginRegister;






































