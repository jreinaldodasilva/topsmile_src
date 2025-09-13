import React, { useState } from 'react';
import {
  FormField,
  FormSection,
  FormGrid,
  FormActions,
  Select,
  Textarea,
  Checkbox,
  RadioGroup,
  SelectOption,
  RadioOption
} from './index';

const FormExample: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    message: '',
    newsletter: false,
    terms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const genderOptions: SelectOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  const radioOptions: RadioOption[] = [
    { value: 'email', label: 'Email', description: 'Receive updates via email' },
    { value: 'sms', label: 'SMS', description: 'Receive updates via text message' },
    { value: 'none', label: 'None', description: 'Do not receive updates' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log('Form submitted:', formData);
      alert('Form submitted successfully!');
    } else {
      // Mark all fields as touched to show errors
      const allTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouched(allTouched);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <FormSection
        title="Personal Information"
        description="Please provide your basic personal details"
      >
        <FormGrid columns={2}>
          <FormField
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            onBlur={() => handleBlur('firstName')}
            error={errors.firstName}
            touched={touched.firstName}
            required
          />

          <FormField
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            onBlur={() => handleBlur('lastName')}
            error={errors.lastName}
            touched={touched.lastName}
            required
          />
        </FormGrid>

        <FormGrid columns={2}>
          <FormField
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            required
          />

          <FormField
            name="phone"
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            helperText="Optional"
          />
        </FormGrid>

        <Select
          label="Gender"
          options={genderOptions}
          value={formData.gender}
          onChange={(e) => handleSelectChange(e.target.value)}
          placeholder="Select your gender"
        />
      </FormSection>

      <FormSection
        title="Additional Information"
        description="Tell us more about yourself"
      >
        <Textarea
          label="Message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          placeholder="Enter your message here..."
          helperText="Maximum 500 characters"
          rows={4}
        />

        <RadioGroup
          name="communication"
          label="Preferred Communication Method"
          options={radioOptions}
          value={formData.gender} // This should be a separate field, using gender for demo
          onChange={(value) => console.log('Communication preference:', value)}
        />
      </FormSection>

      <FormSection>
        <Checkbox
          label="Subscribe to newsletter"
          description="Receive weekly updates about our services"
          name="newsletter"
          checked={formData.newsletter}
          onChange={handleInputChange}
        />

        <Checkbox
          label="I accept the terms and conditions"
          description="By checking this box, you agree to our terms of service"
          name="terms"
          checked={formData.terms}
          onChange={handleInputChange}
          error={errors.terms}
        />
      </FormSection>

      <FormActions align="right">
        <button type="button" style={{ marginRight: '1rem' }}>
          Cancel
        </button>
        <button type="submit">
          Submit
        </button>
      </FormActions>
    </form>
  );
};

export default FormExample;
