import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { 
  ShieldAlert, UserX, AlertTriangle, Search, Car, Home, Building, MoreHorizontal,
  Mic, MicOff, MapPin, UploadCloud, File, Image as ImageIcon, FileText, CheckCircle, Lock, Edit3, X
} from 'lucide-react';

const generateTrackingId = () => {
  return 'FIR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

const LogFIR = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form State
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [files, setFiles] = useState([]);
  const [trackingId, setTrackingId] = useState('');
  const [isWomenSafety, setIsWomenSafety] = useState(false);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Geolocation State
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setDescription((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAutoLocate = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
          setIsLocating(false);
        },
        (error) => {
          console.error(error);
          alert('Could not detect location. Please enter manually.');
          setIsLocating(false);
        }
      );
    } else {
      alert('Geolocation not supported');
      setIsLocating(false);
    }
  };

  const handleFileUpload = (e) => {
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }
    const newFiles = selected.map(f => ({ name: f.name, type: f.type }));
    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (type) => {
    if (type.includes('image')) return <ImageIcon size={20} className="text-saffron" />;
    if (type.includes('pdf')) return <FileText size={20} className="text-alert" />;
    return <File size={20} className="text-navy" />;
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('anveshak_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const payload = {
        complainant: "Citizen",
        incidentDescription: description || "No description",
        incidentDate: incidentDate ? new Date(incidentDate + "T" + (incidentTime || "00:00")) : new Date(),
        incidentLocation: location || "Unknown Location",
        category: (incidentType || "OTHER").toUpperCase().replace(/ /g, "_"),
        isWomenSafety,
      };

      const res = await fetch(`${API_URL}/fir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if(res.ok) {
        // Now automatically create the case for the demo flow
        const caseRes = await fetch(`${API_URL}/case`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ firId: data.fir._id })
        });
        const caseData = await caseRes.json();
        
        if (caseRes.ok) {
          setTrackingId(caseData.case ? caseData.case.caseId : (caseData.caseRecord ? caseData.caseRecord.caseId : data.fir.firNumber));
          setCurrentStep(5);
        } else {
          setTrackingId(data.fir.firNumber);
          setCurrentStep(5);
        }
      } else {
        alert("Failed to submit FIR: " + data.message);
      }
    } catch(e) { console.error(e); alert("Error submitting FIR: " + e.message + " | " + e.stack); }
  };

  const stepLabels = ['Incident', 'Details', 'Location', 'Evidence', 'Review'];

  const incidentTypes = [
    { id: 'theft', label: t('theft') || 'Theft', icon: <ShieldAlert size={32} /> },
    { id: 'assault', label: t('assault') || 'Assault', icon: <UserX size={32} /> },
    { id: 'fraud', label: t('fraud') || 'Fraud / Cyber', icon: <AlertTriangle size={32} /> },
    { id: 'missing', label: t('missing') || 'Missing Person', icon: <Search size={32} /> },
    { id: 'accident', label: t('accident') || 'Accident', icon: <Car size={32} /> },
    { id: 'domestic', label: t('domestic') || 'Domestic Violence', icon: <Home size={32} /> },
    { id: 'property', label: t('property') || 'Property Dispute', icon: <Building size={32} /> },
    { id: 'other', label: t('other') || 'Other', icon: <MoreHorizontal size={32} /> },
  ];

  return (
    <div className="min-h-screen bg-cream pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[
          { label: 'Dashboard', path: '/citizen' },
          { label: 'Log FIR', path: '/citizen/log-fir' }
        ]} />

        {currentStep < 5 && (
          <div className="mb-8 mt-4">
            <h1 className="text-3xl font-bold text-charcoal mb-6">Log New FIR</h1>
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
              <div 
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-navy transition-all duration-300 z-0"
                style={{ width: `${(currentStep / (stepLabels.length - 1)) * 100}%` }}
              ></div>
              {stepLabels.map((label, index) => (
                <div key={index} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    currentStep >= index ? 'bg-navy text-white' : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${currentStep >= index ? 'text-navy' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 min-h-[400px]">
          {/* Step 0: Incident Type */}
          {currentStep === 0 && (
            <div className="animate-fade-in">
              {/* Women FIR toggle - shown at the very start of filing */}
              <div className="mb-6 rounded-xl border border-pink-200 bg-pink-50/70 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold" aria-hidden="true">♀</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal">Women FIR</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Turn this on if you are a woman filing this FIR. It will be routed to the authorized Women FIR section in the officer portal.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={isWomenSafety}
                    aria-label="Mark this FIR as a Women FIR"
                    onClick={() => setIsWomenSafety((prev) => !prev)}
                    className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300 ${
                      isWomenSafety ? 'bg-pink-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        isWomenSafety ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isWomenSafety && (
                  <div className="mt-3 rounded-lg bg-white/80 border border-pink-100 px-3 py-2 text-sm font-medium text-pink-700">
                    ✓ This FIR will appear in the officer portal under Women FIRs.
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-charcoal mb-6">What type of incident are you reporting?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {incidentTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setIncidentType(type.id)}
                    className={`p-6 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:shadow-md ${
                      incidentType === type.id 
                        ? 'border-navy bg-navy-50 text-navy' 
                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                    aria-label={`Select ${type.label}`}
                  >
                    <div className={incidentType === type.id ? 'text-navy' : 'text-gray-500'}>
                      {type.icon}
                    </div>
                    <span className="font-semibold text-sm text-center">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Description */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-charcoal mb-6">Incident Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Incident</label>
                  <input 
                    type="date" 
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time of Incident (approx)</label>
                  <input 
                    type="time" 
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                  <span>Description</span>
                  <button 
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors ${isListening ? 'text-alert' : 'text-navy'}`}
                  >
                    {isListening ? (
                      <><MicOff size={16} className="animate-pulse" /> Stop Listening...</>
                    ) : (
                      <><Mic size={16} /> Use Voice Typing</>
                    )}
                  </button>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="6"
                  placeholder="Please describe the incident in detail..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-navy focus:border-transparent outline-none resize-none"
                ></textarea>
                {isListening && (
                  <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="flex h-12 w-12 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-12 w-12 bg-alert opacity-20"></span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-charcoal mb-6">Incident Location</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address / Landmark</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter the complete address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-gray-400 text-sm font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoLocate}
                  disabled={isLocating}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-navy text-navy rounded-lg hover:bg-navy-50 transition-colors font-semibold"
                >
                  <MapPin size={20} />
                  {isLocating ? 'Detecting...' : 'Auto-detect my location'}
                </button>

                <div className="h-48 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center relative overflow-hidden">
                  {coordinates ? (
                    <div className="text-center">
                      <MapPin size={32} className="text-alert mx-auto mb-2" />
                      <p className="font-semibold text-charcoal">Location Detected</p>
                      <p className="text-sm text-gray-500">
                        Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                      <p>Map Preview Unavailable</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Evidence */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-charcoal">Upload Evidence</h2>
                <div className="flex items-center gap-1 bg-green-50 text-forest px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
                  <Lock size={12} />
                  <span>End-to-End Encrypted</span>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-navy hover:bg-navy-50 transition-colors relative">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*,.pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Upload files"
                />
                <UploadCloud size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="font-semibold text-charcoal mb-1">Drag & Drop files here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse from your device</p>
                <p className="text-xs text-gray-400">Supports Images, Videos, PDF (Max 5 files)</p>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Files ({files.length}/5)</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <span className="text-sm font-medium text-charcoal truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                        </div>
                        <button 
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-alert transition-colors"
                          aria-label="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-charcoal mb-6">Review Information</h2>
              <div className="space-y-4">
                
                {/* Review Incident Type */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Incident Type</h3>
                    <button onClick={() => setCurrentStep(0)} className="text-navy hover:text-saffron transition-colors" aria-label="Edit Type"><Edit3 size={16} /></button>
                  </div>
                  <p className="font-semibold text-charcoal capitalize">{incidentType || 'Not specified'}</p>
                </div>

                {/* Review Details */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Details</h3>
                    <button onClick={() => setCurrentStep(1)} className="text-navy hover:text-saffron transition-colors" aria-label="Edit Details"><Edit3 size={16} /></button>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Date & Time:</p>
                    <p className="text-charcoal">{incidentDate || 'N/A'} at {incidentTime || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                    <p className="text-charcoal whitespace-pre-wrap">{description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Review Location */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Location</h3>
                    <button onClick={() => setCurrentStep(2)} className="text-navy hover:text-saffron transition-colors" aria-label="Edit Location"><Edit3 size={16} /></button>
                  </div>
                  <p className="text-charcoal">{location || 'Not specified'}</p>
                </div>

                {/* Review Evidence */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Evidence ({files.length} files)</h3>
                    <button onClick={() => setCurrentStep(3)} className="text-navy hover:text-saffron transition-colors" aria-label="Edit Evidence"><Edit3 size={16} /></button>
                  </div>
                  {files.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-charcoal">
                      {files.map((file, i) => <li key={i}>{file.name}</li>)}
                    </ul>
                  ) : (
                    <p className="text-charcoal text-sm">No files uploaded.</p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <div className="animate-fade-in text-center py-10">
              <CheckCircle size={80} className="text-forest mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-charcoal mb-2">FIR Filed Successfully!</h2>
              <p className="text-gray-600 mb-8">Your report has been securely transmitted to the jurisdiction station.</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-sm mx-auto mb-8">
                <p className="text-sm text-gray-500 font-medium mb-1">Your Tracking ID</p>
                <p className="text-2xl font-bold text-navy tracking-wider mb-6">{trackingId}</p>
                
                {/* Mock QR Code */}
                <div className="w-40 h-40 bg-white border-2 border-gray-200 rounded-lg mx-auto p-2 flex items-center justify-center">
                  <div className="w-full h-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-xs text-gray-400 break-all text-center p-2 font-mono">
                    {trackingId}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-navy text-navy rounded-lg font-bold hover:bg-navy-50 transition-colors flex items-center justify-center gap-2">
                  <FileText size={20} /> Download FIR Copy
                </button>
                <button 
                  onClick={() => navigate('/citizen/view-firs')}
                  className="w-full sm:w-auto px-6 py-3 bg-navy text-white rounded-lg font-bold hover:bg-opacity-90 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <FileText size={20} /> View All FIRs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 5 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                currentStep === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white border-2 border-gray-300 text-charcoal hover:bg-gray-50 hover:border-navy'
              }`}
            >
              Previous
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                disabled={currentStep === 0 && !incidentType} // basic validation
                className={`px-6 py-3 rounded-lg font-bold transition-all shadow-sm ${
                  currentStep === 0 && !incidentType
                    ? 'bg-navy opacity-50 cursor-not-allowed text-white'
                    : 'bg-navy text-white hover:bg-opacity-90 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-forest text-white rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2"
              >
                <CheckCircle size={20} /> Submit FIR
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogFIR;
