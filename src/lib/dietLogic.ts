// src/lib/dietLogic.ts

export const calculateMetrics = (data: { weight: number, height: number, age: number, activityLevel: string, exerciseTime: number }) => {
  const { weight, height, age, activityLevel, exerciseTime } = data;
  let bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  const dailyRoutineCal = 400; 
  
  const activityFactors: Record<string, number> = { "1": 0.1, "2": 0.15, "3": 0.25, "4": 0.35, "5": 0.45, "6": 0.6, "7": 0.8 };
  const metBase: Record<string, number> = { "1": 2.5, "2": 3.0, "3": 4.0, "4": 5.0, "5": 6.5, "6": 8.0, "7": 10.0 };
  
  const exerciseCal = ( (exerciseTime / 60) * metBase[activityLevel] * weight );
  const activityCal = Math.round((bmr * activityFactors[activityLevel]) + exerciseCal);
  const tdee = Math.round(bmr + dailyRoutineCal + activityCal);
  const bmi = parseFloat((weight / ((height/100)**2)).toFixed(1));
  
  let bmiStatus = ""; let bmiColor = "";
  if (bmi < 18.5) { bmiStatus = "저체중"; bmiColor = "#3498db"; }
  else if (bmi < 23) { bmiStatus = "정상"; bmiColor = "#2ecc71"; }
  else if (bmi < 25) { bmiStatus = "과체중"; bmiColor = "#f39c12"; }
  else if (bmi < 30) { bmiStatus = "비만"; bmiColor = "#e74c3c"; }
  else { bmiStatus = "고도비만"; bmiColor = "#c0392b"; }
  
  return { bmi, bmiStatus, bmiColor, bmr: Math.round(bmr), dailyRoutineCal, activityCal, tdee };
};

export const getRoadmap = (currentWeight: number, targetWeight: number, dailyStatus: number) => {
  let list = [];
  const startWeight = currentWeight;
  const goalWeight = targetWeight;
  const status = dailyStatus;
  const kcalPerKg = 7700;

  if (status <= 50 || isNaN(status)) return { error: "칼로리 소모 차이가 너무 적습니다." };

  let tempWeight = startWeight;
  while (tempWeight > goalWeight && list.length < 50) {
    let nextWeight = Math.max(goalWeight, tempWeight - 1);
    let totalLostSoFar = startWeight - nextWeight;
    let cumulativeDays = Math.round((totalLostSoFar * kcalPerKg) / status);
    
    let prevCumulative = list.length > 0 ? (list[list.length-1] as any).cumVal : 0;
    let period = cumulativeDays - prevCumulative;

    list.push({ 
      target: nextWeight.toFixed(1) + "kg", 
      period: period + "일", 
      cumulative: cumulativeDays + "일",
      cumVal: cumulativeDays 
    });
    tempWeight = nextWeight;
  }
  return { list, totalDays: list.length > 0 ? (list[list.length-1] as any).cumulative : "0일" };
};