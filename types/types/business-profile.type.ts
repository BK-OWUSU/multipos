//Use this for your UI form and service response formatting
export type BusinessProfileResponse = {
  name: string;
  businessSlug: string;
  email: string;
  logoUrl?: string;
  fileKey?: string;
  phone: string;
  address: string;
  country: string;
  countryCode: string;
  currencyCode: string;
  currencySymbol: string;
  locale: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  timezone: string;
  workStartTime: string;
  workCloseTime: string;
  isEmailVerified: boolean;
  termsAgreement: boolean;
  isOnboarded: boolean;
  onboardingStep: number;
  counts: {
    shops: number;
    employees: number;
    products: number;
    customers: number;
  };
};