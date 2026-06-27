import { ChangeEvent, useRef, useEffect, useState } from 'react';
import './PhotoUploadField.css';

type PhotoUploadFieldProps = {
  label: string;
  preview: string;
  capture?: string;
  onFileSelected: (input: string | ChangeEvent<HTMLInputElement>) => void;
  buttonLabel?: string;
};

// PhotoUploadField provides a single button that opens a small modal.
// The modal attempts to open the camera (using getUserMedia) and shows a
// preview with Capture / Retake / Choose photo / Use this photo controls.
// It also exposes a hidden file input so "Choose photo" uses the native
// file picker on desktop/mobile.
export default function PhotoUploadField({
  label,
  preview,
  capture = 'user',
  onFileSelected,
  buttonLabel = 'Camera / choose photo'
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [status, setStatus] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState(true);
  const [captured, setCaptured] = useState('');

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (!showModal || !stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    const tryPlay = async () => {
      try {
        await videoRef.current.play();
      } catch (e) {
        // Some browsers block autoplay without user interaction.
      }
    };
    tryPlay();
  }, [showModal, stream]);

  const openModal = async () => {
    setShowModal(true);
    setCaptured('');
    setStatus('Camera is starting. If the browser asks permission, choose Allow.');
    setIsCameraLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('Camera is not available in this browser. Use Choose photo.');
      setIsCameraLoading(false);
      return;
    }

    try {
      const facingMode = capture === 'environment' ? 'environment' : 'user';
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: false });
      setStream(s);
      setHasCameraAccess(true);
      setStatus('Camera is ready. Click Capture photo.');
    } catch (err) {
      setHasCameraAccess(false);
      setStatus('Camera could not be opened. Click Choose photo, or allow camera permission in the browser and try again.');
    } finally {
      setIsCameraLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCaptured('');
    setStatus('');
    setIsCameraLoading(false);
  };

  const handleCapture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 960;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    setCaptured(dataUrl);
    setStatus('Photo captured. Click Use this photo to save it.');
    try { v.pause(); } catch (e) { }
  };

  const handleRetake = async () => {
    setCaptured('');
    setStatus('Camera is ready. Click Capture photo.');
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      try { await videoRef.current.play(); } catch (e) { }
    } else {
      openModal();
    }
  };

  const handleUsePhoto = () => {
    if (!captured) return;
    onFileSelected(captured);
    closeModal();
  };

  const handleChoose = () => {
    inputRef.current?.click();
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileSelected(e);
    closeModal();
  };

  return (
    <div className="photo-upload-field">
      <div className="capture-row">
        <label>{label}</label>
        <button type="button" className="secondary" onClick={openModal}>{buttonLabel}</button>
      </div>

      <input
        ref={inputRef}
        className="photo-upload-input"
        type="file"
        accept="image/*"
        capture={capture}
        onChange={onInputChange}
      />

      <div className="photo-preview small">
        {preview ? <img src={preview} alt="Selected preview" /> : 'No photo'}
      </div>

      {showModal && (
        <dialog open>
          <div className="camera-panel">
            <div className="camera-header">
              <h2>Take Photo</h2>
              <button type="button" className="secondary" onClick={closeModal}>Close</button>
            </div>
            <div className="camera-status">{status}</div>
            <div>
              {captured ? (
                <img className="captured-preview" src={captured} alt="Captured" />
              ) : stream ? (
                <video ref={videoRef} id="cameraVideo" autoPlay playsInline muted style={{ width: '100%' }} />
              ) : (
                <div className="camera-placeholder">
                  {isCameraLoading ? 'Opening camera…' : status || 'Camera not available'}
                </div>
              )}
              <canvas ref={canvasRef} id="cameraCanvas" style={{ display: 'none' }} />
            </div>
            <div className="dialog-actions">
              <button type="button" onClick={handleCapture} disabled={!!captured || !stream}>Capture photo</button>
              <button type="button" onClick={handleRetake} disabled={!captured} className="secondary">Retake</button>
              <button type="button" onClick={handleChoose} className="secondary">Choose photo</button>
              <button type="button" onClick={handleUsePhoto} disabled={!captured}>Use this photo</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
