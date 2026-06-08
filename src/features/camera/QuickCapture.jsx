/**
 * ============================================================================
 * FILE NAME: QuickCapture.jsx
 * TYPE: Camera Feature Component
 * PURPOSE: Full-screen Camera-First capture experience. Allows instant photo
 *          capture and quick publishing to a selected Pace.
 * ============================================================================
 */

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera as CameraIcon, X, Send, RefreshCw, ChevronLeft, AlertCircle, ShieldAlert } from "lucide-react";

const FILTERS = [
  { id: "normal", label: "Normal", style: "none" },
  { id: "sunset", label: "Sunset", style: "saturate(1.45) contrast(1.15) sepia(0.18) brightness(1.02)" },
  { id: "retro", label: "Retro", style: "sepia(0.4) contrast(0.95) saturate(1.15) brightness(0.98)" },
  { id: "noir", label: "Noir", style: "grayscale(1) contrast(1.35) brightness(0.92)" },
  { id: "cyber", label: "Cyberpunk", style: "hue-rotate(60deg) saturate(1.35) contrast(1.1)" },
  { id: "dreamy", label: "Dreamy", style: "brightness(1.06) saturate(0.85) contrast(0.92) sepia(0.08) blur(0.2px)" }
];

export default function QuickCapture({
  paces = [],
  setView,
  setActivePace,
  onCreateMemory,
  session
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const [showPaceSelector, setShowPaceSelector] = useState(false);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // New camera state features
  const [facingMode, setFacingMode] = useState("environment"); // "environment" or "user"
  const [selectedFilter, setSelectedFilter] = useState("normal");
  const [diagnostics, setDiagnostics] = useState({
    isSecureContext: window.isSecureContext,
    hasMediaDevices: !!navigator.mediaDevices,
    hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    permissionState: "unknown",
    exactError: null
  });

  // Query and monitor browser permission state
  useEffect(() => {
    async function checkPermissions() {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: "camera" });
          setDiagnostics((prev) => ({ ...prev, permissionState: result.state }));
          result.onchange = () => {
            setDiagnostics((prev) => ({ ...prev, permissionState: result.state }));
          };
        } catch (e) {
          console.warn("Camera permission query not supported in this browser:", e);
        }
      }
    }
    checkPermissions();
  }, []);

  // Callback ref to bind stream instantly when video element mounts
  const setVideoRef = (el) => {
    videoRef.current = el;
    if (el && stream) {
      el.srcObject = stream;
      el.play().catch((e) => console.warn("Callback ref auto-play failed:", e));
    }
  };

  // Bind stream when stream or capturedImage changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn("Stream effect auto-play failed:", e));
    }
  }, [stream, capturedImage]);

  // Initialize and manage camera stream
  useEffect(() => {
    let activeStream = null;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            window.isSecureContext
              ? "Media devices API or getUserMedia is not supported in this browser."
              : "Camera APIs are blocked in non-secure HTTP contexts. Please use HTTPS or localhost."
          );
        }

        let mediaStream;
        try {
          // Attempt 1: Exact requested facingMode
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: facingMode } },
            audio: false
          });
        } catch (exactErr) {
          console.warn(`Failed exact constraints for "${facingMode}", trying ideal...`, exactErr);
          try {
            // Attempt 2: Ideal requested facingMode (more permissive)
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: facingMode } },
              audio: false
            });
          } catch (idealErr) {
            console.warn("Failed ideal constraints, trying fallback with generic video...", idealErr);
            // Attempt 3: Generic video stream fallback (any camera)
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        setCameraError(null);
        setDiagnostics((prev) => ({
          ...prev,
          permissionState: "granted",
          exactError: null
        }));
      } catch (err) {
        console.error("Error accessing camera:", err);
        
        setDiagnostics((prev) => ({
          ...prev,
          exactError: {
            name: err.name || "Error",
            message: err.message || String(err)
          },
          permissionState: err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "denied"
            : prev.permissionState
        }));

        let friendlyMessage = "Camera unavailable.";
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          friendlyMessage = "Camera permission was denied. Please allow camera access in your browser settings and try again.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          friendlyMessage = "No camera hardware was found on this device.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          friendlyMessage = "Camera is already in use by another tab or application.";
        } else if (!window.isSecureContext) {
          friendlyMessage = "Camera access is blocked because this page is not served over a secure connection (HTTPS or localhost).";
        } else {
          friendlyMessage = `Failed to open camera: ${err.message || err.name || "Unknown error"}`;
        }
        
        setCameraError(friendlyMessage);
      }
    }

    if (!capturedImage) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage, facingMode]);

  // Handle shutter click
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video stream or fall back
    const videoWidth = video.videoWidth || video.clientWidth || 640;
    const videoHeight = video.videoHeight || video.clientHeight || 480;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply CSS filter to canvas drawing context
    const activeFilterStyle = FILTERS.find((f) => f.id === selectedFilter)?.style || "none";
    ctx.filter = activeFilterStyle;
    
    // Mirror the capture horizontally if using front/user camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Reset canvas transform matrix and filters to default
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = "none";
    
    // Convert to Data URL for preview (slightly higher quality 0.85)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);

    // Convert to Blob/File object for uploading
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `snap_${Date.now()}.jpg`, { type: "image/jpeg" });
        setImageFile(file);
      }
    }, "image/jpeg", 0.85);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setImageFile(null);
    setShowPaceSelector(false);
    setCaption("");
  };

  const handleSendToPace = async (pace) => {
    if (!imageFile || isUploading) return;
    setIsUploading(true);

    try {
      const activeFilterLabel = FILTERS.find((f) => f.id === selectedFilter)?.label || "Normal";

      if (onCreateMemory) {
        await onCreateMemory({
          type: "photo",
          caption: caption || "Live snap",
          mood: `${pace.mood} · ${activeFilterLabel}`,
          file: imageFile,
          previewUrl: capturedImage
        });
      } else {
        console.warn("onCreateMemory handler is missing! Camera post will not sync.");
      }
      
      // Navigate to the Pace timeline to see the new memory
      setActivePace(pace);
      setView("timeline");
    } catch (error) {
      console.error("Failed to upload snap:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 bg-black flex flex-col font-sans"
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      {/* Hidden canvas for extracting frame */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Camera Feed / Preview / Error diagnostics Area */}
      <div className="relative flex-1 bg-black overflow-hidden rounded-b-[2rem]">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-start overflow-y-auto no-scrollbar p-6 pt-20 text-center text-white/70">
            <div className="bg-red-500/10 border border-red-500/20 rounded-full p-4 mb-4">
              <ShieldAlert size={36} className="text-red-400" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">Camera Access Blocked</h3>
            <p className="mb-6 text-sm text-white/60 max-w-sm leading-relaxed">{cameraError}</p>

            {/* Diagnostics Panel */}
            <div className="w-full max-w-sm bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left mb-6 backdrop-blur-md">
              <h4 className="text-xs uppercase tracking-[0.1em] text-white/45 font-bold mb-3">System Diagnostics</h4>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Secure Context (HTTPS/Localhost)</span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${diagnostics.isSecureContext ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 font-bold'}`}>
                    {diagnostics.isSecureContext ? "YES" : "NO"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Camera API Available</span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${diagnostics.hasMediaDevices ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {diagnostics.hasMediaDevices ? "YES" : "NO"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Permission Status</span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase ${
                    diagnostics.permissionState === 'granted' ? 'bg-emerald-500/10 text-emerald-400' :
                    diagnostics.permissionState === 'denied' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {diagnostics.permissionState}
                  </span>
                </div>
                {diagnostics.exactError && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex flex-col gap-1">
                    <span className="text-white/40 uppercase tracking-wider text-[9px] font-bold">Exact Browser Error</span>
                    <span className="font-mono text-red-300 text-[10px] break-all bg-red-500/5 p-2 rounded border border-red-500/10">
                      {diagnostics.exactError.name}: {diagnostics.exactError.message}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 w-full max-w-sm">
              <button
                onClick={() => {
                  setCameraError(null);
                  setCapturedImage(null);
                }}
                className="w-full rounded-full bg-white text-black py-3 font-semibold transition active:scale-95 text-sm"
              >
                Try Again
              </button>
              
              <label className="w-full rounded-full bg-white/10 py-3 font-semibold text-white transition active:scale-95 cursor-pointer text-sm hover:bg-white/15">
                Upload from Device Instead
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setCapturedImage(URL.createObjectURL(file));
                      setCameraError(null);
                    }
                  }}
                />
              </label>
            </div>
            
            {!diagnostics.isSecureContext && (
              <div className="mt-6 flex items-start gap-2 max-w-xs text-left bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Browsers strictly block camera permissions on non-secure connections. To test on mobile over your local network, run a secure tunnel like <code className="bg-white/5 px-1 rounded text-white font-mono">npx localtunnel --port 5173</code>.
                </p>
              </div>
            )}
          </div>
        ) : !capturedImage ? (
          <video
            ref={setVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{
              transform: facingMode === "user" ? "scaleX(-1) scale(1.02)" : "scale(1.02)",
              filter: FILTERS.find((f) => f.id === selectedFilter)?.style || "none"
            }}
          />
        ) : (
          <img src={capturedImage} alt="Snap preview" className="h-full w-full object-cover" />
        )}

        {/* Real-time Filter Carousel overlay */}
        {!capturedImage && !cameraError && (
          <div className="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold bg-[#1a1a1a]/80 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/5 shadow-soft">
              FILTERS
            </span>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar w-full px-6 justify-start md:justify-center py-1">
              {FILTERS.map((f) => {
                const isActive = selectedFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition duration-200 active:scale-95 whitespace-nowrap ${
                      isActive
                        ? "bg-[#f4eee3] text-black border-transparent shadow-[0_0_12px_rgba(244,238,227,0.4)]"
                        : "bg-black/40 text-[#f4eee3]/60 border-white/10 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Top UI Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent z-10">
          <button
            onClick={() => setView("home")}
            className="grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition active:scale-90"
            title="Back to home"
          >
            <ChevronLeft size={24} />
          </button>
          
          {!capturedImage && !cameraError && (
            <button
              onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
              className="grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition active:scale-90"
              title="Flip camera"
            >
              <RefreshCw size={20} />
            </button>
          )}

          {capturedImage && (
            <button
              onClick={handleRetake}
              className="grid h-11 w-11 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md transition active:scale-90"
              title="Retake photo"
            >
              <RefreshCw size={20} />
            </button>
          )}
        </div>
        
        {/* Caption Input Overlay (When previewing) */}
        {capturedImage && (
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 px-6 z-10">
            <input
              type="text"
              className="w-full bg-black/40 backdrop-blur-md text-white text-center text-xl font-medium px-4 py-3 rounded-2xl border border-white/20 outline-none placeholder:text-white/60 focus:bg-black/60 transition shadow-glow"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="h-32 bg-black flex items-center justify-center px-6 relative">
        {!capturedImage && !cameraError ? (
          /* Shutter Button */
          <button
            onClick={handleCapture}
            className="h-20 w-20 rounded-full border-[4px] border-white flex items-center justify-center transition active:scale-90"
            title="Take Photo"
          >
            <div className="h-16 w-16 bg-white rounded-full transition active:bg-white/80" />
          </button>
        ) : capturedImage ? (
          /* Send Action */
          <div className="w-full flex justify-end">
            <button
              onClick={() => setShowPaceSelector(true)}
              className="flex items-center gap-2 bg-amber-400 text-black px-6 py-3 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(251,191,36,0.6)] active:scale-95 transition"
            >
              Send To <Send size={20} className="ml-1" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Bottom Sheet Pace Selector */}
      <AnimatePresence>
        {showPaceSelector && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close Overlay Area */}
            <div className="flex-1" onClick={() => setShowPaceSelector(false)} />
            
            {/* Sheet Content */}
            <motion.div
              className="bg-[#1a1a1a] rounded-t-[2rem] p-6 pb-12 border-t border-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Send to Pace</h3>
                <button onClick={() => setShowPaceSelector(false)} className="text-white/60 p-2">
                  <X size={24} />
                </button>
              </div>

              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="h-8 w-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <p className="text-white font-medium">Developing Memory...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                  {paces.filter(p => !p.archivedAt).map((pace) => (
                    <button
                      key={pace.id}
                      onClick={() => handleSendToPace(pace)}
                      className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl hover:bg-white/10 active:scale-[0.98] transition text-left border border-white/5"
                    >
                      <img src={pace.cover} alt={pace.title} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="font-bold text-white text-base">{pace.title}</p>
                        <p className="text-white/50 text-xs uppercase tracking-wider">{pace.mood}</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                        <Send size={14} />
                      </div>
                    </button>
                  ))}
                  
                  {paces.filter(p => !p.archivedAt).length === 0 && (
                    <p className="text-center text-white/50 py-8">No active Paces to send to.</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
