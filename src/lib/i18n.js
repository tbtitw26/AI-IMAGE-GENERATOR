export const supportedLocales = ['en'];
export const defaultLocale = 'en';

const messages = {
  en: {
    footer: {
      companyName: 'DEXERIC OÜ',
      registration: 'Registry Code: 17569201',
      address: 'Pärnu mnt 20, Kesklinna linnaosa, 10141 Tallinn, Estonia',
      email: 'support@dexeric.ai',
      phone: '+372 (0) 6 123 456',
    },
    register: {
      pageTitle: 'Create your dexericai account',
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
