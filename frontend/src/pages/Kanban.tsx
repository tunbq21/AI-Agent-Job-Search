import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, ArrowRight, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Application {
  id: number;
  job_id: number;
  status: string;
  match_percentage: number;
  match_reason: string;
  cover_letter: string | null;
}

const COLUMNS = ['Saved', 'Applied', 'Interviewing', 'Offered'];

const Kanban = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/applications/');
      setApps(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId: number, currentStatus: string) => {
    const currentIndex = COLUMNS.indexOf(currentStatus);
    if (currentIndex < COLUMNS.length - 1) {
      const nextStatus = COLUMNS[currentIndex + 1];
      try {
        await axios.put(`http://localhost:8000/applications/${appId}/status`, { status: nextStatus });
        fetchApps();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const generateCoverLetter = async (appId: number) => {
    try {
      await axios.post(`http://localhost:8000/applications/${appId}/generate_cover_letter`);
      fetchApps();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteApp = async (appId: number) => {
    try {
      await axios.delete(`http://localhost:8000/applications/${appId}`);
      setApps(apps.filter(a => a.id !== appId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-surface-border border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-auto h-full flex flex-col">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-content-strong mb-2 tracking-tight">Application Tracker</h1>
        <p className="text-content-muted">Manage your job applications and generate AI Cover Letters.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden">
        {COLUMNS.map((col) => {
          const colApps = apps.filter((a) => a.status === col);
          
          return (
            <div key={col} className="bg-surface-alt border border-surface-border rounded-2xl flex flex-col h-full overflow-hidden shadow-sm">
              <div className="p-4 border-b border-surface-border bg-surface-alt">
                <h3 className="font-bold text-content-strong flex items-center justify-between">
                  {col}
                  <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full text-xs font-bold">
                    {colApps.length}
                  </span>
                </h3>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
                {colApps.map((app) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={app.id} 
                    className="bg-surface border border-surface-border p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all duration-300 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                        {app.match_percentage}% Match
                      </span>
                      <div className="flex gap-2 text-content-muted items-center">
                        <button onClick={() => deleteApp(app.id)} className="hover:text-red-500"><Trash2 size={14} /></button>
                        <span><Clock size={14} /></span>
                      </div>
                    </div>
                    <h4 className="font-bold text-content-strong mb-1 text-sm">Job #{app.job_id}</h4>
                    <p className="text-xs text-content-muted mb-4 line-clamp-2 leading-relaxed">{app.match_reason}</p>
                    
                    {app.cover_letter ? (
                      <div className="mb-4 text-xs text-primary bg-primary/10 border border-primary/30 p-2.5 rounded-xl flex gap-2 items-start font-semibold">
                        <CheckCircle size={14} className="shrink-0 mt-0.5 text-primary" />
                        <span className="line-clamp-2">Cover Letter Generated</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => generateCoverLetter(app.id)}
                        className="w-full mb-4 text-xs bg-surface-alt hover:bg-surface-alt/50 text-content-strong border border-surface-border py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                      >
                        <FileText size={14} /> Generate Cover Letter
                      </button>
                    )}

                    {col !== 'Offered' && (
                      <button 
                        onClick={() => updateStatus(app.id, col)}
                        className="w-full text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Move forward <ArrowRight size={14} />
                      </button>
                    )}
                  </motion.div>
                ))}
                
                {colApps.length === 0 && (
                  <div className="text-center text-content-muted text-xs py-8 border border-dashed border-surface-border rounded-xl bg-surface/50">
                    No applications
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Kanban;
