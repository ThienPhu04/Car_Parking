import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { CONFIG } from '../../shared/constants/config';
import { MQTTConfig, MQTTMessage, SlotUpdateMessage } from '../../types/mqtt.types';

type MessageHandler = (message: SlotUpdateMessage) => void;

class MQTTService {
  private client: MqttClient | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(config?: Partial<MQTTConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: IClientOptions = {
        clientId: config?.clientId || `smartparking_${Date.now()}`,
        username: config?.username || CONFIG.MQTT_USERNAME,
        password: config?.password || CONFIG.MQTT_PASSWORD,
        reconnectPeriod: config?.reconnectPeriod || CONFIG.MQTT_RECONNECT_PERIOD,
        connectTimeout: config?.connectTimeout || CONFIG.MQTT_CONNECT_TIMEOUT,
        clean: true,
        keepalive: 60,
      };

      try {
        this.client = mqtt.connect(
          config?.brokerUrl || CONFIG.MQTT_BROKER_URL,
          options
        );

        this.client.on('connect', () => {
          console.log('✅ MQTT Connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.client.on('error', (error: any) => {
          console.error('❌ MQTT Error:', error);
          if (!this.isConnected) {
            reject(error);
          }
        });

        this.client.on('close', () => {
          console.log('🔌 MQTT Connection closed');
          this.isConnected = false;
        });

        this.client.on('reconnect', () => {
          this.reconnectAttempts++;
          console.log(`🔄 MQTT Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.disconnect();
            console.error('❌ Max reconnect attempts reached');
          }
        });

        this.client.on('message', this.handleMessage.bind(this));
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.end(true);
      this.client = null;
      this.isConnected = false;
      this.handlers.clear();
      console.log('🔌 MQTT Disconnected');
    }
  }

  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ MQTT not connected, cannot subscribe to:', topic);
      return () => {};
    }

    this.client.subscribe(topic, (err: any) => {
      if (err) {
        console.error('❌ MQTT Subscribe error:', err);
      } else {
        console.log('✅ Subscribed to:', topic);
      }
    });

    // Store handler
    const handlers = this.handlers.get(topic) || [];
    handlers.push(handler);
    this.handlers.set(topic, handlers);

    // Return unsubscribe function
    return () => this.unsubscribe(topic, handler);
  }

  unsubscribe(topic: string, handler?: MessageHandler): void {
    if (handler) {
      // Remove specific handler
      const handlers = this.handlers.get(topic) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      if (handlers.length === 0) {
        this.handlers.delete(topic);
        this.client?.unsubscribe(topic);
        console.log('🔕 Unsubscribed from:', topic);
      }
    } else {
      // Remove all handlers for topic
      this.handlers.delete(topic);
      this.client?.unsubscribe(topic);
      console.log('🔕 Unsubscribed from:', topic);
    }
  }

  publish(topic: string, message: any, qos: 0 | 1 | 2 = 0): void {
    if (!this.client || !this.isConnected) {
      console.warn('⚠️ MQTT not connected, cannot publish to:', topic);
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.client.publish(topic, payload, { qos }, (err: any) => {
      if (err) {
        console.error('❌ MQTT Publish error:', err);
      } else {
        console.log('📤 Published to:', topic);
      }
    });
  }

  private handleMessage(topic: string, payload: Buffer): void {
    try {
      const message: SlotUpdateMessage = JSON.parse(payload.toString());
      
      // Find matching handlers
      const handlers = this.handlers.get(topic) || [];
      handlers.forEach(handler => handler(message));

      // Check wildcard subscriptions
      this.handlers.forEach((handlers, subscribedTopic) => {
        if (this.topicMatches(subscribedTopic, topic)) {
          handlers.forEach(handler => handler(message));
        }
      });
    } catch (error) {
      console.error('❌ Error parsing MQTT message:', error);
    }
  }

  private topicMatches(pattern: string, topic: string): boolean {
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    if (patternParts.length !== topicParts.length) {
      return false;
    }

    return patternParts.every((part, i) => {
      return part === '+' || part === topicParts[i];
    });
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }
}

export const mqttService = new MQTTService();