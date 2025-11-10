/**
 * File List Resolver
 * Pre-loads data before route activation for better UX
 * 
 * Benefits:
 * - Data is loaded before component initializes
 * - Prevents loading flicker
 * - Better user experience
 * - Follows Angular best practices
 */
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, combineLatest, map } from 'rxjs';
import { FileManagerFacade } from '../core/facades/file-manager.facade';
import { FileItem } from '../models/file-item';

export interface FileListResolverData {
	items: FileItem[];
	breadcrumbPath: FileItem[];
	rootFolders: FileItem[];
}

/**
 * Modern Angular functional resolver (Angular 14+)
 * RxJS Best Practice: Use combineLatest for parallel data loading
 */
export const fileListResolver: ResolveFn<FileListResolverData> = (
	route: ActivatedRouteSnapshot
): Observable<FileListResolverData> => {
	const facade = inject(FileManagerFacade);
	const folderId = route.paramMap.get('folderId');

	// 🚀 Load all data in parallel using combineLatest
	return combineLatest({
		items: facade.loadItems(folderId || undefined),
		breadcrumbPath: facade.loadBreadcrumbPath(folderId),
		rootFolders: facade.getRootFolders(),
	});
};
