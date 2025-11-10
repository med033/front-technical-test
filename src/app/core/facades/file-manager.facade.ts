/**
 * Facade Pattern - Orchestrates complex operations
 * SRP: Single responsibility - Business logic orchestration
 * DIP: Depends on abstraction (IFileRepository) not concretion
 * 
 * This facade provides a simplified interface to complex subsystems:
 * - Repository (data access)
 * - State management
 * - Error handling
 * - Notifications
 * 
 * RxJS Best Practices Applied:
 * - shareReplay for multicasting
 * - Proper error handling with catchError
 * - Side effects in tap, not map
 * - Avoid nested subscriptions
 * - Use switchMap for dependent operations
 */
import { Injectable, inject } from '@angular/core';
import {
	Observable,
	tap,
	catchError,
	finalize,
	of,
	map,
	shareReplay,
	switchMap,
	take,
} from 'rxjs';
import { IFileRepository } from '../interfaces/file-repository.interface';
import { FileHttpRepository } from '../repositories/file-http.repository';
import { FileStateService } from '../state/file-state.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { NotificationService } from '../services/notification.service';
import { FileValidationService } from '../utils/file-validation.service';
import { FileItem } from '../../models/file-item';

@Injectable({
	providedIn: 'root',
})
export class FileManagerFacade {
	// DIP: Depend on abstraction
	private readonly repository: IFileRepository = inject(FileHttpRepository);
	private readonly state = inject(FileStateService);
	private readonly errorHandler = inject(ErrorHandlerService);
	private readonly notifications = inject(NotificationService);
	private readonly fileValidation = new FileValidationService(); // ✅ Validation in service layer

	// Expose state observables
	readonly items$ = this.state.items$;
	readonly currentFolderId$ = this.state.currentFolderId$;
	readonly breadcrumbPath$ = this.state.breadcrumbPath$;
	readonly isLoading$ = this.state.isLoading$;
	readonly isUploading$ = this.state.isUploading$;

	/**
	 * Load items for a specific folder
	 * RxJS Best Practice: Use shareReplay(1) to avoid multiple API calls
	 */
	loadItems(folderId?: string): Observable<FileItem[]> {
		this.state.setLoading(true);
		this.state.setError(null);

		return this.repository.getItems(folderId).pipe(
			tap(response => {
				this.state.setItems(response.items);
				this.state.setCurrentFolderId(folderId || null);
			}),
			map(response => response.items),
			catchError(error => {
				const errorDetails = this.errorHandler.parseError(error);
				const userMessage =
					this.errorHandler.getUserFriendlyMessage(errorDetails);
				this.state.setError(userMessage);
				this.notifications.error(userMessage);
				return of([]);
			}),
			finalize(() => this.state.setLoading(false)),
			shareReplay({ bufferSize: 1, refCount: true }) // 🚀 Optimized shareReplay
		);
	}

	/**
	 * Load breadcrumb path for current folder
	 */
	loadBreadcrumbPath(folderId: string | null): Observable<FileItem[]> {
		if (!folderId) {
			this.state.setBreadcrumbPath([]);
			return of([]);
		}

		return this.repository.getItemPath(folderId).pipe(
			tap(response => this.state.setBreadcrumbPath(response.items)),
			map(response => response.items),
			catchError(error => {
				this.errorHandler.handleError(error);
				return of([]);
			}),
			shareReplay({ bufferSize: 1, refCount: true })
		);
	}

	/**
	 * Upload multiple files with validation
	 * RxJS Best Practice: Use switchMap to avoid nested subscriptions
	 * ✅ Validation logic in service layer
	 */
	uploadFiles(files: File[], parentId?: string): Observable<boolean> {
		// ✅ Validation in service layer
		const validation = this.fileValidation.validateFiles(files);
		if (!validation.valid) {
			this.notifications.error(validation.message || 'Invalid files');
			return of(false);
		}

		this.state.setUploading(true);

		return this.repository.uploadFiles(files, parentId).pipe(
			tap(() => {
				this.notifications.success(
					`${files.length} file(s) uploaded successfully`
				);
			}),
			// 🚀 Use switchMap instead of nested subscribe
			switchMap(() => this.loadItems(parentId)),
			map(() => true),
			catchError(error => {
				const errorDetails = this.errorHandler.parseError(error);
				const userMessage =
					this.errorHandler.getUserFriendlyMessage(errorDetails);
				this.notifications.error(`Upload failed: ${userMessage}`);
				return of(false);
			}),
			finalize(() => this.state.setUploading(false))
		);
	}

	/**
	 * Create a new folder with validation
	 * RxJS Best Practice: Use switchMap to chain dependent operations
	 * ✅ Validation logic in service layer
	 */
	createFolder(
		name: string,
		parentId?: string
	): Observable<FileItem | null> {
		// ✅ Validation in service layer
		const validation = this.fileValidation.isValidFileName(name);
		if (!validation.valid) {
			this.notifications.error(validation.message || 'Invalid folder name');
			return of(null);
		}

		this.state.setLoading(true);

		return this.repository.createFolder(name.trim(), parentId).pipe(
			tap(response => {
				this.notifications.success(
					`Folder "${name}" created successfully`
				);
			}),
			// 🚀 Chain operations with switchMap
			switchMap(response =>
				this.loadItems(parentId).pipe(map(() => response.item))
			),
			catchError(error => {
				const errorDetails = this.errorHandler.parseError(error);
				const userMessage =
					this.errorHandler.getUserFriendlyMessage(errorDetails);
				this.notifications.error(`Failed to create folder: ${userMessage}`);
				return of(null);
			}),
			finalize(() => this.state.setLoading(false))
		);
	}

	/**
	 * Delete an item (file or folder)
	 * RxJS Best Practice: Use currentFolderId$ observable instead of accessing state directly
	 */
	deleteItem(itemId: string, itemName: string): Observable<boolean> {
		this.state.setLoading(true);

		return this.repository.deleteItem(itemId).pipe(
			tap(() => {
				this.notifications.success(`"${itemName}" deleted successfully`);
			}),
			// 🚀 Use observable state, not direct state access
			switchMap(() =>
				this.currentFolderId$.pipe(
					take(1),
					switchMap(currentFolderId =>
						this.loadItems(currentFolderId || undefined)
					)
				)
			),
			map(() => true),
			catchError(error => {
				const errorDetails = this.errorHandler.parseError(error);
				const userMessage =
					this.errorHandler.getUserFriendlyMessage(errorDetails);
				this.notifications.error(`Failed to delete: ${userMessage}`);
				return of(false);
			}),
			finalize(() => this.state.setLoading(false))
		);
	}

	/**
	 * Rename an item with validation
	 * RxJS Best Practice: Chain operations declaratively
	 * ✅ Validation logic in service layer
	 */
	renameItem(
		itemId: string,
		oldName: string,
		newName: string
	): Observable<FileItem | null> {
		// ✅ Validation in service layer
		const validation = this.fileValidation.isValidFileName(newName);
		if (!validation.valid) {
			this.notifications.error(validation.message || 'Invalid name');
			return of(null);
		}

		if (newName.trim() === oldName) {
			return of(null); // No change needed
		}

		this.state.setLoading(true);

		return this.repository.updateItem(itemId, { name: newName.trim() }).pipe(
			tap(() => {
				this.notifications.success(`Renamed "${oldName}" to "${newName}"`);
			}),
			// 🚀 Declarative approach with observables
			switchMap(updatedItem =>
				this.currentFolderId$.pipe(
					take(1),
					switchMap(currentFolderId =>
						this.loadItems(currentFolderId || undefined)
					),
					map(() => updatedItem)
				)
			),
			catchError(error => {
				const errorDetails = this.errorHandler.parseError(error);
				const userMessage =
					this.errorHandler.getUserFriendlyMessage(errorDetails);
				this.notifications.error(`Failed to rename: ${userMessage}`);
				return of(null);
			}),
			finalize(() => this.state.setLoading(false))
		);
	}

	/**
	 * Download a file
	 */
	downloadFile(itemId: string, fileName: string): Observable<boolean> {
		return this.repository.downloadFile(itemId).pipe(
			tap(blob => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = fileName;
				link.click();
				window.URL.revokeObjectURL(url);
				this.notifications.success(`Downloading "${fileName}"`);
			}),
			map(() => true),
			catchError(error => {
				const errorDetails = this.errorHandler.parseError(error);
				const userMessage =
					this.errorHandler.getUserFriendlyMessage(errorDetails);
				this.notifications.error(`Download failed: ${userMessage}`);
				return of(false);
			})
		);
	}

	/**
	 * Get root folders for sidebar
	 * RxJS Best Practice: shareReplay with refCount for proper cleanup
	 */
	getRootFolders(): Observable<FileItem[]> {
		return this.repository.getItems().pipe(
			map(response =>
				response.items.filter(item => item.folder && item.parentId === null)
			),
			catchError(error => {
				this.errorHandler.handleError(error);
				return of([]);
			}),
			shareReplay({ bufferSize: 1, refCount: true }) // 🚀 Proper multicasting
		);
	}
}
