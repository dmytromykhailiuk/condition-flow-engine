import * as React from 'react';
import { Container, ProviderOptions } from './conainer';
export declare const DIContext: React.Context<Container>;
export declare const Module: ({ providers, children }: {
    providers?: ProviderOptions[];
    children: any;
}) => JSX.Element;
export declare function useInject<T>(token: any): T;
