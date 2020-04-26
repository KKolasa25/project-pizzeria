import {templates, select, settings} from '../settings.js';
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


  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
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
    console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };
    
    console.log('getData urls', urls);

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
      console.log(eventBooking);
      thisBooking.makeBooked(eventBooking.date, eventBooking.hour, eventBooking.duration, eventBooking.table); //ok
    }

    for (let event of bookings) { //ok
      //console.log(eventBooking);
      thisBooking.makeBooked(event.date, event.hour, event.duration, event.table); //ok
      console.log(bookings);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let reapetEvent of eventsRepeat){ // iterujemy po tablicy eventsRepeat
      if(reapetEvent.repeat == 'daily'){ // sprawdzamy czy element w tablicy jest "daily"
        for (let dateDaily = minDate; dateDaily <= maxDate; dateDaily = utils.addDays(dateDaily, 1)){  
          thisBooking.makeBooked(utils.dateToStr(dateDaily), reapetEvent.hour, reapetEvent.duration, reapetEvent.table); 
          console.log(reapetEvent);
        }
      }
    }
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    thisBooking.booked[date] = {};
    //console.log(thisBooking.booked[date]);
    
    const bookedHour = utils.hourToNumber(hour); // bookedHour = 12.5

    thisBooking.bookedHour = [];
    //console.log(bookedHour);

    for (let blockHour = bookedHour; blockHour < bookedHour + duration; blockHour += 0.5) { 
    // blockHour = 12.5; pętla wykona iteracje od 12.5 + 4 (8 raz 30min), po 30min każda iteracja = 16:00. (12.5 13 13.5 14 14.5 15 15.5 16)

      thisBooking.booked[date][blockHour] = []; // tworzymy tablice z obkietu i tablicy bookedHour z wartościa 12.5 
      //console.log('thisBooking.booked[date][blockHour]: ', thisBooking.booked[date][blockHour]);
      thisBooking.booked[date][blockHour].push(table); // dodajemy na koniec tablicy po każdej iteracji argument table (numer stolika) + zwiększamy wartość o 0.5 do spełnienia warunku
    }
    //console.log(thisBooking.booked);
  }
}