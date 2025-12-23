
import React, { useState, useCallback, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import DetectionOverlay from './components/DetectionOverlay';
import { DetectedProduct } from './types';

const SAMPLE_VIDEO = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const MAX_FILE_SIZE_MB = 100;

const App: React.FC = () => {
  const [videoSrc, setVideoSrc] = useState<string>(SAMPLE_VIDEO);
  const [detections, setDetections] = useState<DetectedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup effect for blob URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null); // Clear previous errors

    if (!file) {
      // User cancelled selection
      return;
    }

    // 1. Robust Validation: Check if the file is actually a video
    // Some systems might not provide a mime type for rare extensions
    const isVideoMime = file.type.startsWith('video/');
    const hasVideoExtension = /\.(mp4|webm|ogg|mov|mkv)$/i.test(file.name);

    if (!isVideoMime && !hasVideoExtension) {
      setError(`"${file.name}" does not appear to be a supported video format. Please use MP4, WebM, or OGG.`);
      return;
    }

    // 2. Validation: Empty file check
    if (file.size === 0) {
      setError("The selected file is empty (0 bytes). Please upload a valid video file.");
      return;
    }

    // 3. Validation: File size limit (Performance & Browser Stability)
    const maxSizeInBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File is too large (${actualSizeMB}MB). Please select a video smaller than ${MAX_FILE_SIZE_MB}MB to ensure smooth analysis.`);
      return;
    }

    try {
      // Revoke the old URL before creating a new one to free up memory
      if (videoSrc && videoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(videoSrc);
      }

      const url = URL.createObjectURL(file);
      
      // Verification: Test if the URL was actually created
      if (!url) {
        throw new Error("Local URL generation failed.");
      }

      setVideoSrc(url);
      setDetections([]);
      setHasUploaded(true);
      setError(null);
    } catch (err) {
      console.error("Upload Error:", err);
      setError("Encountered a critical error while preparing the video file. The file might be corrupted or in an incompatible format.");
    }
  }, [videoSrc]);

  const clearError = () => setError(null);

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 md:px-10">
      {/* Error Banner */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-bounce-short">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border border-red-400">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
            <div className="flex-1">
              <p className="font-bold text-sm uppercase tracking-tight">Upload Warning</p>
              <p className="text-xs font-medium leading-tight opacity-95">{error}</p>
            </div>
            <button 
              onClick={clearError}
              className="hover:bg-red-600/80 p-2 rounded-full transition-colors flex items-center justify-center"
              aria-label="Close error"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <i className="fas fa-eye text-2xl text-white"></i>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            ShopVision AI
          </h1>
        </div>
        <p className="text-slate-400 max-w-lg">
          Intelligent product discovery. Pause any video to find matching products across major retailers in seconds.
        </p>
      </header>

      {/* Main Player Section */}
      <main className="w-full max-w-5xl">
        <div className="relative mb-8 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative">
            <VideoPlayer 
              src={videoSrc} 
              onDetections={setDetections} 
              onProcessing={setIsProcessing}
              onError={setError}
            />
            <DetectionOverlay 
              products={detections} 
              isProcessing={isProcessing} 
            />
          </div>
        </div>

        {/* Controls and Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-md min-h-[300px] flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-shopping-bag text-blue-500"></i>
                Analysis Results
              </h3>
              
              <div className="flex-1">
                {detections.length === 0 && !isProcessing ? (
                  <div className="h-full flex flex-col items-center justify-center py-10 text-slate-500">
                    <i className="fas fa-pause-circle text-4xl mb-3 block opacity-20"></i>
                    <p className="text-center">Detection begins automatically when the video is paused.<br/>Find a frame with products and stop playback.</p>
                  </div>
                ) : isProcessing ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-slate-700/30 rounded-xl"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {detections.map(product => (
                      <a 
                        key={product.id}
                        href={product.shoppingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 bg-slate-700/40 p-4 rounded-xl hover:bg-slate-700 hover:scale-[1.02] transition-all border border-transparent hover:border-blue-500/50 group"
                      >
                        <div className="bg-blue-600/20 w-12 h-12 rounded-lg flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30">
                          <i className={`fas ${
                            product.category.toLowerCase().includes('fashion') ? 'fa-tshirt' : 
                            product.category.toLowerCase().includes('electronics') ? 'fa-laptop' : 
                            product.category.toLowerCase().includes('home') ? 'fa-couch' : 'fa-tag'
                          }`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{product.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{product.category}</p>
                        </div>
                        <div className="text-blue-500/50 group-hover:text-blue-500 transition-colors">
                          <i className="fas fa-chevron-right"></i>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-400">
                <i className="fas fa-cloud-upload-alt"></i>
                Upload Video
              </h3>
              <div className="space-y-4">
                <label className="block group cursor-pointer">
                  <div className="relative border-2 border-dashed border-slate-700 group-hover:border-blue-500/50 rounded-xl p-4 transition-all bg-slate-900/50 text-center">
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <i className="fas fa-file-video text-2xl text-slate-500 mb-2 block group-hover:text-blue-400 group-hover:scale-110 transition-transform"></i>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">
                      Click to Browse Files
                    </span>
                  </div>
                </label>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-600">Requirements</p>
                  <p className="text-[11px] text-slate-500">• Supported: MP4, WebM, OGG</p>
                  <p className="text-[11px] text-slate-500">• Max Size: {MAX_FILE_SIZE_MB}MB</p>
                  <p className="text-[11px] text-slate-500">• Resolution: 720p+ recommended</p>
                </div>
                {!hasUploaded && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-xs text-blue-400 flex gap-2">
                    <i className="fas fa-lightbulb"></i>
                    <span>Currently viewing demo video. Upload your own to see the AI in action!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-md">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <i className="fas fa-info-circle text-slate-400"></i>
                Instructions
              </h3>
              <ul className="text-xs text-slate-400 space-y-3">
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">1</div>
                  <span>Play video and watch for interesting products.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">2</div>
                  <span><b>Pause</b> to trigger the frame analyzer.</span>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-[10px] font-bold">3</div>
                  <span>Click boxes on screen or links in the list to shop.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-8 border-t border-slate-800/50 w-full max-w-5xl text-center flex flex-col items-center gap-2">
        <div className="flex gap-4 text-slate-500 mb-2">
          <i className="fab fa-react hover:text-blue-400 cursor-help transition-colors"></i>
          <i className="fas fa-microchip hover:text-indigo-400 cursor-help transition-colors"></i>
          <i className="fab fa-google hover:text-red-400 cursor-help transition-colors"></i>
        </div>
        <p className="text-slate-600 text-xs tracking-wide">
          &copy; 2024 SHOPVISION AI • POWERED BY GEMINI 3 FLASH VISION
        </p>
      </footer>

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -8px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
