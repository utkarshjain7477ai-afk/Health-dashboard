import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PORTAL_URL } from '../services/api';
import { getAuthToken } from '../services/storage';

export default function RecordScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { pid, phone } = route.params || {};
  const url = PORTAL_URL(pid);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getAuthToken().then((t) => { setToken(t || ''); setReady(true); });
  }, []);

  if (!ready) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  // Push the Bearer token + phone into the WebView's localStorage so the
  // server-rendered portal page can attach `Authorization: Bearer …` to
  // /upload-rx and /upload-report calls (the backend now requires it).
  const injectBefore = `
    try {
      ${token ? `localStorage.setItem('px_auth_token', ${JSON.stringify(token)});` : ''}
      ${phone ? `localStorage.setItem('px_phone', ${JSON.stringify(phone)});` : ''}
    } catch (e) {}
    true;
  `;

  return (
    <View style={s.root}>
      <WebView
        source={{ uri: url }}
        style={s.web}
        injectedJavaScriptBeforeContentLoaded={injectBefore}
        sharedCookiesEnabled
        domStorageEnabled
      />
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[s.back, { bottom: Math.max(insets.bottom + 16, 28) }]}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.9)" />
        <Text style={s.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1A38' },
  web: { flex: 1 },
  back: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14,26,56,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  backText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
});
