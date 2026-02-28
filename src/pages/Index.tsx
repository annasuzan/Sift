import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useJobSearch } from "@/hooks/use-job-search";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ResultsDashboard from "@/components/ResultsDashboard";
import UploadModal from "@/components/UploadModal";

const Index = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const {
    isProcessing, hasSearched, error,
    filteredJobs, filtersOpen, setFiltersOpen,
    positionSearch, setPositionSearch,
    filters, setFilters,
    isBrowsingAll, isProcessing: isFetchingMore,
    uploadModalOpen, setUploadModalOpen,
    modalError, setModalError, modalProcessing,
    activeFilterCount, seniorityOptions, employmentOptions,
    lastJobElementRef,
    handleUpload, handleUploadFromModal,
    handleBrowseAllTrigger, handleGoHome,
    resetFilters,
    clearError,
    clearModalError,
  } = useJobSearch();

  return (
    <div className="min-h-screen flex flex-col bg-background relative">

      {/* Ambient gradient */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-52 -left-52 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full bg-primary/15 blur-[100px]" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-primary/18 blur-[110px]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <Navbar
        hasSearched={hasSearched}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        activeFilterCount={activeFilterCount}
        filters={filters}
        setFilters={setFilters}
        seniorityOptions={seniorityOptions}
        employmentOptions={employmentOptions}
        positionSearch={positionSearch}
        setPositionSearch={setPositionSearch}
        resetFilters={resetFilters}
        onGoHome={handleGoHome}
      />

      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {!hasSearched ? (
            <HeroSection
              key="hero"
              onUpload={handleUpload}
              isProcessing={isProcessing}
              error={error}
              onBrowseAll={handleBrowseAllTrigger}
              onClearError={clearError}
            />
          ) : (
            <ResultsDashboard
              key="results"
              filteredJobs={filteredJobs}
              isBrowsingAll={isBrowsingAll}
              isProcessing={isFetchingMore}
              positionSearch={positionSearch}
              setPositionSearch={setPositionSearch}
              lastJobElementRef={lastJobElementRef}
              onBrowseAll={handleBrowseAllTrigger}
              onOpenUploadModal={() => { setUploadModalOpen(true); setModalError(null); }}
              onResetFilters={resetFilters}
            />
          )}
        </AnimatePresence>
      </main>

      <UploadModal
        open={uploadModalOpen}
        isProcessing={modalProcessing}
        error={modalError}
        onUpload={handleUploadFromModal}
        onClose={() => setUploadModalOpen(false)}
        onClearError={clearModalError} 
      />

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
            <ArrowUp className="w-6 h-6 group-hover:rotate-45 transition-transform duration-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
