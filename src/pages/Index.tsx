import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileSearch, SlidersHorizontal, X, RotateCcw, Upload, Search } from "lucide-react";
import ResumeUpload from "@/components/ResumeUpload";
import JobCard, { Job } from "@/components/JobCard";
import { Button } from "@/components/ui/button";

const Index = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState("");
  const [filters, setFilters] = useState({
    location: "",
    seniority: "",
    dateRange: "all",
    employmentType: "",
    companySize: "",
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
    filters.employmentType,
    filters.companySize,
  ].filter(Boolean).length;

  // Derive unique seniority levels from loaded jobs, sorted alphabetically
  const seniorityOptions = Array.from(
    new Set(allJobs.map((j) => j.seniority_level).filter(Boolean))
  ).sort();

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
    if (!isBrowsingAll || !hasMore) return;
    const fetchAllJobs = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`${API_URL}/api/jobs/all?page=${page}`);
        const newJobs = await response.json();
        if (newJobs.length < 20) setHasMore(false);
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

    // Position search
    if (positionSearch.trim()) {
      result = result.filter((job) =>
        job.title.toLowerCase().includes(positionSearch.toLowerCase()) ||
        job.company_name.toLowerCase().includes(positionSearch.toLowerCase())
      );
    }
    // Location
    if (filters.location) {
      result = result.filter((job) =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    // Seniority
    if (filters.seniority) {
      result = result.filter((job) => job.seniority_level === filters.seniority);
    }
    // Employment type
    if (filters.employmentType) {
      result = result.filter((job) =>
        job.employment_type?.toLowerCase().includes(filters.employmentType.toLowerCase())
      );
    }
    // Company size
    if (filters.companySize) {
      result = result.filter((job) => {
        const count = parseInt((job.company_employees_count || "0").replace(/\D/g, ""));
        if (filters.companySize === "small") return count > 0 && count <= 200;
        if (filters.companySize === "mid") return count > 200 && count <= 1000;
        if (filters.companySize === "large") return count > 1000 && count <= 10000;
        if (filters.companySize === "enterprise") return count > 10000;
        return true;
      });
    }
    // Date
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
  }, [filters, positionSearch, allJobs]);

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
      const response = await fetch(`${API_URL}/api/jobs/match`, {
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
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFilters = () => {
    setFilters({ location: "", seniority: "", dateRange: "all", employmentType: "", companySize: "" });
    // setPositionSearch("");
  };

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
    setPage(1);
    setHasMore(true);
    resetFilters();
    setFiltersOpen(false);
  };

  const handleUploadFromModal = async (file: File) => {
    setModalProcessing(true);
    setModalError(null);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const response = await fetch(`${API_URL}/api/jobs/match`, {
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
    } finally {
      setModalProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">

      {/* ── AMBIENT GRADIENT ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-52 -left-52 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/18 blur-[110px]" />
      </div>

      {/* ── NAVBAR ── */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/70 backdrop-blur-md">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
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

                  {/* Location */}
                  <div className="flex-1 min-w-[160px]">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Location</label>
                    <input
                      type="text"
                      placeholder="City or remote…"
                      className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all placeholder:text-muted-foreground/50"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    />
                  </div>

                  {/* Seniority */}
                  <div className="min-w-[150px]">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Seniority</label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all appearance-none cursor-pointer"
                      value={filters.seniority}
                      onChange={(e) => setFilters({ ...filters, seniority: e.target.value })}
                    >
                      <option value="">All Levels</option>
                      {seniorityOptions.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div className="min-w-[160px]">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Employment Type</label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all appearance-none cursor-pointer"
                      value={filters.employmentType}
                      onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                    >
                      <option value="">Any Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  {/* Company Size */}
                  <div className="min-w-[150px]">
                    <label className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Company Size</label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-border bg-secondary/40 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all appearance-none cursor-pointer"
                      value={filters.companySize}
                      onChange={(e) => setFilters({ ...filters, companySize: e.target.value })}
                    >
                      <option value="">Any Size</option>
                      <option value="small">Small (1–200)</option>
                      <option value="mid">Mid (201–1k)</option>
                      <option value="large">Large (1k–10k)</option>
                      <option value="enterprise">Enterprise (10k+)</option>
                    </select>
                  </div>

                  {/* Date Posted */}
                  <div className="min-w-[140px]">
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-auto">
                    {(activeFilterCount > 0 || positionSearch) && (
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 text-muted-foreground h-10">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset all
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
                <ResumeUpload onUpload={handleUpload} isProcessing={isProcessing} error={error} />
                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

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
              <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">
                    {isBrowsingAll ? "All Jobs" : "Top Matches"}
                  </h2>
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

              {/* ── POSITION SEARCH BAR ── */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by job title or company…"
                  value={positionSearch}
                  onChange={(e) => setPositionSearch(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all placeholder:text-muted-foreground/50"
                />
                {positionSearch && (
                  <button
                    onClick={() => setPositionSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
                  <p className="text-muted-foreground mb-3">No jobs match your current filters.</p>
                  <Button variant="link" onClick={resetFilters}>Reset all filters</Button>
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
            <motion.div
              key="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-md"
              onClick={() => !modalProcessing && setUploadModalOpen(false)}
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
                {!modalProcessing && (
                  <button
                    onClick={() => setUploadModalOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Upload your resume</h3>
                  <p className="text-sm text-muted-foreground mt-1">We'll find the best matching jobs for your skills.</p>
                </div>
                <ResumeUpload onUpload={handleUploadFromModal} isProcessing={modalProcessing} error={modalError} />
                {modalError && <p className="mt-3 text-sm text-destructive text-center">{modalError}</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground mt-auto relative z-10">
        Sift — Find work that fits.
      </footer>
    </div>
  );
};

export default Index;
