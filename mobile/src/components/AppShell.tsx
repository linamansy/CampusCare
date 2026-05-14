import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts, Shadows, Spacing, TypeScale, useTheme } from '../theme';

interface AppShellProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  rightSlot?: ReactNode;
}

export const AppShell = ({ title, subtitle, icon = 'school', children, rightSlot }: AppShellProps) => {
  const { colors, isDark } = useTheme();

  const gradientColors = isDark
    ? ([colors.surface, colors.surfaceLow] as [string, string])
    : ([colors.primary, '#2563EB'] as [string, string]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.brandRow}>
          <View style={[styles.brandIcon, { backgroundColor: isDark ? colors.surfaceHigh : 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name={icon} size={22} color={isDark ? colors.primary : '#FFFFFF'} />
          </View>
          <View style={styles.brandText}>
            <Text style={[styles.brandTitle, { color: isDark ? colors.primary : 'rgba(255,255,255,0.75)' }]}>
              CampusCare
            </Text>
            <Text style={[styles.pageTitle, { color: isDark ? colors.textPrimary : '#FFFFFF' }]}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: isDark ? colors.textSecondary : 'rgba(255,255,255,0.8)' }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {rightSlot}
      </LinearGradient>
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
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.soft,
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
