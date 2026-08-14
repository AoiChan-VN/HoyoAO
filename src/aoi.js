const ROOT_ID = "app";

let applicationStarted = false;
let fatalRendered = false;

function getRoot() {
  return document.getElementById(ROOT_ID);
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function renderLoading() {
  const root = getRoot();

  if (!root) {
    return;
  }

  clearElement(root);

  const loading = document.createElement("div");

  loading.className = "app-boot-loading";

  loading.style.cssText = `
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 24px;
    box-sizing: border-box;
    color: var(--color-text-secondary, #c3cbd8);
    background: var(--color-bg-page, #070a10);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    text-align: center;
  `;

  loading.textContent = "Đang khởi động HoyoAO...";

  root.appendChild(loading);
}

function renderFatalError(error) {
  if (fatalRendered) {
    return;
  }

  fatalRendered = true;

  const root = getRoot();
  const host = root ?? document.body;

  if (root) {
    clearElement(root);
  }

  const container = document.createElement("div");

  container.className = "app-fatal";
  container.setAttribute("role", "alert");

  container.style.cssText = `
    max-width: min(92vw, 760px);
    margin: 10vh auto;
    padding: 24px;
    box-sizing: border-box;
    border-radius: 16px;
    border: 1px solid var(--color-border-default, rgba(148, 163, 184, 0.18));
    background: var(--color-bg-elevated, rgba(20, 26, 38, 0.96));
    color: var(--color-text-primary, #f8fafc);
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    line-height: 1.45;
  `;

  const title = document.createElement("h1");

  title.textContent = "HoyoAO không thể khởi động.";
  title.style.cssText = `
    margin: 0 0 12px;
    font-size: 1.25rem;
    line-height: 1.3;
  `;

  const message = document.createElement("p");

  message.textContent =
    error instanceof Error
      ? error.message
      : String(error ?? "Unknown error");

  message.style.cssText = `
    margin: 0 0 12px;
    color: var(--color-text-secondary, #c3cbd8);
  `;

  const hint = document.createElement("p");

  hint.textContent =
    "Hãy kiểm tra Console và Network. Đảm bảo website đang được mở bằng GitHub Pages URL, không phải file:// hoặc raw.githubusercontent.com.";

  hint.style.cssText = `
    margin: 0 0 16px;
    font-size: 0.9rem;
    color: var(--color-text-muted, #7f8998);
  `;

  const details = document.createElement("details");

  const summary = document.createElement("summary");
  summary.textContent = "Chi tiết lỗi";
  summary.style.cursor = "pointer";

  const pre = document.createElement("pre");

  pre.textContent =
    error instanceof Error
      ? error.stack ?? error.message
      : String(error ?? "Unknown error");

  pre.style.cssText = `
    margin: 12px 0 0;
    padding: 12px;
    border-radius: 12px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.8rem;
    background: var(--color-bg-input, rgba(10, 14, 22, 0.92));
    border: 1px solid var(--color-border-subtle, rgba(148, 163, 184, 0.12));
  `;

  details.append(summary, pre);

  const actions = document.createElement("div");

  actions.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  `;

  const reloadButton = document.createElement("button");

  reloadButton.type = "button";
  reloadButton.textContent = "Tải lại trang";

  reloadButton.style.cssText = `
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid var(--color-border-default, rgba(148, 163, 184, 0.18));
    background: var(--color-bg-surface, rgba(13, 17, 26, 0.92));
    color: var(--color-text-primary, #f8fafc);
    cursor: pointer;
  `;

  reloadButton.addEventListener("click", () => {
    window.location.reload();
  });

  actions.appendChild(reloadButton);

  container.append(title, message, hint, details, actions);
  host.appendChild(container);
}

function assertRuntimeEnvironment() {
  if (window.location.protocol === "file:") {
    throw new Error(
      "Không thể chạy bằng file://. Hãy deploy lên GitHub Pages hoặc chạy bằng local static server.",
    );
  }

  if (window.location.hostname.endsWith("raw.githubusercontent.com")) {
    throw new Error(
      "Không thể chạy từ raw.githubusercontent.com. Hãy mở bằng GitHub Pages URL chính thức.",
    );
  }
}

async function startApplication() {
  try {
    renderLoading();
    assertRuntimeEnvironment();

    const root = getRoot();

    if (!root) {
      throw new Error("Root application container #app not found.");
    }

    const bootstrapModule = await import("./app/bootstrap.js");

    if (typeof bootstrapModule.bootstrapApplication !== "function") {
      throw new Error(
        "src/app/bootstrap.js must export bootstrapApplication().",
      );
    }

    await bootstrapModule.bootstrapApplication();

    applicationStarted = true;
  } catch (error) {
    console.error("[HoyoAO] Application bootstrap failed.", error);

    renderFatalError(error);

    window.dispatchEvent(
      new CustomEvent("hoyoao:bootstrap-error", {
        detail: error,
      }),
    );
  }
}

window.addEventListener(
  "unhandledrejection",
  (event) => {
    if (!applicationStarted) {
      event.preventDefault();

      renderFatalError(event.reason ?? new Error("Unhandled rejection"));
    }
  },
  { once: false },
);

window.addEventListener("error", (event) => {
  if (!applicationStarted && event.error) {
    renderFatalError(event.error);
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApplication, {
    once: true,
  });
} else {
  startApplication();
} 
