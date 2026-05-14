import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, Shadows, Spacing, TypeScale, useTheme } from '../theme';

interface AppShellProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  rightSlot?: ReactNode;
}

export const AppShell = ({ title, subtitle, icon = 'school', children, rightSlot }: AppShellProps) => {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceHigh }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primaryContainer }]}>
            <Ionicons name={icon} size={22} color={colors.onPrimary} />
          </View>
          <View style={styles.brandText}>
            <Text style={[styles.brandTitle, { color: colors.primary }]}>CampusCare</Text>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
          </View>
        </View>
        {rightSlot}
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
  },
  pageTitle: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
    marginTop: 2,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
  content: {
    padding: Spacing.marginMobile,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.md,
  },
});
