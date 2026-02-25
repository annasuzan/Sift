import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileSearch } from "lucide-react";
import ResumeUpload from "@/components/ResumeUpload";
import JobCard from "@/components/JobCard";
import { mockJobs } from "@/data/mockJobs";

const Index = () => {
  const [jobs, setJobs] = useState<typeof mockJobs>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleUpload = (_file: File) => {
    setIsProcessing(true);
    setJobs([]);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setHasSearched(true);
      setJobs(mockJobs);
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, hsl(152 30% 42%), hsl(152 25% 50%))' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary-foreground" />
            <span className="font-display text-lg text-primary-foreground">Sift</span>
          </div>
          <span className="text-sm text-primary-foreground/75">AI-Powered Job Matching</span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Smart resume analysis
          </div>
          <h1 className="text-4xl sm:text-5xl font-display text-foreground leading-tight mb-4">
            Find jobs that actually
            <br />
            match your skills
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Upload your resume and let AI shortlist the best opportunities for you.
            No more scrolling through irrelevant listings.
          </p>
        </motion.div>
      </section>

      {/* Upload */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <ResumeUpload onUpload={handleUpload} isProcessing={isProcessing} />
      </section>

      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto px-6 pb-8 text-center"
          >
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
              <span className="text-sm">Analyzing your resume and matching jobs...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {hasSearched && jobs.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-6 pb-20"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-foreground">
                Your matches
              </h2>
              <span className="text-sm text-muted-foreground">
                {jobs.length} jobs found
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {jobs.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          Sift — Find work that fits.
        </div>
      </footer>
    </div>
  );
};

export default Index;
