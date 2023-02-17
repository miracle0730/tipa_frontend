import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ProductModel, CategoryModel, ProductsFilterModel, GetProductsParamsModel } from 'src/app/models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private url = environment.url;
  private productsFilterKey: string = 'productsFilter';
  constructor(private http: HttpClient) {}

  /**
   * Gets products
   */
  getProducts(dataParams?: GetProductsParamsModel) {
    let params = new HttpParams();

    if (dataParams) {
      if (dataParams.hasOwnProperty('rfq_page')) {
        params = params.append('rfq_page', `${dataParams.rfq_page}`);
      }
    }

    return this.http.get<ProductModel[]>(this.url + '/api/v1/product', {params});
  }

  /**
   * Gets product by id
   * @param productId product Id
   * @returns product information
   */
  getProductById(productId: number) {
    return this.http.get(`${this.url}/api/v1/product/${productId}`);
  }

  /**
   * Adds product
   * @param body product info body
   * @returns new product response
   */
  addProduct(body) {
    return this.http.post(this.url + '/api/v1/product', body);
  }

  /**
   * Updates product
   * @param productId product id
   * @param body updated product information
   * @returns updated response for product
   */
  updateProduct(productId: number, body) {
    return this.http.put(`${this.url}/api/v1/product/${productId}`, body);
  }

  /**
   * Deletes product
   * @param productId product id
   * @returns text response if product is deleted
   */
  deleteProduct(productId: number) {
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return this.http.delete(`${this.url}/api/v1/product/${productId}`, {
      headers,
      responseType: 'text',
    });
  }

  setProductsFilter(productsFilter: ProductsFilterModel) {
    localStorage.setItem(this.productsFilterKey, JSON.stringify(productsFilter));
  }

  getProductsFilter(): ProductsFilterModel {
    return JSON.parse(localStorage.getItem(this.productsFilterKey));
  }
}
