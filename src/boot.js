import("./app.js").catch(() => {
  const app = document.querySelector("#app");
  app.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = "Local storage is unavailable";
  const text = document.createElement("p");
  text.textContent =
    "Allow site storage, close other AutoLog tabs, and try again. Existing records have not been deleted.";
  app.setAttribute("role", "alert");
  app.append(title, text);
  document
    .querySelectorAll("nav button, #top-tools button, #top-tools summary")
    .forEach((control) => {
      control.disabled = true;
      control.setAttribute("aria-disabled", "true");
    });
});
