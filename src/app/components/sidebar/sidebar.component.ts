import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileItem } from '../../models/file-item';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-container" (click)="folderSelect.emit(null)" role="button" tabindex="0">
          <img src="logo-file-m.svg" alt="File Manager Logo" class="app-logo">
          <span class="logo-text">File Manager</span>
        </div>
      </div>
      
      <div class="main-actions">
        <input #fileInput type="file" multiple (change)="onFilesSelected($event)" style="display: none">
        <input #folderInput type="file" webkitdirectory (change)="onFolderSelected($event)" style="display: none">
        <button class="action-button primary" (click)="fileInput.click()">
          <i class="material-icons">upload_file</i>
          <span>Upload Files</span>
        </button>
        <button class="action-button primary" (click)="folderInput.click()">
          <i class="material-icons">drive_folder_upload</i>
          <span>Upload Folder</span>
        </button>
        <button class="action-button" (click)="createFolder.emit()">
          <i class="material-icons">create_new_folder</i>
          <span>New Folder</span>
        </button>
      </div>

      <nav class="nav-items">
        <button class="nav-item" [class.active]="!currentFolderId" (click)="folderSelect.emit(null)">
          <i class="material-icons">home</i>
          <span>My Files</span>
        </button>

        <div class="folder-tree">
          <ng-container *ngFor="let folder of folders">
            <button 
              class="nav-item folder-item" 
              [class.active]="folder.id === currentFolderId"
              (click)="folderSelect.emit(folder.id)"
            >
              <i class="material-icons">folder</i>
              <span>{{ folder.name }}</span>
            </button>
          </ng-container>
        </div>

      </nav>
    </aside>
  `,
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() currentFolderId: string | null = null;
  @Input() folders: FileItem[] = [];
  @Output() createFolder = new EventEmitter<void>();
  @Output() uploadFiles = new EventEmitter<Event>();
  @Output() uploadFolder = new EventEmitter<Event>();
  @Output() folderSelect = new EventEmitter<string | null>();

  onFilesSelected(event: Event): void {
    this.uploadFiles.emit(event);
  }
  onFolderSelected(event: Event): void {
	this.uploadFolder.emit(event);
  }
}