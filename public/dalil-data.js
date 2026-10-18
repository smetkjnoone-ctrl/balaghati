/* Shared access to دليل الموظف data for بوابة الخدمات and بلاغاتي.
   Fetches the published دليل page, decrypts its data, and caches it on this device.
   window.loadDalil(cb): calls cb(list) with the cached copy right away (if any),
   then again with fresh data when the published version changed. */
(function () {
  var SRC = window.DALIL_SRC || "https://dalil-dusky.vercel.app/";
  var CODE = "102026";
  var KEY = "dalil-cache";
  var AG = "الوكالات التجارية والمتاجر";

  function u8(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }
  async function decrypt(enc) {
    var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(CODE), "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: u8(enc.salt), iterations: enc.it, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: u8(enc.iv) }, key, u8(enc.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  function readCache() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }

  window.loadDalil = function (cb) {
    var cache = readCache();
    if (cache && Array.isArray(cache.data)) { try { cb(cache.data); } catch (e) {} }
    return fetch(SRC, { cache: "no-cache" }).then(function (r) { return r.text(); }).then(function (h) {
      var m = h.match(/<script id="enc" type="application\/json">([\s\S]*?)<\/script>/);
      if (!m) throw new Error("no data");
      var enc = JSON.parse(m[1]);
      if (cache && cache.v === enc.v && Array.isArray(cache.data)) return cache.data;
      return decrypt(enc).then(function (data) {
        try { localStorage.setItem(KEY, JSON.stringify({ v: enc.v, data: data })); } catch (e) {}
        try { cb(data); } catch (e) {}
        return data;
      });
    }).catch(function () { return cache ? cache.data : null; });
  };

  var lc = function (s) { return String(s || "").trim().toLowerCase(); };
  var gkey = function (n) { return "g:" + lc(n).replace(/\s+/g, "").replace(/ه$/, "ة").replace(/^شركه/, "شركة"); };
  var emList = function (v) { return String(v || "").split(/[\s,;،؛]+/).map(function (x) { return x.trim(); }).filter(Boolean); };
  var contactName = function (r) { return String(r || "").split(" · ")[0].split("(")[0].replace(/^(TO|CC)\s*:-?\s*/i, "").trim(); };

  /* group agency contacts into facilities: {key, name, cr, members, emails} */
  window.dalilFacilities = function (D) {
    var map = new Map();
    (D || []).forEach(function (p) {
      if (p.sec !== AG) return;
      var k = gkey(p.name), f = map.get(k);
      if (!f) { f = { key: k, name: p.name, cr: "", members: [], emails: [] }; map.set(k, f); }
      f.members.push(p);
      if (!f.cr && p.cr) f.cr = p.cr;
      emList(p.email).forEach(function (e) { if (f.emails.indexOf(e) < 0) f.emails.push(e); });
    });
    return Array.from(map.values()).sort(function (a, b) {
      return String(a.name).replace(/^[(\s]+/, "").localeCompare(String(b.name).replace(/^[(\s]+/, ""), "ar");
    });
  };
  window.dalilKey = gkey;
  window.dalilEmails = emList;

  var MAILT = {
    "إحالة بلاغ": { s: function (n) { return "إحالة بلاغ" + (n ? " رقم " + n : ""); }, b: function (n) { return "نحيطكم علماً بورود البلاغ رقم (" + (n || "      ") + ") بخصوص منشأتكم، ونأمل الاطلاع عليه ومعالجته، والإفادة بما تم اتخاذه حياله خلال المدة النظامية."; } },
    "تذكير": { s: function (n) { return "تذكير بالبلاغ" + (n ? " رقم " + n : ""); }, b: function (n) { return "إشارة إلى البلاغ رقم (" + (n || "      ") + ") المحال إليكم، نذكّركم بانقضاء المهلة النظامية دون ورود إفادتكم، ونأمل سرعة معالجته والإفادة بما تم حياله."; } },
    "طلب إفادة": { s: function (n) { return "طلب إفادة عن البلاغ" + (n ? " رقم " + n : ""); }, b: function (n) { return "نأمل تزويدنا بإفادتكم حيال البلاغ رقم (" + (n || "      ") + ") وما تم اتخاذه من إجراءات، مع إرفاق ما يثبت ذلك إن وجد."; } },
    "إغلاق بلاغ": { s: function (n) { return "إغلاق البلاغ" + (n ? " رقم " + n : ""); }, b: function (n) { return "نفيدكم بأنه تم إغلاق البلاغ رقم (" + (n || "      ") + ") بعد استكمال معالجته، شاكرين تجاوبكم وتعاونكم."; } }
  };
  window.DALIL_MAIL_TYPES = Object.keys(MAILT);

  /* mailto link to every email of a facility */
  window.dalilMailHref = function (fac, num, type) {
    var T = MAILT[type] || MAILT["إحالة بلاغ"];
    var withMail = fac.members.filter(function (m) { return emList(m.email).length; });
    var who = withMail.length === 1 ? contactName(withMail[0].role) : "";
    var body = "السلام عليكم ورحمة الله وبركاته،\n\n" +
      (who ? "الأستاذ/ة " + who + " المحترم/ة" : "سعادة ضابط الاتصال المحترم") + "\n" + fac.name + "\n\n" +
      T.b(num) + "\n\nشاكرين ومقدرين تعاونكم،\nوزارة التجارة – فرع منطقة الجوف";
    return "mailto:" + fac.emails.map(encodeURIComponent).join(",") +
      "?subject=" + encodeURIComponent(T.s(num) + " – " + fac.name) + "&body=" + encodeURIComponent(body);
  };
})();
