// frontend/src/pages/Calendar.tsx
import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { useAuth } from '../../contexts/AuthContext';
import { apiService, type Appointment } from '../../services/apiService';

const CalendarPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    if (!isAuthenticated) {
      setAppointments([]);
      return;
    }

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiService.appointments.getAll();
        
        if (!mounted) return;
        
        if (result.success && result.data) {
          setAppointments(result.data);
        } else {
          setError(result.message || 'Failed to load appointments');
          setAppointments([]);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred while loading appointments');
        setAppointments([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <p>Please log in to view your calendar.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading appointments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <Calendar
        tileContent={({ date }) => {
          const hasAppointment = appointments.some(appointment => {
            const appointmentDate = new Date(appointment.scheduledAt);
            return appointmentDate.toDateString() === date.toDateString();
          });
          
          return hasAppointment ? (
            <div className="flex justify-center items-center">
              <span className="text-blue-600 font-bold">•</span>
            </div>
          ) : null;
        }}
        className="w-full max-w-md mx-auto"
      />
      
      {appointments.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Upcoming Appointments</h2>
          <div className="space-y-2">
            {appointments
              .filter(apt => new Date(apt.scheduledAt) >= new Date())
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
              .slice(0, 5)
              .map(appointment => (
                <div key={appointment._id} className="p-2 bg-gray-100 rounded">
                  <p className="font-medium">
                    {new Date(appointment.scheduledAt).toLocaleDateString()} at{' '}
                    {new Date(appointment.scheduledAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">Patient ID: {appointment.patientId}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;