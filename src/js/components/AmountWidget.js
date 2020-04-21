import {select, settings} from '../settings.js';

export class AmountWidget{

  constructor(element){
    const thisWidget = this;
    thisWidget.getElements(element);
    thisWidget.value = settings.amountWidget.defaultValue;
    thisWidget.setValue(thisWidget.input.value);
    thisWidget.initActions();

    //console.log('AmountWidget: ', thisWidget);
    //console.log('Constructor arguments: ', element);
  }

  getElements(element){ // zapisanie we właściwościach wszystkich elementów DOM które są nam potrzebne
    const thisWidget = this;
    
    thisWidget.element = element;
    thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
    thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
  }

  setValue(value){ // ustawianie nowej wartości widgetu
    const thisWidget = this;

    const newValue = parseInt(value); // parseInt przetwarza argument w postaci łańcucha znaków i zwraca liczbę całkowitą typu integer (przy wpisaniu słowa wyświetli się NaN)

    /* TODO: Add validation */

    // jezeli nowa wartość jest inna niż wartośći domyślna a jednoczesnie nowa wartośćjest wieksza lub równa 1 i jednoczesnie nowa wartość jest mniejsza lub rowna 9 to:
    if (newValue != thisWidget.value && newValue >= settings.amountWidget.defaultMin && thisWidget.value && newValue <= settings.amountWidget.defaultMax ) {
      thisWidget.value = newValue; 
      thisWidget.announce(); // wywołanie metody 
    }

    thisWidget.input.value = thisWidget.value; // wyświetlana wartość
  }

  initActions(){
    const thisWidget = this;
    
    thisWidget.input.addEventListener('change', function(){
      thisWidget.setValue(thisWidget.input.value); // "change" jest uruchamiany dla elementu input gdy jest on zmieniany (zmiana wartości inputu)
    });

    thisWidget.linkDecrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });

    thisWidget.linkIncrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }

  announce(){ // metoda ktora tworzy instancje klasy Event. Jej zadaniem jest wywołanie eventu updated
    const thisWidget = this;

    const event = new CustomEvent ('updated', {
      bubbles: true
    }); 

    thisWidget.element.dispatchEvent(event); // wywołanie eventu na kontenerze naszego widgetu / Wywołuje zdarzenie w bieżącym elemencie
  }
}