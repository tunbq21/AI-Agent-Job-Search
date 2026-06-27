import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, DollarSign, ExternalLink, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
  source: string;
}

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/jobs/');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const syncJobs = async () => {
    try {
      setSyncing(true);
      await axios.post('http://localhost:8000/jobs/scrape');
      setTimeout(() => {
        fetchJobs();
        setSyncing(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setSyncing(false);
    }
  };

  const saveToKanban = async (job: Job) => {
    try {
      await axios.post('http://localhost:8000/applications/', {
        job_id: job.id,
        match_percentage: 85,
        match_reason: 'Manually saved from Find Jobs search page.'
      });
      alert(`Job "${job.title}" has been saved to your Kanban tracker!`);
    } catch (err) {
      console.error(err);
      alert('Failed to save job to Kanban tracker.');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Job link copied to clipboard!');
  };

  const filteredJobs = jobs.filter(
    (job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(search.toLowerCase()) || 
        job.company.toLowerCase().includes(search.toLowerCase()) ||
        (job.description && job.description.toLowerCase().includes(search.toLowerCase()));
      
      const matchesLocation = 
        !selectedLocation || 
        job.location.toLowerCase().includes(selectedLocation.toLowerCase());
      
      const matchesSource = 
        !selectedSource || 
        job.source.toLowerCase() === selectedSource.toLowerCase();

      // Mock time filter since we don't have posted_at in DB right now
      const matchesTime = selectedTime ? true : true; // In a real app, we'd check job.created_at against selectedTime
        
      return matchesSearch && matchesLocation && matchesSource && matchesTime;
    }
  );

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-content-strong mb-2 tracking-tight">Find Jobs</h1>
          <p className="text-content-muted">Discover your next career opportunity.</p>
        </div>
        <button 
          onClick={syncJobs}
          disabled={syncing}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80 disabled:from-surface-border disabled:to-surface-border disabled:text-content-muted text-quaternary px-6 py-3 rounded-xl font-bold transition-all shadow-md cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
        >
          {syncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Syncing...
            </>
          ) : (
            'Sync Latest Jobs'
          )}
        </button>
      </header>

      {/* Search and Filters */}
      <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 mb-8 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by job title, company, description..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-surface-border text-content-strong pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm shadow-sm"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-surface border border-surface-border text-content-strong px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm shadow-sm font-semibold cursor-pointer"
          >
            <option value="">All Locations</option>
            <option value="Hồ Chí Minh">Hồ Chí Minh</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Remote">Remote</option>
          </select>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-surface border border-surface-border text-content-strong px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm shadow-sm font-semibold cursor-pointer"
          >
            <option value="">All Platforms</option>
            <option value="ITviec">ITviec</option>
            <option value="TopCV">TopCV</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Google Search">Google Search</option>
          </select>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="bg-surface border border-surface-border text-content-strong px-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm shadow-sm font-semibold cursor-pointer"
          >
            <option value="">Any Time</option>
            <option value="24h">Past 24 hours</option>
            <option value="7d">Past week</option>
            <option value="30d">Past month</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-surface-border border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl border border-surface-border">
              <p className="text-content-muted text-lg font-medium">No matching jobs found.</p>
              <p className="text-content-muted text-sm mt-1">Try resetting your filters or click "Sync Latest Jobs".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredJobs.map((job, idx) => (
                <motion.div 
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-surface-alt border border-surface-border p-6 rounded-2xl flex flex-col hover:-translate-y-1 hover:shadow-md hover:border-primary transition-all duration-350 cursor-pointer group shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-center text-xl font-extrabold text-primary shadow-sm">
                      {job.company.charAt(0)}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-3 py-1 rounded-full shadow-sm">
                      {job.source}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-content-strong mb-1 group-hover:text-primary transition-colors leading-tight">{job.title}</h3>
                  <p className="text-content-muted flex items-center gap-2 mb-4 text-sm font-medium">
                    <Briefcase size={16} className="text-content-muted" /> {job.company}
                  </p>

                  {job.description && (
                    <p className="text-content-muted text-xs line-clamp-3 mb-4 bg-surface p-2.5 rounded-lg border border-surface-border font-medium">
                      {job.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2.5 mb-6 flex-grow items-end">
                    <span className="bg-secondary/10 text-secondary border border-secondary/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <MapPin size={13} className="text-secondary" /> {job.location}
                    </span>
                    {job.salary && (
                      <span className="bg-quaternary/10 text-quaternary border border-quaternary/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <DollarSign size={13} className="text-quaternary" /> {job.salary}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3 mt-auto border-t border-surface-border pt-4 w-full">
                    <button 
                      onClick={() => saveToKanban(job)}
                      className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary/80 border border-primary/30 py-2.5 rounded-xl font-bold transition-all text-xs cursor-pointer shadow-sm"
                    >
                      Save Job
                    </button>
                    <button 
                      onClick={() => handleCopyLink(job.url)}
                      className="w-10 h-10 bg-surface hover:bg-surface-alt text-content-muted hover:text-primary rounded-xl flex items-center justify-center transition-colors border border-surface-border shadow-sm cursor-pointer"
                      title="Copy Link"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <a href={job.url} target="_blank" rel="noreferrer" title="Open Link" className="w-10 h-10 bg-surface hover:bg-surface-alt text-content-muted hover:text-content-strong rounded-xl flex items-center justify-center transition-colors border border-surface-border shadow-sm">
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Jobs;
