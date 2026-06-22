const theme = localStorage.getItem("colorscheme") || "auto";
const colorscheme = document.querySelector("meta[name=color-scheme]");
colorscheme.content = theme;
