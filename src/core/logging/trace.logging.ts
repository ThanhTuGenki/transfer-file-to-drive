import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Trace Context Interface
 */
export interface TraceContext {
  traceId: string;
  userId?: string;
  operation?: string;
  requestMethod?: string;
  requestPath?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Trace Context Manager using AsyncLocalStorage
 * Provides request tracing capabilities across async operations
 */
export class TraceContextManager {
  private static readonly storage = new AsyncLocalStorage<TraceContext>();

  /**
   * Run code within a trace context
   */
  static run<T>(context: TraceContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Set the trace context for the current async execution chain
   */
  static enterWith(context: TraceContext) {
    this.storage.enterWith(context);
  }

  /**
   * Get current trace context
   */
  static getContext(): TraceContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Get current trace ID
   */
  static getTraceId(): string | undefined {
    return this.getContext()?.traceId;
  }

  /**
   * Get current user ID
   */
  static getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  /**
   * Get current operation
   */
  static getOperation(): string | undefined {
    return this.getContext()?.operation;
  }

  /**
   * Update current context
   */
  static updateContext(updates: Partial<TraceContext>): void {
    const current = this.getContext();
    if (current) {
      Object.assign(current, updates);
    }
  }

  /**
   * Generate a new trace ID
   */
  static generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `trace_${timestamp}_${random}`;
  }

  /**
   * Generate a correlation ID
   */
  static generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `corr_${timestamp}_${random}`;
  }

  /**
   * Create trace context from request headers
   */
  static createFromHeaders(
    headers: Record<string, string | undefined>
  ): TraceContext {
    const context: TraceContext = {
      traceId: headers["x-trace-id"] || this.generateTraceId(),
    };

    // Only add defined values
    if (headers["x-user-id"]) context.userId = headers["x-user-id"];
    if (headers["x-operation"]) context.operation = headers["x-operation"];
    if (headers["x-request-method"])
      context.requestMethod = headers["x-request-method"];
    if (headers["x-request-path"])
      context.requestPath = headers["x-request-path"];
    if (headers["user-agent"]) context.userAgent = headers["user-agent"];
    if (headers["x-forwarded-for"]) {
      context.ip = headers["x-forwarded-for"];
    } else if (headers["x-real-ip"]) {
      context.ip = headers["x-real-ip"];
    }

    return context;
  }

  /**
   * Check if we're currently in a trace context
   */
  static hasContext(): boolean {
    return this.getContext() !== undefined;
  }

  /**
   * Get context as object for logging
   */
  static getContextForLogging(): Record<string, any> {
    const context = this.getContext();
    if (!context) return {};

    return {
      traceId: context.traceId,
      userId: context.userId,
      operation: context.operation,
      requestMethod: context.requestMethod,
      requestPath: context.requestPath,
      ip: context.ip,
    };
  }
}

/**
 * Decorator for automatically adding trace context to methods
 */
export function WithTrace(operation?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (TraceContextManager.hasContext()) {
        // Update operation if provided
        if (operation) {
          TraceContextManager.updateContext({ operation });
        }
        return originalMethod.apply(this, args);
      } else {
        // Create new trace context if none exists
        const traceId = TraceContextManager.generateTraceId();
        const context: TraceContext = {
          traceId,
          operation: operation || `${target.constructor.name}.${propertyKey}`,
        };

        return TraceContextManager.run(context, () => {
          return originalMethod.apply(this, args);
        });
      }
    };

    return descriptor;
  };
}

export default TraceContextManager;
