import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ src, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  return (
    <div className="player-overlay" onClick={onClose}>
      <div className="player-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        <video ref={videoRef} controls autoPlay style={{ width: '100%' }} />
      </div>
    </div>
  );
}
