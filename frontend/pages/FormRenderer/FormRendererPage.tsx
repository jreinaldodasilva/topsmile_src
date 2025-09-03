// frontend/src/components/FormRenderer.tsx
import React, { useState, useEffect } from 'react';
import { apiService, type FormTemplate } from '../../services/apiService';

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
      // Assuming questions have a 'required' property
      // If not, you can modify this logic based on your template structure
      return answers[question.id]?.trim() !== '';
    });
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-100 px-3 py-2 text-sm leading-4 font-medium text-red-800 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-4">
        <p>Form template not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
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
                {/* Add options based on your question structure */}
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
  );
};

export default FormRendererPage;