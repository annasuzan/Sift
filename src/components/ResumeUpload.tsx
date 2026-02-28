import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeUploadProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
  error?: string | null;
  onClearError?: () => void;
}

const ResumeUpload = ({ onUpload, isProcessing, error, onClearError }: ResumeUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [wasProcessing, setWasProcessing] = useState(false);

  useEffect(() => {
    if (wasProcessing && !isProcessing) {
      if (!error) setFile(null);
    }
    setWasProcessing(isProcessing);
  }, [isProcessing, wasProcessing, error]);

  // Show backend error inside the component too
  useEffect(() => {
    if (error) {
      setLocalError(error);
    } else {
      setLocalError(null);
    }
  }, [error]);
  const isPdf = (f: File) =>
    f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    if (!isPdf(droppedFile)) {
      setLocalError("Please upload a resume in PDF format.");
      setFile(null);
      return;
    }
    setLocalError(null);
    onClearError?.();
    setFile(droppedFile);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = "";
    if (!selectedFile) return;
    if (!isPdf(selectedFile)) {
      setLocalError("Please upload a resume in PDF format.");
      setFile(null);
      return;
    }
    setLocalError(null);
    onClearError?.();
    setFile(selectedFile);
  }, []);

  const handleSubmit = () => {
    if (file) onUpload(file);
  };

  const removeFile = () => {
    setFile(null);
    setLocalError(null);
    const input = document.getElementById("file-input") as HTMLInputElement;
    if (input) input.value = "";
  };

  const displayError = localError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-xl mx-auto"
    >
      <div
        className={`upload-zone ${dragActive ? "upload-zone-active" : ""} ${displayError ? "border-destructive/60" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && !isProcessing && document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          className="hidden"
        />

        <AnimatePresence mode="wait">
         {file ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${error ? "bg-destructive/10" : "bg-accent"}`}>
                {error
                  ? <AlertCircle className="w-7 h-7 text-destructive" />
                  : <FileText className="w-7 h-7 text-accent-foreground" />
                }
              </div>
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                {error
                  ? <p className="text-sm text-destructive mt-1">{error}</p>
                  : <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                }
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); removeFile(); }}
                  className="text-muted-foreground"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4 mr-1" /> Remove
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? "Analyzing..." : error ? "Try Again" : "Find Jobs"}
                </Button>
              </div>
            </motion.div>
            ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${displayError ? "bg-destructive/10" : "bg-secondary"}`}>
                {displayError
                  ? <AlertCircle className="w-7 h-7 text-destructive" />
                  : <Upload className="w-7 h-7 text-muted-foreground" />
                }
              </div>
              <div>
                {displayError ? (
                  <>
                    <p className="font-medium text-destructive">{displayError}</p>
                    <p className="text-sm text-muted-foreground mt-1">Click or drag to try again</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-foreground">Drop your resume here</p>
                    <p className="text-sm text-muted-foreground mt-1">PDF · Max 10MB</p>
                  </>
                )}
              </div>
              <Button variant="outline" size="sm" className="mt-1">
                Browse files
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ResumeUpload;
