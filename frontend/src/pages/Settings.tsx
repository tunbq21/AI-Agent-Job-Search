import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, Trash2, RefreshCw, X } from 'lucide-react';
import axios from 'axios';

interface CVAnalysis {
  skills: string[];
  experience_years: number;
  desired_roles: string[];
  summary: string;
}

interface SavedResume {
  id: number;
  filename: string;
  skills: string[];
  experience_years: number;
  desired_roles: string[];
  summary: string;
}

const Settings = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preference, setPreference] = useState('');
  // jobTitle is now an array
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [currentJobInput, setCurrentJobInput] = useState('');
  
  const [location, setLocation] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousFilename, setPreviousFilename] = useState<string | null>(null);
  
  // Saved CVs state
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await axios.get('http://localhost:8000/resumes/');
      setSavedResumes(res.data);
      if (res.data && res.data.length > 0 && !analysis) {
        // Load the latest automatically if no analysis exists
        const latest = res.data[res.data.length - 1];
        setAnalysis({
          skills: latest.skills || [],
          experience_years: latest.experience_years || 0,
          desired_roles: latest.desired_roles || [],
          summary: latest.summary || ''
        });
        setPreviousFilename(latest.filename);
      }
    } catch (err) {
      console.error("Failed to fetch past resume analysis", err);
    }
  };

  const handleJobKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = currentJobInput.trim();
      if (val && !jobTitles.includes(val)) {
        setJobTitles([...jobTitles, val]);
      }
      setCurrentJobInput('');
    }
  };

  const removeJobTag = (tag: string) => {
    setJobTitles(jobTitles.filter(t => t !== tag));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setIsProcessing(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (preference.trim()) {
      formData.append('preference', preference.trim());
    }
    if (jobTitles.length > 0) {
      formData.append('job_title', jobTitles.join(', '));
    }
    if (location.trim()) {
      formData.append('location', location.trim());
    }
    if (timeFilter.trim()) {
      formData.append('time_filter', timeFilter.trim());
    }

    try {
      const analysisResponse = await axios.post('http://localhost:8000/resumes/', formData);
      setAnalysis(analysisResponse.data.analysis);
      fetchResumes(); // Refresh saved resumes
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  }, [preference, jobTitles, location, timeFilter]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const loadResume = (resume: SavedResume) => {
    setAnalysis({
      skills: resume.skills || [],
      experience_years: resume.experience_years || 0,
      desired_roles: resume.desired_roles || [],
      summary: resume.summary || ''
    });
    setPreviousFilename(resume.filename);
    setFile(null);
  };

  const deleteResume = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/resumes/${id}`);
      setSavedResumes(savedResumes.filter(r => r.id !== id));
      if (savedResumes.length === 1) { // If it was the last one
         setAnalysis(null);
         setPreviousFilename(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-content-strong mb-2 tracking-tight">My Profile</h1>
        <p className="text-content-muted">Upload your CV to let AI analyze and build your profile.</p>
      </header>

      {!isProcessing && !analysis && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-content-strong border-b border-surface-border pb-2">Search Preferences & Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-content-muted font-semibold mb-1 text-sm">
                  Desired Job Titles (Press Enter to add)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {jobTitles.map((job, idx) => (
                    <span key={idx} className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-xl text-sm font-semibold shadow-sm flex items-center gap-1">
                      {job}
                      <button onClick={() => removeJobTag(job)} className="hover:text-red-500 focus:outline-none"><X size={14}/></button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text"
                  value={currentJobInput}
                  onChange={(e) => setCurrentJobInput(e.target.value)}
                  onKeyDown={handleJobKeyDown}
                  placeholder="e.g. Frontend Developer"
                  className="w-full bg-surface border border-surface-border text-content-strong p-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm shadow-sm"
                />
              </div>
              <div>
                <label className="block text-content-muted font-semibold mb-1 text-sm">
                  Preferred Location
                </label>
                <select 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-surface border border-surface-border text-content-strong p-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm shadow-sm"
                >
                  <option value="">Any Location / Toàn quốc</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
              <div>
                <label className="block text-content-muted font-semibold mb-1 text-sm">
                  Time Posted
                </label>
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full bg-surface border border-surface-border text-content-strong p-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm shadow-sm"
                >
                  <option value="">Any Time</option>
                  <option value="24h">Past 24 hours</option>
                  <option value="7d">Past week</option>
                  <option value="30d">Past month</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-content-muted font-semibold mb-1 text-sm">
                Specific Requirements / Additional context (Optional)
              </label>
              <textarea 
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                placeholder="e.g. I want to find AI Automation jobs or startup environments..."
                className="w-full bg-surface border border-surface-border text-content-strong p-3 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-20 text-sm shadow-sm"
              />
            </div>
          </div>

          <div 
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300
              ${isDragActive 
                ? 'border-primary bg-primary/10 shadow-inner' 
                : 'border-surface-border bg-surface-alt hover:border-primary hover:bg-surface-alt/50 shadow-sm'}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-content-muted'}`} />
            <h3 className="text-xl font-semibold text-content-strong">
              {isDragActive ? 'Drop your CV here...' : 'Drag & drop your CV'}
            </h3>
            <p className="text-content-muted mt-2 text-sm">Supports PDF, TXT, DOCX up to 10MB</p>
            {error && <p className="text-red-500 font-medium mt-4 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl inline-block">{error}</p>}
          </div>

          {savedResumes.length > 0 && (
            <div className="glass p-6 rounded-2xl mt-8">
              <h2 className="text-lg font-bold text-content-strong border-b border-surface-border pb-2 mb-4">Saved CVs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedResumes.map((resume) => (
                  <div key={resume.id} className="bg-surface border border-surface-border p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-content-strong truncate pr-2">{resume.filename}</div>
                    </div>
                    <div className="text-xs text-content-muted line-clamp-2">{resume.summary}</div>
                    <div className="flex gap-2 mt-auto pt-2">
                      <button 
                        onClick={() => loadResume(resume)}
                        className="flex-1 flex items-center justify-center gap-1 bg-primary/20 hover:bg-primary/30 text-primary py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <RefreshCw size={14} /> Load
                      </button>
                      <button 
                        onClick={() => deleteResume(resume.id)}
                        className="flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isProcessing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-12 flex flex-col items-center justify-center rounded-2xl"
        >
          <div className="w-12 h-12 border-4 border-surface-border border-t-primary rounded-full animate-spin mb-4"></div>
          <div className="text-lg text-content-strong font-medium animate-pulse">
            AI Agent is reading your CV...
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {analysis && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-6 border-b border-surface-border pb-4">
              <CheckCircle className="text-quaternary w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold text-content-strong">Profile Analyzed Successfully</h2>
                {(file || previousFilename) && <p className="text-xs text-content-muted mt-0.5">CV: {file ? file.name : previousFilename}</p>}
              </div>
            </div>
            
            <p className="text-content-strong text-lg leading-relaxed mb-8">{analysis.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-surface p-6 rounded-xl border border-surface-border shadow-sm flex flex-col justify-center">
                <strong className="text-secondary text-xs font-bold uppercase tracking-wider block mb-1">Total Experience</strong>
                <div className="text-3xl font-extrabold text-content-strong">
                  {analysis.experience_years} <span className="text-lg text-content-muted font-semibold">Years</span>
                </div>
              </div>
              <div className="bg-surface p-6 rounded-xl border border-surface-border shadow-sm flex flex-col justify-center">
                <strong className="text-primary text-xs font-bold uppercase tracking-wider block mb-1">Desired Roles</strong>
                <div className="text-lg font-bold text-content-strong leading-snug">
                  {analysis.desired_roles.join(', ')}
                </div>
              </div>
            </div>

            <div>
              <strong className="text-content-muted text-xs font-bold uppercase tracking-wider block mb-4">Core Skills Detected</strong>
              <div className="flex flex-wrap gap-2.5">
                {analysis.skills.map((skill, idx) => (
                  <span key={idx} className="bg-surface text-content-strong border border-surface-border px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all hover:border-primary/50">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => {
                setAnalysis(null);
                setFile(null);
                setPreviousFilename(null);
              }}
              className="mt-10 bg-surface hover:bg-surface-alt/50 text-content-strong px-6 py-3 rounded-xl font-bold transition-colors border border-surface-border shadow-sm cursor-pointer"
            >
              Back to CV Manager / Upload
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
