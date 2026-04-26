import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={s.container}>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.sub}>Please restart the app.</Text>
          <TouchableOpacity
            style={s.btn}
            onPress={() => this.setState({ error: null })}
            accessibilityLabel="Try again"
            accessibilityRole="button"
          >
            <Text style={s.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F1F5F9' },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  sub: { fontSize: 15, color: '#475569', marginBottom: 24, textAlign: 'center' },
  btn: { backgroundColor: '#2563EB', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
