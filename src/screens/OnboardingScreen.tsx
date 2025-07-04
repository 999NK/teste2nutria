import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../contexts/ThemeContext';
import {useAuth} from '../contexts/AuthContext';
import {authApi} from '../services/api';

interface OnboardingScreenProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({navigation}) => {
  const {theme} = useTheme();
  const {user, refreshUser} = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    goal: '',
    activityLevel: '',
  });

  const goals = [
    {id: 'lose_weight', label: 'Perder Peso', icon: '⬇️'},
    {id: 'maintain_weight', label: 'Manter Peso', icon: '➡️'},
    {id: 'gain_weight', label: 'Ganhar Peso', icon: '⬆️'},
    {id: 'build_muscle', label: 'Ganhar Músculo', icon: '💪'},
  ];

  const activityLevels = [
    {id: 'sedentary', label: 'Sedentário', description: 'Pouco ou nenhum exercício'},
    {id: 'light', label: 'Leve', description: 'Exercício leve 1-3 dias/semana'},
    {id: 'moderate', label: 'Moderado', description: 'Exercício moderado 3-5 dias/semana'},
    {id: 'active', label: 'Ativo', description: 'Exercício intenso 6-7 dias/semana'},
  ];

  const calculateNutritionGoals = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseFloat(formData.age);

    if (!weight || !height || !age) return null;

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5; // Male formula

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    };

    const tdee = bmr * (activityMultipliers[formData.activityLevel as keyof typeof activityMultipliers] || 1.2);

    // Goal adjustments
    let calories = tdee;
    if (formData.goal === 'lose_weight') calories -= 500;
    else if (formData.goal === 'gain_weight') calories += 500;

    // Macronutrient distribution (moderate approach)
    const protein = Math.round(weight * 2); // 2g per kg
    const fat = Math.round(calories * 0.25 / 9); // 25% of calories
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4);

    return {
      calories: Math.round(calories),
      protein,
      carbs,
      fat,
    };
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.weight || !formData.height || !formData.age) {
        Alert.alert('Erro', 'Por favor, preencha todos os campos');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.goal) {
        Alert.alert('Erro', 'Por favor, selecione seu objetivo');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!formData.activityLevel) {
        Alert.alert('Erro', 'Por favor, selecione seu nível de atividade');
        return;
      }
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const nutritionGoals = calculateNutritionGoals();
      
      if (!nutritionGoals) {
        Alert.alert('Erro', 'Erro ao calcular suas metas nutricionais');
        return;
      }

      const profileData = {
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        age: parseFloat(formData.age),
        goal: formData.goal,
        activityLevel: formData.activityLevel,
        dailyCalories: nutritionGoals.calories,
        dailyProtein: nutritionGoals.protein,
        dailyCarbs: nutritionGoals.carbs,
        dailyFat: nutritionGoals.fat,
        isProfileComplete: true,
      };

      await authApi.updateProfile(profileData);
      await refreshUser();
      
      Alert.alert(
        'Perfil Completo!',
        'Suas metas nutricionais foram calculadas e seu perfil está pronto.',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.replace('Main'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      Alert.alert('Erro', 'Falha ao salvar seu perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 40,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    headerSubtitle: {
      fontSize: 16,
      color: theme.colors.text,
      opacity: 0.7,
      marginBottom: 20,
    },
    progressContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    progressStep: {
      flex: 1,
      height: 4,
      backgroundColor: theme.colors.border,
      marginHorizontal: 2,
      borderRadius: 2,
    },
    progressStepActive: {
      backgroundColor: theme.colors.primary,
    },
    scrollContainer: {
      flex: 1,
      padding: 20,
      paddingTop: 0,
    },
    stepTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      backgroundColor: theme.colors.card,
      color: theme.colors.text,
    },
    inputRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    inputHalf: {
      flex: 0.48,
    },
    optionCard: {
      backgroundColor: theme.colors.card,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      alignItems: 'center',
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    optionIcon: {
      fontSize: 32,
      marginBottom: 10,
    },
    optionLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 5,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.colors.text,
      opacity: 0.7,
      textAlign: 'center',
    },
    buttonContainer: {
      padding: 20,
      paddingTop: 0,
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 10,
    },
    nextButtonDisabled: {
      opacity: 0.5,
    },
    nextButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '600',
    },
    skipButton: {
      padding: 16,
      alignItems: 'center',
    },
    skipButtonText: {
      color: theme.colors.text,
      fontSize: 16,
      opacity: 0.7,
    },
  });

  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Informações Básicas</Text>
      
      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, styles.inputHalf]}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={formData.weight}
            onChangeText={(text) => setFormData({...formData, weight: text})}
            placeholder="70"
            keyboardType="numeric"
            placeholderTextColor={theme.colors.text + '60'}
          />
        </View>
        
        <View style={[styles.inputContainer, styles.inputHalf]}>
          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            style={styles.input}
            value={formData.height}
            onChangeText={(text) => setFormData({...formData, height: text})}
            placeholder="175"
            keyboardType="numeric"
            placeholderTextColor={theme.colors.text + '60'}
          />
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Idade</Text>
        <TextInput
          style={styles.input}
          value={formData.age}
          onChangeText={(text) => setFormData({...formData, age: text})}
          placeholder="25"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.text + '60'}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Qual seu objetivo?</Text>
      
      {goals.map((goal) => (
        <TouchableOpacity
          key={goal.id}
          style={[
            styles.optionCard,
            formData.goal === goal.id && styles.optionCardSelected,
          ]}
          onPress={() => setFormData({...formData, goal: goal.id})}
        >
          <Text style={styles.optionIcon}>{goal.icon}</Text>
          <Text style={styles.optionLabel}>{goal.label}</Text>
        </TouchableOpacity>
      ))}
    </>
  );

  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Nível de Atividade</Text>
      
      {activityLevels.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.optionCard,
            formData.activityLevel === level.id && styles.optionCardSelected,
          ]}
          onPress={() => setFormData({...formData, activityLevel: level.id})}
        >
          <Text style={styles.optionLabel}>{level.label}</Text>
          <Text style={styles.optionDescription}>{level.description}</Text>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configure seu Perfil</Text>
        <Text style={styles.headerSubtitle}>
          Vamos personalizar sua experiência nutricional
        </Text>
        
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                step <= currentStep && styles.progressStepActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 3 ? 'Finalizar' : 'Próximo'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.skipButtonText}>Pular por agora</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OnboardingScreen;