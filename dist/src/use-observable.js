"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useObservable = void 0;
const react_1 = require("react");
const useObservable = (observable$) => {
    const [value, setValue] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const subscription = observable$.subscribe((v) => setValue(v));
        return () => subscription.unsubscribe();
    }, [observable$]);
    return value;
};
exports.useObservable = useObservable;
//# sourceMappingURL=use-observable.js.map