function showPage(page) {

  let pages = document.querySelectorAll(".page");
  pages.forEach(p => p.classList.remove("active"));

  document.getElementById(page).classList.add("active");
}
