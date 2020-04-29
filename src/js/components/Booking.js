import {templates, select, settings, classNames} from '../settings.js';
import {AmountWidget} from './AmountWidget.js';
import {DatePicker} from './DatePicker.js';
import {HourPicker} from './HourPicker.js';
import {utils} from '../utils.js';

export class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starter);
  }

  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated',function() {
      thisBooking.updateDOM();
    });

    thisBooking.dom.wrapper.addEventListener('submit', function(){
      event.preventDefault();
      thisBooking.sendBooking();
      alert('Reservation done');
    });
  }

  getData(){
    const thisBooking = this;

    const startEndDates = {};
    startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate);
    startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);

    const endDate = {};
    endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];

    const params = {
      // utils.queryParams - Funkcja ta zamienia pary klucz-wartość z obiektu w ciąg znaków analogiczny do parametrów w przykładowych adresach powyżej
      booking: utils.queryParams(startEndDates),
      eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
      eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
    };
    //console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };
    
    //console.log('getData urls', urls);

    Promise.all([ // Promise.all działa podobnie jak fetch, ale funkcja podłączona do niej za pomocą .then wykona się dopiero, kiedy wszystkie zapytania będą wykonane.
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]){
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        // Dzięki metodzie Promise.all obie funkcje ".then" otrzymują jeden argument, który jest tablica.
      });
  }

  // eslint-disable-next-line no-unused-vars
  parseData(bookings, eventsCurrent, eventsRepeat){ // ok
    const thisBooking = this; // ok
    thisBooking.booked = {}; // ok

    for (let eventBooking of eventsCurrent) { //ok
      //console.log(eventBooking);
      thisBooking.makeBooked(eventBooking.date, eventBooking.hour, eventBooking.duration, eventBooking.table); //ok
    }

    for (let event of bookings) { //ok
      //console.log(eventBooking);
      thisBooking.makeBooked(event.date, event.hour, event.duration, event.table); //ok
      //console.log(bookings);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let reapetEvent of eventsRepeat){ // iterujemy po tablicy eventsRepeat
      if(reapetEvent.repeat == 'daily'){ // sprawdzamy czy element w tablicy jest "daily"
        for (let dateDaily = minDate; dateDaily <= maxDate; dateDaily = utils.addDays(dateDaily, 1)){  
          thisBooking.makeBooked(utils.dateToStr(dateDaily), reapetEvent.hour, reapetEvent.duration, reapetEvent.table); 
          //console.log(reapetEvent);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    //console.log(thisBooking.booked[date]); undefined!

    if (typeof (thisBooking.booked[date]) == 'undefined'){ // jeżeli wartość podanego argumentu (data w obiekcie thisBooking.booked) bedzdzie undefined 
      thisBooking.booked[date] = {}; // to stwórz nowy obikiet thisBooking.booked[date]
    }
    const bookedHour = utils.hourToNumber(hour); // bookedHour = 12.5 pierwsza rezerwacja
    //console.log(hour);

    for (let blockHour = bookedHour; blockHour < bookedHour + duration; blockHour += 0.5) { 
    // blockHour = 12.5; pętla wykona iteracje od 12.5 + 4 (8 raz 30min), po 30min każda iteracja = 16:00. (12.5 13 13.5 14 14.5 15 15.5 16)
      if (typeof thisBooking.booked[date][blockHour] == 'undefined'){ // jeżeli wartość argumentu obkietu thisBooking.booked[date][blockHour] będzie undefined 
        thisBooking.booked[date][blockHour] = []; // to tworzymy tablice z obkietu i bookedHour z wartościa początkową 12.5 
      }
      thisBooking.booked[date][blockHour].push(table); // dodajemy na koniec tablicy po każdej iteracji argument table (numer stolika) + zwiększamy wartość o 0.5 do spełnienia warunku
      // i wtedy stolik kończy swoją rezerwacje
    }
  }

  updateDOM(){
    const thisBooking = this;
    //console.log('updateDOM');

    let pickDate = thisBooking.datePicker.value;

    if (typeof pickDate == 'object'){ // sprawdzmy czy pickDate to object, jeżeli jest to zwracamy pickDate jako elementem z indexem 0 (pierwszy element) zamieniony na tekst
      pickDate = utils.dateToStr(pickDate[0]);
    }

    thisBooking.date = pickDate;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    
    // console.log(thisBooking.date); 
    // console.log('Godzina:', thisBooking.hour);

    for(let table of thisBooking.dom.tables){ // iteracje po elementmach '.floor-plan .table'
      let numberTable = table.getAttribute(settings.booking.tableIdAttribute); // pobranie numerów stolików 

      numberTable = parseInt(numberTable); // parseInt konwertuje przekazany argument (tutaj tekst) na liczbę
      //console.log(numberTable);
 
    
      if (typeof thisBooking.booked[thisBooking.date] != 'undefined' && // typeof zwraca informacje o typie argumentu (w tym przypadku jest tablica, a nie undefined)
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] != 'undefined' && // znalezione na: https://thisinterestsme.com/check-element-exists-javascript/
      thisBooking.booked[thisBooking.date][thisBooking.hour].includes(numberTable)){// metoda includes() ustala czy dana tablica posiada szukany element, zwracając true lub false
        table.classList.add(classNames.booking.tableBooked); // nadajemy klase 'booked'
      } else {
        table.classList.remove(classNames.booking.tableBooked); // usuwamy klase 'booked'
      }
      //console.log(thisBooking.booked[thisBooking.date]);
      //console.log(thisBooking.booked[thisBooking.date][thisBooking.hour]);

      table.addEventListener('click', function(event){
        event.preventDefault(event);
        table.classList.contains(classNames.booking.tableBooked);
        let selectedTable = table.classList.contains(classNames.booking.tableBooked);
  
        if(!selectedTable) {
          table.classList.toggle(classNames.booking.tableBooked);
          thisBooking.choosenTable = numberTable; 
        } else {
          // INFORMACJA NA STRONIE //
          console.log('Table is booked! Choose another table, please');
        }
      });
    }
  }

  sendBooking(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;

    const bookingPayload = {
      date: thisBooking.date,
      hour: utils.numberToHour(thisBooking.hour), //jak wstawiałem hour: thisBooking.hoursAmount.value, wyrzucało mi błąd, że funkcja hour.split(':'); w utils.js nie jest funkcja
      table: thisBooking.choosenTable, 
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
      starters: [],
    };

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked == true) {
        const starterValue = starter.value;
        bookingPayload.starters.push(starterValue);
        //console.log(starterValue);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingPayload),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      })
      .then(function(parsedResponse){
        console.log('parsedResponse', parsedResponse);
      });
  }
}