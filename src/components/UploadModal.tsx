import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ResumeUpload from "@/components/ResumeUpload";

interface UploadModalProps {
  open: boolean;
  isProcessing: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onClose: () => void;
  onClearError: () => void;
}

const UploadModal = ({ open, isProcessing, error, onUpload, onClose, onClearError }: UploadModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-md"
            onClick={() => !isProcessing && onClose()}
          />
          <motion.div
            key="modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 p-8 relative">
              {!isProcessing && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground tracking-tight">Upload your resume</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll find the best matching jobs for your skills.
                </p>
              </div>
              <ResumeUpload onUpload={onUpload} isProcessing={isProcessing} error={error} onClearError={onClearError}/>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;
