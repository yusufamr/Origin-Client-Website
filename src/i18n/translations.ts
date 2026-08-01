// Shared shape for both language dictionaries. Keeping this as a type (rather
// than deriving it from one language file) means TypeScript will flag any
// missing key in ar.ts or en.ts as soon as the other file changes.
export interface Dictionary {
  meta: {
    titleSuffix: string;
    defaultDescription: string;
  };
  nav: {
    home: string;
    products: string;
    portfolio: string;
    contact: string;
    requestCall: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  services: {
    title: string;
    subtitle: string;
    learnMore: string;
    seeAll: string;
  };
  whyUs: {
    title: string;
    subtitle: string;
    points: { title: string; description: string }[];
  };
  portfolioTeaser: {
    title: string;
    subtitle: string;
    seeAll: string;
  };
  portfolioPage: {
    title: string;
    description: string;
    intro: string;
    empty: string;
    dateLabel: string;
    viewImage: string;
  };
  productsPage: {
    title: string;
    description: string;
    intro: string;
    empty: string;
  };
  productCommon: {
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
    photoExamples: string;
    watchVideo: string;
    videoLabel: string;
  };
  contactPage: {
    title: string;
    description: string;
    intro: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    timeLabel: string;
    timeOptions: { any: string; morning: string; afternoon: string; evening: string };
    submit: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    errorBody: string;
    requiredError: string;
    phoneInvalidError: string;
  };
  footer: {
    tagline: string;
    quickLinks: string;
    followUs: string;
    contactUs: string;
    whatsapp: string;
    phone: string;
    address: string;
    copyright: string;
  };
  social: {
    instagram: string;
    tiktok: string;
    facebook: string;
    youtube: string;
    whatsapp: string;
  };
  common: {
    skipToContent: string;
    languageSwitch: string;
    close: string;
  };
  pagination: {
    previous: string;
    next: string;
    pageLabel: string;
  };
}
