# Code Review Action Items 📋

## 🔴 Critical (Must Fix for Production)

### 1. Add Test Coverage (Priority: HIGHEST)
**Current:** 1 test file (3% coverage)  
**Target:** 80%+ coverage  
**Effort:** 2-3 weeks

**Files needing tests:**
- [ ] `file-manager.facade.spec.ts`
- [ ] `file-http.repository.spec.ts`
- [ ] `file-validation.service.spec.ts`
- [ ] `file-state.service.spec.ts`
- [ ] `notification.service.spec.ts`
- [ ] `error-handler.service.spec.ts`
- [ ] `dialog.service.spec.ts`
- [ ] `file-list-container.component.spec.ts`
- [ ] `file-list-presentational.component.spec.ts`
- [ ] E2E tests for critical user journeys

**Example test structure:**
```typescript
describe('FileManagerFacade', () => {
  let facade: FileManagerFacade;
  let mockRepository: jasmine.SpyObj<IFileRepository>;
  let mockNotifications: jasmine.SpyObj<NotificationService>;
  
  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('IFileRepository', ['uploadFiles', 'getItems']);
    mockNotifications = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    
    TestBed.configureTestingModule({
      providers: [
        FileManagerFacade,
        { provide: IFileRepository, useValue: mockRepository },
        { provide: NotificationService, useValue: mockNotifications }
      ]
    });
    
    facade = TestBed.inject(FileManagerFacade);
  });
  
  describe('uploadFiles', () => {
    it('should validate files before upload', () => {
      const invalidFiles = [createOversizedFile()];
      
      facade.uploadFiles(invalidFiles).subscribe();
      
      expect(mockRepository.uploadFiles).not.toHaveBeenCalled();
      expect(mockNotifications.error).toHaveBeenCalledWith(jasmine.stringContaining('exceed'));
    });
    
    it('should upload valid files and reload items', (done) => {
      const validFiles = [createValidFile()];
      mockRepository.uploadFiles.and.returnValue(of({ success: true }));
      mockRepository.getItems.and.returnValue(of({ items: [] }));
      
      facade.uploadFiles(validFiles).subscribe(result => {
        expect(result).toBe(true);
        expect(mockRepository.uploadFiles).toHaveBeenCalledWith(validFiles, undefined);
        expect(mockRepository.getItems).toHaveBeenCalled();
        done();
      });
    });
  });
});
```

---

### 2. Remove Dead Code (Priority: HIGH)
**Effort:** 2 hours

**Files to delete:**
```bash
# Old unused services (replaced by facade pattern)
rm src/app/services/file-manager.service.ts
rm src/app/services/file-upload.service.ts
rm src/app/services/folder.service.ts

# Old component (replaced by container/presentational split)
rm src/app/components/file-list/file-list.component.ts
rm src/app/components/file-list/file-list.component.scss
```

**Why:** Reduces bundle size, prevents confusion, improves maintainability

---

## 🟡 Important (Fix Soon)

### 3. Replace console.log with Logging Service (Priority: MEDIUM)
**Effort:** 1 day

**Create logging service:**
```typescript
// src/app/core/services/logging.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private readonly minLevel = environment.production ? LogLevel.Warn : LogLevel.Debug;

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.Debug, message, args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.Info, message, args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.Warn, message, args);
  }

  error(message: string, error?: any): void {
    this.log(LogLevel.Error, message, [error]);
    
    if (environment.production) {
      // Send to monitoring service (Sentry, LogRocket, etc.)
      this.sendToMonitoring(message, error);
    }
  }

  private log(level: LogLevel, message: string, args: any[]): void {
    if (level < this.minLevel) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${LogLevel[level]}] ${timestamp}:`;

    switch (level) {
      case LogLevel.Error:
        console.error(prefix, message, ...args);
        break;
      case LogLevel.Warn:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.Info:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.Debug:
        console.debug(prefix, message, ...args);
        break;
    }
  }

  private sendToMonitoring(message: string, error: any): void {
    // Integrate with Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error);
  }
}
```

**Replace console.log:**
```typescript
// ❌ Before
console.error('Error occurred:', error);

// ✅ After
constructor(private logger: LoggingService) {}

this.logger.error('Error occurred', error);
```

**Files to update:**
- `src/main.ts`
- `src/app/services/folder.service.ts`
- `src/app/core/services/error-handler.service.ts`
- `src/app/components/file-list/file-list.component.ts`

---

### 4. Add Environment Configuration (Priority: MEDIUM)
**Effort:** 4 hours

**Create environment files:**
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: '/api',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  enableLogging: true,
  enableAnalytics: false,
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourapp.com',
  maxFileSize: 100 * 1024 * 1024,
  enableLogging: false,
  enableAnalytics: true,
};
```

**Update angular.json:**
```json
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

---

### 5. Add Global Error Handler (Priority: MEDIUM)
**Effort:** 1 day

**Create error handler:**
```typescript
// src/app/core/services/global-error-handler.ts
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggingService } from './logging.service';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggingService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  handleError(error: Error): void {
    // Log error
    this.logger.error('Unhandled error', error);

    // Show user-friendly message
    this.notifications.error(
      'An unexpected error occurred. Please try again or contact support.'
    );

    // Navigate to error page for critical errors
    if (this.isCriticalError(error)) {
      this.router.navigate(['/error']);
    }
  }

  private isCriticalError(error: Error): boolean {
    // Determine if error is critical
    return error.message.includes('ChunkLoadError');
  }
}

// Register in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    // ... other providers
  ],
};
```

---

## 🟢 Nice to Have (Future Improvements)

### 6. Add Storybook for Component Documentation
**Effort:** 1 week  
**Priority:** LOW

```bash
npx storybook@latest init
```

**Benefits:**
- Visual component documentation
- Isolated component development
- Visual regression testing
- Design system documentation

---

### 7. Add CI/CD Pipeline
**Effort:** 2-3 days  
**Priority:** LOW

**GitHub Actions example:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --watch=false --browsers=ChromeHeadless
      - run: npm run build
      
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test -- --code-coverage --watch=false
      - uses: codecov/codecov-action@v3
```

---

### 8. Add Bundle Analysis
**Effort:** 1 hour  
**Priority:** LOW

```bash
# Install analyzer
npm install --save-dev webpack-bundle-analyzer

# Build with stats
npm run build -- --stats-json

# Analyze
npx webpack-bundle-analyzer dist/angular-technical-test/stats.json
```

---

### 9. Add Performance Monitoring
**Effort:** 1 day  
**Priority:** LOW

**Options:**
- Google Analytics
- Sentry Performance
- New Relic
- DataDog

**Example (Sentry):**
```typescript
import * as Sentry from "@sentry/angular-ivy";

Sentry.init({
  dsn: "YOUR_DSN",
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
  ],
  tracesSampleRate: 1.0,
});
```

---

### 10. Add Accessibility (a11y) Testing
**Effort:** 3 days  
**Priority:** LOW

```bash
# Install axe
npm install --save-dev @axe-core/playwright

# Add to E2E tests
import { injectAxe, checkA11y } from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page);
});
```

---

## Summary Checklist

### Before Production (Critical)
- [ ] Add comprehensive test suite (80%+ coverage)
- [ ] Remove dead/unused code
- [ ] Replace console.log with logging service
- [ ] Add global error handler
- [ ] Add environment configuration
- [ ] Fix ESLint configuration
- [ ] Add CI/CD pipeline with automated tests

### Quality Improvements (Important)
- [ ] Add integration tests
- [ ] Add E2E tests with Cypress/Playwright
- [ ] Set up code coverage reporting
- [ ] Add performance monitoring
- [ ] Add error tracking (Sentry)

### Documentation (Nice to Have)
- [ ] Add Storybook
- [ ] Add API documentation
- [ ] Add architecture diagrams
- [ ] Add onboarding guide for new developers

### Performance (Already Excellent, but can add)
- [ ] Add service worker for offline support
- [ ] Add bundle analysis to CI
- [ ] Add performance budgets
- [ ] Add image optimization

---

## Estimated Timeline

| Phase | Tasks | Duration |
|-------|-------|----------|
| **Phase 1: Critical** | Tests + Dead code removal | 2-3 weeks |
| **Phase 2: Important** | Logging + Error handling + Config | 1 week |
| **Phase 3: Nice to Have** | Storybook + CI/CD + Monitoring | 2 weeks |
| **Total** | All improvements | **5-6 weeks** |

---

## Quick Wins (Can do today)

1. ✅ **Remove dead code** (2 hours)
   ```bash
   rm src/app/services/file-manager.service.ts
   rm src/app/services/file-upload.service.ts
   rm src/app/services/folder.service.ts
   rm src/app/components/file-list/file-list.component.ts
   ```

2. ✅ **Fix ESLint config** (30 min)
   ```bash
   npm install --save-dev eslint-define-config
   ```

3. ✅ **Add .nvmrc for Node version** (5 min)
   ```bash
   echo "20.11.0" > .nvmrc
   ```

4. ✅ **Add bundle budget to angular.json** (10 min)
   ```json
   "budgets": [
     {
       "type": "initial",
       "maximumWarning": "500kb",
       "maximumError": "1mb"
     }
   ]
   ```

---

**Next Steps:**
1. Start with critical items (testing)
2. Move to important items (logging, error handling)
3. Add nice-to-have items as time permits

**Priority:** Testing is the most important gap to address!
