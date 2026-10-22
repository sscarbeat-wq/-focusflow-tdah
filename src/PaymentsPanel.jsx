import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Undo2 } from "lucide-react";
import { addPayment, removePayment, paymentsDueSoon, markPaid, unmarkPaid } from "./paymentsLog";

// Recordatorio de pagos/suscripciones (inspirado en Mint) — lista manual de
// pagos recurrentes con aviso antes de la fecha, pensada para el "impuesto
// TDAH" de cargos por pago tardío o suscripciones olvidadas. A propósito NO
// se conecta a ninguna cuenta bancaria ni API financiera real: el monto es
// solo texto de referencia que tú misma escribes. Si está próximo a vencer
// (3 días antes o el mismo día), además de aparecer aquí también se avisa
// por notificación push dentro del recordatorio diario (ver
// api/send-reminders.js).
export default function PaymentsPanel({ C, t, payments, paidLog, onAdd, onRemove, onMarkPaid, onUnmarkPaid }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("mensual");
  const [dueDay, setDueDay] = useState("");
  const [dueMonth, setDueMonth] = useState("1");
  const [notes, setNotes] = useState("");

  const dueSoon = paymentsDueSoon(payments, paidLog);

  const handleAdd = () => {
    onAdd({ name, amount, frequency, dueDay, dueMonth: frequency === "anual" ? dueMonth : null, notes });
    setName("");
    setAmount("");
    setDueDay("");
    setNotes("");
  };

  const inputStyle = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "8px 10px",
    color: C.text,
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const btnGhost = {
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    padding: "7px 10px",
    color: C.text,
    fontSize: "12px",
    cursor: "pointer",
  };

  const btnPrimary = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: C.mint,
    border: "none",
    borderRadius: "6px",
    padding: "9px 14px",
    color: "#064e3b",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const months = t.payments.months;

  return (
    <div>
      <p style={{ fontSize: "11px", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5 }}>
        {t.payments.intro}
      </p>

      {dueSoon.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>{t.payments.dueSoonLabel}</p>
          {dueSoon.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                background: C.surfaceAlt,
                border: `1px solid ${C.border}`,
                borderRadius: "6px",
                padding: "10px 12px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "13px", color: C.text }}>
                {p.name}
                {p.amount ? ` — ${p.amount}` : ""}
                <span style={{ color: C.textMuted, marginLeft: "6px" }}>
                  ({p.daysUntil === 0 ? t.payments.dueToday : t.payments.dueInDays(p.daysUntil)})
                </span>
              </span>
              <button
                onClick={() => onMarkPaid(p.id, p.dueDateKey)}
                title={t.payments.markPaidTitle}
                style={{ ...btnGhost, display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
              >
                <CheckCircle2 size={13} /> {t.payments.markPaidButton}
              </button>
            </div>
          ))}
        </div>
      )}

      {payments && payments.length > 0 && (
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 8px", fontWeight: 600 }}>
            {t.payments.yourPayments}
          </p>
          {payments.map((p) => {
            const paidThisCycle = Boolean(paidLog && paidLog[p.id]);
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "8px 0",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div>
                  <span style={{ fontSize: "13px", color: C.text }}>{p.name}</span>
                  <span style={{ fontSize: "12px", color: C.textMuted, marginLeft: "8px" }}>
                    {p.amount ? `${p.amount} — ` : ""}
                    {p.frequency === "anual"
                      ? t.payments.yearly(p.dueDay, months[(p.dueMonth || 1) - 1])
                      : t.payments.monthly(p.dueDay)}
                  </span>
                  {p.notes && <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>{p.notes}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  {paidThisCycle && (
                    <button
                      onClick={() => onUnmarkPaid(p.id)}
                      title={t.payments.undoPaidTitle}
                      style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}
                    >
                      <Undo2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(p.id)}
                    title={t.payments.delete}
                    style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: C.surfaceAlt, borderRadius: "6px", padding: "14px" }}>
        <p style={{ fontSize: "12px", color: C.textMuted, margin: "0 0 10px", fontWeight: 600 }}>
          {t.payments.addTitle}
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.payments.namePlaceholder}
          style={{ ...inputStyle, width: "100%", marginBottom: "8px" }}
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t.payments.amountPlaceholder}
          style={{ ...inputStyle, width: "100%", marginBottom: "8px" }}
        />
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ ...inputStyle, flex: "1 1 100px" }}>
            <option value="mensual">{t.payments.monthlyOption}</option>
            <option value="anual">{t.payments.yearlyOption}</option>
          </select>
          {frequency === "anual" && (
            <select value={dueMonth} onChange={(e) => setDueMonth(e.target.value)} style={{ ...inputStyle, flex: "1 1 100px" }}>
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <input
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            placeholder={t.payments.dayPlaceholder}
            style={{ ...inputStyle, flex: "1 1 90px" }}
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.payments.notesPlaceholder}
          rows={2}
          style={{ ...inputStyle, width: "100%", resize: "vertical", marginBottom: "10px", display: "block" }}
        />
        <button onClick={handleAdd} disabled={!name.trim() || !dueDay} style={btnPrimary}>
          <Plus size={14} /> {t.payments.addButton}
        </button>
      </div>
    </div>
  );
}
