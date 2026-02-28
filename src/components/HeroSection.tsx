import { motion } from "framer-motion";
import { Sparkles, FileSearch, ArrowRight } from "lucide-react";
import ResumeUpload from "@/components/ResumeUpload";

interface HeroSectionProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
  onBrowseAll: () => void;
  onClearError: () => void; 
}

const HeroSection = ({ onUpload, isProcessing, error, onBrowseAll, onClearError }: HeroSectionProps) => {
  return (
    <motion.div
      key="upload-hero"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 pb-16"
    >
      <section className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Smart resume analysis
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-5"
        >
          Find jobs that actually
          <br />
          <span className="text-primary relative">match your skills</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-muted-foreground max-w-md mx-auto mb-12"
        >
          Upload your resume and let AI shortlist the best opportunities for you.
        </motion.p>

        <ResumeUpload onUpload={onUpload} isProcessing={isProcessing} error={error} onClearError={onClearError} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          <div className="flex items-center gap-4 max-w-xs mx-auto mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <motion.button
            onClick={onBrowseAll}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group w-full max-w-sm mx-auto flex items-center justify-center gap-3 px-5 py-4 rounded-2xl border border-primary/20 bg-primary hover:bg-primary/90"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
              <FileSearch className="w-4 h-4 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Browse all jobs</p>
              <p className="text-xs text-white/70">Explore without uploading</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-all shrink-0" />
          </motion.button>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default HeroSection;
