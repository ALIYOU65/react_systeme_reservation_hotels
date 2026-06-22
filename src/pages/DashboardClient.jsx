import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import api from '../utils/axiosConfig';
import styles from './DashboardClient.module.css';

const DashboardClient = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const [searchFilters, setSearchFilters] = useState({
    ville: '',
    dateDebut: '',
    dateFin: '',
    prixMax: ''
  });
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const hotelsPerPage = 6;

  // Charger les hôtels une seule fois
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/hotels?validated=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data || [];

      // Normalisation EXACTEMENT comme dans Accueil.jsx
      const normalized = data.map(hotel => ({
        _id: hotel._id,
        id: hotel._id,
        nom: hotel.nom || hotel.name || hotel.title,
        title: hotel.nom || hotel.name || hotel.title,
        adresse: hotel.adresse || hotel.location || "Ville inconnue",
        location: hotel.adresse || hotel.location || "Ville inconnue",  // Clé identique à l'accueil
        prix: parseFloat(hotel.prix || hotel.price || 0),
        price: parseFloat(hotel.prix || hotel.price || 0),
        etoiles: hotel.etoiles || hotel.stars || 0,
        stars: hotel.etoiles || hotel.stars || 0,
        photos: hotel.photos || [],
        description: hotel.description || "Description manquante"
      }));

      setHotels(normalized);
      setFilteredHotels(normalized);
    } catch (err) {
      console.error(err);
      setError('API indisponible → données mock');
      // Mock identique à l'accueil
      const mock = [
        { _id: "1", location: "Paris", title: "Le Grand Paris", price: 550, stars: 5 },
        { _id: "2", location: "New-york", title: "Hôtel Le Zénith", price: 480, stars: 5 },
        { _id: "3", location: "Italie", title: "Résidence La Marina", price: 700, stars: 5 },
        { _id: "4", location: "Paris", title: "Hôtel Éco Paris", price: 250, stars: 4 },
        { _id: "5", location: "Lyon", title: "Luxury Lyon", price: 600, stars: 5 },
        { _id: "6", location: "Marseille", title: "Beach Marseille", price: 300, stars: 4 },
        { _id: "7", location: "Nice", title: "City Nice", price: 400, stars: 4 },
      ].map(h => ({ ...h, id: h._id, nom: h.title }));

      setHotels(mock);
      setFilteredHotels(mock);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchHotels();
  }, [token]);

  // Filtrage IDENTIQUE à la page d'accueil
  useEffect(() => {
    let result = [...hotels];

    if (searchFilters.ville.trim()) {
      result = result.filter(h =>
        h.location.toLowerCase().includes(searchFilters.ville.toLowerCase())
      );
    }

    if (searchFilters.prixMax) {
      result = result.filter(h => h.price <= Number(searchFilters.prixMax));
    }

    // Dates : on peut ajouter plus tard la vraie vérification de disponibilité
    if (searchFilters.dateDebut && searchFilters.dateFin) {
      // Pour l’instant on ne filtre pas vraiment sur les dates (comme dans l'accueil)
    }

    setFilteredHotels(result);
    setCurrentPage(1);
  }, [searchFilters, hotels]);

  const handleSearchChange = (e) => {
    setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
  };

  // Pagination
  const totalPages = Math.ceil(filteredHotels.length / hotelsPerPage);
  const displayedHotels = filteredHotels.slice(
    (currentPage - 1) * hotelsPerPage,
    currentPage * hotelsPerPage
  );

  if (!user || user.role !== 'CLIENT') return <div>Accès refusé</div>;

  return (
    <div className={styles.dashboardClientContainer}>
      <h1>Recherche d'hôtels</h1>

      <div className={styles.navLinks}>
        <Link to="/mes-reservations" className={styles.navLink}>Mes Réservations</Link>
        <Link to="/mes-factures" className={styles.navLink}>Mes Factures</Link>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className={styles.searchForm}>
        <input name="ville" placeholder="Ville (ex: Paris)" value={searchFilters.ville} onChange={handleSearchChange} />
        <input type="date" name="dateDebut" value={searchFilters.dateDebut} onChange={handleSearchChange} />
        <input type="date" name="dateFin" value={searchFilters.dateFin} onChange={handleSearchChange} />
        <input type="number" name="prixMax" placeholder="Prix max (€)" value={searchFilters.prixMax} onChange={handleSearchChange} />
        <button type="button" onClick={() => setSearchFilters({ ville: '', dateDebut: '', dateFin: '', prixMax: '' })}>
          Rechercher
        </button>
      </form>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? <div>Chargement...</div> : (
        <>
          <div className={styles.hotelsGrid}>
            {displayedHotels.map(hotel => (
              <div key={hotel._id} className={styles.hotelCard}>
                <Link to={`/hotel/${hotel._id}`} className={styles.hotelLink}>
                  <img
                    src={hotel.photos?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Hôtel'}
                    alt={hotel.title}
                    className={styles.hotelImg}
                  />
                  <h3>{hotel.title || hotel.nom}</h3>
                  <p>{hotel.location}</p>
                  <div className={styles.stars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < hotel.stars ? styles.filled : styles.empty}>★</span>
                    ))}
                  </div>
                  <p className={styles.price}>À partir de {hotel.price}€ / nuit</p>
                  <button className={styles.viewDetailsBtn}>Voir Détails</button>
                </Link>
              </div>
            ))}
          </div>

          {filteredHotels.length > hotelsPerPage && (
            <div className={styles.paginationWrapper}>
              <div className={styles.paginationContainer}>
                <button className={styles.paginationBtn} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  Précédent
                </button>
                <span className={styles.pageInfo}>Page {currentPage} sur {totalPages}</span>
                <button className={styles.paginationBtn} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardClient;





















// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../utils/auth';
// import api from '../utils/axiosConfig';
// import styles from './DashboardClient.module.css';  // ← Changé ici
// const DashboardClient = () => {
//   const { user } = useAuth();
//   const token = localStorage.getItem('token');
//   const [searchFilters, setSearchFilters] = useState({ ville: '', dateDebut: '', dateFin: '', prixMax: '' });
//   const [hotels, setHotels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   // Fetch hôtels validés dynamiquement (seulement published)
//   const fetchHotels = async (filters = {}) => {
//     setLoading(true);
//     setError('');
//     try {
//       const params = new URLSearchParams({
//         ...filters,
//         validated: true // Filtre seulement hôtels validés (published)
//       });
//       const res = await api.get(`/hotels?${params}`, { headers: { Authorization: `Bearer ${token}` } });
//       const data = res.data || [];
//       setHotels(data);
//     } catch (err) {
//       console.error('Erreur fetch hôtels validés:', err);
//       setError('Erreur recherche: ' + (err.response?.data?.message || err.message));
//       // Fallback temporaire : hôtels validés simulés avec photos dynamiques (remplace par backend)
//       setHotels([
//         {
//           _id: '1',
//           nom: 'Le Grand Paris',
//           adresse: 'Paris',
//           description: 'Hôtel luxueux validé.',
//           prix: 550,
//           etoiles: 5,
//           photos: [{ images: [{ url: 'http://localhost:3000/api/photos/valid1' }] }] // URL backend dynamique
//         },
//         {
//           _id: '2',
//           nom: 'Hôtel Le Zénith',
//           adresse: 'New-York',
//           description: 'Établissement calme validé.',
//           prix: 480,
//           etoiles: 5,
//           photos: [{ images: [{ url: 'http://localhost:3000/api/photos/valid2' }] }] // Dynamique
//         }
//       ]);
//     }
//     setLoading(false);
//   };
//   useEffect(() => {
//     if (!token) return;
//     fetchHotels(); // Charge hôtels validés par défaut
//   }, [token]);
//   const handleSearchChange = (e) => {
//     setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
//   };
//   const handleSearch = async (e) => {
//     e.preventDefault();
//     fetchHotels(searchFilters); // Refetch avec filtres + validated=true
//   };
//   if (!user || user.role !== 'CLIENT') return <div>Accès refusé</div>;
//   return (
//     <div className={styles.dashboardClientContainer}>
//       <h1>Recherche Hôtels</h1>
      
//       {/* ← AJOUT ICI : Section navigation pour liens client */}
//       <div className={styles.navLinks}>
//         <Link to="/mes-reservations" className={styles.navLink}>Mes Réservations</Link>
//         <Link to="/mes-factures" className={styles.navLink}>Mes Factures</Link>
//         {/* Ajoutez d'autres liens si besoin, ex. : <Link to="/profil">Profil</Link> */}
//       </div>
      
//       <form onSubmit={handleSearch} className={styles.searchForm}>
//         <input name="ville" placeholder="Ville" value={searchFilters.ville} onChange={handleSearchChange} />
//         <input type="date" name="dateDebut" value={searchFilters.dateDebut} onChange={handleSearchChange} />
//         <input type="date" name="dateFin" value={searchFilters.dateFin} onChange={handleSearchChange} />
//         <input type="number" name="prixMax" placeholder="Prix max (€)" value={searchFilters.prixMax} onChange={handleSearchChange} />
//         <button type="submit">Rechercher</button>
//       </form>
//       {error && <div className={styles.error}>{error}</div>}
//       {loading ? <div>Chargement hôtels validés...</div> : (
//         <div className={styles.hotelsGrid}>
//           {hotels.map(hotel => (
//             <div key={hotel._id} className={styles.hotelCard}>
//               <Link to={`/hotel/${hotel._id}`} className={styles.hotelLink}>
//                 <img
//                   src={hotel.photos?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Hôtel'}
//                   alt={hotel.nom}
//                   className={styles.hotelImg}
//                 />
//                 <h3>{hotel.nom}</h3>
//                 <p>{hotel.adresse}</p>
//                 <div className={styles.stars}>
//                   {Array.from({ length: 5 }).map((_, i) => (
//                     <span key={i} className={`${styles.star} ${i < hotel.etoiles ? styles.filled : styles.empty}`}>⭐</span>
//                   ))}
//                 </div>
//                 <p className={styles.price}>À partir de {hotel.prix}€</p>
//                 <button className={styles.viewDetailsBtn}>Voir Détails</button> {/* ← Bouton pour cliquer et aller aux détails */}
//               </Link>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };
// export default DashboardClient;





















// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../utils/auth';
// import api from '../utils/axiosConfig';
// import styles from './DashboardClient.module.css';  // ← Changé ici

// const DashboardClient = () => {
//   const { user } = useAuth();
//   const token = localStorage.getItem('token');
//   const [searchFilters, setSearchFilters] = useState({ ville: '', dateDebut: '', dateFin: '', prixMax: '' });
//   const [hotels, setHotels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Fetch hôtels validés dynamiquement (seulement published)
//   const fetchHotels = async (filters = {}) => {
//     setLoading(true);
//     setError('');
//     try {
//       const params = new URLSearchParams({
//         ...filters,
//         validated: true // Filtre seulement hôtels validés (published)
//       });
//       const res = await api.get(`/hotels?${params}`, { headers: { Authorization: `Bearer ${token}` } });
//       const data = res.data || [];
//       setHotels(data);
//     } catch (err) {
//       console.error('Erreur fetch hôtels validés:', err);
//       setError('Erreur recherche: ' + (err.response?.data?.message || err.message));
//       // Fallback temporaire : hôtels validés simulés avec photos dynamiques (remplace par backend)
//       setHotels([
//         {
//           _id: '1',
//           nom: 'Le Grand Paris',
//           adresse: 'Paris',
//           description: 'Hôtel luxueux validé.',
//           prix: 550,
//           etoiles: 5,
//           photos: [{ images: [{ url: 'http://localhost:3000/api/photos/valid1' }] }] // URL backend dynamique
//         },
//         {
//           _id: '2',
//           nom: 'Hôtel Le Zénith',
//           adresse: 'New-York',
//           description: 'Établissement calme validé.',
//           prix: 480,
//           etoiles: 5,
//           photos: [{ images: [{ url: 'http://localhost:3000/api/photos/valid2' }] }] // Dynamique
//         }
//       ]);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     if (!token) return;
//     fetchHotels(); // Charge hôtels validés par défaut
//   }, [token]);

//   const handleSearchChange = (e) => {
//     setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     fetchHotels(searchFilters); // Refetch avec filtres + validated=true
//   };

//   if (!user || user.role !== 'CLIENT') return <div>Accès refusé</div>;

//   return (
//     <div className={styles.dashboardClientContainer}>
//       <h1>Recherche Hôtels</h1>
//       <form onSubmit={handleSearch} className={styles.searchForm}>
//         <input name="ville" placeholder="Ville" value={searchFilters.ville} onChange={handleSearchChange} />
//         <input type="date" name="dateDebut" value={searchFilters.dateDebut} onChange={handleSearchChange} />
//         <input type="date" name="dateFin" value={searchFilters.dateFin} onChange={handleSearchChange} />
//         <input type="number" name="prixMax" placeholder="Prix max (€)" value={searchFilters.prixMax} onChange={handleSearchChange} />
//         <button type="submit">Rechercher</button>
//       </form>
//       {error && <div className={styles.error}>{error}</div>}
//       {loading ? <div>Chargement hôtels validés...</div> : (
//         <div className={styles.hotelsGrid}>
//           {hotels.map(hotel => (
//             <div key={hotel._id} className={styles.hotelCard}>
//               <Link to={`/hotel/${hotel._id}`} className={styles.hotelLink}>
//                 <img
//                   src={hotel.photos?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Hôtel'}
//                   alt={hotel.nom}
//                   className={styles.hotelImg}
//                 />
//                 <h3>{hotel.nom}</h3>
//                 <p>{hotel.adresse}</p>
//                 <div className={styles.stars}>
//                   {Array.from({ length: 5 }).map((_, i) => (
//                     <span key={i} className={`${styles.star} ${i < hotel.etoiles ? styles.filled : styles.empty}`}>⭐</span>
//                   ))}
//                 </div>
//                 <p className={styles.price}>À partir de {hotel.prix}€</p>
//                 <button className={styles.viewDetailsBtn}>Voir Détails</button> {/* ← Bouton pour cliquer et aller aux détails */}
//               </Link>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default DashboardClient;

































// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../utils/auth';
// import api from '../utils/axiosConfig';
// import styles from './DashboardClient.module.css';  // ← Changé ici

// const DashboardClient = () => {
//   const { user } = useAuth();
//   const token = localStorage.getItem('token');
//   const [searchFilters, setSearchFilters] = useState({ ville: '', dateDebut: '', dateFin: '', prixMax: '' });
//   const [hotels, setHotels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Fetch hôtels validés dynamiquement (seulement published)
//   const fetchHotels = async (filters = {}) => {
//     setLoading(true);
//     setError('');
//     try {
//       const params = new URLSearchParams({
//         ...filters,
//         validated: true // Filtre seulement hôtels validés (published)
//       });
//       const res = await api.get(`/hotels?${params}`, { headers: { Authorization: `Bearer ${token}` } });
//       const data = res.data || [];
//       setHotels(data);
//     } catch (err) {
//       console.error('Erreur fetch hôtels validés:', err);
//       setError('Erreur recherche: ' + (err.response?.data?.message || err.message));
//       // Fallback temporaire : hôtels validés simulés avec photos dynamiques (remplace par backend)
//       setHotels([
//         {
//           _id: '1',
//           nom: 'Le Grand Paris',
//           adresse: 'Paris',
//           description: 'Hôtel luxueux validé.',
//           prix: 550,
//           etoiles: 5,
//           photos: [{ images: [{ url: 'http://localhost:3000/api/photos/valid1' }] }] // URL backend dynamique
//         },
//         {
//           _id: '2',
//           nom: 'Hôtel Le Zénith',
//           adresse: 'New-York',
//           description: 'Établissement calme validé.',
//           prix: 480,
//           etoiles: 5,
//           photos: [{ images: [{ url: 'http://localhost:3000/api/photos/valid2' }] }] // Dynamique
//         }
//       ]);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     if (!token) return;
//     fetchHotels(); // Charge hôtels validés par défaut
//   }, [token]);

//   const handleSearchChange = (e) => {
//     setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     fetchHotels(searchFilters); // Refetch avec filtres + validated=true
//   };

//   if (!user || user.role !== 'CLIENT') return <div>Accès refusé</div>;

//   return (
//     <div className={styles.dashboardClientContainer}>
//       <h1>Recherche Hôtels</h1>
//       <form onSubmit={handleSearch} className={styles.searchForm}>
//         <input name="ville" placeholder="Ville" value={searchFilters.ville} onChange={handleSearchChange} />
//         <input type="date" name="dateDebut" value={searchFilters.dateDebut} onChange={handleSearchChange} />
//         <input type="date" name="dateFin" value={searchFilters.dateFin} onChange={handleSearchChange} />
//         <input type="number" name="prixMax" placeholder="Prix max (€)" value={searchFilters.prixMax} onChange={handleSearchChange} />
//         <button type="submit">Rechercher</button>
//       </form>
//       {error && <div className={styles.error}>{error}</div>}
//       {loading ? <div>Chargement hôtels validés...</div> : (
//         <div className={styles.hotelsGrid}>
//           {hotels.map(hotel => (
//             <Link key={hotel._id} to={`/hotel/${hotel._id}`} className={styles.hotelCard}>
//               <img
//                 src={hotel.photos?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Hôtel'}
//                 alt={hotel.nom}
//                 className={styles.hotelImg}
//               />
//               <h3>{hotel.nom}</h3>
//               <p>{hotel.adresse}</p>
//               <div className={styles.stars}>
//                 {Array.from({ length: 5 }).map((_, i) => (
//                   <span key={i} className={`${styles.star} ${i < hotel.etoiles ? styles.filled : styles.empty}`}>⭐</span>
//                 ))}
//               </div>
//               <p className={styles.price}>À partir de {hotel.prix}€</p>
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default DashboardClient;




























// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../utils/auth';
// import api from '../utils/axiosConfig';
// import './DashboardClient.css';

// const DashboardClient = () => {
//   const { user } = useAuth();
//   const token = localStorage.getItem('token');
//   const [searchFilters, setSearchFilters] = useState({ ville: '', dateDebut: '', dateFin: '', prixMax: '' });
//   const [hotels, setHotels] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Fetch hôtels validés dynamiquement (seulement published)
//   const fetchHotels = async (filters = {}) => {
//     setLoading(true);
//     setError('');
//     try {
//       const params = new URLSearchParams({
//         ...filters,
//         validated: true // Filtre seulement hôtels validés (published)
//       });
//       const res = await api.get(`/hotels?${params}`, { headers: { Authorization: `Bearer ${token}` } });
//       const data = res.data || [];
//       setHotels(data);
//     } catch (err) {
//       console.error('Erreur fetch hôtels validés:', err);
//       setError('Erreur recherche: ' + (err.response?.data?.message || err.message));
//       // Fallback temporaire : hôtels validés simulés avec photos dynamiques (remplace par backend)
//       setHotels([
//         { 
//           _id: '1', 
//           nom: 'Le Grand Paris', 
//           adresse: 'Paris', 
//           description: 'Hôtel luxueux validé.', 
//           prix: 550, 
//           etoiles: 5, 
//           photos: [{ images: [{ url: 'http://localhost:3000/api/photos/valid1' }] }] // URL backend dynamique
//         },
//         { 
//           _id: '2', 
//           nom: 'Hôtel Le Zénith', 
//           adresse: 'New-York', 
//           description: 'Établissement calme validé.', 
//           prix: 480, 
//           etoiles: 5, 
//           photos: [{ images: [{ url: 'http://localhost:3000/api/photos/valid2' }] }] // Dynamique
//         }
//       ]);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     if (!token) return;
//     fetchHotels(); // Charge hôtels validés par défaut
//   }, [token]);

//   const handleSearchChange = (e) => {
//     setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
//   };

//   const handleSearch = async (e) => {
//     e.preventDefault();
//     fetchHotels(searchFilters); // Refetch avec filtres + validated=true
//   };

//   if (!user || user.role !== 'CLIENT') return <div>Accès refusé</div>;

//   return (
//     <div className="dashboard-client-container">
//       <h1>Recherche Hôtels</h1>
//       <form onSubmit={handleSearch} className="search-form">
//         <input name="ville" placeholder="Ville" value={searchFilters.ville} onChange={handleSearchChange} />
//         <input type="date" name="dateDebut" value={searchFilters.dateDebut} onChange={handleSearchChange} />
//         <input type="date" name="dateFin" value={searchFilters.dateFin} onChange={handleSearchChange} />
//         <input type="number" name="prixMax" placeholder="Prix max (€)" value={searchFilters.prixMax} onChange={handleSearchChange} />
//         <button type="submit">Rechercher</button>
//       </form>
//       {error && <div className="error">{error}</div>}
//       {loading ? <div>Chargement hôtels validés...</div> : (
//         <div className="hotels-grid">
//           {hotels.map(hotel => (
//             <Link key={hotel._id} to={`/hotel/${hotel._id}`} className="hotel-card">
//               <img 
//                 src={hotel.photos?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=Hôtel'} 
//                 alt={hotel.nom} 
//                 className="hotel-img" 
//               />
//               <h3>{hotel.nom}</h3>
//               <p>{hotel.adresse}</p>
//               <div className="stars">
//                 {Array.from({ length: 5 }).map((_, i) => (
//                   <span key={i} className={i < hotel.etoiles ? 'star filled' : 'star empty'}>⭐</span>
//                 ))}
//               </div>
//               <p className="price">À partir de {hotel.prix}€</p>
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default DashboardClient;