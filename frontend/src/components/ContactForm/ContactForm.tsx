// src/components/ContactForm/ContactForm.tsx
import React, { useState, FormEvent } from 'react';
import DOMPurify from 'dompurify';
import './ContactForm.css';

interface ContactFormData {
  name: string;
  email: string;
  clinic: string;
  specialty: string;
  phone: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  clinic?: string;
  specialty?: string;
  phone?: string;
  general?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  errors?: Array<{ msg: string; param: string }>;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    clinic: '',
    specialty: '',
    phone: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Sanitize input function
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] });
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Remove spaces, dashes, and parentheses for validation
    const phoneRegex = /^[+]?[\d\s\-()]{10,20}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (data: ContactFormData): FormErrors => {
    const newErrors: FormErrors = {};

    if (!data.name) {
      newErrors.name = 'Nome é obrigatório';
    } else if (data.name.length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!data.email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Digite um e-mail válido';
    }

    if (!data.clinic) {
      newErrors.clinic = 'Clínica é obrigatória';
    }

    if (!data.specialty) {
      newErrors.specialty = 'Especialidade é obrigatória';
    }

    if (!data.phone) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(data.phone)) {
      newErrors.phone = 'Digite um telefone válido';
    }

    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const submitToAPI = async (data: ContactFormData): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Erro de conexão. Verifique sua internet e tente novamente.'
      };
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Sanitize all form data
    const sanitizedData: ContactFormData = {
      name: sanitizeInput(formData.name),
      email: sanitizeInput(formData.email),
      clinic: sanitizeInput(formData.clinic),
      specialty: sanitizeInput(formData.specialty),
      phone: sanitizeInput(formData.phone)
    };

    // Client-side validation
    const formErrors = validateForm(sanitizedData);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit to API
      const response = await submitToAPI(sanitizedData);

      if (response.success) {
        setIsSubmitted(true);
        setSubmitMessage(response.message);
        setFormData({ name: '', email: '', clinic: '', specialty: '', phone: '' });
        
        // Track successful submission (for analytics)
        if (window.gtag) {
          window.gtag('event', 'form_submit', {
            event_category: 'Contact',
            event_label: 'Success'
          });
        }
      } else {
        // Handle API validation errors
        if (response.errors && response.errors.length > 0) {
          const apiErrors: FormErrors = {};
          response.errors.forEach(error => {
            apiErrors[error.param as keyof FormErrors] = error.msg;
          });
          setErrors(apiErrors);
        } else {
          setErrors({ general: response.message });
        }

        // Track failed submission
        if (window.gtag) {
          window.gtag('event', 'form_submit', {
            event_category: 'Contact',
            event_label: 'Error'
          });
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ 
        general: 'Erro inesperado. Tente novamente ou entre em contato por telefone.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="contact-form-section">
        <div className="contact-form__success">
          <div className="contact-form__success-icon">✅</div>
          <h3>Mensagem Enviada com Sucesso!</h3>
          <p>{submitMessage}</p>
          <p className="contact-form__success-note">
            Você também receberá um e-mail de confirmação em breve.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setSubmitMessage('');
            }}
            className="contact-form__reset-btn"
          >
            Enviar outra mensagem
          </button>
        </div>
      </div>
    );
  }

  return (
    <section id="contact" className="contact-form-section">
      <h2 className="contact-form-title">Contato</h2>
      <form onSubmit={handleSubmit} className="contact-form" noValidate>
        {errors.general && (
          <div className="contact-form__error contact-form__error--general">
            {errors.general}
          </div>
        )}

        <div className="contact-form__field">
          <input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Nome completo"
            className={errors.name ? 'contact-input contact-form__input--error' : 'contact-input'}
            disabled={isSubmitting}
            maxLength={100}
            required
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <span id="name-error" className="contact-form__error" role="alert">
              {errors.name}
            </span>
          )}
        </div>

        <div className="contact-form__field">
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="E-mail profissional"
            className={errors.email ? 'contact-input contact-form__input--error' : 'contact-input'}
            disabled={isSubmitting}
            maxLength={255}
            required
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <span id="email-error" className="contact-form__error" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        <div className="contact-form__field">
          <input
            name="clinic"
            value={formData.clinic}
            onChange={handleInputChange}
            placeholder="Nome da clínica"
            className={errors.clinic ? 'contact-input contact-form__input--error' : 'contact-input'}
            disabled={isSubmitting}
            maxLength={100}
            required
            aria-describedby={errors.clinic ? 'clinic-error' : undefined}
          />
          {errors.clinic && (
            <span id="clinic-error" className="contact-form__error" role="alert">
              {errors.clinic}
            </span>
          )}
        </div>

        <div className="contact-form__field">
          <input
            name="specialty"
            value={formData.specialty}
            onChange={handleInputChange}
            placeholder="Especialidade (ex: Ortodontia, Implantodontia)"
            className={errors.specialty ? 'contact-input contact-form__input--error' : 'contact-input'}
            disabled={isSubmitting}
            maxLength={100}
            required
            aria-describedby={errors.specialty ? 'specialty-error' : undefined}
          />
          {errors.specialty && (
            <span id="specialty-error" className="contact-form__error" role="alert">
              {errors.specialty}
            </span>
          )}
        </div>

        <div className="contact-form__field">
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Telefone com WhatsApp (ex: 11999999999)"
            className={errors.phone ? 'contact-input contact-form__input--error' : 'contact-input'}
            disabled={isSubmitting}
            maxLength={20}
            required
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
          {errors.phone && (
            <span id="phone-error" className="contact-form__error" role="alert">
              {errors.phone}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="contact-btn"
          aria-describedby="submit-help"
        >
          {isSubmitting ? (
            <>
              <span className="contact-btn__spinner">⏳</span>
              Enviando...
            </>
          ) : (
            'Quero conhecer o TopSmile'
          )}
        </button>
        
        <p id="submit-help" className="contact-form__help">
          Retornaremos em até 24 horas úteis
        </p>
      </form>
    </section>
  );
};

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default ContactForm;