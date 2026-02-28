import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Filters } from "@/hooks/use-job-search";

interface NavbarProps {
  hasSearched: boolean;
  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;
  activeFilterCount: number;
  filters: Filters;
  setFilters: (f: Filters) => void;
  seniorityOptions: string[];
  positionSearch: string;
  resetFilters: () => void;
  onGoHome: () => void;
}

const Navbar = ({
  hasSearched, filtersOpen, setFiltersOpen,
  activeFilterCount, filters, setFilters,
  seniorityOptions, positionSearch,
  resetFilters, onGoHome,
}: NavbarProps) => {
  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/70 backdrop-blur-md">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">

        {/* Wordmark */}
        <button onClick={onGoHome} className="flex items-center gap-2.5 group">
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
              onClick={() => setFiltersOpen(!filtersOpen)}
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

      {/* Filter Panel */}
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
  );
};

export default Navbar;
