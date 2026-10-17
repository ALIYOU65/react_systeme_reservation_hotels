import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HotelList.css';

// Composant HotelCard INLINE
const HotelCard = ({ id, imageSrc, title, location, price, stars, avgNote, avisCount }) => {
  const navigate = useNavigate();
  const handleDetails = () => navigate(`/hotel/${id}`);

  return (
    <div className="hotel-card">
      <img src={imageSrc || "https://via.placeholder.com/300x180?text=Hôtel"} alt={title} />
      <div className="hotel-info">
        <h3>{title}</h3>
        <h4 className="price-location-tag">
          À partir de <span className="price-tag">{price ? `${price}€` : 'N/A'} / nuit</span>
        </h4>
        <h4 className="location-tag">{location || 'Ville Inconnue'}</h4>
        <div className="stars_btn-details">
          <div className="stars" data-stars={stars || 0}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <span key={idx} className={idx < (stars || 0) ? "star-filled" : "star-empty"}>
                ★
              </span>
            ))}
          </div>
          <div className="notes-info">
            <span className="avg-note">{avgNote ? avgNote.toFixed(1) : 'N/A'}</span>
            <span className="avis-count">({avisCount || 0} avis)</span>
          </div>
          <button className="btn-details" onClick={handleDetails}>
            Voir Détails
          </button>
        </div>
      </div>
    </div>
  );
};

const HotelList = () => {
  const navigate = useNavigate();
  const [allHotels, setAllHotels] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Date du jour pour contrainte `min`
  const todayStr = new Date().toISOString().split("T")[0];

  // Dates par défaut (Demain & Après-demain)
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const dayAfterTomorrowDate = new Date();
  dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2);

  const tomorrow = tomorrowDate.toISOString().split("T")[0];
  const dayAfterTomorrow = dayAfterTomorrowDate.toISOString().split("T")[0];

  // Filtres de recherche identiques à la page d'accueil
  const [searchFilters, setSearchFilters] = useState({
    ville: '',
    dateDebut: tomorrow,
    dateFin: dayAfterTomorrow,
    prixMax: 3000,
  });

  const hotelsPerPage = 6;

  const mockHotels = [
    { _id: "1", nom: "Le Grand Paris", adresse: "Paris", prix: 550, etoiles: 5, avgNote: 4.9, avis: [{note: 5}], photos: [{images: [{url: '/img1.jpg'}]}], validated: true },
    { _id: "2", nom: "Hôtel Le Zénith", adresse: "New-york", prix: 480, etoiles: 5, avgNote: 4.8, avis: [{note: 5}], photos: [{images: [{url: '/img2.jpg'}]}], validated: true },
    { _id: "3", nom: "Résidence La Marina", adresse: "Italie", prix: 700, etoiles: 5, avgNote: 4.6, avis: [{note: 5}], photos: [{images: [{url: '/img3.jpg'}]}], validated: true },
    { _id: "4", nom: "Hôtel Éco Paris", adresse: "Paris", prix: 250, etoiles: 4, avgNote: 4.2, avis: [{note: 4}], photos: [{images: [{url: '/img4.jpg'}]}], validated: true },
    { _id: "5", nom: "Luxury Lyon", adresse: "Lyon", prix: 600, etoiles: 5, avgNote: 4.7, avis: [{note: 5}], photos: [{images: [{url: '/img5.jpg'}]}], validated: true },
    { _id: "6", nom: "Beach Marseille", adresse: "Marseille", prix: 300, etoiles: 4, avgNote: 4.5, avis: [{note: 4}], photos: [{images: [{url: '/img6.jpg'}]}], validated: true },
    { _id: "7", nom: "Monaco Palace", adresse: "Monaco", prix: 700, etoiles: 5, avgNote: 4.9, avis: [{note: 5}], photos: [{images: [{url: '/img7.jpg'}]}], validated: true },
  ];

  const fetchAllHotels = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ validated: true });
      const response = await axios.get(`http://localhost:3000/api/hotels?${params}`);
      let data = Array.isArray(response.data) ? response.data : (response.data.hotels || []);
      data = data.filter(hotel => hotel.validated === true || hotel.validated === 'true');
      setAllHotels(data);
    } catch (err) {
      console.error('Erreur fetch hôtels :', err);
      setError('Erreur chargement des hôtels. Utilisation des données simulées.');
      setAllHotels(mockHotels);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    let filtered = [...allHotels];
    const { ville, prixMax } = searchFilters;
    const maxPrix = prixMax ? parseInt(prixMax) : Infinity;
    const villeLower = (ville || '').toLowerCase().trim();

    filtered = filtered.filter(hotel => parseFloat(hotel.prix || 0) <= maxPrix);

    if (villeLower) {
      filtered = filtered.filter(hotel => 
        (hotel.adresse || '').toLowerCase().includes(villeLower)
      );
    }

    filtered.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));

    const total = filtered.length;
    const totalPagesCalc = Math.ceil(total / hotelsPerPage);
    setTotalPages(totalPagesCalc || 1);

    const startIndex = (currentPage - 1) * hotelsPerPage;
    const endIndex = startIndex + hotelsPerPage;
    const pagedHotels = filtered.slice(startIndex, endIndex);
    setHotels(pagedHotels);
  };

  useEffect(() => {
    fetchAllHotels();
  }, []);

  useEffect(() => {
    if (allHotels.length > 0) {
      applyFiltersAndPagination();
    }
  }, [allHotels, searchFilters, currentPage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "prixMax") {
      const val = Number(value);
      if (val > 3000) {
        setSearchFilters({ ...searchFilters, prixMax: 3000 });
        setCurrentPage(1);
        return;
      }
    }

    setSearchFilters({ ...searchFilters, [name]: value });
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchFilters.dateDebut && searchFilters.dateFin && new Date(searchFilters.dateDebut) >= new Date(searchFilters.dateFin)) {
      alert("La date de fin doit être après la date de début !");
      return;
    }
    applyFiltersAndPagination();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) return <div className="loading">Chargement des hôtels...</div>;
  if (error) return <div className="error">{error} <button onClick={fetchAllHotels}>Réessayer</button></div>;

  return (
    <div className="home-container">
      {/* Hero */}
      <section className="hero">
        <h1>Trouvez et Réservez Votre Séjour Parfait</h1>
      </section>

      {/* Barre de Recherche identique à Accueil */}
      <div className="search-box-wrapper">
        <div className="search-box">
          <h2>Rechercher un Hôtel</h2>
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="input-group input-ville-group">
              <label htmlFor="ville">Ville</label>
              <input
                type="text"
                id="ville"
                name="ville"
                placeholder="Ex: Paris, Monaco..."
                value={searchFilters.ville}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-group input-date-group">
              <label htmlFor="dateDebut">Dates</label>
              <div className="date-inputs">
                <input
                  type="date"
                  id="dateDebut"
                  name="dateDebut"
                  min={todayStr}
                  value={searchFilters.dateDebut}
                  onChange={handleInputChange}
                />
                <input
                  type="date"
                  id="dateFin"
                  name="dateFin"
                  min={searchFilters.dateDebut || todayStr}
                  value={searchFilters.dateFin}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="input-group input-prix-group">
              <label htmlFor="prixMax">Prix Max (€)</label>
              <input
                type="number"
                id="prixMax"
                name="prixMax"
                min="0"
                max="3000"
                value={searchFilters.prixMax}
                onChange={handleInputChange}
              />
            </div>

            <button type="submit" className="btn-rechercher">Rechercher</button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      {/* Section Hôtels */}
      <section className="hotels-section">
        <h2>Hôtels</h2>
        {hotels.length > 0 ? (
          <div className="hotel-cards">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel._id}
                id={hotel._id}
                imageSrc={getAllImages(hotel.photos || [])[0]?.url || "https://via.placeholder.com/300x180?text=Hôtel"}
                title={hotel.nom || hotel.name || 'Hôtel Inconnu'}
                location={hotel.adresse || hotel.location || 'Ville Inconnue'}
                price={hotel.prix || hotel.price || 0}
                stars={hotel.etoiles || hotel.stars || 0}
                avgNote={hotel.avgNote || 0}
                avisCount={hotel.avis?.length || 0}
              />
            ))}
          </div>
        ) : (
          <p>Aucun hôtel trouvé. Ajustez les filtres ou ajoutez des hôtels en admin.</p>
        )}

        {/* Pagination */}
        <div className="pagination hotel-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn prev-btn"
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`page-number-btn ${currentPage === index + 1 ? "active" : ""}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn next-btn"
          >
            Suivant
          </button>
        </div>
      </section>
    </div>
  );
};

const getAllImages = (photos) => {
  return photos.flatMap(photo => photo.images || []);
};

export default HotelList;









