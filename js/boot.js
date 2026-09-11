try {
  await import("./main.js");
} catch (error) {
  console.error(error);
  const panel = document.createElement("section");
  panel.className = "panel small";
  const title = document.createElement("h2");
  title.textContent = "げーむをよみこめませんでした";
  const message = document.createElement("p");
  message.textContent =
    "ひつようなふぁいるをかくにんしてください。ぺーじをよみなおしてもういちどおためしください。";
  const button = document.createElement("button");
  button.textContent = "たいとるにもどる";
  button.onclick = () => location.reload();
  panel.append(title, message, button);
  document.querySelector("#screen").replaceChildren(panel);
}
