import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MesFactures.css';  

const MesFactures = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    const fetchFactures = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/reservations/factures', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFactures(res.data.factures || []);
        setLoading(false);
      } catch (err) {
        console.error('Erreur fetch factures:', err);
        setError('Erreur chargement factures');
        setLoading(false);
      }
    };
    fetchFactures();
  }, [token, navigate]);

  const handleDownload = (pdfUrl) => {
  // Force le téléchargement direct du PDF
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = pdfUrl.split('/').pop(); // garde le vrai nom du fichier
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  if (loading) return <div className="loading">Chargement factures...</div>;
  if (error) return <div className="error">{error} <button onClick={() => navigate('/dashboard-client')}>Retour</button></div>;

  return (
    <div className="mes-factures-container">
      <section className="hero-factures">
        <h1>Mes Factures</h1>
        <p>Vos reçus de paiement</p>
      </section>
      <div className="factures-wrapper">
        {factures.length === 0 ? (
          <p>Aucune facture disponible. <button onClick={() => navigate('/mes-reservations')}>Voir mes réservations</button></p>
        ) : (
          <div className="factures-list">
            {factures.map((facture) => (
              <div key={facture.id} className="facture-card">
                <h3>{facture.hotel} - {facture.chambre}</h3>
                <p>Dates: {facture.dates}</p>
                <p>Total: {facture.total} €</p>
                <p>Paiement: {facture.datePaiement}</p>
                <button onClick={() => handleDownload(facture.pdfUrl)}>
                  Télécharger PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MesFactures;