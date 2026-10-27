import { visualAsset } from "./visuals.js";
const el = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const fieldNames = {
  make: "Make",
  model: "Model",
  year: "Year",
  odometer: "Odometer",
  unit: "Distance unit",
  fuel: "Fuel type",
  currency: "Currency",
  variant: "Engine & drivetrain",
  bodyStyle: "Body style",
  photo: "Vehicle photo",
  nickname: "Nickname",
  plate: "License plate",
  color: "Color",
  notes: "Notes",
  purchaseDate: "Purchase date",
  purchasePrice: "Purchase price",
};
export function setupVehicleEditor({ form, dialog }) {
  const title = document.getElementById("form-title"),
    error = document.getElementById("error"),
    custom = document.getElementById("custom"),
    cancel = document.getElementById("cancel"),
    save = form.querySelector("[type=submit]");
  const controls = Object.fromEntries(
    [...form.elements].filter((i) => i.name).map((i) => [i.name, i]),
  );
  const labels = Object.fromEntries(
    Object.entries(controls)
      .filter(([, i]) => i.closest("label"))
      .map(([key, i]) => [key, i.closest("label")]),
  );
  for (const [key, label] of Object.entries(labels)) {
    if (fieldNames[key]) label.firstChild.textContent = fieldNames[key];
    label.classList.add("vehicle-field");
    label.dataset.field = key;
  }
  const header = el("div", undefined, "vehicle-editor-header"),
    heading = el("div", undefined, "vehicle-editor-heading"),
    intro = el(
      "p",
      "Start with the essentials. Add the extras whenever you like.",
      "vehicle-editor-intro",
    ),
    close = el("button", "×", "editor-close");
  close.type = "button";
  close.setAttribute("aria-label", "Close vehicle form");
  close.onclick = () => dialog.close();
  intro.id = "vehicle-editor-intro";
  heading.append(el("p", "YOUR GARAGE", "eyebrow"), title, intro);
  header.append(heading, close);
  const progress = el("ol", undefined, "vehicle-progress");
  progress.setAttribute("aria-label", "Vehicle entry progress");
  const stepButtons = [];
  ["Vehicle", "Usage", "Review"].forEach((name, index) => {
    const item = el("li"),
      b = el("button");
    b.type = "button";
    b.setAttribute("aria-label", name);
    const number = el(
      "span",
      String(index + 1).padStart(2, "0"),
      "step-number",
    );
    number.setAttribute("aria-hidden", "true");
    b.append(number, el("span", name));
    b.onclick = () => {
      if (index > step && !validateStep(step)) return;
      setStep(index);
    };
    item.append(b);
    progress.append(item);
    stepButtons.push(b);
  });
  header.append(progress);
  const body = el("div", undefined, "vehicle-editor-body"),
    panels = el("div", undefined, "vehicle-panels"),
    steps = ["The essentials", "How you use it", "Ready for the road?"].map(
      (text, index) => {
        const panel = el("section", undefined, "vehicle-step");
        panel.dataset.step = index;
        const h = el("h3", text);
        h.tabIndex = -1;
        panel.append(h);
        panels.append(panel);
        return panel;
      },
    );
  steps[0].append(
    el(
      "p",
      "A make, a model and a year. That’s all we need to get started.",
      "section-description",
    ),
  );
  const identity = el("div", undefined, "vehicle-fields");
  for (const key of ["make", "model", "year"]) identity.append(labels[key]);
  steps[0].append(identity, custom);
  controls.make.placeholder = "e.g. Fiat";
  controls.model.placeholder = "e.g. Sedici";
  controls.year.placeholder = "e.g. 2010";
  controls.odometer.placeholder = "Current reading";
  steps[1].append(
    el(
      "p",
      "Start from your current reading. We’ll keep its history from here.",
      "section-description",
    ),
  );
  const usage = el("div", undefined, "vehicle-fields usage-fields");
  for (const key of ["odometer", "unit", "fuel", "currency"])
    usage.append(labels[key]);
  steps[1].append(usage);
  function optional(title, description, keys) {
    const d = el("details", undefined, "vehicle-optional"),
      s = el("summary");
    s.append(el("strong", title), el("span", description));
    const fields = el("div", undefined, "vehicle-fields");
    for (const key of keys) fields.append(labels[key]);
    d.append(s, fields);
    steps[1].append(d);
    return d;
  }
  const appearance = optional(
    "Photo & identity",
    "Photo, engine, nickname and more",
    [
      "photo",
      "variant",
      "bodyStyle",
      "nickname",
      "plate",
      "color",
      "removePhoto",
    ],
  );
  optional("Purchase details", "Date and purchase price", [
    "purchaseDate",
    "purchasePrice",
  ]);
  optional("A note for later", "Anything you want to remember", ["notes"]);
  const file = controls.photo;
  file.setAttribute("aria-label", "Vehicle photo");
  labels.photo.classList.add("vehicle-photo-picker");
  const photoPrompt = el("span", "Add a vehicle photo", "photo-prompt"),
    photoHint = el("span", "PNG, JPEG or WebP · up to 5 MB", "photo-hint"),
    photoError = el("p", undefined, "photo-error");
  photoError.setAttribute("role", "alert");
  labels.photo.append(photoPrompt, photoHint);
  labels.photo.insertAdjacentElement("afterend", photoError);
  const review = el("div", undefined, "vehicle-review");
  steps[2].append(
    el(
      "p",
      "Check the details below. Nothing is saved until you confirm.",
      "section-description",
    ),
    review,
  );
  const preview = el("div", undefined, "vehicle-entry-preview"),
    image = el("img"),
    previewName = el("h3", "Your vehicle"),
    previewYear = el("p", "Add your details to see them here.", "muted"),
    previewCaption = el("p", "Body-style illustration", "preview-caption");
  image.alt = "Vehicle body-style illustration";
  preview.append(
    el("p", "A PLACE IN YOUR GARAGE", "eyebrow"),
    image,
    previewName,
    previewYear,
    previewCaption,
    el("p", "Your records stay private, on this device.", "preview-privacy"),
  );
  body.append(panels, preview);
  const footer = el("footer", undefined, "vehicle-editor-footer"),
    secondary = el("div", undefined, "editor-secondary-actions"),
    back = el("button", "Back");
  back.type = "button";
  back.dataset.tone = "quiet";
  back.onclick = () => setStep(step - 1);
  secondary.append(cancel, back);
  footer.append(secondary, save);
  save.dataset.tone = "primary";
  const datalists = [...form.querySelectorAll("datalist")];
  form.replaceChildren(controls.id, ...datalists, header, body, error, footer);
  form.noValidate = true;
  dialog.classList.add("vehicle-editor");
  dialog.setAttribute("aria-labelledby", "form-title");
  dialog.setAttribute("aria-describedby", intro.id);
  let step = 0,
    visited = 0,
    editing = false,
    current = {},
    photoUrl = "",
    photoVersion = 0;
  function focus() {
    steps[step].querySelector("h3").focus();
    body.scrollTop = 0;
  }
  function syncPreview() {
    const values = Object.fromEntries(new FormData(form));
    image.src =
      photoUrl ||
      (controls.removePhoto.checked ? "" : current.photo) ||
      visualAsset({ ...values, photo: "" });
    previewName.textContent =
      [values.make, values.model].filter(Boolean).join(" ") || "Your vehicle";
    previewYear.textContent = values.year
      ? values.year +
        " · " +
        (controls.fuel.selectedOptions[0]?.textContent || "Other")
      : "Add your details to see them here.";
    previewCaption.textContent =
      photoUrl || (current.photo && !controls.removePhoto.checked)
        ? "Your vehicle photo"
        : "Body-style illustration";
  }
  function showReview() {
    review.replaceChildren();
    const data = new FormData(form);
    const list = el("dl");
    for (const [label, value] of [
      [
        "Vehicle",
        [data.get("make"), data.get("model")].filter(Boolean).join(" "),
      ],
      ["Year", data.get("year")],
      [
        "Odometer",
        new Intl.NumberFormat("en").format(Number(data.get("odometer"))) +
          " " +
          data.get("unit"),
      ],
      ["Fuel", controls.fuel.selectedOptions[0]?.textContent],
      ["Currency", data.get("currency")],
      ["Nickname", data.get("nickname")],
      ["License plate", data.get("plate")],
      ["Engine & drivetrain", data.get("variant")],
      ["Purchase date", data.get("purchaseDate")],
      [
        "Purchase price",
        data.get("purchasePrice")
          ? data.get("purchasePrice") + " " + data.get("currency")
          : "",
      ],
      ["Notes", data.get("notes")],
    ]) {
      if (!value) continue;
      const row = el("div");
      row.append(el("dt", label), el("dd", value));
      list.append(row);
    }
    review.append(list);
    const edit = el("button", "Change details");
    edit.type = "button";
    edit.dataset.tone = "quiet";
    edit.onclick = () => setStep(0);
    review.append(edit);
  }
  function setStep(index, moveFocus = true) {
    step = Math.max(0, Math.min(2, index));
    body.dataset.step = String(step);
    visited = Math.max(visited, step);
    steps.forEach((panel, i) => (panel.hidden = i !== step));
    stepButtons.forEach((b, i) => {
      b.setAttribute("aria-current", i === step ? "step" : "false");
      b.disabled = !editing && i > visited;
      b.classList.toggle("is-complete", i < step);
    });
    back.hidden = step === 0;
    save.textContent =
      step === 0
        ? "Continue"
        : step === 1
          ? "Review vehicle"
          : editing
            ? "Save changes"
            : "Save vehicle";
    error.textContent = "";
    if (step === 2) showReview();
    syncPreview();
    if (moveFocus) focus();
  }
  function reveal(input) {
    const panel = input.closest(".vehicle-step");
    if (panel) setStep(Number(panel.dataset.step), false);
    for (
      let parent = input.parentElement;
      parent && parent !== form;
      parent = parent.parentElement
    )
      if (parent.tagName === "DETAILS") parent.open = true;
    input.setAttribute("aria-invalid", "true");
    input.focus();
    input.reportValidity();
  }
  function validateStep(index) {
    const invalid = [
      ...steps[index].querySelectorAll("input,select,textarea"),
    ].find((input) => input.willValidate && !input.checkValidity());
    if (invalid) {
      reveal(invalid);
      return false;
    }
    return true;
  }
  form.addEventListener(
    "submit",
    (event) => {
      if (step < 2) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (validateStep(step)) setStep(step + 1);
        return;
      }
      for (const index of [0, 1])
        if (!validateStep(index)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
    },
    true,
  );
  form.addEventListener("input", (event) => {
    if (event.target.validity?.valid)
      event.target.removeAttribute("aria-invalid");
    syncPreview();
  });
  controls.removePhoto.addEventListener("change", syncPreview);
  file.addEventListener("change", async () => {
    const token = ++photoVersion;
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      photoUrl = "";
    }
    file.setCustomValidity("");
    photoError.textContent = "";
    photoPrompt.textContent = "Add a vehicle photo";
    const picked = file.files[0];
    if (!picked) {
      syncPreview();
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(picked.type) ||
      picked.size > 5000000
    ) {
      file.setCustomValidity("Choose a JPEG, PNG or WebP image under 5 MB.");
      photoError.textContent = file.validationMessage;
      return;
    }
    const url = URL.createObjectURL(picked);
    file.setCustomValidity("Please wait for the photo to load.");
    try {
      const check = new Image();
      check.src = url;
      await check.decode();
      if (token !== photoVersion) {
        URL.revokeObjectURL(url);
        return;
      }
      photoUrl = url;
      file.setCustomValidity("");
      photoPrompt.textContent = picked.name;
      syncPreview();
    } catch {
      URL.revokeObjectURL(url);
      if (token === photoVersion) {
        file.setCustomValidity(
          "This photo could not be opened. Choose another image.",
        );
        photoError.textContent = file.validationMessage;
      }
    }
  });
  dialog.addEventListener("close", () => {
    photoVersion++;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = "";
  });
  return {
    focus,
    open(vehicle = {}) {
      current = vehicle;
      editing = !!vehicle.id;
      visited = editing ? 2 : 0;
      photoVersion++;
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      photoUrl = "";
      file.setCustomValidity("");
      photoError.textContent = "";
      photoPrompt.textContent = "Add a vehicle photo";
      title.textContent = editing ? "Edit your vehicle" : "Add your vehicle";
      intro.textContent = editing
        ? "Keep your vehicle details up to date."
        : "Start with the essentials. Add the extras whenever you like.";
      for (const d of steps[1].querySelectorAll("details")) d.open = false;
      appearance.open = !!(
        vehicle.photo ||
        vehicle.nickname ||
        vehicle.plate ||
        vehicle.variant
      );
      labels.removePhoto.hidden = !vehicle.photo;
      setStep(0, false);
    },
  };
}

export function enhanceRecordEditor({ modal, form, vehicleName, groups }) {
  modal.classList.add("record-editor");
  const title = form.querySelector("h2"),
    footer = form.querySelector("footer"),
    error = form.querySelector("[role=alert]");
  const header = el("div", undefined, "record-editor-header"),
    heading = el("div"),
    close = el("button", "×", "editor-close");
  close.type = "button";
  close.setAttribute("aria-label", "Close entry form");
  close.onclick = () => modal.close();
  title.textContent =
    title.textContent === "Edit"
      ? "Edit " +
        (modal.getAttribute("aria-label") || "entry")
          .replace(/^(Add|Log) /, "")
          .toLowerCase()
      : title.textContent;
  title.id = "record-title-" + crypto.randomUUID();
  heading.append(
    el("p", "YOUR VEHICLE JOURNAL", "eyebrow"),
    title,
    el("p", vehicleName, "record-context"),
  );
  header.append(heading, close);
  modal.setAttribute("aria-labelledby", title.id);
  const labels = Object.fromEntries(
    [...form.querySelectorAll("label")].map((label) => [
      label.querySelector("[name]")?.name,
      label,
    ]),
  );
  const body = el("div", undefined, "record-editor-body");
  const hints = [...form.children].filter(
    (child) => child.tagName === "P" && child !== error,
  );
  for (const group of groups) {
    const section = el(
      group.optional ? "details" : "fieldset",
      undefined,
      group.optional ? "record-optional" : "record-group",
    );
    if (group.optional) section.append(el("summary", group.title));
    else section.append(el("legend", group.title));
    const fields = el("div", undefined, "record-fields");
    for (const name of group.names) {
      const label = labels[name];
      if (!label) continue;
      label.dataset.field = name;
      if (
        label.querySelector("input[type=file]") ||
        label.querySelector("textarea") ||
        label.classList.contains("checkbox")
      )
        label.classList.add("wide-field");
      fields.append(label);
      delete labels[name];
    }
    if (group.optional)
      section.open =
        [...fields.querySelectorAll("input,textarea")].some((input) =>
          input.type === "checkbox"
            ? input.checked
            : input.type !== "file" && !!input.value,
        ) || !!fields.querySelector("[name=removeReceipt]");
    section.append(fields);
    body.append(section);
    if (group.hints)
      for (const hint of hints) {
        section.append(hint);
        hint.classList.add("entry-hint");
      }
  }
  const rest = Object.values(labels);
  if (rest.length) {
    const fields = el("div", undefined, "record-fields");
    fields.append(...rest);
    body.append(fields);
  }
  for (const hint of hints) if (!body.contains(hint)) body.append(hint);
  form.replaceChildren(header, body);
  if (error) form.append(error);
  form.append(footer);
  footer.classList.add("record-editor-footer");
  form.classList.add("record-entry-form");
}
