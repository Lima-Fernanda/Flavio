const form = document.querySelector('#finance-form');

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function readAmount(name) {
  return Math.max(0, Number(form.elements[name].value) || 0);
}

function formatCurrency(amount) {
  return currency.format(amount);
}

function projectNextContribution(values) {
  const count = values.length;
  if (count === 0) return null;
  if (count === 1) return values[0];

  const sumX = (count * (count - 1)) / 2;
  const sumXSquared = ((count - 1) * count * (2 * count - 1)) / 6;
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);

  // Solve the 2x2 normal equations for the least-squares line y = intercept + slope*x.
  const determinant = count * sumXSquared - sumX * sumX;
  const intercept = (sumY * sumXSquared - sumX * sumXY) / determinant;
  const slope = (count * sumXY - sumX * sumY) / determinant;
  return Math.max(0, intercept + slope * count);
}

function updateSummary() {
  const salary = readAmount('salary');
  const monthlyCosts = readAmount('homeCost') + readAmount('monthlyCost') + readAmount('debtPayments');
  const monthlyBalance = salary - monthlyCosts;
  const annualBalance = readAmount('annualIncome') - readAmount('annualCost');
  const essentialCosts = readAmount('essentialCost');
  const reserve = readAmount('reserve');
  const reserveTarget = essentialCosts * 6;
  const monthlyStep = Math.max(0, monthlyBalance) * 0.2;
  const reserveIsReady = reserve >= reserveTarget;

  document.querySelector('#monthly-balance').textContent = formatCurrency(monthlyBalance);
  document.querySelector('#annual-balance').textContent = formatCurrency(annualBalance);
  document.querySelector('#reserve-target').textContent = formatCurrency(reserveTarget);
  document.querySelector('#monthly-recommendation').textContent = formatCurrency(monthlyStep);
  document.querySelector('#recommendation-label').textContent = reserveIsReady
    ? 'Referência mensal para investir'
    : 'Próximo passo sugerido';
  document.querySelector('#recommendation-caption').textContent = reserveIsReady
    ? 'por mês, como referência de planejamento'
    : 'por mês para fortalecer sua reserva';

  const contributions = form.elements.contributions.value
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number);
  const hasValidContributions = contributions.length > 0
    && contributions.every((value) => Number.isFinite(value) && value >= 0);
  const forecast = hasValidContributions ? projectNextContribution(contributions) : null;
  document.querySelector('#contribution-forecast').textContent = forecast === null
    ? 'Informe valores válidos'
    : formatCurrency(forecast);

  const riskProfile = form.elements.riskProfile.value;
  const riskDescriptions = {
    conservador: 'Perfil conservador: priorize entender liquidez, segurança e seus objetivos antes de investir.',
    moderado: 'Perfil moderado: considere equilibrar objetivos, prazo e tolerância a oscilações.',
    arrojado: 'Perfil arrojado: avalie cuidadosamente os riscos e a possibilidade de perdas antes de investir.',
  };
  document.querySelector('#risk-note').textContent = riskDescriptions[riskProfile];
}

form.addEventListener('input', updateSummary);
form.addEventListener('change', updateSummary);
updateSummary();
