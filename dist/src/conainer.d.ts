interface Class<T = any, F extends Array<any> = any[]> {
    injectDependencies?: F;
    new (...args: F): T;
}
interface DefaultProviderOptions<T extends Class = any> {
    provider: T;
    multi?: boolean;
}
interface UseClassProviderOptions<T extends Class = any, F extends Class = any> extends DefaultProviderOptions<T> {
    useClass: F;
}
interface UseValueProviderOptions<T = any, F = any> extends DefaultProviderOptions {
    provider: T;
    useValue: F;
}
interface UseExistingProviderOptions<T = any, F = any> extends DefaultProviderOptions {
    provider: T;
    useExisting: F;
}
interface UseFactoryProviderOptions<T extends Class = any, F = any, R extends Array<any> = any[]> extends DefaultProviderOptions<T> {
    useFactory: F;
    deps?: R;
}
export type ProviderOptions<F = any, T extends Class = Class<F>> = UseClassProviderOptions | UseValueProviderOptions | UseExistingProviderOptions | UseFactoryProviderOptions | T;
export declare class Container {
    private parentContainer?;
    private instances;
    private providersToRegister;
    private providersWithParentDepsInInstances;
    private parentDepsInInstances;
    private requiredDepsForProvidersToRegister;
    private callbacks;
    constructor(parentContainer?: Container);
    onProviderRegistered(callback: (token: any) => void): void;
    inject<T = any>(token: any): T;
    has(token: any): boolean;
    registerProviders(providers: ProviderOptions[]): void;
    registerProvider(providerOptions: ProviderOptions): void;
    private setInstance;
    private registerValue;
    private registerDefaultProvider;
    private registerUseClassProvider;
    private registerUseFactoryProvider;
    private registerUseExistingProvider;
    private registerCreationProvider;
    private setRequiredDepsForProvidersToRegister;
    private setParentDepsInInstances;
    private getDepsMetadata;
    private tryRegisterProviders;
    private tryRegisterDependentProviders;
}
export declare const globalContainer: Container;
export {};
