import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import { COLORS } from '../theme/colors';

const ScreenHeader = ({
  title,
  subtitle,
  onBackPress,
  rightComponent,
  style = {}
}) => {
  return (
    <View style={[styles.headerContainer, style]}>

      <View style={styles.topRow}>
        <View style={styles.leftContainer}>
          {onBackPress && (
            <TouchableOpacity
              onPress={onBackPress}
              style={styles.backButton}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.title}>
            {title}
          </Text>
        </View>

        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      </View>

      {subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer