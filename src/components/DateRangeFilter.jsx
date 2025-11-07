import React from "react";

/**
 * A reusable date range filter component.
 * Props:
 * - startDate: current start date value
 * - endDate: current end date value
 * - onStartDateChange: function(dateString)
 * - onEndDateChange: function(dateString)
 * - label (optional): custom label text
 */
export default function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range",
}) {
  return (
    <div className="date-range-filter filter-group">
      <label className="filter-label">{label}:</label>
      <div className="date-range-inputs">
        <div className="date-input-wrapper">
          <label>Start:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="date-input-wrapper">
          <label>End:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
