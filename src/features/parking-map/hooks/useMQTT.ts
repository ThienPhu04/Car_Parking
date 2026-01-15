import { useEffect, useCallback, useRef } from 'react';
import { mqttService } from '../../../services/mqtt/mqttClient';
import { SlotUpdateMessage } from '../../../types/mqtt.types';

export const useMQTT = (
  topic: string,
  onMessage: (message: SlotUpdateMessage) => void,
  autoConnect: boolean = true
) => {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (autoConnect && mqttService.isClientConnected()) {
      subscribe();
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [topic, autoConnect]);

  const subscribe = useCallback(() => {
    unsubscribeRef.current = mqttService.subscribe(topic, onMessage);
  }, [topic, onMessage]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const publish = useCallback((message: any, qos: 0 | 1 | 2 = 0) => {
    mqttService.publish(topic, message, qos);
  }, [topic]);

  return {
    subscribe,
    unsubscribe,
    publish,
    isConnected: mqttService.isClientConnected(),
  };
};