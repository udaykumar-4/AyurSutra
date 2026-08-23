import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import authService from '../../services/authService';
import { User, UserRole } from '../../types/user';
import Colors from '../../constants/Colors';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorView from '../../components/ErrorView';

export default function AdminUsersScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('patient');
  const [editDesignation, setEditDesignation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('Default123');
  const [createRole, setCreateRole] = useState<UserRole>('doctor');
  const [createDesignation, setCreateDesignation] = useState('');
  const [creating, setCreating] = useState(false);

  // Protected Route Check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    setError(null);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleStatus = async (targetUser: User) => {
    const nextStatus = targetUser.isActive === false ? true : false;
    setActionUserId(targetUser._id);
    try {
      await userService.updateUserStatus(targetUser._id, nextStatus);
      Alert.alert('Status Updated', `User "${targetUser.full_name}" is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}.`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to change user status.');
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeleteUser = (targetUser: User) => {
    if (targetUser._id === user?._id) {
      Alert.alert('Action Denied', 'You cannot delete your own admin account.');
      return;
    }

    Alert.alert(
      'Confirm Account Deletion',
      `Are you sure you want to permanently delete account "${targetUser.full_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionUserId(targetUser._id);
            try {
              await userService.deleteUser(targetUser._id);
              Alert.alert('Account Deleted', `User "${targetUser.full_name}" deleted.`);
              fetchData();
            } catch (err: any) {
              Alert.alert('Deletion Error', err.message || 'Failed to delete user account.');
            } finally {
              setActionUserId(null);
            }
          },
        },
      ]
    );
  };

  const handleOpenEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditName(targetUser.full_name);
    setEditRole(targetUser.role);
    setEditDesignation(targetUser.designation || '');
    setEditPhone(targetUser.phone || '');
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser || !editName.trim()) {
      Alert.alert('Validation Error', 'Full name is required.');
      return;
    }

    setSavingEdit(true);
    try {
      await userService.updateUser(editingUser._id, {
        full_name: editName.trim(),
        role: editRole,
        designation: editDesignation.trim() || undefined,
        phone: editPhone.trim() || undefined,
      });

      Alert.alert('User Updated', 'Account details updated successfully.');
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Error saving user updates.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreateUser = async () => {
    if (!createName.trim() || !createEmail.trim() || !createPassword) {
      Alert.alert('Validation Error', 'Please complete Name, Email, and Password.');
      return;
    }

    setCreating(true);
    try {
      await authService.register({
        full_name: createName.trim(),
        email: createEmail.trim(),
        password: createPassword,
        role: createRole,
        designation: createDesignation.trim() || undefined,
      });

      Alert.alert('User Created 🎉', `New ${createRole.toUpperCase()} account created.`);
      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Error creating new user.');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || (loading && !refreshing)) {
    return <LoadingScreen message="Loading User Management Directory..." />;
  }

  const rolesList: string[] = ['all', 'admin', 'doctor', 'therapist', 'patient', 'receptionist'];

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <View style={styles.container}>
      <Header title="User Management" subtitle="System Account Directory & Controls" showLogout={true} />

      <View style={styles.topBar}>
        <Button
          title="+ Create New Account"
          onPress={() => setShowCreateModal(true)}
          variant="primary"
          size="medium"
          style={{ width: '100%', marginBottom: 10 }}
        />
        <Input
          placeholder="🔍 Search users by name, email, or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      {/* Role Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilterRow}>
        {rolesList.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleChip, selectedRoleFilter === r && styles.activeRoleChip]}
            onPress={() => setSelectedRoleFilter(r)}
          >
            <Text style={[styles.roleChipText, selectedRoleFilter === r && styles.activeRoleChipText]}>
              {r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.secondary]} />}
      >
        {error ? <ErrorView message={error} onRetry={fetchData} /> : null}

        {filteredUsers.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No Accounts Found</Text>
            <Text style={styles.emptyDesc}>No user accounts match the search or role criteria.</Text>
          </Card>
        ) : (
          filteredUsers.map((u) => {
            const isActive = u.isActive !== false;
            return (
              <Card key={u._id} style={styles.userCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.full_name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                  </View>
                  <Text style={[styles.roleBadge, getRoleStyle(u.role)]}>
                    {u.role.toUpperCase()}
                  </Text>
                </View>

                {u.designation ? <Text style={styles.userMeta}>Title: {u.designation}</Text> : null}
                <Text style={styles.userMeta}>Phone: {u.phone || 'N/A'}</Text>
                <Text style={[styles.statusText, { color: isActive ? Colors.success : Colors.error }]}>
                  ACCOUNT STATUS: {isActive ? 'ACTIVE ✓' : 'INACTIVE / BLOCKED 🚫'}
                </Text>

                {/* Admin Controls Action Row */}
                <View style={styles.actionRow}>
                  <Button
                    title="Edit"
                    onPress={() => handleOpenEditModal(u)}
                    size="small"
                    variant="outline"
                    style={{ marginRight: 6 }}
                  />

                  <Button
                    title={isActive ? 'Deactivate' : 'Activate'}
                    onPress={() => handleToggleStatus(u)}
                    loading={actionUserId === u._id}
                    size="small"
                    variant={isActive ? 'outline' : 'primary'}
                    style={{ marginRight: 6 }}
                  />

                  <Button
                    title="Delete"
                    onPress={() => handleDeleteUser(u)}
                    loading={actionUserId === u._id}
                    size="small"
                    variant="danger"
                  />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          visible={!!editingUser}
          transparent
          animationType="slide"
          onRequestClose={() => setEditingUser(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Account Details</Text>
                <TouchableOpacity onPress={() => setEditingUser(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                <Input
                  label="Full Name"
                  value={editName}
                  onChangeText={setEditName}
                />

                <Text style={styles.selectLabel}>Select Role:</Text>
                <View style={styles.roleBtnGroup}>
                  {(['admin', 'doctor', 'therapist', 'patient', 'receptionist'] as UserRole[]).map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleSelectChip, editRole === role && styles.activeRoleSelectChip]}
                      onPress={() => setEditRole(role)}
                    >
                      <Text style={[styles.roleSelectChipText, editRole === role && styles.activeRoleSelectChipText]}>
                        {role.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input
                  label="Designation / Specialty"
                  placeholder="e.g. Senior Physician"
                  value={editDesignation}
                  onChangeText={setEditDesignation}
                />

                <Input
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  keyboardType="phone-pad"
                  value={editPhone}
                  onChangeText={setEditPhone}
                />

                <Button
                  title="Save Account Changes"
                  onPress={handleSaveUserEdit}
                  loading={savingEdit}
                  style={{ marginTop: 12 }}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Create User Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New User Account</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 450 }}>
              <Input
                label="Full Name"
                placeholder="e.g. Dr. Anand Sharma"
                value={createName}
                onChangeText={setCreateName}
              />

              <Input
                label="Email Address"
                placeholder="anand@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={createEmail}
                onChangeText={setCreateEmail}
              />

              <Input
                label="Password"
                placeholder="Default123"
                value={createPassword}
                onChangeText={setCreatePassword}
              />

              <Text style={styles.selectLabel}>Assign Role:</Text>
              <View style={styles.roleBtnGroup}>
                {(['admin', 'doctor', 'therapist', 'patient', 'receptionist'] as UserRole[]).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleSelectChip, createRole === role && styles.activeRoleSelectChip]}
                    onPress={() => setCreateRole(role)}
                  >
                    <Text style={[styles.roleSelectChipText, createRole === role && styles.activeRoleSelectChipText]}>
                      {role.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Designation / Specialty (Optional)"
                placeholder="e.g. Lead Doctor"
                value={createDesignation}
                onChangeText={setCreateDesignation}
              />

              <Button
                title="Create User Account"
                onPress={handleCreateUser}
                loading={creating}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getRoleStyle = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return { backgroundColor: Colors.secondary + '20', color: Colors.secondary };
    case 'doctor':
      return { backgroundColor: Colors.primary + '20', color: Colors.primary };
    case 'therapist':
      return { backgroundColor: Colors.accent + '20', color: Colors.accentDark || '#15803d' };
    case 'receptionist':
      return { backgroundColor: '#f59e0b20', color: '#d97706' };
    case 'patient':
    default:
      return { backgroundColor: Colors.border, color: Colors.textSecondary };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  roleFilterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  activeRoleChip: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeRoleChipText: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  userCard: {
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  userMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    fontSize: 20,
    color: Colors.textMuted,
    padding: 4,
  },
  selectLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  roleBtnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  roleSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
    marginBottom: 6,
  },
  activeRoleSelectChip: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  roleSelectChipText: {
    fontSize: 11,
    color: Colors.text,
  },
  activeRoleSelectChipText: {
    fontWeight: '700',
    color: Colors.white,
  },
});
