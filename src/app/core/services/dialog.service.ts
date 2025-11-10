/**
 * Dialog Service (SRP - Single Responsibility)
 * Handles all user input dialogs
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface DialogResult {
	confirmed: boolean;
	value?: string;
}

@Injectable({
	providedIn: 'root',
})
export class DialogService {
	/**
	 * Show confirmation dialog
	 */
	confirm(message: string): Observable<boolean> {
		const result = window.confirm(message);
		return of(result);
	}

	/**
	 * Show prompt dialog for text input
	 */
	prompt(message: string, defaultValue = ''): Observable<string | null> {
		const result = window.prompt(message, defaultValue);
		return of(result);
	}

	/**
	 * Show delete confirmation with item name
	 */
	confirmDelete(itemName: string): Observable<boolean> {
		return this.confirm(`Are you sure you want to delete "${itemName}"?`);
	}

	/**
	 * Show rename dialog
	 */
	promptRename(currentName: string): Observable<string | null> {
		return this.prompt('Enter new name:', currentName);
	}

	/**
	 * Show create folder dialog
	 */
	promptCreateFolder(): Observable<string | null> {
		return this.prompt('Enter folder name:');
	}
}
