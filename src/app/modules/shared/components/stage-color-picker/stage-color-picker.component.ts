import {Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {AppConstants} from '@core/app.constants';

// Models
import {StageItem, StageItemIdsModel} from '@models';

// Libraries
import * as _ from 'lodash';

@Component({
  selector: 'app-stage-color-picker',
  templateUrl: './stage-color-picker.component.html',
  styleUrls: ['./stage-color-picker.component.scss']
})
export class StageColorPickerComponent implements OnInit, OnChanges {
  @Input() stage: number;
  @Input() generalStage: number;
  @Input() disabled: boolean;
  @Output() changeStage = new EventEmitter<number>();

  public stageItemList: StageItem[] = _.cloneDeep(AppConstants.StageItemList);
  public availableStageItemList: StageItem[] = _.cloneDeep(AppConstants.StageItemList);
  public stageItemIds: StageItemIdsModel = _.cloneDeep(AppConstants.StageItemIds);
  public selectedItem: StageItem;
  public generalStageItem: StageItem;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {

      if (changes.stage) {
        // Get available list and preselect default item
        this.getAvailableStageItemList();
        const newId: number = changes.stage.currentValue;
        let foundEl: StageItem = this.availableStageItemList.find((item) => item?.id === newId);
        foundEl = (foundEl) ? foundEl : ((this.availableStageItemList.length) ? this.availableStageItemList[0] : null);

        this.onClickItem(foundEl);
      }

      if (changes.generalStage) {
        this.generalStage = changes.generalStage.currentValue;
        this.generalStageItem = this.stageItemList.find(item => (item?.id === this.generalStage));

        this.getAvailableStageItemList();
        this.checkSelectedItem();
      }
    }
  }

  ngOnInit(): void {
  }

  getAvailableStageItemList() {
    if (!this.generalStageItem) {
      return false;
    }

    // The available list should be >= than general stage
    this.availableStageItemList = _.cloneDeep(this.stageItemList).filter(item => item?.level >= this.generalStageItem?.level);
  }

  checkSelectedItem() {
    if (!this.generalStageItem || !this.selectedItem) {
      return false;
    }

    // The (selected item stage) cannot be larger than (general item stage)
    if (this.generalStageItem?.level !== this.selectedItem?.level) {
      this.onClickItem(this.generalStageItem);
    }
  }

  onClickItem(item: StageItem) {
    if (!item) {
      return false;
    }

    this.selectedItem = item;
    this.onChangeStage(this.selectedItem);
  }

  onChangeStage(item: StageItem) {
    this.stage = item.id;
    this.changeStage.emit(this.stage);
  }
}
