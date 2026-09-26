import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingsService } from '../../services/settingsService';
import { studentService } from '../../services/studentService';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AppSettings } from '../../types';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    messName: 'Apulki Mess',
    warningDays: 3,
    enableNotifications: true,
  });

  const [messNameInput, setMessNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [clearDataConfirmVisible, setClearDataConfirmVisible] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await settingsService.getSettings();
      setSettings(data);
      setMessNameInput(data.messName);
    }
    load();
  }, []);

  const handleSaveMessName = async () => {
    if (!messNameInput.trim()) {
      Alert.alert('Validation Error', 'Mess name cannot be empty.');
      return;
    }
    setSavingName(true);
    const updated = await settingsService.updateSettings({ messName: messNameInput.trim() });
    setSettings(updated);
    setSavingName(false);
    Alert.alert('Saved', 'Mess name updated successfully.');
  };

  const handleSelectWarningDays = async (days: number) => {
    const updated = await settingsService.updateSettings({ warningDays: days });
    setSettings(updated);
  };

  const handleToggleNotifications = async (val: boolean) => {
    const updated = await settingsService.updateSettings({ enableNotifications: val });
    setSettings(updated);
  };

  const handleConfirmClearAllData = async () => {
    await studentService.clearAllData();
    setClearDataConfirmVisible(false);
    Alert.alert('Cleared', 'All student data has been erased.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Mess Details Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mess Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mess Name</Text>
            <View style={styles.rowInput}>
              <TextInput
                style={styles.textInput}
                value={messNameInput}
                onChangeText={setMessNameInput}
                placeholder="Enter Mess Name"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.saveBtn}
                onPress={handleSaveMessName}
                disabled={savingName}
              >
                <Text style={styles.saveBtnText}>{savingName ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Subscription & Warning Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Subscription Warning Period</Text>
          <Text style={styles.descriptionText}>
            Select how many days before subscription expiry a student should be flagged as "Expiring Soon":
          </Text>

          <View style={styles.chipRow}>
            {[1, 2, 3, 5, 7].map((days) => {
              const isSelected = settings.warningDays === days;
              return (
                <TouchableOpacity
                  key={days}
                  activeOpacity={0.8}
                  onPress={() => handleSelectWarningDays(days)}
                  style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                >
                  <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                    {days} {days === 1 ? 'Day' : 'Days'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.switchLabel}>Expiry Alerts & Notifications</Text>
              <Text style={styles.switchSublabel}>Receive device notifications when subscriptions are expiring</Text>
            </View>
            <Switch
              value={settings.enableNotifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={settings.enableNotifications ? COLORS.primary : '#F4F3F4'}
            />
          </View>
        </View>

        {/* Development & Demo Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.clearDataBtn}
            onPress={() => setClearDataConfirmVisible(true)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
            <Text style={styles.clearDataBtnText}>Clear All App Data</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} style={{ marginBottom: 6 }} />
          <Text style={styles.infoTitle}>Apulki Mess Management System</Text>
          <Text style={styles.infoSubtitle}>Version 1.0.0 • Local Storage Mode</Text>
          <Text style={styles.infoDesc}>
            Built specifically for Mess Owners. Designed for zero-lag local persistence with clean service architecture ready for backend synchronization.
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Dialog for Clear Data */}
      <ConfirmDialog
        visible={clearDataConfirmVisible}
        title="Clear All Data?"
        message="Are you sure you want to delete ALL student records and payment history? This action cannot be undone."
        confirmLabel="Clear All Data"
        isDanger={true}
        onConfirm={handleConfirmClearAllData}
        onCancel={() => setClearDataConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  inputGroup: {
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  dayChip: {
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dayChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  clearDataBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.expiredBg,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.expiredBorder,
  },
  clearDataBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 10,
  },
  infoDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
