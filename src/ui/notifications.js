/**
 * SYSTÈME DE NOTIFICATIONS TOAST LÉGER
 * Affiche des alertes temporaires non-intrusives pour les succès, montées de niveau, etc.
 */

export function showToast(message, type = "info", duration = 3500) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = message;

  container.appendChild(toast);

  // Animation d'entrée
  setTimeout(() => toast.classList.add("show"), 10);

  // Retrait automatique
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
