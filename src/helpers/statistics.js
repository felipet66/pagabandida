// statistics.js

const parseOdd = odd => {
  const parsed = parseFloat(odd);
  return isNaN(parsed) ? 0 : parsed;
};

export const mean = arr => {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, obj) => acc + parseOdd(obj.odd), 0);
  return sum / arr.length;
};

export const median = arr => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => parseOdd(a.odd) - parseOdd(b.odd));
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? parseOdd(sorted[mid].odd)
    : (parseOdd(sorted[mid - 1].odd) + parseOdd(sorted[mid].odd)) / 2;
};

export const mode = arr => {
  if (arr.length === 0) return [];
  const frequency = {};

  // Calcula a frequência de cada valor
  arr.forEach(obj => {
    const odd = parseOdd(obj.odd);
    frequency[odd] = (frequency[odd] || 0) + 1;
  });

  // Converte o objeto de frequência em um array de [valor, frequência]
  const frequencyArray = Object.entries(frequency).map(([odd, freq]) => ({
    odd: parseFloat(odd),
    freq: freq
  }));

  // Ordena o array pela frequência em ordem decrescente
  frequencyArray.sort((a, b) => b.freq - a.freq);

  // Retorna os três valores mais frequentes
  return frequencyArray.slice(0, 3).map(item => item.odd);
};

export const variance = arr => {
  if (arr.length === 0) return 0;
  const mu = mean(arr);
  return mean(arr.map(obj => Math.pow(parseOdd(obj.odd) - mu, 2)));
};

export const standardDeviation = arr => {
  if (arr.length === 0) return 0;
  return Math.sqrt(variance(arr));
};

export const quartiles = arr => {
  if (arr.length === 0) return { q1: 0, q2: 0, q3: 0 };
  const sorted = [...arr].sort((a, b) => parseOdd(a.odd) - parseOdd(b.odd));
  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q2 = median(sorted);
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)));
  return { q1, q2, q3 };
};

export const range = arr => {
  if (arr.length === 0) return 0;
  return (
    Math.max(...arr.map(obj => parseOdd(obj.odd))) -
    Math.min(...arr.map(obj => parseOdd(obj.odd)))
  );
};

export const skewness = arr => {
  if (arr.length === 0) return 0;
  const mu = mean(arr);
  const sigma = standardDeviation(arr);
  return sigma === 0
    ? 0
    : mean(arr.map(obj => Math.pow((parseOdd(obj.odd) - mu) / sigma, 3)));
};

export const kurtosis = arr => {
  if (arr.length === 0) return 0;
  const mu = mean(arr);
  const sigma = standardDeviation(arr);
  return sigma === 0
    ? 0
    : mean(arr.map(obj => Math.pow((parseOdd(obj.odd) - mu) / sigma, 4))) - 3;
};

export const histogram = (arr, binCount) => {
  if (arr.length === 0) return Array(binCount).fill(0);
  const min = Math.min(...arr.map(obj => parseOdd(obj.odd)));
  const max = Math.max(...arr.map(obj => parseOdd(obj.odd)));
  const binSize = (max - min) / binCount;
  const bins = Array(binCount).fill(0);

  arr.forEach(obj => {
    const bin = Math.min(
      Math.floor((parseOdd(obj.odd) - min) / binSize),
      binCount - 1
    );
    bins[bin]++;
  });

  return bins;
};

export const calculateStatistics = arr => {
  if (!arr || arr.length === 0) return {};
  return {
    mean: mean(arr),
    median: median(arr),
    mode: mode(arr),
    variance: variance(arr),
    standardDeviation: standardDeviation(arr),
    quartiles: quartiles(arr),
    range: range(arr),
    skewness: skewness(arr),
    kurtosis: kurtosis(arr),
    histogram: histogram(arr, 10) // Exemplo com 10 bins
  };
};
