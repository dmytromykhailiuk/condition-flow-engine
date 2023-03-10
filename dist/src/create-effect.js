"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEffect = void 0;
const createEffect = (fn, obj = { dispatch: true }) => ({ ...obj, effect: fn() });
exports.createEffect = createEffect;
//# sourceMappingURL=create-effect.js.map