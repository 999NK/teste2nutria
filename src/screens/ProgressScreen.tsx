import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useAuth} from '../contexts/AuthContext';
import {nutritionApi} from '../services/api';

const {width} = Dimensions.get('window');

interface ProgressScreenProps {
  navigation: any;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const {user} = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const data = await nutritionApi.getNutritionHistory(startDate, endDate);
      setWeeklyData(data || []);
    } catch (error) {
      console.error('Failed to load progress data:', error);
      setWeeklyData([]);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const weekDays = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      weekDays.push({
        label: days[date.getDay()],
        date: date.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    
    return weekDays;
  };

  const getDataForDate = (date: string) => {
    return weeklyData.find(item => item.date === date);
  };

  const calculatePercentage = (consumed: number, target: number) => {
    return target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
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
    weeklyChart: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    chartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 120,
      marginBottom: 15,
    },
    dayColumn: {
      alignItems: 'center',
      flex: 1,
    },
    barContainer: {
      height: 80,
      width: 20,
      backgroundColor: theme.colors.border,
      borderRadius: 10,
      justifyContent: 'flex-end',
      overflow: 'hidden',
      marginBottom: 5,
    },
    bar: {
      width: '100%',
      borderRadius: 10,
      minHeight: 2,
    },
    dayLabel: {
      fontSize: 12,
      color: theme.colors.text,
      opacity: 0.7,
    },
    todayLabel: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statsCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    statLabel: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginRight: 10,
    },
    statPercentage: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    goalCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
    },
    goalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    goalItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    goalLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    goalValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
  });

  const weekDays = getWeekDays();
  const todayData = getDataForDate(new Date().toISOString().split('T')[0]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progresso</Text>
        <Text style={styles.headerSubtitle}>Últimos 7 dias</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Weekly Chart */}
        <View style={styles.weeklyChart}>
          <Text style={styles.chartTitle}>Calorias Consumidas</Text>
          <View style={styles.chartContainer}>
            {weekDays.map((day, index) => {
              const dayData = getDataForDate(day.date);
              const percentage = calculatePercentage(
                dayData?.calories || 0,
                user?.target_calories || 2000
              );
              
              return (
                <View key={index} style={styles.dayColumn}>
                  <View style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar,
                        {
                          height: `${percentage}%`,
                          backgroundColor: day.isToday ? theme.colors.primary : theme.colors.accent,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Today's Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Estatísticas de Hoje</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Calorias</Text>
            <Text style={styles.statValue}>
              {todayData?.calories || 0} / {user?.target_calories || 2000}
            </Text>
            <Text style={styles.statPercentage}>
              {calculatePercentage(todayData?.calories || 0, user?.target_calories || 2000).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Proteína</Text>
            <Text style={styles.statValue}>
              {todayData?.protein || 0}g / {user?.target_protein || 150}g
            </Text>
            <Text style={styles.statPercentage}>
              {calculatePercentage(todayData?.protein || 0, user?.target_protein || 150).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Carboidratos</Text>
            <Text style={styles.statValue}>
              {todayData?.carbs || 0}g / {user?.target_carbs || 250}g
            </Text>
            <Text style={styles.statPercentage}>
              {calculatePercentage(todayData?.carbs || 0, user?.target_carbs || 250).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Gordura</Text>
            <Text style={styles.statValue}>
              {todayData?.fat || 0}g / {user?.target_fat || 65}g
            </Text>
            <Text style={styles.statPercentage}>
              {calculatePercentage(todayData?.fat || 0, user?.target_fat || 65).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>Suas Metas Diárias</Text>
          
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Calorias:</Text>
            <Text style={styles.goalValue}>{user?.target_calories || 2000} kcal</Text>
          </View>
          
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Proteína:</Text>
            <Text style={styles.goalValue}>{user?.target_protein || 150}g</Text>
          </View>
          
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Carboidratos:</Text>
            <Text style={styles.goalValue}>{user?.target_carbs || 250}g</Text>
          </View>
          
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>Gordura:</Text>
            <Text style={styles.goalValue}>{user?.target_fat || 65}g</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProgressScreen;