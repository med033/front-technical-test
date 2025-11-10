# Architecture Diagrams

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Container Component (Smart)                             │   │
│  │  - Orchestrates business logic                           │   │
│  │  - Manages subscriptions                                 │   │
│  │  - Calls Facade                                          │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │ @Input/@Output                          │
│  ┌────────────────────▼─────────────────────────────────────┐   │
│  │  Presentational Component (Dumb)                         │   │
│  │  - Pure UI rendering                                     │   │
│  │  - No business logic                                     │   │
│  │  - OnPush change detection                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FileManagerFacade (Orchestrator)                        │   │
│  │  ├── Validates input                                     │   │
│  │  ├── Calls Repository                                    │   │
│  │  ├── Updates State                                       │   │
│  │  ├── Handles Errors                                      │   │
│  │  └── Shows Notifications                                 │   │
│  └────┬────────┬─────────┬─────────┬─────────┬─────────────┘   │
│       │        │         │         │         │                  │
│    ┌──▼───┐ ┌─▼────┐ ┌─▼──────┐ ┌▼────────┐ ┌▼────────────┐   │
│    │State │ │Error │ │Notif.  │ │Dialog   │ │Validation   │   │
│    │Mgmt  │ │Handle│ │Service │ │Service  │ │Service      │   │
│    └──────┘ └──────┘ └────────┘ └─────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  IFileRepository (Interface)                             │   │
│  │  - getItems()                                            │   │
│  │  - uploadFiles()                                         │   │
│  │  - createFolder()                                        │   │
│  │  - deleteItem()                                          │   │
│  └─────────────────────┬────────────────────────────────────┘   │
│                        │ implements                              │
│  ┌─────────────────────▼────────────────────────────────────┐   │
│  │  FileHttpRepository (Concrete)                           │   │
│  │  - HTTP calls to API                                     │   │
│  │  - Data transformation                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        ┌───────────┐
                        │  Backend  │
                        │    API    │
                        └───────────┘
```

---

## 2. Component Communication Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interaction                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
     ┌──────────────────────────────────────────────────┐
     │  Presentational Component                        │
     │  ┌────────────────────────────────────────────┐  │
     │  │  Template                                  │  │
     │  │  <button (click)="onDeleteClick(item)">   │  │
     │  └────────────────┬───────────────────────────┘  │
     │                   │                              │
     │                   ▼                              │
     │  ┌────────────────────────────────────────────┐  │
     │  │  onDeleteClick(item: FileItem) {          │  │
     │  │    this.deleteItem.emit(item);  ────────────────┐
     │  │  }                                        │  │   │
     │  └────────────────────────────────────────────┘  │   │
     └──────────────────────────────────────────────────┘   │
                                                             │
                                    @Output deleteItem      │
                                                             │
                            ┌────────────────────────────────┘
                            │
                            ▼
     ┌──────────────────────────────────────────────────┐
     │  Container Component                             │
     │  ┌────────────────────────────────────────────┐  │
     │  │  (deleteItem)="onDeleteItem($event)"      │  │
     │  └────────────────┬───────────────────────────┘  │
     │                   │                              │
     │                   ▼                              │
     │  ┌────────────────────────────────────────────┐  │
     │  │  onDeleteItem(item: FileItem) {           │  │
     │  │    this.facade.deleteItem(item.id);       │  │
     │  │  }                                        │  │
     │  └────────────────┬───────────────────────────┘  │
     └───────────────────┼──────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │  FileManagerFacade           │
          │  deleteItem(id, name) { }    │
          └──────────────┬───────────────┘
                         │
                         ▼
        [Business logic orchestration]
```

---

## 3. Data Flow (User Action → UI Update)

```
┌────────────────────────────────────────────────────────────────┐
│                        REQUEST FLOW                             │
└────────────────────────────────────────────────────────────────┘

User clicks "Upload"
        │
        ▼
Presentational Component
  @Output filesUpload.emit(files)
        │
        ▼
Container Component
  onFilesUpload(files: FileList)
        │
        ├─→ FileValidationService.validateFiles()
        │   ├─ Check file size
        │   ├─ Check file type
        │   └─ Check file name
        │
        ▼
FileManagerFacade
  uploadFiles(files, folderId)
        │
        ├─→ FileStateService.setUploading(true)
        │
        ├─→ IFileRepository.uploadFiles()
        │       │
        │       ▼
        │   FileHttpRepository
        │     HTTP POST /api/items
        │       │
        │       ▼
        │   Backend API
        │
        ├─→ Success:
        │   ├─ FileStateService.setItems(newItems)
        │   ├─ NotificationService.success("Upload successful")
        │   └─ FileStateService.setUploading(false)
        │
        └─→ Error:
            ├─ ErrorHandlerService.parseError()
            ├─ NotificationService.error("Upload failed")
            └─ FileStateService.setUploading(false)

┌────────────────────────────────────────────────────────────────┐
│                        RESPONSE FLOW                            │
└────────────────────────────────────────────────────────────────┘

Backend API Response
        │
        ▼
FileHttpRepository
  Observable<UploadResponse>
        │
        ▼
FileManagerFacade
  tap(response => state.setItems())
        │
        ▼
FileStateService
  state$.next({ items: newItems })
        │
        ▼
items$ Observable emits
        │
        ▼
Container Component
  items$ | async
        │
        ▼
Presentational Component
  @Input() items: FileItem[]
        │
        ▼
Template Renders
  *ngFor="let file of items"
        │
        ▼
UI Updates (OnPush Change Detection)
```

---

## 4. SOLID Principles Applied

```
┌─────────────────────────────────────────────────────────────────┐
│  S - Single Responsibility Principle                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FileHttpRepository      ──→  HTTP calls ONLY                   │
│  ErrorHandlerService     ──→  Error handling ONLY               │
│  NotificationService     ──→  Notifications ONLY                │
│  DialogService           ──→  Dialogs ONLY                      │
│  FileStateService        ──→  State management ONLY             │
│  FileValidationService   ──→  Validation ONLY                   │
│  FileFilterService       ──→  Filtering ONLY                    │
│                                                                  │
│  Each class has ONE reason to change                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  O - Open/Closed Principle                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IFileRepository (Interface)                                    │
│         │                                                        │
│         ├─→ FileHttpRepository                                  │
│         ├─→ FileLocalStorageRepository    (NEW - No changes!)  │
│         └─→ FileIndexedDBRepository       (NEW - No changes!)  │
│                                                                  │
│  Open for EXTENSION, closed for MODIFICATION                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  L - Liskov Substitution Principle                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  function useRepository(repo: IFileRepository) {                │
│    return repo.getItems();  // Works with ANY implementation    │
│  }                                                               │
│                                                                  │
│  useRepository(new FileHttpRepository());        ✓              │
│  useRepository(new FileLocalStorageRepository());  ✓            │
│  useRepository(new FileMockRepository());        ✓              │
│                                                                  │
│  Subtypes are SUBSTITUTABLE for base types                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  I - Interface Segregation Principle                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FileStateService                                               │
│    ├─→ items$           (Component uses ONLY this)             │
│    ├─→ isLoading$       (Component uses ONLY this)             │
│    ├─→ isUploading$     (Component uses ONLY this)             │
│    └─→ error$           (Component uses ONLY this)             │
│                                                                  │
│  Clients subscribe ONLY to what they need                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D - Dependency Inversion Principle                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FileManagerFacade                                              │
│    constructor(                                                 │
│      private repo: IFileRepository      ←─ Interface!          │
│    ) {}                                                         │
│                                                                  │
│  Depends on ABSTRACTION, not concrete class                     │
│                                                                  │
│  Can inject:                                                    │
│    - FileHttpRepository          (Production)                   │
│    - FileMockRepository          (Testing)                      │
│    - FileLocalStorageRepository  (Offline mode)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Design Patterns Applied

```
┌─────────────────────────────────────────────────────────────────┐
│  Pattern 1: Repository Pattern                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Abstract data access layer                            │
│                                                                  │
│  IFileRepository (Abstract)                                     │
│         │                                                        │
│         ▼                                                        │
│  FileHttpRepository (Concrete)                                  │
│         │                                                        │
│         ▼                                                        │
│  HTTP Client → Backend API                                      │
│                                                                  │
│  Benefits:                                                       │
│  ✓ Easy to swap data sources                                    │
│  ✓ Easy to mock for testing                                     │
│  ✓ Centralized data access                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 2: Facade Pattern                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Simplify complex subsystems                           │
│                                                                  │
│  FileManagerFacade                                              │
│         │                                                        │
│         ├─→ IFileRepository    (Data access)                    │
│         ├─→ FileStateService   (State management)               │
│         ├─→ ErrorHandler       (Error handling)                 │
│         └─→ Notifications      (User feedback)                  │
│                                                                  │
│  Benefits:                                                       │
│  ✓ Simplified API                                               │
│  ✓ Hides complexity                                             │
│  ✓ Single point of coordination                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 3: Observer Pattern (State Management)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Reactive state updates                                │
│                                                                  │
│  FileStateService                                               │
│    private state$ = BehaviorSubject<FileState>()                │
│         │                                                        │
│         ├─→ items$       (Observable)                           │
│         ├─→ isLoading$   (Observable)                           │
│         └─→ error$       (Observable)                           │
│                │                                                 │
│                ▼                                                 │
│         Components subscribe                                     │
│                                                                  │
│  Benefits:                                                       │
│  ✓ Centralized state                                            │
│  ✓ Reactive updates                                             │
│  ✓ OnPush change detection support                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 4: Strategy Pattern                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Different algorithms, same interface                  │
│                                                                  │
│  IFileFilter (Interface)                                        │
│         │                                                        │
│         ├─→ FolderFilter (Strategy 1)                           │
│         ├─→ FileFilter   (Strategy 2)                           │
│         └─→ ... (Can add more strategies)                       │
│                                                                  │
│  Benefits:                                                       │
│  ✓ Easy to add new strategies                                   │
│  ✓ Decoupled from context                                       │
│  ✓ Open/Closed Principle                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 5: Container/Presentational                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Purpose: Separate smart (logic) from dumb (UI) components      │
│                                                                  │
│  Container Component (Smart)                                    │
│    ├─ Manages state                                             │
│    ├─ Calls services                                            │
│    ├─ Business logic                                            │
│    └─ Subscriptions                                             │
│         │ @Input/@Output                                        │
│         ▼                                                        │
│  Presentational Component (Dumb)                                │
│    ├─ Receives @Input()                                         │
│    ├─ Emits @Output()                                           │
│    ├─ Pure UI rendering                                         │
│    ├─ OnPush change detection                                   │
│    └─ No service calls                                          │
│                                                                  │
│  Benefits:                                                       │
│  ✓ Reusable presentational components                           │
│  ✓ Easy to test both separately                                 │
│  ✓ Clear separation of concerns                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Before vs After Comparison

```
BEFORE (Junior Level):
┌────────────────────────────────────────┐
│  FileListComponent (425 lines)        │
│  ┌──────────────────────────────────┐  │
│  │  ├─ Routing logic                │  │
│  │  ├─ API calls (HTTP)             │  │
│  │  ├─ Business logic               │  │
│  │  ├─ Error handling (console.log) │  │
│  │  ├─ UI rendering                 │  │
│  │  ├─ State management             │  │
│  │  ├─ Upload handling              │  │
│  │  ├─ Validation                   │  │
│  │  └─ Navigation                   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Problems:                             │
│  ❌ Violates SRP                       │
│  ❌ Hard to test (6+ dependencies)    │
│  ❌ Tight coupling                     │
│  ❌ No design patterns                 │
│  ❌ Poor error handling                │
└────────────────────────────────────────┘


AFTER (Senior Level):
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Container Component (180 lines)                    │    │
│  │  - Orchestration only                               │    │
│  │  - Calls Facade                                     │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  Presentational Component (150 lines)               │    │
│  │  - Pure UI rendering                                │    │
│  │  - @Input/@Output only                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Business Logic Layer                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  FileManagerFacade                                  │    │
│  │  - Orchestrates operations                          │    │
│  │  - Coordinates services                             │    │
│  └────┬────┬─────┬──────┬───────┬──────────────────────┘    │
│       │    │     │      │       │                            │
│    ┌──▼┐ ┌─▼──┐ ┌▼───┐ ┌▼────┐ ┌▼──────┐                   │
│    │Stt│ │Err│ │Not│ │Val│ │Dlg│                           │
│    └───┘ └───┘ └───┘ └────┘ └────┘                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Data Access Layer                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  IFileRepository (Interface)                        │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────┐    │
│  │  FileHttpRepository (Concrete)                      │    │
│  │  - HTTP calls ONLY                                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘

Benefits:
✓ SOLID compliant
✓ 5 design patterns
✓ Easy to test (mockable)
✓ Loose coupling
✓ Centralized error handling
✓ Scalable architecture
```

---

## Legend

```
│   Vertical line (connection)
├── Branch point
└── End point
─→  Arrow (flow direction)
▼   Downward arrow
┌─┐ Box corners
```

---

**Use these diagrams to understand the architecture visually!**
