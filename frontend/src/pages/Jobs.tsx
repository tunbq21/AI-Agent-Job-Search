import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, DollarSign, ExternalLink, Briefcase, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [sessionId]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const url = sessionId ? `http://localhost:8000/jobs/?session_id=${sessionId}` : 'http://localhost:8000/jobs/';
      const res = await axios.get(url);
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveToKanban = async (job: Job) => {
    try {
      await axios.post('http://localhost:8000/applications/', {
        job_id: job.id,
        match_percentage: 85,
        match_reason: 'Manually saved from Find Jobs search page.'
      });
      toast.success(`Đã lưu "${job.title}" vào Kanban!`);
    } catch (err) {
      console.error(err);
      toast.error('Không thể lưu công việc.');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Đã copy link!');
  };

  const deleteJob = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/jobs/${id}`);
      setJobs(jobs.filter(j => j.id !== id));
      toast.success('Đã xóa công việc khỏi danh sách!');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa công việc.');
    }
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearchingJobs(true);
    const searchPromise = axios.post('http://localhost:8000/jobs/search-by-query', {
      query: searchQuery
    });
    
    toast.promise(searchPromise, {
      loading: 'AI đang lùng sục khắp internet để tìm job cho bạn... Vui lòng đợi nhé!',
      success: 'Tìm kiếm hoàn tất!',
      error: 'Lỗi khi tìm kiếm job. Vui lòng thử lại.',
    });

    try {
      await searchPromise;
      // Fetch updated list of jobs after search
      fetchJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingJobs(false);
    }
  };

  const filteredJobs = jobs; // We remove local filters to keep it simple and focused on the AI search as requested

  return (
    <div className="w-full max-w-none mx-auto px-4 md:px-8">
      <header className="mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-content-strong mb-2 tracking-tight">Find Jobs</h1>
          <p className="text-content-muted">Discover your next career opportunity.</p>
        </div>
      </header>

      {/* AI Conversational Search */}
      <div className="glass p-8 rounded-3xl mb-10 shadow-sm border border-primary/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <h2 className="text-2xl font-extrabold text-content-strong mb-6 relative z-10 flex items-center gap-2">
          <span className="text-3xl">✨</span> AI Job Finder
        </h2>
        <div className="flex flex-col gap-4 relative z-10">
          <div className="relative w-full">
            <textarea 
              placeholder="Bạn muốn tìm công việc như thế nào? Ví dụ: 'Tìm cho tôi các job AI engineer có yêu cầu agency, lương trên 2000$, khu vực Hồ Chí Minh hoặc Remote...'" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAISearch();
                }
              }}
              className="w-full bg-surface/80 backdrop-blur-sm border-2 border-surface-border hover:border-primary/50 text-content-strong px-6 py-5 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all text-lg shadow-inner resize-none min-h-[120px]"
              disabled={isSearchingJobs}
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handleAISearch}
              disabled={isSearchingJobs || !searchQuery.trim()}
              className={`md:w-auto w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary-hover hover:to-blue-700 text-white px-10 py-5 rounded-2xl font-extrabold text-lg transition-all shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-3 hover:-translate-y-1 ${isSearchingJobs ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isSearchingJobs ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Search className="w-6 h-6" />
              )}
              {isSearchingJobs ? 'Đang săn việc...' : 'Bắt Đầu Tìm Kiếm'}
            </button>
          </div>
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
              <p className="text-content-muted text-sm mt-1">Try going to your Profile to perform a new search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    <a href={job.url.startsWith('http') ? job.url : `https://${job.url}`} target="_blank" rel="noreferrer" title="Open Link" className="w-10 h-10 bg-surface hover:bg-surface-alt text-content-muted hover:text-content-strong rounded-xl flex items-center justify-center transition-colors border border-surface-border shadow-sm">
                      <ExternalLink size={18} />
                    </a>
                    <button 
                      onClick={() => deleteJob(job.id)}
                      className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center transition-colors border border-red-500/20 shadow-sm cursor-pointer"
                      title="Delete Job"
                    >
                      <Trash2 size={18} />
                    </button>
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
