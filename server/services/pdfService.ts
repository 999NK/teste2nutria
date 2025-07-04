import { User, DailyNutrition } from "@shared/schema";
import PDFDocument from 'pdfkit';

export interface ReportData {
  user: User;
  nutritionHistory: DailyNutrition[];
  startDate: string;
  endDate: string;
  type: 'daily' | 'weekly' | 'monthly';
  plan?: any; // Plan data for detailed PDF export
}

class PDFService {
  async generateNutritionReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).fillColor('#22C55E').text('Relatório Nutricional - NutrIA', 50, 50);
        doc.fontSize(12).fillColor('#000000').text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 50, 80);

        // User Info
        doc.fontSize(16).text('Informações do Usuário', 50, 120);
        doc.fontSize(12)
           .text(`Nome: ${data.user.firstName || 'N/A'} ${data.user.lastName || ''}`, 50, 140)
           .text(`Email: ${data.user.email}`, 50, 160)
           .text(`Período: ${data.startDate} a ${data.endDate}`, 50, 180);

        let yPos = 220;

        // Plan Details
        if (data.plan) {
          doc.fontSize(16).text('Detalhes do Plano', 50, yPos);
          yPos += 30;
          
          doc.fontSize(14).text(`Plano: ${data.plan.name}`, 50, yPos);
          yPos += 20;
          
          if (data.plan.description) {
            doc.fontSize(12).text(`Descrição: ${data.plan.description}`, 50, yPos);
            yPos += 20;
          }

          // Nutrition Goals
          if (data.plan.dailyCalories) {
            doc.fontSize(14).text('Metas Nutricionais:', 50, yPos);
            yPos += 20;
            doc.fontSize(12)
               .text(`• Calorias: ${data.plan.dailyCalories} kcal`, 70, yPos)
               .text(`• Proteínas: ${data.plan.dailyProtein}g`, 70, yPos + 15)
               .text(`• Carboidratos: ${data.plan.dailyCarbs}g`, 70, yPos + 30)
               .text(`• Gorduras: ${data.plan.dailyFat}g`, 70, yPos + 45);
            yPos += 80;
          }

          // Workout Schedule
          if (data.plan.meals && typeof data.plan.meals === 'string') {
            try {
              doc.fontSize(14).text('Cronograma de Treinos:', 50, yPos);
              yPos += 20;

              const meals = JSON.parse(data.plan.meals);
              const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
              
              days.forEach((day, index) => {
                const dayKey = `day${index + 1}`;
                if (meals[dayKey] && meals[dayKey].workout) {
                  if (yPos > 700) {
                    doc.addPage();
                    yPos = 50;
                  }
                  
                  doc.fontSize(12).text(`${day}:`, 70, yPos);
                  yPos += 15;
                  
                  const workout = meals[dayKey].workout;
                  if (typeof workout === 'string') {
                    const exercises = workout.split('\n').filter(ex => ex.trim());
                    exercises.forEach(exercise => {
                      // Parse exercise details
                      const match = exercise.match(/^(.*?)(?:\s*-\s*(\d+)\s*séries?\s*(?:de\s*)?(\d+)\s*(?:reps?|repetições))?/i);
                      if (match) {
                        const [, name, sets, reps] = match;
                        let exerciseText = `  • ${name.trim()}`;
                        if (sets && reps) {
                          exerciseText += ` - ${sets} séries de ${reps} repetições`;
                        }
                        doc.fontSize(10).text(exerciseText, 90, yPos);
                        yPos += 12;
                      } else {
                        doc.fontSize(10).text(`  • ${exercise.trim()}`, 90, yPos);
                        yPos += 12;
                      }
                    });
                  } else if (Array.isArray(workout)) {
                    workout.forEach((exercise: any) => {
                      let exerciseText = `  • ${exercise.name || exercise}`;
                      if (exercise.sets && exercise.reps) {
                        exerciseText += ` - ${exercise.sets} séries de ${exercise.reps} repetições`;
                      }
                      if (exercise.rest) {
                        exerciseText += ` (${exercise.rest}s descanso)`;
                      }
                      doc.fontSize(10).text(exerciseText, 90, yPos);
                      yPos += 12;
                    });
                  }
                  yPos += 10;
                }
              });
            } catch (parseError) {
              console.error('Error parsing workout schedule:', parseError);
            }
          }
        }

        // Nutrition History
        if (data.nutritionHistory && data.nutritionHistory.length > 0) {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
          
          doc.fontSize(16).text('Histórico Nutricional', 50, yPos);
          yPos += 30;

          data.nutritionHistory.forEach((day) => {
            if (yPos > 750) {
              doc.addPage();
              yPos = 50;
            }
            
            doc.fontSize(12)
               .text(`${day.date}: ${day.totalCalories || 0} kcal`, 50, yPos)
               .text(`Proteína: ${day.totalProtein || 0}g`, 200, yPos)
               .text(`Carb: ${day.totalCarbs || 0}g`, 300, yPos)
               .text(`Gordura: ${day.totalFat || 0}g`, 400, yPos);
            yPos += 20;
          });
        }

        doc.end();
      } catch (error) {
        console.error('Error generating PDF:', error);
        reject(new Error('Failed to generate PDF report'));
      }
    });
  }
}

export const pdfService = new PDFService();