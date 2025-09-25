import { Routes } from '@angular/router';
import { FileListComponent } from './components/file-list/file-list.component';

export const routes: Routes = [
	{
		path: '',
		component: FileListComponent,
		title: 'File Manager - Root',
	},
	{
		path: 'folder/:folderId',
		component: FileListComponent,
		title: 'File Manager - Folder',
	},
	{
		path: 'search',
		component: FileListComponent,
		title: 'File Manager - Search Results',
	},
	{
		path: '**', // Wildcard route for any unmatched path
		redirectTo: '',
		pathMatch: 'full',
	},
];
