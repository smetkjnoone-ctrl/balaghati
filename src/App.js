import React, { useState, useMemo } from "react";

const ANWA3 = ["رقابة", "وكالات", "متاجر"];
const HALAT = { MOTABA3A: "متابعة", TATHKEER: "تذكير", MOGHLAQ: "مغلق" };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function todayDMY() {
  const d = new Date();
  return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
}

function isOverdueOrToday(dateStr) {
  if (!dateStr) return true;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d.getTime() <= now.getTime();
}

export default function App() {
  const [balaghat, setBalaghat] = useState([]);
  const [filterHala, setFilterHala] = useState("الكل");
  const [filterNoo3, setFilterNoo3] = useState("الكل");
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);
  const [muraqibName, setMuraqibName] = useState("");
  const [showAlert, setShowAlert] = useState(true);

  const [form, setForm] = useState({
    raqm: "",
    noo3: ANWA3[0],
    ijraa: "",
    hala: "MOTABA3A",
    tarikh: "",
  });

  function addBalagh(e) {
    e.preventDefault();
    if (!form.raqm.trim() || !form.ijraa.trim()) return;
    const entry = {
      id: uid(),
      raqm: form.raqm.trim(),
      noo3: form.noo3,
      ijraa: form.ijraa.trim(),
      hala: form.hala,
      tarikh: form.tarikh || null,
      createdAt: todayISO(),
    };
    setBalaghat([entry, ...balaghat]);
    setForm({ raqm: "", noo3: ANWA3[0], ijraa: "", hala: "MOTABA3A", tarikh: "" });
  }

  function updateHala(id, newHala) {
    setBalaghat(balaghat.map((b) => (b.id === id ? { ...b, hala: newHala } : b)));
  }

  function deleteBalagh(id) {
    setBalaghat(balaghat.filter((b) => b.id !== id));
  }

  const dueReminders = useMemo(
    () => balaghat.filter((b) => b.hala === "TATHKEER" && isOverdueOrToday(b.tarikh)),
    [balaghat]
  );

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return balaghat.filter((b) => {
      if (filterHala !== "الكل" && b.hala !== filterHala) return false;
      if (filterNoo3 !== "الكل" && b.noo3 !== filterNoo3) return false;
      if (filterDate && b.createdAt !== filterDate) return false;
      if (q && !(b.raqm.toLowerCase().includes(q) || b.ijraa.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [balaghat, filterHala, filterNoo3, filterDate, searchText]);

  function deleteDayBalaghat() {
    if (!dateInput) return;
    setBalaghat(balaghat.filter((b) => b.createdAt !== dateInput));
    setConfirmDeleteDay(false);
    setFilterDate("");
    setDateInput("");
  }

  function exportPDF() {
    const rows = filtered
      .map(
        (b) =>
          `<tr><td>${b.raqm}</td><td>${b.noo3}</td><td>${HALAT[b.hala]}</td></tr>`
      )
      .join("");
    const html = `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>قائمة أرقام البلاغات</title>
          <style>
            body { font-family: sans-serif; padding: 24px; }
            h1 { font-size: 20px; margin: 0 0 6px 0; }
            .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #999; padding: 6px 10px; font-size: 13px; text-align: right; }
            th { background: #eee; }
            .footer { margin-top: 20px; font-size: 11px; color: #555; text-align: center; }
            .hint { background: #fff8e1; border: 1px solid #e0c060; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; border-radius: 4px; }
            @media print { .hint { display: none; } }
          </style>
        </head>
        <body>
          <div class="hint">لتصدير هذه الصفحة كـ PDF: افتح قائمة الطباعة من متصفحك (Ctrl+P أو أيقونة المشاركة ثم طباعة) واختر "حفظ كـ PDF".</div>
          <h1>قائمة أرقام البلاغات</h1>
          <div class="meta">تاريخ التصدير: ${todayDMY()} · العدد: ${filtered.length}</div>
          <table>
            <thead><tr><th>رقم البلاغ</th><th>القسم</th><th>الحالة</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">${muraqibName ? `المراقب: ${muraqibName}` : "بلاغاتي"}</div>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `بلاغات-${todayDMY()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return (
    <div dir="rtl" style={styles.page}>
      <style>{`
        @media print {
          .app-root { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>
      <div className="print-only" style={styles.printArea}>
        <h1 style={styles.printTitle}>قائمة أرقام البلاغات</h1>
        <div style={styles.printMeta}>
          تاريخ التصدير: {todayISO()} · العدد: {filtered.length}
        </div>
        <table style={styles.printTable}>
          <thead>
            <tr>
              <th style={styles.printTh}>رقم البلاغ</th>
              <th style={styles.printTh}>القسم</th>
              <th style={styles.printTh}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td style={styles.printTd}>{b.raqm}</td>
                <td style={styles.printTd}>{b.noo3}</td>
                <td style={styles.printTd}>{HALAT[b.hala]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={styles.printFooter}>© {new Date().getFullYear()} جميع الحقوق محفوظة — سعد بن حاكم الرويلي</div>
      </div>

      <div className="app-root">
      <header style={styles.header}>
        <div>
          <input
            style={styles.muraqibNameInput}
            value={muraqibName}
            onChange={(e) => setMuraqibName(e.target.value)}
            placeholder="اكتب اسمك هنا"
          />
          <div style={styles.headerName}>بلاغاتي</div>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.headerDate}>{todayDMY()}</div>
          <div style={styles.headerCount}>{balaghat.length} بلاغ</div>
        </div>
      </header>

      {dueReminders.length > 0 && showAlert && (
        <div style={styles.alertBanner}>
          <div style={styles.alertText}>
            لديك <strong style={styles.alertCount}>{dueReminders.length}</strong>{" "}
            {dueReminders.length === 1 ? "بلاغ يحتاج تذكير" : "بلاغات تحتاج تذكير"} الآن
          </div>
          <button style={styles.alertClose} onClick={() => setShowAlert(false)}>
            ✕
          </button>
        </div>
      )}

      <main style={styles.main}>
        <section style={styles.formSection}>
          <h2 style={styles.sectionTitle}>إضافة بلاغ</h2>
          <form onSubmit={addBalagh} style={styles.form}>
            <div style={styles.formRow}>
              <label style={styles.label}>
                رقم البلاغ
                <input
                  style={styles.input}
                  value={form.raqm}
                  onChange={(e) => setForm({ ...form, raqm: e.target.value })}
                  placeholder="مثال: 4521"
                  required
                />
              </label>
              <label style={styles.label}>
                القسم
                <select
                  style={styles.select}
                  value={form.noo3}
                  onChange={(e) => setForm({ ...form, noo3: e.target.value })}
                >
                  {ANWA3.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={styles.labelFull}>
              الإجراء المتخذ
              <textarea
                style={styles.textarea}
                value={form.ijraa}
                onChange={(e) => setForm({ ...form, ijraa: e.target.value })}
                placeholder="اكتب الإجراء الذي تم اتخاذه على البلاغ"
                rows={2}
                required
              />
            </label>

            <div style={styles.formRow}>
              <label style={styles.label}>
                الحالة
                <select
                  style={styles.select}
                  value={form.hala}
                  onChange={(e) => setForm({ ...form, hala: e.target.value })}
                >
                  <option value="MOTABA3A">متابعة</option>
                  <option value="TATHKEER">تذكير</option>
                  <option value="MOGHLAQ">مغلق</option>
                </select>
              </label>
              {form.hala === "TATHKEER" && (
                <label style={styles.label}>
                  تاريخ الاستحقاق (اختياري)
                  <input
                    type="date"
                    style={styles.input}
                    value={form.tarikh}
                    onChange={(e) => setForm({ ...form, tarikh: e.target.value })}
                    min={todayISO()}
                  />
                </label>
              )}
            </div>

            <button type="submit" style={styles.submitBtn}>
              حفظ البلاغ
            </button>
          </form>
        </section>

        <section style={styles.listSection}>
          <div style={styles.listHeader}>
            <h2 style={styles.sectionTitle}>سجل البلاغات ({filtered.length})</h2>
            <button style={styles.exportBtn} onClick={exportPDF}>
              تصدير PDF
            </button>
          </div>

          <div style={styles.searchRow}>
            <input
              style={styles.searchInput}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="بحث برقم البلاغ أو الإجراء…"
            />
            <input
              type="date"
              style={styles.dateFilterInput}
              value={dateInput}
              onChange={(e) => {
                setDateInput(e.target.value);
                setConfirmDeleteDay(false);
              }}
              title="اختر تاريخ"
            />
            {!confirmDeleteDay && (
              <>
                <button
                  style={styles.searchDateBtn}
                  onClick={() => setFilterDate(dateInput)}
                  disabled={!dateInput}
                >
                  بحث
                </button>
                <button
                  style={styles.deleteDaySmallBtn}
                  onClick={() => setConfirmDeleteDay(true)}
                  disabled={!dateInput}
                >
                  حذف
                </button>
                {filterDate && (
                  <button
                    style={styles.clearDateBtn}
                    onClick={() => {
                      setFilterDate("");
                      setDateInput("");
                    }}
                  >
                    إلغاء التاريخ
                  </button>
                )}
              </>
            )}
            {confirmDeleteDay && (
              <>
                <span style={styles.confirmText}>
                  حذف {balaghat.filter((b) => b.createdAt === dateInput).length} بلاغ نهائياً؟
                </span>
                <button style={styles.confirmDeleteBtn} onClick={deleteDayBalaghat}>
                  تنفيذ
                </button>
                <button style={styles.clearDateBtn} onClick={() => setConfirmDeleteDay(false)}>
                  تراجع
                </button>
              </>
            )}
            <div style={styles.filters}>
              <select style={styles.filterSelect} value={filterHala} onChange={(e) => setFilterHala(e.target.value)}>
                <option value="الكل">كل الحالات</option>
                <option value="MOTABA3A">متابعة</option>
                <option value="TATHKEER">تذكير</option>
                <option value="MOGHLAQ">مغلق</option>
              </select>
              <select style={styles.filterSelect} value={filterNoo3} onChange={(e) => setFilterNoo3(e.target.value)}>
                <option value="الكل">كل الأقسام</option>
                {ANWA3.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={styles.empty}>لا توجد بلاغات مطابقة. أضف أول بلاغ من الأعلى.</div>
          ) : (
            <div style={styles.tableWrap}>
              {filtered.map((b) => (
                <div key={b.id} style={styles.row}>
                  <div style={styles.rowMain}>
                    <div style={styles.rowTop}>
                      <span style={styles.raqmBadge}>#{b.raqm}</span>
                      <span style={styles.noo3Badge}>{b.noo3}</span>
                      <span
                        style={{
                          ...styles.halaBadge,
                          ...(b.hala === "TATHKEER"
                            ? styles.halaTathkeer
                            : b.hala === "MOGHLAQ"
                            ? styles.halaMoghlaq
                            : styles.halaMotaba3a),
                        }}
                      >
                        {HALAT[b.hala]}
                      </span>
                      {b.hala === "TATHKEER" && isOverdueOrToday(b.tarikh) && (
                        <span style={styles.dueTag}>مستحق</span>
                      )}
                    </div>
                    <div style={styles.ijraaText}>{b.ijraa}</div>
                    <div style={styles.rowMeta}>
                      {b.tarikh ? `الاستحقاق: ${b.tarikh}` : "بدون تاريخ استحقاق"}
                    </div>
                  </div>
                  <div style={styles.rowActions}>
                    <select
                      style={styles.rowSelect}
                      value={b.hala}
                      onChange={(e) => updateHala(b.id, e.target.value)}
                    >
                      <option value="MOTABA3A">متابعة</option>
                      <option value="TATHKEER">تذكير</option>
                      <option value="MOGHLAQ">مغلق</option>
                    </select>
                    <button style={styles.deleteBtn} onClick={() => deleteBalagh(b.id)}>
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <footer style={styles.footer}>
        © {new Date().getFullYear()} جميع الحقوق محفوظة — سعد بن حاكم الرويلي
      </footer>
      </div>
    </div>
  );
}

const colors = {
  bg: "#F8F7F2",
  navy: "#0C5C3D",
  navySoft: "#0F7A4F",
  teal: "#0C5C3D",
  tealBg: "#E1EEE6",
  amber: "#A87C1F",
  amberBg: "#F3E9D2",
  gray: "#7C7A6E",
  border: "#DCD8C8",
  card: "#FFFFFF",
  text: "#1A1A1A",
  danger: "#9C4A3A",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: colors.bg,
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: colors.text,
  },
  header: {
    background: colors.navy,
    padding: "20px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `3px solid ${colors.amber}`,
  },
  headerEyebrow: { color: "#9FB0BE", fontSize: 12, fontWeight: 500, marginBottom: 2 },
  headerName: { color: "#fff", fontSize: 18, fontWeight: 600 },
  muraqibNameInput: {
    background: "transparent",
    border: "none",
    borderBottom: "1px dashed #7FA894",
    color: "#D9EDE1",
    fontSize: 12,
    fontWeight: 500,
    padding: "0 0 2px 0",
    marginBottom: 4,
    outline: "none",
    width: 160,
    fontFamily: "inherit",
  },
  headerStats: { textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 },
  headerDate: { color: "#D9EDE1", fontSize: 13, fontWeight: 500 },
  headerCount: { color: colors.amberBg, fontSize: 13, fontWeight: 600 },
  alertBanner: {
    background: colors.amberBg,
    borderBottom: `1px solid ${colors.amber}`,
    padding: "12px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertText: { color: "#5C3D1F", fontSize: 14 },
  alertCount: { color: colors.amber, fontSize: 16 },
  alertClose: { background: "none", border: "none", cursor: "pointer", color: "#5C3D1F", fontSize: 14 },
  main: { maxWidth: 900, margin: "0 auto", padding: "28px 20px 60px" },
  footer: {
    textAlign: "center",
    padding: "16px 20px 28px",
    fontSize: 12,
    color: colors.gray,
    borderTop: `1px solid ${colors.border}`,
    maxWidth: 900,
    margin: "0 auto",
  },
  formSection: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: 24,
    marginBottom: 28,
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: colors.navy, margin: "0 0 16px 0" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  formRow: { display: "flex", gap: 14, flexWrap: "wrap" },
  label: {
    flex: "1 1 200px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    color: colors.navySoft,
    fontWeight: 500,
  },
  labelFull: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: colors.navySoft, fontWeight: 500 },
  input: {
    padding: "10px 12px",
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    textAlign: "right",
    outline: "none",
    color: colors.text,
  },
  select: {
    padding: "10px 12px",
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    textAlign: "right",
    outline: "none",
    background: "#fff",
    color: colors.text,
  },
  textarea: {
    padding: "10px 12px",
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    textAlign: "right",
    outline: "none",
    resize: "vertical",
    color: colors.text,
  },
  submitBtn: {
    alignSelf: "flex-start",
    padding: "11px 24px",
    fontSize: 14,
    fontWeight: 600,
    background: colors.navy,
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  listSection: {},
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  exportBtn: {
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    background: "#fff",
    color: colors.navy,
    border: `1px solid ${colors.navy}`,
    borderRadius: 4,
    cursor: "pointer",
  },
  searchRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14, alignItems: "center" },
  searchInput: {
    flex: "1 1 220px",
    padding: "9px 12px",
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    textAlign: "right",
    outline: "none",
    color: colors.text,
    background: "#fff",
  },
  filters: { display: "flex", gap: 8, flexWrap: "wrap" },
  dateFilterInput: {
    padding: "9px 10px",
    fontSize: 13,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    background: "#fff",
    color: colors.text,
  },
  clearDateBtn: {
    padding: "8px 12px",
    fontSize: 12,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    background: "#fff",
    color: colors.navySoft,
    cursor: "pointer",
  },
  deleteDaySmallBtn: {
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    border: `1px solid ${colors.danger}`,
    borderRadius: 4,
    background: "#fff",
    color: colors.danger,
    cursor: "pointer",
  },
  searchDateBtn: {
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    border: `1px solid ${colors.navy}`,
    borderRadius: 4,
    background: "#fff",
    color: colors.navy,
    cursor: "pointer",
  },
  confirmText: { fontSize: 13, color: colors.danger, fontWeight: 600 },
  confirmDeleteBtn: {
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    borderRadius: 4,
    background: colors.danger,
    color: "#fff",
    cursor: "pointer",
  },
  printArea: { padding: 24 },
  printTitle: { fontSize: 20, fontWeight: 700, color: "#000", margin: "0 0 6px 0" },
  printMeta: { fontSize: 12, color: "#555", marginBottom: 16 },
  printTable: { width: "100%", borderCollapse: "collapse" },
  printTh: { border: "1px solid #999", padding: "6px 10px", background: "#eee", fontSize: 13, textAlign: "right" },
  printTd: { border: "1px solid #999", padding: "6px 10px", fontSize: 13, textAlign: "right" },
  printFooter: { marginTop: 20, fontSize: 11, color: "#555", textAlign: "center" },
  filterSelect: { padding: "7px 10px", fontSize: 13, border: `1px solid ${colors.border}`, borderRadius: 4, background: "#fff", color: colors.navySoft },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: colors.gray,
    fontSize: 14,
    background: colors.card,
    border: `1px dashed ${colors.border}`,
    borderRadius: 4,
  },
  tableWrap: { display: "flex", flexDirection: "column", gap: 10 },
  row: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    padding: "16px 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    flexWrap: "wrap",
  },
  rowMain: { flex: "1 1 400px" },
  rowTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  raqmBadge: { fontWeight: 700, color: colors.navy, fontSize: 15 },
  noo3Badge: { fontSize: 12, padding: "3px 10px", borderRadius: 3, background: "#EFECE3", color: colors.navySoft },
  halaBadge: { fontSize: 12, padding: "3px 10px", borderRadius: 3, fontWeight: 600 },
  halaMotaba3a: { background: colors.tealBg, color: colors.teal },
  halaTathkeer: { background: colors.amberBg, color: colors.amber },
  halaMoghlaq: { background: "#EAEAEA", color: "#6B6B6B" },
  dueTag: { fontSize: 11, padding: "2px 8px", borderRadius: 3, background: colors.danger, color: "#fff", fontWeight: 600 },
  ijraaText: { fontSize: 14, color: colors.text, lineHeight: 1.6, marginBottom: 6 },
  rowMeta: { fontSize: 12, color: colors.gray },
  rowActions: { display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" },
  rowSelect: { padding: "6px 10px", fontSize: 13, border: `1px solid ${colors.border}`, borderRadius: 4, background: "#fff", color: colors.navySoft },
  deleteBtn: {
    padding: "6px 10px",
    fontSize: 12,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    background: "#fff",
    color: colors.danger,
    cursor: "pointer",
  },
};
