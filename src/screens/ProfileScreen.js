import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile, saveProfile } from '../services/storage';

const C = { navy: '#0E1A38', accent: '#2563EB', text: '#0F172A', muted: '#475569', bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0' };

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COMORBIDITIES = ['Hypertension','Diabetes','Heart Disease','Kidney Disease','Asthma','Thyroid'];

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [blood, setBlood] = useState('');
  const [allergy, setAllergy] = useState('');
  const [comorbid, setComorbid] = useState([]);

  useEffect(() => {
    getProfile().then(p => {
      setName(p.px_name || '');
      setPhone((p.px_phone || '').replace(/^\+91/, ''));
      setBlood(p.px_blood_group || '');
      setAllergy(p.px_allergies || '');
      setComorbid(p.px_comorbidities || []);
    });
  }, []);

  const toggleComorbid = (c) => {
    setComorbid(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const save = async () => {
    await saveProfile({ px_name: name, px_phone: phone ? '+91' + phone.replace(/^\+91/, '') : '', px_blood_group: blood, px_allergies: allergy, px_comorbidities: comorbid });
    navigation.goBack();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} accessibilityLabel="Cancel" accessibilityRole="button"><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={s.title}>Profile</Text>
        <TouchableOpacity onPress={save} style={s.headerBtn} accessibilityLabel="Save profile" accessibilityRole="button"><Text style={s.saveBtn}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.body} contentContainerStyle={{ padding: 20 }}>
        <Text style={s.label}>Name</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#6B7280" />

        <Text style={s.label}>Phone</Text>
        <TextInput style={s.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit number" placeholderTextColor="#6B7280" />

        <Text style={s.label}>Blood Group</Text>
        <View style={s.chips}>
          {BLOOD_GROUPS.map(b => (
            <TouchableOpacity key={b} style={[s.chip, blood === b && s.chipActive]} onPress={() => setBlood(b)} accessibilityLabel={`Blood group ${b}`} accessibilityRole="button" accessibilityState={{ selected: blood === b }}>
              <Text style={[s.chipText, blood === b && s.chipTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Allergies</Text>
        <TextInput style={s.input} value={allergy} onChangeText={setAllergy} placeholder="e.g. Penicillin, Dust" placeholderTextColor="#6B7280" />

        <Text style={s.label}>Conditions</Text>
        <View style={s.chips}>
          {COMORBIDITIES.map(c => (
            <TouchableOpacity key={c} style={[s.chip, comorbid.includes(c) && s.chipActive]} onPress={() => toggleComorbid(c)} accessibilityLabel={c} accessibilityRole="checkbox" accessibilityState={{ checked: comorbid.includes(c) }}>
              <Text style={[s.chipText, comorbid.includes(c) && s.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  headerBtn: { minHeight: 44, minWidth: 60, justifyContent: 'center' },
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
