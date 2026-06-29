// WebSocket client with reconnection, heartbeat, and message queuing

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface QueuedMessage {
  event: string;
  data: unknown;
}

type EventHandler<T = unknown> = (data: T) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string = '';
  private state: ConnectionState = 'disconnected';
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectDelay: number = 30000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  public onStateChange?: (state: ConnectionState) => void;

  get connectionState(): ConnectionState {
    return this.state;
  }

  connect(url: string, token: string): void {
    this.url = url;
    this.token = token;
    this.setState('connecting');

    const wsUrl = `${url}?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.flushQueue();
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data as string) as {
          event: string;
          data: unknown;
        };

        const handlers = this.listeners.get(parsed.event);
        if (handlers) {
          handlers.forEach((handler) => handler(parsed.data));
        }
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.stopHeartbeat();
      // Code 1000 = normal closure, 1001 = going away — don't reconnect
      if (event.code !== 1000 && event.code !== 1001) {
        this.reconnect();
      } else {
        this.setState('disconnected');
      }
    };

    this.ws.onerror = (error: Event) => {
      console.error('[WebSocket] Error:', error);
    };
  }

  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  send(event: string, payload: unknown): void {
    const message: QueuedMessage = { event, data: payload };

    if (this.state !== 'connected' || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  disconnect(): void {
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.setState('disconnected');
  }

  private reconnect(): void {
    if (this.state === 'reconnecting') {
      return;
    }

    this.setState('reconnecting');

    // Exponential backoff with jitter
    const baseDelay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    const jitter = Math.random() * baseDelay * 0.5;
    const delay = baseDelay + jitter;

    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(this.url, this.token);
    }, delay);
  }

  private flushQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const queued = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of queued) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: 'ping', data: {} }));
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private setState(newState: ConnectionState): void {
    this.state = newState;
    this.onStateChange?.(newState);
  }
}
