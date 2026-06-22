import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../utils/auth";
import "./Accueil.css";

/* ---------------------------------------------------
   COMPOSANT : CARD HÔTEL
--------------------------------------------------- */
const HotelCard = ({ imageSrc, title, location, description, price, stars, id, avgNote, avisCount }) => {
  const navigate = useNavigate();
  const handleDetails = () => navigate(`/hotel/${id}`);

  return (
    <div className="hotel-card">
      <img
        src={imageSrc || "https://via.placeholder.com/300x200?text=Hôtel+Image"}
        alt={title || "Hôtel"}
      />
      <div className="hotel-info">
        <h3>{title || "Nom Manquant"}</h3>
        <p>{description || "Description manquante"}</p>

        <h4 className="price-location-tag">
          À partir de <span className="price-tag">{price ? `${price}€` : "N/A"} / nuit</span>
        </h4>

        <h4 className="location-tag">{location || "Ville Inconnue"}</h4>

        <div className="stars_btn-details">
          <div className="stars" data-stars={stars || 0}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <span key={idx} className={idx < (stars || 0) ? "star-filled" : "star-empty"}>
                ★
              </span>
            ))}
          </div>

          <div className="notes-info">
            <span className="avg-note">{avgNote ? avgNote.toFixed(1) : "N/A"}</span>
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

/* ---------------------------------------------------
   PAGE ACCUEIL
--------------------------------------------------- */
const Accueil = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Dates par défaut
  const tomorrow = new Date("2025-11-27").toISOString().split("T")[0];
  const dayAfterTomorrow = new Date("2025-11-28").toISOString().split("T")[0];

  const [searchFilters, setSearchFilters] = useState({
    ville: "",
    dateDebut: tomorrow,
    dateFin: dayAfterTomorrow,
    prixMax: 800,
  });

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------------------------------------------
      MOCKS (7 hôtels)
  --------------------------------------------------- */
  const mockHotels = [
    { _id: "mock1", location: "Paris", title: "Le Grand Paris", description: "Hôtel luxueux.", price: 550, stars: 5, avgNote: 4.9, avisCount: 156 },
    { _id: "mock2", location: "New-york", title: "Hôtel Le Zénith", description: "Calme, proche centre.", price: 480, stars: 5, avgNote: 4.8, avisCount: 120 },
    { _id: "mock3", location: "Italie", title: "Résidence La Marina", description: "Moderne bord de mer.", price: 700, stars: 5, avgNote: 4.6, avisCount: 89 },
    { _id: "mock4", location: "Paris", title: "Hôtel Éco Paris", description: "Économique centre-ville.", price: 250, stars: 4, avgNote: 4.2, avisCount: 45 },
    { _id: "mock5", location: "Lyon", title: "Luxury Lyon", description: "Luxe à Lyon.", price: 600, stars: 5, avgNote: 4.7, avisCount: 200 },
    { _id: "mock6", location: "Marseille", title: "Beach Marseille", description: "Bord de mer.", price: 300, stars: 4, avgNote: 4.5, avisCount: 100 },
    { _id: "mock7", location: "Nice", title: "City Nice", description: "Urbain.", price: 400, stars: 4, avgNote: 4.3, avisCount: 80 },
  ];

  /* ---------------------------------------------------
     NOUVEAU : CALCULER AVGNOTE POUR CHAQUE HÔTEL
  --------------------------------------------------- */
  const computeAvgNote = async (hotelId) => {
    try {
      const res = await axios.get(`/api/hotels/${hotelId}/avis`);
      const validAvis = res.data.filter((a) => a.status === "approved");
      const avg =
        validAvis.length > 0
          ? validAvis.reduce((sum, a) => sum + a.note, 0) / validAvis.length
          : 0;

      return { avgNote: avg, avisCount: validAvis.length };
    } catch {
      return { avgNote: 0, avisCount: 0 };
    }
  };

  /* ---------------------------------------------------
     FETCH HOTELS + CALCUL DES NOTES
  --------------------------------------------------- */
  const fetchHotels = async (filters = {}, forceTop3 = false) => {
    setLoading(true);
    setError("");

    let data = [];

    try {
      const params = new URLSearchParams({
        validated: true,
        prixMax: filters.prixMax || 800,
        ville: filters.ville || "",
        dateDebut: filters.dateDebut || "",
        dateFin: filters.dateFin || "",
      }).toString();

      const response = await axios.get(`/api/hotels?${params}`);
      data = Array.isArray(response.data) ? response.data : response.data.hotels || [];
    } catch (e) {
      setError("API indisponible, utilisation des données simulées.");
      data = mockHotels;
    }

    // NORMALISATION
    const mapped = data.map((hotel) => ({
      ...hotel,
      id: hotel._id,
      title: hotel.nom || hotel.name || hotel.title,
      price: parseFloat(hotel.prix || hotel.price || 0),
      location: hotel.adresse || hotel.location || "Ville Inconnue",
      description: hotel.description || "Description manquante",
      imageSrc:
        hotel.photos?.[0]?.images?.[0]?.url
          ? hotel.photos[0].images[0].url.startsWith("http")
            ? hotel.photos[0].images[0].url
            : `http://localhost:3000${hotel.photos[0].images[0].url}`
          : "https://via.placeholder.com/300x200?text=Hôtel+Image",
    }));

    /* ---------------------------------------------------
        NOUVEAU : CALCUL DES NOTES POUR CHAQUE HOTEL
    --------------------------------------------------- */
    const hotelsWithNotes = await Promise.all(
      mapped.map(async (h) => {
        const { avgNote, avisCount } = await computeAvgNote(h.id);
        return { ...h, avgNote, avisCount };
      })
    );

    /* ---------------------------------------------------
        TOP 3 SUR L'ACCUEIL
    --------------------------------------------------- */
    const finalHotels =
      forceTop3
        ? hotelsWithNotes.sort((a, b) => b.avgNote - a.avgNote).slice(0, 3)
        : hotelsWithNotes;

    setHotels(finalHotels);
    setLoading(false);
  };

  /* ---------------------------------------------------
      AU CHARGEMENT → TOP 3
  --------------------------------------------------- */
  useEffect(() => {
    fetchHotels({}, true);
  }, []);

  /* ---------------------------------------------------
      FORM
  --------------------------------------------------- */
  const handleInputChange = (e) => {
    setSearchFilters({ ...searchFilters, [e.target.name]: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHotels(searchFilters);
  };

  if (loading) return <div className="loading">Chargement des hôtels...</div>;

  return (
    <main className="home-container">
      <section className="hero">
        <h1>Trouvez et Réservez Votre Séjour Parfait</h1>
      </section>

      <div className="search-box-wrapper">
        <div className="search-box">
          <h2>Votre Recherche</h2>

          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="input-group input-ville-group">
              <label>Ville</label>
              <input
                type="text"
                name="ville"
                placeholder="Ex: Paris, New-york..."
                value={searchFilters.ville}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-group input-date-group">
              <label>Dates</label>
              <div className="date-inputs">
                <input type="date" name="dateDebut" value={searchFilters.dateDebut} onChange={handleInputChange} />
                <input type="date" name="dateFin" value={searchFilters.dateFin} onChange={handleInputChange} />
              </div>
            </div>

            <div className="input-group input-prix-group">
              <label>Prix Max (€)</label>
              <input type="number" name="prixMax" value={searchFilters.prixMax} onChange={handleInputChange} />
            </div>

            <button type="submit" className="btn-rechercher">Rechercher</button>
          </form>

          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      <section className="hotels-section">
        <h2>Hôtels Recommandés</h2>

        {hotels.length > 0 ? (
          <div className="hotel-cards">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} {...hotel} />
            ))}
          </div>
        ) : (
          <p>Aucun hôtel trouvé.</p>
        )}
      </section>
    </main>
  );
};

export default Accueil;




















