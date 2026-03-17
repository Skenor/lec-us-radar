const italianAmericanProxy = {
  "New York": 100,
  "New Jersey": 95,
  "Connecticut": 90,
  "Rhode Island": 88,
  "Massachusetts": 85,
  "Pennsylvania": 70,
  "Illinois": 65,
  "California": 60,
  "Florida": 55,
  "Ohio": 50,
};

export function computeMarketReadinessScore(states) {
  const incomes = states.map((s) => s.income).filter(Boolean);
  const minIncome = Math.min(...incomes);
  const maxIncome = Math.max(...incomes);

  return states
    .map((state) => {
      const normalizedIncome =
        maxIncome > minIncome
          ? ((state.income - minIncome) / (maxIncome - minIncome)) * 100
          : 50;

      const italianProxy = italianAmericanProxy[state.stateName] ?? 20;
      const leclercTrend = state.leclercTrendValue ?? 10;

      const score =
        leclercTrend * 0.5 + normalizedIncome * 0.3 + italianProxy * 0.2;

      let tier;
      if (score >= 70) tier = "Tier 1 Entry";
      else if (score >= 50) tier = "Tier 2 Watch";
      else tier = "Tier 3 Develop";

      return {
        ...state,
        score: Math.round(score * 10) / 10,
        tier,
        normalizedIncome: Math.round(normalizedIncome),
        italianProxy,
        leclercTrend,
      };
    })
    .sort((a, b) => b.score - a.score);
}
