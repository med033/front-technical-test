import { Component, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-drop-zone',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="drop-zone" [class.active]="isDragging">
            <div class="drop-zone-content">
                <i class="material-icons">upload_file</i>
                <p>Drag and drop files here</p>
                <p class="sub-text">or click to select files</p>
            </div>
            <input
                #fileInput
                type="file"
                multiple
                (change)="onFileSelected($event)"
                style="display: none"
            >
        </div>
    `,
    styles: [`
        .drop-zone {
            width: 100%;
            min-height: 200px;
            border: 2px dashed #dadce0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            background-color: #f8f9fa;
            cursor: pointer;

            &.active {
                border-color: #1a73e8;
                background-color: rgba(26, 115, 232, 0.05);
            }

            &:hover {
                border-color: #1a73e8;
                background-color: rgba(26, 115, 232, 0.02);
            }
        }

        .drop-zone-content {
            text-align: center;
            color: #5f6368;

            i {
                font-size: 48px;
                margin-bottom: 16px;
                color: #1a73e8;
            }

            p {
                margin: 0;
                font-size: 16px;

                &.sub-text {
                    font-size: 14px;
                    margin-top: 8px;
                    color: #80868b;
                }
            }
        }
    `]
})
export class DropZoneComponent {
    @Input() acceptedFileTypes?: string[];
    @Output() filesDropped = new EventEmitter<FileList>();
    @Output() fileSelected = new EventEmitter<FileList>();

    isDragging = false;

    @HostBinding('class.drag-over') dragOver = false;

    @HostListener('dragover', ['$event'])
    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    @HostListener('dragleave', ['$event'])
    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    @HostListener('drop', ['$event'])
    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.filesDropped.emit(files);
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.fileSelected.emit(input.files);
        }
    }
}