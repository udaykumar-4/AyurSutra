import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';
import Colors from '../../constants/Colors';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';

const ROLE_OPTIONS: { role: UserRole; title: string; subtitle: string; icon: string; defaultEmail: string }[] = [
  { role: 'admin', title: 'Administrator', subtitle: 'Manage users, schedules & settings', icon: '👩‍💼', defaultEmail: 'admin@ayursutra.com' },
  { role: 'doctor', title: 'Doctor', subtitle: 'Patient records, consultations & Rx', icon: '👨‍⚕️', defaultEmail: 'doctor@ayursutra.com' },
  { role: 'therapist', title: 'Therapist', subtitle: 'Panchakarma sessions & progress', icon: '🧘', defaultEmail: 'therapist@ayursutra.com' },
  { role: 'receptionist', title: 'Receptionist', subtitle: 'Walk-ins, scheduling & billing', icon: '🛎️', defaultEmail: 'receptionist@ayursutra.com' },
  { role: 'patient', title: 'Patient', subtitle: 'Appointments, history & vitals', icon: '🧑', defaultEmail: 'patient@ayursutra.com' },
];

export default function LoginScreen() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Registration & Login Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('');
  const [registerRole, setRegisterRole] = useState<UserRole>('patient');
  const [formError, setFormError] = useState<string | null>(null);

  const { login, register, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setRegisterRole(role);
    const roleOpt = ROLE_OPTIONS.find((r) => r.role === role);
    if (roleOpt && !isRegisterMode) {
      setEmail(roleOpt.defaultEmail);
      setPassword('password123'); // Default sample password
    }
    setFormError(null);
    clearError();
  };

  const handleFillDemo = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegisterMode(false);
    const roleOpt = ROLE_OPTIONS.find((r) => r.role === role);
    if (roleOpt) {
      setEmail(roleOpt.defaultEmail);
      setPassword('password123');
    }
    setFormError(null);
    clearError();
  };

  const handleOpenRegister = (role?: UserRole) => {
    const targetRole = role || selectedRole || 'patient';
    setRegisterRole(targetRole);
    setSelectedRole(targetRole);
    setIsRegisterMode(true);
    setFullName('');
    setEmail('');
    setPassword('password123');
    setDesignation(targetRole === 'doctor' ? 'Ayurvedic Physician' : targetRole === 'therapist' ? 'Panchakarma Therapist' : '');
    setFormError(null);
    clearError();
  };

  const handleLoginSubmit = async () => {
    if (!selectedRole) {
      setFormError('Please select a role before signing in.');
      return;
    }
    if (!email.trim() || !password) {
      setFormError('Please enter both email address and password.');
      return;
    }

    setFormError(null);

    try {
      await login({
        email: email.trim().toLowerCase(),
        password,
        role: selectedRole,
      });

      navigateToRole(selectedRole);
    } catch (err: any) {
      // Error handled in AuthContext
    }
  };

  const handleRegisterSubmit = async () => {
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !password) {
      setFormError('Please enter an email address and password.');
      return;
    }
    if (password.length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    setFormError(null);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: registerRole,
        designation: designation.trim() || undefined,
      });

      navigateToRole(registerRole);
    } catch (err: any) {
      // Error handled in AuthContext
    }
  };

  const navigateToRole = (role: UserRole) => {
    switch (role) {
      case 'admin':
        router.replace('/admin');
        break;
      case 'doctor':
        router.replace('/doctor');
        break;
      case 'therapist':
        router.replace('/therapist');
        break;
      case 'receptionist':
        router.replace('/receptionist');
        break;
      case 'patient':
        router.replace('/patient');
        break;
    }
  };

  const currentRoleOpt = ROLE_OPTIONS.find((r) => r.role === (isRegisterMode ? registerRole : selectedRole));

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* App Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerEmoji}>🌿</Text>
          <Text style={styles.title}>AyurSutra</Text>
          <Text style={styles.subtitle}>Panchakarma Management Platform</Text>
        </View>

        {/* Auth Mode Toggle (Sign In vs Register) */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeTab, !isRegisterMode && styles.modeTabActive]}
            onPress={() => {
              setIsRegisterMode(false);
              setFormError(null);
              clearError();
            }}
          >
            <Text style={[styles.modeTabText, !isRegisterMode && styles.modeTabTextActive]}>
              🔐 Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, isRegisterMode && styles.modeTabActive]}
            onPress={() => handleOpenRegister(selectedRole || 'patient')}
          >
            <Text style={[styles.modeTabText, isRegisterMode && styles.modeTabTextActive]}>
              📝 Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* REGISTRATION FORM MODE */}
        {isRegisterMode ? (
          <Card style={styles.loginCard}>
            <View style={styles.loginCardHeader}>
              <TouchableOpacity
                onPress={() => setIsRegisterMode(false)}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back to Sign In</Text>
              </TouchableOpacity>
              <Text style={styles.selectedRoleBadge}>
                REGISTERING AS {registerRole.toUpperCase()}
              </Text>
            </View>

            <Text style={styles.loginTitle}>
              {currentRoleOpt?.icon} Create {currentRoleOpt?.title} Account
            </Text>
            <Text style={styles.registerSubtitle}>
              Register a new {registerRole} account on AyurSutra platform.
            </Text>

            {/* Role Selection Chips for Registration */}
            <Text style={styles.inputLabelHeader}>Select Account Role *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleChipsRow}>
              {ROLE_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item.role}
                  style={[
                    styles.roleChip,
                    registerRole === item.role && styles.roleChipActive,
                  ]}
                  onPress={() => {
                    setRegisterRole(item.role);
                    setSelectedRole(item.role);
                  }}
                >
                  <Text style={styles.roleChipIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.roleChipText,
                      registerRole === item.role && styles.roleChipTextActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {(formError || error) ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>❌ {formError || error}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name *"
              placeholder={registerRole === 'doctor' ? 'e.g. Dr. Ananya Sharma' : 'e.g. Ramesh Kumar'}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setFormError(null);
              }}
            />

            <Input
              label="Email Address *"
              placeholder={`e.g. new_${registerRole}@ayursutra.com`}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setFormError(null);
              }}
            />

            <Input
              label="Password *"
              placeholder="Choose a password (min 4 characters)"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setFormError(null);
              }}
            />

            {registerRole !== 'patient' && (
              <Input
                label="Designation / Title (Optional)"
                placeholder="e.g. Senior Panchakarma Specialist"
                value={designation}
                onChangeText={(text) => setDesignation(text)}
              />
            )}

            <Button
              title={`Create ${currentRoleOpt?.title} Account`}
              onPress={handleRegisterSubmit}
              loading={isLoading}
              style={styles.submitBtn}
            />

            <TouchableOpacity
              style={styles.switchAuthBtn}
              onPress={() => setIsRegisterMode(false)}
            >
              <Text style={styles.switchAuthText}>
                Already have an account? <Text style={styles.highlightText}>Sign In Here</Text>
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          /* SIGN IN MODE */
          <>
            {!selectedRole ? (
              <View style={styles.stepContainer}>
                <Text style={styles.sectionTitle}>Select Your Role to Sign In</Text>

                {ROLE_OPTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.role}
                    style={styles.roleCard}
                    onPress={() => handleRoleSelect(item.role)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.roleIcon}>{item.icon}</Text>
                    <View style={styles.roleTextContainer}>
                      <Text style={styles.roleTitle}>{item.title}</Text>
                      <Text style={styles.roleSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Text style={styles.arrowText}>→</Text>
                  </TouchableOpacity>
                ))}

                {/* Quick Register Banner */}
                <TouchableOpacity
                  style={styles.registerPromptBanner}
                  onPress={() => handleOpenRegister('patient')}
                >
                  <Text style={styles.registerPromptText}>
                    🆕 Don't have an account? <Text style={styles.highlightText}>Create Account Here</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Card style={styles.loginCard}>
                <View style={styles.loginCardHeader}>
                  <TouchableOpacity
                    onPress={() => setSelectedRole(null)}
                    style={styles.backButton}
                  >
                    <Text style={styles.backButtonText}>← Change Role</Text>
                  </TouchableOpacity>
                  <Text style={styles.selectedRoleBadge}>
                    {selectedRole.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.loginTitle}>
                  {ROLE_OPTIONS.find((r) => r.role === selectedRole)?.icon}{' '}
                  {ROLE_OPTIONS.find((r) => r.role === selectedRole)?.title} Login
                </Text>

                {(formError || error) ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>❌ {formError || error}</Text>
                  </View>
                ) : null}

                <Input
                  label="Email Address"
                  placeholder="e.g. user@ayursutra.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setFormError(null);
                  }}
                />

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setFormError(null);
                  }}
                />

                {/* Quick Fill Demo Credentials Bar */}
                <View style={styles.demoFillContainer}>
                  <Text style={styles.demoFillLabel}>Demo Credentials:</Text>
                  <TouchableOpacity
                    style={styles.demoChip}
                    onPress={() => handleFillDemo(selectedRole)}
                  >
                    <Text style={styles.demoChipText}>
                      ⚡ Fill {selectedRole} login
                    </Text>
                  </TouchableOpacity>
                </View>

                <Button
                  title="Sign In"
                  onPress={handleLoginSubmit}
                  loading={isLoading}
                  style={styles.submitBtn}
                />

                <TouchableOpacity
                  style={styles.switchAuthBtn}
                  onPress={() => handleOpenRegister(selectedRole)}
                >
                  <Text style={styles.switchAuthText}>
                    Don't have a {selectedRole} account? <Text style={styles.highlightText}>Register as {selectedRole.toUpperCase()}</Text>
                  </Text>
                </TouchableOpacity>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 2,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.glassPillBg,
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.shadowElevated,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  stepContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glassBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorderSubtle,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  roleIcon: {
    fontSize: 30,
    marginRight: 14,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  roleSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  arrowText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
    marginLeft: 8,
  },
  registerPromptBanner: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  registerPromptText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  loginCard: {
    marginTop: 4,
  },
  loginCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    paddingVertical: 4,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedRoleBadge: {
    backgroundColor: Colors.primary + '20',
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  registerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  inputLabelHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  roleChipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  demoFillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 8,
  },
  demoFillLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  demoChip: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  demoChipText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 6,
  },
  switchAuthBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchAuthText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  highlightText: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
