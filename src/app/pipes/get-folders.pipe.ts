import { Pipe, PipeTransform } from '@angular/core';
import { FileItem } from '../models/file-item';

@Pipe({
    name: 'getFolders',
    standalone: true
})
export class GetFoldersPipe implements PipeTransform {
    transform(items: FileItem[] | null | undefined): FileItem[] {
        if (!items) {
            return [];
        }
        
        return items
            .filter(item => item.folder)
            .sort((a, b) => a.name.localeCompare(b.name));
    }
}