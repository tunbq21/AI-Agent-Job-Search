import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Clock, Trash2, ArrowRight, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SearchSession {
  id: number;
  created_at: string;
  job_count: number;
}

const History = () => {
  const [sessions, setSessions] = useState<SearchSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/sessions/');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load search history');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this search session? This will remove all jobs found in this session.')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8000/sessions/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
      toast.success('Session deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete session');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="w-full max-w-none mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-content-strong mb-2 tracking-tight">Search History</h1>
        <p className="text-content-muted">View past searches and revisit job recommendations.</p>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-surface-border border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl border border-surface-border">
          <p className="text-content-muted text-lg font-medium">No search history found.</p>
          <p className="text-content-muted text-sm mt-1">Go to your Profile to run a job search!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, idx) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface border border-surface-border p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center hover:shadow-md hover:border-primary/50 transition-all shadow-sm"
            >
              <div className="flex flex-col gap-2 mb-4 md:mb-0">
                <div className="flex items-center gap-2 text-content-strong font-bold text-lg">
                  <Clock size={20} className="text-primary" /> 
                  Search from {formatDate(session.created_at)}
                </div>
                <div className="flex items-center gap-1 text-content-muted text-sm font-medium">
                  <Briefcase size={16} />
                  Found {session.job_count} jobs
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <Link 
                  to={`/jobs?session_id=${session.id}`}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2.5 px-6 rounded-xl font-bold transition-all shadow-sm"
                >
                  View Jobs <ArrowRight size={16} />
                </Link>
                <button 
                  onClick={() => deleteSession(session.id)}
                  className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2.5 rounded-xl transition-all shadow-sm"
                  title="Delete Session"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
