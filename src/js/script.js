/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
  // CODE ADDED END
  };

  // eslint-disable-next-line no-unused-vars
  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },

    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
    },
  // CODE ADDED END
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };

  class Product{
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

      app.cart.add(thisProduct);
    }
  }

  class AmountWidget{
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

  class Cart{
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();

      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      

      //console.log('New Cart: ', thisCart);
    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;

      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList =  thisCart.dom.wrapper.querySelector(select.cart.productList);

      thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];

      for(let key of thisCart.renderTotalsKeys){
        thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
      }

      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      //console.log(thisCart.dom.phone);
    
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function(){
        thisCart.remove(event.detail.cartProduct); // Odczytanie instancji thisCartProduct i przekazanie jej metodzie remove(cartProduct)
      });

      thisCart.dom.form.addEventListener('submit', function(){
        event.preventDefault();
        
        if (thisCart.products.length == ''){
          const orderText = 'Add one or more product';
          thisCart.dom.productList.classList.add('error');
          thisCart.dom.productList.innerHTML = orderText;
          return;
        } else {
          thisCart.dom.productList.classList.remove('error');
        }

        if (thisCart.dom.phone.value == ''){ 
          thisCart.dom.phone.classList.add('error');
          return;
        } else {
          thisCart.dom.phone.classList.remove('error');
        }

        if (thisCart.dom.address.value == ''){ 
          thisCart.dom.address.classList.add('error');
          return;
        } else {
          thisCart.dom.address.classList.remove('error');
        }
        thisCart.sendOrder();
      }); 
    }

    sendOrder(){
      const thisCart = this;
      
      const url = settings.db.url + '/' + settings.db.order;
      const payload = {
        address: thisCart.dom.address,
        totalPrice: thisCart.totalPrice,
        phone: thisCart.dom.phone,
        totalNumber: thisCart.totalNumber,
        subtotalPrice: thisCart.subtotalPrice,
        deliveryFee: thisCart.deliveryFee,
        products: [],
      };

      for (let product of thisCart.products){
        const singleProduct = product.getData();

        payload.products.push(singleProduct);
      }
      

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options)
        .then(function(response){
          return response.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse', parsedResponse);
        });
    }

    add(menuProduct){
      const thisCart = this;
      //console.log('Adding product', menuProduct);

      /* generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct); 
      //console.log(generatedHTML);

      /* create element using utils.createDOMFromHTML */
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      /* find cart container */ 
      const cartContainer = thisCart.dom.productList; 

      /* add element to cart */
      cartContainer.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      //console.log('thisCart.products: ', thisCart.products);

      thisCart.update();
    }

    update(){
      const thisCart = this;
      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for(let product of thisCart.products){
        thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
        thisCart.totalNumber = thisCart.totalNumber + product.amount;
      }

      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      console.log('totalNumber: ', thisCart.totalNumber);
      console.log('subtotalprice: ', thisCart.subtotalPrice);
      console.log('thisCart.totalPrice: ', thisCart.totalPrice);

      for(let key of thisCart.renderTotalsKeys){
        for(let elem of thisCart.dom[key]){
          elem.innerHTML = thisCart[key];
        }
      }
    }

    remove(cartProduct) {
      const thisCart = this;
      const index = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(index, 1); // 1 = liczba usuwanych elementów z tablicy licząc od pierwszego elementu
      cartProduct.dom.wrapper.remove(); // usuwanie elementu z DOMu
      thisCart.update();

    }
  }

  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();

      //console.log('new CartProduct', thisCartProduct);
    }
    

    getElements(element) {
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove =  thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){ // metoda tworząca instancje klasy AmountWidget i zapisywała ją we właściwosci produktu
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget); // nowa instancja

      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){ // nasłuchiwanie eventu "updated"
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.amount;
        
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: { // przekazujemy odwołanie do instancji dla której klikneliśmy "usuń"
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();

      });

      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }

    getData(){
      const thisCartProduct = this;
      
      return thisCartProduct.id,
      thisCartProduct.price,
      thisCartProduct.priceSingle,
      thisCartProduct.amount,
      thisCartProduct.params;
    }

  }

  const app = {
    initMenu: function(){
      const thisApp = this;
      //console.log('thisApp.data: ', thisApp.data);

      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },
  
    initData: function(){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('ParsedResponse', parsedResponse);

          /* save parsedResponse as thisApp.Data.products */
          thisApp.data.products = parsedResponse;

          /* execute initMenu method */
          thisApp.initMenu();
        });

      console.log('ThisApp.data', JSON.stringify(thisApp.data));
    },

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;
      //console.log('*** App starting ***');
      //console.log('thisApp:', thisApp);
      //console.log('classNames:', classNames);
      //console.log('settings:', settings);
      //console.log('templates:', templates);

      thisApp.initData();
      thisApp.initCart();
    },
  };

  app.init();
}
