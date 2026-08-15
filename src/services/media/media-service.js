const DEFAULT_ASSETS = Object.freeze({
  logo: "assets/logos/logo.png",
  avatar: "assets/avatars/default.png",
  drives: "data/drives.json",
  docsIndex: "data/docs/index.json",
});

function resolveRootUrl() {
  try {
    return new URL("../../../", import.meta.url).href;
  } catch {
    return "./";
  }
}

function isAbsoluteUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(String(value ?? ""));
}

export function createMediaService(context) {
  const rootUrl = resolveRootUrl();

  function resolve(path) {
    const raw = String(path ?? "").trim();

    if (!raw) {
      return null;
    }

    if (isAbsoluteUrl(raw)) {
      return raw;
    }

    const clean = raw.replace(/^\.?\//, "");

    return new URL(clean, rootUrl).href;
  }

  function getConfig() {
    return context?.config ?? {};
  }

  function getLogoUrl() {
    return getConfig().brand?.logo?.src ?? resolve(DEFAULT_ASSETS.logo);
  }

  function getLogoInitials() {
    return getConfig().brand?.logo?.initials ?? "AO";
  }

  function getLogoAlt() {
    return (
      getConfig().brand?.logo?.alt ??
      getConfig().name ??
      "HoyoAO"
    );
  }

  function getAvatarUrl() {
    return (
      getConfig().account?.avatarSrc ??
      getConfig().brand?.avatar?.src ??
      resolve(DEFAULT_ASSETS.avatar)
    );
  }

  function getImage(key, fallback = null) {
    const images = getConfig().media?.images ?? {};

    if (images[key]) {
      return resolve(images[key]);
    }

    return fallback ? resolve(fallback) : null;
  }

  function getDrivesUrl() {
    return resolve(
      getConfig().media?.drives ?? DEFAULT_ASSETS.drives,
    );
  }

  function getDocsIndexUrl() {
    return resolve(
      getConfig().media?.docsIndex ?? DEFAULT_ASSETS.docsIndex,
    );
  }

  function getDocUrl(docId) {
    return resolve(`data/docs/${encodeURIComponent(docId)}.md`);
  }

  return Object.freeze({
    resolve,
    getLogoUrl,
    getLogoInitials,
    getLogoAlt,
    getAvatarUrl,
    getImage,
    getDrivesUrl,
    getDocsIndexUrl,
    getDocUrl,
  });
}

export function createMediaServiceFromContext(context) {
  if (context?.services?.media) {
    return context.services.media;
  }

  const service = createMediaService(context);

  if (context?.services) {
    context.services.media = service;
  }

  return service;
}

export default createMediaService; 
