'use client';

import React, { createContext, useContext, useState } from 'react';

export interface SubsectionNav {
  title: string;
}

export interface SectionNav {
  title: string;
  type?: string;
  subsections?: SubsectionNav[];
}

export interface TemplateNavData {
  id: string;
  name: string;
  category: string;
  icon: string;
  tier?: 'simple' | 'standard' | 'complex';
  globalInstructions: string[];
  sections: SectionNav[];
}

interface TemplateNavContextType {
  activeTemplate: TemplateNavData | null;
  setActiveTemplate: (tmpl: TemplateNavData | null) => void;
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
  scrollToSection: (id: string) => void;
  onAddSection?: () => void;
  setOnAddSection: (fn: (() => void) | undefined) => void;
}

const TemplateNavContext = createContext<TemplateNavContextType>({
  activeTemplate: null,
  setActiveTemplate: () => {},
  activeSectionId: null,
  setActiveSectionId: () => {},
  scrollToSection: () => {},
  setOnAddSection: () => {},
});

export function TemplateNavProvider({ children }: { children: React.ReactNode }) {
  const [activeTemplate, setActiveTemplate] = useState<TemplateNavData | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [onAddSection, setOnAddSection] = useState<(() => void) | undefined>(undefined);

  const scrollToSection = (elementId: string) => {
    setActiveSectionId(elementId);
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <TemplateNavContext.Provider
      value={{
        activeTemplate,
        setActiveTemplate,
        activeSectionId,
        setActiveSectionId,
        scrollToSection,
        onAddSection,
        setOnAddSection,
      }}
    >
      {children}
    </TemplateNavContext.Provider>
  );
}

export function useTemplateNav() {
  return useContext(TemplateNavContext);
}
