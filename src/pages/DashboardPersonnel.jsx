import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import api from '../utils/axiosConfig';
import styles from './DashboardPersonnel.module.css';  

const DashboardPersonnel = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [hotels, setHotels] = useState([]);
  const [chambres, setChambres] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [hotelForm, setHotelForm] = useState({ nom: '', adresse: '', description: '', prix: '', etoiles: 5 });
  const [chambreForm, setChambreForm] = useState({ type_chambre: 'Simple', capacite: 1, prix_nuit: '', etat: 'Libre', description: '' }); // Changé 'Disponible' en 'Libre'
  const [hotelEditingId, setHotelEditingId] = useState(null);
  const [chambreEditingId, setChambreEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hotelFiles, setHotelFiles] = useState([]);
  const [chambreFiles, setChambreFiles] = useState([]);
  const [hotelPhotoBlocks, setHotelPhotoBlocks] = useState([]);
  const [chambrePhotoBlocks, setChambrePhotoBlocks] = useState([]);
  const [selectedHotelPhotos, setSelectedHotelPhotos] = useState([]);
  const [selectedChambrePhotos, setSelectedChambrePhotos] = useState([]);
  const [carouselIndexes, setCarouselIndexes] = useState({});
  const [chambreCarouselIndexes, setChambreCarouselIndexes] = useState({});

  // Mapping pour afficher les labels descriptifs des types de chambres
  const roomTypeMap = {
    'Simple': 'Chambre simple',
    'Double': 'Chambre double',
    'Suite': 'Suite de luxe'
  };

  useEffect(() => {
    if (user?.role === 'PERSONNEL' && token) {
      fetchMyHotels();
      fetchMyChambres();
      fetchHotelPhotoBlocks();
      fetchChambrePhotoBlocks();
    } else if (!token) {
      setError('Token manquant – Reconnectez-vous.');
    }
  }, [user, token]);

const fetchHotelPhotoBlocks = async () => {
  if (!token) return;
  try {
    const res = await api.get('/photos/my', { headers: { Authorization: `Bearer ${token}` } });
    setHotelPhotoBlocks(res.data);
  } catch (err) {
    setError('Erreur chargement blocs photos hôtels: ' + (err.response?.data?.message || err.message));
  }
};

const fetchChambrePhotoBlocks = async () => {
  if (!token) return;
  try {
    const res = await api.get('/chambrephotos/my', { headers: { Authorization: `Bearer ${token}` } });
    setChambrePhotoBlocks(res.data);
  } catch (err) {
    setError('Erreur chargement blocs chambres: ' + (err.response?.data?.message || err.message));
  }
};

  const fetchMyHotels = async () => {
    if (!token) return;
    try {
      const res = await api.get('/hotels/my', { headers: { Authorization: `Bearer ${token}` } });
      setHotels(res.data);
    } catch (err) {
      setError('Erreur chargement hôtels');
    }
  };

  const fetchMyChambres = async () => {
    if (!token) return;
    try {
      const res = await api.get('/chambres/my', { headers: { Authorization: `Bearer ${token}` } });
      setChambres(res.data);
    } catch (err) {
      setError('Erreur chargement chambres: ' + (err.response?.data?.message || err.message));
    }
  };

  // HANDLE HOTEL SUBMIT
  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Token manquant – Reconnectez-vous.');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('nom', hotelForm.nom);
    formData.append('adresse', hotelForm.adresse);
    formData.append('description', hotelForm.description);
    formData.append('prix', hotelForm.prix);
    formData.append('etoiles', hotelForm.etoiles);
    formData.append('personnel', user._id);
    
    // ENVOI CORRECT DES PHOTOS
    const photoIds = selectedHotelPhotos.length > 0 ? selectedHotelPhotos : [];
    photoIds.forEach(id => formData.append('photos[]', id));
    // Upload fichiers images
    hotelFiles.forEach(file => formData.append('hotelFiles', file));
    try {
      if (hotelEditingId) {
        await api.put(`/hotels/${hotelEditingId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        alert('Hôtel mis à jour et re-soumis pour validation !');
      } else {
        await api.post('/hotels', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        alert('Hôtel soumis pour validation !');
      }
      // Reset formulaire
      setHotelForm({ nom: '', adresse: '', description: '', prix: '', etoiles: 5 });
      setHotelFiles([]);
      setSelectedHotelPhotos([]);
      setHotelEditingId(null);
      fetchMyHotels();
    } catch (err) {
      console.error('Erreur submit hôtel:', err.response?.status, err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  // HANDLE CHAMBRE SUBMIT
  const handleChambreSubmit = async (e) => {
    e.preventDefault();
    if (!token || !selectedHotelId) {
      setError('Sélectionnez un hôtel et vérifiez votre connexion.');
      return;
    }
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('type_chambre', chambreForm.type_chambre);
    formData.append('capacite', chambreForm.capacite);
    formData.append('prix_nuit', chambreForm.prix_nuit);
    formData.append('etat', chambreForm.etat);
    formData.append('description', chambreForm.description);
    formData.append('hotel', selectedHotelId);
    const photoChIds = selectedChambrePhotos || [];
    photoChIds.forEach(id => formData.append('photos[]', id));
    // Upload fichiers images
    chambreFiles.forEach(file => formData.append('chambreFiles', file));
    try {
      if (chambreEditingId) {
        await api.put(`/chambres/${chambreEditingId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        alert('Chambre mise à jour !');
      } else {
        await api.post('/chambres', formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        alert('Chambre créée et liée à l\'hôtel !');
      }
      // Reset formulaire
      setChambreForm({ type_chambre: 'Simple', capacite: 1, prix_nuit: '', etat: 'Libre', description: '' });
      setChambreFiles([]);
      setSelectedChambrePhotos([]);
      setChambreEditingId(null);
      setSelectedHotelId('');
      fetchMyChambres();
    } catch (err) {
      console.error('Erreur submit chambre:', err.response?.status, err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur');
    }
    setLoading(false);
  };

  const handleEditHotel = (hotel) => {
    alert(`Modification de l'hôtel "${hotel.nom}" en cours...`);
    setHotelForm({ nom: hotel.nom, adresse: hotel.adresse, description: hotel.description, prix: hotel.prix, etoiles: hotel.etoiles });
    setSelectedHotelPhotos(hotel.photos ? hotel.photos.map(p => p._id) : []);
    setHotelEditingId(hotel._id);
  };

  const handleDeleteHotel = async (id) => {
    alert(`Suppression de l'hôtel en cours...`);
    if (!window.confirm('Supprimer cet hôtel ?')) return;
    try {
      await api.delete(`/hotels/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      alert('Hôtel supprimé avec succès !');
      fetchMyHotels();
    } catch (err) {
      alert('Erreur suppression');
    }
  };

  const handleEditChambre = (chambre) => {
    alert(`Modification de la chambre "${roomTypeMap[chambre.type_chambre] || chambre.type_chambre}" en cours...`);
    setChambreForm({ type_chambre: chambre.type_chambre, capacite: chambre.capacite, prix_nuit: chambre.prix_nuit, etat: chambre.etat, description: chambre.description });
    setSelectedChambrePhotos(chambre.photos ? chambre.photos.map(p => p._id) : []);
    setChambreEditingId(chambre._id);
    setSelectedHotelId(chambre.hotel || '');
  };

  const handleDeleteChambre = async (id) => {
    alert(`Suppression de la chambre en cours...`);
    if (!window.confirm('Supprimer cette chambre ?')) return;
    try {
      await api.delete(`/chambres/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      alert('Chambre supprimée avec succès !');
      fetchMyChambres();
    } catch (err) {
      alert('Erreur suppression');
    }
  };

  // MISE À JOUR : Fonction pour réserver et updater le statut
  const handleReserveChambre = async (chambreId) => {
    if (!window.confirm(`Confirmez-vous la réservation de la chambre ${chambreId} ?`)) return;
    if (!token) {
      setError('Token manquant – Reconnectez-vous.');
      return;
    }
    try {
      // Appel API pour updater l'état à 'Occupée'
      await api.put(`/chambres/${chambreId}`, { etat: 'Occupée' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Réservation pour la chambre ${chambreId} confirmée ! Statut mis à jour.`);
      // Rafraîchir les données pour afficher le changement
      fetchMyChambres();
    } catch (err) {
      console.error('Erreur réservation:', err.response?.status, err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erreur lors de la réservation. La chambre est peut-être déjà occupée.');
    }
  };

  const getAllImages = (photos) => {
    return photos.flatMap(photo => photo.images || []);
  };

  const updateCarouselIndex = (hotelId, direction) => {
    setCarouselIndexes(prev => {
      const currentIndex = prev[hotelId] || 0;
      const allImages = getAllImages(hotels.find(h => h._id === hotelId)?.photos || []);
      let newIndex = currentIndex;
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % allImages.length;
      } else if (direction === 'prev') {
        newIndex = (currentIndex - 1 + allImages.length) % allImages.length;
      }
      return { ...prev, [hotelId]: newIndex };
    });
  };

  const updateChambreCarouselIndex = (chambreId, direction) => {
    setChambreCarouselIndexes(prev => {
      const currentIndex = prev[chambreId] || 0;
      const chambre = chambres.find(c => c._id === chambreId);
      const allImages = getAllImages(chambre?.photos || []);
      let newIndex = currentIndex;
      if (direction === 'next') {
        newIndex = (currentIndex + 1) % allImages.length;
      } else if (direction === 'prev') {
        newIndex = (currentIndex - 1 + allImages.length) % allImages.length;
      }
      return { ...prev, [chambreId]: newIndex };
    });
  };

  if (user?.role !== 'PERSONNEL') return <div>Accès refusé</div>;

  return (
    <div className={styles.dashboardContainer}>
      <h1>Dashboard Personnel</h1>
      <div className={styles.navigationLinks} style={{ marginBottom: 20, textAlign: 'center' }}>
        <Link to="/photos-hotels" className={`${styles.btn} ${styles.btnPrimary} ${styles.me2}`} style={{ padding: '10px 20px', margin: '0 10px', textDecoration: 'none', borderRadius: 4, color: 'white', background: '#007bff' }}>Gérer les photos des hôtels</Link>
        <Link to="/photos-chambres" className={`${styles.btn} ${styles.btnSecondary}`} style={{ padding: '10px 20px', margin: '0 10px', textDecoration: 'none', borderRadius: 4, color: 'white', background: '#6c757d' }}>Gérer les photos des chambres</Link>
      </div>
      {/* Hôtels */}
      <div className={styles.section}>
        <h2>Gestion Hôtels</h2>
        <form onSubmit={handleHotelSubmit} className={styles.form}>
          <input placeholder="Nom" value={hotelForm.nom} onChange={e => setHotelForm({ ...hotelForm, nom: e.target.value })} required />
          <input placeholder="Adresse" value={hotelForm.adresse} onChange={e => setHotelForm({ ...hotelForm, adresse: e.target.value })} required />
          <textarea placeholder="Description" value={hotelForm.description} onChange={e => setHotelForm({ ...hotelForm, description: e.target.value })} required />
          <input type="number" placeholder="Prix / nuit" value={hotelForm.prix} onChange={e => setHotelForm({ ...hotelForm, prix: e.target.value })} required />
          <select value={hotelForm.etoiles} onChange={e => setHotelForm({ ...hotelForm, etoiles: parseInt(e.target.value) })} required>
            <option value="">Nombre d'étoiles</option>
            {[1,2,3,4,5].map(num => (
              <option key={num} value={num}>{num} étoile{num > 1 ? 's' : ''}</option>
            ))}
          </select>
          <input type="file" multiple accept="image/*" onChange={e => setHotelFiles(Array.from(e.target.files))} />
          <select multiple value={selectedHotelPhotos} onChange={e => setSelectedHotelPhotos(Array.from(e.target.selectedOptions, option => option.value))} className={styles.formControl}>
            <option value="">Sélectionnez blocs photos hôtels</option>
            {hotelPhotoBlocks.map(block => (
              <option key={block._id} value={block._id}>{block.nom} ({block.images.length} images)</option>
            ))}
          </select>
          <button type="submit" disabled={loading}>
            {hotelEditingId ? 'Mettre à jour (re-soumission)' : 'Soumettre pour validation'}
          </button>
        </form>
        <div className={styles.list}>
          <h3>Mes Hôtels</h3>
          {hotels.map(hotel => {
            const allImages = getAllImages(hotel.photos || []);
            const currentIndex = carouselIndexes[hotel._id] || 0;
            return (
              <div key={hotel._id} className={`${styles.item} ${hotel.validated ? styles.validated : styles.pending}`}>
                {/* Status positionné en haut à gauche comme dans la maquette */}
                <div className={styles.statusWrapper}>
                  <span className={`${styles.status} ${hotel.validated ? styles.green : styles.orange}`}>
                    {hotel.validated ? 'Valide' : 'En attente de validation'}
                  </span>
                </div>
                {allImages.length > 0 && (
                  <div className={styles.carouselContainer}>
                    <div className={styles.carousel}>
                      <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => updateCarouselIndex(hotel._id, 'prev')}>‹</button>
                      <div className={styles.carouselImages} style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                        {allImages.map((img, i) => (
                          <img key={i} src={img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url}`} alt="" className={styles.carouselImage} />
                        ))}
                      </div>
                      <button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => updateCarouselIndex(hotel._id, 'next')}>›</button>
                    </div>
                    {allImages.length > 1 && (
                      <div className={styles.carouselDots}>
                        {allImages.map((_, i) => (
                          <span key={i} className={`${styles.dot} ${i === currentIndex ? styles.active : ''}`} onClick={() => setCarouselIndexes(prev => ({ ...prev, [hotel._id]: i }))}></span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className={styles.titleRow}>
                  
                  <div className={styles.stars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`${styles.star} ${i < (hotel.etoiles || 0) ? styles.filled : styles.empty}`}>{'⭐'}</span>
                    ))}
                  </div>
                  <h4 className={styles.hotelName}>{hotel.nom}</h4>
                </div>
                <p className={styles.description}>{hotel.description}</p>
                <p className={styles.address}>{hotel.adresse}</p>
                <p className={styles.price}>
                  <span className={styles.pricePrefix}>À partir de </span>
                  <span className={styles.priceValue}>{hotel.prix}€ / nuit</span>
                </p>
                <div className={styles.actions}>
                  <button onClick={() => handleEditHotel(hotel)}>Modifier</button>
                  <button onClick={() => handleDeleteHotel(hotel._id)} className={styles.delete}>Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Chambres */}
      <div className={styles.section}>
        <h2>Gestion Chambres</h2>
        <form onSubmit={handleChambreSubmit} className={styles.form}>
          <select value={selectedHotelId} onChange={e => setSelectedHotelId(e.target.value)} required>
            <option value="">Sélectionnez un hôtel</option>
            {hotels.map(hotel => (
              <option key={hotel._id} value={hotel._id}>{hotel.nom}</option>
            ))}
          </select>
          <select value={chambreForm.type_chambre} onChange={e => setChambreForm({ ...chambreForm, type_chambre: e.target.value })} required>
            <option value="">Type Chambre</option> 
            <option value="Simple">Chambre simple</option>
            <option value="Double">Chambre double</option>
            <option value="Suite">Suite de luxe</option>
          </select>
          <input type="number" placeholder="Capacité" value={chambreForm.capacite} onChange={e => setChambreForm({ ...chambreForm, capacite: e.target.value })} required />
          <input type="number" placeholder="Prix / nuit" value={chambreForm.prix_nuit} onChange={e => setChambreForm({ ...chambreForm, prix_nuit: e.target.value })} required />
          <select value={chambreForm.etat} onChange={e => setChambreForm({ ...chambreForm, etat: e.target.value })} required>
            <option value="">État</option>
            <option value="Libre">Libre</option> 
            <option value="Occupée">Occupée</option>
          </select>
          <textarea placeholder="Description" value={chambreForm.description} onChange={e => setChambreForm({ ...chambreForm, description: e.target.value })} />
          <input type="file" multiple accept="image/*" onChange={e => setChambreFiles(Array.from(e.target.files))} />
          <select multiple value={selectedChambrePhotos} onChange={e => setSelectedChambrePhotos(Array.from(e.target.selectedOptions, option => option.value))} className={styles.formControl}>
            <option value="">Sélectionnez blocs photos chambres</option>
            {chambrePhotoBlocks.map(block => (
              <option key={block._id} value={block._id}>{block.nom} ({block.images.length} images)</option>
            ))}
          </select>
          <button type="submit" disabled={loading || !selectedHotelId}>
            {chambreEditingId ? 'Mettre à jour Chambre' : 'Ajouter Chambre à l\'hôtel'}
          </button>
        </form>
        <div className={styles.list}>
          <h3>Mes Chambres</h3>
          {chambres.map(chambre => {
            const allImages = getAllImages(chambre.photos || []);
            const currentIndex = chambreCarouselIndexes[chambre._id] || 0;
            return (
              <div key={chambre._id} className={`${styles.item} ${styles.chambreItem}`}>
                <div className={styles.chamberContent}>
                  <div className={styles.chamberLeft}>
                    {allImages.length > 0 && (
                      <div className={`${styles.carouselContainer} ${styles.chambreCarousel}`}>
                        <div className={styles.carousel}>
                          <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => updateChambreCarouselIndex(chambre._id, 'prev')}>‹</button>
                          <div className={styles.carouselImages} style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                            {allImages.map((img, i) => (
                              <img key={i} src={img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url}`} alt="" className={styles.carouselImage} />
                            ))}
                          </div>
                          <button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => updateChambreCarouselIndex(chambre._id, 'next')}>›</button>
                        </div>
                        {allImages.length > 1 && (
                          <div className={styles.carouselDots}>
                            {allImages.map((_, i) => (
                              <span key={i} className={`${styles.dot} ${i === currentIndex ? styles.active : ''}`} onClick={() => setChambreCarouselIndexes(prev => ({ ...prev, [chambre._id]: i }))}></span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.chamberRight}>
                    <div className={`${styles.titleRow} ${styles.chambreTitle}`}>
                      {/* Utilisation du mapping pour afficher le label descriptif */}
                      <h4>{roomTypeMap[chambre.type_chambre] || chambre.type_chambre}</h4>
                    </div>
                    <p>{chambre.description}</p>
                    {/* Prix avec spans pour styles */}
                    <p className={styles.chamberPrice}>
                      <span className={styles.priceLabel}>Prix: </span>
                      <span className={styles.priceValue}>{chambre.prix_nuit}€</span>
                    </p>
                    {/* Disponibilité avec spans pour styles */}
                    <p className={styles.chamberStatus}>
                      <span className={styles.statusLabel}>Disponibilité : </span>
                      <span className={`${styles.status} ${chambre.etat === 'Libre' ? styles.green : styles.red}`}>{chambre.etat}</span>
                    </p>
                    {/* Masquage du bouton pour les rôles non-client */}
                    {user?.role === 'CLIENT' && (
                      <button className={styles.reserveBtn} onClick={() => handleReserveChambre(chambre._id)} disabled={chambre.etat === 'Occupée'}>
                        {chambre.etat === 'Occupée' ? 'Occupée' : 'Réservez'}
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.actions}>
                  <button onClick={() => handleEditChambre(chambre)}>Modifier</button>
                  <button onClick={() => handleDeleteChambre(chambre._id)} className={styles.delete}>Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default DashboardPersonnel;
















