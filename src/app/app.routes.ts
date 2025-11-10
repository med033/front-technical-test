/**
 * Application Routes with Optimizations
 *
 * RxJS/Angular Best Practices:
 * - Use resolvers for data pre-loading
 * - Lazy load components for optimal bundle splitting
 * - Define clear route titles for SEO and UX
 *
 * Lazy Loading Benefits:
 * - Smaller initial bundle size
 * - Faster initial page load
 * - Components loaded on-demand
 * - Better code splitting
 */
import { Routes } from '@angular/router';
import { fileListResolver } from './resolvers/file-list.resolver';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./components/file-list/file-list-container.component').then(
				m => m.FileListContainerComponent
			),
		title: 'File Manager - Root',
		resolve: {
			data: fileListResolver, // 🚀 Pre-load data before component initialization
		},
	},
	{
		path: 'folder/:folderId',
		loadComponent: () =>
			import('./components/file-list/file-list-container.component').then(
				m => m.FileListContainerComponent
			),
		title: 'File Manager - Folder',
		resolve: {
			data: fileListResolver, // 🚀 Pre-load data for better UX
		},
	},
	{
		path: 'search',
		loadComponent: () =>
			import('./components/file-list/file-list-container.component').then(
				m => m.FileListContainerComponent
			),
		title: 'File Manager - Search Results',
		// No resolver for search as it might have different data requirements
	},
	{
		path: '**', // Wildcard route for any unmatched path
		redirectTo: '',
		pathMatch: 'full',
	},
];
