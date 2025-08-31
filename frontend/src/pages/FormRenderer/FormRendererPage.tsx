// frontend/src/components/FormRenderer.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '' });

const FormRendererPage: React.FC<{ templateId: string }> = ({ templateId }) => {
  const [template, setTemplate] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    api.get(`/forms/templates/${templateId}`).then(res => setTemplate(res.data));
  }, [templateId]);

  const handleChange = (qid: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const handleSubmit = () => {
    api.post('/forms/responses', { templateId, patientId: 'id', answers })
      .then(res => alert('Submitted'));
  };

  if (!template) return <div>Loading...</div>;

  return (
    <div>
      <h2>{template.title}</h2>
      {template.questions.map((q: any) => (
        <div key={q.id}>
          <label>{q.label}</label>
          <input type="text" onChange={e => handleChange(q.id, e.target.value)} />
        </div>
      ))}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default FormRendererPage;
