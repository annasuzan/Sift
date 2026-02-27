import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Added ArrowUpRight here
import { Sparkles, FileSearch, SlidersHorizontal, X, RotateCcw, Upload, ArrowUpRight } from "lucide-react"; 
import ResumeUpload from "@/components/ResumeUpload";
import JobCard, { Job } from "@/components/JobCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    location: "",
    seniority: "",
    dateRange: "all",
  });

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isBrowsingAll, setIsBrowsingAll] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalProcessing, setModalProcessing] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const activeFilterCount = [
    filters.location,
    filters.seniority,
    filters.dateRange !== "all" ? filters.dateRange : "",
  ].filter(Boolean).length;

  const [showBackToTop, setShowBackToTop] = useState(false);

  //Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 400px
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  //Smooth scroll function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const lastJobElementRef = useCallback((node: HTMLDivElement) => {
    if (isProcessing) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && isBrowsingAll) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isProcessing, hasMore, isBrowsingAll]);

  useEffect(() => {
    // Only fetch if we are in browsing mode and haven't run out of jobs
    if (!isBrowsingAll || !hasMore) return;

    const fetchAllJobs = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`http://localhost:5000/api/jobs/all?page=${page}`);
        const newJobs = await response.json();
        
        if (newJobs.length < 20) setHasMore(false);
        
        // Use a functional update to ensure we don't have race conditions
        setAllJobs(prev => page === 1 ? newJobs : [...prev, ...newJobs]);
      } catch (err) {
        setError("Failed to load more jobs.");
      } finally {
        setIsProcessing(false);
      }
    };
    
    fetchAllJobs();
  }, [page, isBrowsingAll]);

  useEffect(() => {
    let result = [...allJobs];
    if (filters.location) {
      result = result.filter((job) =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.seniority) {
      result = result.filter((job) => job.seniority_level === filters.seniority);
    }
    const now = new Date();
    if (filters.dateRange === "1day") {
      result = result.filter(
        (job) => (now.getTime() - new Date(job.posted_at).getTime()) / (1000 * 3600 * 24) <= 1
      );
    } else if (filters.dateRange === "2days") {
      result = result.filter(
        (job) => (now.getTime() - new Date(job.posted_at).getTime()) / (1000 * 3600 * 24) <= 2
      );
    } else if (filters.dateRange === "older") {
      result = result.filter(
        (job) => (now.getTime() - new Date(job.posted_at).getTime()) / (1000 * 3600 * 24) > 2
      );
    }
    setFilteredJobs(result);
  }, [filters, allJobs]);

  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setHasSearched(false);
    setIsBrowsingAll(false);
    setPage(1);
    setHasMore(false);
    setError(null);
    setAllJobs([]);
    setFilteredJobs([]);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const response = await fetch("http://localhost:5000/api/jobs/match", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to match resume");
      const data = await response.json();
      const matches = data.matches ?? data;
      setAllJobs(matches);
      setFilteredJobs(matches);
      setHasSearched(true);
    } catch (error) {
      console.error("Upload failed", error);
      setError("Server is offline or could not process resume.");
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFilters = () => setFilters({ location: "", seniority: "", dateRange: "all" });

  const handleBrowseAllTrigger = () => {
    setAllJobs([]);
    setFilteredJobs([]);
    setPage(1);
    setHasMore(true);
    setIsBrowsingAll(true);
    setHasSearched(true);
  };

  const handleGoHome = () => {
    setHasSearched(false);
    setIsBrowsingAll(false);
    setAllJobs([]);
    setFilteredJobs([]);
    setPage(1); // Reset page
    setHasMore(true); // Reset more status
    resetFilters();
    setFiltersOpen(false);
  };

  // Upload from modal — stays on results page, just swaps the job list
  const handleUploadFromModal = async (file: File) => {
    setModalProcessing(true);
    setModalError(null);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const response = await fetch("http://localhost:5000/api/jobs/match", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to match resume");
      const data = await response.json();
      const matches = data.matches ?? data;
      setAllJobs(matches);
      setFilteredJobs(matches);
      setIsBrowsingAll(false);
      setHasSearched(true);
      setUploadModalOpen(false);
      setModalError(null);
    } catch (err) {
      setModalError("Server is offline or could not process resume.");
      setIsProcessing(false);
    } finally {
      setModalProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">

      {/* ── AMBIENT GRADIENT BACKGROUND ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-52 -left-52 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/18 blur-[110px]" />
      </div>

      {/* ── NAVBAR ── */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/70 backdrop-blur-md">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">

          {/* Wordmark */}
          <button onClick={handleGoHome} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <FileSearch className="w-4 h-4 text-primary-foreground" />
            </div>
           <div className="relative group flex items-center">
            <span className="text-2xl font-extrabold tracking-tighter" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Sift
            </span>
            <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          </button>

          {hasSearched && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <Button
                variant={filtersOpen || activeFilterCount > 0 ? "default" : "outline"}
                size="sm"
                className="gap-2 h-9"
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-background/20 text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </div>

        {/* ── FILTER PANEL ── */}
        <AnimatePresence>
          {hasSearched && filtersOpen && (
            <motion.div
              key="filter-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-sm"
            >
              <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-5">
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Location</label>
                    <input
                      type="text"
                      placeholder="City, state, or remote…"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all placeholder:text-muted-foreground/50"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                  </div>
                  <div className="min-w-[160px]">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Seniority</label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all appearance-none cursor-pointer"
                      value={filters.seniority}
                      onChange={(e) => setFilters({ ...filters, seniority: e.target.value })}
                    >
                      <option value="">All Levels</option>
                      <option value="Entry level">Entry Level</option>
                      <option value="Mid-Senior level">Mid-Senior</option>
                      <option value="Associate">Associate</option>
                    </select>
                  </div>
                  <div className="min-w-[160px]">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Posted</label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all appearance-none cursor-pointer"
                      value={filters.dateRange}
                      onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    >
                      <option value="all">Any time</option>
                      <option value="1day">Last 24h</option>
                      <option value="2days">Last 48h</option>
                      <option value="older">Older</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 text-muted-foreground h-10">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-10 w-10 p-0" onClick={() => setFiltersOpen(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            /* VIEW 1: UPLOAD HERO */
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
                <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-5">
                  Find jobs that actually
                  <br />
                  <span className="text-primary">match your skills</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto mb-12">
                  Upload your resume and let AI shortlist the best opportunities for you.
                </p>
                <ResumeUpload onUpload={handleUpload} isProcessing={isProcessing} />
                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

                {/* OR / Browse all jobs */}
                <div className="flex items-center gap-4 max-w-xs mx-auto mt-8">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  onClick={handleBrowseAllTrigger}
                  className="mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-colors"
                >
                  Browse all jobs
                </button>
              </section>
            </motion.div>
          ) : (
            /* VIEW 2: RESULTS */
            <motion.div
              key="results-dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8"
            >
              {/* ── TOP BAR ── */}
              <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">
                    {isBrowsingAll ? "All Jobs" : "Top Matches"}
                  </h2>
                  {/* Count pill only for matched results, not browse-all */}
                  {!isBrowsingAll && (
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-sm font-semibold ring-1 ring-primary/30">
                      {filteredJobs.length} jobs
                    </span>
                  )}
                </div>

                <Button
                  onClick={() => { setUploadModalOpen(true); setModalError(null); }}
                  variant="outline"
                  className="gap-2 rounded-full px-5 h-9 border-border hover:border-primary/60 hover:bg-primary/5 transition-all shrink-0 text-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload new resume
                </Button>
              </div>

              {/* ── JOB CARDS GRID ── */}
              {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredJobs.map((job, i) => {
                    const isLastItem = filteredJobs.length === i + 1;
                    if (isLastItem) {
                      return (
                        <div ref={lastJobElementRef} key={job.id}>
                          <JobCard job={job} index={i} />
                        </div>
                      );
                    }
                    return <JobCard key={job.id} job={job} index={i} />;
                  })}
                </div>
              ) : (
                <div className="text-center py-24 border-2 border-dashed rounded-2xl border-border">
                  <p className="text-muted-foreground mb-3">No jobs match your selected filters.</p>
                  <Button variant="link" onClick={resetFilters}>Reset Filters</Button>
                </div>
              )}

              {isProcessing && isBrowsingAll && (
                <div className="py-10 text-center">
                  <Sparkles className="w-6 h-6 animate-spin mx-auto text-primary opacity-50" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── UPLOAD MODAL ── */}
      <AnimatePresence>
        {uploadModalOpen && (
          <>
            {/* Backdrop — blurs + darkens the page behind */}
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-md"
              onClick={() => !modalProcessing && setUploadModalOpen(false)}
            />

            {/* Modal card */}
            <motion.div
              key="modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 p-8 relative">
                {/* Close button */}
                {!modalProcessing && (
                  <button
                    onClick={() => setUploadModalOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Heading */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Upload your resume</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We'll find the best matching jobs for your skills.
                  </p>
                </div>

                {/* Upload component */}
                <ResumeUpload onUpload={handleUploadFromModal} isProcessing={modalProcessing} />

                {modalError && (
                  <p className="mt-3 text-sm text-destructive text-center">{modalError}</p>
                )}
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground mt-auto relative z-10">
        Sift — Find work that fits.
      </footer>

      <AnimatePresence>
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[100] p-3 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-primary-foreground transition-all active:scale-90 group"
        >
          <ArrowUpRight className="w-6 h-6 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
    
    </div>
  );
};

export default Index;
