import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Reservation.css';

const Reservation = () => {
  const { hotelId, chambreId } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [chambre, setChambre] = useState(null);
  const [existingReservations, setExistingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityError, setAvailabilityError] = useState('');
  
  const [reservationData, setReservationData] = useState({
    dateDebut: '',
    dateFin: '',
    nom: '',
    prenom: '',
    email: ''
  });

  const [success, setSuccess] = useState(false);

  const chambresDisponibles = [
    "Chambre Simple",
    "Chambre Double",
    "Suite De Luxe"
  ];

  const [indexChambre, setIndexChambre] = useState(0);
  const chambreWrapperRef = useRef(null);
  const displayedChambreValue = chambresDisponibles[indexChambre];

  // Récupération des données au chargement
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotelRes, chambreRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/hotels/${hotelId}`),
          axios.get(`http://localhost:3000/api/chambres/${chambreId}`)
        ]);

        setHotel(hotelRes.data);
        setChambre(chambreRes.data);

        // Récupération des réservations existantes pour cette chambre
        const resasRes = await axios.get(`http://localhost:3000/api/reservations/chambre/${chambreId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setExistingReservations(resasRes.data || []);

        // Vérification état initial
        if (chambreRes.data.etat !== 'Libre') {
          setIsAvailable(false);
          setAvailabilityError('Chambre actuellement occupée.');
        }

        const foundIndex = chambresDisponibles.indexOf(chambreRes.data.type_chambre);
        if (foundIndex !== -1) {
          setIndexChambre(foundIndex);
        }
      } catch (err) {
        console.error('Erreur fetch:', err);
        setError('Erreur chargement données : ' + (err.message || ''));
        if (err.response?.status === 403) {
          setAvailabilityError('Accès refusé à la disponibilité.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('token')) {
      fetchData();
    } else {
      setError('Connectez-vous pour réserver.');
      setLoading(false);
    }
  }, [hotelId, chambreId]);

  // Vérification chevauchement de dates
  const isDateAvailable = (dateDebut, dateFin) => {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    return !existingReservations.some(resa => {
      const resaDebut = new Date(resa.date_debut);
      const resaFin = new Date(resa.date_fin);
      return debut < resaFin && fin > resaDebut;
    });
  };

  // Gestion clavier pour sélection chambre
  const handleChambreKey = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndexChambre(prev => (prev === 0 ? chambresDisponibles.length - 1 : prev - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndexChambre(prev => (prev === chambresDisponibles.length - 1 ? 0 : prev + 1));
    }
  };

  const handleIndicatorClick = (e) => {
    e.stopPropagation();
    setIndexChambre(prev => (prev + 1) % chambresDisponibles.length);
    setTimeout(() => chambreWrapperRef.current?.focus(), 0);
  };

  const handleWrapperClick = () => {
    chambreWrapperRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setReservationData({ ...reservationData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAvailabilityError('');

    // Vérification disponibilité
    if (!isDateAvailable(reservationData.dateDebut, reservationData.dateFin)) {
      setAvailabilityError('Dates indisponibles. Choisissez d\'autres dates.');
      return;
    }

    if (!localStorage.getItem('token')) {
      alert('Connectez-vous pour réserver.');
      navigate('/login');
      return;
    }

    // Validation des champs
    if (!reservationData.dateDebut || !reservationData.dateFin) {
      setError('Veuillez sélectionner des dates valides.');
      return;
    }
    if (new Date(reservationData.dateDebut) >= new Date(reservationData.dateFin)) {
      setError('Date de départ doit être après l\'arrivée.');
      return;
    }
    if (!reservationData.nom || !reservationData.prenom || !reservationData.email) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const payload = {
        chambre: chambreId,
        date_debut: reservationData.dateDebut,
        date_fin: reservationData.dateFin,
      };

      const resRes = await axios.post(
        `http://localhost:3000/api/reservations`,
        payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setSuccess(true);
      navigate(`/paiement/${resRes.data._id}`);
    } catch (err) {
      console.error('Erreur réservation:', err.response?.data);
      if (err.response?.data?.message?.includes('non disponible')) {
        setAvailabilityError('Chambre non disponible pour ces dates.');
      } else {
        setError(err.response?.data?.message || 'Erreur lors de la réservation.');
      }
    }
  };

  return (
    <div className="reservation-container">
      <section className="hero">
        <h1>Trouvez et Réservez Votre Séjour Parfait</h1>
      </section>

      <div className="search-box-wrapper">
        <div className="search-box">
          <h2>Votre Recherche</h2>
          <form className="search-form">
            <div className="input-group input-ville-group">
              <label>Ville</label>
              <input type="text" placeholder="Ex: Paris, New-york..." />
            </div>
            <div className="input-group input-date-group">
              <label>Dates</label>
              <div className="date-inputs">  
           <input 
           type="date" 
           placeholder="Du" 
           />
          <input 
          type="date" 
          placeholder="au" 
          />
          </div>
            </div>
            <div className="input-group input-prix-group">
              <label>Prix Max (€)</label>
              <input type="number" placeholder="800" />
            </div>
            <button type="button" className="btn-rechercher">Rechercher</button>
          </form>
        </div>
      </div>

      <section className="reservation-section">
        <div className="reservation-box">
          <h2>Confirmez Votre Réservation</h2>

          {success ? (
            <div className="success-message">Réservation réussie ! Redirection vers le paiement...</div>
          ) : (
            <form onSubmit={handleSubmit} className="form-reservation">
              <div className="row-dates-chambre">
                <div className="input-group">
                  <label>Date d'arrivée</label>
                  <input
                    type="date"
                    name="dateDebut"
                    value={reservationData.dateDebut}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Date de départ</label>
                  <input
                    type="date"
                    name="dateFin"
                    value={reservationData.dateFin}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Chambre</label>
                  <div
                    className="input-chambre-wrapper"
                    ref={chambreWrapperRef}
                    tabIndex={0}
                    onKeyDown={handleChambreKey}
                    onClick={handleWrapperClick}
                    role="combobox"
                    aria-label="Sélectionner la chambre"
                  >
                    <input
                      type="text"
                      value={displayedChambreValue}
                      readOnly
                      className="input-fixed"
                    />
                    <span
                      className="dropdown-indicator"
                      onClick={handleIndicatorClick}
                      title="Changer de chambre"
                    ></span>
                  </div>
                </div>
              </div>

              <div className="row-nom-prenom">
                <div className="input-group">
                  <label>Nom</label>
                  <input type="text" name="nom" value={reservationData.nom} onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <label>Prénom</label>
                  <input type="text" name="prenom" value={reservationData.prenom} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="input-group">
                <label>E-mail</label>
                <input type="email" name="email" value={reservationData.email} onChange={handleInputChange} required />
              </div>

              {availabilityError && (
                <p className="error-message">
                  {availabilityError} <Link to="/hotels">Rechercher une autre chambre</Link>
                </p>
              )}
              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="btn-confirmer" disabled={!isAvailable || loading}>
                Confirmez
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default Reservation;




































// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './Reservation.css';
// const Reservation = () => {
//   const { hotelId, chambreId } = useParams();
//   const navigate = useNavigate();
//   const [hotel, setHotel] = useState(null);
//   const [chambre, setChambre] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [reservationData, setReservationData] = useState({
//     dateDebut: '',
//     dateFin: '',
//     nom: '',
//     prenom: '',
//     email: ''
//   });
//   const [success, setSuccess] = useState(false);
//   // Liste des chambres
//   const chambresDisponibles = [
//     "Chambre Simple",
//     "Chambre Double",
//     "Suite De Luxe"
//   ];
//   // index sélectionné dans la liste
//   const [indexChambre, setIndexChambre] = useState(0);
//   // ref sur le wrapper pour gérer le focus clavier proprement
//   const chambreWrapperRef = useRef(null);
//   // Valeur affichée pour la chambre sélectionnée
//   const displayedChambreValue = chambresDisponibles[indexChambre];
//   // Sync initial depuis l'API : si type_chambre connu, positionne l'index
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [hotelRes, chambreRes] = await Promise.all([
//           axios.get(`http://localhost:3000/api/hotels/${hotelId}`),
//           axios.get(`http://localhost:3000/api/chambres/${chambreId}`)
//         ]);
//         setHotel(hotelRes.data);
//         setChambre(chambreRes.data);
//         const foundIndex = chambresDisponibles.indexOf(chambreRes.data.type_chambre);
//         if (foundIndex !== -1) {
//           setIndexChambre(foundIndex);
//         } else {
//           // si l'API renvoie un nom non listé, on ajoute dynamiquement (non destructif)
//           if (chambreRes.data.type_chambre) {
//             // on essaie de placer le label en première position sans modifier la liste d'origine
//             setIndexChambre(0);
//           }
//         }
//       } catch (err) {
//         console.error('Erreur fetch:', err);
//         setError('Erreur chargement données : ' + (err.message || ''));
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [hotelId, chambreId]);
//   // Handler clavier sur le wrapper (capte ArrowUp/ArrowDown)
//   const handleChambreKey = (e) => {
//     console.log('🔍 Key pressed:', e.key); // Debug key
//     if (e.key === 'ArrowUp') {
//       e.preventDefault();
//       setIndexChambre(prev => (prev === 0 ? chambresDisponibles.length - 1 : prev - 1));
//     } else if (e.key === 'ArrowDown') {
//       e.preventDefault();
//       setIndexChambre(prev => (prev === chambresDisponibles.length - 1 ? 0 : prev + 1));
//     }
//   };

//   const handleIndicatorClick = (e) => {
//     e.stopPropagation();
//     setIndexChambre(prev => (prev + 1) % chambresDisponibles.length);
//     // garantit le focus après clic même si le span capte l'event
//     setTimeout(() => {
//       chambreWrapperRef.current?.focus();
//     }, 0);
//   };
//   // Permet au wrapper d'être focusable au clic (donc on peut utiliser les flèches)
//   const handleWrapperClick = () => {
//     console.log('🔍 Wrapper clicked, focusing'); // Debug focus
//     chambreWrapperRef.current?.focus();
//   };
//   const handleInputChange = (e) => {
//     setReservationData({ ...reservationData, [e.target.name]: e.target.value });
//   };
 
//   const handleSubmit = async (e) => {
//   e.preventDefault();
//   setError('');

//   if (!localStorage.getItem('token')) {
//     alert('Connectez-vous pour réserver.');
//     navigate('/login');
//     return;
//   }

//   // Validation dates et champs
//   if (!reservationData.dateDebut || !reservationData.dateFin) {
//     setError('Veuillez sélectionner des dates valides.');
//     return;
//   }
//   if (new Date(reservationData.dateDebut) >= new Date(reservationData.dateFin)) {
//     setError('Date de départ doit être après l\'arrivée.');
//     return;
//   }
//   if (!reservationData.nom || !reservationData.prenom || !reservationData.email) {
//     setError('Veuillez remplir tous les champs obligatoires.');
//     return;
//   }

//   try {
//     const payload = {
//       chambre: chambreId,
//       date_debut: reservationData.dateDebut,
//       date_fin: reservationData.dateFin,
//       // client: localStorage.getItem('userId')
//     };

//     // Création réservation en "En attente" seulement
//     const resRes = await axios.post(
//       `http://localhost:3000/api/reservations`,
//       payload,
//       { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
//     );

//     setSuccess(true);

//     // Redirection vers page paiement / confirmation
//     navigate(`/paiement/${resRes.data._id}`);

//   } catch (err) {
//     console.error('Erreur submit:', err);
//     setError(err.response?.data?.message || 'Erreur réservation.');
//   }
// };


//   return (
//     <div className="reservation-container">
//       <section className="hero">
//         <h1>Trouvez et Réservez Votre Séjour Parfait</h1>
//       </section>
//       <div className="search-box-wrapper">
//         <div className="search-box">
//           <h2>Votre Recherche</h2>
//           <form className="search-form"> {/* Retiré disabled pour fonctionnel */}
//             <div className="input-group input-ville-group">
//               <label>Ville</label>
//               <input type="text" placeholder="Ex: Paris, New-york..." /> {/* Retiré disabled */}
//             </div>
//             <div className="input-group input-date-group">
//               <label>Dates</label>
//               <input type="date" placeholder="jj/mm/aaaa" /> {/* Retiré disabled */}
//             </div>
//             <div className="input-group input-prix-group">
//               <label>Prix Max (€)</label>
//               <input type="number" placeholder="800" /> {/* Retiré disabled */}
//             </div>
//             <button type="button" className="btn-rechercher">Rechercher</button> {/* Retiré disabled */}
//           </form>
//         </div>
//       </div>
//       <section className="reservation-section">
//         <div className="reservation-box">
//           <h2>Confirmez Votre Réservation</h2>
//           {success ? (
//             <div className="success-message">Réservation réussie ! Consultez votre historique.</div>
//           ) : (
//             <form onSubmit={handleSubmit} className="form-reservation">
//               <div className="row-dates-chambre">
//                 <div className="input-group">
//                   <label>Date d'arrivée</label>
//                   <input type="date" name="dateDebut" value={reservationData.dateDebut} onChange={handleInputChange} required />
//                 </div>
//                 <div className="input-group">
//                   <label>Date de départ</label>
//                   <input type="date" name="dateFin" value={reservationData.dateFin} onChange={handleInputChange} required />
//                 </div>
//                 <div className="input-group">
//                   <label>Chambre</label>
//                   {/* Le wrapper est focusable et capte les flèches. L'input reste readOnly. */}
//                   <div
//                     className="input-chambre-wrapper"
//                     ref={chambreWrapperRef}
//                     tabIndex={0}
//                     onKeyDown={handleChambreKey}
//                     onClick={handleWrapperClick}
//                     aria-label="Sélectionner la chambre, utilisez les flèches haut et bas"
//                     role="combobox"
//                     aria-haspopup="listbox"
//                   >
//                     <input
//                       type="text"
//                       value={displayedChambreValue}
//                       readOnly
//                       className="input-fixed"
//                       aria-readonly="true"
//                       aria-expanded="false"
//                     />
//                     <span className="dropdown-indicator" onClick={handleIndicatorClick} title="Changer la chambre (clic / ↑ ↓)"></span>
//                   </div>
//                 </div>
//               </div>
//               <div className="row-nom-prenom">
//                 <div className="input-group">
//                   <label>Nom</label>
//                   <input type="text" name="nom" value={reservationData.nom} onChange={handleInputChange} required />
//                 </div>
//                 <div className="input-group">
//                   <label>Prénom</label>
//                   <input type="text" name="prenom" value={reservationData.prenom} onChange={handleInputChange} required />
//                 </div>
//               </div>
//               <div className="input-group">
//                 <label>E-mail</label>
//                 <input type="email" name="email" value={reservationData.email} onChange={handleInputChange} required />
//               </div>
//               <button type="submit" className="btn-confirmer">Confirmez</button>
//             </form>
//           )}
//           {error && <p className="error-message">{error}</p>}
//         </div>
//       </section>
//     </div>
//   );
// };
// export default Reservation;