import {select} from '../settings.js';
import {settings, classNames, templates } from '../settings.js';
import {utils} from '../utils.js';
import {CartProduct} from './CartProduct.js';


export class Cart {
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