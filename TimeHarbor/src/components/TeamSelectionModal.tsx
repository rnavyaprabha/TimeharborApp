import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Team } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Modal } from './ui/Modal';
import { useAuthStore } from '../store/authStore';
import { createTeam, joinTeam, getUserTeams } from '../services/teamService';
import { useTeamUiStore } from '../store/teamUiStore';

interface TeamSelectionModalProps {
  visible: boolean;
  teams: Team[];
  activeTeamId?: string;
  onSelect: (team: Team) => void;
  onClose: () => void;
}

export const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({
  visible,
  teams,
  activeTeamId,
  onSelect,
  onClose,
}) => {
  const user = useAuthStore((s) => s.user);
  const { setTeams, setActiveTeamId } = useTeamUiStore();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [createdTeamCode, setCreatedTeamCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const sortedTeams = useMemo(() => {
    const items = [...teams];
    items.sort((a, b) => {
      if (a.id === activeTeamId) return -1;
      if (b.id === activeTeamId) return 1;
      return 0;
    });
    return items;
  }, [teams, activeTeamId]);

  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const refreshTeams = async (selectId?: string) => {
    if (!user) return;
    const fresh = await getUserTeams(user.uid);
    setTeams(fresh);
    if (selectId) {
      setActiveTeamId(selectId);
      const team = fresh.find((t) => t.id === selectId);
      if (team) onSelect(team);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    if (joinCode.trim().length !== 6) return;
    setLoadingJoin(true);
    setError(null);
    try {
      const joined = await joinTeam(user.uid, joinCode.trim().toUpperCase());
      await refreshTeams(joined.id);
      setJoinOpen(false);
      setJoinCode('');
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to join team');
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !newTeamName.trim()) return;
    setLoadingCreate(true);
    try {
      const created = await createTeam(user.uid, newTeamName.trim());
      setCreatedTeamCode(created.joinCode);
      await refreshTeams(created.id);
    } catch (e) {
      setError('Failed to create team');
    } finally {
      setLoadingCreate(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.title}>Welcome to Timeharbor</Text>
            <Text style={styles.subtitle}>
              {sortedTeams.length > 0 ? 'Please select a team to continue.' : 'Create or join a team to get started.'}
            </Text>
          </View>

          {sortedTeams.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your Teams</Text>
              <ScrollView style={styles.teamList} showsVerticalScrollIndicator={false}>
                {sortedTeams.map((team) => {
                  const isActive = team.id === activeTeamId;
                  const isLeader = user?.uid === team.ownerId;
                  return (
                    <Pressable
                      key={team.id}
                      style={[styles.teamRow, isActive && styles.teamRowActive]}
                      onPress={() => {
                        onSelect(team);
                        onClose();
                      }}
                    >
                      <View style={styles.teamRowHeader}>
                        <View style={styles.teamIcon}>
                          <MaterialCommunityIcons
                            name="account-group"
                            size={18}
                            color={isActive ? colors.primary : colors.textSecondary}
                          />
                        </View>
                        <View style={styles.teamInfo}>
                          <Text style={styles.teamName} numberOfLines={1}>
                            {team.name}
                          </Text>
                          <Text style={styles.teamMeta}>{team.memberIds.length} members</Text>
                        </View>
                        <View style={[styles.roleBadge, isLeader ? styles.roleLeader : styles.roleMember]}>
                          <MaterialCommunityIcons
                            name={isLeader ? 'shield-account' : 'account'}
                            size={14}
                            color={isLeader ? '#7C3AED' : colors.textSecondary}
                          />
                          <Text style={[styles.roleText, isLeader ? styles.roleLeaderText : styles.roleMemberText]}>
                            {isLeader ? 'Leader' : 'Member'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.teamCodeRow}>
                        <Text style={styles.teamCode}>{team.joinCode}</Text>
                        <Pressable onPress={() => handleCopy(team.joinCode)}>
                          <MaterialCommunityIcons
                            name={copiedCode === team.joinCode ? 'check' : 'content-copy'}
                            size={18}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.actionsRow}>
            <Pressable style={styles.actionCard} onPress={() => setJoinOpen(true)}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.textSecondary} />
              <Text style={styles.actionText}>Join Team</Text>
            </Pressable>
            <Pressable style={[styles.actionCard, styles.actionCreate]} onPress={() => setCreateOpen(true)}>
              <MaterialCommunityIcons name="plus" size={18} color={colors.textSecondary} />
              <Text style={[styles.actionText, styles.actionCreateText]}>Create Team</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={joinOpen}
        title="Join a Team"
        onClose={() => {
          setJoinOpen(false);
          setJoinCode('');
          setError(null);
        }}
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalHelp}>Enter the 6-digit code provided by your team admin.</Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <Text style={styles.inputLabel}>Team Code</Text>
          <TextInput
            value={joinCode}
            onChangeText={(val) => {
              setJoinCode(val.toUpperCase());
              setError(null);
            }}
            placeholder="e.g. 123456"
            maxLength={6}
            autoCapitalize="characters"
            style={styles.codeInput}
          />
          <View style={styles.modalActions}>
            <Pressable style={styles.modalCancel} onPress={() => setJoinOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalPrimary, (joinCode.length < 6 || loadingJoin) && styles.modalDisabled]}
              onPress={handleJoin}
              disabled={joinCode.length < 6 || loadingJoin}
            >
              {loadingJoin ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.modalPrimaryText}>Join Team</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={createOpen}
        title="Create a Team"
        onClose={() => {
          setCreateOpen(false);
          setNewTeamName('');
          setCreatedTeamCode(null);
          setError(null);
        }}
      >
        {!createdTeamCode ? (
          <View style={styles.modalBody}>
            <Text style={styles.modalHelp}>
              Give your new team a name. You'll get a code to share with your members.
            </Text>
            <Text style={styles.inputLabel}>Team Name</Text>
            <TextInput
              value={newTeamName}
              onChangeText={setNewTeamName}
              placeholder="e.g. Engineering Team"
              style={styles.textInput}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setCreateOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalPrimary, (!newTeamName.trim() || loadingCreate) && styles.modalDisabled]}
                onPress={handleCreate}
                disabled={!newTeamName.trim() || loadingCreate}
              >
                {loadingCreate ? (
                  <ActivityIndicator size="small" color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.modalPrimaryText}>Create Team</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.createdWrap}>
            <View style={styles.createdIcon}>
              <MaterialCommunityIcons name="check" size={22} color={colors.success} />
            </View>
            <Text style={styles.createdTitle}>Team Created!</Text>
            <Text style={styles.createdSubtitle}>Share this code with your team members.</Text>
            <View style={styles.createdCodeRow}>
              <Text style={styles.createdCode}>{createdTeamCode}</Text>
              <Pressable onPress={() => handleCopy(createdTeamCode)}>
                <MaterialCommunityIcons
                  name={copiedCode === createdTeamCode ? 'check' : 'content-copy'}
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
            <Pressable
              style={styles.createdDone}
              onPress={() => {
                setCreateOpen(false);
                setCreatedTeamCode(null);
                onClose();
              }}
            >
              <Text style={styles.createdDoneText}>Done</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 50,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        } as any)
      : null),
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -spacing.sm,
    right: -spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  teamList: {
    maxHeight: 300,
  },
  teamRow: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  teamRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.infoLight,
  },
  teamRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  teamIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  teamMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleLeader: {
    backgroundColor: '#F3E8FF',
  },
  roleMember: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  roleText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  roleLeaderText: {
    color: '#7C3AED',
  },
  roleMemberText: {
    color: colors.textSecondary,
  },
  teamCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  teamCode: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionCreate: {
    borderColor: '#D8B4FE',
  },
  actionText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  actionCreateText: {
    color: '#7C3AED',
  },
  modalBody: {
    gap: spacing.md,
  },
  modalHelp: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: typography.weights.semibold,
  },
  errorText: {
    backgroundColor: colors.errorLight,
    color: colors.error,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.sm,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  modalCancel: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  modalPrimary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  modalPrimaryText: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.medium,
  },
  modalDisabled: {
    opacity: 0.6,
  },
  createdWrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  createdIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createdTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  createdSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createdCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  createdCode: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
    color: colors.textPrimary,
  },
  createdDone: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  createdDoneText: {
    color: colors.textOnPrimary,
    fontWeight: typography.weights.semibold,
  },
});
