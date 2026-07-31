const fs = require('fs');
const path = require('path');

// Базова директорія проекту
const baseDir = process.cwd();

// Функція для створення директорії
function createDirectory(dirPath) {
  const fullPath = path.join(baseDir, dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Створено папку: ${dirPath}`);
  }
}

// Функція для створення файлу
function createFile(filePath, content = '') {
  const fullPath = path.join(baseDir, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Створено файл: ${filePath}`);
  }
}

// Створення основних папок
function createProjectStructure() {
  console.log('🚀 Починаємо створення структури проекту...\n');

  // PUBLIC ROUTES
  const publicRoutes = [
    'src/app/(public)',
    'src/app/(public)/features',
    'src/app/(public)/how-it-works',
    'src/app/(public)/pricing',
    'src/app/(public)/security',
    'src/app/(public)/faq',
    'src/app/(public)/about',
    'src/app/(public)/contact',
  ];

  // AUTH ROUTES
  const authRoutes = [
    'src/app/(auth)',
    'src/app/(auth)/login',
    'src/app/(auth)/register',
    'src/app/(auth)/forgot-password',
    'src/app/(auth)/reset-password',
    'src/app/(auth)/verify-email',
  ];

  // DASHBOARD ROUTES
  const dashboardRoutes = [
    'src/app/(dashboard)',
    'src/app/(dashboard)/dashboard',
    'src/app/(dashboard)/dashboard/generate',
    'src/app/(dashboard)/dashboard/projects',
    'src/app/(dashboard)/dashboard/gallery',
    'src/app/(dashboard)/dashboard/wallet',
    'src/app/(dashboard)/dashboard/top-up',
    'src/app/(dashboard)/dashboard/orders',
    'src/app/(dashboard)/dashboard/profile',
    'src/app/(dashboard)/dashboard/security',
    'src/app/(dashboard)/dashboard/settings',
  ];

  // LEGAL ROUTES
  const legalRoutes = [
    'src/app/(legal)',
    'src/app/(legal)/terms-and-conditions',
    'src/app/(legal)/privacy-policy',
    'src/app/(legal)/cookie-policy',
    'src/app/(legal)/acceptable-use-policy',
    'src/app/(legal)/refund-policy',
  ];

  // SYSTEM ROUTES
  const systemRoutes = [
    'src/app/(system)',
    'src/app/(system)/email-confirmed',
    'src/app/(system)/order-success',
    'src/app/(system)/order-failed',
    'src/app/(system)/404',
  ];

  // COMPONENTS
  const components = [
    // Common Components
    'src/components/common/Header',
    'src/components/common/Footer',
    'src/components/common/Button',
    'src/components/common/Container',
    
    // Public Components
    'src/components/public/Hero',
    'src/components/public/Features',
    'src/components/public/Pricing',
    'src/components/public/FAQ',
    
    // Auth Components
    'src/components/auth/LoginForm',
    'src/components/auth/RegisterForm',
    'src/components/auth/AuthWrapper',
    
    // Dashboard Components
    'src/components/dashboard/Sidebar',
    'src/components/dashboard/DashboardHeader',
    'src/components/dashboard/StatsCards',
    'src/components/dashboard/ImageGenerator',
    
    // UI Components
    'src/components/ui/Input',
    'src/components/ui/Select',
    'src/components/ui/Card',
  ];

  // STYLES
  const styles = [
    'src/styles/abstracts',
    'src/styles/base',
    'src/styles/themes',
  ];

  // OTHER DIRECTORIES
  const otherDirs = [
    'src/hooks',
    'src/context',
    'src/utils',
    'src/config',
    'public/images/icons',
    'public/fonts',
    'styles',
  ];

  // Створюємо всі папки
  const allDirs = [
    ...publicRoutes,
    ...authRoutes,
    ...dashboardRoutes,
    ...legalRoutes,
    ...systemRoutes,
    ...components,
    ...styles,
    ...otherDirs,
  ];

  allDirs.forEach(dir => createDirectory(dir));

  // Створюємо файли з базовим вмістом
  console.log('\n📄 Створюємо файли...\n');

  // PUBLIC PAGE FILES
  const publicPages = [
    'src/app/(public)/page.jsx',
    'src/app/(public)/features/page.jsx',
    'src/app/(public)/how-it-works/page.jsx',
    'src/app/(public)/pricing/page.jsx',
    'src/app/(public)/security/page.jsx',
    'src/app/(public)/faq/page.jsx',
    'src/app/(public)/about/page.jsx',
    'src/app/(public)/contact/page.jsx',
  ];

  // AUTH PAGE FILES
  const authPages = [
    'src/app/(auth)/login/page.jsx',
    'src/app/(auth)/register/page.jsx',
    'src/app/(auth)/forgot-password/page.jsx',
    'src/app/(auth)/reset-password/page.jsx',
    'src/app/(auth)/verify-email/page.jsx',
  ];

  // DASHBOARD PAGE FILES
  const dashboardPages = [
    'src/app/(dashboard)/dashboard/page.jsx',
    'src/app/(dashboard)/dashboard/generate/page.jsx',
    'src/app/(dashboard)/dashboard/projects/page.jsx',
    'src/app/(dashboard)/dashboard/gallery/page.jsx',
    'src/app/(dashboard)/dashboard/wallet/page.jsx',
    'src/app/(dashboard)/dashboard/top-up/page.jsx',
    'src/app/(dashboard)/dashboard/orders/page.jsx',
    'src/app/(dashboard)/dashboard/profile/page.jsx',
    'src/app/(dashboard)/dashboard/security/page.jsx',
    'src/app/(dashboard)/dashboard/settings/page.jsx',
  ];

  // LEGAL PAGE FILES
  const legalPages = [
    'src/app/(legal)/terms-and-conditions/page.jsx',
    'src/app/(legal)/privacy-policy/page.jsx',
    'src/app/(legal)/cookie-policy/page.jsx',
    'src/app/(legal)/acceptable-use-policy/page.jsx',
    'src/app/(legal)/refund-policy/page.jsx',
  ];

  // SYSTEM PAGE FILES
  const systemPages = [
    'src/app/(system)/email-confirmed/page.jsx',
    'src/app/(system)/order-success/page.jsx',
    'src/app/(system)/order-failed/page.jsx',
    'src/app/(system)/404/page.jsx',
  ];

  // LAYOUT FILES
  const layoutFiles = [
    'src/app/layout.jsx',
    'src/app/(dashboard)/layout.jsx',
  ];

  // COMPONENT FILES
  const componentFiles = [
    // Common
    'src/components/common/Header/index.jsx',
    'src/components/common/Header/Header.module.scss',
    'src/components/common/Footer/index.jsx',
    'src/components/common/Footer/Footer.module.scss',
    'src/components/common/Button/index.jsx',
    'src/components/common/Button/Button.module.scss',
    'src/components/common/Container/index.jsx',
    'src/components/common/Container/Container.module.scss',
    
    // Public
    'src/components/public/Hero/index.jsx',
    'src/components/public/Hero/Hero.module.scss',
    'src/components/public/Features/index.jsx',
    'src/components/public/Features/Features.module.scss',
    'src/components/public/Pricing/index.jsx',
    'src/components/public/Pricing/Pricing.module.scss',
    'src/components/public/FAQ/index.jsx',
    'src/components/public/FAQ/FAQ.module.scss',
    
    // Auth
    'src/components/auth/LoginForm/index.jsx',
    'src/components/auth/LoginForm/LoginForm.module.scss',
    'src/components/auth/RegisterForm/index.jsx',
    'src/components/auth/RegisterForm/RegisterForm.module.scss',
    'src/components/auth/AuthWrapper/index.jsx',
    'src/components/auth/AuthWrapper/AuthWrapper.module.scss',
    
    // Dashboard
    'src/components/dashboard/Sidebar/index.jsx',
    'src/components/dashboard/Sidebar/Sidebar.module.scss',
    'src/components/dashboard/DashboardHeader/index.jsx',
    'src/components/dashboard/DashboardHeader/DashboardHeader.module.scss',
    'src/components/dashboard/StatsCards/index.jsx',
    'src/components/dashboard/StatsCards/StatsCards.module.scss',
    'src/components/dashboard/ImageGenerator/index.jsx',
    'src/components/dashboard/ImageGenerator/ImageGenerator.module.scss',
    
    // UI
    'src/components/ui/Input/index.jsx',
    'src/components/ui/Input/Input.module.scss',
    'src/components/ui/Select/index.jsx',
    'src/components/ui/Select/Select.module.scss',
    'src/components/ui/Card/index.jsx',
    'src/components/ui/Card/Card.module.scss',
  ];

  // STYLE FILES
  const styleFiles = [
    'src/styles/abstracts/_variables.scss',
    'src/styles/abstracts/_mixins.scss',
    'src/styles/abstracts/_functions.scss',
    'src/styles/base/_reset.scss',
    'src/styles/base/_typography.scss',
    'src/styles/base/_utilities.scss',
    'src/styles/themes/_dark.scss',
    'src/styles/themes/_light.scss',
    'src/app/globals.scss',
    'styles/global.scss',
  ];

  // OTHER FILES
  const otherFiles = [
    'src/hooks/useAuth.js',
    'src/hooks/useImageGeneration.js',
    'src/hooks/useMediaQuery.js',
    'src/context/AuthContext.jsx',
    'src/context/ThemeContext.jsx',
    'src/utils/api.js',
    'src/utils/validators.js',
    'src/utils/helpers.js',
    'src/config/constants.js',
    'src/config/navigation.js',
    'src/app/not-found.jsx',
    '.env.local',
    '.gitignore',
    'next.config.js',
    'package.json',
    'README.md',
  ];

  // Створюємо всі файли
  const allFiles = [
    ...publicPages,
    ...authPages,
    ...dashboardPages,
    ...legalPages,
    ...systemPages,
    ...layoutFiles,
    ...componentFiles,
    ...styleFiles,
    ...otherFiles,
  ];

  allFiles.forEach(file => createFile(file));

  // Створюємо базовий .gitignore
  const gitignoreContent = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode
.idea
*.swp
*.swo
*~
`;

  // Створюємо базовий README.md
  const readmeContent = `# AI Image Generator

## Опис проекту
AI Image Generator - це веб-додаток для генерації зображень за допомогою штучного інтелекту.

## Технології
- Next.js 14
- React
- SCSS
- JavaScript

## Встановлення

### Крок 1: Клонування репозиторію
\`\`\`bash
git clone https://github.com/your-username/ai-image-generator.git
cd ai-image-generator
\`\`\`

### Крок 2: Встановлення залежностей
\`\`\`bash
npm install
# або
yarn install
# або
pnpm install
\`\`\`

### Крок 3: Налаштування середовища
Створіть файл \`.env.local\` і додайте необхідні змінні:
\`\`\`env
API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_URL=http://localhost:3000/api
\`\`\`

### Крок 4: Запуск проекту
\`\`\`bash
npm run dev
# або
yarn dev
# або
pnpm dev
\`\`\`

## Структура проекту

\`\`\`
ai-image-generator/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React компоненти
│   ├── styles/        # SCSS стилі
│   ├── hooks/         # Кастомні хуки
│   ├── context/       # React контексти
│   ├── utils/         # Утиліти
│   └── config/        # Конфігурація
├── public/            # Статичні файли
└── styles/           # Глобальні стилі
\`\`\`

## Маршрути

### Публічні
- \`/\` - Головна сторінка
- \`/features\` - Можливості
- \`/how-it-works\` - Як це працює
- \`/pricing\` - Ціни
- \`/security\` - Безпека
- \`/faq\` - Часті питання
- \`/about\` - Про нас
- \`/contact\` - Контакти

### Аутентифікація
- \`/login\` - Вхід
- \`/register\` - Реєстрація
- \`/forgot-password\` - Відновлення пароля
- \`/reset-password\` - Скидання пароля
- \`/verify-email\` - Підтвердження email

### Dashboard
- \`/dashboard\` - Головна панель
- \`/dashboard/generate\` - Генерація зображень
- \`/dashboard/projects\` - Проекти
- \`/dashboard/gallery\` - Галерея
- \`/dashboard/wallet\` - Гаманець
- \`/dashboard/top-up\` - Поповнення
- \`/dashboard/orders\` - Замовлення
- \`/dashboard/profile\` - Профіль
- \`/dashboard/security\` - Безпека
- \`/dashboard/settings\` - Налаштування

### Юридичні
- \`/terms-and-conditions\` - Умови використання
- \`/privacy-policy\` - Політика конфіденційності
- \`/cookie-policy\` - Політика cookie
- \`/acceptable-use-policy\` - Політика допустимого використання
- \`/refund-policy\` - Політика повернення

### Системні
- \`/email-confirmed\` - Email підтверджено
- \`/order-success\` - Замовлення успішне
- \`/order-failed\` - Замовлення невдале
- \`/404\` - Сторінка не знайдена

## Розробка

### Команди
- \`npm run dev\` - Запуск в режимі розробки
- \`npm run build\` - Збірка проекту
- \`npm run start\` - Запуск зібраного проекту
- \`npm run lint\` - Перевірка коду

## Ліцензія
MIT
`;

  // Створюємо файли з вмістом
  createFile('.gitignore', gitignoreContent);
  createFile('README.md', readmeContent);

  // Створюємо базовий package.json
  const packageJson = {
    name: "ai-image-generator",
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint"
    },
    dependencies: {
      "next": "14.0.4",
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "sass": "^1.69.5",
      "react-hook-form": "^7.48.2",
      "axios": "^1.6.2",
      "react-icons": "^4.12.0",
      "react-router-dom": "^6.20.1",
      "framer-motion": "^10.16.16",
      "react-hot-toast": "^2.4.1"
    },
    devDependencies: {
      "@types/node": "^20.10.0",
      "@types/react": "^18.2.42",
      "@types/react-dom": "^18.2.17",
      "eslint": "^8.55.0",
      "eslint-config-next": "14.0.4",
      "typescript": "^5.3.2"
    }
  };

  createFile('package.json', JSON.stringify(packageJson, null, 2));

  // Створюємо базовий next.config.js
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  sassOptions: {
    includePaths: ['./src/styles'],
    prependData: \`@import 'abstracts/_variables.scss'; @import 'abstracts/_mixins.scss';\`
  },
  images: {
    domains: ['api.unsplash.com', 'images.unsplash.com'],
  },
  env: {
    API_URL: process.env.API_URL,
  }
}

module.exports = nextConfig`;

  createFile('next.config.js', nextConfig);

  // Створюємо базовий .env.local
  const envContent = `# API
API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Database (приклад для MongoDB)
MONGODB_URI=mongodb://localhost:27017/ai-image-generator

# Email (приклад для SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@ai-image-generator.com

# Image Generation API
IMAGE_API_KEY=your-image-api-key
IMAGE_API_URL=https://api.imagegenerator.com/v1

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key`;

  createFile('.env.local', envContent);

  console.log('\n✅ Всі файли та папки успішно створено!');
  console.log('📁 Структура проекту готова до роботи.');
  console.log('\n🚀 Для запуску проекту виконайте:');
  console.log('  npm install');
  console.log('  npm run dev');
}

// Запускаємо створення структури
try {
  createProjectStructure();
} catch (error) {
  console.error('❌ Помилка при створенні структури:', error.message);
}