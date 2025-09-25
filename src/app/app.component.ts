import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
	selector: 'ic-root',
	imports: [RouterModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss',
	standalone: true,
})
export class AppComponent {}
