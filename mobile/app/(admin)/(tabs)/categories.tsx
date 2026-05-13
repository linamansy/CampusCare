import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../../../src/api/admin';
import { AppShell } from '../../../src/components/AppShell';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { ErrorState } from '../../../src/components/ErrorState';
import { Input } from '../../../src/components/Input';
import { LoadingState } from '../../../src/components/LoadingState';
import { Colors, Fonts, Spacing, TypeScale } from '../../../src/theme';

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setCategories(await fetchCategories());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <LoadingState label="Loading categories..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <AppShell title="Category Management" subtitle="Manage issue categories from the admin API.">
      <Card>
        <Input label="New Category" value={newCategory} onChangeText={setNewCategory} />
        <Button title="Add Category" onPress={async () => {
          if (!newCategory.trim()) {
            return;
          }
          await createCategory(newCategory);
          setNewCategory('');
          await load();
        }} />
      </Card>

      {categories.length === 0 ? (
        <EmptyState title="No categories configured" />
      ) : (
        categories.map((category) => (
          <Card key={category} style={styles.card}>
            <Text style={styles.title}>{category}</Text>
            <View style={styles.actions}>
              <Button title="Rename" variant="ghost" onPress={async () => {
                await updateCategory(category, `${category} Updated`);
                await load();
              }} style={styles.actionButton} />
              <Button title="Delete" variant="danger" onPress={async () => {
                await deleteCategory(category);
                await load();
              }} style={styles.actionButton} />
            </View>
          </Card>
        ))
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
    color: Colors.textPrimary,
  },
  actions: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
