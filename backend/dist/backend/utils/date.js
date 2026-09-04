"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateIsoInTimeZone = getDateIsoInTimeZone;
function getDateIsoInTimeZone(timeZone = "UTC", date = new Date()) {
    try {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const parts = formatter.formatToParts(date);
        const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
        return `${values.year}-${values.month}-${values.day}`;
    }
    catch {
        return new Date(date).toISOString().split("T")[0];
    }
}
//# sourceMappingURL=date.js.map