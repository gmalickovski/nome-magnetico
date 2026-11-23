import type { MockupTheme } from '../mockups/types';

export type NicheId = MockupTheme;

export interface NicheQuestionCard {
  number: string;
  title: string;
  description: string;
}

export interface NicheNoticeCopy {
  eyebrow: string;
  title: string;
  description: string;
  points: readonly string[];
}

export interface NicheFaqItem {
  question: string;
  answer: string;
}

export interface NicheAreaAffinityItem {
  area: string;
  numbers: string;
  summary: string;
}

export interface NichePageCopy {
  id: NicheId;
  route: string;
  ctaHref: string;
  seo: {
    title: string;
    description: string;
    keywords: string;
    productName: string;
    productDescription: string;
  };
  hero: {
    eyebrow: string;
    titleLead: string;
    titleHighlight: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaId: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    trustLine: string;
    sceneSrSummary: string;
  };
  questions: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly NicheQuestionCard[];
  };
  analysis: {
    eyebrow: string;
    title: string;
    description: string;
    leftBlock: {
      badge: string;
      title: string;
      description: string;
      srSummary: string;
    };
    rightBlock: {
      badge: string;
      title: string;
      description: string;
      srSummary: string;
      affinityCards?: readonly NicheAreaAffinityItem[];
    };
  };
  suggestions: {
    eyebrow: string;
    title: string;
    description: string;
    srSummary: string;
  };
  deliverables: {
    eyebrow: string;
    title: string;
    description: string;
    highlights: readonly string[];
    srSummary: string;
  };
  notice: NicheNoticeCopy | null;
  faq: readonly NicheFaqItem[];
  finalCta: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaId: string;
    footnote: string;
  };
}
