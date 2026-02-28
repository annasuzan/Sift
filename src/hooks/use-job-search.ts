import { useState, useEffect, useRef, useCallback } from "react";
import { Job } from "@/components/JobCard";

const API_URL = import.meta.env.VITE_API_URL;

export interface Filters {
  location: string;
  seniority: string;
  dateRange: string;
  employmentType: string;
  companySize: string;
}

const DEFAULT_FILTERS: Filters = {
  location: "",
  seniority: "",
  dateRange: "all",
  employmentType: "",
  companySize: "",
};

export function useJobSearch() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
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

  const seniorityOptions = Array.from(
    new Set(allJobs.map((j) => j.seniority_level).filter(Boolean))
  ).sort();

  const employmentOptions = Array.from(
    new Set(allJobs.map((j) => j.employment_type).filter(Boolean))
  ).sort();

  const clearError = () => setError(null);
  const clearModalError = () => setModalError(null);

  
  // ── Infinite scroll ref ──
  const lastJobElementRef = useCallback((node: HTMLDivElement) => {
    if (isProcessing) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && isBrowsingAll) {
        setPage((prev) => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isProcessing, hasMore, isBrowsingAll]);

  // ── Fetch all jobs (browse mode) ──
  useEffect(() => {
    if (!isBrowsingAll || !hasMore) return;
    const fetchAllJobs = async () => {
      setIsProcessing(true);
      try {
        const response = await fetch(`${API_URL}/api/jobs/all?page=${page}`);
        const newJobs = await response.json();
        if (newJobs.length < 20) setHasMore(false);
        setAllJobs((prev) => (page === 1 ? newJobs : [...prev, ...newJobs]));
      } catch {
        setError("Failed to load more jobs.");
      } finally {
        setIsProcessing(false);
      }
    };
    fetchAllJobs();
  }, [page, isBrowsingAll]);

  // ── Client-side filtering ──
  useEffect(() => {
    let result = isBrowsingAll
      ? [...allJobs]
      : allJobs.filter((job) => job.similarity > 0);

    if (positionSearch.trim()) {
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(positionSearch.toLowerCase()) ||
          job.company_name.toLowerCase().includes(positionSearch.toLowerCase())
      );
    }
    if (filters.location) {
      result = result.filter((job) =>
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.seniority) {
      result = result.filter((job) => job.seniority_level === filters.seniority);
    }
    if (filters.employmentType) {
      result = result.filter((job) =>
        job.employment_type?.toLowerCase().includes(filters.employmentType.toLowerCase())
      );
    }
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

  // ── Helpers ──
  const mapBackendError = (msg: string): string => {
    if (msg.includes("parse") || msg.includes("PDF") || msg.includes("text")) {
      return "Cannot process resume.";
    }
    return msg || "Failed to match resume.";
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

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

  // ── Upload (hero page) ──
  const handleUpload = async (file: File) => {
    setAllJobs([]);
    setFilteredJobs([]);
    setIsProcessing(true);
    setHasSearched(false);
    setIsBrowsingAll(false);
    setPage(1);
    setHasMore(false);
    setError(null);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const response = await fetch(`${API_URL}/api/jobs/match`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(mapBackendError(data?.error ?? ""));
      const matches = (data.matches ?? []).filter((j: Job) => j.id && j.title && j.similarity >= 60);
      setAllJobs(matches);
      setFilteredJobs(matches);
      setHasSearched(true);
      resetFilters();
      setPositionSearch("");
    } catch (err: any) {
      console.error("Upload failed", err);
      setError(err.message || "Server is offline or could not process resume.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Upload (modal) ──
  const handleUploadFromModal = async (file: File) => {
    setAllJobs([]);
    setFilteredJobs([]);
    setModalProcessing(true);
    setModalError(null);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const response = await fetch(`${API_URL}/api/jobs/match`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(mapBackendError(data?.error ?? ""));
      const matches = (data.matches ?? []).filter((j: Job) => j.id && j.title && j.similarity >= 60);
      setAllJobs(matches);
      setFilteredJobs(matches);
      setIsBrowsingAll(false);
      setHasSearched(true);
      setUploadModalOpen(false);
      setModalError(null);
      resetFilters();
      setPositionSearch("");
    } catch (err: any) {
      setModalError(err.message || "Server is offline or could not process resume.");
    } finally {
      setModalProcessing(false);
    }
  };

  return {
    // State
    isProcessing, hasSearched, error,
    allJobs, filteredJobs,
    filtersOpen, setFiltersOpen,
    positionSearch, setPositionSearch,
    filters, setFilters,
    isBrowsingAll, hasMore,
    uploadModalOpen, setUploadModalOpen,
    modalError, setModalError,
    modalProcessing,
    // Derived
    activeFilterCount, seniorityOptions, employmentOptions,
    // Refs
    lastJobElementRef,
    // Actions
    handleUpload, handleUploadFromModal,
    handleBrowseAllTrigger, handleGoHome,
    resetFilters,
    clearError,
    clearModalError,
  };
}
