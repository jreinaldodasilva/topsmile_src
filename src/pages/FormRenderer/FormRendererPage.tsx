// src/pages/FormRenderer/FormRendererPage.tsx
import React, { useState, useEffect } from 'react';
import { apiService, type FormTemplate } from '../../services/apiService';
import EnhancedHeader from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import './FormRendererPage.css';

interface FormRendererProps {
  templateId: string;
  patientId?: string;
  onSubmitSuccess?: (responseId: string) => void;
  onError?: (error: string) => void;
}

const FormRendererPage: React.FC<FormRendererProps> = ({ 
  templateId, 
  patientId = 'default-patient-id', // Provide default or make required
  onSubmitSuccess,
  onError 
}) => {
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiService.forms.templates.getOne(templateId);
        
        if (result.success && result.data) {
          setTemplate(result.data);
        } else {
          const errorMsg = result.message || 'Failed to load form template';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred while loading the form';
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId, onError]);

  const handleChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ 
      ...prev, 
      [questionId]: value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!template) return;

    try {
      setSubmitting(true);
      setError(null);

      const result = await apiService.forms.responses.create({
        templateId,
        patientId,
        answers
      });

      if (result.success && result.data) {
        // Reset form
        setAnswers({});

        // Show success message
        alert('Form submitted successfully!');

        // Call success callback
        onSubmitSuccess?.(result.data._id);
      } else {
        const errorMsg = result.message || 'Failed to submit form';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred while submitting the form';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (!template) return false;

    // Check if all required questions are answered
    return template.questions.every(question => {
      if (question.required) {
        return answers[question.id]?.trim() !== '';
      }
      return true;
    });
  };

  if (loading) {
    return (
      <div className="form-renderer-page">
        <EnhancedHeader />
        <main className="form-renderer-main">
          <div className="container">
            <div className="loading-skeleton">
              <div className="skeleton-title"></div>
              <div className="skeleton-fields">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-field">
                    <div className="skeleton-label"></div>
                    <div className="skeleton-input"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-renderer-page">
        <EnhancedHeader />
        <main className="form-renderer-main">
          <div className="container">
            <div className="error-banner">
              <div className="error-content">
                <h3 className="error-title">Erro</h3>
                <p className="error-message">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="retry-button"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="form-renderer-page">
        <EnhancedHeader />
        <main className="form-renderer-main">
          <div className="container">
            <div className="empty-state">
              <h3>Formulário não encontrado</h3>
              <p>O template do formulário solicitado não foi encontrado.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="form-renderer-page">
      <EnhancedHeader />

      <main className="form-renderer-main">
        <div className="container">
          <div className="form-container">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{template.title}</h1>
          {template.questions.length === 0 && (
            <p className="text-gray-600">This form has no questions yet.</p>
          )}
        </div>

        {template.questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <label 
              htmlFor={question.id}
              className="block text-sm font-medium text-gray-700"
            >
              {question.label}
            </label>
            
            {question.type === 'textarea' ? (
              <textarea
                id={question.id}
                rows={4}
                value={answers[question.id] || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter your answer for ${question.label.toLowerCase()}`}
              />
            ) : question.type === 'select' ? (
              <select
                id={question.id}
                value={answers[question.id] || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select an option...</option>
                {question.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={question.id}
                type={question.type || 'text'}
                value={answers[question.id] || ''}
                onChange={(e) => handleChange(question.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter your answer for ${question.label.toLowerCase()}`}
              />
            )}
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting || !isFormValid() || template.questions.length === 0}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Form'}
          </button>
          
          <button
            type="button"
            onClick={() => setAnswers({})}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FormRendererPage;