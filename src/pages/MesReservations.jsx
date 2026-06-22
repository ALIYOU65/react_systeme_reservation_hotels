import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MesReservations.css'; 

const MesReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fonction nuits déplacée en haut (plus efficace)
  const nuits = (debut, fin) => {
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    return Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchReservations = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/reservations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // CORRECTION CLÉ : Extrait l'array des réservations, fallback vide
        const resasArray = res.data.reservations || [];
        setReservations(resasArray);
        console.log('Réservations chargées (array):', resasArray);  // Debug : vérifie en console
        setLoading(false);
      } catch (err) {
        console.error('Erreur fetch réservations:', err);
        setError('Erreur chargement réservations');
        setReservations([]);  // Fallback array vide pour éviter crash
        setLoading(false);
      }
    };
    fetchReservations();
  }, [token, navigate]);

  if (loading) return <div className="loading">Chargement réservations...</div>;
  if (error) return <div className="error">{error} <button onClick={() => navigate('/dashboard-client')}>Retour</button></div>;

  return (
    <div className="mes-reservations-container">
      <section className="hero-reservations">
        <h1>Mes Réservations</h1>
        <p>Vos séjours confirmés</p>
      </section>
      <div className="reservations-wrapper">
        {reservations.length === 0 ? (
          <p>Aucune réservation trouvée. <button onClick={() => navigate('/hotels')}>Réserver maintenant</button></p>
        ) : (
          <div className="reservations-list">
            {reservations.map((resa) => {
              const total = resa.chambre.prix_nuit * nuits(resa.date_debut, resa.date_fin);
              return (
                <div key={resa._id} className="reservation-card">
                  <h3>{resa.chambre.hotel.nom} - {resa.chambre.type_chambre}</h3>
                  <p>Dates : {new Date(resa.date_debut).toLocaleDateString()} au {new Date(resa.date_fin).toLocaleDateString()} ({nuits(resa.date_debut, resa.date_fin)} nuits)</p>
                  <p>Total : {total} €</p>
                  <p>Statut : {resa.statut}</p>
                  <p>Paiement : {resa.paiement?.status || 'En attente'}</p>
                  <button onClick={() => navigate(`/paiement/${resa._id}`)}>Payer si en attente</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MesReservations;




























// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './MesReservations.css'; // Crée ce CSS si besoin, ou utilise global

// const MesReservations = () => {
//   const [reservations, setReservations] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const token = localStorage.getItem('token');

//   useEffect(() => {
//     if (!token) {
//       navigate('/login');
//       return;
//     }
//     const fetchReservations = async () => {
//       try {
//         const res = await axios.get('http://localhost:3000/api/reservations', {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setReservations(res.data);
//         setLoading(false);
//       } catch (err) {
//         console.error('Erreur fetch réservations:', err);
//         setError('Erreur chargement réservations');
//         setLoading(false);
//       }
//     };
//     fetchReservations();
//   }, [token, navigate]);

//   if (loading) return <div className="loading">Chargement réservations...</div>;
//   if (error) return <div className="error">{error} <button onClick={() => navigate('/dashboard-client')}>Retour</button></div>;

//   const nuits = (debut, fin) => Math.ceil((new Date(fin) - new Date(debut)) / (1000 * 60 * 60 * 24));

//   return (
//     <div className="mes-reservations-container">
//       <section className="hero-reservations">
//         <h1>Mes Réservations</h1>
//         <p>Vos séjours confirmés</p>
//       </section>
//       <div className="reservations-wrapper">
//         {reservations.length === 0 ? (
//           <p>Aucune réservation trouvée. <button onClick={() => navigate('/hotels')}>Réserver maintenant</button></p>
//         ) : (
//           <div className="reservations-list">
//             {reservations.map((resa) => {
//               const total = resa.chambre.prix_nuit * nuits(resa.date_debut, resa.date_fin);
//               return (
//                 <div key={resa._id} className="reservation-card">
//                   <h3>{resa.chambre.hotel.nom} - {resa.chambre.type_chambre}</h3>
//                   <p>Dates : {new Date(resa.date_debut).toLocaleDateString()} au {new Date(resa.date_fin).toLocaleDateString()} ({nuits(resa.date_debut, resa.date_fin)} nuits)</p>
//                   <p>Total : {total} €</p>
//                   <p>Statut : {resa.statut}</p>
//                   <p>Paiement : {resa.paiement?.status || 'En attente'}</p>
//                   <button onClick={() => navigate(`/paiement/${resa._id}`)}>Payer si en attente</button>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MesReservations;