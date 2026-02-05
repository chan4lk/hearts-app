type SeverityLevel = 'Verbose' | 'Information' | 'Warning' | 'Error' | 'Critical';

// Lazy load Application Insights only on server-side
let appInsights: any = null;
let appInsightsLoaded = false;

async function loadApplicationInsights() {
    // Only load on server-side and if connection string is provided
    if (typeof window !== 'undefined' || !process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
        return null;
    }

    if (!appInsightsLoaded) {
        try {
            appInsightsLoaded = true;
            // Dynamic import only on server-side
            appInsights = await import('applicationinsights');
            return appInsights;
        } catch (error) {
            // Gracefully handle if Application Insights fails to load
            console.error('[Logger] Failed to load Application Insights:', error);
            return null;
        }
    }

    return appInsights;
}

class Logger {
    private static instance: Logger;
    private client: any = null;
    private initPromise: Promise<void> | null = null;

    private constructor() {
        // Initialize Application Insights asynchronously
        this.initPromise = this.initializeApplicationInsights();
    }

    private async initializeApplicationInsights() {
        const ai = await loadApplicationInsights();
        if (!ai) return;

        try {
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            const setup = ai.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectConsole(false); // Disable to avoid conflicts
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectExceptions(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectPerformance(false); // Disable for Next.js compatibility
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectRequests(false); // Disable for Next.js compatibility
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoCollectDependencies(false); // Disable for Next.js compatibility
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setAutoDependencyCorrelation(false); // Disable for Next.js compatibility
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setUseDiskRetryCaching(true);
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.setInternalLogging(false, false); // Disable internal logging
            // @ts-ignore - Application Insights SDK has incorrect TypeScript definitions
            setup.start();

            this.client = ai.defaultClient;
        } catch (error) {
            // Gracefully handle initialization errors
            console.error('[Logger] Failed to initialize Application Insights:', error);
            this.client = null;
        }
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public log(message: string, severity: SeverityLevel = 'Verbose', properties?: { [key: string]: any }) {
        // Sanitize sensitive data from properties
        const sanitizedProperties = this.sanitizeProperties(properties);
        
        // Track to Application Insights (non-blocking)
        if (this.client) {
            try {
                this.client.trackTrace({
                    message,
                    severity,
                    properties: sanitizedProperties
                });
            } catch (error) {
                // Ignore Application Insights errors
            }
        }
        
        // Only log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${severity}] ${message}`, sanitizedProperties || '');
        }
    }

    public error(error: Error | string, properties?: { [key: string]: any }) {
        // Sanitize sensitive data from properties
        const sanitizedProperties = this.sanitizeProperties(properties);
        
        // Track to Application Insights (non-blocking)
        if (this.client) {
            try {
                if (error instanceof Error) {
                    this.client.trackException({
                        exception: error,
                        properties: sanitizedProperties
                    });
                } else {
                    this.client.trackException({
                        exception: new Error(error),
                        properties: sanitizedProperties
                    });
                }
            } catch (err) {
                // Ignore Application Insights errors
            }
        }
        
        // Always log errors to console (even in production) but sanitized
        if (error instanceof Error) {
            console.error(`[Error] ${error.message}`, sanitizedProperties || '');
        } else {
            console.error(`[Error] ${error}`, sanitizedProperties || '');
        }
    }

    public warn(message: string, properties?: { [key: string]: any }) {
        // Sanitize sensitive data from properties
        const sanitizedProperties = this.sanitizeProperties(properties);
        
        // Track to Application Insights as a warning trace (non-blocking)
        if (this.client) {
            try {
                this.client.trackTrace({
                    message,
                    severity: 'Warning',
                    properties: sanitizedProperties
                });
            } catch (error) {
                // Ignore Application Insights errors
            }
        }
        
        // Only log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[Warning] ${message}`, sanitizedProperties || '');
        }
    }

    public trackEvent(name: string, properties?: { [key: string]: any }) {
        const sanitizedProperties = this.sanitizeProperties(properties);
        
        if (this.client) {
            try {
                this.client.trackEvent({ name, properties: sanitizedProperties });
            } catch (error) {
                // Ignore Application Insights errors
            }
        }
        
        // Only log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Event] ${name}`, sanitizedProperties || '');
        }
    }

    public trackMetric(name: string, value: number, properties?: { [key: string]: any }) {
        const sanitizedProperties = this.sanitizeProperties(properties);
        
        if (this.client) {
            try {
                this.client.trackMetric({ name, value, properties: sanitizedProperties });
            } catch (error) {
                // Ignore Application Insights errors
            }
        }
        
        // Only log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Metric] ${name}: ${value}`, sanitizedProperties || '');
        }
    }

    public trackDependency(name: string, duration: number, success: boolean, properties?: { [key: string]: any }) {
        const sanitizedProperties = this.sanitizeProperties(properties);
        
        if (this.client) {
            try {
                this.client.trackDependency({
                    name,
                    duration,
                    success,
                    properties: sanitizedProperties
                });
            } catch (error) {
                // Ignore Application Insights errors
            }
        }
        
        // Only log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Dependency] ${name} (${duration}ms) - ${success ? 'Success' : 'Failed'}`, sanitizedProperties || '');
        }
    }

    // Sanitize sensitive information from log properties
    private sanitizeProperties(properties?: { [key: string]: any }): { [key: string]: any } | undefined {
        if (!properties) return undefined;

        const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'auth', 'cookie', 'session', 'userId', 'email', 'id'];
        const sanitized = { ...properties };

        for (const key of Object.keys(sanitized)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
                sanitized[key] = '[REDACTED]';
            }
            // Also sanitize nested objects
            if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizeProperties(sanitized[key]);
            }
        }

        return sanitized;
    }
}

export const logger = Logger.getInstance(); 