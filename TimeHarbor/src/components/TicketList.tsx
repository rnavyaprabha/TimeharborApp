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
  trackingEnabled?: boolean;
  onStartTicket: (ticket: Ticket) => void;
  onStopTicket?: (ticket: Ticket) => void;
  onSeeAll?: () => void;
  onAddTicket?: () => void;
  maxItems?: number;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  activeTicketId,
  activeTicketElapsedSeconds = 0,
  trackingEnabled = true,
  onStartTicket,
  onStopTicket,
  onSeeAll,
  onAddTicket,
  maxItems = 5,
}) => {
  const displayTickets = tickets.slice(0, maxItems);
  const openTickets = displayTickets.filter(
    (t) => t.status === 'Open' || t.status === 'In Progress'
  );

  const renderTicket = ({ item }: { item: Ticket }) => {
    const isActive = item.id === activeTicketId;

    return (
      <View style={styles.ticketRow}>
        <View style={styles.ticketIcon}>
          <MaterialCommunityIcons name="ticket-outline" size={18} color={colors.primary} />
        </View>

        <View style={styles.ticketContent}>
          <Text style={styles.ticketTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.ticketMeta}>
            {item.id.slice(0, 8)} - {formatDuration(item.lastTrackedDuration ?? 0)}
          </Text>
        </View>

        <View style={styles.ticketActions}>
          <TouchableOpacity
            style={[
              styles.playButton,
              isActive && styles.stopButton,
              !trackingEnabled && !isActive && styles.playButtonDisabled,
            ]}
            disabled={!trackingEnabled && !isActive}
            onPress={() => (isActive ? onStopTicket?.(item) : onStartTicket(item))}
          >
            <MaterialCommunityIcons
              name={isActive ? 'stop' : 'play'}
              size={14}
              color={isActive ? '#EF4444' : trackingEnabled ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
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
          <TouchableOpacity style={styles.addButton} onPress={() => onAddTicket?.()}>
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
          <Text style={styles.emptyText}>No tickets found. Create one to get started!</Text>
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
    fontFamily: typography.fonts.bold,
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
    fontFamily: typography.fonts.medium,
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  ticketIcon: {
    width: 32,
    height: 32,
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
    fontFamily: typography.fonts.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ticketMeta: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontFamily: typography.fonts.medium,
  },
  ticketActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.infoLight,
  },
  playButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderLight,
  },
  stopButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  activeTimer: {
    fontSize: 10,
    color: colors.error,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fonts.semibold,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontFamily: typography.fonts.medium,
  },
});
