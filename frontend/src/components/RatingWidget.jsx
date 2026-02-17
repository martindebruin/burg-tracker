const RATINGS = [
  { value: -2, label: "−2", title: "Besviken" },
  { value: -1, label: "−1", title: "Under förväntan" },
  { value:  0, label:  "0", title: "Som förväntat" },
  { value:  1, label: "+1", title: "Över förväntan" },
  { value:  2, label: "+2", title: "Exceptionellt" },
];

export function RatingWidget({ value, onChange }) {
  return (
    <div className="rating-widget">
      {RATINGS.map((r) => {
        const isActive = value === r.value;
        const cls = isActive
          ? r.value > 0 ? "active-pos" : r.value < 0 ? "active-neg" : "active-zero"
          : "";
        return (
          <button
            key={r.value}
            type="button"
            className={cls}
            title={r.title}
            onClick={() => onChange(isActive ? null : r.value)}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

export function RatingDisplay({ value }) {
  if (value === null || value === undefined) return null;
  const labels = { "-2": "Besviken", "-1": "Under förväntan", "0": "Som förväntat", "1": "Över förväntan", "2": "Exceptionellt" };
  const cls = value > 0 ? "rating-pos" : value < 0 ? "rating-neg" : "rating-zero";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`rating ${cls}`} title={labels[String(value)]}>
      {sign}{value}
    </span>
  );
}
