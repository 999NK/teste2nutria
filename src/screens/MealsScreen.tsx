import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {mealsApi} from '../services/api';

interface MealsScreenProps {
  navigation: any;
}

const MealsScreen: React.FC<MealsScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const [meals, setMeals] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const mealsData = await mealsApi.getMeals(today);
      setMeals(mealsData || []);
    } catch (error) {
      console.error('Failed to load meals:', error);
      setMeals([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    headerSubtitle: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.7,
    },
    scrollContainer: {
      padding: 20,
      paddingTop: 10,
    },
    mealCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    mealType: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    mealFoods: {
      marginBottom: 10,
    },
    foodItem: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.8,
      marginBottom: 5,
    },
    mealTotals: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    totalItem: {
      alignItems: 'center',
    },
    totalValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    },
    totalLabel: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.6,
      marginTop: 2,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      color: theme.colors.text,
      opacity: 0.6,
      textAlign: 'center',
      marginBottom: 20,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      margin: 20,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refeições</Text>
        <Text style={styles.headerSubtitle}>Hoje, {new Date().toLocaleDateString('pt-BR')}</Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {meals.length > 0 ? (
          meals.map((meal, index) => (
            <View key={index} style={styles.mealCard}>
              <Text style={styles.mealType}>
                {meal.mealType?.name || 'Refeição'}
              </Text>
              
              <View style={styles.mealFoods}>
                {meal.mealFoods?.length > 0 ? (
                  meal.mealFoods.map((mealFood: any, foodIndex: number) => (
                    <Text key={foodIndex} style={styles.foodItem}>
                      • {mealFood.food?.name} - {mealFood.quantity}g
                    </Text>
                  ))
                ) : (
                  <Text style={styles.foodItem}>Nenhum alimento adicionado</Text>
                )}
              </View>

              <View style={styles.mealTotals}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{meal.total_calories || 0}</Text>
                  <Text style={styles.totalLabel}>kcal</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{meal.total_protein || 0}g</Text>
                  <Text style={styles.totalLabel}>Proteína</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{meal.total_carbs || 0}g</Text>
                  <Text style={styles.totalLabel}>Carbs</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{meal.total_fat || 0}g</Text>
                  <Text style={styles.totalLabel}>Gordura</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Você ainda não registrou{'\n'}nenhuma refeição hoje
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={() => {}}>
        <Text style={styles.addButtonText}>+ Adicionar Refeição</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MealsScreen;