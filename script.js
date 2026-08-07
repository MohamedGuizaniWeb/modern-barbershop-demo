
const menuButton = document.querySelector(".menu-btn");
const nav = document.querySelector(".main-nav");
const langButton = document.querySelector(".lang-btn");
const form = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

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
}

Object.entries(customSelects).forEach(([key, field]) => {
  field.trigger?.addEventListener("click", () => {
    const willOpen = !field.menu.classList.contains("open");
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
    button: "Send request"
  },
  fr: {
    sent: "Merci ! Cette demande démo a été envoyée avec succès.",
    error: "Un problème est survenu. Veuillez réessayer.",
    selectionError: "Veuillez choisir un service et un barbier avant d’envoyer la demande.",
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

  if (formStatus) formStatus.textContent = "";
}

applyLanguage(language);

langButton?.addEventListener("click", () => {
  applyLanguage(language === "en" ? "fr" : "en");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".custom-select-field")) closeCustomMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCustomMenus();
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()){
    form.reportValidity();
    return;
  }

  if (!customSelects.service.value?.value || !customSelects.barber.value?.value){
    formStatus.className = "form-status error";
    formStatus.textContent = messages[language].selectionError;
    return;
  }

  form.reset();

  Object.values(customSelects).forEach(field => {
    if (field.value) field.value.value = "";
    field.options.forEach(item => {
      item.classList.remove("selected");
      item.setAttribute("aria-selected", "false");
    });
  });

  Object.keys(customSelects).forEach(updateCustomSelectionText);

  formStatus.className = "form-status success";
  formStatus.textContent = messages[language].sent;
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
