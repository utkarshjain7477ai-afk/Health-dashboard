import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFamily, saveFamily } from '../services/storage';

const C = { navy: '#0E1A38', accent: '#2563EB', text: '#0F172A', muted: '#475569', bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0' };
const RELATIONS = ['Spouse','Parent','Child','Sibling','Other'];

export default function AddMemberScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  const save = async () => {
    if (!name.trim() || !phone.trim()) return;
    const family = await getFamily();
    family.push({ name: name.trim(), phone: '+91' + phone.replace(/^\+91/, '').replace(/\D/g, ''), relation });
    await saveFamily(family);
    navigation.goBack();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={s.title}>Add Member</Text>
        <TouchableOpacity onPress={save}><Text style={s.saveBtn}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.body} contentContainerStyle={{ padding: 20 }}>
        <Text style={s.label}>Name</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Member's name" placeholderTextColor="#6B7280" />

        <Text style={s.label}>Phone</Text>
        <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit number" placeholderTextColor="#6B7280" />

        <Text style={s.label}>Relation</Text>
        <View style={s.chips}>
          {RELATIONS.map(r => (
            <TouchableOpacity key={r} style={[s.chip, relation === r && s.chipActive]} onPress={() => setRelation(r)}>
              <Text style={[s.chipText, relation === r && s.chipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  cancel: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  saveBtn: { fontSize: 15, fontWeight: '700', color: C.accent },
  body: { flex: 1, backgroundColor: C.bg },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: C.muted, marginBottom: 8, marginTop: 18 },
  input: { backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  chipActive: { borderColor: C.accent, backgroundColor: '#EFF6FF' },
  chipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  chipTextActive: { color: C.accent },
});
