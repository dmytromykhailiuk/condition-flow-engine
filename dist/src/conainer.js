"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalContainer = exports.Container = void 0;
const isClass = (variable) => {
    var _a;
    return Boolean(typeof variable === 'function' &&
        variable.prototype &&
        !((_a = Object.getOwnPropertyDescriptor(variable, 'prototype')) === null || _a === void 0 ? void 0 : _a.writable));
};
class Container {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        this.instances = new Map();
        this.providersToRegister = new Map();
        this.providersWithParentDepsInInstances = new Map();
        this.parentDepsInInstances = new Map();
        this.requiredDepsForProvidersToRegister = new Map();
        this.callbacks = [];
        if (parentContainer) {
            parentContainer.onProviderRegistered((token) => this.tryRegisterProviders(token));
        }
    }
    onProviderRegistered(callback) {
        this.callbacks.push(callback);
    }
    inject(token) {
        if (this.instances.has(token)) {
            return this.instances.get(token);
        }
        if (this.parentContainer && this.parentContainer.has(token)) {
            return this.parentContainer.inject(token);
        }
    }
    has(token) {
        return this.instances.has(token) || (this.parentContainer && this.parentContainer.has(token));
    }
    registerProviders(providers) {
        providers.forEach((provider) => this.registerProvider(provider));
    }
    registerProvider(providerOptions) {
        if (isClass(providerOptions)) {
            this.registerDefaultProvider(providerOptions);
        }
        if (providerOptions.useValue) {
            return this.registerValue(providerOptions);
        }
        if (providerOptions.useClass) {
            return this.registerUseClassProvider(providerOptions);
        }
        if (providerOptions.useExisting) {
            return this.registerUseExistingProvider(providerOptions);
        }
        if (providerOptions.useFactory) {
            return this.registerUseFactoryProvider(providerOptions);
        }
    }
    setInstance(token, insnance, multi = false) {
        if (!multi && this.instances.has(token)) {
            throw Error(`You already have ${token} token in your container!`);
        }
        this.instances.set(token, !multi ? insnance : [...(this.inject(token) || []), insnance]);
        this.tryRegisterDependentProviders(token);
        this.tryRegisterProviders(token);
    }
    registerValue(providerOptions) {
        this.setInstance(providerOptions.provider, providerOptions.useValue, providerOptions.multi);
    }
    registerDefaultProvider(provider) {
        this.registerCreationProvider({
            provider,
            useClass: provider,
            deps: provider.injectDependencies || [],
        }, provider);
    }
    registerUseClassProvider(providerOptions) {
        this.registerCreationProvider(providerOptions, providerOptions.useClass);
    }
    registerUseFactoryProvider(providerOptions) {
        this.registerCreationProvider(providerOptions, providerOptions.useFactory, (a, args = []) => a(...args));
    }
    registerUseExistingProvider(providerOptions) {
        if (this.instances.has(providerOptions.provider)) {
            this.setInstance(providerOptions.provider, this.instances.get(providerOptions.provider), providerOptions.multi);
            return;
        }
        if (this.parentContainer && this.parentContainer.has(providerOptions.provider)) {
            this.providersWithParentDepsInInstances.set(providerOptions.provider, providerOptions);
            this.setParentDepsInInstances(providerOptions.provider, providerOptions.useExisting);
            this.setInstance(providerOptions.provider, this.parentContainer.inject(providerOptions.provider), providerOptions.multi);
            return;
        }
        this.setRequiredDepsForProvidersToRegister(providerOptions.provider, providerOptions.useExisting);
        this.providersToRegister.set(providerOptions.provider, providerOptions);
    }
    registerCreationProvider(providerOptions, creationEntity, creationFunction = (a, args = []) => new a(...args)) {
        var _a;
        if (!((_a = providerOptions === null || providerOptions === void 0 ? void 0 : providerOptions.deps) === null || _a === void 0 ? void 0 : _a.length)) {
            this.setInstance(providerOptions.provider, creationFunction(creationEntity), providerOptions.multi);
            return;
        }
        const depsMetadata = this.getDepsMetadata(providerOptions.deps);
        if (!depsMetadata.every((data) => {
            if (data.hasInstance) {
                return true;
            }
            this.setRequiredDepsForProvidersToRegister(providerOptions.provider, data.token);
            return false;
        })) {
            this.providersToRegister.set(providerOptions.provider, providerOptions);
            return;
        }
        if (depsMetadata.filter(({ isParent }) => isParent).length) {
            this.providersWithParentDepsInInstances.set(providerOptions.provider, providerOptions);
        }
        depsMetadata
            .filter(({ isParent }) => isParent)
            .forEach(({ token }) => this.setParentDepsInInstances(providerOptions.provider, token));
        this.setInstance(providerOptions.provider, creationFunction(creationEntity, depsMetadata.map(({ instance }) => instance)), providerOptions.multi);
    }
    setRequiredDepsForProvidersToRegister(providerToken, requiredToken) {
        if (this.requiredDepsForProvidersToRegister.has(requiredToken)) {
            const requiredDepsForProvidersToRegisterMap = this.requiredDepsForProvidersToRegister.get(requiredToken);
            requiredDepsForProvidersToRegisterMap.set(providerToken, true);
            this.requiredDepsForProvidersToRegister.set(requiredToken, requiredDepsForProvidersToRegisterMap);
        }
        else {
            this.requiredDepsForProvidersToRegister.set(requiredToken, new Map([[providerToken, true]]));
        }
    }
    setParentDepsInInstances(providerToken, requiredToken) {
        if (this.parentDepsInInstances.has(requiredToken)) {
            const parentDepsInInstancesMap = this.parentDepsInInstances.get(requiredToken);
            parentDepsInInstancesMap.set(providerToken, true);
            this.parentDepsInInstances.set(requiredToken, parentDepsInInstancesMap);
        }
        else {
            this.parentDepsInInstances.set(requiredToken, new Map([[providerToken, true]]));
        }
    }
    getDepsMetadata(deps) {
        return deps.map((token) => {
            if (this.instances.has(token)) {
                return {
                    token,
                    hasInstance: true,
                    instance: this.instances.get(token),
                    isParent: false,
                };
            }
            if (this.parentContainer && this.parentContainer.has(token)) {
                return {
                    token,
                    hasInstance: true,
                    instance: this.parentContainer.inject(token),
                    isParent: true,
                };
            }
            return {
                token,
                hasInstance: false,
                instance: undefined,
                isParent: true,
            };
        });
    }
    tryRegisterProviders(token) {
        if (this.requiredDepsForProvidersToRegister.has(token)) {
            Array.from(this.requiredDepsForProvidersToRegister.get(token))
                .filter(([providerToken]) => token !== providerToken)
                .forEach(([providerToken]) => {
                this.registerProvider(this.providersToRegister.get(providerToken));
            });
            this.requiredDepsForProvidersToRegister.delete(token);
        }
    }
    tryRegisterDependentProviders(token) {
        if (this.parentDepsInInstances.has(token)) {
            Array.from(this.parentDepsInInstances.get(token))
                .filter(([providerToken]) => token !== providerToken)
                .forEach(([providerToken]) => {
                this.registerProvider(this.providersWithParentDepsInInstances.get(providerToken));
            });
            this.parentDepsInInstances.delete(token);
        }
    }
}
exports.Container = Container;
exports.globalContainer = new Container();
//# sourceMappingURL=conainer.js.map