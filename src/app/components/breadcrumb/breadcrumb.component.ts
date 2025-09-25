import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileItem } from '../../models/file-item';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="breadcrumb-nav" aria-label="Folder navigation">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item">
          <button class="btn btn-link p-0 text-decoration-none" (click)="navigate.emit(null)">
            <i class="material-icons align-middle">home</i>
            <span class="ms-1">Root</span>
          </button>
        </li>
        
        @for (item of path; track item.id) {
          <li class="breadcrumb-item">
            <button class="btn btn-link p-0 text-decoration-none" (click)="navigate.emit(item.id)">
              {{ item.name }}
            </button>
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-nav {
      padding: 12px 24px;
      background-color: #f8fafd;    
	  }

    .breadcrumb {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      color: #5f6368;
      
      &::before {
        content: '>';
        padding: 0 8px;
        color: #5f6368;
      }
      
      &:first-child::before {
        display: none;
      }

      button {
        color: #1a73e8;
        
        &:hover {
          color: #174ea6;
        }

        .material-icons {
          font-size: 20px;
        }
      }

      &:last-child button {
        color: #202124;
        cursor: default;
        pointer-events: none;
      }
    }
  `]
})
export class BreadcrumbComponent {
  @Input() path: FileItem[] = [];
  @Output() navigate = new EventEmitter<string | null>();
}