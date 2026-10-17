import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import api from '../utils/axiosConfig';
import styles from './DashboardAdmin.module.css';

const DashboardAdmin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [allHotels, setAllHotels] = useState([]);
  const [pendingHotels, setPendingHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [avis, setAvis] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [carouselIndexes, setCarouselIndexes] = useState({});
  const [validatedCarouselIndexes, setValidatedCarouselIndexes] = useState({});
  const [editingUserId, setEditingUserId] = useState(null);
  const [newRole, setNewRole] = useState('CLIENT');

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('token');
      logout();
      navigate('/login');
    } else {
      setError(err.response?.data?.message || err.message || 'Erreur inconnue');
    }
  };

  useEffect(() => {
    if (user?.role === 'MODERATEUR' && token) {
      fetchAllHotels();
      fetchUsers();
      fetchAvis();
    } else if (!token) {
      navigate('/login');
    }
  }, [user, token, navigate, logout]);

  const fetchAllHotels = async () => {
    if (!token) return;
    try {
      const res = await api.get('/hotels', { headers: { Authorization: `Bearer ${token}` } });
      const hotels = res.data || [];
      setAllHotels(hotels);
      setPendingHotels(hotels.filter(h => !h.validated));
    } catch (err) {
      handleAuthError(err);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await api.get('/users/all', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data || []);
    } catch (err) {
      handleAuthError(err);
    }
  };

  const fetchAvis = async () => {
    if (!token) return;
    try {
      const res = await api.get('/hotels/avis/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const avisData = res.data || [];
      setAvis(avisData);
      setTotalPages(Math.ceil(avisData.length / 10) || 1);
    } catch (err) {
      console.error('Erreur fetch avis:', err);
      setAvis([]);
    }
  };

  const handleValidateHotel = async (hotelId) => {
    if (!window.confirm('Valider cet hôtel ?')) return;
    setLoading(true);
    try {
      await api.put(`/hotels/${hotelId}/validate`);
      alert('Hôtel validé !');
      fetchAllHotels();
    } catch (err) { handleAuthError(err); }
    setLoading(false);
  };

  const handleRejectHotel = async (hotelId) => {
    if (!window.confirm('Refuser cet hôtel ?')) return;
    setLoading(true);
    try {
      await api.put(`/hotels/${hotelId}/reject`);
      alert('Hôtel refusé !');
      fetchAllHotels();
    } catch (err) { handleAuthError(err); }
    setLoading(false);
  };

  const handleModerateAvis = async (avisId, action) => {
    if (!window.confirm(`${action === 'approve' ? 'Approuver' : 'Rejeter'} cet avis ?`)) return;
    setLoading(true);
    try {
      await api.put(`/hotels/avis/${avisId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(action === 'approve' ? 'Avis approuvé !' : 'Avis rejeté !');
      fetchAvis();
    } catch (err) {
      alert('Erreur lors de la modération');
      handleAuthError(err);
    }
    setLoading(false);
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Suspendre cet utilisateur ?')) return;
    setLoading(true);
    try {
      await api.put(`/users/${userId}/suspend`);
      alert('Utilisateur suspendu !');
      fetchUsers();
    } catch (err) { handleAuthError(err); }
    setLoading(false);
  };

  const handleRoleChange = async (userId) => {
  // Recherche de l'utilisateur dans le state local pour afficher son prénom/nom dans la confirmation
  const user = users.find(u => u._id === userId);

  // Si le rôle sélectionné est identique au rôle actuel → rien à faire, on ferme simplement l'édition
  if (newRole === user.role) { 
    setEditingUserId(null); 
    return; 
  }

  // Confirmation de sécurité avant toute modification de rôle (UX + prévention d'erreur)
  if (!window.confirm(`Passer ${user.prenom} ${user.nom} en ${newRole} ?`)) {
    return; // L'utilisateur annule → on sort de la fonction sans rien faire
  }

  // Indicateur de chargement pendant la requête API (désactive le bouton, montre un spinner, etc.)
  setLoading(true);

  try {
    // Requête PUT vers le backend pour modifier le rôle de l'utilisateur
    // Chemin : /users/:id → endpoint dédié à la mise à jour du profil
    await api.put(
      `/users/${userId}`,
      { role: newRole },                              
      { 
        headers: { Authorization: `Bearer ${token}` } // Token JWT obligatoire (protégé par middleware protect + admin)
      }
    );

    // Feedback positif à l'utilisateur
    alert('Rôle mis à jour !');

    // Rafraîchissement de la liste complète des utilisateurs pour refléter le changement
    fetchUsers();

    // Fermeture du mode édition
    setEditingUserId(null);

    // Réinitialisation du select de rôle
    setNewRole('CLIENT');

  } catch (err) {
    // Gestion centralisée des erreurs (token expiré, 403, 500, etc.)
    // handleAuthError affiche un message, déconnecte si nécessaire, etc.
    handleAuthError(err);
  }

  // Fin du chargement, dans tous les cas (succès ou erreur)
  setLoading(false);
};

  const getAllImages = (photos) => photos ? photos.flatMap(p => p.images || []) : [];
  const validatedHotels = allHotels.filter(h => h.validated);

  const updateCarouselIndex = (hotelId, direction, isValidated = false) => {
    const list = isValidated ? validatedHotels : pendingHotels;
    const hotel = list.find(h => h._id === hotelId);
    if (!hotel) return;
    const images = getAllImages(hotel.photos);
    if (!images.length) return;
    const setIndex = isValidated ? setValidatedCarouselIndexes : setCarouselIndexes;
    setIndex(prev => ({
      ...prev,
      [hotelId]: direction === 'next'
        ? ( (prev[hotelId] || 0) + 1 ) % images.length
        : ( (prev[hotelId] || 0) - 1 + images.length ) % images.length
    }));
  };

  if (user?.role !== 'MODERATEUR') return <div>Accès refusé</div>;

  return (
    <div className={styles.dashboardContainer}>
      <h1>Dashboard Modérateur</h1>

      {/* Hôtels en attente */}
      <div className={styles.section}>
        <h2>Validation Hôtels</h2>
        <div className={styles.list}>
          <h3>Hôtels en attente ({pendingHotels.length})</h3>
          {pendingHotels.length === 0 ? (
            <p className={styles.noData}>Aucun hôtel en attente</p>
          ) : (
            pendingHotels.map(hotel => {
              const images = getAllImages(hotel.photos);
              const idx = carouselIndexes[hotel._id] || 0;
              return (
                <div key={hotel._id} className={`${styles.item} ${styles.pending}`}>
                  {images.length > 0 && (
                    <div className={styles.carouselContainer}>
                      <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => updateCarouselIndex(hotel._id, 'prev')}>‹</button>
                      <div className={styles.carouselImages} style={{ transform: `translateX(-${idx * 100}%)` }}>
                        {images.map((img, i) => (
                          <img key={i} src={img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url}`} alt="" className={styles.carouselImage} />
                        ))}
                      </div>
                      <button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => updateCarouselIndex(hotel._id, 'next')}>›</button>
                    </div>
                  )}
                  <div className={styles.titleRow}>
                    <h4>{hotel.nom}</h4>
                    <div className={styles.stars}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={`${styles.star} ${i < hotel.etoiles ? styles.filled : ''}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className={styles.description}>{hotel.description}</p>
                  <p className={styles.address}>{hotel.adresse}</p>
                  <p className={styles.price}>À partir de {hotel.prix}€ / nuit</p>
                  <span className={`${styles.status} ${styles.orange}`}>En attente</span>
                  <div className={styles.actions}>
                    <button onClick={() => handleValidateHotel(hotel._id)} disabled={loading} className={styles.validateBtn}>Valider</button>
                    <button onClick={() => handleRejectHotel(hotel._id)} disabled={loading} className={styles.rejectBtn}>Rejeter</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hôtels validés */}
      <div className={styles.section}>
        <h2>Hôtels Validés ({validatedHotels.length})</h2>
        <div className={styles.list}>
          {validatedHotels.map(hotel => {
            const images = getAllImages(hotel.photos);
            const idx = validatedCarouselIndexes[hotel._id] || 0;
            return (
              <div key={hotel._id} className={`${styles.item} ${styles.validated}`}>
                {images.length > 0 && (
                  <div className={styles.carouselContainer}>
                    <button className={`${styles.carouselBtn} ${styles.prev}`} onClick={() => updateCarouselIndex(hotel._id, 'prev', true)}>‹</button>
                    <div className={styles.carouselImages} style={{ transform: `translateX(-${idx * 100}%)` }}>
                      {images.map((img, i) => (
                        <img key={i} src={img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url}`} alt="" className={styles.carouselImage} />
                      ))}
                    </div>
                    <button className={`${styles.carouselBtn} ${styles.next}`} onClick={() => updateCarouselIndex(hotel._id, 'next', true)}>›</button>
                  </div>
                )}
                <h4>{hotel.nom} ★{hotel.etoiles}</h4>
                <p>{hotel.description.substring(0, 100)}...</p>
                <p>{hotel.adresse} • {hotel.prix}€/nuit</p>
                <span className={`${styles.status} ${styles.green}`}>Validé</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gestion utilisateurs */}
      <div className={styles.section}>
        <h2>Gestion Utilisateurs ({users.length})</h2>
        <div className={styles.list}>
          {users.map(u => {
            const editing = editingUserId === u._id;
            return (
              <div key={u._id} className={`${styles.item} ${styles.userItem}`}>
                <h4>{u.prenom} {u.nom} • {u.email}</h4>
                <span className={styles.status}>{u.role}</span>
                <div className={styles.actions}>
                  {!editing ? (
                    <button onClick={() => { setEditingUserId(u._id); setNewRole(u.role); }} className={styles.validateBtn}>Changer rôle</button>
                  ) : (
                    <>
                      <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                        <option value="CLIENT">Client</option>
                        <option value="PERSONNEL">Personnel</option>
                        <option value="MODERATEUR">Modérateur</option>
                      </select>
                      <button onClick={() => handleRoleChange(u._id)} className={styles.approveBtn}>OK</button>
                      <button onClick={() => setEditingUserId(null)} className={styles.rejectBtn}>Annuler</button>
                    </>
                  )}
                  <button onClick={() => handleSuspendUser(u._id)} className={styles.rejectBtn}>Suspendre</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODÉRATION AVIS – CORRIGÉE */}
      <div className={styles.section}>
        <h2>Modération Avis ({avis.length})</h2>
        {avis.length === 0 ? (
          <p className={styles.noData}>Aucun avis en attente</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Hôtel</th>
                  <th>Client</th>
                  <th>Note</th>
                  <th>Commentaire</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {avis.map(a => (
                  <tr key={a._id}>
                    <td>{a.hotel?.nom || 'Inconnu'}</td>
                    <td>{a.user ? `${a.user.prenom || ''} ${a.user.nom || ''}`.trim() || a.user.email : 'Supprimé'}</td>
                    <td><strong>{a.note}/5</strong></td>
                    <td>{a.commentaire}</td>
                    <td>{new Date(a.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className={styles.actions}>
                      <button onClick={() => handleModerateAvis(a._id, 'approve')} disabled={loading} className={styles.approveBtn}>Approuver</button>
                      <button onClick={() => handleModerateAvis(a._id, 'reject')} disabled={loading} className={styles.rejectBtn}>Rejeter</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default DashboardAdmin;


































