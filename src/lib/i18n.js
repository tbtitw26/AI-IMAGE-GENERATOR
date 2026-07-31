export const supportedLocales = ['en'];
export const defaultLocale = 'en';

const messages = {
  en: {
    footer: {
      companyName: 'AetherFrame AI Ltd.',
      registration: 'Company No: 01234567 | VAT: GB 123 4567 89',
      address: '1 Market Square, San Francisco, CA 94103',
      email: 'support@aetherframe.ai',
      phone: '+1 (415) 555-0123',
    },
    register: {
      pageTitle: 'Create your AetherFrame account',
      submit: 'Create account',
      name: 'Name',
      surname: 'Surname',
      email: 'Email Address',
      password: 'Password',
      phone: 'Phone Number',
      dob: 'Date of Birth',
      streetAddress: 'Street Address, house number, apartment…',
      city: 'City',
      country: 'Country',
      postalCode: 'Post Code',
      agreeTerms: 'I agree to the Terms & Conditions and Privacy Policy.',
      success: 'A confirmation email has been sent. Please verify your address before logging in.',
    },
    login: {
      pageTitle: 'Welcome back',
      submit: 'Sign In',
      remember: 'Remember this device',
      forgotPassword: 'Forgot Password?',
    },
  },
};

export function getTranslations(locale) {
  return messages[supportedLocales.includes(locale) ? locale : defaultLocale];
}
