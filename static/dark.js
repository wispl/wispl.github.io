const theme = localStorage.getItem("colorscheme") || "auto";

const styleLight = document.querySelector("link[rel=stylesheet][media*=prefers-color-scheme][media*=light]");
const styleDark = document.querySelector("link[rel=stylesheet][media*=prefers-color-scheme][media*=dark]");

function toggle_theme(theme) {
  let lightMedia;
  let darkMedia;

  if (theme === "auto") {
    lightMedia = "(prefers-color-scheme: light)";
    darkMedia = "(prefers-color-scheme: dark)";
  } else {
    lightMedia = (theme === "light") ? "all" : "not all";
    darkMedia = (theme === "dark") ? "all" : "not all";
  }

  styleLight.media = lightMedia;
  styleDark.media = darkMedia;
}

toggle_theme(theme)
