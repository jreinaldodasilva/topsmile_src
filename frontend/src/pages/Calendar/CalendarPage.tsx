// frontend/src/pages/Calendar.tsx
import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '' });

interface Appointment {
  _id: string;
  scheduledAt: string;
  patientId: string;
}

const CalendarPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated) {
      setAppointments([]);
      return;
    }

    // typed request so res.data has correct shape
    api
      .get<Appointment[]>('/api/appointments')
      .then(res => {
        if (!mounted) return;
        setAppointments(res.data ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setAppointments([]);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  return (
    <Calendar
      tileContent={({ date /*, view */ }) => {
        return appointments.some(a => new Date(a.scheduledAt).toDateString() === date.toDateString())
          ? <span>•</span>
          : null;
      }}
    />
  );
};

export default CalendarPage;
