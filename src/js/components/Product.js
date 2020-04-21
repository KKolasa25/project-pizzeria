import {select, classNames, templates} from '../settings.js';
import {utils} from '../utils.js';
import {AmountWidget} from './AmountWidget.js';

export class Product {
  constructor (id, data){
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu(); // wywołanie metody
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget(); // wywołanie metody
    thisProduct.processOrder();
    //console.log('New Product: ', thisProduct);
  }
  renderInMenu(){ // deklaracja metody
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* create element using utils.createDOMFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    /* find menu container */ 
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;
  
    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    //console.log(select.menuProduct.clickable);

    //console.log('Szukane produkty:',  thisProduct.orderConfirmation);
  }

  initAccordion(){
    const thisProduct = this;

    /* find the clickable trigger (the element that should react to clicking) */
    // eslint-disable-next-line no-unused-vars
    const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable); // Elementy do klikania
    //console.log('clickableTrigger: ', clickableTrigger);

    /* START: add click event listener to trigger */
    thisProduct.accordionTrigger.addEventListener('click', function(){ 

      /* prevent default action for event */
      event.preventDefault(); 

      /* toggle active class on element of thisProduct */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive); // Nadawanie i odbieranie klasy "active" klikniętemu elementowi

      /* find all active products */
      const activeProducts = document.querySelectorAll(select.all.menuProductsActive); // Szukanie wszystkich aktywnych elementów

      /* START LOOP: for each active product */
      for (let activeProduct of activeProducts) { // Pętla iterująca po wszystkich aktywnych produktach

        /* START: if the active product isn't the element of thisProduct */
        if (activeProduct != thisProduct.element) { // Warunek - jeżeli aktywny produkt nie jest elementem kliknietego produktu to \/

          /* remove class active for the active product */
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive); // Usuń klase "active" z aktywnego produktu [NIEZROBIONE]

          /* END: if the active product isn't the element of thisProduct */
        }
      }
    });
  }

  initOrderForm(){
    const thisProduct = this;
    //console.log(thisProduct.initOrderForm);

    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });
    
    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    
    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }
  processOrder(){
    const thisProduct = this;
    //console.log(thisProduct);
  
    /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */
    const formData = utils.serializeFormToObject(thisProduct.form); // Pobranie danych z formularza i przypisanie do formData
    //console.log('formData ', formData);
  
    thisProduct.params = {};

    /* set variable price to equal thisProduct.data.price */
    let price = thisProduct.data.price; // Przypisanie wartości thisProduct.data.price do zmiennej price
    //console.log('Price: ', price);

    const params = thisProduct.data.params; // Przypisanie wartości thisProduct.data.params do zmiennej params
    //console.log('Params: ', params);
  
    /* START LOOP: for each paramId in thisProduct.data.params */
    for (let paramId in params){ // Pętla - szukamy paramId we wszystkich params (thisProduct.data.params)
      //console.log('ParamID: ', paramId);

      /* save the element in thisProduct.data.params with key paramId as const param */
      const param = params[paramId]; // Przypisanie wartości params[paramId] do zmiennej param
      //console.log('Param: ', param);
  
      /* START LOOP: for each optionId in param.options */
      for (let optionId in param.options){ // Pętla - szukamy optionId we wszystkich param.options

        /* save the element in param.options with key optionId as const option */
        const option = param.options[optionId]; // Przypisanie wartości param.options[optionId] do zmiennej option
        //console.log('OptionID is: ', option);

        const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1; // Czy "-1" odnosi się do tablicy?
        // W stałej optionSelected sprawdzamy czy istnieje formData[paramId], a jeśli tak, to czy ta tablica zawiera klucz równy wartości optionId

        /* START IF: if option is selected and option is not default */
        if (optionSelected && !option.default) { // Jeżeli optionSelected jest wybrany, a jednocześnie option.default nie jest domyślna to:

          /* add price of option to variable price */
          price = price + option.price;

        /* END IF: if option is selected and option is not default */
        }
        /* START ELSE IF: if option is not selected and option is default */
        else if (!optionSelected && option.default){ // Jeżeli optionSelected jest niewybrany, a jednocześnie option.default jest domyślna to:

          /* deduct price of option from price */
          price = price - option.price;

        /* END ELSE IF: if option is not selected and option is default */
        }
        /* END LOOP: for each optionId in param.options */

        /* find active images of selected options */ 
        const activeImages = thisProduct.imageWrapper.querySelectorAll('.' + paramId + '-' + optionId); //np .ingredients-olives jak wybierzemy checkboxa Olives w NONNA ALBA'S PIZZA

        if (optionSelected) { 
          if(!thisProduct.params[paramId]){ // Sprwdzamy czy półprodukt jest wybrany
            thisProduct.params[paramId] = { // jeżeli nie (i np. dopiero wybraliśmy) to przypisujemy do jego klucza label i option {} 
              label: param.label,
              options: {},
            };
          }
          thisProduct.params[paramId].options[optionId] = option.label; // Dodajemy do options zaznaczona opcje i nadajemy jej wartość labelu.
          for (let activeImage of activeImages) 
            activeImage.classList.add(classNames.menuProduct.imageVisible); // Nadajemy klase "active" obrazkowi wybranego składnika = staje się widoczny
        } 
        else {
          for (let activeImage of activeImages) 
            activeImage.classList.remove(classNames.menuProduct.imageVisible); // Usuwamy klase "active" obrazkowi składnika, który nie jest wybrany
            // lub usuwamy klase "active" obrazkowi składnika, którego odznaczymy (czyli nie jest wybrany).                                                        
        }
      }
    /* END LOOP: for each paramId in thisProduct.data.params */
    }
    /* set the contents of thisProduct.priceElem to be the value of variable price */

    /* multiply price by amount */
    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

    /* set the contents of thisProduct.priceElem to be the value of variable price */
    thisProduct.priceElem.innerHTML = thisProduct.price;
    //console.log('Skomplikowane: ', thisProduct.params);
  }

  initAmountWidget(){ // metoda tworząca instancje klasy AmountWidget i zapisywała ją we właściwosci produktu
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem); // nowa instancja

    thisProduct.amountWidgetElem.addEventListener('updated', function(){ // nasłuchiwanie eventu "updated"
      thisProduct.processOrder(); // wywołanie metody
    });
  }

  addToCart(){
    const thisProduct = this;

    thisProduct.name = thisProduct.data.name; 
    thisProduct.amount = thisProduct.amountWidget.value;

    const event = new CustomEvent('add-to-cart', {
      bubbles:true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
}