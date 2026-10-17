import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaiementSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const reservationId = searchParams.get('resa');

    if (!reservationId) {
      setMessage('Aucune réservation spécifiée.');
      setLoading(false);
      return;
    }

    const verifierPaiement = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `http://localhost:3000/api/reservations/${reservationId}/payment-status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const status = response.data.payment_status;

        if (status === 'paid' || status === 'succeeded' || status === 'Payée') {
          setMessage('Paiement réussi ! Votre réservation est confirmée.');
          setIsSuccess(true);
        } else if (status === 'pending') {
          setMessage('Paiement en attente. Vérifiez à nouveau dans quelques instants.');
          setIsSuccess(false);
        } else {
          setMessage('Le paiement a échoué ou a été annulé.');
          setIsSuccess(false);
        }
      } catch (err) {
        console.error('Erreur vérification paiement:', err);
        setMessage('Impossible de vérifier le paiement. Veuillez réessayer plus tard.');
        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifierPaiement();
  }, [searchParams]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '150px' }}>Vérification du paiement...</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '130px', padding: '0 1rem' }}>
      <h2>Résultat du paiement</h2>
      <p style={{ 
        color: isSuccess ? '#10B981' : 'inherit', 
        fontWeight: isSuccess ? 'bold' : 'normal',
        fontSize: isSuccess ? '1.1rem' : '1rem'
      }}>
        {message}
      </p>
      <button 
        onClick={() => navigate('/mes-reservations')} 
        style={{ 
          marginTop: '1rem', 
          padding: '0.6rem 1.2rem', 
          backgroundColor: '#1E3A8A', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Retour à mes réservations
      </button>
    </div>
  );
};

export default PaiementSuccess;


