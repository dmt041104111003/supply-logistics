"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePkh = normalizePkh;
exports.normalizeOutputAmount = normalizeOutputAmount;
function normalizePkh(p) {
    if (typeof p !== "string")
        return "";
    let h = p.toLowerCase().trim().replace(/^0x/, "");
    if (h.startsWith("5820"))
        h = h.slice(4);
    return /^[0-9a-f]{56}$/.test(h) ? h : "";
}
function normalizeOutputAmount(amount) {
    var _a;
    const list = Array.isArray(amount) ? amount : [];
    const lovelace = list.find((a) => a.unit === "lovelace");
    const others = list
        .filter((a) => a.unit !== "lovelace")
        .map((a) => {
        var _a;
        return ({
            unit: a.unit,
            quantity: String((_a = a.quantity) !== null && _a !== void 0 ? _a : "0"),
        });
    });
    const lovelaceQty = lovelace != null ? String((_a = lovelace.quantity) !== null && _a !== void 0 ? _a : "0") : "0";
    return [{ unit: "lovelace", quantity: lovelaceQty }, ...others];
}
//# sourceMappingURL=order.utils.js.map