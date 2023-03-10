"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInject = exports.Module = exports.DIContext = void 0;
const React = require("react");
const conainer_1 = require("./conainer");
const react_1 = require("react");
exports.DIContext = (0, react_1.createContext)(conainer_1.globalContainer);
const Module = ({ providers = [], children }) => {
    const container = (0, react_1.useContext)(exports.DIContext);
    const newContainer = (0, react_1.useMemo)(() => new conainer_1.Container(container), [providers]);
    (0, react_1.useMemo)(() => {
        newContainer.registerProviders([...(providers || [])]);
    }, [providers]);
    return React.createElement(exports.DIContext.Provider, { value: newContainer }, children);
};
exports.Module = Module;
function useInject(token) {
    const container = (0, react_1.useContext)(exports.DIContext);
    return (0, react_1.useMemo)(() => container.inject(token), [token]);
}
exports.useInject = useInject;
//# sourceMappingURL=di-context-module.js.map