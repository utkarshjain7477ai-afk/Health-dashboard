import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile, saveProfile, getAuthToken, setAuthToken } from '../services/storage';
import { sendOtp, verifyOtp } from '../services/api';

let RNOtpVerify = null;
if (Platform.OS === 'android') {
  try { RNOtpVerify = require('react-native-otp-verify').default; } catch {}
}

const C = { navy: '#0E1A38', accent: '#2563EB', text: '#0F172A', muted: '#475569', bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0' };

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COMORBIDITIES = ['Hypertension','Diabetes','Heart Disease','Kidney Disease','Asthma','Thyroid'];

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savedPhone, setSavedPhone] = useState(''); // phone currently in storage
  const [blood, setBlood] = useState('');
  const [allergy, setAllergy] = useState('');
  const [comorbid, setComorbid] = useState([]);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // OTP modal state
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingData, setPendingData] = useState(null);
  const otpListenerActive = useRef(false);

  useEffect(() => {
    Promise.all([getProfile(), getAuthToken()]).then(([p, token]) => {
      setName(p.px_name || '');
      const raw = (p.px_phone || '').replace(/^\+91/, '');
      setPhone(raw);
      setSavedPhone(raw);
      setBlood(p.px_blood_group || '');
      setAllergy(p.px_allergies || '');
      setComorbid(p.px_comorbidities || []);
      setPhoneVerified(!!token);
    });
  }, []);

  const toggleComorbid = (c) => {
    setComorbid(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const commitSave = async (profileData) => {
    await saveProfile(profileData);
    navigation.goBack();
  };

  const startSmsListener = () => {
    if (!RNOtpVerify || otpListenerActive.current) return;
    otpListenerActive.current = true;
    RNOtpVerify.getOtp()
      .then(() => RNOtpVerify.addListener((message) => {
        const match = message?.match(/\b(\d{6})\b/);
        if (match) {
          setOtpCode(match[1]);
          stopSmsListener();
        }
      }))
      .catch(() => { otpListenerActive.current = false; });
  };

  const stopSmsListener = () => {
    if (!RNOtpVerify) return;
    try { RNOtpVerify.removeListener(); } catch {}
    otpListenerActive.current = false;
  };

  useEffect(() => () => stopSmsListener(), []);

  const save = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits && digits.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a 10-digit mobile number.');
      return;
    }

    const profileData = {
      px_name: name,
      px_phone: digits ? '+91' + digits : '',
      px_blood_group: blood,
      px_allergies: allergy,
      px_comorbidities: comorbid,
    };

    // If phone hasn't changed (or is empty), just save
    if (!digits || digits === savedPhone) {
      await commitSave(profileData);
      return;
    }

    // Phone changed — need OTP verification
    setPendingPhone(digits);
    setPendingData(profileData);
    setOtpCode('');
    setOtpSending(true);
    setOtpVisible(true);
    try {
      await sendOtp(digits);
      startSmsListener();
    } catch (e) {
      setOtpVisible(false);
      Alert.alert('Could not send OTP', e?.response?.data?.detail || e.message || 'Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Enter 6-digit OTP');
      return;
    }
    setOtpVerifying(true);
    try {
      const { token } = await verifyOtp(pendingPhone, otpCode);
      stopSmsListener();
      await setAuthToken(token);
      setPhoneVerified(true);
      setOtpVisible(false);
      setSavedPhone(pendingPhone);
      await commitSave(pendingData);
    } catch (e) {
      Alert.alert('Incorrect OTP', e?.response?.data?.detail || 'Please check the code and try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResend = async () => {
    setOtpSending(true);
    setOtpCode('');
    try {
      await sendOtp(pendingPhone);
      startSmsListener();
      Alert.alert('OTP resent');
    } catch (e) {
      Alert.alert('Failed to resend', e?.response?.data?.detail || e.message);
    } finally {
      setOtpSending(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} accessibilityLabel="Cancel" accessibilityRole="button">
          <Text style={s.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={s.title}>Profile</Text>
        <TouchableOpacity onPress={save} style={s.headerBtn} accessibilityLabel="Save profile" accessibilityRole="button">
          <Text style={s.saveBtn}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.body} contentContainerStyle={{ padding: 20 }}>
        <Text style={s.label}>Name</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#6B7280" />

        <Text style={s.label}>Phone</Text>
        <View style={s.phoneRow}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={phone}
            onChangeText={(v) => { setPhone(v); setPhoneVerified(phone === savedPhone); }}
            keyboardType="phone-pad"
            placeholder="10-digit number"
            placeholderTextColor="#6B7280"
            maxLength={10}
          />
          {phoneVerified && phone === savedPhone && (
            <View style={s.verifiedBadge}>
              <Text style={s.verifiedText}>✓ Verified</Text>
            </View>
          )}
        </View>

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

      {/* OTP Modal */}
      <Modal visible={otpVisible} transparent animationType="slide" onRequestClose={() => setOtpVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Verify your number</Text>
            <Text style={s.modalSub}>We sent a 6-digit code to +91 {pendingPhone}</Text>

            {otpSending ? (
              <ActivityIndicator style={{ marginVertical: 24 }} color={C.accent} />
            ) : (
              <>
                <TextInput
                  style={s.otpInput}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="——————"
                  placeholderTextColor="#CBD5E1"
                  textAlign="center"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  autoFocus
                />
                <TouchableOpacity
                  style={[s.verifyBtn, (otpVerifying || otpCode.length !== 6) && s.verifyBtnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={otpVerifying || otpCode.length !== 6}
                >
                  {otpVerifying
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.verifyBtnText}>Verify</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.resendBtn} onPress={handleResend}>
                  <Text style={s.resendText}>Resend OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.resendBtn} onPress={() => { stopSmsListener(); setOtpVisible(false); }}>
                  <Text style={[s.resendText, { color: '#94A3B8' }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifiedBadge: { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#86EFAC' },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#15803D' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  chipActive: { borderColor: C.accent, backgroundColor: '#EFF6FF' },
  chipText: { fontSize: 13, fontWeight: '600', color: C.muted },
  chipTextActive: { color: C.accent },
  // OTP modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8 },
  modalSub: { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  otpInput: { width: '100%', fontSize: 32, fontWeight: '700', letterSpacing: 12, color: C.text, borderBottomWidth: 2, borderBottomColor: C.accent, marginBottom: 28, paddingVertical: 8 },
  verifyBtn: { width: '100%', backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  resendBtn: { paddingVertical: 10 },
  resendText: { fontSize: 14, color: C.accent, fontWeight: '600' },
});
