/* eslint-disable no-restricted-properties */
/* eslint-disable no-use-before-define */
// Function used to normalize multiplier based on days, weeks or months
const populationData = document.getElementById('data-population');
const timeToElapseData = document.getElementById('data-time-to-elapse');
const reportCasesData = document.getElementById('data-reported-cases');
const totalHospitalBedsData = document.getElementById('data-total-hospital-beds');
const periodTypeData = document.getElementById('data-period-type');
const submitData = document.getElementById('data-go-estimate');

// Create data object

const constructData = (periodType, timeToElapse, reportedCases, population, totalHospitalBeds) => {
  const conData = {
    region: {
      name: 'Africa',
      avgAge: 19.7,
      avgDailyIncomeInUSD: 5,
      avgDailyIncomePopulation: 0.71
    },
    periodType,
    timeToElapse,
    reportedCases,
    population,
    totalHospitalBeds
  };
  return conData;
};

submitData.addEventListener('click', (e) => {
  e.preventDefault();
  const inputData = constructData(periodTypeData.value, timeToElapseData.value,
    reportCasesData.value, populationData.value, totalHospitalBedsData.value);
  const estimateData = covid19ImpactEstimator(inputData);
  // eslint-disable-next-line no-console
  console.log(`found data${JSON.stringify(inputData)}`);
  const result = document.getElementById('results');
  const tableElem = document.getElementById('data-table');
  // eslint-disable-next-line valid-typeof
  if (typeof (tableElem) !== undefined && tableElem != null) {
    tableElem.parentNode.removeChild(tableElem);
  }
  result.appendChild(createTable(estimateData));
});

const calculateEstimateForTime = (periodType, time) => {
  const totalDays = periodToDaysConvertor(periodType, time);
  return Math.pow(2, Math.round(totalDays / 3));
};

const periodToDaysConvertor = (periodType, time) => {
  if (periodType === 'weeks') {
    return time * 7;
  } if (periodType === 'months') {
    return time * 30;
  }
  return time;
};

// Function used to calculate the requestedInfections and check if they surpass the population
const calculateInfectionsByTime = (periodType, timeToElapse, population, currentlyInfected) => {
  const multiplier = calculateEstimateForTime(periodType, timeToElapse);
  const infectionsByTime = currentlyInfected * multiplier;
  if (infectionsByTime < population) {
    return infectionsByTime;
  }
  return population;
};

const calculateSevereCases = (infections) => Math.floor(infections * 0.15);

// Function used to calculate number of requested beds
const calculcateRequestedBeds = (severeCases, hospitalBeds) => {
  const availableBeds = Math.floor(hospitalBeds * 0.35);
  return availableBeds - severeCases;
};

const calculatecasesForICU = (infectionsByRequestedTime) => infectionsByRequestedTime * 0.05;

const calculateVentilatorCases = (ICUCases) => ICUCases * 0.02;

const calculateDollarsInFlight = (periodType, time,
  avgPopulation, avIncome, infectionsByRequestedTime) => {
  const totalDays = periodToDaysConvertor(periodType, time);
  return (infectionsByRequestedTime * avgPopulation) * avIncome * totalDays;
};

const covid19ImpactEstimator = (data) => {
  // Object that will hold response data
  const responseObj = {
    data,
    impact: {},
    severeImpact: {}
  };
  responseObj.impact.currentlyInfected = (responseObj.data.reportedCases * 10);
  responseObj.severeImpact.currentlyInfected = (responseObj.data.reportedCases * 50);
  responseObj.impact.infectionsByRequestedTime = calculateInfectionsByTime(
    responseObj.data.periodType, responseObj.data.timeToElapse,
    responseObj.data.population, responseObj.impact.currentlyInfected
  );
  responseObj.severeImpact.infectionsByRequestedTime = calculateInfectionsByTime(
    responseObj.data.periodType, responseObj.data.timeToElapse,
    responseObj.data.population, responseObj.severeImpact.currentlyInfected
  );
  responseObj.impact.severeCasesByRequestedTime = calculateSevereCases(
    responseObj.impact.infectionsByRequestedTime
  );
  responseObj.severeImpact.severeCasesByRequestedTime = calculateSevereCases(
    responseObj.severeImpact.infectionsByRequestedTime
  );
  responseObj.impact.hospitalBedsByRequestedTime = calculcateRequestedBeds(
    responseObj.impact.severeCasesByRequestedTime, data.totalHospitalBeds
  );
  responseObj.severeImpact.hospitalBedsByRequestedTime = calculcateRequestedBeds(
    responseObj.severeImpact.severeCasesByRequestedTime, data.totalHospitalBeds
  );
  responseObj.impact.casesForICUByRequestedTime = calculatecasesForICU(
    responseObj.impact.infectionsByRequestedTime
  );
  responseObj.severeImpact.casesForICUByRequestedTime = calculatecasesForICU(
    responseObj.severeImpact.infectionsByRequestedTime
  );
  responseObj.impact.casesForVentilatorsByRequestedTime = calculateVentilatorCases(
    responseObj.impact.casesForICUByRequestedTime
  );
  responseObj.severeImpact.casesForVentilatorsByRequestedTime = calculateVentilatorCases(
    responseObj.severeImpact.casesForICUByRequestedTime
  );
  responseObj.impact.dollarsInFlight = calculateDollarsInFlight(
    responseObj.data.periodType, responseObj.data.timeToElapse,
    responseObj.data.region.avgDailyIncomePopulation,
    responseObj.data.region.avgDailyIncomeInUSD, responseObj.impact.infectionsByRequestedTime
  );
  responseObj.severeImpact.dollarsInFlight = calculateDollarsInFlight(
    responseObj.data.periodType, responseObj.data.timeToElapse,
    responseObj.data.region.avgDailyIncomePopulation, responseObj.data.region.avgDailyIncomeInUSD,
    responseObj.severeImpact.infectionsByRequestedTime
  );
  return responseObj;
};

const createTable = (responseObj) => {
  const table = document.createElement('table');
  table.setAttribute('class', 'table');
  table.setAttribute('class', 'table-striped');
  const tHead = document.createElement('thead');
  const tableRow = document.createElement('tr');
  const textHeader = document.createElement('th');
  textHeader.setAttribute('scope', 'col');
  textHeader.innerHTML = 'Label';
  const dataHeader = document.createElement('th');
  dataHeader.setAttribute('scope', 'col');
  dataHeader.innerHTML = 'Value';
  tableRow.appendChild(textHeader);
  tableRow.appendChild(dataHeader);
  tHead.appendChild(tableRow);
  table.appendChild(tHead);
  const { data, impact, severeImpact } = responseObj;
  const tBody = document.createElement('tbody');
  createTd(data.region, tBody);
  createTd(impact, tBody);
  createTd(severeImpact, tBody);
  table.appendChild(tBody);
  table.setAttribute('id', 'data-table');
  return table;
};

const createTd = (input, tdBody) => {
  const respData = Object.keys(input);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < respData.length; i++) {
    const tdRow = document.createElement('tr');
    const dtLabel = document.createElement('td');
    dtLabel.innerHTML = respData[i];
    const dtValue = document.createElement('td');
    dtValue.innerHTML = input[respData[i]];
    tdRow.appendChild(dtLabel);
    tdRow.appendChild(dtValue);
    tdBody.appendChild(tdRow);
  }
};

export default covid19ImpactEstimator;
