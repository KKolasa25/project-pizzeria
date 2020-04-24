/* global flatpickr */

import {utils} from '../utils.js';
import {select, settings} from '../settings.js';
import {BaseWidget} from './BaseWidget.js';


export class DatePicker extends BaseWidget {
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    thisWidget.initPlugin();
  }

  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date(thisWidget.value);
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);
    //console.log(thisWidget.maxDate);

    flatpickr(thisWidget.dom.input, { // ASK
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      locale: {
        firstDayOfWeek: 1,
      },
      disable: [
        function(date){
          return (date.getDay() === 1);
        }
      ],
      onChange: function(dateStr){ //onChange gets triggered when the user selects a date, or changes the time on a selected date
        thisWidget.value = dateStr;
      }
    });
  }

  parseValue(newValue){
    return newValue;

  }

  isValid(){
    return true;
  }

  renderValue(){
  }

}