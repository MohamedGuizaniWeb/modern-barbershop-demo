
const menuButton = document.querySelector(".menu-btn");
const nav = document.querySelector(".main-nav");
const langButton = document.querySelector(".lang-btn");
const form = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

// Leave blank to use same-origin /api endpoints.
// If you deploy the included booking backend as a separate Worker,
// paste its URL here, e.g. "https://aurel-booking-api.your-subdomain.workers.dev"
const BOOKING_API_BASE = "";

const bookingDateInput = document.getElementById("booking-date");
const bookingTimeInput = document.getElementById("booking-time");
const dateStrip = document.getElementById("date-strip");
const timeGrid = document.getElementById("time-grid");
const timeHelp = document.getElementById("time-help");
const bookingSummaryText = document.getElementById("booking-summary-text");
const availabilityPill = document.getElementById("availability-pill");
const appointmentTrigger = document.getElementById("appointment-trigger");
const appointmentMenu = document.getElementById("appointment-menu");
const appointmentSelectedTitle = document.getElementById("appointment-selected-title");
const appointmentSelectedSub = document.getElementById("appointment-selected-sub");

let selectedDate = "";
let selectedTime = "";
let availabilityMode = "checking";
const DEMO_BOOKING_KEY = "aurelDemoBookingsV2";

const customSelects = {
  service: {
    trigger: document.getElementById("service-trigger"),
    menu: document.getElementById("service-menu"),
    value: document.getElementById("service-value"),
    title: document.getElementById("service-selected-title"),
    sub: document.getElementById("service-selected-sub"),
    options: document.querySelectorAll('#service-menu .custom-option'),
    defaults: {
      en: {
        title: "Choose a service",
        sub: "Select the service the client wants to book"
      },
      fr: {
        title: "Choisir un service",
        sub: "Choisissez le service que le client veut réserver"
      }
    }
  },
  barber: {
    trigger: document.getElementById("barber-trigger"),
    menu: document.getElementById("barber-menu"),
    value: document.getElementById("barber-value"),
    title: document.getElementById("barber-selected-title"),
    sub: document.getElementById("barber-selected-sub"),
    options: document.querySelectorAll('#barber-menu .custom-option'),
    defaults: {
      en: {
        title: "Choose a barber",
        sub: "Select the barber the client prefers"
      },
      fr: {
        title: "Choisir un barbier",
        sub: "Choisissez le barbier préféré du client"
      }
    }
  }
};

function closeCustomMenus(exceptKey = null){
  Object.entries(customSelects).forEach(([key, field]) => {
    if (!field.trigger || !field.menu) return;
    if (key === exceptKey) return;
    field.menu.classList.remove("open");
    field.trigger.setAttribute("aria-expanded", "false");
  });
}

function updateCustomSelectionText(key){
  const field = customSelects[key];
  if (!field || !field.title || !field.sub) return;

  const selected = field.menu?.querySelector(".custom-option.selected");
  if (selected){
    field.title.textContent = language === "fr" ? selected.dataset.titleFr : selected.dataset.titleEn;
    field.sub.textContent = language === "fr" ? selected.dataset.subFr : selected.dataset.subEn;
  } else {
    field.title.textContent = field.defaults[language].title;
    field.sub.textContent = field.defaults[language].sub;
  }
}

function selectCustomOption(key, option){
  const field = customSelects[key];
  if (!field || !option) return;

  field.value.value = option.dataset.value || "";
  field.options.forEach(item => {
    item.classList.remove("selected");
    item.setAttribute("aria-selected", "false");
  });

  option.classList.add("selected");
  option.setAttribute("aria-selected", "true");
  updateCustomSelectionText(key);
  closeCustomMenus();

  if (key === "barber"){
    selectedTime = "";
    if (bookingTimeInput) bookingTimeInput.value = "";
    renderTimes();
    updateBookingSummary();
    updateAppointmentField();
    closeAppointmentMenu();
  }

  if (key === "service"){
    updateBookingSummary();
  }
}

Object.entries(customSelects).forEach(([key, field]) => {
  field.trigger?.addEventListener("click", () => {
    const willOpen = !field.menu.classList.contains("open");
    closeAppointmentMenu();
    closeCustomMenus(willOpen ? key : null);
    field.menu.classList.toggle("open", willOpen);
    field.trigger.setAttribute("aria-expanded", String(willOpen));
  });

  field.options.forEach(option => {
    option.addEventListener("click", () => selectCustomOption(key, option));
  });
});


const messages = {
  en: {
    sent: "Thanks! This demo request was sent successfully.",
    error: "Something went wrong. Please try again.",
    selectionError: "Please choose a service and a barber before sending the request.",
    dateTimeError: "Please choose an available date and time.",
    slotTaken: "That time was just booked. Please choose another available time.",
    liveAvailability: "Live availability",
    demoAvailability: "Demo availability",
    chooseBarberDate: "Choose a barber and date to see available times",
    noTimes: "No available times for this date.",
    loadingTimes: "Checking available times…",
    confirmed: "Appointment confirmed for",
    demoConfirmed: "Demo appointment reserved for",
    button: "Send request"
  },
  fr: {
    sent: "Merci ! Cette demande démo a été envoyée avec succès.",
    error: "Un problème est survenu. Veuillez réessayer.",
    selectionError: "Veuillez choisir un service et un barbier avant d’envoyer la demande.",
    dateTimeError: "Veuillez choisir une date et une heure disponibles.",
    slotTaken: "Cette heure vient d’être réservée. Veuillez choisir une autre heure disponible.",
    liveAvailability: "Disponibilité en direct",
    demoAvailability: "Disponibilité démo",
    chooseBarberDate: "Choisissez un barbier et une date pour voir les heures disponibles",
    noTimes: "Aucune heure disponible pour cette date.",
    loadingTimes: "Vérification des heures disponibles…",
    confirmed: "Rendez-vous confirmé pour",
    demoConfirmed: "Rendez-vous démo réservé pour",
    button: "Envoyer la demande"
  }
};

let language = (sessionStorage.getItem("aurelLang")
  || ((navigator.languages && navigator.languages[0]) || navigator.language || "en")
).toLowerCase().startsWith("fr") ? "fr" : "en";

menuButton?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".main-nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  });
});

function applyLanguage(nextLanguage){
  language = nextLanguage === "fr" ? "fr" : "en";
  document.documentElement.lang = language;
  sessionStorage.setItem("aurelLang", language);

  document.querySelectorAll("[data-en][data-fr]").forEach(el => {
    el.textContent = el.dataset[language];
  });

  const pageTitle = document.documentElement.getAttribute(`data-title-${language}`);
  if (pageTitle) document.title = pageTitle;

  if (langButton){
    langButton.textContent = language === "en" ? "FR" : "EN";
    langButton.setAttribute("aria-label", language === "en" ? "Passer au français" : "Switch to English");
  }

  Object.keys(customSelects).forEach(updateCustomSelectionText);
  renderDates();
  if (selectedDate) renderTimes();
  updateBookingSummary();
  updateAppointmentField();
  setAvailabilityMode(availabilityMode === "demo" ? "demo" : "live");

  if (formStatus) formStatus.textContent = "";
}


function closeAppointmentMenu(){
  if (!appointmentMenu || !appointmentTrigger) return;
  appointmentMenu.classList.remove("open");
  appointmentTrigger.setAttribute("aria-expanded","false");
}

appointmentTrigger?.addEventListener("click", () => {
  const willOpen = !appointmentMenu.classList.contains("open");
  closeCustomMenus();

  appointmentMenu.classList.toggle("open", willOpen);
  appointmentTrigger.setAttribute("aria-expanded", String(willOpen));

  if (willOpen){
    renderDates();
    renderTimes();
  }
});

function updateAppointmentField(){
  if (!appointmentSelectedTitle || !appointmentSelectedSub || !appointmentTrigger) return;

  const barber = customSelects.barber.value?.value || "";

  if (!selectedDate || !selectedTime){
    appointmentSelectedTitle.textContent =
      language === "fr" ? "Choisir une date et une heure" : "Choose a date & time";
    appointmentSelectedSub.textContent =
      language === "fr"
        ? "Choisissez un rendez-vous disponible après avoir sélectionné votre barbier"
        : "Select an available appointment after choosing your barber";
    appointmentTrigger.classList.remove("has-selection");
    return;
  }

  appointmentSelectedTitle.textContent =
    `${prettyDate(selectedDate)} • ${selectedTime}`;

  appointmentSelectedSub.textContent = barber
    ? (language === "fr" ? `Avec ${barber}` : `With ${barber}`)
    : (language === "fr" ? "Barbier à sélectionner" : "Barber not selected");

  appointmentTrigger.classList.add("has-selection");
}

function apiUrl(path){
  return `${BOOKING_API_BASE}${path}`;
}

function pad(n){
  return String(n).padStart(2, "0");
}

function localDateString(date){
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
}

function openDays(count = 14){
  const dates = [];
  const cursor = new Date();
  cursor.setHours(12,0,0,0);

  while (dates.length < count){
    const day = cursor.getDay();
    // Sunday = 0, Monday = 1. Shop is closed both days.
    if (day !== 0 && day !== 1){
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate()+1);
  }
  return dates;
}

function formatDateParts(date){
  const locale = language === "fr" ? "fr-CA" : "en-CA";
  return {
    day: new Intl.DateTimeFormat(locale,{weekday:"short"}).format(date),
    num: date.getDate(),
    month: new Intl.DateTimeFormat(locale,{month:"short"}).format(date)
  };
}

function prettyDate(dateString){
  if (!dateString) return "";
  const date = new Date(`${dateString}T12:00:00`);
  const locale = language === "fr" ? "fr-CA" : "en-CA";
  return new Intl.DateTimeFormat(locale,{
    weekday:"long",
    month:"long",
    day:"numeric"
  }).format(date);
}

function businessHoursFor(dateString){
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDay();

  // Tuesday–Friday: 10:00–18:00 hourly
  // Saturday: 09:00–16:00 hourly
  const start = day === 6 ? 9 : 10;
  const last = day === 6 ? 16 : 18;

  const times = [];
  for (let hour = start; hour <= last; hour++){
    times.push(`${pad(hour)}:00`);
  }
  return times;
}

function getDemoBookings(){
  try{
    return JSON.parse(localStorage.getItem(DEMO_BOOKING_KEY) || "[]");
  }catch{
    return [];
  }
}

function getDemoBookedTimes(barber,date){
  return getDemoBookings()
    .filter(item => item.barber === barber && item.date === date)
    .map(item => item.time);
}

function saveDemoBooking(reservation){
  const bookings = getDemoBookings();
  const exists = bookings.some(item =>
    item.barber === reservation.barber &&
    item.date === reservation.date &&
    item.time === reservation.time
  );
  if (exists) return false;

  bookings.push({
    barber: reservation.barber,
    date: reservation.date,
    time: reservation.time,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(DEMO_BOOKING_KEY, JSON.stringify(bookings));
  return true;
}

function setAvailabilityMode(mode){
  availabilityMode = mode;
  if (!availabilityPill) return;

  availabilityPill.classList.toggle("demo", mode === "demo");
  availabilityPill.textContent =
    mode === "demo" ? messages[language].demoAvailability : messages[language].liveAvailability;
}

async function fetchBookedTimes(barber,date){
  if (!barber || !date) return [];

  try{
    const response = await fetch(
      apiUrl(`/api/availability?barber=${encodeURIComponent(barber)}&date=${encodeURIComponent(date)}`),
      {cache:"no-store"}
    );

    const type = response.headers.get("content-type") || "";
    if (!response.ok || !type.includes("application/json")){
      throw new Error("Booking API not connected");
    }

    const data = await response.json();
    if (!Array.isArray(data.booked)) throw new Error("Invalid API response");

    setAvailabilityMode("live");
    return data.booked;
  }catch(error){
    setAvailabilityMode("demo");
    return getDemoBookedTimes(barber,date);
  }
}

function renderDates(){
  if (!dateStrip) return;
  dateStrip.innerHTML = "";

  openDays(14).forEach(date => {
    const value = localDateString(date);
    const parts = formatDateParts(date);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `date-card${selectedDate === value ? " selected" : ""}`;
    button.dataset.date = value;
    button.innerHTML = `
      <span class="day">${parts.day}</span>
      <strong class="num">${parts.num}</strong>
      <span class="month">${parts.month}</span>
    `;

    button.addEventListener("click", async () => {
      selectedDate = value;
      selectedTime = "";
      bookingDateInput.value = value;
      bookingTimeInput.value = "";
      renderDates();
      await renderTimes();
      updateBookingSummary();
      updateAppointmentField();
    });

    dateStrip.appendChild(button);
  });
}

async function renderTimes(){
  if (!timeGrid) return;

  const barber = customSelects.barber.value?.value || "";

  if (!barber || !selectedDate){
    timeGrid.innerHTML = `<p class="empty-times">${messages[language].chooseBarberDate}</p>`;
    if (timeHelp) timeHelp.textContent = messages[language].chooseBarberDate;
    return;
  }

  if (timeHelp) timeHelp.textContent = messages[language].loadingTimes;
  timeGrid.innerHTML = `<p class="empty-times">${messages[language].loadingTimes}</p>`;

  const booked = await fetchBookedTimes(barber,selectedDate);
  const times = businessHoursFor(selectedDate);
  const freeTimes = times.filter(time => !booked.includes(time));

  timeGrid.innerHTML = "";

  if (!freeTimes.length){
    timeGrid.innerHTML = `<p class="empty-times">${messages[language].noTimes}</p>`;
    if (timeHelp) timeHelp.textContent = messages[language].noTimes;
    return;
  }

  if (timeHelp){
    timeHelp.textContent = language === "fr"
      ? `${freeTimes.length} heures disponibles avec ${barber}`
      : `${freeTimes.length} available times with ${barber}`;
  }

  times.forEach(time => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `time-slot${selectedTime === time ? " selected" : ""}`;
    button.textContent = time;
    button.disabled = booked.includes(time);

    button.addEventListener("click", () => {
      selectedTime = time;
      bookingTimeInput.value = time;
      document.querySelectorAll(".time-slot").forEach(slot => slot.classList.remove("selected"));
      button.classList.add("selected");
      updateBookingSummary();
      updateAppointmentField();

      // Close after a complete appointment is selected,
      // matching the Service and Barber menu behavior.
      window.setTimeout(closeAppointmentMenu, 140);
    });

    timeGrid.appendChild(button);
  });
}

function updateBookingSummary(){
  if (!bookingSummaryText) return;

  const barber = customSelects.barber.value?.value || "";
  const service = customSelects.service.value?.value || "";

  if (!service || !barber || !selectedDate || !selectedTime){
    bookingSummaryText.textContent =
      language === "fr" ? "Aucune heure sélectionnée" : "No time selected yet";
    return;
  }

  bookingSummaryText.textContent =
    `${service} • ${barber} • ${prettyDate(selectedDate)} • ${selectedTime}`;
}

function resetBookingPicker(){
  selectedDate = "";
  selectedTime = "";
  if (bookingDateInput) bookingDateInput.value = "";
  if (bookingTimeInput) bookingTimeInput.value = "";
  renderDates();
  if (timeGrid){
    timeGrid.innerHTML = `<p class="empty-times">${messages[language].chooseBarberDate}</p>`;
  }
  updateBookingSummary();
  updateAppointmentField();
  closeAppointmentMenu();
}

async function createReservation(payload){
  try{
    const response = await fetch(apiUrl("/api/reservations"),{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Accept":"application/json"
      },
      body:JSON.stringify(payload)
    });

    const type = response.headers.get("content-type") || "";
    if (!type.includes("application/json")){
      throw new Error("Booking API not connected");
    }

    const data = await response.json();

    if (response.status === 409){
      return {ok:false, conflict:true, live:true};
    }

    if (!response.ok){
      throw new Error(data.error || "Reservation failed");
    }

    setAvailabilityMode("live");
    return {ok:true, live:true};
  }catch(error){
    const saved = saveDemoBooking(payload);
    setAvailabilityMode("demo");
    return saved
      ? {ok:true, live:false}
      : {ok:false, conflict:true, live:false};
  }
}


applyLanguage(language);

langButton?.addEventListener("click", () => {
  applyLanguage(language === "en" ? "fr" : "en");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".custom-select-field")) closeCustomMenus();
  if (!event.target.closest(".appointment-field")) closeAppointmentMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape"){
    closeCustomMenus();
    closeAppointmentMenu();
  }
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()){
    form.reportValidity();
    return;
  }

  const service = customSelects.service.value?.value || "";
  const barber = customSelects.barber.value?.value || "";

  if (!service || !barber){
    formStatus.className = "form-status error";
    formStatus.textContent = messages[language].selectionError;
    return;
  }

  if (!selectedDate || !selectedTime){
    formStatus.className = "form-status error";
    formStatus.textContent = messages[language].dateTimeError;
    return;
  }

  const data = new FormData(form);
  const reservation = {
    name: data.get("name"),
    phone: data.get("phone"),
    email: data.get("email"),
    service,
    barber,
    date: selectedDate,
    time: selectedTime,
    message: data.get("message") || ""
  };

  const result = await createReservation(reservation);

  if (!result.ok && result.conflict){
    formStatus.className = "form-status error";
    formStatus.textContent = messages[language].slotTaken;
    selectedTime = "";
    bookingTimeInput.value = "";
    await renderTimes();
    updateBookingSummary();
    return;
  }

  if (!result.ok){
    formStatus.className = "form-status error";
    formStatus.textContent = messages[language].error;
    return;
  }

  const confirmedLabel = result.live
    ? messages[language].confirmed
    : messages[language].demoConfirmed;

  formStatus.className = "form-status success";
  formStatus.textContent =
    `${confirmedLabel} ${prettyDate(selectedDate)} ${language === "fr" ? "à" : "at"} ${selectedTime}.`;

  form.reset();

  Object.values(customSelects).forEach(field => {
    if (field.value) field.value.value = "";
    field.options.forEach(item => {
      item.classList.remove("selected");
      item.setAttribute("aria-selected","false");
    });
  });

  Object.keys(customSelects).forEach(updateCustomSelectionText);
  resetBookingPicker();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting){
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();


renderDates();
resetBookingPicker();

updateAppointmentField();
