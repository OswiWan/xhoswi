import { useState } from 'react';
import { createVideo } from '../api';

export default function AddVideoForm({ token, onCreated, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [hlsPath, setHlsPath] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const video = await createVideo(token, {
        title,
        description,
        thumbnail,
        hlsPath,
        durationSeconds: Number(durationSeconds) || 0,
      });
      onCreated(video);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>Añadir video</h2>
        <form onSubmit={handleSubmit} className="add-video-form">
          <label>
            Título
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Descripción
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label>
            URL de miniatura (imagen)
            <input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://..." />
          </label>
          <label>
            URL HLS (archivo .m3u8)
            <input value={hlsPath} onChange={(e) => setHlsPath(e.target.value)} placeholder="https://.../index.m3u8" required />
          </label>
          <label>
            Duración (segundos)
            <input type="number" min="0" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} />
          </label>
          {error && <p className="error">⚠️ {error}</p>}
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
