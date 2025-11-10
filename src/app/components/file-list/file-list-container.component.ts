/**
 * CONTAINER COMPONENT (Smart Component)
 * SRP: Single responsibility - Orchestration and delegation
 * 
 * Responsibilities:
 * - Communicates with services/facade
 * - Delegates to facade for business logic
 * - Orchestrates user interactions
 * - Manages presentation state only
 * 
 * Does NOT:
 * - Contain business logic (in facade)
 * - Contain validation logic (in facade/services)
 * - Make direct API calls (use facade)
 * - Show alerts directly (use NotificationService via facade)
 * 
 * RxJS Best Practices:
 * - OnPush change detection for performance
 * - takeUntilDestroyed for automatic unsubscription
 * - Declarative observables over imperative subscriptions
 */
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	switchMap,
	filter,
	combineLatest,
	map,
} from 'rxjs';

import { FileManagerFacade } from '../../core/facades/file-manager.facade';
import { DialogService } from '../../core/services/dialog.service';
import { FileItem } from '../../models/file-item';
import { FileListPresentationalComponent } from './file-list-presentational.component';

@Component({
	selector: 'app-file-list-container',
	standalone: true,
	imports: [CommonModule, FileListPresentationalComponent],
	changeDetection: ChangeDetectionStrategy.OnPush, // 🚀 Performance optimization
	template: `
		<app-file-list-presentational
			[items]="items$ | async"
			[breadcrumbPath]="breadcrumbPath$ | async"
			[rootFolders]="rootFolders$ | async"
			[currentFolderId]="currentFolderId$ | async"
			[isLoading]="isLoading$ | async"
			[isUploading]="isUploading$ | async"
			[isDraggingFile]="isDraggingFile"
			(itemClick)="onItemClick($event)"
			(filesUpload)="onFilesUpload($event)"
			(folderUpload)="onFolderUpload($event)"
			(filesDropped)="onFilesDropped($event)"
			(createFolder)="onCreateFolder()"
			(deleteItem)="onDeleteItem($event)"
			(renameItem)="onRenameItem($event)"
			(downloadFile)="onDownloadFile($event)"
			(navigateToFolder)="navigateToFolder($event)"
			(dragStateChange)="onDragStateChange($event)">
		</app-file-list-presentational>
	`,
})
export class FileListContainerComponent implements OnInit {
	// ✅ Inject dependencies using modern Angular inject() function
	private readonly facade = inject(FileManagerFacade);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly dialogService = inject(DialogService);
	private readonly destroyRef = takeUntilDestroyed(); // 🚀 Modern Angular automatic cleanup

	// Declarative observables (Best Practice)
	readonly items$ = this.facade.items$;
	readonly breadcrumbPath$ = this.facade.breadcrumbPath$;
	readonly rootFolders$ = this.facade.getRootFolders();
	readonly isLoading$ = this.facade.isLoading$;
	readonly isUploading$ = this.facade.isUploading$;
	readonly currentFolderId$ = this.facade.currentFolderId$;

	isDraggingFile = false;

	ngOnInit(): void {
		this.initializeRouteListener();
	}

	/**
	 * Declarative route handling with RxJS best practices
	 * 🚀 OPTIMIZATION: Data is now pre-loaded by resolver, so component receives data instantly
	 * 
	 * Benefits:
	 * - No loading flicker - data is ready before component renders
	 * - Better UX - instant display
	 * - Parallel loading - resolver loads all data simultaneously
	 * - Automatic cleanup with takeUntilDestroyed
	 * 
	 * Note: The resolver pre-loads data, but we still listen for route changes
	 * to handle navigation within the app (when resolver already ran)
	 */
	private initializeRouteListener(): void {
		this.route.paramMap
			.pipe(
				map(params => params.get('folderId')),
				switchMap(folderId => 
					// Load data on subsequent navigations
					// First load is handled by resolver
					combineLatest([
						this.facade.loadItems(folderId || undefined),
						this.facade.loadBreadcrumbPath(folderId),
					])
				),
				this.destroyRef // 🚀 Automatic unsubscription (Angular 16+)
			)
			.subscribe();
	}

	onItemClick(item: FileItem): void {
		if (item.folder) {
			this.navigateToFolder(item.id);
		}
	}

	navigateToFolder(folderId: string | null): void {
		if (folderId) {
			this.router.navigate(['/folder', folderId]);
		} else {
			this.router.navigate(['/']);
		}
	}

	/**
	 * Handle file upload - delegates validation to facade
	 * ✅ No business logic in component
	 */
	onFilesUpload(files: FileList): void {
		this.currentFolderId$
			.pipe(
				switchMap(folderId => 
					this.facade.uploadFiles(Array.from(files), folderId || undefined)
				),
				this.destroyRef
			)
			.subscribe();
	}

	/**
	 * Handle folder upload - delegates to facade
	 * ✅ No business logic in component
	 */
	onFolderUpload(files: FileList): void {
		this.onFilesUpload(files); // Reuse upload logic
	}

	onFilesDropped(files: FileList): void {
		this.onFilesUpload(files);
	}

	/**
	 * Create folder - delegates validation to facade
	 * ✅ No validation logic in component
	 */
	onCreateFolder(): void {
		combineLatest([
			this.dialogService.promptCreateFolder(),
			this.currentFolderId$
		])
			.pipe(
				filter(([name]) => !!name), // Only proceed if name provided
				switchMap(([name, folderId]) => 
					this.facade.createFolder(name!, folderId || undefined)
				),
				this.destroyRef
			)
			.subscribe();
	}

	/**
	 * Delete item with confirmation
	 * RxJS Best Practice: Use filter to handle early exits
	 */
	onDeleteItem(item: FileItem): void {
		this.dialogService
			.confirmDelete(item.name)
			.pipe(
				filter(confirmed => confirmed), // Only proceed if confirmed
				switchMap(() => this.facade.deleteItem(item.id, item.name)),
				this.destroyRef
			)
			.subscribe();
	}

	/**
	 * Rename item - delegates validation to facade
	 * ✅ No validation logic in component
	 */
	onRenameItem(item: FileItem): void {
		this.dialogService
			.promptRename(item.name)
			.pipe(
				filter(newName => !!newName && newName !== item.name),
				switchMap(newName => 
					this.facade.renameItem(item.id, item.name, newName!)
				),
				this.destroyRef
			)
			.subscribe();
	}

	onDownloadFile(item: FileItem): void {
		this.facade
			.downloadFile(item.id, item.name)
			.pipe(this.destroyRef)
			.subscribe();
	}

	onDragStateChange(isDragging: boolean): void {
		this.isDraggingFile = isDragging;
	}
}
