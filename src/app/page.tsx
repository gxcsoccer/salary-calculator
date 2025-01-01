'use client';
import { useState } from "react";
import { compareBonus, CityId } from '@/utils/taxCalculator';

const CITIES = [
  { id: "shanghai", name: "上海" },
  { id: "hefei", name: "合肥" },
  { id: "beijing", name: "北京" },
] as const;

type ValidationErrors = {
  monthlySalary?: string;
  monthlyDeduction?: string;
  bonusAmount?: string;
};

export default function Home() {
  const [monthlySalary, setMonthlySalary] = useState("");
  const [monthlyDeduction, setMonthlyDeduction] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>(CITIES[0].id);
  const [result, setResult] = useState<string>("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isCalculating, setIsCalculating] = useState(false);

  const validateInputs = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!monthlySalary) {
      newErrors.monthlySalary = "请输入月薪";
    } else if (Number(monthlySalary) <= 0) {
      newErrors.monthlySalary = "月薪必须大于0";
    } else if (Number(monthlySalary) > 1000000) {
      newErrors.monthlySalary = "月薪似乎太高了";
    }

    if (!monthlyDeduction) {
      newErrors.monthlyDeduction = "请输入每月抵扣额度";
    } else if (Number(monthlyDeduction) < 0) {
      newErrors.monthlyDeduction = "抵扣额度不能为负数";
    } else if (Number(monthlyDeduction) > Number(monthlySalary)) {
      newErrors.monthlyDeduction = "抵扣额度不能大于月薪";
    }

    if (!bonusAmount) {
      newErrors.bonusAmount = "请输入年终奖金额";
    } else if (Number(bonusAmount) < 0) {
      newErrors.bonusAmount = "年终奖不能为负数";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    if (!validateInputs()) {
      return;
    }

    setIsCalculating(true);

    setTimeout(() => {
      const result = compareBonus(
        Number(monthlySalary),
        Number(monthlyDeduction),
        Number(bonusAmount),
        selectedCity as CityId,
      );

      setResult(
        `建议在${result.recommendation}领取，可以少缴纳个税 ${result.taxDifference.toFixed(2)} 元。
        \n1月领取总税额：${result.januaryTax.toFixed(2)} 元
        \n4月领取总税额：${result.aprilTax.toFixed(2)} 元`
      );

      setIsCalculating(false);
    }, 500);
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMonthlySalary(value);
    if (errors.monthlySalary) {
      setErrors(prev => ({ ...prev, monthlySalary: undefined }));
    }
  };

  const handleDeductionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMonthlyDeduction(value);
    if (errors.monthlyDeduction) {
      setErrors(prev => ({ ...prev, monthlyDeduction: undefined }));
    }
  };

  const handleBonusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBonusAmount(value);
    if (errors.bonusAmount) {
      setErrors(prev => ({ ...prev, bonusAmount: undefined }));
    }
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center mb-8">十三薪领取时间计算器</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              月薪（元）
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              value={monthlySalary}
              onChange={handleSalaryChange}
              className={`w-full p-2 border rounded bg-background text-foreground transition-colors
                ${errors.monthlySalary ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}
              `}
              placeholder="请输入月薪"
            />
            {errors.monthlySalary && (
              <p className="mt-1 text-sm text-red-500">{errors.monthlySalary}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              每月抵扣额度（元）
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              value={monthlyDeduction}
              onChange={handleDeductionChange}
              className={`w-full p-2 border rounded bg-background text-foreground transition-colors
                ${errors.monthlyDeduction ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}
              `}
              placeholder="请输入每月抵扣额度"
            />
            {errors.monthlyDeduction && (
              <p className="mt-1 text-sm text-red-500">{errors.monthlyDeduction}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              年终奖金额（元）
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              value={bonusAmount}
              onChange={handleBonusChange}
              className={`w-full p-2 border rounded bg-background text-foreground transition-colors
                ${errors.bonusAmount ? 'border-red-500' : 'border-gray-300 focus:border-blue-500'}
              `}
              placeholder="请输入年终奖金额"
            />
            {errors.bonusAmount && (
              <p className="mt-1 text-sm text-red-500">{errors.bonusAmount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              所在城市
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-2 border rounded bg-background text-foreground border-gray-300 focus:border-blue-500"
            >
              {CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className={`w-full p-2 rounded transition-all duration-200 
              ${isCalculating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-foreground text-background hover:opacity-90'
              }
            `}
          >
            {isCalculating ? '计算中...' : '计算'}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-green-100 dark:bg-green-900 rounded animate-fade-in">
              <p className="text-center font-medium">{result}</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p className="text-center">注意：此计算器仅供参考，实际税收计算可能因各种因素而异。</p>
        </div>
      </main>
    </div>
  );
}
