/**
 * PhotoCapture — reusable photo take/upload widget.
 * Compresses client-side, shows preview, uploads to backend.
 * Displays disclaimer about vet confirmation.
 */
import { useState, useRef } from 'react';
import { uploadPhoto, previewUrl } from '../utils/photo';

interface Props {
  onUploaded: (url: string) => void;
  onClear: () => void;
  currentUrl?: string;
  label?: string;
}

export function PhotoCapture({ onUploaded, onClear, currentUrl, label = 'Add Photo' }: Props) {
  const [preview, setPreview]   = useState<string | null>(currentUrl ?? null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError]       = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    const local = previewUrl(file);
    setPreview(local);
    setProgress(0);
    try {
      const url = await uploadPhoto(file, pct => setProgress(pct));
      URL.revokeObjectURL(local);
      setPreview(url);
      setProgress(null);
      onUploaded(url);
    } catch {
      setError('Upload failed. Photo saved locally only.');
      setProgress(null);
      // keep local preview so user can retry
    }
  };

  const clear = () => {
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(null);
    setProgress(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onClear();
  };

  return (
    <div className="photo-capture">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {preview ? (
        <div className="photo-preview-wrap">
          <img src={preview} alt="Symptom photo" className="photo-preview-img" />
          {progress !== null && (
            <div className="photo-progress-bar">
              <div className="photo-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
          <button className="photo-clear-btn" onClick={clear}>✕ Remove</button>
        </div>
      ) : (
        <button
          className="photo-add-btn"
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <span style={{ fontSize: 28 }}>📷</span>
          <span>{label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Take photo or choose from gallery
          </span>
        </button>
      )}

      {error && <div className="photo-error">⚠️ {error}</div>}

      <div className="photo-disclaimer">
        📌 Photo helps, but may not be accurate. Always confirm with a vet.
      </div>
    </div>
  );
}
