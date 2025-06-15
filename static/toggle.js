const toggle = document.querySelector("#toggle_theme");
const icons = {
  "light": document.querySelector(".sun"),
  "auto": document.querySelector(".auto"),
  "dark": document.querySelector(".moon")
};

const selected = localStorage.getItem("colorscheme") || "auto";
icons[selected].style.display = "block";

toggle.addEventListener("click", function(e) {
  const current = localStorage.getItem("colorscheme") || "auto";
  let theme;
  switch(current) {
    case "auto": theme = "dark";  break;
    case "dark": theme = "light"; break;
    case "light": theme = "auto"; break;
  }

  localStorage.setItem("colorscheme", theme);
  icons[current].style.display = "none";
  icons[theme].style.display = "block";
  toggle_theme(theme);
});
