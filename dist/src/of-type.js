"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ofType = void 0;
const rxjs_1 = require("rxjs");
const ofType = (typeToCompare) => (source$) => source$.pipe((0, rxjs_1.filter)((action) => action.type === typeToCompare || action === typeToCompare));
exports.ofType = ofType;
//# sourceMappingURL=of-type.js.map