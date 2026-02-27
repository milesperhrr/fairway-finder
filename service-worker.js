self.addEventListener("install", event => {
  console.log("Service worker installed.");
});

self.addEventListener("fetch", event => {
  // optional caching logic can go here
});