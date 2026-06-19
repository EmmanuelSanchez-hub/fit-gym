"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WELCOME_TOUR_STEPS, SECTION_GUIDES } from "@/components/gym/constants";

interface UseTourProps {
  activeSection: string;
}

export function useTour({ activeSection }: UseTourProps) {
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourMode, setTourMode] = useState<"welcome" | "section">("welcome");
  const hasCheckedTour = useRef(false);

  // Show welcome tour on first visit
  useEffect(() => {
    if (hasCheckedTour.current) return;
    hasCheckedTour.current = true;

    const tourShown = localStorage.getItem("gymTourShown");
    if (!tourShown) {
      const timeout = setTimeout(() => {
        setShowTour(true);
        setTourMode("welcome");
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Show section guide when changing sections
  useEffect(() => {
    if (showTour) return;

    const tourShown = localStorage.getItem("gymTourShown");
    if (!tourShown) return;

    try {
      const sectionGuidesStored = localStorage.getItem("gymSectionGuides");
      const sectionGuides = sectionGuidesStored ? JSON.parse(sectionGuidesStored) : {};
      
      if (!sectionGuides[activeSection] && SECTION_GUIDES[activeSection]) {
        const timeout = setTimeout(() => {
          setShowTour(true);
          setTourMode("section");
          setTourStep(0);
        }, 300);
        return () => clearTimeout(timeout);
      }
    } catch {
      // Ignore parse errors
    }
  }, [activeSection, showTour]);

  const closeTour = useCallback(() => {
    setShowTour(false);
    if (tourMode === "welcome") {
      localStorage.setItem("gymTourShown", "true");
    } else if (tourMode === "section") {
      try {
        const sectionGuidesStored = localStorage.getItem("gymSectionGuides");
        const sectionGuides = sectionGuidesStored ? JSON.parse(sectionGuidesStored) : {};
        sectionGuides[activeSection] = true;
        localStorage.setItem("gymSectionGuides", JSON.stringify(sectionGuides));
      } catch {
        // Ignore errors
      }
    }
    setTourStep(0);
  }, [tourMode, activeSection]);

  const nextStep = useCallback(() => {
    const currentSteps = tourMode === "welcome" ? WELCOME_TOUR_STEPS : (SECTION_GUIDES[activeSection] || []);
    if (tourStep < currentSteps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      closeTour();
    }
  }, [tourMode, tourStep, activeSection, closeTour]);

  const prevStep = useCallback(() => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  }, [tourStep]);

  const startSectionGuide = useCallback((section: string) => {
    if (SECTION_GUIDES[section]) {
      setTourMode("section");
      setTourStep(0);
      setShowTour(true);
    }
  }, []);

  const startWelcomeGuide = useCallback(() => {
    setTourMode("welcome");
    setTourStep(0);
    setShowTour(true);
  }, []);

  const currentSteps = tourMode === "welcome" ? WELCOME_TOUR_STEPS : (SECTION_GUIDES[activeSection] || []);

  return {
    showTour,
    tourStep,
    tourMode,
    currentSteps,
    closeTour,
    nextStep,
    prevStep,
    startSectionGuide,
    startWelcomeGuide,
  };
}
