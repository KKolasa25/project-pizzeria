import {settings, select} from '../settings.js';
import {BaseWidget} from './BaseWidget.js';

export class AmountWidget extends BaseWidget {
  constructor(wrapper){
    //thisWidget.getElements(element);
    super(wrapper, settings.amountWidget.defaultValue);
    const thisWidget = this;

    //thisWidget.value = settings.amountWidget.defaultValue;
    //thisWidget.setValue(thisWidget.input.value);
    thisWidget.getElements();
    thisWidget.initActions();

    //console.log('AmountWidget: ', thisWidget);
    //console.log('Constructor arguments: ', element);
  }

  getElements(){ // zapisanie we właściwościach wszystkich elementów DOM które są nam potrzebne
    const thisWidget = this;
    
    //thisWidget.dom = element;
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
    thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
  }

  isValid(newValue){
    return !isNaN(newValue) && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax;
  }

  initActions(){
    const thisWidget = this;
    
    thisWidget.dom.input.addEventListener('change', function(){
      thisWidget.value = thisWidget.dom.input.value; // "change" jest uruchamiany dla elementu input gdy jest on zmieniany (zmiana wartości inputu)
    });

    thisWidget.dom.linkDecrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.value = --thisWidget.dom.input.value;
    });

    thisWidget.dom.linkIncrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.value = ++thisWidget.dom.input.value;
    });
  }

  renderValue(){
    const thisWidget = this;

    thisWidget.dom.input.value = thisWidget.value;
  }
}