import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
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

const Dashboard = () => {
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [previousFilename, setPreviousFilename] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await axios.get('http://localhost:8000/resumes/');
      if (res.data && res.data.length > 0) {
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
      console.error('Failed to fetch past resume analysis', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-content-strong mb-2 tracking-tight">Dashboard</h1>
        <p className="text-content-muted">Your active profile overview.</p>
      </header>

      {analysis ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-surface-border pb-4">
            <CheckCircle className="text-quaternary w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold text-content-strong">Active Profile</h2>
              {previousFilename && <p className="text-xs text-content-muted mt-0.5">Based on CV: {previousFilename}</p>}
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
        </motion.div>
      ) : (
        <div className="glass p-8 rounded-2xl text-center">
          <p className="text-content-muted mb-4">No CV profile found. Please upload a CV in Settings.</p>
          <a href="/settings" className="inline-block bg-primary text-quaternary px-6 py-2 rounded-xl font-bold">Go to Settings</a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
