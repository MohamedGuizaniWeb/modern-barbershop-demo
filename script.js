
const menuButton = document.querySelector(".menu-btn");
const nav = document.querySelector(".main-nav");
const langButton = document.querySelector(".lang-btn");
const form = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

const messages = {
  en: {
    sent: "Thanks! This demo request was sent successfully.",
    error: "Something went wrong. Please try again.",
    button: "Send request"
  },
  fr: {
    sent: "Merci ! Cette demande démo a été envoyée avec succès.",
    error: "Un problème est survenu. Veuillez réessayer.",
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

  if (formStatus) formStatus.textContent = "";
}

applyLanguage(language);

langButton?.addEventListener("click", () => {
  applyLanguage(language === "en" ? "fr" : "en");
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.checkValidity()){
    form.reportValidity();
    return;
  }

  form.reset();
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
