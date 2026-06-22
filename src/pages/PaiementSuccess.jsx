import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaiementSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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

        // CORRECTION ICI → la clé est "payment_status", pas "status"
        const status = response.data.payment_status;

        if (status === 'paid' || status === 'succeeded' || status === 'Payée') {
          setMessage('Paiement réussi ! Votre réservation est confirmée.');
        } else if (status === 'pending') {
          setMessage('Paiement en attente. Vérifiez à nouveau dans quelques instants.');
        } else {
          setMessage('Le paiement a échoué ou a été annulé.');
        }
      } catch (err) {
        console.error('Erreur vérification paiement:', err);
        setMessage('Impossible de vérifier le paiement. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    verifierPaiement();
  }, [searchParams]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Vérification du paiement...</div>;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Résultat du paiement</h2>
      <p>{message}</p>
      <button onClick={() => navigate('/mes-reservations')} style={{ marginTop: '1rem' }}>
        Retour à mes réservations
      </button>
    </div>
  );
};

export default PaiementSuccess;

























// // src/pages/PaiementSuccess.jsx
// import React, { useEffect, useState } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './PaiementSuccess.css';   // ← même dossier que Paiement.css

// const PaiementSuccess = () => {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [message, setMessage] = useState('');
//   const [isSuccess, setIsSuccess] = useState(false);

//   useEffect(() => {
//     const reservationId = searchParams.get('resa');

//     if (!reservationId) {
//       setMessage('Aucune réservation spécifiée.');
//       setLoading(false);
//       return;
//     }

//     const verifierPaiement = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const response = await axios.get(
//           `http://localhost:300 Wheels/api/reservations/${reservationId}/payment-status`,
//           { headers: { Authorization: `Bearer ${token}` } }
//         );

//         const status = response.data.status;

//         if (status === 'succeeded' || status === 'Payée') {
//           setMessage('Paiement réussi ! Votre réservation est maintenant confirmée.');
//           setIsSuccess(true);
//         } else if (status === 'pending') {
//           setMessage('Paiement en cours de traitement… Veuillez vérifier dans quelques instants.');
//           setIsSuccess(false);
//         } else {
//           setMessage('Le paiement a échoué ou a été annulé.');
//           setIsSuccess(false);
//         }
//       } catch (err) {
//         console.error('Erreur vérification paiement:', err);
//         setMessage('Impossible de vérifier le paiement. Veuillez réessayer plus tard.');
//         setIsSuccess(false);
//       } finally {
//         setLoading(false);
//       }
//     };

//     verifierPaiement();
//   }, [searchParams]);

//   return (
//     <div className="paiement-container">
//       <div className="success-wrapper">
//         {loading ? (
//           <div className="loading-state">
//             <div className="spinner"></div>
//             <p>Vérification du paiement en cours...</p>
//           </div>
//         ) : (
//           <>
//             <div className={`success-icon ${isSuccess ? 'success' : 'error'}`}>
//               {isSuccess ? '✓' : '✕'}
//             </div>
//             <h2>Résultat du paiement</h2>
//             <p className="result-message">{message}</p>

//             <button
//               onClick={() => navigate('/mes-reservations')}
//               className="btn-retour"
//             >
//               Retour à mes réservations
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PaiementSuccess;







// /* PaiementSuccess.css – même style que Paiement.css */
// .paiement-container {
//   min-height: 100vh;
//   background-color: #D9D9D9;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 2rem 1rem;
// }

// .success-wrapper {
//   background: white;
//   border-radius: 16px;
//   padding: 3rem 2rem;
//   max-width: 500px;
//   width: 100%;
//   text-align: center;
//   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
// }

// .success-icon {
//   width: 90px;
//   height: 90px;
//   border-radius: 50%;
//   font-size: 42px;
//   line-height: 90px;
//   margin: 0 auto 1.5rem;
//   font-weight: bold;
// }

// .success-icon.success {
//   background-color: #d4edda;
//   color: #155724;
//   border: 3px solid #c3e6cb;
// }

// .success-icon.error {
//   background-color: #f8d7da;
//   color: #721c24;
//   border: 3px solid #f5c6cb;
// }

// .result-message {
//   font-size: 1.2rem;
//   color: #1e3a8a;
//   margin: 1.5rem 0;
//   line-height: 1.5;
// }

// .loading-state {
//   color: var(--color-primary);
// }

// .loading-state p {
//   margin-top: 1rem;
//   font-size: 1.1rem;
// }

// .spinner {
//   width: 60px;
//   height: 60px;
//   border: 6px solid #f0f0f0;
//   border-top: 6px solid #1e3a8a;
//   border-radius: 50%;
//   animation: spin 1s linear infinite;
//   margin: 0 auto;
// }

// .btn-retour {
//   margin-top: 2rem;
//   padding: 14px 32px;
//   background-color: #1e3a8a;
//   color: white;
//   border: none;
//   border-radius: 8px;
//   font-size: 1.1rem;
//   font-weight: 600;
//   cursor: pointer;
//   transition: background-color 0.3s;
// }

// .btn-retour:hover {
//   background-color: #2563eb;
// }

// @keyframes spin {
//   from { transform: rotate(0deg); }
//   to { transform: rotate(360deg); }
// }


























