import { Pipe, PipeTransform } from '@angular/core';
import { orderBy } from 'lodash';

/*
  EXAMPLES:

 *ngFor="let item of ([2,3,1] || ['b','a','c'] || [false, true, false] ...) | sortBy"
 *ngFor="let item of ([2,3,1] || ['b','a','c'] || [false, true, false] ...) | sortBy:[true|false]"

 *ngFor="let item of arrayOfObjects | sortBy:[true|false]:['propertyName']"
 *ngFor="let item of arrayOfObjects | sortBy:[true|false, true|false]:['propertyName', 'propertyName]"
*/

@Pipe({
  name: 'sortBy'
})
export class SortByPipe implements PipeTransform {

  transform(value: any[], orders: boolean[] = [], properties: string[] = []): any[] {
    if (!Array.isArray(value)) { return value; } // no array
    if (value.length <= 1) { return value; } // array with only one item
    if (!Array.isArray(orders) || !Array.isArray(properties)) { return value; } // no array

    value = JSON.parse(JSON.stringify(value)); // copy array
    let ordersReplaced = orders.map((order) => (order) ? "asc" : "desc"); // as default sort by asc

    if (!properties.length) { // sort array without objects by item
      return orderBy(value, [], [...ordersReplaced]);
    }

    if (orders.length && properties.length && orders.length === properties.length) { // sort array with objects by properties
      return orderBy(value, [...properties], [...ordersReplaced]);
    }
    
    return value;
  }

}
