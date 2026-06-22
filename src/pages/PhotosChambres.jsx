import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../utils/auth';
import './PhotosChambres.css';

// Sous-composant : Formulaire création
const FormulairePhotoChambres = ({ onFormSubmit }) => {
  const { token } = useAuth();
  const [nom, setNom] = useState('');
  const [alt, setAlt] = useState('');
  const [fichiers, setFichiers] = useState([{ id: 0, file: null, preview: null }]);
  const [message, setMessage] = useState('');

  const handleFileChange = (e, index) => {
    const nouveauxFichiers = [...fichiers];
    const file = e.target.files[0];
    nouveauxFichiers[index].file = file;
    nouveauxFichiers[index].preview = file ? URL.createObjectURL(file) : null;
    setFichiers(nouveauxFichiers);
  };

  const handleAddField = () => {
    setFichiers([...fichiers, { id: fichiers.length, file: null, preview: null }]);
  };

  const handleRemoveField = (index) => {
    const nouveauxFichiers = fichiers.filter((_, i) => i !== index);
    if (fichiers[index].preview) URL.revokeObjectURL(fichiers[index].preview);
    setFichiers(nouveauxFichiers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (fichiers.filter(f => f.file).length === 0) {
      setMessage('Au moins un fichier requis');
      return;
    }
    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('alt', alt);
    fichiers.forEach((fichier) => {
      if (fichier.file) formData.append('photos', fichier.file);
    });

    try {
      await axios.post('/api/chambrephotos', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Collection de photos créée avec succès !');
      setNom(''); setAlt('');
      setFichiers([{ id: 0, file: null, preview: null }]);
      fichiers.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
      if (onFormSubmit) onFormSubmit();
    } catch (error) {
      setMessage(`Erreur : ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm">
      <h2 className="mb-4">Créer une nouvelle collection de photos chambres</h2>
      <div className="mb-3">
        <label htmlFor="nom" className="form-label">Nom de la collection</label>
        <input type="text" className="form-control" id="nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      </div>
      <div className="mb-3">
        <label htmlFor="alt" className="form-label">Texte alternatif</label>
        <input type="text" className="form-control" id="alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
      </div>
      {fichiers.map((fichier, index) => (
        <div key={fichier.id} className="mb-3">
          <label className="form-label">Fichier {index + 1}</label>
          <div className="d-flex align-items-center">
            <input type="file" className="form-control me-2" accept="image/*" onChange={(e) => handleFileChange(e, index)} required={index === 0} />
            {fichiers.length > 1 && (
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveField(index)}>Supprimer</button>
            )}
          </div>
          {fichier.preview && <img src={fichier.preview} alt="Preview" className="mt-2 rounded" style={{ maxWidth: '100px', maxHeight: '100px' }} />}
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm mb-3" onClick={handleAddField}>Ajouter un fichier</button>
      <button type="submit" className="btn btn-primary">Créer</button>
      {message && <p className="mt-3">{message}</p>}
    </form>
  );
};

// Sous-composant : Formulaire modification (identique à hôtels, mais endpoints /chambrephotos)
const FormulaireModificationPhotoChambres = ({ photo, onFormSubmit }) => {
  const { token } = useAuth();
  const [nom, setNom] = useState(photo.nom);
  const [alt, setAlt] = useState(photo.alt);
  const [fichiers, setFichiers] = useState([{ id: 0, file: null, preview: null }]);
  const [message, setMessage] = useState('');

  const handleFileChange = (e, index) => {
    const nouveauxFichiers = [...fichiers];
    const file = e.target.files[0];
    nouveauxFichiers[index].file = file;
    nouveauxFichiers[index].preview = file ? URL.createObjectURL(file) : null;
    setFichiers(nouveauxFichiers);
  };

  const handleAddField = () => setFichiers([...fichiers, { id: fichiers.length, file: null, preview: null }]);
  const handleRemoveField = (index) => {
    const nouveauxFichiers = fichiers.filter((_, i) => i !== index);
    if (fichiers[index].preview) URL.revokeObjectURL(fichiers[index].preview);
    setFichiers(nouveauxFichiers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const formData = new FormData();
    formData.append('nom', nom);
    formData.append('alt', alt);
    fichiers.forEach((fichier) => { if (fichier.file) formData.append('photos', fichier.file); });

    try {
      await axios.put(`/api/chambrephotos/${photo._id}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Collection mise à jour !');
      fichiers.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
      if (onFormSubmit) onFormSubmit();
    } catch (error) {
      setMessage(`Erreur : ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm">
      <h2 className="mb-4">Modifier : {photo.nom}</h2>
      <div className="mb-3">
        <label className="form-label">Nom</label>
        <input type="text" className="form-control" value={nom} onChange={(e) => setNom(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">Alt</label>
        <input type="text" className="form-control" value={alt} onChange={(e) => setAlt(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">Photos actuelles</label>
        <div className="d-flex flex-wrap">
          {photo.images.map((img) => (
            <img key={img._id} src={img.url} alt={photo.alt} className="me-2 mb-2 rounded" style={{ width: '100px' }} />
          ))}
        </div>
      </div>
      {fichiers.map((fichier, index) => (
        <div key={fichier.id} className="mb-3">
          <label className="form-label">Nouveau fichier {index + 1}</label>
          <div className="d-flex align-items-center">
            <input type="file" className="form-control me-2" accept="image/*" onChange={(e) => handleFileChange(e, index)} />
            {fichiers.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveField(index)}>Supprimer</button>}
          </div>
          {fichier.preview && <img src={fichier.preview} alt="Preview" className="mt-2 rounded" style={{ maxWidth: '100px' }} />}
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm mb-3" onClick={handleAddField}>Ajouter fichier</button>
      <button type="submit" className="btn btn-primary">Mettre à jour</button>
      <button type="button" className="btn btn-link ms-2" onClick={onFormSubmit}>Annuler</button>
      {message && <p className="mt-3">{message}</p>}
    </form>
  );
};

// Sous-composant : Liste (endpoints /chambrephotos)
const ListePhotosChambres = ({ rafraichirListe, onEditer, onPhotoSupprimee }) => {
  const { token } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState('');

  const fetchPhotos = async () => {
    try {
      const res = await axios.get('/api/chambrephotos/all', { headers: { Authorization: `Bearer ${token}` } });
      setPhotos(res.data);
      setMessage('');
    } catch (error) {
      setMessage(`Erreur : ${error.message}`);
    }
  };

  React.useEffect(() => { fetchPhotos(); }, [rafraichirListe, onPhotoSupprimee]);

  const handleDeleteIndividual = async (imageId, docId) => {
    try {
      await axios.put(`/api/chambrephotos/${docId}/remove-image/${imageId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Photo supprimée !');
      if (onPhotoSupprimee) onPhotoSupprimee();
    } catch (error) {
      setMessage(`Erreur : ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (photoId) => {
    if (!window.confirm('Supprimer cette collection ?')) return;
    try {
      await axios.delete(`/api/chambrephotos/${photoId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Collection supprimée !');
      if (onPhotoSupprimee) onPhotoSupprimee();
    } catch (error) {
      setMessage(`Erreur : ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="mt-5">
      <h2 className="mb-4">Liste des collections photos chambres</h2>
      {message && <div className="alert alert-info">{message}</div>}
      <div className="row">
        {photos.length > 0 ? photos.map((photo) => (
          <div key={photo._id} className="col-md-4 mb-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5>{photo.nom}</h5>
                <p>{photo.alt}</p>
                <div className="d-flex flex-wrap">
                  {photo.images.map((img) => (
                    <div key={img._id} className="position-relative me-2 mb-2">
                      <img src={img.url} alt={photo.alt} className="rounded" style={{ maxHeight: '150px' }} />
                      <button className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle" style={{ zIndex: 10, lineHeight: 0.8 }} onClick={() => handleDeleteIndividual(img._id, photo._id)}>&times;</button>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <button className="btn btn-warning btn-sm me-2" onClick={() => onEditer(photo)}>Modifier</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(photo._id)}>Supprimer collection</button>
                </div>
              </div>
            </div>
          </div>
        )) : <p>Aucune collection.</p>}
      </div>
    </div>
  );
};

// Page principale
export default function PhotosChambres() {
  const [rafraichirListe, setRafraichirListe] = useState(false);
  const [photoAEditer, setPhotoAEditer] = useState(null);

  const gererSoumission = () => {
    setRafraichirListe(prev => !prev);
    setPhotoAEditer(null);
  };

  const onEditer = (photo) => setPhotoAEditer(photo);

  return (
    <div className="container mt-5">
      <h1>Gestion photos chambres</h1>
      {photoAEditer ? (
        <FormulaireModificationPhotoChambres photo={photoAEditer} onFormSubmit={gererSoumission} />
      ) : (
        <FormulairePhotoChambres onFormSubmit={gererSoumission} />
      )}
      <hr className="my-5" />
      <ListePhotosChambres rafraichirListe={rafraichirListe} onEditer={onEditer} onPhotoSupprimee={gererSoumission} />
    </div>
  );
}