import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileItem } from '../../models/file-item';

interface FileTypeInfo {
    icon: string;
    color: string;
    preview: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-file-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-card" [class.is-folder]="file.folder" (click)="onClick(file)">
      <div class="file-preview" [style.backgroundColor]="fileTypeInfo.color + '15'">
        <!-- Image Preview -->
        @if (previewUrl) {
          <img [src]="previewUrl" [alt]="file.name" class="preview-image">
        }
        <!-- Icon Fallback -->
        @if (!previewUrl) {
          <i class="material-icons" [style.color]="fileTypeInfo.color">
            {{ fileTypeInfo.icon }}
          </i>
        }
      </div>
      
      <div class="file-info">
        <span class="file-name">{{ file.name }}</span>
        <span class="file-type" *ngIf="!file.folder">{{ file.mimeType }}</span>
        <span class="file-modified">Modified {{ file.modification | date:'medium' }}</span>
      </div>
      
      <div class="file-actions">
        <button class="icon-button" *ngIf="!file.folder" (click)="onDownload($event, file)" title="Download">
          <i class="material-icons">download</i>
        </button>
        <button class="icon-button" (click)="onRename($event, file)" title="Rename">
          <i class="material-icons">edit</i>
        </button>
        <button class="icon-button danger" (click)="onDelete($event, file)" title="Delete">
          <i class="material-icons">delete</i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./file-card.component.scss']
})
export class FileCardComponent {
  private _file!: FileItem;
  private _fileTypeInfo!: FileTypeInfo;
  private _previewUrl: string | null = null;
  
  @Input({ required: true })
  set file(value: FileItem) {
    if (value !== this._file) {
      this._file = value;
    }
  }
  get file(): FileItem {
    return this._file;
  }

  @Input({ required: true })
  set fileTypeInfo(value: FileTypeInfo) {
    if (value !== this._fileTypeInfo) {
      this._fileTypeInfo = value;
    }
  }
  get fileTypeInfo(): FileTypeInfo {
    return this._fileTypeInfo;
  }

  @Input()
  set previewUrl(value: string | null) {
    if (value !== this._previewUrl) {
      this._previewUrl = value;
    }
  }
  get previewUrl(): string | null {
    return this._previewUrl;
  }
  
  @Output() readonly fileClick = new EventEmitter<FileItem>();
  @Output() readonly download = new EventEmitter<FileItem>();
  @Output() readonly rename = new EventEmitter<FileItem>();
  @Output() readonly delete = new EventEmitter<FileItem>();

  onClick(file: FileItem): void {
    this.fileClick.emit(file);
  }

  onDownload(event: Event, file: FileItem): void {
    event.stopPropagation();
    this.download.emit(file);
  }

  onRename(event: Event, file: FileItem): void {
    event.stopPropagation();
    this.rename.emit(file);
  }

  onDelete(event: Event, file: FileItem): void {
    event.stopPropagation();
    this.delete.emit(file);
  }
}