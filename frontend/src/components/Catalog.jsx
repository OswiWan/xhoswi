import { useEffect, useState } from 'react';
import { getVideos } from '../api';
import VideoPlayer from './VideoPlayer';

export default function Catalog({ user, onLogout }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    getVideos()
      .then(setVideos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando catálogo...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <div className="catalog">
      <header className="catalog-header">
        <h1>🎬 Spotifake</h1>
        <div>
          <span>👤 {user}</span>
          <button onClick={onLogout}>Salir</button>
        </div>
      </header>

      <div className="grid">
        {videos.map((v) => (
          <div key={v.id} className="card" onClick={() => setSelectedVideo(v)}>
            <img src={v.thumbnail} alt={v.title} />
            <div className="card-body">
              <h3>{v.title}</h3>
              <p>{v.description}</p>
              <small>{Math.floor(v.durationSeconds / 60)} min</small>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <VideoPlayer
          src={selectedVideo.streamUrl}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}
