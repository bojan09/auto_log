import("./app.js").catch(() => {
  const mk = false;
  const app = document.querySelector("#app");
  app.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = mk
    ? "Локалното чување не е достапно"
    : "Local storage is unavailable";
  const text = document.createElement("p");
  text.textContent = mk
    ? "Дозволи чување податоци за оваа страница, затвори ги другите јазичиња на AutoLog и обиди се повторно. Постоечките записи не се избришани."
    : "Allow site storage, close other AutoLog tabs, and try again. Existing records have not been deleted.";
  app.setAttribute("role", "alert");
  app.append(title, text);
  document
    .querySelectorAll("nav button, #language")
    .forEach((button) => (button.disabled = true));
});
