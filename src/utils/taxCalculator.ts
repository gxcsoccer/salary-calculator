interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  quickDeduction: number;
}

// 2022年个人所得税累进税率表(年度综合所得适用)
const ANNUAL_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 36000, rate: 0.03, quickDeduction: 0 },
  { min: 36000, max: 144000, rate: 0.1, quickDeduction: 2520 },
  { min: 144000, max: 300000, rate: 0.2, quickDeduction: 16920 },
  { min: 300000, max: 420000, rate: 0.25, quickDeduction: 31920 },
  { min: 420000, max: 660000, rate: 0.3, quickDeduction: 52920 },
  { min: 660000, max: 960000, rate: 0.35, quickDeduction: 85920 },
  { min: 960000, max: Infinity, rate: 0.45, quickDeduction: 181920 },
];

// 按月换算后的综合所得税率表（用于年终奖计算）
const MONTHLY_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 3000, rate: 0.03, quickDeduction: 0 },
  { min: 3000, max: 12000, rate: 0.1, quickDeduction: 210 },
  { min: 12000, max: 25000, rate: 0.2, quickDeduction: 1410 },
  { min: 25000, max: 35000, rate: 0.25, quickDeduction: 2660 },
  { min: 35000, max: 55000, rate: 0.3, quickDeduction: 4410 },
  { min: 55000, max: 80000, rate: 0.35, quickDeduction: 7160 },
  { min: 80000, max: Infinity, rate: 0.45, quickDeduction: 15160 },
];

const MONTHLY_THRESHOLD = 5000; // 每月起征点

// 计算月度应纳税所得额的税款（使用年度税率表）
const calculateMonthlyTax = (accumulatedTaxableIncome: number): number => {
  if (accumulatedTaxableIncome <= 0) return 0;

  // // 将月度收入换算为年度收入来计算
  // const annualizedIncome = accumulatedTaxableIncome;

  const bracket = ANNUAL_TAX_BRACKETS.find(
    (bracket) => accumulatedTaxableIncome > bracket.min && accumulatedTaxableIncome <= bracket.max
  );

  if (!bracket) return 0;

  // 计算年度税额后除以12得到月度税额
  return (accumulatedTaxableIncome * bracket.rate - bracket.quickDeduction);
};

// 计算年终奖的税款（单独计税，使用月度税率表）
const calculateBonusTax = (bonusAmount: number): number => {
  const monthlyAverage = bonusAmount / 12;
  const taxRate = MONTHLY_TAX_BRACKETS.find(
    bracket => monthlyAverage > bracket.min && monthlyAverage <= bracket.max
  );

  if (!taxRate) return 0;

  return bonusAmount * taxRate.rate - taxRate.quickDeduction;
};

export const calculateYearTax = (
  monthlySalary: number,
  monthlyDeduction: number,
  bonusAmount: number,
  cityId: CityId,
  bonusMonth: 1 | 4
): {
  totalTax: number;
  monthlyTaxes: number[];
  bonusTax: number;
} => {
  const monthlyTaxes: number[] = [];
  let totalTax = 0;
  let accumulatedIncome = 0;
  let previousTax = 0;
  let bonusTax = 0;

  const totalPayment = calculateTotalPayment(monthlySalary, cityId);
  monthlyDeduction += totalPayment.totalPayment;

  const monthCount = bonusMonth === 1 ? 13 : 12;

  // 计算12个月的常规工资税收（使用累计预扣法）
  for (let month = 1; month <= monthCount; month++) {
    accumulatedIncome += monthlySalary;
    const accumulatedDeduction = monthlyDeduction * month + MONTHLY_THRESHOLD * month;
    const accumulatedTaxableIncome = accumulatedIncome - accumulatedDeduction;

    const currentAccumulatedTax = calculateMonthlyTax(accumulatedTaxableIncome);
    const monthTax = currentAccumulatedTax - previousTax;

    monthlyTaxes.push(monthTax);
    totalTax += monthTax;
    previousTax = currentAccumulatedTax;
  }

  // 如果是4月发放，采用年终奖单独计税方式
  bonusTax = calculateBonusTax(bonusMonth === 4 ? bonusAmount + monthlySalary : bonusAmount);
  totalTax += bonusTax;

  return {
    totalTax,
    monthlyTaxes,
    bonusTax,
  };
};

export const compareBonus = (
  monthlySalary: number,
  monthlyDeduction: number,
  bonusAmount: number,
  cityId: CityId,
): {
  januaryTax: number;
  aprilTax: number;
  recommendation: '1月' | '4月';
  taxDifference: number;
} => {
  const januaryResult = calculateYearTax(monthlySalary, monthlyDeduction, bonusAmount, cityId, 1);
  const aprilResult = calculateYearTax(monthlySalary, monthlyDeduction, bonusAmount, cityId, 4);

  const taxDifference = Math.abs(januaryResult.totalTax - aprilResult.totalTax);
  const recommendation = januaryResult.totalTax <= aprilResult.totalTax ? '1月' : '4月';

  return {
    januaryTax: januaryResult.totalTax,
    aprilTax: aprilResult.totalTax,
    recommendation,
    taxDifference,
  };
};

export type CityId = 'beijing' | 'shanghai' | 'hefei';

interface CityInfo {
  id: CityId;
  name: string;
  averageSalary: number;
  pensionRate: number;
  medicalRate: number;
  unemploymentRate: number;
  housingFundRate: number;
}

// 添加城市相关信息配置
const CITY_INFO: Record<CityId, CityInfo> = {
  beijing: {
    id: 'beijing',
    name: '北京',
    averageSalary: 15701,
    pensionRate: 0.08, // 个人缴费比例8%
    medicalRate: 0.02,
    unemploymentRate: 0.005,
    housingFundRate: 0.12,
  },
  shanghai: {
    id: 'shanghai',
    name: '上海',
    averageSalary: 12307,
    pensionRate: 0.08,
    medicalRate: 0.02,
    unemploymentRate: 0.005,
    housingFundRate: 0.12,
  },
  hefei: {
    id: 'hefei',
    name: '合肥',
    averageSalary: 10502,
    pensionRate: 0.08,
    medicalRate: 0.02,
    unemploymentRate: 0.005,
    housingFundRate: 0.12,
  },
};

/**
 * 计算养老保险个人缴费基数
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 每月应缴纳的养老保险费
 */
export const calculatePensionBase = (monthlySalary: number, cityId: CityId): number => {
  const cityInfo = CITY_INFO[cityId];
  const { averageSalary } = cityInfo;

  // 计算上下限
  const minBase = averageSalary * 0.6;
  const maxBase = averageSalary * 3;

  // 确定缴费基数
  let pensionBase: number;
  if (monthlySalary < minBase) {
    pensionBase = minBase;
  } else if (monthlySalary > maxBase) {
    pensionBase = maxBase;
  } else {
    pensionBase = monthlySalary;
  }

  return pensionBase;
};

/**
 * 计算养老保险个人缴费金额
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 每月应缴纳的养老保险费
 */
export const calculatePensionPayment = (monthlySalary: number, cityId: CityId): {
  payment: number;
  base: number;
  rate: number;
} => {
  const cityInfo = CITY_INFO[cityId];
  const base = calculatePensionBase(monthlySalary, cityId);
  const payment = base * cityInfo.pensionRate;

  return {
    payment: Math.round(payment * 100) / 100, // 保留2位小数
    base: Math.round(base * 100) / 100,
    rate: cityInfo.pensionRate,
  };
};

/**
 * 计算医疗保险个人缴费基数
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 医疗保险缴费基数
 */
export const calculateMedicalBase = (monthlySalary: number, cityId: CityId): number => {
  const cityInfo = CITY_INFO[cityId];
  const { averageSalary } = cityInfo;

  // 计算上下限
  const minBase = averageSalary * 0.6;
  const maxBase = averageSalary * 3;

  // 确定缴费基数
  let medicalBase: number;
  if (monthlySalary < minBase) {
    medicalBase = minBase;
  } else if (monthlySalary > maxBase) {
    medicalBase = maxBase;
  } else {
    medicalBase = monthlySalary;
  }

  return medicalBase;
};

/**
 * 计算医疗保险个人缴费金额
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 每月应缴纳的医疗保险费
 */
export const calculateMedicalPayment = (monthlySalary: number, cityId: CityId): {
  payment: number;
  base: number;
  rate: number;
} => {
  const cityInfo = CITY_INFO[cityId];
  const base = calculateMedicalBase(monthlySalary, cityId);
  const payment = base * cityInfo.medicalRate;

  return {
    payment: Math.round(payment * 100) / 100, // 保留2位小数
    base: Math.round(base * 100) / 100,
    rate: cityInfo.medicalRate,
  };
};

/**
 * 计算失业保险个人缴费基数
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 失业保险缴费基数
 */
export const calculateUnemploymentBase = (monthlySalary: number, cityId: CityId): number => {
  const cityInfo = CITY_INFO[cityId];
  const { averageSalary } = cityInfo;

  // 计算上下限
  const minBase = averageSalary * 0.6;
  const maxBase = averageSalary * 3;

  // 确定缴费基数
  let unemploymentBase: number;
  if (monthlySalary < minBase) {
    unemploymentBase = minBase;
  } else if (monthlySalary > maxBase) {
    unemploymentBase = maxBase;
  } else {
    unemploymentBase = monthlySalary;
  }

  return unemploymentBase;
};

/**
 * 计算失业保险个人缴费金额
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 每月应缴纳的失业保险费
 */
export const calculateUnemploymentPayment = (monthlySalary: number, cityId: CityId): {
  payment: number;
  base: number;
  rate: number;
} => {
  const cityInfo = CITY_INFO[cityId];
  const base = calculateUnemploymentBase(monthlySalary, cityId);
  const payment = base * cityInfo.unemploymentRate;

  return {
    payment: Math.round(payment * 100) / 100, // 保留2位小数
    base: Math.round(base * 100) / 100,
    rate: cityInfo.unemploymentRate,
  };
};

/**
 * 计算住房公积金个人缴费基数
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 住房公积金缴费基数
 */
export const calculateHousingFundBase = (monthlySalary: number, cityId: CityId): number => {
  const cityInfo = CITY_INFO[cityId];
  const { averageSalary } = cityInfo;

  // 计算上下限
  const minBase = averageSalary * 0.6;
  const maxBase = averageSalary * 3;

  // 确定缴费基数
  let housingFundBase: number;
  if (monthlySalary < minBase) {
    housingFundBase = minBase;
  } else if (monthlySalary > maxBase) {
    housingFundBase = maxBase;
  } else {
    housingFundBase = monthlySalary;
  }

  return housingFundBase;
};

/**
 * 计算住房公积金个人缴费金额
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 每月应缴纳的住房公积金
 */
export const calculateHousingFundPayment = (monthlySalary: number, cityId: CityId): {
  payment: number;
  base: number;
  rate: number;
} => {
  const cityInfo = CITY_INFO[cityId];
  const base = calculateHousingFundBase(monthlySalary, cityId);
  const payment = base * cityInfo.housingFundRate;

  return {
    payment: Math.round(payment * 100) / 100, // 保留2位小数
    base: Math.round(base * 100) / 100,
    rate: cityInfo.housingFundRate,
  };
};

/**
 * 计算社保和公积金个人缴费总额
 * @param monthlySalary 月薪
 * @param cityId 城市ID
 * @returns 每月应缴纳的总额
 */
export const calculateTotalPayment = (monthlySalary: number, cityId: CityId): {
  totalPayment: number;
  pension: {
    payment: number;
    base: number;
    rate: number;
  };
  medical: {
    payment: number;
    base: number;
    rate: number;
  };
  unemployment: {
    payment: number;
    base: number;
    rate: number;
  };
  housingFund: {
    payment: number;
    base: number;
    rate: number;
  };
} => {
  const pension = calculatePensionPayment(monthlySalary, cityId);
  const medical = calculateMedicalPayment(monthlySalary, cityId);
  const unemployment = calculateUnemploymentPayment(monthlySalary, cityId);
  const housingFund = calculateHousingFundPayment(monthlySalary, cityId);

  return {
    totalPayment: Math.round(
      (pension.payment + medical.payment + unemployment.payment + housingFund.payment) * 100
    ) / 100,
    pension,
    medical,
    unemployment,
    housingFund,
  };
}; 
