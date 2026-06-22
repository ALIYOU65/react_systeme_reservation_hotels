import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// const Paiement = () => {
//   const { reservationId } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

// useEffect(() => {
//   const initPaiement = async () => {
//     try {
//       setLoading(true);
//       const token = localStorage.getItem('token');

//       const response = await axios.post(
//         `http://localhost:3000/api/reservations/${reservationId}/payment`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       // REDIRECTION DIRECTE VERS STRIPE → il nous ramènera après
//       window.location.href = response.data.checkoutUrl || response.data.url;

//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.message || 'Impossible de lancer le paiement');
//       setLoading(false);
//     }
//   };

//   initPaiement();
// }, [reservationId]
// );
const Paiement = () => {
  const { reservationId } = useParams();          // Récupère l’ID de la réservation depuis l’URL
  const navigate = useNavigate();            // Au cas où on voudrait rediriger manuellement plus tard
  const [loading, setLoading] = useState(true);      // Indicateur de chargement pendant la création de la session Stripe
  const [error, setError] = useState('');        // Stocke un éventuel message d’erreur

  useEffect(() => {
    const initPaiement = async () => {
      try {
        setLoading(true);

        // Récupération du token JWT stocké dans le localStorage
        const token = localStorage.getItem('token');

        // Appel à la route protégée qui crée la session Stripe Checkout
        const response = await axios.post(
          `http://localhost:3000/api/reservations/${reservationId}/payment`,
          {},                                                              // Corps vide → tout est vérifié côté serveur
          { headers: { Authorization: `Bearer ${token}` } }                // Authentification obligatoire
        );

        // Redirection directe vers la page de paiement Stripe
        // Stripe nous renverra sur success_url ou cancel_url après
        window.location.href = response.data.checkoutUrl || response.data.url;

      } catch (err) {
        console.error(err);
        // Affichage de l’erreur renvoyée par le backend (ex: réservation déjà payée, expirée, etc.)
        setError(err.response?.data?.message || 'Impossible de lancer le paiement');
        setLoading(false);
      }
    };

    // Démarrage automatique du processus de paiement dès le montage du composant
    initPaiement();
  }, [reservationId]);   // Dépendance : si l’ID change → relance (sécurité)

  // ────────────────────── AFFICHAGE ──────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', fontSize: '1.2rem' }}>
        <p>Redirection vers le paiement sécurisé Stripe...</p>
        <p>Une nouvelle fenêtre va s'ouvrir</p>
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
          style={{ marginTop: '1rem', padding: '10px 20px', fontSize: '1rem' }}
        >
          Retour aux réservations
        </button>
      </div>
    );
  }

  // Si tout s'est bien passé, on ne reste pas sur cette page
  return null;
};

export default Paiement;































// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import './Paiement.css';
// // Load Stripe avec fallback debug
// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').then(stripe => {
//   if (!stripe) {
//     console.error('❌ Stripe clé publique manquante – Ajoute VITE_STRIPE_PUBLISHABLE_KEY dans .env');
//   }
//   return stripe;
// });
// const PaiementContent = () => {
//   const { reservationId } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [reservation, setReservation] = useState(null);
//   const [clientSecret, setClientSecret] = useState('');
//   const stripe = useStripe();
//   const elements = useElements();
//   const token = localStorage.getItem('token');
//   useEffect(() => {
//     const initPaiement = async () => {
//       if (!token) {
//         navigate('/login');
//         return;
//       }
//       try {
//         console.log('🔍 Init paiement pour résa:', reservationId); // Debug
//         // Fetch réservation pour détails
//         const resRes = await axios.get(`http://localhost:3000/api/reservations/${reservationId}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setReservation(resRes.data);
//         console.log('🔍 Réservation loaded:', resRes.data); // Debug total/hôtel
        
//         // // Vérification d'éligibilité frontend (ajustez selon votre schéma backend, ex. status 'pending')
//         // if (!resRes.data || resRes.data.status !== 'pending') { // Assurez-vous que le champ 'status' existe
//         //   throw new Error(`Réservation non éligible pour paiement: statut '${resRes.data?.status || 'inconnu'}'`);
//         // }
//         // Vérification d'éligibilité selon ton backend
//         const statutPaiement = resRes.data?.paiement?.status;
//         const statutReservation = resRes.data?.statut;

//        if (!["En attente", "Confirmée"].includes(statutReservation)) {
//        throw new Error(`Réservation non éligible: statut réservation '${statutReservation}'`);
//        }

//        if (statutPaiement !== "pending") {
//        throw new Error(`Réservation non éligible: statut paiement '${statutPaiement}'`);
       
//        }


        
//         // Créer session paiement (ton backend)
//         const paymentRes = await axios.post(`http://localhost:3000/api/reservations/${reservationId}/payment`, {}, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setClientSecret(paymentRes.data.clientSecret);
//         console.log('🔍 Client secret reçu:', paymentRes.data.clientSecret ? 'OK' : 'Vide'); // Debug
//         setLoading(false);
//       } catch (err) {
//         console.error('❌ Erreur paiement:', err.response?.data || err);
//         setError('Erreur initialisation : ' + (err.response?.data?.message || err.message));
//         setLoading(false);
//       }
//     };
//     initPaiement();
//   }, [reservationId, token, navigate]);
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!stripe || !elements) {
//       setError('Stripe non chargé – Rechargez la page.');
//       return;
//     }
//     setError('');
//     console.log('🔍 Submit paiement...'); // Debug
//     const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
//       payment_method: {
//         card: elements.getElement(CardElement),
//         billing_details: {
//           name: `${reservation.client.nom} ${reservation.client.prenom}`,
//           email: reservation.client.email
//         }
//       }
//     });
//     if (error) {
//       console.error('❌ Erreur Stripe:', error);
//       setError(error.message);
//     } else if (paymentIntent.status === 'succeeded') {
//       console.log('✅ Paiement réussi:', paymentIntent.id); // Debug
//       // Update backend (ton confirmReservation)
//       await axios.put(`http://localhost:3000/api/reservations/${reservationId}/confirm`, {}, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       alert('Paiement réussi ! Réservation confirmée.');
//       navigate('/mes-reservations');
//     }
//   };
//   if (loading) return <div className="loading">Initialisation paiement...</div>;
//   if (error || !reservation || !clientSecret) return <div className="error">{error} <button onClick={() => navigate(-1)}>Retour</button></div>;
//   const nuits = Math.ceil((new Date(reservation.date_fin) - new Date(reservation.date_debut)) / (1000 * 60 * 60 * 24));
//   const total = reservation.chambre.prix_nuit * nuits;
//   return (
//     <div className="paiement-container">
//       <section className="hero-paiement">
//         <h1>Paiement Sécurisé</h1>
//         <p>Réservation {reservationId} – {reservation.chambre.hotel.nom}</p>
//         <p>Chambre : {reservation.chambre.type_chambre} – Total : {total} €</p>
//       </section>
//       <div className="paiement-wrapper">
//         <div className="paiement-box">
//           <h2>Informations Carte</h2>
//           <form onSubmit={handleSubmit} className="paiement-form">
//             <div className="input-group">
//               <label>Numéro Carte</label>
//               <CardElement className="card-element" />
//             </div>
//             {/* Suppression des champs redondants : CardElement gère déjà expiry et CVC. Nom est géré via billing_details. */}
//             <button type="submit" className="btn-payer" disabled={!stripe || loading}>
//               Payer {total} €
//             </button>
//           </form>
//           {error && <p className="error-message">{error}</p>}
//         </div>
//       </div>
//     </div>
//   );
// };
// const Paiement = () => {
//   return (
//     <Elements stripe={stripePromise}>
//       <PaiementContent />
//     </Elements>
//   );
// };
// export default Paiement;