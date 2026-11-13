/*
  AquaBerry Events: small extras on top of plain HTML. Every page still works without this file.
  1. Sends Netlify Identity invite and password-reset links to /admin/.
  2. Moves events from "Upcoming" to "Past" using the visitor's clock (the site only rebuilds on publish).
     This also hides the sign-up form once the event is over.
  3. Stops a sign-up from being sent twice when someone taps the button again.
  4. Opens gallery photos in a full-screen viewer with swipe and arrow keys.
*/
(function () {
  "use strict";

  // 1. Invite, recovery and confirmation emails link to the home page with a token after "#".
  //    The login widget lives on /admin/, so pass the token along. The token never leaves this site.
  var tokenHash = /^#(invite_token|recovery_token|confirmation_token|email_change_token)=/;
  if (tokenHash.test(window.location.hash) && window.location.pathname.indexOf("/admin") !== 0) {
    window.location.replace("/admin/" + window.location.hash);
    return;
  }

  // 2. Upcoming or past, re-checked now.
  var now = Date.now();
  var hasEnded = function (element) {
    var ends = Date.parse(element.getAttribute("data-ends"));
    return !isNaN(ends) && now >= ends;
  };

  document.querySelectorAll(".card-item[data-ends]").forEach(function (item) {
    var ended = hasEnded(item);
    var when = item.getAttribute("data-when");
    if (when === "upcoming") item.hidden = ended;
    if (when === "past") item.hidden = !ended;
  });

  document.querySelectorAll("[data-list]").forEach(function (list) {
    var anyVisible = Array.prototype.some.call(list.children, function (child) {
      return !child.hidden;
    });
    var note = document.querySelector('[data-empty-for="' + list.getAttribute("data-list") + '"]');
    if (note) note.hidden = anyVisible;
  });

  var eventPage = document.querySelector("article.event[data-ends]");
  if (eventPage) {
    var ended = hasEnded(eventPage);
    eventPage.querySelectorAll("[data-show]").forEach(function (block) {
      block.hidden = block.getAttribute("data-show") === "upcoming" ? ended : !ended;
    });
  }

  // 3. Sign-up form: one submission per tap. The browser checks required fields before this runs.
  document.querySelectorAll("form.signup-form").forEach(function (form) {
    form.addEventListener("submit", function () {
      var button = form.querySelector("button[type=submit]");
      if (!button) return;
      // Disable after the submit has started, so the form still sends normally.
      window.setTimeout(function () {
        button.setAttribute("data-label", button.textContent);
        button.disabled = true;
        button.textContent = button.getAttribute("data-submit-label") || button.textContent;
      }, 0);
    });
  });

  // When someone comes back with the Back button, the page can be restored from memory with the button
  // still disabled. Turn it back on, with its normal label, in that case.
  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    document.querySelectorAll("form.signup-form button[type=submit][disabled]").forEach(function (button) {
      button.disabled = false;
      button.textContent = button.getAttribute("data-label") || button.textContent;
    });
  });

  // 4. Photo viewer.
  var dialog = document.querySelector("[data-lightbox]");
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-gallery] .gallery-link"));
  if (!dialog || !links.length || typeof dialog.showModal !== "function") return;

  var image = dialog.querySelector("[data-lightbox-image]");
  var caption = dialog.querySelector("[data-lightbox-caption]");
  var count = dialog.querySelector("[data-lightbox-count]");
  var current = 0;

  function show(index) {
    current = (index + links.length) % links.length;
    var link = links[current];
    var thumb = link.querySelector("img");
    image.src = link.href;
    image.alt = thumb ? thumb.alt : "";
    caption.textContent = link.getAttribute("data-caption") || "";
    count.textContent = current + 1 + " / " + links.length;
  }

  links.forEach(function (link, index) {
    link.addEventListener("click", function (event) {
      // Let people open the photo in a new tab with a modifier key or middle click.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      show(index);
      dialog.showModal();
    });
  });

  dialog.querySelector("[data-lightbox-prev]").addEventListener("click", function () {
    show(current - 1);
  });
  dialog.querySelector("[data-lightbox-next]").addEventListener("click", function () {
    show(current + 1);
  });
  dialog.querySelector("[data-lightbox-close]").addEventListener("click", function () {
    dialog.close();
  });

  dialog.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });

  // Tap the dark area around the photo to close.
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });

  // Swipe left or right on phones.
  var touchStartX = null;
  dialog.addEventListener(
    "touchstart",
    function (event) {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true },
  );
  dialog.addEventListener("touchend", function (event) {
    if (touchStartX === null) return;
    var distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 50) show(current + (distance < 0 ? 1 : -1));
    touchStartX = null;
  });

  // Return focus to the photo that was opened.
  dialog.addEventListener("close", function () {
    image.removeAttribute("src");
    links[current].focus();
  });
})();
