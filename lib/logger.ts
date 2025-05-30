import * as appInsights from 'applicationinsights';

type SeverityLevel = 'Verbose' | 'Information' | 'Warning' | 'Error' | 'Critical';

class Logger {
    private static instance: Logger;
    private client: appInsights.TelemetryClient | null = null;

    private constructor() {
        if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            const setup = appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectConsole(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectExceptions(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectPerformance(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectRequests(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectDependencies(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoDependencyCorrelation(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setUseDiskRetryCaching(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setInternalLogging(true, true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.start();

            this.client = appInsights.defaultClient;
        }
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public log(message: string, severity: SeverityLevel = 'Verbose', properties?: { [key: string]: any }) {
        if (this.client) {
            this.client.trackTrace({
                message,
                severity,
                properties
            });
        }
        // Always log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[${severity}] ${message}`, properties || '');
        }
    }

    public error(error: Error | string, properties?: { [key: string]: any }) {
        if (this.client) {
            if (error instanceof Error) {
                this.client.trackException({
                    exception: error,
                    properties
                });
            } else {
                this.client.trackException({
                    exception: new Error(error),
                    properties
                });
            }
        }
        // Always log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.error(error, properties || '');
        }
    }

    public trackEvent(name: string, properties?: { [key: string]: any }) {
        if (this.client) {
            this.client.trackEvent({ name, properties });
        }
        // Always log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Event] ${name}`, properties || '');
        }
    }

    public trackMetric(name: string, value: number, properties?: { [key: string]: any }) {
        if (this.client) {
            this.client.trackMetric({ name, value, properties });
        }
        // Always log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Metric] ${name}: ${value}`, properties || '');
        }
    }

    public trackDependency(name: string, duration: number, success: boolean, properties?: { [key: string]: any }) {
        if (this.client) {
            this.client.trackDependency({
                name,
                duration,
                success,
                properties
            });
        }
        // Always log to console in development
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Dependency] ${name} (${duration}ms) - ${success ? 'Success' : 'Failed'}`, properties || '');
        }
    }
}

export const logger = Logger.getInstance(); 