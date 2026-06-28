import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, Trash2, RefreshCw, X } from 'lucide-react';
import axios from 'axios';

import { toast as sonnerToast } from 'sonner';

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
  search_filters?: any;
}

const Settings = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousFilename, setPreviousFilename] = useState<string | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<number | null>(null);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);
  
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
        setCurrentResumeId(latest.id);
      }
    } catch (err) {
      console.error("Failed to fetch past resume analysis", err);
    }
  };



  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setError(null);
  }, []);

  const confirmUpload = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const analysisResponse = await axios.post('http://localhost:8000/resumes/', formData);
      setAnalysis(analysisResponse.data.analysis);
      setCurrentResumeId(analysisResponse.data.resume_id);
      fetchResumes(); // Refresh saved resumes
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

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
    setCurrentResumeId(resume.id);
    setFile(null);
  };

  const deleteResume = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/resumes/${id}`);
      setSavedResumes(savedResumes.filter(r => r.id !== id));
      if (savedResumes.length === 1) { // If it was the last one
         setAnalysis(null);
         setPreviousFilename(null);
         setCurrentResumeId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllData = async () => {
    if (confirm("Are you sure you want to clear all jobs and applications?")) {
      try {
        await axios.delete('http://localhost:8000/jobs/');
        await axios.delete('http://localhost:8000/applications/');
        alert("All jobs and applications have been cleared.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="w-full max-w-none mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-content-strong mb-2 tracking-tight">My Profile</h1>
        <p className="text-content-muted">Upload your CV to let AI analyze and build your profile.</p>
      </header>

      {!isProcessing && !analysis && (
        <div className="space-y-6">


          <div 
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300
              ${isDragActive 
                ? 'border-primary bg-primary/10 shadow-inner' 
                : 'border-surface-border bg-surface-alt hover:border-primary hover:bg-surface-alt/50 shadow-sm'}`}
          >
            <input {...getInputProps()} />
            <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragActive || file ? 'text-primary' : 'text-content-muted'}`} />
            <h3 className="text-xl font-semibold text-content-strong">
              {file ? `Selected: ${file.name}` : (isDragActive ? 'Drop your CV here...' : 'Drag & drop your CV')}
            </h3>
            <p className="text-content-muted mt-2 text-sm">{file ? 'Click or drag to change file' : 'Supports PDF, TXT, DOCX up to 10MB'}</p>
            {error && <p className="text-red-500 font-medium mt-4 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl inline-block">{error}</p>}
          </div>

          {file && !isProcessing && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mt-4"
            >
              <button 
                onClick={confirmUpload}
                className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold transition-all shadow-md text-lg"
              >
                Xác nhận & Phân tích CV
              </button>
            </motion.div>
          )}

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
            
            
            <div className="mt-10 flex flex-wrap gap-4">
              <button 
                onClick={() => {
                  setAnalysis(null);
                  setFile(null);
                  setPreviousFilename(null);
                  setCurrentResumeId(null);
                }}
                className="bg-surface hover:bg-surface-alt/50 text-content-strong px-6 py-3 rounded-xl font-bold transition-colors border border-surface-border shadow-sm cursor-pointer flex-1"
              >
                Back to CV Manager
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 pt-8 border-t border-surface-border">
        <h2 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-content-muted text-sm mb-4">This action will permanently delete all scraped jobs and saved applications from your database.</p>
        <button onClick={clearAllData} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 px-6 py-3 rounded-xl font-bold transition-all shadow-sm cursor-pointer">
          Clear All Jobs & Applications
        </button>
      </div>
    </div>
  );
};

export default Settings;
