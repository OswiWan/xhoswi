import { useEffect, useState } from 'react';
import { getVideos, deleteVideo } from '../api';
import VideoPlayer from './VideoPlayer';
import AddVideoForm from './AddVideoForm';

export default function Catalog({ user, role, token, onLogout }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const isAdmin = role === 'admin';

  useEffect(() => {
    getVideos()
      .then(setVideos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(video) {
    setVideos((prev) => [video, ...prev]);
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Borrar este video?')) return;
    try {
      await deleteVideo(token, id);
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      alert(`No se pudo borrar: ${err.message}`);
    }
  }

  if (loading) return <p>Cargando catálogo...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="catalog">
      <header className="catalog-header">
        <h1>🎬 Xhoswi</h1>
        <div>
          <span>👤 {user}{isAdmin && ' (admin)'}</span>
          {isAdmin && (
            <button onClick={() => setShowAddForm(true)} style={{ marginLeft: '0.5rem' }}>
              + Añadir video
            </button>
          )}
          <button onClick={onLogout} style={{ marginLeft: '0.5rem' }}>Salir</button>
        </div>
      </header>

      <div className="grid">
        {videos.map((v) => (
          <div key={v.id} className="card">
            <div onClick={() => setSelectedVideo(v)} style={{ cursor: 'pointer' }}>
              <img src={v.thumbnail} alt={v.title} />
              <div className="card-body">
                <h3>{v.title}</h3>
                <p>{v.description}</p>
                <small>{Math.floor(v.durationSeconds / 60)} min</small>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDelete(v.id)}
                style={{ width: '100%', background: '#b33', color: '#fff' }}
              >
                Borrar
              </button>
            )}
          </div>
        ))}
      </div>

      {selectedVideo && (
        <VideoPlayer
          src={selectedVideo.streamUrl}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      {showAddForm && (
        <AddVideoForm
          token={token}
          onCreated={handleCreated}
          onClose={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
