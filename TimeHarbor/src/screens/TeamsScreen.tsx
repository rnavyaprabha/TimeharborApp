import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserTeams } from '../services/teamService';
import { useAuthStore } from '../store/authStore';
import { Team } from '../types';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface TeamsScreenProps {
  onCreateTeam: () => void;
  onJoinTeam: () => void;
}

export const TeamsScreen: React.FC<TeamsScreenProps> = ({ onCreateTeam, onJoinTeam }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((state) => state.user);

  const loadTeams = useCallback(async () => {
    if (!user) return;

    try {
      const userTeams = await getUserTeams(user.uid);
      setTeams(userTeams);
    } catch (error: any) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTeams();
  };

  const handleCopyJoinCode = async (joinCode: string, teamName: string) => {
    await Clipboard.setStringAsync(joinCode);
    Alert.alert('Copied!', `Join code "${joinCode}" for ${teamName} copied to clipboard`);
  };

  const isOwner = (team: Team) => {
    return user?.uid === team.ownerId;
  };

  const getAvatarColor = (index: number) => {
    const avatarColors = [
      colors.avatarPurple,
      colors.avatarBlue,
      colors.avatarGreen,
      colors.avatarOrange,
      colors.avatarPink,
    ];
    return avatarColors[index % avatarColors.length];
  };

  const renderTeam = ({ item, index }: { item: Team; index: number }) => (
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <View style={styles.teamTitleRow}>
          <Text style={styles.teamName}>{item.name}</Text>
          {isOwner(item) && (
            <View style={styles.leaderBadge}>
              <Text style={styles.leaderBadgeText}>Leader</Text>
            </View>
          )}
        </View>
        <View style={styles.teamActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.memberCount}>{item.memberIds.length} members</Text>

      {/* Collaborators Section */}
      <View style={styles.collaboratorsSection}>
        <View style={styles.collaboratorsHeader}>
          <Text style={styles.collaboratorsTitle}>Collaborators</Text>
          {isOwner(item) && (
            <TouchableOpacity style={styles.addMemberButton}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.addMemberText}>Add Member</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Member Avatars */}
        <View style={styles.membersList}>
          {item.memberIds.slice(0, 5).map((memberId, idx) => (
            <View key={memberId} style={styles.memberItem}>
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(idx) }]}>
                <Text style={styles.avatarText}>
                  {memberId.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.memberName}>Member {idx + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Join Code for Owner */}
      {isOwner(item) && (
        <TouchableOpacity
          style={styles.joinCodeBadge}
          onPress={() => handleCopyJoinCode(item.joinCode, item.name)}
        >
          <Text style={styles.joinCodeLabel}>Code: </Text>
          <Text style={styles.joinCodeValue}>{item.joinCode}</Text>
          <MaterialCommunityIcons
            name="content-copy"
            size={16}
            color={colors.textSecondary}
            style={styles.copyIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Page Title with Join Code */}
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>Teams</Text>
        {teams.length > 0 && teams.some((t) => isOwner(t)) && (
          <TouchableOpacity
            style={styles.codeBadge}
            onPress={() => {
              const ownedTeam = teams.find((t) => isOwner(t));
              if (ownedTeam) {
                handleCopyJoinCode(ownedTeam.joinCode, ownedTeam.name);
              }
            }}
          >
            <Text style={styles.codeBadgeLabel}>Code: </Text>
            <Text style={styles.codeBadgeValue}>
              {teams.find((t) => isOwner(t))?.joinCode}
            </Text>
            <MaterialCommunityIcons
              name="content-copy"
              size={14}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Action Cards */}
      <View style={styles.actionCards}>
        <TouchableOpacity
          style={[styles.actionCard, styles.joinTeamCard]}
          onPress={onJoinTeam}
          activeOpacity={0.8}
        >
          <View style={styles.actionCardIcon}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardTitle}>Join a Team</Text>
            <Text style={styles.actionCardSubtitle}>
              Find your team and start collaborating
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.createTeamCard]}
          onPress={onCreateTeam}
          activeOpacity={0.8}
        >
          <View style={styles.actionCardIcon}>
            <MaterialCommunityIcons
              name="plus"
              size={28}
              color={colors.success}
            />
          </View>
          <View style={styles.actionCardContent}>
            <Text style={styles.actionCardTitle}>Create a Team</Text>
            <Text style={styles.actionCardSubtitle}>
              Set up a new workspace for your team
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Your Teams Title */}
      {teams.length > 0 && (
        <Text style={styles.sectionTitle}>Your Team</Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="account-group-outline"
        size={64}
        color={colors.textMuted}
      />
      <Text style={styles.emptyTitle}>No Teams Yet</Text>
      <Text style={styles.emptyText}>
        Create a new team or join an existing one to get started
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          teams.length === 0 && styles.emptyList,
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundStart,
  },
  list: {
    padding: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? spacing.xxxl + 40 : spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: spacing.xl,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginLeft: spacing.md,
  },
  codeBadgeLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  codeBadgeValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  actionCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  joinTeamCard: {
    backgroundColor: colors.cardJoinTeam,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  createTeamCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  actionCardSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  teamCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    borderStyle: 'dashed',
    ...shadows.sm,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  leaderBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  leaderBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.success,
  },
  teamActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.sm,
  },
  memberCount: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  collaboratorsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  collaboratorsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  collaboratorsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMemberText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    marginLeft: spacing.xs,
  },
  membersList: {
    gap: spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textOnPrimary,
  },
  memberName: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  joinCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
  joinCodeLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  joinCodeValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  copyIcon: {
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
