/*
  Branded preview pane for the Decap CMS editor (/admin/ only).
  Shows the event roughly as it will look on the site while the owners type.
  The sign-up form itself only works on the live site, so the preview shows where it will appear.
*/
(function () {
  "use strict";
  if (!window.CMS) return;

  window.CMS.registerPreviewStyle("/assets/css/site.css");

  var h = window.h;
  var createClass = window.createClass;

  // "2026-12-05 17:00" -> { day: "Sat, Dec 5, 2026", time: "5:00 PM" } (shown exactly as typed, Florida time).
  function wallTime(value) {
    var match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (!match) return null;
    var date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3], +(match[4] || 0), +(match[5] || 0)));
    return {
      day: date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" }),
      time: match[4] ? date.toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" }) : "",
    };
  }

  function whenText(start, end, timeTba) {
    var from = wallTime(start);
    if (!from) return "Add a start time";
    if (timeTba) return from.day + " · Time to be announced";
    var to = wallTime(end);
    return from.day + (from.time ? " · " + from.time : "") + (to && to.time ? " to " + to.time : "");
  }

  var EventPreview = createClass({
    render: function () {
      var props = this.props;
      var data = function (key) {
        return props.entry.getIn(["data", key]);
      };
      var assetUrl = function (value) {
        if (!value) return null;
        var text = String(value);
        return /^https?:\/\//.test(text) ? text : props.getAsset(text).toString();
      };

      var cover = assetUrl(data("cover"));
      var gallery = data("gallery");
      var photos = gallery && gallery.toJS ? gallery.toJS() : [];
      var status = data("status");
      var addressPrivate = data("address_private") === true;
      var registration = data("registration") || "none";
      var hasSignup = (registration === "open" || registration === "waitlist") && status !== "canceled";
      var spots = data("spots");
      var place = [data("venue"), addressPrivate ? "" : data("address"), data("city")].filter(Boolean).join(", ");

      // Same rule as the site: the chip only shows a number the owners entered, or that the event is full.
      var chipText = registration === "waitlist" ? "Full: waitlist open" : spots ? "Limited to " + spots + " spots" : "";

      return h(
        "article",
        { className: "event" },
        h(
          "div",
          { className: "wrap" },
          h("p", { className: "eyebrow" }, h("span", { className: "dot" }), "Preview"),
          status && status !== "scheduled" ? h("p", { className: "badge badge--alert" }, status) : null,
          h("h1", { className: "display display--event" }, data("title") || "Event name"),
          data("summary") ? h("p", { className: "lede" }, data("summary")) : null,
          hasSignup && chipText ? h("p", { className: "chip chip--heading" }, chipText) : null,
          h(
            "dl",
            { className: "facts" },
            h("div", { className: "fact" }, h("dt", null, "When"), h("dd", null, whenText(data("start"), data("end"), data("time_tba") === true))),
            h(
              "div",
              { className: "fact" },
              h("dt", null, "Where"),
              h(
                "dd",
                null,
                place || (addressPrivate ? "" : "Add a place"),
                addressPrivate ? h("span", { className: "fact-note" }, "Exact address sent by email after you sign up.") : null
              )
            )
          ),
          h(
            "div",
            { className: "event-actions" },
            hasSignup ? h("span", { className: "btn" }, registration === "waitlist" ? "Join the waitlist" : "Sign up") : null,
            data("rsvp_url") ? h("span", { className: "btn btn-secondary" }, data("rsvp_label") || "RSVP") : null
          ),
          h(
            "div",
            { className: "event-body" + (cover ? " has-flyer" : "") },
            cover ? h("figure", { className: "flyer" }, h("img", { src: cover, alt: data("cover_alt") || "" })) : null,
            h("div", { className: "prose" }, props.widgetFor("body"))
          ),
          hasSignup
            ? h(
                "section",
                { className: "signup" },
                h(
                  "div",
                  { className: "signup-card" },
                  h("h2", { className: "section-title" }, h("span", { className: "dot" }), registration === "waitlist" ? "Join the waitlist" : "Sign up"),
                  h(
                    "p",
                    { className: "signup-intro" },
                    "The sign-up form appears here on the live site: name, email, phone and Instagram (optional), photo and email choices" +
                      (data("agreement_required") === true ? ", and the required participation agreement checkbox." : ".")
                  )
                )
              )
            : null,
          photos.length
            ? h(
                "section",
                { className: "gallery" },
                h("h2", { className: "section-title" }, h("span", { className: "dot" }), "Photos (" + photos.length + ")"),
                h(
                  "ul",
                  { className: "gallery-grid" },
                  photos.map(function (photo, index) {
                    var src = assetUrl(photo.image);
                    return src
                      ? h("li", { key: index }, h("span", { className: "gallery-link" }, h("img", { src: src, alt: photo.alt || "" })))
                      : null;
                  })
                )
              )
            : null
        )
      );
    },
  });

  window.CMS.registerPreviewTemplate("events", EventPreview);
})();
