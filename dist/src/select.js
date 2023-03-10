"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.select = void 0;
const rxjs_1 = require("rxjs");
const select = (selector) => (source$) => source$.pipe((0, rxjs_1.map)((data) => selector(data)), (0, rxjs_1.distinctUntilChanged)());
exports.select = select;
//# sourceMappingURL=select.js.map