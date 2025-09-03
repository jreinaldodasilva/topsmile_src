
🚀 Complete Roadmap Summary
Phase 1: CRITICAL (0-4 weeks)

Performance Optimization - Bundle splitting, lazy loading, memoization
Security Hardening - CSP, input sanitization, rate limiting
Error Handling Enhancement - External monitoring integration

Phase 2: HIGH (3-8 weeks)

Testing Infrastructure - Jest, RTL, coverage reporting
SEO Implementation - Meta tags, structured data, sitemap
State Management Optimization - Zustand implementation

Phase 3: MEDIUM (6-16 weeks)

Advanced UI/UX - Data tables, modals, skeleton loaders
Progressive Web App - Offline support, installability
Internationalization - Multi-language support

Phase 4: LOW (10-20 weeks)

Analytics & Monitoring - User behavior tracking
Advanced Features - Real-time updates, advanced search
Developer Experience - Storybook, documentation


🎯 New Features & Enhancements Roadmap
🏥 Core Business Features (High Priority)
1. Patient Management System

Complete patient profiles with medical history
Treatment plans and progress tracking
Insurance integration
Family account linking
Photo documentation system
Prescription management

2. Advanced Appointment System

Recurring appointments
Group appointments
Waitlist management
SMS/Email reminders
Online booking widget
Treatment time estimation
Room/equipment scheduling

3. Financial Management

Invoice generation and management
Payment processing integration
Insurance claim processing
Financial reporting and analytics
Payment plans and installments
Expense tracking
Tax reporting

4. Clinical Tools

Digital radiography integration
Clinical notes templates
Treatment protocol guides
Dental charting
Lab work tracking
Referral management

📊 Analytics & Business Intelligence (Medium Priority)
1. Advanced Reporting

Patient acquisition analytics
Treatment success rates
Revenue forecasting
Staff productivity metrics
Patient satisfaction scores
Marketing campaign ROI

2. AI-Powered Insights

Predictive analytics for no-shows
Treatment recommendation engine
Optimal scheduling suggestions
Patient risk assessment
Revenue optimization recommendations

🔧 Technical Enhancements (Medium Priority)
1. Real-time Features

Live chat support
Real-time notifications
Collaborative editing
Live appointment updates
Socket.io integration

2. Advanced Search & Filtering

Full-text search across all data
Advanced filtering combinations
Saved search preferences
Search analytics
Auto-complete suggestions

3. API & Integrations

REST API documentation
Webhook support
Third-party integrations (Google Calendar, WhatsApp, etc.)
Import/Export tools
Backup and restore functionality

📱 Mobile & Cross-Platform (Medium Priority)
1. Mobile App Features

Native mobile app (React Native)
Push notifications
Offline functionality
Camera integration
Biometric authentication

2. Tablet Optimization

Tablet-specific layouts
Touch-optimized interactions
Split-screen functionality
Kiosk mode for waiting rooms

🎨 User Experience Enhancements (Low Priority)
1. Customization

Themes and branding
Customizable dashboards
User preference management
Layout customization
White-label solutions

2. Accessibility

WCAG 2.1 AA compliance
Screen reader support
Keyboard navigation
High contrast mode
Font size adjustment

⚡ Performance & Scalability (Low Priority)
1. Advanced Performance

Service worker caching strategies
CDN integration
Image optimization
Database query optimization
Microservices architecture

2. Scalability Features

Multi-tenant architecture
Horizontal scaling support
Load balancing
Database sharding
Caching layers (Redis)

Phase 1: Critical Priority 
1.1 Performance Optimization
// Bundle Analysis & Code Splitting
- Implement React.lazy for all route components
- Add bundle analyzer to identify large dependencies
- Split vendor chunks and optimize imports
- Implement preloading for critical routes
- Add React.memo for pure components
- Implement useMemo/useCallback for expensive operations

// Example implementation:
const LazyContactManagement = React.lazy(() => 
  import('./pages/Admin/ContactManagement').then(module => ({
    default: module.default
  }))
);

Deliverables:

Bundle size reduced by 30-40%
Lighthouse performance score >90
First Contentful Paint <2s
Largest Contentful Paint <2.5s

1.2 Security Hardening
// Content Security Policy
- Implement CSP headers
- Add input sanitization library (DOMPurify)
- Implement rate limiting on client actions
- Add CSRF protection
- Secure cookie configuration
- Environment variable security audit

// Example CSP implementation:
const cspPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", process.env.REACT_APP_API_URL]
};

1.3 Error Handling Enhancement
// Integrate Error Monitoring
- Set up Sentry or LogRocket integration
- Implement error retry mechanisms
- Add offline error handling
- Create error recovery strategies
- Implement user feedback collection

// Example Sentry integration:
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});

📈 Phase 2: High Priority
2.1 Testing Infrastructure
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// src/setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// src/utils/test-utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ErrorProvider } from '../contexts/ErrorContext';

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ErrorProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ErrorProvider>
    </BrowserRouter>
  );
};

const customRender = (ui: React.ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// src/components/ErrorBoundary/__tests__/ErrorBoundary.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import ErrorBoundary from '../ErrorBoundary';

const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary level="page" context="test">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(/ID do Erro:/)).toBeInTheDocument();
  });

  it('allows retry when retry count is not exceeded', () => {
    const { rerender } = render(
      <ErrorBoundary level="component">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    rerender(
      <ErrorBoundary level="component">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onErrorMock = jest.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('copies error details to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <ErrorBoundary level="page">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const copyButton = screen.getByRole('button', { name: /copiar detalhes/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Test error')
    );
  });
});

// src/hooks/__tests__/useApiState.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useApiState } from '../useApiState';

// Mock API service
const mockApiCall = jest.fn();

describe('useApiState', () => {
  beforeEach(() => {
    mockApiCall.mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useApiState());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful API call', async () => {
    const testData = { id: 1, name: 'Test' };
    mockApiCall.mockResolvedValueOnce(testData);

    const { result } = renderHook(() => useApiState());

    await act(async () => {
      const response = await result.current.execute(mockApiCall);
      expect(response).toEqual(testData);
    });

    expect(result.current.data).toEqual(testData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle API call errors', async () => {
    const errorMessage = 'API Error';
    mockApiCall.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useApiState());

    await act(async () => {
      const response = await result.current.execute(mockApiCall);
      expect(response).toBeNull();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should set loading state during API call', async () => {
    mockApiCall.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: 'test' }), 100))
    );

    const { result } = renderHook(() => useApiState());

    act(() => {
      result.current.execute(mockApiCall);
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.loading).toBe(false);
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useApiState({ initialData: 'initial' }));

    act(() => {
      result.current.setData('new data');
      result.current.setError('some error');
    });

    expect(result.current.data).toBe('new data');
    expect(result.current.error).toBe('some error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBe('initial');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

// src/components/ContactForm/__tests__/ContactForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import ContactForm from '../ContactForm';
import { apiService } from '../../../services/apiService';

// Mock API service
jest.mock('../../../services/apiService', () => ({
  apiService: {
    public: {
      sendContactForm: jest.fn()
    }
  }
}));

const mockSendContactForm = apiService.public.sendContactForm as jest.MockedFunction<typeof apiService.public.sendContactForm>;

describe('ContactForm', () => {
  beforeEach(() => {
    mockSendContactForm.mockClear();
  });

  it('renders all form fields', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clínica/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/especialidade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    render(<ContactForm />);

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/email é obrigatório/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    mockSendContactForm.mockResolvedValueOnce({
      success: true,
      data: { id: '123', protocol: 'PROT123', estimatedResponse: '24h' }
    });

    render(<ContactForm />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Dr. João Silva' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/clínica/i), {
      target: { value: 'Clínica Exemplo' }
    });
    fireEvent.change(screen.getByLabelText(/especialidade/i), {
      target: { value: 'Ortodontia' }
    });
    fireEvent.change(screen.getByLabelText(/telefone/i), {
      target: { value: '(11) 99999-9999' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(mockSendContactForm).toHaveBeenCalledWith({
        name: 'Dr. João Silva',
        email: 'joao@example.com',
        clinic: 'Clínica Exemplo',
        specialty: 'Ortodontia',
        phone: '(11) 99999-9999'
      });
    });

    expect(screen.getByText(/mensagem enviada com sucesso/i)).toBeInTheDocument();
  });

  it('handles form submission errors', async () => {
    mockSendContactForm.mockRejectedValueOnce(new Error('Network error'));

    render(<ContactForm />);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Dr. João Silva' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@example.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => {
      expect(screen.getByText(/erro ao enviar mensagem/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while submitting', async () => {
    mockSendContactForm.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { id: '123', protocol: 'PROT123', estimatedResponse: '24h' }
      }), 100))
    );

    render(<ContactForm />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Dr. João Silva' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@example.com' }
    });

    const submitButton = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled();
    });
  });
});

// package.json test scripts
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --ci --watchAll=false"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.8",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}

2.2 SEO Implementation
// src/components/SEO/SEOHead.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  canonicalUrl?: string;
  structuredData?: object;
}

const DEFAULT_SEO = {
  title: 'TopSmile - Sistema Completo para Gestão de Clínicas Odontológicas',
  description: 'Transforme sua clínica odontológica com nosso sistema completo: agenda online, prontuário digital, controle financeiro e CRM. Teste grátis!',
  keywords: 'sistema odontológico, gestão clínica dental, agenda odontológica, prontuário digital, software dentista',
  image: '/images/topsmile-og-image.jpg',
  url: 'https://topsmile.com.br',
  type: 'website' as const
};

const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noIndex = false,
  canonicalUrl,
  structuredData
}) => {
  const seoTitle = title ? `${title} | TopSmile` : DEFAULT_SEO.title;
  const seoDescription = description || DEFAULT_SEO.description;
  const seoKeywords = keywords || DEFAULT_SEO.keywords;
  const seoImage = image || DEFAULT_SEO.image;
  const seoUrl = url || DEFAULT_SEO.url;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="TopSmile" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;

// src/data/seoData.ts
export const pagesSEO = {
  home: {
    title: 'Sistema Completo para Gestão de Clínicas Odontológicas',
    description: 'Transforme sua clínica odontológica com nosso sistema completo: agenda online, prontuário digital, controle financeiro e CRM. Teste grátis por 30 dias!',
    keywords: 'sistema odontológico, gestão clínica dental, agenda odontológica, prontuário digital, software dentista, TopSmile',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "TopSmile",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "description": "Sistema completo para gestão de clínicas odontológicas",
      "offers": {
        "@type": "Offer",
        "price": "49",
        "priceCurrency": "BRL",
        "priceValidUntil": "2024-12-31",
        "availability": "https://schema.org/InStock"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "150"
      }
    }
  },
  features: {
    title: 'Recursos e Funcionalidades - TopSmile',
    description: 'Conheça todos os recursos do TopSmile: agenda inteligente, sincronização com Google, prontuário digital, controle financeiro e CRM para pacientes.',
    keywords: 'recursos topsmile, funcionalidades sistema odontológico, agenda digital dentista, prontuário eletrônico'
  },
  pricing: {
    title: 'Planos e Preços - TopSmile',
    description: 'Escolha o melhor plano para sua clínica. A partir de R$ 49/mês. Teste grátis por 30 dias, sem compromisso. Cancele quando quiser.',
    keywords: 'preço sistema odontológico, planos topsmile, software dentista preço, sistema clínica custo',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "TopSmile - Planos",
      "offers": [
        {
          "@type": "Offer",
          "name": "Plano Básico",
          "price": "49",
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "name": "Plano Profissional",
          "price": "99",
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "name": "Plano Premium",
          "price": "149",
          "priceCurrency": "BRL",
          "availability": "https://schema.org/InStock"
        }
      ]
    }
  },
  contact: {
    title: 'Entre em Contato - TopSmile',
    description: 'Fale conosco e descubra como o TopSmile pode transformar sua clínica odontológica. Suporte especializado e demonstração gratuita.',
    keywords: 'contato topsmile, suporte sistema odontológico, demonstração software dentista',
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "mainEntity": {
        "@type": "Organization",
        "name": "TopSmile",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Portuguese"
        }
      }
    }
  }
};

// src/hooks/useSEO.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface UseSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export const useSEO = ({ title, description, keywords }: UseSEOProps = {}) => {
  const location = useLocation();

  useEffect(() => {
    // Track page views for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_TRACKING_ID', {
        page_title: title,
        page_location: window.location.href,
        page_path: location.pathname,
      });
    }
  }, [location, title]);

  return { location };
};

// Updated page components with SEO
// src/pages/Home/Home.tsx
import React from 'react';
import Header from '../../components/Header/Header';
import Hero from '../../components/Hero/Hero';
import FeaturesSection from '../../components/Features/FeaturesSection/FeaturesSection';
import PricingSection from '../../components/Pricing/PricingSection/PricingSection';
import ContactForm from '../../components/ContactForm/ContactForm';
import TestimonialSection from '../../components/Testimonials/TestimonialSection/TestimonialSection';
import Footer from '../../components/Footer/Footer';
import SEOHead from '../../components/SEO/SEOHead';
import { pagesSEO } from '../../data/seoData';

const Home: React.FC = () => (
  <>
    <SEOHead {...pagesSEO.home} />
    <div className="font-sans text-gray-800">
      <Header />
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <ContactForm />
      <TestimonialSection />
      <Footer />
    </div>
  </>
);

export default Home;

// src/pages/Features/FeaturesPage.tsx
import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import FeaturesSection from '../../components/Features/FeaturesSection/FeaturesSection';
import SEOHead from '../../components/SEO/SEOHead';
import { pagesSEO } from '../../data/seoData';

const FeaturesPage: React.FC = () => (
  <>
    <SEOHead {...pagesSEO.features} />
    <Header />
    <main>
      <section className="bg-gradient-to-b from-blue-50 to-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">
            Recursos Completos para sua Clínica
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto mb-12">
            Descubra todas as funcionalidades que fazem do TopSmile a melhor 
            escolha para gestão da sua clínica odontológica.
          </p>
        </div>
      </section>
      <FeaturesSection />
    </main>
    <Footer />
  </>
);

export default FeaturesPage;

// src/components/SEO/BreadcrumbSchema.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  name: string;
  url: string;
}

const BreadcrumbSchema: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', url: 'https://topsmile.com.br' }
  ];

  // Build breadcrumb items based on current path
  let currentPath = '';
  pathnames.forEach((pathname) => {
    currentPath += `/${pathname}`;
    const name = pathname.charAt(0).toUpperCase() + pathname.slice(1);
    breadcrumbs.push({
      name: name === 'Features' ? 'Recursos' : 
            name === 'Pricing' ? 'Preços' :
            name === 'Contact' ? 'Contato' : name,
      url: `https://topsmile.com.br${currentPath}`
    });
  });

  if (breadcrumbs.length <= 1) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default BreadcrumbSchema;

// src/sitemap-generator.js (build script)
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://topsmile.com.br';

const routes = [
  { url: '', changefreq: 'weekly', priority: '1.0' },
  { url: '/features', changefreq: 'monthly', priority: '0.8' },
  { url: '/pricing', changefreq: 'monthly', priority: '0.9' },
  { url: '/contact', changefreq: 'monthly', priority: '0.7' }
];

const generateSitemap = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(__dirname, 'public', 'sitemap.xml'), sitemap);
  console.log('Sitemap generated successfully!');
};

generateSitemap();

// robots.txt (public/robots.txt)
User-agent: *
Allow: /

Sitemap: https://topsmile.com.br/sitemap.xml

# Block admin pages from search engines
Disallow: /admin/
Disallow: /login/
Disallow: /api/

// package.json - Add SEO dependencies and scripts
{
  "dependencies": {
    "react-helmet-async": "^1.3.0"
  },
  "scripts": {
    "build:sitemap": "node src/sitemap-generator.js",
    "prebuild": "npm run build:sitemap"
  }
}

2.3 State Management Optimization
// Alternative to Context API for better performance
// Install: npm install zustand

// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '../services/apiService';
import type { User } from '../types/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: (reason?: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ loading: true, error: null });
          
          const response = await apiService.auth.login(email, password);
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data;
            
            localStorage.setItem('topsmile_access_token', accessToken);
            localStorage.setItem('topsmile_refresh_token', refreshToken);
            
            set({
              user,
              accessToken,
              isAuthenticated: true,
              loading: false
            });
            
            return { success: true };
          } else {
            const errorMsg = response.message || 'E-mail ou senha inválidos';
            set({ error: errorMsg, loading: false });
            return { success: false, message: errorMsg };
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Erro de rede. Tente novamente.';
          set({ error: errorMsg, loading: false });
          return { success: false, message: errorMsg };
        }
      },

      register: async (data) => {
        try {
          set({ loading: true, error: null });
          
          const response = await apiService.auth.register(data);
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data;
            
            localStorage.setItem('topsmile_access_token', accessToken);
            localStorage.setItem('topsmile_refresh_token', refreshToken);
            
            set({
              user,
              accessToken,
              isAuthenticated: true,
              loading: false
            });
            
            return { success: true, message: 'Conta criada com sucesso!' };
          } else {
            const errorMsg = response.message || 'Erro ao criar conta';
            set({ error: errorMsg, loading: false });
            return { success: false, message: errorMsg };
          }
        } catch (err: any) {
          const errorMsg = err.message || 'Erro de rede. Tente novamente.';
          set({ error: errorMsg, loading: false });
          return { success: false, message: errorMsg };
        }
      },

      logout: async (reason?: string) => {
        try {
          const refreshToken = localStorage.getItem('topsmile_refresh_token');
          
          localStorage.removeItem('topsmile_access_token');
          localStorage.removeItem('topsmile_refresh_token');
          
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            loading: false,
            error: reason || null
          });
          
          if (refreshToken) {
            await apiService.auth.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        }
      },

      refreshUserData: async () => {
        try {
          const { accessToken } = get();
          if (!accessToken) return;
          
          const response = await apiService.auth.me();
          if (response.success && response.data) {
            set({ user: response.data });
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ loading }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (accessToken) => set({ accessToken, isAuthenticated: !!accessToken })
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// src/stores/contactStore.ts
import { create } from 'zustand';
import { apiService } from '../services/apiService';
import type { Contact, ContactFilters, ContactListResponse } from '../types/api';

interface ContactState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  filters: ContactFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ContactActions {
  fetchContacts: (filters?: ContactFilters) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  batchUpdateContacts: (ids: string[], updates: any) => Promise<void>;
  setFilters: (filters: Partial<ContactFilters>) => void;
  clearError: () => void;
  reset: () => void;
}

type ContactStore = ContactState & ContactActions;

const initialState: ContactState = {
  contacts: [],
  loading: false,
  error: null,
  filters: { page: 1, limit: 10 },
  pagination: { page: 1, limit: 10, total: 0, pages: 0 }
};

export const useContactStore = create<ContactStore>((set, get) => ({
  ...initialState,

  fetchContacts: async (newFilters) => {
    try {
      set({ loading: true, error: null });
      
      const filters = { ...get().filters, ...newFilters };
      set({ filters });
      
      const response = await apiService.contacts.getAll(filters);
      
      if (response.success && response.data) {
        const data = response.data as ContactListResponse;
        set({
          contacts: data.contacts,
          pagination: {
            page: data.page,
            limit: data.limit,
            total: data.total,
            pages: data.pages
          },
          loading: false
        });
      } else {
        throw new Error(response.message || 'Erro ao buscar contatos');
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        loading: false 
      });
    }
  },

  updateContact: async (id, updates) => {
    try {
      const response = await apiService.contacts.update(id, updates);
      
      if (response.success && response.data) {
        const { contacts } = get();
        const updatedContacts = contacts.map(contact => 
          (contact._id === id || contact.id === id) 
            ? { ...contact, ...response.data } 
            : contact
        );
        set({ contacts: updatedContacts });
      } else {
        throw new Error(response.message || 'Erro ao atualizar contato');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar contato' });
      throw error;
    }
  },

  deleteContact: async (id) => {
    try {
      await apiService.contacts.delete(id);
      
      const { contacts, pagination } = get();
      const updatedContacts = contacts.filter(contact => 
        contact._id !== id && contact.id !== id
      );
      
      set({ 
        contacts: updatedContacts,
        pagination: {
          ...pagination,
          total: Math.max(0, pagination.total - 1)
        }
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao excluir contato' });
      throw error;
    }
  },

  batchUpdateContacts: async (contactIds, updates) => {
    try {
      const response = await apiService.contacts.batchUpdate(contactIds, updates);
      
      if (response.success) {
        // Refresh contacts after batch update
        await get().fetchContacts();
      } else {
        throw new Error(response.message || 'Erro na operação em lote');
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro na operação em lote' });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set({ filters });
  },

  clearError: () => set({ error: null }),
  
  reset: () => set(initialState)
}));

// src/stores/notificationStore.ts
import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  notifications: Notification[];
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showSuccess: (title: string, message: string, options?: Partial<Notification>) => string;
  showError: (title: string, message: string, options?: Partial<Notification>) => string;
  showWarning: (title: string, message: string, options?: Partial<Notification>) => string;
  showInfo: (title: string, message: string, options?: Partial<Notification>) => string;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration ?? (notification.type === 'success' ? 5000 : notification.type === 'info' ? 7000 : 0)
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearAll: () => set({ notifications: [] }),

  showSuccess: (title, message, options) => {
    return get().addNotification({ ...options, type: 'success', title, message });
  },

  showError: (title, message, options) => {
    return get().addNotification({ ...options, type: 'error', title, message });
  },

  showWarning: (title, message, options) => {
    return get().addNotification({ ...options, type: 'warning', title, message });
  },

  showInfo: (title, message, options) => {
    return get().addNotification({ ...options, type: 'info', title, message });
  }
}));

// src/stores/dashboardStore.ts
import { create } from 'zustand';
import { apiService } from '../services/apiService';
import type { DashboardStats } from '../types/api';

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface DashboardActions {
  fetchStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: null,
  lastUpdated: null
};

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  ...initialState,

  fetchStats: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await apiService.dashboard.getStats();
      
      if (response.success && response.data) {
        set({
          stats: response.data,
          loading: false,
          lastUpdated: new Date()
        });
      } else {
        throw new Error(response.message || 'Erro ao buscar dados do dashboard');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        loading: false
      });
    }
  },

  refreshStats: async () => {
    const { fetchStats } = get();
    await fetchStats();
  },

  clearError: () => set({ error: null }),
  
  reset: () => set(initialState)
}));

// Usage example in components
// src/components/Admin/ContactList.tsx (Updated)
import React, { useEffect } from 'react';
import { useContactStore } from '../../../stores/contactStore';
import { useNotificationStore } from '../../../stores/notificationStore';

const ContactList: React.FC = () => {
  const {
    contacts,
    loading,
    error,
    pagination,
    fetchContacts,
    updateContact,
    deleteContact,
    setFilters,
    clearError
  } = useContactStore();

  const { showSuccess, showError } = useNotificationStore();

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleStatusUpdate = async (contactId: string, newStatus: string) => {
    try {
      await updateContact(contactId, { status: newStatus });
      showSuccess('Sucesso', 'Status do contato atualizado');
    } catch (error) {
      showError('Erro', 'Falha ao atualizar status do contato');
    }
  };

  const handleDelete = async (contactId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contato?')) {
      try {
        await deleteContact(contactId);
        showSuccess('Sucesso', 'Contato excluído com sucesso');
      } catch (error) {
        showError('Erro', 'Falha ao excluir contato');
      }
    }
  };

  const handleSearch = (query: string) => {
    setFilters({ search: query, page: 1 });
    fetchContacts();
  };

  // Rest of component implementation...
  return (
    <div className="contact-list">
      {/* Component JSX */}
    </div>
  );
};

export default ContactList;

📊 Phase 3: Medium Priority
3.1 Advanced UI/UX Enhancements
// src/components/UI/LoadingSpinner/LoadingSpinner.tsx
import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  text,
  overlay = false
}) => {
  const spinnerClass = `loading-spinner loading-spinner--${size} loading-spinner--${color}`;
  const content = (
    <div className={spinnerClass}>
      <div className="loading-spinner__circle"></div>
      {text && <span className="loading-spinner__text">{text}</span>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-spinner__overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;

// src/components/UI/SkeletonLoader/SkeletonLoader.tsx
import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'table' | 'contact-list' | 'dashboard';
  rows?: number;
  animate?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  rows = 3,
  animate = true
}) => {
  const baseClass = `skeleton-loader ${animate ? 'skeleton-loader--animate' : ''}`;

  if (type === 'contact-list') {
    return (
      <div className={`${baseClass} skeleton-loader--contact-list`}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="skeleton-contact-row">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-content">
              <div className="skeleton-line skeleton-line--name"></div>
              <div className="skeleton-line skeleton-line--email"></div>
            </div>
            <div className="skeleton-status"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className={`${baseClass} skeleton-loader--dashboard`}>
        <div className="skeleton-stats-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-stat-card">
              <div className="skeleton-line skeleton-line--title"></div>
              <div className="skeleton-line skeleton-line--value"></div>
            </div>
          ))}
        </div>
        <div className="skeleton-chart">
          <div className="skeleton-line skeleton-line--chart-title"></div>
          <div className="skeleton-chart-content"></div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`${baseClass} skeleton-loader--table`}>
        <div className="skeleton-table-header">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton-line skeleton-line--header"></div>
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: 5 }).map((_, colIndex) => (
              <div key={colIndex} className="skeleton-line skeleton-line--cell"></div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${baseClass} skeleton-loader--${type}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-line"></div>
      ))}
    </div>
  );
};

export default SkeletonLoader;

// src/components/UI/VirtualizedList/VirtualizedList.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import './VirtualizedList.css';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  onItemClick?: (item: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  className = '',
  onItemClick,
  loading = false,
  emptyMessage = 'Nenhum item encontrado'
}: VirtualizedListProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    const isSelected = selectedIndex === index;

    const handleClick = () => {
      setSelectedIndex(index);
      onItemClick?.(item, index);
    };

    return (
      <div
        style={style}
        className={`virtualized-list__item ${isSelected ? 'virtualized-list__item--selected' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
      >
        {renderItem(item, index)}
      </div>
    );
  }, [items, selectedIndex, renderItem, onItemClick]);

  if (loading) {
    return (
      <div className={`virtualized-list ${className}`}>
        <div className="virtualized-list__loading">
          Carregando...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`virtualized-list ${className}`}>
        <div className="virtualized-list__empty">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`virtualized-list ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={itemHeight}
            itemData={items}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

export default VirtualizedList;

// src/components/UI/SearchableSelect/SearchableSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

interface Option {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | number;
  placeholder?: string;
  onSelect: (option: Option) => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  multiple?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  placeholder = 'Selecione uma opção...',
  onSelect,
  onSearch,
  loading = false,
  disabled = false,
  clearable = false,
  multiple = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
  const selectRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleSelect = (option: Option) => {
    if (option.disabled) return;

    if (multiple) {
      const isSelected = selectedOptions.some(opt => opt.value === option.value);
      if (isSelected) {
        setSelectedOptions(prev => prev.filter(opt => opt.value !== option.value));
      } else {
        setSelectedOptions(prev => [...prev, option]);
      }
    } else {
      onSelect(option);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleClear = () => {
    if (multiple) {
      setSelectedOptions([]);
    } else {
      onSelect({ label: '', value: '' });
    }
  };

  return (
    <div 
      ref={selectRef}
      className={`searchable-select ${isOpen ? 'searchable-select--open' : ''} ${disabled ? 'searchable-select--disabled' : ''}`}
    >
      <div 
        className="searchable-select__trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="searchable-select__value">
          {multiple && selectedOptions.length > 0 ? (
            <div className="searchable-select__tags">
              {selectedOptions.map(option => (
                <span key={option.value} className="searchable-select__tag">
                  {option.label}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option);
                    }}
                    className="searchable-select__tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            <span className="searchable-select__placeholder">{placeholder}</span>
          )}
        </div>
        
        <div className="searchable-select__indicators">
          {clearable && (selectedOption || selectedOptions.length > 0) && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="searchable-select__clear"
            >
              ×
            </button>
          )}
          <div className="searchable-select__arrow">▼</div>
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select__dropdown">
          <input
            type="text"
            className="searchable-select__search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
          
          <div className="searchable-select__options">
            {loading ? (
              <div className="searchable-select__loading">Carregando...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="searchable-select__no-options">Nenhuma opção encontrada</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`searchable-select__option ${
                    option.disabled ? 'searchable-select__option--disabled' : ''
                  } ${
                    selectedOptions.some(opt => opt.value === option.value) || option.value === value
                      ? 'searchable-select__option--selected'
                      : ''
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={selectedOptions.some(opt => opt.value === option.value)}
                      readOnly
                      className="searchable-select__checkbox"
                    />
                  )}
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

// src/components/UI/DataTable/DataTable.tsx
import React, { useState, useMemo } from 'react';
import { useVirtual } from 'react-virtual';
import './DataTable.css';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T, index: number) => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string>) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  pageSize?: number;
  virtualized?: boolean;
  emptyMessage?: string;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRowClick,
  onSort,
  onFilter,
  selectable = false,
  onSelectionChange,
  pageSize = 50,
  virtualized = false,
  emptyMessage = 'Nenhum dado encontrado'
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Sort and filter data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row =>
          String(row[key]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
      });
    }

    return filtered;
  }, [data, filters, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (virtualized) return processedData;
    
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize, virtualized]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  const handleSort = (key: keyof T) => {
    if (!columns.find(col => col.key === key)?.sortable) return;

    const direction = 
      sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
    setCurrentPage(1);
  };

  const handleRowSelect = (index: number) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(index)) {
      newSelectedRows.delete(index);
    } else {
      newSelectedRows.add(index);
    }
    setSelectedRows(newSelectedRows);
    
    const selectedData = Array.from(newSelectedRows).map(i => processedData[i]);
    onSelectionChange?.(selectedData);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === processedData.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allRows = new Set(processedData.map((_, index) => index));
      setSelectedRows(allRows);
      onSelectionChange?.(processedData);
    }
  };

  if (loading) {
    return (
      <div className="data-table data-table--loading">
        <div className="data-table__loading">
          <div className="loading-spinner"></div>
          <span>Carregando dados...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="data-table data-table--empty">
        <div className="data-table__empty">
          <div className="data-table__empty-icon">📊</div>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table">
      {/* Filters */}
      <div className="data-table__filters">
        {columns
          .filter(col => col.filterable)
          .map(column => (
            <input
              key={String(column.key)}
              type="text"
              placeholder={`Filtrar por ${column.header}...`}
              value={filters[String(column.key)] || ''}
              onChange={(e) => handleFilter(String(column.key), e.target.value)}
              className="data-table__filter-input"
            />
          ))}
      </div>

      {/* Table */}
      <div className="data-table__container">
        <table className="data-table__table">
          <thead>
            <tr>
              {selectable && (
                <th className="data-table__header data-table__header--checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === processedData.length && processedData.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className={`data-table__header ${
                    column.sortable ? 'data-table__header--sortable' : ''
                  } ${
                    column.align ? `data-table__header--${column.align}` : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="data-table__header-content">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="data-table__sort-indicator">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? '↑' : '↓'
                        ) : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`data-table__row ${
                  selectedRows.has(rowIndex) ? 'data-table__row--selected' : ''
                } ${
                  onRowClick ? 'data-table__row--clickable' : ''
                }`}
                onClick={() => onRowClick?.(row, rowIndex)}
              >
                {selectable && (
                  <td className="data-table__cell data-table__cell--checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => handleRowSelect(rowIndex)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td
                    key={String(column.key)}
                    className={`data-table__cell ${
                      column.align ? `data-table__cell--${column.align}` : ''
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : String(row[column.key] || '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!virtualized && totalPages > 1 && (
        <div className="data-table__pagination">
          <div className="data-table__pagination-info">
            Mostrando {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, processedData.length)} de {processedData.length} registros
          </div>
          <div className="data-table__pagination-controls">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="data-table__pagination-button"
            >
              Anterior
            </button>
            <span className="data-table__pagination-current">
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="data-table__pagination-button"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;

// src/components/UI/Modal/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  className?: string;
  overlayClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closable = true,
  className = '',
  overlayClassName = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closable) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closable]);

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closable) {
      onClose();
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`modal__overlay ${overlayClassName}`}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleOverlayClick}
        >
          <motion.div
            ref={modalRef}
            className={`modal modal--${size} ${className}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {(title || closable) && (
              <div className="modal__header">
                {title && (
                  <h2 id="modal-title" className="modal__title">
                    {title}
                  </h2>
                )}
                {closable && (
                  <button
                    onClick={onClose}
                    className="modal__close"
                    aria-label="Fechar modal"
                    type="button"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
            <div className="modal__content">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;

// src/components/UI/FloatingActionButton/FloatingActionButton.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './FloatingActionButton.css';

interface FABAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  actions?: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  color?: string;
  size?: 'small' | 'medium' | 'large';
  tooltip?: string;
  onClick?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  actions = [],
  position = 'bottom-right',
  color = '#007bff',
  size = 'medium',
  tooltip,
  onClick
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMainClick = () => {
    if (actions.length > 0) {
      setIsOpen(!isOpen);
    } else {
      onClick?.();
    }
  };

  const handleActionClick = (action: FABAction) => {
    action.onClick();
    setIsOpen(false);
  };

  const fabVariants = {
    idle: { rotate: 0 },
    expanded: { rotate: 45 }
  };

  const actionVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (index: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: index * 0.05,
        duration: 0.2
      }
    }),
    exit: { scale: 0, opacity: 0 }
  };

  return (
    <div className={`fab-container fab-container--${position}`}>
      <AnimatePresence>
        {isOpen && actions.length > 0 && (
          <div className="fab-actions">
            {actions.map((action, index) => (
              <motion.div
                key={index}
                custom={actions.length - index - 1}
                variants={actionVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fab-action"
              >
                <button
                  className={`fab fab--${size} fab-action__button`}
                  onClick={() => handleActionClick(action)}
                  style={{ backgroundColor: action.color || color }}
                  title={action.label}
                >
                  {action.icon}
                </button>
                <span className="fab-action__label">{action.label}</span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        className={`fab fab--${size} fab--main`}
        onClick={handleMainClick}
        style={{ backgroundColor: color }}
        variants={fabVariants}
        animate={isOpen ? 'expanded' : 'idle'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={tooltip}
      >
        {icon}
      </motion.button>
    </div>
  );
};

export default FloatingActionButton;

// Usage example in ContactManagement
// src/components/Admin/ContactManagement/ContactManagement.tsx
import React, { useState } from 'react';
import DataTable from '../../UI/DataTable/DataTable';
import Modal from '../../UI/Modal/Modal';
import FloatingActionButton from '../../UI/FloatingActionButton/FloatingActionButton';
import SearchableSelect from '../../UI/SearchableSelect/SearchableSelect';
import { useContactStore } from '../../../stores/contactStore';
import type { Contact } from '../../../types/api';

const ContactManagement: React.FC = () => {
  const { contacts, loading, fetchContacts, updateContact, deleteContact } = useContactStore();
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'batch'>('create');

  const columns = [
    {
      key: 'name' as keyof Contact,
      header: 'Nome',
      sortable: true,
      filterable: true,
      render: (value: string, row: Contact) => (
        <div className="contact-name">
          <strong>{value}</strong>
          <small>{row.email}</small>
        </div>
      )
    },
    {
      key: 'clinic' as keyof Contact,
      header: 'Clínica',
      sortable: true,
      filterable: true
    },
    {
      key: 'status' as keyof Contact,
      header: 'Status',
      sortable: true,
      render: (value: string, row: Contact) => (
        <SearchableSelect
          options={[
            { label: 'Novo', value: 'new' },
            { label: 'Contatado', value: 'contacted' },
            { label: 'Qualificado', value: 'qualified' },
            { label: 'Convertido', value: 'converted' },
            { label: 'Fechado', value: 'closed' }
          ]}
          value={value}
          onSelect={(option) => updateContact(row._id || row.id || '', { status: option.value as any })}
        />
      )
    },
    {
      key: 'createdAt' as keyof Contact,
      header: 'Data de Criação',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

  const fabActions = [
    {
      icon: '👤',
      label: 'Novo Contato',
      onClick: () => {
        setModalType('create');
        setIsModalOpen(true);
      }
    },
    {
      icon: '📤',
      label: 'Exportar',
      onClick: () => {
        // Export functionality
      }
    },
    {
      icon: '🔄',
      label: 'Sincronizar',
      onClick: () => fetchContacts()
    }
  ];

  return (
    <div className="contact-management">
      <div className="contact-management__header">
        <h1>Gestão de Contatos</h1>
        {selectedContacts.length > 0 && (
          <div className="contact-management__actions">
            <button onClick={() => setModalType('batch') && setIsModalOpen(true)}>
              Ação em Lote ({selectedContacts.length})
            </button>
          </div>
        )}
      </div>

      <DataTable
        data={contacts}
        columns={columns}
        loading={loading}
        selectable
        onSelectionChange={setSelectedContacts}
        onRowClick={(contact) => {
          setModalType('edit');
          setIsModalOpen(true);
        }}
        emptyMessage="Nenhum contato encontrado. Que tal criar o primeiro?"
      />

      <FloatingActionButton
        icon="+"
        actions={fabActions}
        tooltip="Ações rápidas"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'create' ? 'Novo Contato' :
          modalType === 'edit' ? 'Editar Contato' :
          'Ação em Lote'
        }
        size="medium"
      >
        {/* Modal content based on modalType */}
        <div>Modal content here...</div>
      </Modal>
    </div>
  );
};

3.2 Progressive Web App (PWA)
// public/manifest.json
{
  "name": "TopSmile - Sistema de Gestão para Clínicas",
  "short_name": "TopSmile",
  "description": "Sistema completo para gestão de clínicas odontológicas",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#007bff",
  "background_color": "#ffffff",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "pt-BR",
  "categories": ["business", "medical", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Acessar dashboard administrativo",
      "url": "/admin",
      "icons": [{"src": "/icons/shortcut-dashboard.png", "sizes": "96x96"}]
    },
    {
      "name": "Contatos",
      "short_name": "Contatos",
      "description": "Gerenciar contatos",
      "url": "/admin/contacts",
      "icons": [{"src": "/icons/shortcut-contacts.png", "sizes": "96x96"}]
    },
    {
      "name": "Agenda",
      "short_name": "Agenda",
      "description": "Ver agenda de compromissos",
      "url": "/calendar",
      "icons": [{"src": "/icons/shortcut-calendar.png", "sizes": "96x96"}]
    }
  ]
}

// src/hooks/usePWA.ts
import { useState, useEffect } from 'react';

interface PWAPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  return {
    showInstallPrompt,
    isInstalled,
    isOnline,
    installApp,
    dismissInstallPrompt
  };
};

// src/components/PWA/InstallPrompt/InstallPrompt.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../../hooks/usePWA';
import './InstallPrompt.css';

const InstallPrompt: React.FC = () => {
  const { showInstallPrompt, installApp, dismissInstallPrompt } = usePWA();

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      // Track installation analytics
      if (window.gtag) {
        window.gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: 'User installed PWA'
        });
      }
    }
  };

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          className="install-prompt"
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3 }}
        >
          <div className="install-prompt__content">
            <div className="install-prompt__icon">📱</div>
            <div className="install-prompt__text">
              <h3>Instalar TopSmile</h3>
              <p>Adicione o TopSmile à sua tela inicial para acesso rápido e experiência otimizada</p>
            </div>
            <div className="install-prompt__actions">
              <button
                onClick={handleInstall}
                className="install-prompt__button install-prompt__button--primary"
              >
                Instalar
              </button>
              <button
                onClick={dismissInstallPrompt}
                className="install-prompt__button install-prompt__button--secondary"
              >
                Agora não
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;

// src/serviceWorker.ts
const CACHE_NAME = 'topsmile-v1';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/auth\/me/,
  /\/api\/dashboard/,
  /\/api\/admin\/contacts\?/
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and navigation
  event.respondWith(handleStaticRequest(request));
});

async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const cacheable = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));

  if (request.method === 'GET' && cacheable) {
    try {
      // Try network first for fresh data
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Cache successful response
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      // Network failed, try cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
  }

  // For non-cacheable requests or POST/PUT/DELETE, always try network
  try {
    return await fetch(request);
  } catch (error) {
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Você está offline. Esta ação não pode ser realizada no momento.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function handleStaticRequest(request: Request): Promise<Response> {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Process offline actions stored in IndexedDB
    console.log('Processing offline actions...');
    
    // Send analytics about sync
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          message: 'Sincronização concluída'
        });
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  const options = {
    body: event.data?.text() || 'Nova notificação do TopSmile',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('TopSmile', options)
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/admin')
    );
  }
});

// src/utils/offlineStorage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

interface TopSmileDB extends DBSchema {
  offlineActions: {
    key: string;
    value: OfflineAction;
  };
  cachedData: {
    key: string;
    value: {
      data: any;
      timestamp: number;
      ttl: number;
    };
  };
}

class OfflineStorageManager {
  private db: IDBPDatabase<TopSmileDB> | null = null;

  async init() {
    if (!this.db) {
      this.db = await openDB<TopSmileDB>('TopSmileDB', 1, {
        upgrade(db) {
          db.createObjectStore('offlineActions');
          db.createObjectStore('cachedData');
        },
      });
    }
    return this.db;
  }

  async addOfflineAction(type: string, data: any) {
    const db = await this.init();
    const action: OfflineAction = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    await db.put('offlineActions', action, action.id);
    
    // Register for background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
    }

    return action.id;
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    const db = await this.init();
    return await db.getAll('offlineActions');
  }

  async removeOfflineAction(id: string) {
    const db = await this.init();
    await db.delete('offlineActions', id);
  }

  async cacheData(key: string, data: any, ttlMinutes: number = 30) {
    const db = await this.init();
    await db.put('cachedData', {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    }, key);
  }

  async getCachedData(key: string) {
    const db = await this.init();
    const cached = await db.get('cachedData', key);
    
    if (!cached) return null;
    
    // Check if data is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      await db.delete('cachedData', key);
      return null;
    }
    
    return cached.data;
  }

  async clearExpiredCache() {
    const db = await this.init();
    const allCached = await db.getAll('cachedData');
    const now = Date.now();

    for (const [key, value] of Object.entries(allCached)) {
      if (now - value.timestamp > value.ttl) {
        await db.delete('cachedData', key);
      }
    }
  }
}

export const offlineStorage = new OfflineStorageManager();

// src/hooks/useOfflineActions.ts
import { useState, useEffect } from 'react';
import { usePWA } from './usePWA';
import { offlineStorage } from '../utils/offlineStorage';
import { useNotificationStore } from '../stores/notificationStore';

export const useOfflineActions = () => {
  const { isOnline } = usePWA();
  const { showInfo } = useNotificationStore();
  const [pendingActions, setPendingActions] = useState(0);

  useEffect(() => {
    const checkPendingActions = async () => {
      const actions = await offlineStorage.getOfflineActions();
      setPendingActions(actions.length);
    };

    checkPendingActions();

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          checkPendingActions();
          showInfo('Sincronização', event.data.message);
        }
      });
    }
  }, [showInfo]);

  const addOfflineAction = async (type: string, data: any) => {
    if (isOnline) return null;

    const actionId = await offlineStorage.addOfflineAction(type, data);
    setPendingActions(prev => prev + 1);
    
    showInfo(
      'Ação armazenada',
      'Esta ação será processada quando você estiver online novamente'
    );
    
    return actionId;
  };

  return {
    pendingActions,
    addOfflineAction
  };
};

// Updated App.tsx to include PWA components
// src/App.tsx (additions)
import InstallPrompt from './components/PWA/InstallPrompt/InstallPrompt';
import OfflineIndicator from './components/PWA/OfflineIndicator/OfflineIndicator';

const App: React.FC = () => (
  <ErrorBoundary level="critical" context="app-root">
    <ErrorProvider>
      <Router>
        <AuthProvider>
          <ErrorBoundary level="page" context="router">
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* ... existing routes ... */}
              </Routes>
            </Suspense>
          </ErrorBoundary>
          
          {/* Global notification container */}
          <NotificationContainer />
          
          {/* PWA Components */}
          <InstallPrompt />
          <OfflineIndicator />
        </AuthProvider>
      </Router>
    </ErrorProvider>
  </ErrorBoundary>
);

// src/index.tsx (service worker registration)
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/serviceWorker.js');
      console.log('SW registered: ', registration);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              if (window.confirm('Nova versão disponível! Deseja atualizar?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.log('SW registration failed: ', error);
    }
  });
}
    </AnimatePresence>
  );
};

export default InstallPrompt;

// src/components/PWA/OfflineIndicator/OfflineIndicator.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../../hooks/usePWA';
import './OfflineIndicator.css';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="offline-indicator"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
        >
          <div className="offline-indicator__content">
            <span className="offline-indicator__icon">📶</span>
            <span className="offline-indicator__text">
              Você está offline. Algumas funcionalidades podem estar limitadas.
            </span>
          </div>
        </motion.div>
      )}

      3.3 Internationalization (i18n)
      // Install: npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend

// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Import translations
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES }
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    debug: process.env.NODE_ENV === 'development',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}.json',
    },

    react: {
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },
  });

export default i18n;

// src/i18n/locales/pt-BR.json
{
  "common": {
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso",
    "warning": "Aviso",
    "info": "Informação",
    "cancel": "Cancelar",
    "confirm": "Confirmar",
    "save": "Salvar",
    "edit": "Editar",
    "delete": "Excluir",
    "create": "Criar",
    "update": "Atualizar",
    "search": "Buscar",
    "filter": "Filtrar",
    "clear": "Limpar",
    "refresh": "Atualizar",
    "export": "Exportar",
    "import": "Importar",
    "close": "Fechar",
    "open": "Abrir",
    "yes": "Sim",
    "no": "Não"
  },
  "navigation": {
    "home": "Início",
    "features": "Recursos",
    "pricing": "Preços",
    "contact": "Contato",
    "login": "Entrar",
    "logout": "Sair",
    "dashboard": "Dashboard",
    "admin": "Administração",
    "settings": "Configurações"
  },
  "auth": {
    "login": {
      "title": "Entrar na sua conta",
      "subtitle": "Faça login para acessar o painel administrativo",
      "email": "E-mail",
      "password": "Senha",
      "rememberMe": "Lembrar-me",
      "forgotPassword": "Esqueceu a senha?",
      "submit": "Entrar",
      "submitting": "Entrando...",
      "createAccount": "Criar conta",
      "backToHome": "Voltar ao site"
    },
    "register": {
      "title": "Criar nova conta",
      "subtitle": "Cadastre-se para começar a usar o TopSmile",
      "name": "Nome completo",
      "email": "E-mail",
      "password": "Senha",
      "confirmPassword": "Confirmar senha",
      "clinic": "Nome da clínica",
      "phone": "Telefone",
      "address": "Endereço",
      "submit": "Criar conta",
      "submitting": "Criando conta...",
      "haveAccount": "Já tem uma conta?",
      "loginHere": "Faça login aqui"
    },
    "errors": {
      "invalidCredentials": "E-mail ou senha inválidos",
      "networkError": "Erro de rede. Tente novamente.",
      "sessionExpired": "Sua sessão expirou. Faça login novamente.",
      "unauthorized": "Você não tem permissão para realizar esta ação.",
      "emailRequired": "E-mail é obrigatório",
      "passwordRequired": "Senha é obrigatória",
      "passwordMismatch": "As senhas não coincidem",
      "weakPassword": "A senha deve ter pelo menos 8 caracteres",
      "emailInvalid": "E-mail inválido"
    }
  },
  "dashboard": {
    "title": "Dashboard TopSmile",
    "welcome": "Bem-vindo, {{name}}",
    "stats": {
      "totalContacts": "Total de Contatos",
      "newThisWeek": "Novos esta Semana",
      "conversionRate": "Taxa de Conversão",
      "monthlyRevenue": "Receita do Mês"
    },
    "charts": {
      "contactsByStatus": "Contatos por Status",
      "contactsBySource": "Origem dos Contatos",
      "monthlyTrend": "Tendência Mensal"
    },
    "actions": {
      "viewContacts": "Ver Todos os Contatos",
      "refreshData": "Atualizar Dados",
      "settings": "Configurações"
    },
    "lastUpdated": "Última atualização: {{date}}"
  },
  "contacts": {
    "title": "Gestão de Contatos",
    "subtitle": "Gerencie todos os seus contatos em um só lugar",
    "list": {
      "name": "Nome",
      "email": "E-mail",
      "clinic": "Clínica",
      "specialty": "Especialidade",
      "phone": "Telefone",
      "status": "Status",
      "createdAt": "Data de Criação",
      "actions": "Ações"
    },
    "status": {
      "new": "Novo",
      "contacted": "Contatado",
      "qualified": "Qualificado",
      "converted": "Convertido",
      "closed": "Fechado",
      "deleted": "Excluído",
      "merged": "Mesclado"
    },
    "filters": {
      "all": "Todos",
      "searchPlaceholder": "Buscar por nome, email, clínica...",
      "statusFilter": "Filtrar por status",
      "dateFilter": "Filtrar por data"
    },
    "actions": {
      "create": "Novo Contato",
      "edit": "Editar",
      "delete": "Excluir",
      "view": "Visualizar",
      "batchActions": "Ação em Lote",
      "export": "Exportar",
      "import": "Importar"
    },
    "form": {
      "title": "Dados do Contato",
      "name": "Nome completo",
      "email": "E-mail",
      "phone": "Telefone",
      "clinic": "Nome da clínica",
      "specialty": "Especialidade",
      "notes": "Observações",
      "status": "Status",
      "priority": "Prioridade",
      "source": "Origem do contato",
      "assignedTo": "Responsável"
    },
    "messages": {
      "createSuccess": "Contato criado com sucesso",
      "updateSuccess": "Contato atualizado com sucesso",
      "deleteSuccess": "Contato excluído com sucesso",
      "deleteConfirm": "Tem certeza que deseja excluir este contato?",
      "noContacts": "Nenhum contato encontrado",
      "loadingContacts": "Carregando contatos..."
    }
  },
  "forms": {
    "contact": {
      "title": "Entre em Contato",
      "subtitle": "Fale conosco e descubra como o TopSmile pode ajudar a sua clínica",
      "name": "Nome",
      "email": "E-mail",
      "clinic": "Nome da clínica",
      "specialty": "Especialidade",
      "phone": "Telefone",
      "message": "Mensagem",
      "submit": "Enviar Mensagem",
      "submitting": "Enviando...",
      "success": "Mensagem enviada com sucesso! Retornaremos em breve.",
      "error": "Erro ao enviar mensagem. Tente novamente."
    },
    "validation": {
      "required": "Este campo é obrigatório",
      "email": "E-mail inválido",
      "phone": "Telefone inválido",
      "minLength": "Mínimo de {{count}} caracteres",
      "maxLength": "Máximo de {{count}} caracteres"
    }
  },
  "pwa": {
    "install": {
      "title": "Instalar TopSmile",
      "message": "Adicione o TopSmile à sua tela inicial para acesso rápido e experiência otimizada",
      "install": "Instalar",
      "dismiss": "Agora não"
    },
    "offline": {
      "message": "Você está offline. Algumas funcionalidades podem estar limitadas.",
      "syncPending": "{{count}} ações pendentes para sincronização"
    },
    "update": {
      "available": "Nova versão disponível!",
      "message": "Uma nova versão do TopSmile está disponível. Deseja atualizar?",
      "update": "Atualizar",
      "dismiss": "Mais tarde"
    }
  },
  "errors": {
    "boundary": {
      "title": "Ops! Algo deu errado",
      "subtitle": "Desculpe, mas algo inesperado aconteceu. Este erro foi registrado e nossa equipe irá investigar.",
      "errorId": "ID do Erro",
      "actions": {
        "retry": "Tentar Novamente",
        "reload": "Recarregar Página",
        "home": "Ir para Início",
        "copyDetails": "Copiar Detalhes do Erro"
      },
      "support": "Se o problema persistir, entre em contato com o suporte técnico e forneça o ID do erro acima.",
      "component": {
        "title": "Componente com erro",
        "subtitle": "Este componente encontrou um problema e não pode ser exibido."
      }
    },
    "network": {
      "title": "Erro de Conexão",
      "message": "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
      "retry": "Tentar Novamente"
    },
    "notFound": {
      "title": "Página não encontrada",
      "message": "A página que você está procurando não existe.",
      "backHome": "Voltar ao início"
    },
    "unauthorized": {
      "title": "Acesso negado",
      "message": "Você não tem permissão para acessar esta página.",
      "backHome": "Voltar ao início"
    }
  },
  "features": {
    "title": "Recursos do TopSmile",
    "items": {
      "calendar": {
        "title": "Agenda Simples & Call Center",
        "description": "Organize seu consultório facilmente com uma agenda intuitiva."
      },
      "googleSync": {
        "title": "Sincronização com Google Agenda",
        "description": "Mantenha todos os compromissos sincronizados automaticamente."
      },
      "records": {
        "title": "Prontuário Digital Completo",
        "description": "Acesse o histórico clínico de seus pacientes com facilidade."
      },
      "financial": {
        "title": "Controle Financeiro",
        "description": "Gerencie receitas e despesas com relatórios detalhados."
      },
      "crm": {
        "title": "CRM para Encantamento",
        "description": "Mantenha um relacionamento próximo com seus pacientes."
      }
    }
  },
  "pricing": {
    "title": "Planos e Preços",
    "subtitle": "Escolha o melhor plano para sua clínica",
    "plans": {
      "basic": {
        "title": "Básico",
        "price": "R$ 49/mês",
        "features": [
          "Agenda online",
          "Suporte via e-mail",
          "Prontuário digital"
        ]
      },
      "professional": {
        "title": "Profissional",
        "price": "R$ 99/mês",
        "features": [
          "Tudo do Básico",
          "Integração com Google Agenda",
          "Relatórios financeiros"
        ],
        "recommended": "Recomendado"
      },
      "premium": {
        "title": "Premium",
        "price": "R$ 149/mês",
        "features": [
          "Tudo do Profissional",
          "CRM de pacientes",
          "Prioridade no suporte"
        ]
      }
    },
    "cta": "Comece agora",
    "trial": "Teste grátis por 30 dias"
  },
  "testimonials": {
    "title": "O que dizem nossos clientes",
    "items": [
      {
        "name": "Dra. Paula Ferreira",
        "role": "Ortodontista",
        "message": "O TopSmile revolucionou minha rotina. A agenda inteligente é maravilhosa!"
      },
      {
        "name": "Carlos Mendes",
        "role": "Gerente de Clínica",
        "message": "A interface é super amigável e o suporte é excelente. Recomendo a todos."
      },
      {
        "name": "Dra. Luana Costa",
        "role": "Implantodontista",
        "message": "Agora consigo acompanhar tudo em tempo real, até mesmo do celular."
      }
    ]
  },
  "footer": {
    "brand": "TopSmile",
    "description": "Conectando você à saúde de forma simples, rápida e segura.",
    "links": {
      "home": "Início",
      "features": "Recursos",
      "pricing": "Preços",
      "contact": "Contato",
      "privacy": "Privacidade",
      "terms": "Termos de Uso",
      "support": "Suporte"
    },
    "copyright": "© {{year}} TopSmile. Todos os direitos reservados."
  }
}

// src/i18n/locales/en-US.json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "warning": "Warning",
    "info": "Information",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "edit": "Edit",
    "delete": "Delete",
    "create": "Create",
    "update": "Update",
    "search": "Search",
    "filter": "Filter",
    "clear": "Clear",
    "refresh": "Refresh",
    "export": "Export",
    "import": "Import",
    "close": "Close",
    "open": "Open",
    "yes": "Yes",
    "no": "No"
  },
  "navigation": {
    "home": "Home",
    "features": "Features",
    "pricing": "Pricing",
    "contact": "Contact",
    "login": "Login",
    "logout": "Logout",
    "dashboard": "Dashboard",
    "admin": "Administration",
    "settings": "Settings"
  },
  "auth": {
    "login": {
      "title": "Sign in to your account",
      "subtitle": "Sign in to access the admin panel",
      "email": "Email",
      "password": "Password",
      "rememberMe": "Remember me",
      "forgotPassword": "Forgot password?",
      "submit": "Sign in",
      "submitting": "Signing in...",
      "createAccount": "Create account",
      "backToHome": "Back to website"
    },
    "errors": {
      "invalidCredentials": "Invalid email or password",
      "networkError": "Network error. Please try again.",
      "sessionExpired": "Your session has expired. Please sign in again.",
      "unauthorized": "You don't have permission to perform this action.",
      "emailRequired": "Email is required",
      "passwordRequired": "Password is required"
    }
  },
  "dashboard": {
    "title": "TopSmile Dashboard",
    "welcome": "Welcome, {{name}}",
    "stats": {
      "totalContacts": "Total Contacts",
      "newThisWeek": "New This Week",
      "conv


Phase 4: Low Priority
4.1 Analytics & Monitoring
Priority: LOW | Effort: Medium | Timeline: 2-3 weeks
4.2 Advanced Features Implementation
Priority: LOW | Effort: Large | Timeline: 4-6 weeks