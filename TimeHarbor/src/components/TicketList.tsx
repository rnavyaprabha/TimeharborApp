import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';
import { Ticket } from '../types';
import { formatDuration } from '../services/ticketService';
import { formatTimer } from '../services/timeSessionService';

interface TicketListProps {
  tickets: Ticket[];
  activeTicketId?: string;
  activeTicketElapsedSeconds?: number;
  onStartTicket: (ticket: Ticket) => void;
  onStopTicket?: (ticket: Ticket) => void;
  onSeeAll?: () => void;
  maxItems?: number;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  activeTicketId,
  activeTicketElapsedSeconds = 0,
  onStartTicket,
  onStopTicket,
  onSeeAll,
  maxItems = 5,
}) => {
  const displayTickets = tickets.slice(0, maxItems);
  const openTickets = displayTickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  );

  const renderTicket = ({ item }: { item: Ticket }) => {
    const isActive = item.id === activeTicketId;

    return (
      <View style={[styles.ticketRow, isActive && styles.ticketRowActive]}>
        <View style={styles.ticketIcon}>
          <MaterialCommunityIcons name="ticket-outline" size={20} color={colors.primary} />
        </View>

        <View style={styles.ticketContent}>
          <Text style={styles.ticketTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.ticketMeta}>
            {item.id.slice(0, 6)} • {formatDuration(item.totalTimeSpent)}
          </Text>
        </View>

        <View style={styles.ticketActions}>
          <TouchableOpacity
            style={[styles.playButton, isActive && styles.stopButton]}
            onPress={() => (isActive ? onStopTicket?.(item) : onStartTicket(item))}
          >
            <MaterialCommunityIcons
              name={isActive ? 'stop' : 'play'}
              size={16}
              color={isActive ? '#EF4444' : colors.primary}
            />
          </TouchableOpacity>
          <View style={[styles.statusBadge, isActive && styles.statusBadgeActive]}>
            <Text style={[styles.statusText, isActive && styles.statusTextActive]}>
              {isActive ? 'Open' : 'Open'}
            </Text>
          </View>
          {isActive && (
            <Text style={styles.activeTimer}>{formatTimer(activeTicketElapsedSeconds)}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Open Tickets</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.addButton}>
            <MaterialCommunityIcons name="plus" size={18} color={colors.textOnPrimary} />
          </TouchableOpacity>
          {onSeeAll && (
            <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
              <Text style={styles.seeAllText}>See All</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {openTickets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No open tickets</Text>
        </View>
      ) : (
        <FlatList
          data={openTickets}
          renderItem={renderTicket}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  ticketRowActive: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  ticketIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  ticketContent: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ticketMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  ticketActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadgeActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  statusTextActive: {
    color: colors.textSecondary,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stopButton: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  activeTimer: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    fontWeight: typography.weights.semibold,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
