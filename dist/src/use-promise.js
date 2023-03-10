"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePromise = void 0;
const react_1 = require("react");
const usePromise = (promise) => {
    const [value, setValue] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const promiseFromContext = promise;
        promiseFromContext.then((result) => {
            if (promiseFromContext === promise)
                setValue(result);
        });
    }, [promise]);
    return value;
};
exports.usePromise = usePromise;
//# sourceMappingURL=use-promise.js.map