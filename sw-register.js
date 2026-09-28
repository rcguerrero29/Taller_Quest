/* Offline play: turn on the service worker (sw.js), and when a new version of the game takes over,
   reload once so a single refresh always lands on the newest build.
   This lived inside index.html as the page's only inline script, and it was the one reason the page's
   security policy said "scripts written inside the page may run" (script-src 'unsafe-inline'). As its own
   file it runs under script-src 'self', and a script slipped into the page as text cannot run at all
   (#254, 2026-09-27). test/offline.js proves the worker installs, plays offline and reloads once. */
(function () {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch(function () {});
  /* cache-first serves the OLD page while a new SW installs; when the new one takes
     control, reload once so a single manual refresh always lands on the latest version */
  var hadSW = !!navigator.serviceWorker.controller, reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (hadSW && !reloaded) {
      reloaded = true;
      try { sessionStorage.setItem("mqupd", "1"); } catch (e) {}
      location.reload();
    }
  });
})();
