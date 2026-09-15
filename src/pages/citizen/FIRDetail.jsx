import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CaseTimeline from '../../components/shared/CaseTimeline';
import { formatDate } from '../../utils/helpers';
import { 
  ArrowLeft, Download, MapPin, Calendar, User, 
  FileText, ShieldCheck, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';

export default function FIRDetail() {
  const { id } = useParams();
  const [fir, setFir] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timelineStages, setTimelineStages] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const fetchFirAndCase = async () => {
      try {
        const token = localStorage.getItem('anveshak_token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        
        // 1. Fetch FIR details
        const res = await fetch(`${API_URL}/fir/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if(res.ok) {
          const f = data.fir;
          const statusMap = {
            'FILED': { step: 1 },
            'UNDER_INVESTIGATION': { step: 2 },
            'RESOLVED': { step: 5 },
          };
          const statusStep = (statusMap[f.status] || statusMap['FILED']).step;
          setFir({
            id: f._id,
            firId: f.firNumber,
            title: `${f.category || 'General'} FIR`,
            status: f.status || 'FILED',
            date: f.incidentDate || f.createdAt,
            location: f.incidentLocation || 'Unknown',
            officer: 'Assigned by Dept',
            station: 'Local Jurisdiction',
            type: f.category || 'General',
            description: f.incidentDescription || 'No description',
            complainant: f.complainant || 'Citizen'
          });

          // Default fallback timeline if no case exists yet
          let stages = [
            { date: formatDate(f.incidentDate || f.createdAt), event: 'FIR Registered', description: 'Your FIR has been successfully registered.' },
            { date: statusStep > 1 ? 'Updated' : 'Pending', event: 'Under Investigation', description: 'Investigating Officer collects evidence and statements.' },
            { date: statusStep > 3 ? 'Updated' : 'Pending', event: 'Chargesheet Filed', description: 'Formal charges filed in court.' },
            { date: statusStep > 4 ? 'Updated' : 'Pending', event: 'Disposed', description: 'Case resolved.' }
          ];
          let stepIdx = statusStep - 1;

          // 2. Fetch all cases for citizen to find the one linked to this FIR
          const caseListRes = await fetch(`${API_URL}/case`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (caseListRes.ok) {
            const caseList = await caseListRes.json();
            const cases = caseList.cases || caseList;
            const matchedCase = cases.find(c => c.firId && (c.firId._id === id || c.firId === id));
            
            if (matchedCase) {
               // 3. Fetch exact timeline for matched case
               const timelineRes = await fetch(`${API_URL}/case/${matchedCase.caseId}/timeline`, {
                 headers: { Authorization: `Bearer ${token}` }
               });
               if (timelineRes.ok) {
                 const tData = await timelineRes.json();
                 if (tData.timeline && tData.timeline.length > 0) {
                   stages = tData.timeline.map(t => ({
                     date: formatDate(t.timestamp),
                     event: t.action.replace(/_/g, ' '),
                     description: t.description || 'System Update'
                   }));
                   stepIdx = stages.length - 1;
                 }
               }
            }
          }
          
          setTimelineStages(stages);
          setCurrentStepIndex(stepIdx);
          
        } else {
          setError(data.message || 'Error fetching FIR');
        }
      } catch(e) {
        console.error(e);
        setError('Server error');
      } finally {
        setLoading(false);
      }
    };
    fetchFirAndCase();
  }, [id]);

  const statusMap = {
    'FILED': { step: 1, color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Filed' },
    'UNDER_INVESTIGATION': { step: 2, color: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Under Investigation' },
    'RESOLVED': { step: 5, color: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Disposed' },
  };

  if(loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-navy" /></div>;
  if(error) return <div className="p-8 text-red-600 font-bold">{error}</div>;
  if(!fir) return <div className="p-8">Not found</div>;

  const currentStatus = statusMap[fir.status] || statusMap['FILED'];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Link to="/citizen/firs" className="inline-flex items-center text-sm font-bold text-navy hover:text-navy/80 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to List
        </Link>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-charcoal rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">
          <Download size={16} />
          Download PDF
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Top Banner */}
        <div className="bg-navy p-6 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-sm">
                {fir.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 bg-white text-navy shadow-sm`}>
                <div className={`w-1.5 h-1.5 rounded-full ${currentStatus.color}`}></div>
                {currentStatus.label}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif mb-2">{fir.firId}</h1>
            <p className="text-navy-100 flex items-center gap-2">
              <Calendar size={16} /> Registered on {formatDate(fir.date)}
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row">
          
          {/* Left Column: Details */}
          <div className="flex-1 p-6 md:p-10 border-r border-gray-100">
            
            <div className="space-y-10">
              
              <section>
                <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                  <FileText size={16} /> Incident Description
                </h3>
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                  <p className="text-charcoal leading-relaxed whitespace-pre-wrap">{fir.description}</p>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                    <User size={16} /> Complainant Details
                  </h3>
                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-bold text-charcoal">{fir.complainant}</p>
                  </div>
                </section>
                
                <section>
                  <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                    <MapPin size={16} /> Jurisdiction
                  </h3>
                  <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Police Station</p>
                    <p className="font-bold text-charcoal">{fir.station}</p>
                    <p className="text-xs text-gray-500 mt-3 mb-1">Incident Location</p>
                    <p className="font-bold text-charcoal">{fir.location}</p>
                  </div>
                </section>
              </div>

            </div>
          </div>

          {/* Right Column: Tracking & Timeline */}
          <div className="lg:w-96 flex-shrink-0 bg-gray-50/30">
            
            <div className="p-6 md:p-10 border-b border-gray-100 bg-white">
              <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4">Investigating Officer</h3>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">
                  {fir.officer.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-charcoal">{fir.officer}</p>
                  <p className="text-xs text-gray-500">{fir.station}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 bg-gray-50/30">
              <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-6 flex items-center gap-2">
                <ShieldCheck size={16} /> Case Tracking
              </h3>

              <div className="bg-white rounded-2xl p-6 border border-indigo-50 shadow-sm mb-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-900">
                  <ShieldCheck size={80} />
                </div>
                <h4 className="text-indigo-900 font-bold font-serif text-lg mb-1 relative z-10">Case Progress</h4>
                <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest relative z-10">{Math.round(((currentStepIndex + 1) / timelineStages.length) * 100)}% Complete</div>
                <div className="text-xs text-indigo-400 mt-1 relative z-10">— Stage {currentStepIndex} of {timelineStages.length} —</div>
                
                <div className="w-full bg-indigo-50 rounded-full h-2 mt-4 overflow-hidden relative z-10">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.round(((currentStepIndex + 1) / timelineStages.length) * 100)}%` }}></div>
                </div>
              </div>

              <div className="relative">
                <CaseTimeline 
                  stages={timelineStages} 
                  currentStep={currentStepIndex} 
                  totalStages={timelineStages.length} 
                />
              </div>

              <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Need Help?</h4>
                    <p className="text-xs text-indigo-700 mt-1">
                      If you have additional evidence or information, please visit your local station or contact the IO directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
