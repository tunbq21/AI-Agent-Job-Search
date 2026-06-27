import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Code, FileCheck2, Sparkles, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface CVAnalysis {
  skills: string[];
  experience_years: number;
  desired_roles: string[];
  summary: string;
}

const Dashboard = () => {
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [previousFilename, setPreviousFilename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appCount, setAppCount] = useState(0);
  const [avgMatch, setAvgMatch] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const resResumes = await axios.get('http://localhost:8000/resumes/');
      if (resResumes.data && resResumes.data.length > 0) {
        const latest = resResumes.data[resResumes.data.length - 1];
        setAnalysis({
          skills: latest.skills || [],
          experience_years: latest.experience_years || 0,
          desired_roles: latest.desired_roles || [],
          summary: latest.summary || ''
        });
        setPreviousFilename(latest.filename);
      }

      const resApps = await axios.get('http://localhost:8000/applications/');
      if (resApps.data) {
        setAppCount(resApps.data.length);
        if (resApps.data.length > 0) {
            let totalMatch = 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resApps.data.forEach((app: any) => {
                totalMatch += app.match_percentage || 0;
            });
            setAvgMatch(Math.round(totalMatch / resApps.data.length));
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-content-muted font-semibold">Loading profile...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-content-strong mb-1 tracking-tight">Overview</h1>
          <p className="text-content-muted font-medium">Here is what's happening with your profile today.</p>
        </div>
      </header>

      {analysis ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Welcome Banner */}
          <div className="lg:col-span-2 bg-gradient-to-br from-primary/40 to-primary/20 rounded-[32px] p-8 relative overflow-hidden shadow-sm border border-primary/20">
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
              <Sparkles size={200} className="text-primary" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-center">
              <p className="text-content-strong text-lg font-bold mb-2 opacity-80">Welcome back,</p>
              <h2 className="text-4xl font-black text-content-strong mb-4 tracking-tight leading-tight">Your AI Career <br/> Assistant is ready.</h2>
              <p className="text-content-strong/80 font-medium max-w-md mb-6 leading-relaxed">
                {analysis.summary.length > 150 ? analysis.summary.substring(0, 150) + '...' : analysis.summary}
              </p>
              <div className="mt-auto">
                {previousFilename && (
                  <div className="bg-white/60 backdrop-blur-md inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-content-strong shadow-sm">
                    <FileCheck2 size={18} className="text-secondary" />
                    CV: {previousFilename}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Experience Stats */}
          <div className="bg-tertiary/40 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-center items-center text-center shadow-sm border border-tertiary/30 hover:-translate-y-1 transition-transform duration-300">
            <h3 className="text-2xl font-bold text-content-strong mb-4 flex items-center gap-2">
              Experience
            </h3>
            <div className="text-8xl font-black text-content-strong mb-2 tracking-tighter">
              {analysis.experience_years}
            </div>
            <p className="text-content-strong/70 font-bold uppercase tracking-widest text-sm">Years in industry</p>
          </div>

          {/* Core Skills (Pie Chart Equivalent) */}
          <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-border flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-content-strong">Core Skills</h3>
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <Code size={20} className="text-secondary" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {analysis.skills.slice(0, 12).map((skill, idx) => (
                <span key={idx} className="bg-surface-alt text-content-strong px-4 py-2 rounded-xl text-sm font-bold border border-surface-border/50 hover:bg-secondary/10 transition-colors">
                  {skill}
                </span>
              ))}
              {analysis.skills.length > 12 && (
                <span className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold">
                  +{analysis.skills.length - 12} more
                </span>
              )}
            </div>
          </div>

          {/* Desired Roles (Bar Chart Equivalent) */}
          <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-border flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-content-strong">Target Roles</h3>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Briefcase size={20} className="text-primary" />
              </div>
            </div>
            <div className="flex flex-col gap-3 mt-auto">
              {analysis.desired_roles.map((role, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-alt border border-surface-border/50">
                  <div className={`w-3 h-3 rounded-full ${idx % 2 === 0 ? 'bg-primary' : 'bg-secondary'}`}></div>
                  <span className="font-bold text-content-strong">{role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Stats (Sales Equivalent) */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-border flex-1 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <h3 className="text-sm font-bold text-content-muted uppercase tracking-wider mb-2">Profile Match</h3>
              <div className="text-4xl font-black text-content-strong flex items-baseline gap-1">
                {avgMatch}<span className="text-2xl text-secondary">%</span>
              </div>
            </div>
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-border flex-1 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <h3 className="text-sm font-bold text-content-muted uppercase tracking-wider mb-2">Applications</h3>
              <div className="text-4xl font-black text-content-strong flex items-center gap-3">
                {appCount}
                <TrendingUp size={24} className="text-primary" />
              </div>
            </div>
          </div>

        </motion.div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md p-12 rounded-[40px] text-center border border-white max-w-2xl mx-auto mt-20 shadow-xl">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-black text-content-strong mb-4">No Profile Found</h2>
          <p className="text-content-muted font-medium mb-8 text-lg">Upload your CV to unlock AI-powered insights and personalize your job search experience.</p>
          <a href="/settings" className="inline-block bg-content-strong text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">Upload CV Now</a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
