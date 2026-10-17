import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import styles from './HotelDetail.module.css';
import { useAuth } from '../utils/auth';
import api from '../utils/axiosConfig';

const HotelDetail = () => {
  // Récupération de l'ID de l'hôtel depuis l'URL
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // États principaux
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination des chambres (3 par page)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Formulaire d'avis
  const [nouvelAvis, setNouvelAvis] = useState({ note: 5, commentaire: '' });
  const [avisLoading, setAvisLoading] = useState(false);

  // Gestion du carrousel d'images (hôtel + chaque chambre)
  const [carouselIndexes, setCarouselIndexes] = useState({});

  // Filtres pour les chambres
  const [roomFilters, setRoomFilters] = useState({
    prixMax: 3000,
    onlyAvailable: false
  });

  // Vérification du rôle "client" avant réservation
  const handleReserveClick = (hotelId, chambreId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Vous devez être connecté en tant que client pour réserver une chambre.");
      navigate('/login');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      let userRoles = [];
      if (Array.isArray(decoded.role)) {
        userRoles = decoded.role.map(r => r.toLowerCase());
      } else if (typeof decoded.role === "string") {
        userRoles = [decoded.role.toLowerCase()];
      }

      if (!userRoles.includes("client")) {
        alert("Seuls les clients connectés peuvent réserver.");
        navigate('/login');
        return;
      }
    } catch (err) {
      alert("Session invalide. Veuillez vous reconnecter.");
      localStorage.removeItem("token");
      navigate('/login');
      return;
    }

    navigate(`/reservation/${hotelId}/${chambreId}`);
  };

  // Traduction simple du type de chambre
  const mapChambreType = (type) => {
    const t = type.toLowerCase();
    if (t.includes("suite")) return "Suite de luxe";
    if (t.includes("double")) return "Chambre double";
    if (t.includes("simple") || t.includes("single")) return "Chambre simple";
    return type;
  };

  // Classe CSS selon disponibilité
  const getDisponibiliteClass = (etat) => {
    if (!etat) return "";
    return etat.toLowerCase() === "libre"
      ? styles.badgeDisponible
      : styles.badgeOccupee;
  };

  // Chargement des données de l'hôtel
  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/hotels/${id}`);
        const hotelData = response.data;

        if (!hotelData.validated) {
          setError('Hôtel en attente de validation.');
          return;
        }

        let avgNote = null;
        if (hotelData.avis?.length > 0) {
          avgNote = hotelData.avis.reduce((sum, avi) => sum + avi.note, 0) / hotelData.avis.length;
        }

        setHotel({ ...hotelData, avgNote });
        updatePagination(hotelData.chambres || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement de l’hôtel.');
      } finally {
        setLoading(false);
      }
    };

    fetchHotel();
  }, [id]);

  // Mise à jour pagination après filtre
  const updatePagination = (chambres) => {
    const filtered = chambres.filter(c =>
      (!roomFilters.onlyAvailable || c.etat?.toLowerCase() === "libre") &&
      c.prix_nuit <= roomFilters.prixMax
    );
    setTotalPages(Math.ceil(filtered.length / 3));
    setCurrentPage(1);
  };

  useEffect(() => {
    if (hotel?.chambres) updatePagination(hotel.chambres);
  }, [roomFilters, hotel]);

  // Soumission d'avis
  const handleNouvelAvisSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Vous devez être connecté pour laisser un avis");
      navigate("/login");
      return;
    }
    if (!nouvelAvis.commentaire.trim()) {
      alert("Le commentaire est obligatoire !");
      return;
    }

    setAvisLoading(true);
    try {
      await api.post(`/hotels/${id}/avis`, {
        note: Number(nouvelAvis.note),
        commentaire: nouvelAvis.commentaire.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Avis envoyé ! Il sera visible après modération.");
      setNouvelAvis({ note: 5, commentaire: '' });
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally {
      setAvisLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getAllImages = (photos) => photos?.flatMap(p => p.images || []) || [];

  const updateCarouselIndex = (direction, chambreId = null) => {
    const key = chambreId || id;
    setCarouselIndexes(prev => {
      const current = prev[key] || 0;
      const images = getAllImages(chambreId ? hotel?.chambres?.find(c => c._id === chambreId)?.photos : hotel?.photos);
      if (images.length === 0) return prev;

      let newIndex = direction === 'next'
        ? (current + 1) % images.length
        : (current - 1 + images.length) % images.length;

      return { ...prev, [key]: newIndex };
    });
  };

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;

    if (type === 'checkbox') {
      setRoomFilters({ ...roomFilters, [name]: checked });
      return;
    }

    if (name === 'prixMax') {
      const val = parseInt(value) || 0;
      if (val > 3000) {
        setRoomFilters({ ...roomFilters, prixMax: 3000 });
        return;
      }
      setRoomFilters({ ...roomFilters, prixMax: val });
      return;
    }

    setRoomFilters({ ...roomFilters, [name]: value });
  };

  const handleFilterSubmit = (e) => e.preventDefault();

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (error || !hotel) return <div className={styles.error}>{error || "Hôtel non trouvé"}</div>;

  const allImages = getAllImages(hotel.photos || []);
  const currentIndex = carouselIndexes[id] || 0;

  const filteredChambres = hotel.chambres?.filter(c =>
    (!roomFilters.onlyAvailable || c.etat?.toLowerCase() === "libre") &&
    c.prix_nuit <= roomFilters.prixMax
  ) || [];

  const startIndex = (currentPage - 1) * 3;
  const displayedChambres = filteredChambres.slice(startIndex, startIndex + 3);

  return (
    <div className={styles.homeContainer}>

      {/* HERO */}
      <section className={styles.hero}>
        <h1>Trouvez et Réservez Votre Séjour Parfait</h1>
      </section>

      {/* FILTRES */}
      <div className={styles.searchBoxWrapper}>
        <div className={styles.searchBox}>
          <h2>Filtrer les chambres</h2>
          <form className={styles.searchForm} onSubmit={handleFilterSubmit}>
            <div className={`${styles.inputGroup} ${styles.inputPrixGroup}`}>
    <label htmlFor="prixMax">Prix Max (€)</label>
    <input 
      type="number" 
      id="prixMax" 
      name="prixMax" 
      min="0"
      max="3000"
      value={roomFilters.prixMax} 
      onChange={handleInputChange} 
    />
  </div>
            <div className={`${styles.inputGroup} ${styles.inputCheckboxGroup}`}>
              <label>
                <input type="checkbox" id="onlyAvailable" name="onlyAvailable" checked={roomFilters.onlyAvailable} onChange={handleInputChange} />
                Seulement les chambres disponibles
              </label>
            </div>
            <button className={styles.btnRechercher}>Filtrer</button>
          </form>
        </div>
      </div>

      {/* DÉTAILS HÔTEL */}
      <div className={styles.dashboardContainer}>
        <h2>Hôtel</h2>
        <div className={styles.section}>

          {/* Carrousel principal */}
          {allImages.length > 0 && (
            <div className={styles.carouselContainer}>
              <div className={styles.carousel}>
                <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => updateCarouselIndex('prev')}>‹</button>
                <div className={styles.carouselImages} style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                  {allImages.map((img, i) => (
                    <img
                      key={i}
                      src={img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url}`}
                      className={styles.carouselImage}
                      alt={`Photo hôtel ${i + 1}`}
                    />
                  ))}
                </div>
                <button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => updateCarouselIndex('next')}>›</button>
              </div>
              {allImages.length > 1 && (
                <div className={styles.carouselDots}>
                  {allImages.map((_, i) => (
                    <span
                      key={i}
                      className={`${styles.dot} ${i === currentIndex ? styles.active : ''}`}
                      onClick={() => setCarouselIndexes(prev => ({ ...prev, [id]: i }))}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Titre + étoiles de l'hôtel */}
          <div className={styles.titleRow}>
            <div className={styles.stars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`${styles.star} ${i < hotel.etoiles ? styles.filled : styles.empty}`}
                >
                  ★
                </span>
              ))}
            </div>
            <h2 className={styles.hotelName}>{hotel.nom}</h2>
          </div>

          <p className={styles.description}>{hotel.description}</p>
          <p className={styles.address}>{hotel.adresse}</p>
          <p className={styles.price}>
            <span className={styles.pricePrefix}>À partir de </span>
            <span className={styles.priceValue}>{hotel.prix}€ / nuit</span>
          </p>
        </div>

        {/* CHAMBRES */}
        <div className={`${styles.section} ${styles.chambresSection}`}>
          <div className={styles.list}>
            {displayedChambres.map(chambre => {
              const imgs = getAllImages(chambre.photos || []);
              const idx = carouselIndexes[chambre._id] || 0;

              return (
                <div key={chambre._id} className={`${styles.item} ${styles.chambreItem}`}>
                  <div className={styles.chamberContent}>
                    <div className={styles.chamberLeft}>
                      {imgs.length > 0 && (
                        <div className={`${styles.carouselContainer} ${styles.chambreCarousel}`}>
                          <div className={styles.carousel}>
                            <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => updateCarouselIndex('prev', chambre._id)}>‹</button>
                            <div className={styles.carouselImages} style={{ transform: `translateX(-${idx * 100}%)` }}>
                              {imgs.map((img, i) => (
                                <img
                                  key={i}
                                  src={img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url}`}
                                  className={styles.carouselImage}
                                  alt=""
                                />
                              ))}
                            </div>
                            <button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => updateCarouselIndex('next', chambre._id)}>›</button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.chamberRight}>
                      <h4>{mapChambreType(chambre.type_chambre)}</h4>
                      <p>{chambre.description}</p>
                      <p><span className={styles.label}>Prix :</span> <span className={styles.priceValue}>{chambre.prix_nuit}€</span></p>
                      <p>
                        <span className={styles.label}>Disponibilité :</span>{' '}
                        <span className={getDisponibiliteClass(chambre.etat)}>{chambre.etat}</span>
                      </p>
                      <button className={styles.reserveBtn} onClick={() => handleReserveClick(id, chambre._id)}>
                        Réservez
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {filteredChambres.length === 0 ? (
            <p className={styles.noRoomsMessage}>Aucune chambre correspond aux critères.</p>
          ) : totalPages > 1 ? (
            <div className={`${styles.pagination} ${styles.chambrePagination}`}>
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`${styles.paginationBtn} ${styles.prevBtn}`}>Précédent</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`${styles.pageNumberBtn} ${currentPage === i + 1 ? styles.active : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${styles.paginationBtn} ${styles.nextBtn}`}>Suivant</button>
            </div>
          ) : null}
        </div>

        {/* AVIS CLIENTS */}
        <div className={`${styles.section} ${styles.avisSection}`}>
          <h2 className={styles.avisTitle}>
            Avis des clients ({hotel.avis?.filter(a => a.status === 'approved').length || 0})
          </h2>

          {!hotel.avis || hotel.avis.filter(a => a.status === 'approved').length === 0 ? (
            <p className={styles.noAvis}>Aucun avis approuvé pour le moment.</p>
          ) : (
            <div className={styles.avisList}>
              {hotel.avis
                .filter(a => a.status === 'approved')
                .map((avi) => (
                  <div key={avi._id} className={styles.avisItem}>
                    <div className={styles.avisHeader}>
                      <strong>{avi.user?.prenom || 'Client'} {avi.user?.nom?.[0] || ''}.</strong>
                      <span className={styles.avisDate}>
                        {new Date(avi.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Note */}
                    <div className={styles.avisStars}>
                      <span className={styles.avisNoteSimple}>{avi.note}/5</span>
                    </div>

                    <p className={styles.avisCommentaire}>{avi.commentaire}</p>
                  </div>
                ))}
            </div>
          )}

          {/* Formulaire avis */}
          <form onSubmit={handleNouvelAvisSubmit} className={styles.avisForm}>
            <div className={styles.noteGroup}>
              <div className={styles.noteHeader}>
                <label className={styles.noteLabel}>Votre note</label>
                <span className={styles.noteValue}>{nouvelAvis.note}/5</span>
              </div>
              <div className={styles.sliderContainer}>
                <input
                  type="range"
                  min="1" max="5" step="1"
                  value={nouvelAvis.note}
                  onChange={(e) => setNouvelAvis({ ...nouvelAvis, note: parseInt(e.target.value) })}
                  className={styles.noteSlider}
                />
              </div>
            </div>

            <textarea
              placeholder="Laissez votre avis ici..."
              value={nouvelAvis.commentaire}
              onChange={(e) => setNouvelAvis({ ...nouvelAvis, commentaire: e.target.value })}
              className={styles.avisTextarea}
              required
            />

            <button type="submit" disabled={avisLoading} className={styles.btnEnvoyer}>
              {avisLoading ? 'Envoi...' : 'Envoyez mon avis'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;



























// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { jwtDecode } from 'jwt-decode'; // Assurez-vous que c'est installé : npm install jwt-decode
// import styles from './HotelDetail.module.css';

// const HotelDetail = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [hotel, setHotel] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [nouvelAvis, setNouvelAvis] = useState({ note: 4, commentaire: '' });
//   const [avisLoading, setAvisLoading] = useState(false);
//   const [carouselIndexes, setCarouselIndexes] = useState({});
//   // Filtres pour les chambres (remplace les anciens filtres de recherche hôtel)
//   const [roomFilters, setRoomFilters] = useState({
//     prixMax: 9999,
//     onlyAvailable: false
//   });

//   // Fonction pour gérer le clic sur "Réservez" avec vérification auth (debug renforcé)
//   const handleReserveClick = (hotelId, chambreId) => {
//     console.log('=== DEBUG Réservation Cliqué ==='); // ← Log 1 : Début
//     const token = localStorage.getItem('token');
//     console.log('Token présent ?', !!token); // ← Log 2 : Token existe ?

//     if (!token) {
//       console.log('Pas de token → Alerte et redirect'); // ← Debug
//       alert("Vous devez être connecté en tant que client pour réserver une chambre.");
//       navigate('/login');
//       return;
//     }

//     // Décodage du token pour vérifier le rôle
//     try {
//       const decoded = jwtDecode(token);
//       console.log('Token décodé complet:', decoded); // ← Log 3 : Contenu full du token
//       console.log('Rôle brut du token:', decoded.role); // ← Log 4 : Rôle exact

//       // Vérification flexible : insensible à la casse, gère string ou array
//       let userRoles = [];
//       if (Array.isArray(decoded.role)) {
//         userRoles = decoded.role.map(r => r.toLowerCase());
//       } else if (typeof decoded.role === 'string') {
//         userRoles = [decoded.role.toLowerCase()];
//       } else {
//         console.log('Rôle non string/array → Fallback erreur'); // ← Debug
//         userRoles = [];
//       }
//       console.log('Rôles normalisés (lowercase):', userRoles); // ← Log 5 : Après lowercase

//       const isClient = userRoles.includes('client');
//       console.log('Est client ?', isClient); // ← Log 6 : Résultat final

//       if (!isClient) {
//         console.log('Pas client → Alerte et redirect'); // ← Debug
//         alert("Seuls les clients connectés peuvent réserver.");
//         navigate('/login');
//         return;
//       }

//       console.log('Tout OK → Redirection réservation'); // ← Log 7 : Succès
//     } catch (err) {
//       console.error('Erreur décodage token:', err); // ← Log erreur
//       alert("Session invalide. Veuillez vous reconnecter.");
//       localStorage.removeItem('token');
//       navigate('/login');
//       return;
//     }

//     // Si tout est OK, redirige vers la page de réservation
//     navigate(`/reservation/${hotelId}/${chambreId}`);
//     console.log('=== FIN DEBUG ==='); // ← Log fin
//   };

//   // Mapping type chambre
//   const mapChambreType = (type) => {
//     const t = type.toLowerCase();
//     if (t.includes("suite")) return "Suite de luxe";
//     if (t.includes("double")) return "Chambre double";
//     if (t.includes("simple")) return "Chambre simple";
//     return type;
//   };

//   // Badge Disponibilité – Modifié pour modules
//   const getDisponibiliteClass = (etat) => {
//     if (!etat) return "";
//     return etat.toLowerCase() === "libre"
//       ? styles.badgeDisponible
//       : styles.badgeOccupee;
//   };

//   useEffect(() => {
//     const fetchHotel = async () => {
//       try {
//         const response = await axios.get(`http://localhost:3000/api/hotels/${id}`);
//         const hotelData = response.data;
//         if (!hotelData.validated) {
//           setError('Hôtel en attente de validation.');
//           return;
//         }
//         let avgNote = null;
//         if (hotelData.avis?.length > 0) {
//           avgNote =
//             hotelData.avis.reduce((sum, avi) => sum + avi.note, 0) /
//             hotelData.avis.length;
//         }
//         setHotel({ ...hotelData, avgNote });
//         // Calculer les pages pour les chambres (3 par page) après filtrage initial
//         updatePagination(hotelData.chambres || []);
//       } catch (err) {
//         setError(err.response?.data?.message || 'Erreur chargement.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchHotel();
//   }, [id]);

//   // Fonction pour mettre à jour la pagination basée sur les chambres filtrées
//   const updatePagination = (chambres) => {
//     const filteredChambres = chambres.filter(c =>
//       (!roomFilters.onlyAvailable || c.etat?.toLowerCase() === 'libre') &&
//       c.prix_nuit <= roomFilters.prixMax
//     );
//     setTotalPages(Math.ceil(filteredChambres.length / 3));
//     setCurrentPage(1); // Reset à la première page lors du filtrage
//   };

//   // useEffect pour recalculer la pagination quand les filtres changent
//   useEffect(() => {
//     if (hotel?.chambres) {
//       updatePagination(hotel.chambres);
//     }
//   }, [roomFilters, hotel]);

//   const handleNouvelAvisSubmit = async (e) => {
//     e.preventDefault();
//     if (!localStorage.getItem('token')) {
//       alert("Vous devez être connecté pour laisser un avis.");
//       navigate('/login');
//       return;
//     }
//     setAvisLoading(true);
//     try {
//       await axios.post(
//         `http://localhost:3000/api/hotels/${id}/avis`,
//         {
//           note: nouvelAvis.note,
//           commentaire: nouvelAvis.commentaire
//         },
//         { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
//       );
//       setNouvelAvis({ note: 4, commentaire: '' });
//       alert('Avis envoyé !');
//       window.location.reload();
//     } catch (err) {
//       console.error('Erreur avis :', err);
//     }
//     setAvisLoading(false);
//   };

//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//     }
//   };

//   const getAllImages = (photos) => {
//     return photos.flatMap(photo => photo.images || []);
//   };

//   const updateCarouselIndex = (direction, chambreId = null) => {
//     const key = chambreId || id;
//     setCarouselIndexes(prev => {
//       const currentIndex = prev[key] || 0;
//       const allImages = getAllImages(
//         (chambreId ? hotel.chambres.find(c => c._id === chambreId)?.photos : hotel.photos) || []
//       );
//       let newIndex = currentIndex;
//       if (direction === 'next') newIndex = (currentIndex + 1) % allImages.length;
//       else newIndex = (currentIndex - 1 + allImages.length) % allImages.length;
//       return { ...prev, [key]: newIndex };
//     });
//   };

//   const handleInputChange = (e) => {
//     const value = e.target.type === 'checkbox'
//       ? e.target.checked
//       : (e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value);
//     setRoomFilters({ ...roomFilters, [e.target.name]: value });
//   };

//   const handleFilterSubmit = (e) => {
//     e.preventDefault();
//     // Les filtres s'appliquent automatiquement via useEffect, pas de navigation
//   };

//   if (loading) return <div className={styles.loading}>Chargement...</div>;
//   if (error || !hotel) return <div className={styles.error}>{error}</div>;

//   const allImages = getAllImages(hotel.photos || []);
//   const currentIndex = carouselIndexes[id] || 0;

//   // Filtrer les chambres (case insensitive pour etat)
//   const filteredChambres = hotel.chambres?.filter(c =>
//     (!roomFilters.onlyAvailable || c.etat?.toLowerCase() === 'libre') &&
//     c.prix_nuit <= roomFilters.prixMax
//   ) || [];

//   // Afficher 3 chambres par page
//   const startIndex = (currentPage - 1) * 3;
//   const displayedChambres = filteredChambres.slice(startIndex, startIndex + 3);

//   return (
//     <div className={styles.homeContainer}>
//       {/* HERO */}
//       <section className={styles.hero}>
//         <h1>Trouvez et Réservez Votre Séjour Parfait</h1>
//       </section>
//       {/* BARRE DE FILTRAGE POUR CHAMBRES */}
//       <div className={styles.searchBoxWrapper}>
//         <div className={styles.searchBox}>
//           <h2>Filtrer les chambres</h2>
//           <form className={styles.searchForm} onSubmit={handleFilterSubmit}>
//             <div className={`${styles.inputGroup} ${styles.inputPrixGroup}`}>
//               <label htmlFor="prixMax">Prix Max (€)</label>
//               <input
//                 type="number"
//                 id="prixMax"
//                 name="prixMax"
//                 value={roomFilters.prixMax}
//                 onChange={handleInputChange}
//               />
//             </div>
//             <div className={`${styles.inputGroup} ${styles.inputCheckboxGroup}`}>
//               <label htmlFor="onlyAvailable">
//                 <input
//                   type="checkbox"
//                   id="onlyAvailable"
//                   name="onlyAvailable"
//                   checked={roomFilters.onlyAvailable}
//                   onChange={handleInputChange}
//                 />
//                 Seulement les chambres disponibles
//               </label>
//             </div>
//             <button className={styles.btnRechercher}>Filtrer</button>
//           </form>
//         </div>
//       </div>
//       {/* DÉTAILS HOTEL */}
//       <div className={styles.dashboardContainer}>
//         <h2>Hôtel</h2>
//         <div className={styles.section}>
//           {allImages.length > 0 && (
//             <div className={styles.carouselContainer}>
//               <div className={styles.carousel}>
//                 <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => updateCarouselIndex('prev')}>‹</button>
//                 <div className={styles.carouselImages} style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
//                   {allImages.map((img, i) => (
//                     <img
//                       key={i}
//                       src={img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url}`}
//                       className={styles.carouselImage}
//                       alt=""
//                     />
//                   ))}
//                 </div>
//                 <button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => updateCarouselIndex('next')}>›</button>
//               </div>
//               {allImages.length > 1 && (
//                 <div className={styles.carouselDots}>
//                   {allImages.map((_, i) => (
//                     <span
//                       key={i}
//                       className={`${styles.dot} ${i === currentIndex ? styles.active : ''}`}
//                       onClick={() => setCarouselIndexes(prev => ({ ...prev, [id]: i }))}
//                     ></span>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//           <div className={styles.titleRow}>
//             <div className={styles.stars}>
//               {Array.from({ length: 5 }).map((_, i) => (
//                 <span key={i} className={`${styles.star} ${i < hotel.etoiles ? styles.filled : styles.empty}`}>{'⭐'}</span>
//               ))}
//             </div>
//             <h2 className={styles.hotelName}>{hotel.nom}</h2>
//           </div>
//           <p className={styles.description}>{hotel.description}</p>
//           <p className={styles.address}>{hotel.adresse}</p>
//           <p className={styles.price}>
//             <span className={styles.pricePrefix}>À partir de </span>
//             <span className={styles.priceValue}>{hotel.prix}€ / nuit</span>
//           </p>
//         </div>
//         {/* CHAMBRES */}
//         <div className={`${styles.section} ${styles.chambresSection}`}>
//           <div className={styles.list}>
//             {displayedChambres.map(chambre => {
//               const imgs = getAllImages(chambre.photos || []);
//               const idx = carouselIndexes[chambre._id] || 0;
//               return (
//                 <div key={chambre._id} className={`${styles.item} ${styles.chambreItem}`}>
//                   <div className={styles.chamberContent}>
//                     <div className={styles.chamberLeft}>
//                       {imgs.length > 0 && (
//                         <div className={`${styles.carouselContainer} ${styles.chambreCarousel}`}>
//                           <div className={styles.carousel}>
//                             <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => updateCarouselIndex('prev', chambre._id)}>‹</button>
//                             <div className={styles.carouselImages} style={{ transform: `translateX(-${idx * 100}%)` }}>
//                               {imgs.map((img, i) => (
//                                 <img
//                                   key={i}
//                                   src={img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url}`}
//                                   className={styles.carouselImage}
//                                   alt=""
//                                 />
//                               ))}
//                             </div>
//                             <button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => updateCarouselIndex('next', chambre._id)}>›</button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                     <div className={styles.chamberRight}>
//                       <h4>{mapChambreType(chambre.type_chambre)}</h4>
//                       <p>{chambre.description}</p>
//                       <p>
//                         <span className={styles.label}>Prix :</span>{' '}
//                         <span className={styles.priceValue}>{chambre.prix_nuit}€</span>
//                       </p>
//                       {/* DISPONIBILITÉ BADGE */}
//                       <p>
//                         <span className={styles.label}>Disponibilité :</span>{' '}
//                         <span className={getDisponibiliteClass(chambre.etat)}>
//                           {chambre.etat}
//                         </span>
//                       </p>
//                       <button
//                         className={styles.reserveBtn}
//                         onClick={() => handleReserveClick(id, chambre._id)}
//                       >
//                         Réservez
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           {/* PAGINATION POUR LES CHAMBRES - Affichée seulement si totalPages > 1 ou si 0 chambres */}
//           {filteredChambres.length === 0 ? (
//             <p className={styles.noRoomsMessage}>Aucune chambre ne correspond aux critères de filtrage.</p>
//           ) : totalPages > 1 ? (
//             <div className={`${styles.pagination} ${styles.chambrePagination}`}>
//               <button
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//                 className={`${styles.paginationBtn} ${styles.prevBtn}`}
//               >
//                 Précédent
//               </button>
//               {Array.from({ length: totalPages }, (_, index) => (
//                 <button
//                   key={index + 1}
//                   onClick={() => handlePageChange(index + 1)}
//                   className={`${styles.pageNumberBtn} ${currentPage === index + 1 ? styles.active : ""}`}
//                 >
//                   {index + 1}
//                 </button>
//               ))}
//               <button
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//                 className={`${styles.paginationBtn} ${styles.nextBtn}`}
//               >
//                 Suivant
//               </button>
//             </div>
//           ) : null}
//         </div>
//         {/* AVIS – VERSION ORIGINALE (RESTAURÉE) */}
//         <div className={`${styles.section} ${styles.avisSection}`}>
//           <h2 className={styles.avisTitle}>
//             Avis des clients ({hotel.avis?.length || 0})
//           </h2>
//           <div className={styles.avisList}>
//             {hotel.avis?.map((avi) => (
//               <div key={avi._id} className={styles.avisItem}>
//                 <div className={styles.avisStars}>{avi.note}/10</div>
//                 <p>{avi.commentaire}</p>
//               </div>
//             ))}
//           </div>
//           <form onSubmit={handleNouvelAvisSubmit} className={styles.avisForm}>
//             <div className={styles.noteGroup}>
//               <div className={styles.noteHeader}>
//                 <label className={styles.noteLabel}>Votre note</label>
//                 <span className={styles.noteValue}>{nouvelAvis.note}/5</span>
//               </div>
//               <div className={styles.sliderContainer}>
//                 <input
//                   type="range"
//                   min="0"
//                   max="10"
//                   step="1"
//                   value={nouvelAvis.note}
//                   onChange={(e) =>
//                     setNouvelAvis({
//                       ...nouvelAvis,
//                       note: parseInt(e.target.value),
//                     })
//                   }
//                   className={styles.noteSlider}
//                 />
//               </div>
//             </div>
//             <textarea
//               placeholder="Laissez votre avis ici..."
//               value={nouvelAvis.commentaire}
//               onChange={(e) =>
//                 setNouvelAvis({ ...nouvelAvis, commentaire: e.target.value })
//               }
//               className={styles.avisTextarea}
//               required
//             />
//             <button type="submit" disabled={avisLoading} className={styles.btnEnvoyer}>
//               Envoyez mon avis
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HotelDetail;





























