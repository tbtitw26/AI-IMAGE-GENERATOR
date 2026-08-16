/**
 * Company/Brand Configuration
 * Centralized source for company details, contact information, and branding
 */

export const COMPANY_INFO = {
  name: 'dexericai',
  tagline: 'AI Image Generation',
  description: 'Turn any idea into stunning images in seconds with AI',
  
  // Contact Information
  email: {
    support: 'info@dexericai.com',
    business: 'info@dexericai.com',
    sales: 'info@dexericai.com',
  },
  
  // Company Details
  headquarters: {
    address: 'Pärnu mnt 20, Kesklinna linnaosa',
    city: 'Tallinn, 10141',
    country: 'Harju maakond, Estonia',
  },
  
  // Legal Details
  legal: {
    companyNumber: '17569201', // Registry code
    taxId: '17569201',
    registeredName: 'DEXERIC OÜ',
  },
  
  // Social Links
  social: {
    twitter: '',
    linkedin: '',
    instagram: '',
    github: '',
  },
  
  // Support Information
  support: {
    phone: '', // To be updated by user
    hours: '24/7',
    responseTime: {
      free: '24-48 hours',
      creator: '12-24 hours',
      studio: '4-8 hours',
      professional: '2-4 hours',
      enterprise: 'Priority (1-2 hours)',
    },
  },
};

export default COMPANY_INFO;
