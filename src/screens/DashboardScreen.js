import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, RefreshControl, ActivityIndicator,
  StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecords } from '../services/api';
import { getProfile, getFamily, getHistory, getLang, setLang } from '../services/storage';

const C = {
  navy: '#1B2D5E', navyDeep: '#0E1A38', teal: '#0B7285', accent: '#2563EB',
  text: '#0F172A', textSec: '#334155', muted: '#475569',
  bg: '#F1F5F9', card: '#FFFFFF', border: '#E2E8F0',
  green: '#15803D', greenBg: '#F0FDF4', greenBorder: '#86EFAC',
  red: '#DC2626', rxBorder: '#2563EB', rptBorder: '#15803D',
};

const T = {
  en: {
    eyebrow: 'MY HEALTH', hello: 'Hello', you: 'You', add: '+ Add',
    records: 'Records', tabAll: 'All', tabRx: 'Prescriptions', tabRpt: 'Reports',
    search: 'Search records…', noRec: 'No records yet',
    noRecSub: 'Prescriptions from your doctor will appear here.',
    loading: 'Loading…', pillRx: 'Rx', pillRpt: 'Lab',
    blood: 'Blood', allergy: 'Allergy', fetchErr: 'Could not load records',
    enterCode: 'Enter prescription code', go: 'Go',
    codeTitle: 'Have a prescription code?', codeSub: 'Enter the code your doctor shared',
    family: 'Family', edit: 'Edit',
  },
  hi: {
    eyebrow: 'मेरी सेहत', hello: 'नमस्ते', you: 'आप', add: '+ जोड़ें',
    records: 'रिकॉर्ड', tabAll: 'सभी', tabRx: 'पर्चियाँ', tabRpt: 'रिपोर्ट',
    search: 'रिकॉर्ड खोजें…', noRec: 'अभी कोई रिकॉर्ड नहीं',
    noRecSub: 'डॉक्टर की पर्चियाँ यहाँ दिखेंगी।',
    loading: 'लोड हो रहा है…', pillRx: 'Rx', pillRpt: 'लैब',
    blood: 'रक्त', allergy: 'एलर्जी', fetchErr: 'रिकॉर्ड लोड नहीं हुए',
    enterCode: 'पर्ची कोड डालें', go: 'जाएँ',
    codeTitle: 'पर्ची कोड है?', codeSub: 'डॉक्टर द्वारा दिया गया कोड डालें',
    family: 'परिवार', edit: 'संपादन',
  },
};

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [lang, setLangState] = useState('en');
  const [profile, setProfile] = useState({ px_name: '', px_phone: '', px_blood_group: '', px_allergies: '', px_comorbidities: [] });
  const [family, setFamily] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [codeInput, setCodeInput] = useState('');

  const t = (k) => T[lang][k] || T.en[k] || k;

  const loadInitial = useCallback(async () => {
    const [p, f, l] = await Promise.all([getProfile(), getFamily(), getLang()]);
    setProfile(p);
    setFamily(f);
    setLangState(l);
    return { p, f };
  }, []);

  const loadRecords = useCallback(async (idx, p, f, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      let phone = '';
      if (idx === -1) phone = p?.px_phone || profile.px_phone;
      else phone = (f ?? family)[idx]?.phone || '';

      let serverRecs = [];
      if (phone) serverRecs = await fetchRecords(phone);

      if (idx === -1) {
        const local = await getHistory();
        const ids = new Set(serverRecs.map(r => r.id));
        const merged = [...serverRecs, ...local.filter(r => !ids.has(r.id))];
        setRecords(merged);
      } else {
        setRecords(serverRecs);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile, family]);

  useEffect(() => {
    loadInitial().then(({ p, f }) => loadRecords(-1, p, f));
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      loadInitial().then(({ p, f }) => loadRecords(selectedIdx, p, f));
    });
    return unsub;
  }, [navigation, selectedIdx]);

  const handleSelectPerson = (idx) => {
    setSelectedIdx(idx);
    setActiveTab('all');
    setSearch('');
    loadRecords(idx, null, null);
  };

  const toggleLang = async (l) => {
    setLangState(l);
    await setLang(l);
  };

  const filtered = records
    .slice()
    .reverse()
    .filter(r => {
      if (activeTab !== 'all' && (r.type || 'prescription') !== activeTab) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (r.doctorName + r.doctorDept + r.diagnosis + r.city + r.dateDisplay + r.findings + r.labName + r.reportType || '').toLowerCase().includes(q);
    });

  const heroName = selectedIdx === -1
    ? (profile.px_name || '')
    : (family[selectedIdx]?.name || '');

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.navyDeep} />

      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroLang}>
          {['en','hi'].map(l => (
            <TouchableOpacity
              key={l}
              style={[s.langBtn, lang === l && s.langActive]}
              onPress={() => toggleLang(l)}
              accessibilityLabel={`Switch to ${l === 'en' ? 'English' : 'Hindi'}`}
              accessibilityRole="button"
            >
              <Text style={[s.langText, lang === l && s.langTextActive]}>{l === 'en' ? 'EN' : 'हि'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.eyebrow}>{t('eyebrow')}</Text>
        <Text style={s.heroName} numberOfLines={1}>
          {heroName ? `${t('hello')}, ${heroName.split(' ')[0]}!` : `${t('hello')}!`}
        </Text>
        <View style={s.profilePill}>
          <Ionicons name="water-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={s.pillItem}>{profile.px_blood_group || '—'}</Text>
          <View style={s.pillDiv} />
          <Ionicons name="leaf-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={s.pillItem}>{profile.px_allergies || '—'}</Text>
          <TouchableOpacity
            style={s.pillEdit}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
          >
            <Text style={s.pillEditText}>{t('edit')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRecords(selectedIdx, null, null, true)} tintColor={C.accent} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Family chips */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{t('family')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
            <TouchableOpacity
              style={[s.chip, selectedIdx === -1 && s.chipActive]}
              onPress={() => handleSelectPerson(-1)}
              accessibilityLabel={`Select ${profile.px_name || 'yourself'}`}
              accessibilityRole="button"
            >
              <View style={[s.avatar, selectedIdx === -1 && s.avatarActive]}>
                <Text style={[s.avatarText, selectedIdx === -1 && { color: '#fff' }]}>{(profile.px_name || t('you')).charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[s.chipName, selectedIdx === -1 && s.chipNameActive]}>{(profile.px_name || t('you')).split(' ')[0]}</Text>
            </TouchableOpacity>
            {family.map((m, i) => (
              <TouchableOpacity
                key={i}
                style={[s.chip, selectedIdx === i && s.chipActive]}
                onPress={() => handleSelectPerson(i)}
                accessibilityLabel={`Select ${m.name || 'family member'}`}
                accessibilityRole="button"
              >
                <View style={[s.avatar, selectedIdx === i && s.avatarActive]}>
                  <Text style={[s.avatarText, selectedIdx === i && { color: '#fff' }]}>{(m.name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[s.chipName, selectedIdx === i && s.chipNameActive]}>{(m.name || '').split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.chip} onPress={() => navigation.navigate('AddMember')} accessibilityLabel="Add family member" accessibilityRole="button">
              <View style={[s.avatar, { backgroundColor: 'rgba(37,99,235,0.1)', borderColor: C.accent, borderWidth: 1.5 }]}>
                <Text style={[s.avatarText, { color: C.accent, fontSize: 22 }]}>+</Text>
              </View>
              <Text style={[s.chipName, { color: C.accent }]}>{t('add')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Records */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{t('records')}</Text>

          {/* Tabs */}
          <View style={s.tabs}>
            {[['all', t('tabAll')], ['prescription', t('tabRx')], ['report', t('tabRpt')]].map(([tab, label]) => (
              <TouchableOpacity
                key={tab}
                style={[s.tab, activeTab === tab && s.tabActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <TextInput
            style={s.search}
            placeholder={t('search')}
            placeholderTextColor="#6B7280"
            value={search}
            onChangeText={setSearch}
          />

          {/* List */}
          {loading ? (
            <ActivityIndicator color={C.accent} style={{ marginTop: 24 }} />
          ) : filtered.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="document-text-outline" size={40} color={C.muted} style={{ marginBottom: 10 }} />
              <Text style={s.emptyTitle}>{t('noRec')}</Text>
              <Text style={s.emptySub}>{t('noRecSub')}</Text>
            </View>
          ) : (
            filtered.map((r, idx) => {
              const isRpt = r.type === 'report';
              return (
                <TouchableOpacity
                  key={r.id || idx}
                  style={[s.recCard, isRpt ? s.recRpt : s.recRx]}
                  accessibilityLabel={`${isRpt ? 'Lab report' : 'Prescription'} from ${isRpt ? (r.labName || 'Lab') : (r.doctorName || 'Doctor')}`}
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('Record', { pid: r.id, phone: selectedIdx === -1 ? profile.px_phone : (family[selectedIdx]?.phone || '') })}>
                  <View style={s.recTop}>
                    <Text style={s.recDoctor} numberOfLines={1}>{isRpt ? (r.labName || 'Lab Report') : (r.doctorName || 'Doctor')}</Text>
                    <View style={[s.pill, isRpt ? s.pillRpt : s.pillRx]}>
                      <Text style={[s.pillText, isRpt ? s.pillRptText : s.pillRxText]}>{isRpt ? t('pillRpt') : t('pillRx')}</Text>
                    </View>
                  </View>
                  <Text style={s.recMeta} numberOfLines={1}>
                    {[r.dateDisplay, r.city, isRpt ? '' : r.doctorDept].filter(Boolean).join(' · ')}
                  </Text>
                  {(isRpt ? r.findings : r.diagnosis) ? (
                    <Text style={s.recDiag} numberOfLines={2}>{isRpt ? r.findings : r.diagnosis}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={C.muted} style={s.recChevron} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Enter code */}
        <View style={[s.section, s.codeCard]}>
          <Text style={s.codeTitle}>{t('codeTitle')}</Text>
          <Text style={s.codeSub}>{t('codeSub')}</Text>
          <View style={s.codeRow}>
            <TextInput
              style={s.codeInput}
              placeholder={t('enterCode')}
              placeholderTextColor="#6B7280"
              value={codeInput}
              onChangeText={setCodeInput}
              autoCapitalize="none"
            />
            <TouchableOpacity style={s.codeBtn} onPress={() => { if (codeInput.trim()) navigation.navigate('Record', { pid: codeInput.trim().toLowerCase(), phone: profile.px_phone }); }}>
              <Text style={s.codeBtnText}>{t('go')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navyDeep },
  hero: { backgroundColor: C.navyDeep, paddingHorizontal: 22, paddingBottom: 28, paddingTop: 8, position: 'relative' },
  heroLang: { position: 'absolute', top: 8, right: 20, flexDirection: 'row', gap: 6, zIndex: 10 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'transparent', minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  langActive: { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.7)' },
  langText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  langTextActive: { color: '#fff' },
  eyebrow: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 8, fontWeight: '600', marginTop: 40 },
  heroName: { fontSize: 34, fontWeight: '700', color: '#fff', marginBottom: 16 },
  profilePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 10, alignSelf: 'flex-start' },
  pillItem: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  pillDiv: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)' },
  pillEdit: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  pillEditText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  body: { flex: 1, backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: C.muted, marginBottom: 10 },

  chipsRow: { flexDirection: 'row' },
  chip: { alignItems: 'center', marginRight: 14, minWidth: 54 },
  chipActive: {},
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(37,99,235,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  avatarActive: { backgroundColor: C.accent },
  avatarText: { fontSize: 20, fontWeight: '700', color: C.accent },
  chipName: { fontSize: 12, color: C.muted, fontWeight: '500', textAlign: 'center' },
  chipNameActive: { color: C.accent, fontWeight: '700' },

  tabs: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 12, padding: 4, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: C.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: C.muted },
  tabTextActive: { color: '#fff' },

  search: { backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.text, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textSec, marginBottom: 4 },
  emptySub: { fontSize: 14, color: C.muted, textAlign: 'center' },

  recCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: C.rxBorder, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, position: 'relative' },
  recRpt: { borderLeftColor: C.rptBorder },
  recRx: { borderLeftColor: C.rxBorder },
  recTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  recDoctor: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillRx: { backgroundColor: '#EFF6FF' },
  pillRpt: { backgroundColor: C.greenBg },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillRxText: { color: C.accent },
  pillRptText: { color: C.green },
  recMeta: { fontSize: 12, color: C.muted, marginBottom: 4 },
  recDiag: { fontSize: 13, color: C.textSec },
  recChevron: { position: 'absolute', right: 12, top: '35%' },

  codeCard: { backgroundColor: C.card, borderRadius: 16, padding: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  codeTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 3 },
  codeSub: { fontSize: 13, color: C.muted, marginBottom: 12 },
  codeRow: { flexDirection: 'row', gap: 10 },
  codeInput: { flex: 1, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: C.text },
  codeBtn: { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  codeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
