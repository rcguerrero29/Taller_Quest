/* Another website may not show this game inside its own page. Framed, the game could be covered with that
   site's own buttons, so a player taps "board" or "replace my save" believing they tapped something else
   ("clickjacking"). The usual cure is a header (frame-ancestors, X-Frame-Options) that GitHub Pages cannot
   send, and a page's own policy tag cannot say it either, so the page says it here: inside anyone's frame
   it hides itself, and there is nothing left to click. Nothing in this project frames the game. Loaded
   first, in <head>, before anything is drawn (#254, 2026-09-27; test/offline.js frames it from another
   site and checks). */
(function () {
  var framed;
  try { framed = window.top !== window.self; } catch (e) { framed = true; }
  if (framed) document.documentElement.style.display = "none";
})();
