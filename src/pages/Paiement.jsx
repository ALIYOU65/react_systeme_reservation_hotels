import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Paiement = () => {
  // Récupère le paramètre de l'URL (prend reservationId ou id pour éviter tout problème de nommage)
  const params = useParams();
  const reservationId = params.reservationId || params.id;
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // VÉRIFICATION STRICTE : Si l'ID est absent ou vaut la chaîne "undefined"
    if (!reservationId || reservationId === 'undefined') {
      console.warn("ID de réservation non trouvé dans les paramètres d'URL");
      return;
    }

    const initPaiement = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const response = await axios.post(
          `http://localhost:3000/api/reservations/${reservationId}/payment`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const redirectUrl = response.data.checkoutUrl || response.data.url;

        if (redirectUrl) {
          // Redirection directe vers Stripe
          window.location.href = redirectUrl;
        } else {
          setError("L'URL de paiement reçue est invalide.");
          setLoading(false);
        }

      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Impossible de lancer le paiement');
        setLoading(false);
      }
    };

    initPaiement();
  }, [reservationId]);

  // AFFICHAGE
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', fontSize: '1.2rem' }}>
        <p>Redirection vers le paiement sécurisé Stripe...</p>
        <div style={{
          margin: '2rem auto',
          width: '50px',
          height: '50px',
          border: '6px solid #f0f0f0',
          borderTop: '6px solid #1e3a8a',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', color: 'red' }}>
        <h3>Erreur paiement</h3>
        <p>{error}</p>
        <button
          onClick={() => navigate('/mes-reservations')}
          style={{ marginTop: '1rem', padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}
        >
          Retour aux réservations
        </button>
      </div>
    );
  }

  return null;
};

export default Paiement;


















