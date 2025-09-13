describe('Complete Appointment Flow', () => {
  beforeEach(() => {
    // Login as admin first
    cy.login('admin@example.com', 'password123');
  });

  it('should handle complete patient journey', () => {
    // Navigate to patients page
    cy.visit('/patients');

    // Create a new patient
    cy.get('[data-cy="add-patient"]').click();
    cy.get('[data-cy="patient-name"]').type('João Silva');
    cy.get('[data-cy="patient-phone"]').type('(11) 99999-9999');
    cy.get('[data-cy="patient-email"]').type('joao@example.com');
    cy.get('[data-cy="save-patient"]').click();

    // Verify patient was created
    cy.get('[data-cy="patient-list"]').should('contain', 'João Silva');

    // Schedule appointment
    cy.visit('/calendar');
    cy.get('[data-cy="new-appointment"]').click();
    cy.get('[data-cy="patient-select"]').select('João Silva');
    cy.get('[data-cy="provider-select"]').select('Dr. Maria Santos');
    cy.get('[data-cy="appointment-date"]').type('2024-01-15');
    cy.get('[data-cy="appointment-time"]').type('10:00');
    cy.get('[data-cy="appointment-type"]').select('Consulta');
    cy.get('[data-cy="save-appointment"]').click();

    // Verify appointment appears in calendar
    cy.get('[data-cy="calendar"]').should('contain', 'João Silva');
    cy.get('[data-cy="appointment-item"]').should('contain', '10:00');
  });

  it('should handle appointment conflicts', () => {
    cy.visit('/calendar');

    // Try to schedule overlapping appointments
    cy.get('[data-cy="new-appointment"]').click();
    cy.get('[data-cy="patient-select"]').select('João Silva');
    cy.get('[data-cy="provider-select"]').select('Dr. Maria Santos');
    cy.get('[data-cy="appointment-date"]').type('2024-01-15');
    cy.get('[data-cy="appointment-time"]').type('10:00');
    cy.get('[data-cy="save-appointment"]').click();

    // Try to schedule another appointment at the same time
    cy.get('[data-cy="new-appointment"]').click();
    cy.get('[data-cy="patient-select"]').select('Maria Oliveira');
    cy.get('[data-cy="provider-select"]').select('Dr. Maria Santos');
    cy.get('[data-cy="appointment-date"]').type('2024-01-15');
    cy.get('[data-cy="appointment-time"]').type('10:00');
    cy.get('[data-cy="save-appointment"]').click();

    // Should show conflict warning
    cy.get('[data-cy="conflict-warning"]').should('be.visible');
  });
});
