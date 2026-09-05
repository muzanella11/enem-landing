export interface Project {
  id: string;
  title: string;
  image: string[];
  /** Explicit cover pick, one of `image`'s entries - null/unset falls back to `image[0]`. */
  mainImage: string | null;
  url: string;
  year: string;
  description: string;
  technologies: string[];
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  description: string;
  roleSummary: string;
  /**
   * Free-text period (e.g. "November 2021 - Now"), not a structured date
   * range — matches the shape of the current `static/experience.json` data
   * being migrated in Story 11.
   */
  workingPeriode: string;
  experienceGained: string[];
  projects: Project[];
}
