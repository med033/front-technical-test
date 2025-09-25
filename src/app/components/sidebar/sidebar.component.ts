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
          <svg class="app-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#3B82F6"/>
                <stop offset="100%" style="stop-color:#8B5CF6"/>
              </linearGradient>
            </defs>
            <g fill="url(#logoGradient)">
              <path d="M85,25H60l-5-5c-1.1-1.1-2.6-2-4.2-2H25c-3.3,0-5.8,2.7-5.8,6v52c0,3.3,2.5,6,5.8,6h60c3.3,0,5.8-2.7,5.8-6V31 C90.8,27.7,88.3,25,85,25z"/>
              <path opacity="0.2" d="M85,25H25c-3.3,0-5.8,2.7-5.8,6v4c0-3.3,2.5-6,5.8-6h60c3.3,0,5.8,2.7,5.8,6v-4C90.8,27.7,88.3,25,85,25z"/>
              <path opacity="0.1" fill="#FFFFFF" d="M25,83h60c3.3,0,5.8-2.7,5.8-6v-4c0,3.3-2.5,6-5.8,6H25c-3.3,0-5.8-2.7-5.8-6v4 C19.2,80.3,21.7,83,25,83z"/>
            </g>
            <path fill="#FFFFFF" opacity="0.4" d="M65,39H35c-1.1,0-2,0.9-2,2v2c0,1.1,0.9,2,2,2h30c1.1,0,2-0.9,2-2v-2C67,39.9,66.1,39,65,39z"/>
            <path fill="#FFFFFF" opacity="0.4" d="M75,51H35c-1.1,0-2,0.9-2,2v2c0,1.1,0.9,2,2,2h40c1.1,0,2-0.9,2-2v-2C77,51.9,76.1,51,75,51z"/>
            <path fill="#FFFFFF" opacity="0.4" d="M75,63H35c-1.1,0-2,0.9-2,2v2c0,1.1,0.9,2,2,2h40c1.1,0,2-0.9,2-2v-2C77,63.9,76.1,63,75,63z"/>
          </svg>
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

        <button class="nav-item">
          <i class="material-icons">access_time</i>
          <span>Recent</span>
        </button>
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