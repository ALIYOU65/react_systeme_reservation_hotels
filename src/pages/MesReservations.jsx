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
        
        const resasArray = res.data.reservations || [];
        setReservations(resasArray);
        console.log('Réservations chargées (array):', resasArray);  
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
  // Extraction sécurisée de l'ID (cherche _id ou id)
  const idPaiement = resa._id || resa.id;
  const total = (resa.chambre?.prix_nuit || 0) * nuits(resa.date_debut, resa.date_fin);

  return (
    <div key={idPaiement || Math.random()} className="reservation-card">
      <h3>{resa.chambre?.hotel?.nom || 'Hôtel'} - {resa.chambre?.type_chambre || 'Chambre'}</h3>
      <p>
        Dates : {new Date(resa.date_debut).toLocaleDateString()} au{' '}
        {new Date(resa.date_fin).toLocaleDateString()} ({nuits(resa.date_debut, resa.date_fin)} nuits)
      </p>
      <p>Total : {total} €</p>
      <p>Statut : {resa.statut}</p>
      <p>Paiement : {resa.paiement?.status || 'En attente'}</p>

      {/* Bouton de paiement sécurisé */}
      {idPaiement ? (
        <button onClick={() => navigate(`/paiement/${idPaiement}`)}>
          Payer si en attente
        </button>
      ) : (
        <p style={{ color: 'red', fontSize: '0.9rem' }}>ID indisponible</p>
      )}
    </div>
  );
})}
{

}
</div>
  )}
   </div>
    </div>
  );
};

export default MesReservations;



























