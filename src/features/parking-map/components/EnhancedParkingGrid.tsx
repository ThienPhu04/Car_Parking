import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import type { FloorLayout, ParkingSlot, Position } from '../../../types/parking.types';
import {
  buildParkingMap3DLayoutData,
  buildParkingMap3DViewState,
} from '../utils/parkingMap3DData';
import { generateThreeJSHTML } from '../utils/parkingMap3DTemplate';

interface EnhancedParkingGridProps {
  layout: FloorLayout;
  selectedSlot: ParkingSlot | null;
  navigationPath: Position[] | null;
  onSlotPress: (slot: ParkingSlot) => void;
  onCellPress?: (x: number, y: number) => void;
}

export const EnhancedParkingGrid: React.FC<EnhancedParkingGridProps> = ({
  layout,
  selectedSlot,
  navigationPath,
  onSlotPress,
  onCellPress: _onCellPress,
}) => {
  const webviewRef = useRef<WebView<unknown> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const parkingData = useMemo(() => buildParkingMap3DLayoutData(layout), [layout]);
  const viewState = useMemo(
    () => buildParkingMap3DViewState(selectedSlot, navigationPath),
    [navigationPath, selectedSlot],
  );
  const html = useMemo(() => generateThreeJSHTML(parkingData), [parkingData]);

  useEffect(() => {
    setIsReady(false);
  }, [html]);

  const handleSlotSelect = useCallback(
    (slotId: string) => {
      const matchedSlot = layout.slots.find(slot => slot.id === slotId || slot.code === slotId);
      if (matchedSlot) {
        onSlotPress(matchedSlot);
      }
    },
    [layout.slots, onSlotPress],
  );

  const syncViewState = useCallback(() => {
    if (!isReady || !webviewRef.current) {
      return;
    }

    const payload = JSON.stringify(viewState ?? { selectedSlotId: null, route: [] })
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");

    webviewRef.current.injectJavaScript(
      `window.__updateParkingMapState('${payload}' ? JSON.parse('${payload}') : {}); true;`,
    );
  }, [isReady, viewState]);

  useEffect(() => {
    syncViewState();
  }, [syncViewState]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          slotId?: string;
          type?: string;
        };
        if (data.type === 'SLOT_SELECTED' && data.slotId) {
          handleSlotSelect(data.slotId);
        }
      } catch (error) {
        // Ignore malformed bridge payloads from the WebView.
      }
    },
    [handleSlotSelect],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.webview}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        onMessage={handleMessage}
        onLoadEnd={() => setIsReady(true)}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0f1111ff" />
          </View>
        )}
        allowsInlineMediaPlayback
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f3f7ff',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f3f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
