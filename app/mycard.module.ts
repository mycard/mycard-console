import {NgModule}      from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import 'hammerjs';
import {AppsComponent}  from './apps.component';
import {MaterialModule} from '@angular/material';
import {MyCardComponent} from './mycard.component';
import {RoutingModule} from './routing.module';
import {FormsModule} from '@angular/forms';
import {AppService} from './app.service';
import {HttpModule} from '@angular/http';

import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';

// Observable operators
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';


@NgModule({
    imports: [
        BrowserModule, MaterialModule.forRoot(), FormsModule, RoutingModule, HttpModule,
    ],
    declarations: [AppsComponent, MyCardComponent],
    bootstrap: [MyCardComponent],
    providers: [AppService],
})
export class AppModule {
}