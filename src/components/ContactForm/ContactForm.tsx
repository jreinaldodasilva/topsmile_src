// src/components/ContactForm/ContactForm.tsx - Updated for Backend Integration
import React, { useState, FormEvent } from 'react';
import DOMPurify from 'dompurify';
import { apiService } from '../../services/apiService';
import './ContactForm.css';

// UPDATED: Interface to match backend requirements
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

// UPDATED: Response format to match backend
interface SuccessResponse {
  id: string;
  protocol: string;
  estimatedResponse: string;
}

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
  const [successData, setSuccessData] = useState<SuccessResponse | null>(null);

  // Sanitize input function
  const sanitizeInput = (input: string): string => {
    return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] });
  };

  // UPDATED: Validation to match backend requirements
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Backend accepts: /^[\d\s\-\(\)\+]{10,20}$/
    const phoneRegex = /^[\d\s\-(]{10,20}$/;
    return phoneRegex.test(phone);
  };

  const validateName = (name: string): boolean => {
    // Backend regex: /^[a-zA-ZÀ-ÿ\s\-'\.]*$/
    const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']*$/;
    return nameRegex.test(name) && name.length >= 2 && name.length <= 100;
  };

  const validateForm = (data: ContactFormData): FormErrors => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!data.name) {
      newErrors.name = 'Nome é obrigatório';
    } else if (!validateName(data.name)) {
      newErrors.name = 'Nome deve ter entre 2 e 100 caracteres e conter apenas letras, espaços, hífens, apostrofes e pontos';
    }

    // Email validation
    if (!data.email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Digite um e-mail válido';
    } else if (data.email.length > 254) {
      newErrors.email = 'E-mail muito longo';
    }

    // Clinic validation
    if (!data.clinic) {
      newErrors.clinic = 'Nome da clínica é obrigatório';
    } else if (data.clinic.length < 2 || data.clinic.length > 100) {
      newErrors.clinic = 'Nome da clínica deve ter entre 2 e 100 caracteres';
    }

    // Specialty validation
    if (!data.specialty) {
      newErrors.specialty = 'Especialidade é obrigatória';
    } else if (data.specialty.length < 2 || data.specialty.length > 100) {
      newErrors.specialty = 'Especialidade deve ter entre 2 e 100 caracteres';
    }

    // Phone validation
    if (!data.phone) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!validatePhone(data.phone)) {
      newErrors.phone = 'Digite um telefone válido (10-20 caracteres, apenas números, espaços, hífens, parênteses e +)';
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

  // UPDATED: Submit function to use new API service
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Sanitize all form data
    const sanitizedData: ContactFormData = {
      name: sanitizeInput(formData.name),
      email: sanitizeInput(formData.email).toLowerCase(),
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
      // UPDATED: Use new API service
      const response = await apiService.public.sendContactForm(sanitizedData);

      if (response.success && response.data) {
        setIsSubmitted(true);
        setSuccessData(response.data);
        setFormData({ name: '', email: '', clinic: '', specialty: '', phone: '' });
        
        // Track successful submission
        if (window.gtag) {
          window.gtag('event', 'form_submit', {
            event_category: 'Contact',
            event_label: 'Success'
          });
        }
      } else {
        // UPDATED: Handle backend validation errors
        if (response.message) {
          // Check if the error message contains field-specific information
          if (response.message.includes('email')) {
            setErrors({ email: response.message });
          } else if (response.message.includes('nome')) {
            setErrors({ name: response.message });
          } else {
            setErrors({ general: response.message });
          }
        } else {
          setErrors({ general: 'Erro ao enviar mensagem. Tente novamente.' });
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
      
      // Handle different types of errors
      let errorMessage = 'Erro inesperado. Tente novamente ou entre em contato por telefone.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Muitos formulários enviados. Aguarde alguns minutos antes de tentar novamente.';
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATED: Success screen with backend data
  if (isSubmitted && successData) {
    return (
      <section className="contact-form-section">
        <div className="contact-form__success">
          <div className="contact-form__success-icon">✅</div>
          <h3>Mensagem Enviada com Sucesso!</h3>
          <p>Recebemos sua solicitação e nossa equipe retornará em até {successData.estimatedResponse}.</p>
          
          <div className="contact-form__success-note">
            <strong>Protocolo de atendimento:</strong> #{successData.protocol}
            <br />
            <strong>ID de acompanhamento:</strong> {successData.id}
            <br />
            <small>Guarde estes números para referência futura.</small>
          </div>
          
          <p>Você também receberá um e-mail de confirmação em breve.</p>
          
          <button
            onClick={() => {
              setIsSubmitted(false);
              setSuccessData(null);
            }}
            className="contact-form__reset-btn"
          >
            Enviar outra mensagem
          </button>
        </div>
      </section>
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
            placeholder="Nome completo *"
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
            placeholder="E-mail profissional *"
            className={errors.email ? 'contact-input contact-form__input--error' : 'contact-input'}
            disabled={isSubmitting}
            maxLength={254}
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
            placeholder="Nome da clínica *"
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
            placeholder="Especialidade (ex: Ortodontia, Implantodontia) *"
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
            placeholder="Telefone com WhatsApp (ex: 11999999999) *"
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