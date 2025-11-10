// Barrel exports for core module (OCP - Open/Closed Principle)
// Makes imports cleaner and manages dependencies in one place

// Interfaces
export * from './interfaces/file-repository.interface';

// Repositories
export * from './repositories/file-http.repository';

// State
export * from './state/file-state.service';

// Services
export * from './services/error-handler.service';
export * from './services/notification.service';
export * from './services/dialog.service';

// Facades
export * from './facades/file-manager.facade';

// Utils
export * from './utils/file-filter.service';
export * from './utils/file-validation.service';
