import { bootstrapApplication } from "./app/bootstrap.js";

async function startApplication() {
  try {
    await bootstrapApplication();
  } catch (error) {
    console.error("[HoyoAO] Application bootstrap failed.", error);

    window.dispatchEvent(
      new CustomEvent("hoyoao:bootstrap-error", {
        detail: error,
      }),
    );
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApplication, {
    once: true,
  });
} else {
  startApplication();
} 
