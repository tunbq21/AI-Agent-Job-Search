import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Link as LinkIcon, RefreshCw, Briefcase, ChevronDown, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedResume {
  id: number;
  filename: string;
}

interface SavedJob {
  id: number;
  job_id: number;
  job: {
    title: string;
    company: string;
    url: string;
  };
}

const CoverLetterAgent = () => {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [savedApplications, setSavedApplications] = useState<SavedJob[]>([]);
  
  const [selectedCvId, setSelectedCvId] = useState<number | ''>('');
  const [inputType, setInputType] = useState<'url' | 'saved'>('saved');
  const [jobUrl, setJobUrl] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  
  const [wordCount, setWordCount] = useState('Ngắn gọn (~300 từ)');

  const WORD_COUNT_OPTIONS = [
    'Rất ngắn gọn (~150 từ)',
    'Ngắn gọn (~300 từ)',
    'Trung bình (~500 từ)',
    'Chi tiết (~1000 từ)',
    'Rất chi tiết (~1500 từ)',
    'Cực kỳ chi tiết (>2000 từ)'
  ];
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resumesRes, appsRes, jobsRes] = await Promise.all([
        axios.get('http://localhost:8000/resumes/'),
        axios.get('http://localhost:8000/applications/'),
        axios.get('http://localhost:8000/jobs/')
      ]);
      
      setResumes(resumesRes.data);
      if (resumesRes.data.length > 0) setSelectedCvId(resumesRes.data[0].id);

      // Merge applications with job details since the application endpoint might not return full job object
      // Actually, applications endpoint just returns the application. We need job title.
      // For simplicity, we just use the jobs list for saved jobs
      // Since saving a job creates an application.
      
      const apps = appsRes.data;
      const jobs = jobsRes.data;
      
      const mergedApps = apps.map((app: any) => {
        const job = jobs.find((j: any) => j.id === app.job_id);
        return {
          ...app,
          job: job || { title: 'Unknown', company: 'Unknown', url: '' }
        };
      });
      
      setSavedApplications(mergedApps);
      if (mergedApps.length > 0) setSelectedJobId(mergedApps[0].job_id);
      
    } catch (err) {
      console.error(err);
    }
  };

  const generateCoverLetter = async () => {
    if (!selectedCvId) {
      setError('Please select a CV.');
      return;
    }
    if (inputType === 'url' && !jobUrl) {
      setError('Please enter a job URL.');
      return;
    }
    if (inputType === 'saved' && !selectedJobId) {
      setError('Please select a saved job.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCoverLetter(null);

    try {
      const payload: any = { cv_id: selectedCvId, word_count: wordCount };
      if (inputType === 'url') {
        payload.job_url = jobUrl;
      } else {
        payload.job_id = selectedJobId;
      }

      const res = await axios.post('http://localhost:8000/agents/cover-letter', payload);
      setCoverLetter(res.data.cover_letter);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate cover letter.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-content-strong mb-2 tracking-tight">Cover Letter Agent</h1>
        <p className="text-content-muted">Let AI analyze the job requirements and your CV to write a highly tailored cover letter.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Step 1: Select CV */}
        <div className="glass p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-content-strong mb-4 flex items-center gap-2">
            <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
            Select Your CV
          </h2>
          
          <div className="relative">
            <select
              value={selectedCvId}
              onChange={(e) => setSelectedCvId(Number(e.target.value))}
              className="w-full bg-surface border border-surface-border text-content-strong pl-4 pr-10 py-3 rounded-xl appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium cursor-pointer shadow-sm"
            >
              <option value="" disabled>-- Choose a CV --</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>{r.filename}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" size={18} />
          </div>
          {resumes.length === 0 && (
            <p className="text-red-500 text-xs mt-2 font-medium">No CVs found. Please upload one in Settings.</p>
          )}
        </div>

        {/* Step 2: Job Info */}
        <div className="glass p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-content-strong mb-4 flex items-center gap-2">
            <span className="bg-secondary/20 text-secondary w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
            Job Information
          </h2>
          
          <div className="flex gap-2 mb-4 p-1 bg-surface-alt rounded-xl border border-surface-border">
            <button
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${inputType === 'saved' ? 'bg-surface shadow-sm text-content-strong' : 'text-content-muted hover:text-content-strong'}`}
              onClick={() => setInputType('saved')}
            >
              Saved Jobs
            </button>
            <button
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${inputType === 'url' ? 'bg-surface shadow-sm text-content-strong' : 'text-content-muted hover:text-content-strong'}`}
              onClick={() => setInputType('url')}
            >
              Job URL
            </button>
          </div>

          {inputType === 'saved' ? (
            <div className="relative">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(Number(e.target.value))}
                className="w-full bg-surface border border-surface-border text-content-strong pl-4 pr-10 py-3 rounded-xl appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium cursor-pointer shadow-sm"
              >
                <option value="" disabled>-- Choose a Saved Job --</option>
                {savedApplications.map(app => (
                  <option key={app.job_id} value={app.job_id}>{app.job.title} at {app.job.company}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" size={18} />
              {savedApplications.length === 0 && (
                <p className="text-red-500 text-xs mt-2 font-medium">No saved jobs found. Save some from the Find Jobs page.</p>
              )}
            </div>
          ) : (
            <div className="relative flex items-center">
              <LinkIcon className="absolute left-3 text-content-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Paste Job URL here..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="w-full bg-surface border border-surface-border text-content-strong pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Step 3: Options */}
        <div className="glass p-6 rounded-2xl md:col-span-2">
          <h2 className="text-lg font-bold text-content-strong mb-4 flex items-center gap-2">
            <span className="bg-tertiary/20 text-tertiary w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
            Customize Letter Length
          </h2>
          <div className="relative">
             <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted" size={18} />
             <select
               value={wordCount}
               onChange={(e) => setWordCount(e.target.value)}
               className="w-full bg-surface border border-surface-border text-content-strong pl-12 pr-10 py-3 rounded-xl appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium cursor-pointer shadow-sm"
             >
                {WORD_COUNT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
             </select>
             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-10">
        <button
          onClick={generateCoverLetter}
          disabled={isGenerating || resumes.length === 0 || (inputType === 'saved' && savedApplications.length === 0)}
          className="bg-primary hover:bg-primary/90 text-quaternary px-8 py-4 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="animate-spin" size={20} /> Generating Magic...
            </>
          ) : (
            <>
              <FileText size={20} /> Generate Cover Letter
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl mb-8 font-medium text-center">
          {error}
        </div>
      )}

      <AnimatePresence>
        {coverLetter && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-2xl relative"
          >
            <div className="flex justify-between items-center border-b border-surface-border pb-4 mb-6">
              <h2 className="text-2xl font-bold text-content-strong flex items-center gap-2">
                <FileText className="text-primary" /> Your Cover Letter
              </h2>
              <button
                onClick={copyToClipboard}
                className="bg-surface hover:bg-surface-alt border border-surface-border text-content-strong px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all"
              >
                Copy to Clipboard
              </button>
            </div>
            
            <div className="bg-surface-alt p-6 rounded-xl border border-surface-border shadow-sm text-content-strong whitespace-pre-wrap leading-relaxed text-[15px]">
              {coverLetter}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CoverLetterAgent;
