"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConditionsAndRunFlow = void 0;
const condition_functions_1 = require("./condition-functions");
const validateConditionsAndRunFlow = ({ validator, context, flowRunner, conditionsMap = {}, }) => {
    if (!validator) {
        return true;
    }
    if (Array.isArray(validator)) {
        return validator.every((validatorObject) => (0, exports.validateConditionsAndRunFlow)({ conditionsMap, flowRunner, validator: validatorObject, context }));
    }
    if ((0, condition_functions_1.validateCondition)({
        condition: validator.conditionToIgnore,
        globalContext: context,
        conditionsMap,
    })) {
        return true;
    }
    const isSuccess = (0, condition_functions_1.validateCondition)({
        condition: validator.conditionToValidate,
        globalContext: context,
        conditionsMap,
    });
    if (isSuccess && validator.onSuccess) {
        flowRunner(validator.onSuccess, context);
        return false;
    }
    if (!isSuccess && validator.onFailure) {
        flowRunner(validator.onFailure, context);
        return false;
    }
    return true;
};
exports.validateConditionsAndRunFlow = validateConditionsAndRunFlow;
//# sourceMappingURL=validate-conditions-and-run-flow.js.map