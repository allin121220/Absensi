import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [formData, setFormData] = useState({
    name: "",
    location: "kantor",
  });
  
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasCamera, setHasCamera] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera
  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
      } catch (err) {
        console.error("Kamera tidak tersedia:", err);
        setHasCamera(false);
      }
    }

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nama wajib diisi";
    return newErrors;
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Resize canvas untuk efisiensi
      canvas.width = 300;
      canvas.height = 200;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const dataURL = canvas.toDataURL('image/png');
      setPhoto(dataURL);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length === 0 && photo) {
      // Prepare data
      const data = {
        ...formData,
        photo: photo,
        timestamp: new Date().toISOString()
      };
      
      // Submit ke Google Sheets via Apps Script
      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbylB5rKGO6rFg4d8O28TZvP22x4qb7WC9DyGkGowv3z5Q5QzgqIA_wtos5_6C3gTdl6/exec ', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (response.ok) {
          setSubmitted(true);
          setTimeout(() => setSubmitted(false), 3000);
          // Reset form
          setFormData({ name: "", location: "kantor" });
          setPhoto(null);
        } else {
          alert('Gagal mengirim absensi. Silakan coba lagi.');
        }
      } catch (error) {
        console.error('Terjadi kesalahan:', error);
        alert('Kesalahan jaringan. Silakan coba lagi nanti.');
      }
    } else {
      if (!photo) {
        alert("Silakan ambil foto sebelum mengirim");
      }
      setErrors(validationErrors);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden transform transition-all hover:scale-[1.01] duration-300 border border-gray-200">
          <div className="px-6 py-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Absensi Karyawan</h2>
            
            {submitted ? (
              <div className="text-center py-6">
                <svg
                  className="mx-auto h-12 w-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                <p className="mt-2 text-lg font-medium text-gray-800">Berhasil!</p>
                <p className="text-gray-600 mt-1">Absensi Anda telah direkam.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-6">
                  {/* Webcam Section */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      {hasCamera ? "Ambil Foto" : "Kamera Tidak Tersedia"}
                    </label>
                    
                    <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
                      {hasCamera ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          <canvas
                            ref={canvasRef}
                            className="hidden"
                          />
                        </>
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-500">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      )}
                      
                      {photo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <img 
                            src={photo} 
                            alt="Captured" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    
                    {hasCamera && (
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        {photo ? "Ambil Ulang Foto" : "Ambil Foto"}
                      </button>
                    )}
                  </div>

                  {/* Name Input */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200`}
                      placeholder="Masukkan nama Anda"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  {/* Location Select */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Lokasi Absensi
                    </label>
                    <select
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="kantor">Kantor</option>
                      <option value="rumah">Rumah</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Submit Absensi
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 text-center text-sm text-gray-500 border-t border-gray-200">
            Data disimpan otomatis ke Spreadsheet Google
          </div>
        </div>
      </div>
    </div>
  );
}