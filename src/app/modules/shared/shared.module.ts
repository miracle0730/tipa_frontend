import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {ReactiveFormsModule, FormsModule} from '@angular/forms';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {ModalModule} from 'ngx-bootstrap/modal';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {NgMultiSelectDropDownModule} from 'ng-multiselect-dropdown';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {TextareaAutosizeModule} from 'ngx-textarea-autosize';
import {TabsModule} from 'ngx-bootstrap/tabs';
import {QuillModule} from 'ngx-quill';
import {NgxGalleryModule} from '@kolkov/ngx-gallery';
import { PdfJsViewerModule } from 'ng2-pdfjs-viewer'; 
import {
  HeaderComponent,
  SideNavigationComponent,
  EditImagesComponent,
  PreviewImagesComponent,
  ProductNavigationComponent,
  ProductCardComponent,
  GroupedProductCardComponent,
  CertificateCardComponent,
  StageColorPickerComponent,
  TextEditorComponent,
  GalleryComponent,
  PdfViewerComponent,
} from './components';
import {
  DeleteProductComponent,
  AddApplicationComponent,
  AddProductComponent,
  ModalPdfViewerComponent,
  CertificateFilesComponent,
  ModalCertificateGraphicsComponent,
} from './modals';
import {
  HideSideMenuDirective,
  IsAdminDirective,
  DisableSelectDirective,
  GetCompareNumberDirective
} from './directives';

import {
  GetProductPipe,
  GetPacketGoodsPipe,
  GetSubSegmentPipe,
  DisplayCategoryByIdPipe,
  TextareaBulletsPipe,
  SortByPipe,
} from './pipes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    TextareaAutosizeModule,
    ModalModule.forRoot(),
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    TooltipModule.forRoot(),
    TabsModule.forRoot(),
    NgMultiSelectDropDownModule.forRoot(),
    QuillModule.forRoot(),
    NgxGalleryModule,
    PdfJsViewerModule,
    DragDropModule,
  ],
  declarations: [
    HeaderComponent,
    SideNavigationComponent,
    EditImagesComponent,
    PreviewImagesComponent,
    ProductNavigationComponent,
    ProductCardComponent,
    GroupedProductCardComponent,
    CertificateCardComponent,
    StageColorPickerComponent,
    TextEditorComponent,
    AddApplicationComponent,
    AddProductComponent,
    GalleryComponent,
    ModalPdfViewerComponent,
    CertificateFilesComponent,
    ModalCertificateGraphicsComponent,
    PdfViewerComponent,
    IsAdminDirective,
    HideSideMenuDirective,
    DisableSelectDirective,
    GetCompareNumberDirective,
    GetProductPipe,
    GetPacketGoodsPipe,
    GetSubSegmentPipe,
    DisplayCategoryByIdPipe,
    TextareaBulletsPipe,
    SortByPipe
  ],
  exports: [
    // Modules
    ReactiveFormsModule,
    FormsModule,
    NgMultiSelectDropDownModule,
    QuillModule,
    NgxGalleryModule,
    PdfJsViewerModule,
    DragDropModule,
    TabsModule,
    // Component
    HeaderComponent,
    EditImagesComponent,
    PreviewImagesComponent,
    SideNavigationComponent,
    ProductNavigationComponent,
    ProductCardComponent,
    GroupedProductCardComponent,
    CertificateCardComponent,
    StageColorPickerComponent,
    TextEditorComponent,
    GalleryComponent,
    PdfViewerComponent,
    // Directives
    IsAdminDirective,
    HideSideMenuDirective,
    // Pipes
    GetProductPipe,
    GetPacketGoodsPipe,
    GetSubSegmentPipe,
    DisplayCategoryByIdPipe,
    TextareaBulletsPipe,
    SortByPipe,
  ],
  entryComponents: [
    DeleteProductComponent,
    AddApplicationComponent,
    AddProductComponent,
    ModalPdfViewerComponent,
    CertificateFilesComponent,
    ModalCertificateGraphicsComponent,
  ],
})
export class SharedModule {
}
