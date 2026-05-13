import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Shadows, Spacing, TypeScale } from '../theme';

interface AppShellProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  rightSlot?: ReactNode;
}

export const AppShell = ({ title, subtitle, icon = 'school', children, rightSlot }: AppShellProps) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name={icon} size={22} color={Colors.onPrimary} />
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>CampusCare</Text>
            <Text style={styles.pageTitle}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.marginMobile,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceHigh,
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
    backgroundColor: Colors.primaryContainer,
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
    color: Colors.primary,
  },
  pageTitle: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
  content: {
    padding: Spacing.marginMobile,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.md,
  },
});
