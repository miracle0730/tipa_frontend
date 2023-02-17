import { Component, OnInit, Input } from '@angular/core';

// Models
import { CategoryModel, ImageModel } from '@models';

@Component({
  selector: 'app-grouped-product-card',
  templateUrl: './grouped-product-card.component.html',
  styleUrls: ['./grouped-product-card.component.scss']
})
export class GroupedProductCardComponent implements OnInit {
  @Input() category: CategoryModel;
  @Input() isProduct: boolean;

  public categoryLogo: ImageModel;

  constructor() { }

  ngOnInit(): void {
    this.getCategoryLogo();
  }

  getCategoryLogo() {
    if (!this.category) { return false; }

    if (this.isProduct) {
      this.categoryLogo = this.category.metadata.product_family_logo as ImageModel;
    } else {
      this.categoryLogo = this.category.metadata.application_type_logo as ImageModel;
    }
  }
}
