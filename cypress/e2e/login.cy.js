describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('[data-cy="email-input"]').should('be.visible');
    cy.get('[data-cy="password-input"]').should('be.visible');
    cy.get('[data-cy="login-button"]').should('be.visible');
  });

  it('should allow user to login with valid credentials', () => {
    cy.get('[data-cy="email-input"]').type('admin@example.com');
    cy.get('[data-cy="password-input"]').type('password123');
    cy.get('[data-cy="login-button"]').click();

    // Should redirect to dashboard or show success
    cy.url().should('not.include', '/login');
  });

  it('should show error for invalid credentials', () => {
    cy.get('[data-cy="email-input"]').type('invalid@example.com');
    cy.get('[data-cy="password-input"]').type('wrongpassword');
    cy.get('[data-cy="login-button"]').click();

    cy.get('[data-cy="error-message"]').should('be.visible');
  });
});
