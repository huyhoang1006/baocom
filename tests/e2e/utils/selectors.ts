export const SELECTORS = {
  // Login
  login: {
    usernameInput: '[data-testid="username-input"]',
    passwordInput: '[data-testid="password-input"]',
    submitButton: '[data-testid="login-submit"]',
    errorMessage: '[data-testid="login-error"]',
  },
  // Booking
  booking: {
    dayCard: (index: number) => `[data-testid="day-card-${index}"]`,
    eatButton: (dayIndex: number) => `[data-testid="eat-btn-${dayIndex}"]`,
    notEatButton: (dayIndex: number) => `[data-testid="not-eat-btn-${dayIndex}"]`,
    lockedBadge: (dayIndex: number) => `[data-testid="locked-badge-${dayIndex}"]`,
    nextWeekBtn: '[data-testid="next-week-btn"]',
    prevWeekBtn: '[data-testid="prev-week-btn"]',
  },
  // Admin
  admin: {
    sidebar: '[data-testid="admin-sidebar"]',
    statsCard: '[data-testid="stats-card"]',
    employeeTable: '[data-testid="employee-table"]',
    addEmployeeBtn: '[data-testid="add-employee-btn"]',
  },
} as const;