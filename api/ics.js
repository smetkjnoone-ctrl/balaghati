// Returns a calendar file (.ics) so Safari on iPad/iPhone shows "Add to Calendar".
// Query: t = task text, s = start (YYYYMMDDTHHMMSSZ, UTC), r = 1 for weekday repeat (Sun–Thu)
module.exports = (req, res) => {
  const q = req.query || {};
  const esc = v => String(v || "").slice(0, 200).replace(/[\;,]/g, c => "\\" + c).replace(/[\r\n]+/g, " ");
  const text = esc(q.t) || "مهمة";
  const s = /^\d{8}T\d{6}Z$/.test(q.s || "") ? q.s : null;
  if (!s) { res.statusCode = 400; res.end("bad start"); return; }
  const d = new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(9, 11), +s.slice(11, 13)));
  const p = n => String(n).padStart(2, "0");
  const u = x => x.getUTCFullYear() + p(x.getUTCMonth() + 1) + p(x.getUTCDate()) + "T" + p(x.getUTCHours()) + p(x.getUTCMinutes()) + "00Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//bawaba//ar", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    "UID:" + Date.now() + "-" + Math.random().toString(36).slice(2) + "@bawaba", "DTSTAMP:" + u(new Date()),
    "DTSTART:" + u(d), "DTEND:" + u(new Date(d.getTime() + 30 * 60000)), "SUMMARY:" + text, "DESCRIPTION:مهمة من بوابة الخدمات"];
  if (q.r === "1") L.push("RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH");
  L.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + text, "TRIGGER:-PT10M", "END:VALARM",
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + text, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT", "END:VCALENDAR");
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="task.ics"');
  res.setHeader("Cache-Control", "no-store");
  res.end(L.join("\r\n"));
};
