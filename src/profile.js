import { validateProfile, documentData, writeRow } from "./vault.js";
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
export { validateProfile } from "./vault.js";
export function avatarContent(profile = {}) {
  if (profile.avatar) {
    const image = el("img");
    image.src = profile.avatar;
    image.alt = "";
    return image;
  }
  const initials = (profile.displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0])
    .join("")
    .toLocaleUpperCase("en");
  if (initials) return el("span", initials, "avatar-initials");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute(
    "d",
    "M16 8a4 4 0 1 1-8 0a4 4 0 1 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2",
  );
  svg.append(path);
  return svg;
}
export function avatarButton(profile, onOpen, className = "profile-trigger") {
  const button = el("button", undefined, className);
  button.type = "button";
  button.setAttribute("aria-label", "Open profile");
  button.title = "Your profile";
  button.append(avatarContent(profile));
  button.onclick = onOpen;
  return button;
}
export async function prepareAvatar(file) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw Error("Invalid photo");
  await documentData(file);
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    if (!side) throw Error("Invalid photo");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 320;
    canvas
      .getContext("2d")
      .drawImage(
        bitmap,
        (bitmap.width - side) / 2,
        (bitmap.height - side) / 2,
        side,
        side,
        0,
        0,
        320,
        320,
      );
    const data = canvas.toDataURL("image/webp", 0.88);
    if (data.length > 512 * 1024) throw Error("Photo too large");
    return data;
  } finally {
    bitmap.close();
  }
}
export function profilePanel({ db, profile = {}, onSave, onSettings }) {
  const root = el("section", undefined, "profile-page");
  root.append(el("p", "A personal touch for your garage.", "page-description"));
  const card = el("article", undefined, "card profile-card"),
    form = el("form");
  root.append(card);

  const hero = el("div", undefined, "profile-identity"),
    preview = el("div", undefined, "profile-avatar");
  let avatar = profile.avatar || "",
    task = 0;
  const identity = el("div");
  identity.append(
    el("h3", profile.displayName || "Make it yours."),
    el("p", "Your personal vehicle journal.", "muted"),
    el(
      "p",
      "Your profile is stored privately on this device.",
      "profile-privacy",
    ),
  );
  hero.append(preview, identity);
  card.append(hero, form);
  function field(key, label, value, tag = "input") {
    const wrap = el("label", label),
      input = el(tag);
    input.name = key;
    input.value = value || "";
    wrap.append(input);
    form.append(wrap);
    return input;
  }
  const photo = field("avatarFile", "Profile photo", "", "input");
  photo.type = "file";
  photo.accept = "image/png,image/jpeg,image/webp";
  photo.className = "avatar-file";
  form.append(
    el(
      "p",
      "PNG, JPEG or WebP, up to 5 MiB. Photos are cropped to a square.",
      "field-help",
    ),
  );
  const remove = el("button", "Remove photo", "remove-avatar");
  remove.type = "button";
  remove.dataset.tone = "quiet";
  form.append(remove);
  const name = field("displayName", "Display name", profile.displayName);
  name.maxLength = 60;
  name.autocomplete = "nickname";
  name.placeholder = "What should we call you?";
  const bio = field("bio", "About you", profile.bio, "textarea");
  bio.maxLength = 200;
  bio.placeholder = "A short introduction (optional)";
  const status = el("p");
  status.setAttribute("role", "status");
  const footer = el("div", undefined, "profile-footer"),
    save = el("button", "Save profile");
  save.type = "submit";
  save.dataset.tone = "primary";
  footer.append(save);
  form.append(
    footer,
    status,
    el(
      "p",
      "Saved on this device and included in your AutoLog backups.",
      "profile-privacy",
    ),
  );
  const draw = () => {
    preview.replaceChildren(avatarContent({ avatar, displayName: name.value }));
    remove.hidden = !avatar;
  };
  draw();
  name.oninput = draw;
  remove.onclick = () => {
    task++;
    avatar = "";
    photo.value = "";
    save.disabled = false;
    draw();
    status.textContent =
      "Photo removed. Save your profile to keep this change.";
  };
  photo.onchange = async () => {
    const token = ++task;
    save.disabled = true;
    status.textContent = "";
    try {
      const result = await prepareAvatar(photo.files[0]);
      if (token !== task) return;
      avatar = result;
      draw();
      status.setAttribute("role", "status");
      status.textContent = "Photo ready. Save your profile to keep it.";
    } catch {
      if (token !== task) return;
      photo.value = "";
      status.setAttribute("role", "alert");
      status.textContent =
        "Choose a valid PNG, JPEG or WebP photo under 5 MiB.";
    } finally {
      if (token === task) save.disabled = false;
    }
  };
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (save.disabled) return;
    save.disabled = true;
    try {
      const values = validateProfile({
        displayName: name.value.trim(),
        bio: bio.value.trim(),
        avatar,
      });
      await writeRow(db, "settings", { id: "profile", values });
      await onSave(values);
      const notice = document.querySelector('.profile-page [role="status"]');
      if (notice) notice.textContent = "Profile saved.";
    } catch {
      status.setAttribute("role", "alert");
      status.textContent =
        "Could not save your profile. Check available storage and try again.";
    } finally {
      save.disabled = false;
    }
  };
  const settings = el("div", undefined, "profile-settings-link");
  settings.append(el("span", "Looking for appearance, units or backups?"));
  const button = el("button", "App settings");
  button.type = "button";
  button.dataset.tone = "quiet";
  button.onclick = onSettings;
  settings.append(button);
  root.append(settings);
  return root;
}
