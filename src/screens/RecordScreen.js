import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PORTAL_URL } from '../services/api';

export default function RecordScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { pid, phone } = route.params || {};
  const url = PORTAL_URL(pid, phone);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.back}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.85)" />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <WebView source={{ uri: url }} style={s.web} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1A38' },
  bar: { height: 52, backgroundColor: '#0E1A38', justifyContent: 'center', paddingHorizontal: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  web: { flex: 1 },
});
