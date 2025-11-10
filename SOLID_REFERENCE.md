# SOLID Principles Quick Reference

## 📋 Overview
Quick reference for implementing SOLID principles in Angular applications.

---

## 1️⃣ Single Responsibility Principle (SRP)

### ✅ Definition
**"A class should have one, and only one, reason to change."**

### 🎯 How to Apply
- Each service/component should do ONE thing
- If you can describe it with "AND", it probably violates SRP
- Extract responsibilities into separate classes

### ✅ Good Examples
```typescript
// ✅ GOOD: Only handles HTTP calls
@Injectable()
export class FileHttpRepository {
  constructor(private http: HttpClient) {}
  getItems() { return this.http.get('/api/items'); }
}

// ✅ GOOD: Only handles error transformation
@Injectable()
export class ErrorHandlerService {
  parseError(error: unknown): ErrorDetails { /* ... */ }
}

// ✅ GOOD: Only handles notifications
@Injectable()
export class NotificationService {
  success(message: string) { /* ... */ }
  error(message: string) { /* ... */ }
}
```

### ❌ Bad Examples
```typescript
// ❌ BAD: Does everything!
@Injectable()
export class FileService {
  // HTTP calls
  getItems() { /* ... */ }
  
  // Error handling
  handleError() { /* ... */ }
  
  // Notifications
  showMessage() { /* ... */ }
  
  // Validation
  validateFiles() { /* ... */ }
  
  // Business logic
  processUpload() { /* ... */ }
}
```

### 🔍 How to Detect Violations
- Class has > 200 lines
- Class name contains "Manager", "Handler", "Service" (too generic)
- Methods operate on unrelated data
- Testing requires many mocks

---

## 2️⃣ Open/Closed Principle (OCP)

### ✅ Definition
**"Software entities should be open for extension but closed for modification."**

### 🎯 How to Apply
- Use interfaces/abstract classes
- Program to abstractions
- Use Strategy pattern for algorithms
- Use Repository pattern for data access

### ✅ Good Examples
```typescript
// ✅ GOOD: Can add new repositories without modifying existing code
interface IFileRepository {
  getItems(): Observable<FileItem[]>;
}

class FileHttpRepository implements IFileRepository {
  getItems() { /* HTTP implementation */ }
}

// Add new implementation without modifying existing
class FileLocalStorageRepository implements IFileRepository {
  getItems() { /* LocalStorage implementation */ }
}

class FileIndexedDBRepository implements IFileRepository {
  getItems() { /* IndexedDB implementation */ }
}

// Usage (doesn't need to change)
class FileManagerFacade {
  constructor(private repo: IFileRepository) {}
  loadItems() { return this.repo.getItems(); }
}
```

### ❌ Bad Examples
```typescript
// ❌ BAD: Must modify class to change behavior
class FileManager {
  loadItems(source: 'http' | 'localStorage' | 'indexedDB') {
    if (source === 'http') {
      // HTTP logic
    } else if (source === 'localStorage') {
      // LocalStorage logic
    } else if (source === 'indexedDB') {
      // IndexedDB logic
    }
    // Adding new source requires modifying this class!
  }
}
```

---

## 3️⃣ Liskov Substitution Principle (LSP)

### ✅ Definition
**"Objects of a superclass should be replaceable with objects of a subclass without breaking the application."**

### 🎯 How to Apply
- Subtypes must fulfill the contract of the base type
- Don't throw unexpected exceptions
- Don't change expected behavior
- Preserve pre/post conditions

### ✅ Good Examples
```typescript
// ✅ GOOD: All implementations honor the contract
interface IFileRepository {
  getItems(): Observable<FileItem[]>;  // Contract
}

class FileHttpRepository implements IFileRepository {
  getItems(): Observable<FileItem[]> {  // Returns Observable<FileItem[]>
    return this.http.get<FileItem[]>('/api/items');
  }
}

class FileMockRepository implements IFileRepository {
  getItems(): Observable<FileItem[]> {  // Returns Observable<FileItem[]>
    return of([mockData]);
  }
}

// Can substitute any implementation
function useRepository(repo: IFileRepository) {
  repo.getItems().subscribe(items => console.log(items));  // Works with ANY implementation
}
```

### ❌ Bad Examples
```typescript
// ❌ BAD: Breaks contract
interface IFileRepository {
  getItems(): Observable<FileItem[]>;
}

class BrokenRepository implements IFileRepository {
  getItems(): Observable<FileItem[]> {
    throw new Error('Not implemented');  // Breaks contract!
  }
}

class AnotherBrokenRepository implements IFileRepository {
  getItems(): any {  // Wrong return type!
    return null;
  }
}
```

---

## 4️⃣ Interface Segregation Principle (ISP)

### ✅ Definition
**"A client should never be forced to implement an interface that it doesn't use."**

### 🎯 How to Apply
- Create small, focused interfaces
- Don't force classes to implement unused methods
- Split fat interfaces into smaller ones

### ✅ Good Examples
```typescript
// ✅ GOOD: Small, focused interfaces
interface IReadable {
  read(): Observable<FileItem[]>;
}

interface IWritable {
  create(item: FileItem): Observable<FileItem>;
  update(id: string, item: Partial<FileItem>): Observable<FileItem>;
  delete(id: string): Observable<void>;
}

// Components use ONLY what they need
class ReadOnlyComponent {
  constructor(private repo: IReadable) {}  // Only read capability
  
  loadItems() {
    return this.repo.read();
  }
}

class EditableComponent {
  constructor(
    private readRepo: IReadable,    // Read capability
    private writeRepo: IWritable    // Write capability
  ) {}
}
```

### ❌ Bad Examples
```typescript
// ❌ BAD: Fat interface forces unused methods
interface IFileRepository {
  read(): Observable<FileItem[]>;
  create(item: FileItem): Observable<FileItem>;
  update(id: string, item: Partial<FileItem>): Observable<FileItem>;
  delete(id: string): Observable<void>;
  export(): Observable<Blob>;
  import(file: File): Observable<void>;
  backup(): Observable<void>;
  restore(): Observable<void>;
}

// Must implement ALL methods even if not needed!
class ReadOnlyRepository implements IFileRepository {
  read() { /* ... */ }
  
  // Forced to implement these even though not needed
  create() { throw new Error('Not supported'); }
  update() { throw new Error('Not supported'); }
  delete() { throw new Error('Not supported'); }
  export() { throw new Error('Not supported'); }
  import() { throw new Error('Not supported'); }
  backup() { throw new Error('Not supported'); }
  restore() { throw new Error('Not supported'); }
}
```

---

## 5️⃣ Dependency Inversion Principle (DIP)

### ✅ Definition
**"High-level modules should not depend on low-level modules. Both should depend on abstractions."**

### 🎯 How to Apply
- Depend on interfaces, not concrete classes
- Inject dependencies via constructor
- Use Angular's dependency injection
- Program to abstractions

### ✅ Good Examples
```typescript
// ✅ GOOD: Depends on abstraction
interface IFileRepository {
  getItems(): Observable<FileItem[]>;
}

@Injectable()
export class FileManagerFacade {
  constructor(
    private repo: IFileRepository,           // Abstraction!
    private state: FileStateService,
    private errorHandler: ErrorHandlerService
  ) {}
  
  loadItems() {
    return this.repo.getItems();  // Can be ANY implementation
  }
}

// Provide implementation in module
@NgModule({
  providers: [
    { provide: IFileRepository, useClass: FileHttpRepository }
    // Easy to switch: useClass: FileMockRepository
  ]
})
export class AppModule {}
```

### ❌ Bad Examples
```typescript
// ❌ BAD: Depends on concrete implementation
@Injectable()
export class FileManagerFacade {
  private repo = new FileHttpRepository();  // Hardcoded dependency!
  
  loadItems() {
    return this.repo.getItems();  // Tightly coupled
  }
}

// ❌ BAD: Direct instantiation
@Component({})
export class FileListComponent {
  constructor() {
    this.service = new FileManagerService();  // Tight coupling!
  }
}
```

---

## 🎯 Quick Checklist

### Before Committing Code, Ask:

#### SRP Checklist
- [ ] Does this class have one reason to change?
- [ ] Can I describe it without using "AND"?
- [ ] Is it < 200 lines?
- [ ] Does it have < 5 dependencies?

#### OCP Checklist
- [ ] Can I extend behavior without modifying code?
- [ ] Am I using interfaces/abstractions?
- [ ] Can I add new features by adding code, not changing code?

#### LSP Checklist
- [ ] Can I substitute implementations without breaking?
- [ ] Do all implementations honor the contract?
- [ ] Are pre/post conditions preserved?

#### ISP Checklist
- [ ] Are my interfaces small and focused?
- [ ] Do clients implement only what they use?
- [ ] Can I split fat interfaces?

#### DIP Checklist
- [ ] Do I depend on abstractions?
- [ ] Am I using dependency injection?
- [ ] Can I swap implementations easily?

---

## 🚨 Red Flags

### Code Smells That Indicate SOLID Violations

| Smell | Violated Principle | Fix |
|-------|-------------------|-----|
| God Class (> 500 lines) | SRP | Split into multiple classes |
| If/else or switch for types | OCP | Use Strategy pattern |
| Unexpected exceptions | LSP | Honor interface contract |
| Unused interface methods | ISP | Split interface |
| new keyword in constructor | DIP | Use dependency injection |
| Concrete class in constructor | DIP | Depend on interface |
| Many mocks in tests | SRP | Reduce responsibilities |

---

## 📚 Resources

### Books
- **Clean Code** by Robert C. Martin
- **Clean Architecture** by Robert C. Martin
- **Design Patterns** by Gang of Four
- **Refactoring** by Martin Fowler

### Online
- Refactoring Guru: https://refactoring.guru/
- Angular Style Guide: https://angular.io/guide/styleguide
- Uncle Bob's Blog: https://blog.cleancoder.com/

---

## 💡 Remember

> "The only way to go fast is to go well."  
> — Robert C. Martin (Uncle Bob)

**SOLID principles are not optional. They are the foundation of professional software development.**
