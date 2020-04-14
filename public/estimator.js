'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint-disable no-restricted-properties */
/* eslint-disable no-use-before-define */
// Function used to normalize multiplier based on days, weeks or months
var populationData = document.getElementById('data-population');
var timeToElapseData = document.getElementById('data-time-to-elapse');
var reportCasesData = document.getElementById('data-reported-cases');
var totalHospitalBedsData = document.getElementById('data-total-hospital-beds');
var periodTypeData = document.getElementById('data-period-type');
var submitData = document.getElementById('data-go-estimate');

// Create data object

var constructData = function constructData(periodType, timeToElapse, reportedCases, population, totalHospitalBeds) {
  var conData = {
    region: {
      name: 'Africa',
      avgAge: 19.7,
      avgDailyIncomeInUSD: 5,
      avgDailyIncomePopulation: 0.71
    },
    periodType: periodType,
    timeToElapse: timeToElapse,
    reportedCases: reportedCases,
    population: population,
    totalHospitalBeds: totalHospitalBeds
  };
  return conData;
};

submitData.addEventListener('click', function (e) {
  e.preventDefault();
  var inputData = constructData(periodTypeData.value, timeToElapseData.value, reportCasesData.value, populationData.value, totalHospitalBedsData.value);
  var estimateData = covid19ImpactEstimator(inputData);
  // eslint-disable-next-line no-console
  console.log('found data' + JSON.stringify(inputData));
  var result = document.getElementById('results');
  var tableElem = document.getElementById('data-table');
  // eslint-disable-next-line valid-typeof
  if ((typeof tableElem === 'undefined' ? 'undefined' : _typeof(tableElem)) != undefined && tableElem != null) {
    tableElem.parentNode.removeChild(tableElem);
  }
  result.appendChild(createTable(estimateData));
});

var calculateEstimateForTime = function calculateEstimateForTime(periodType, time) {
  var totalDays = periodToDaysConvertor(periodType, time);
  return Math.pow(2, Math.round(totalDays / 3));
};

var periodToDaysConvertor = function periodToDaysConvertor(periodType, time) {
  if (periodType === 'weeks') {
    return time * 7;
  }if (periodType === 'months') {
    return time * 30;
  }
  return time;
};

// Function used to calculate the requestedInfections and check if they surpass the population
var calculateInfectionsByTime = function calculateInfectionsByTime(periodType, timeToElapse, population, currentlyInfected) {
  var multiplier = calculateEstimateForTime(periodType, timeToElapse);
  var infectionsByTime = currentlyInfected * multiplier;
  if (infectionsByTime < population) {
    return infectionsByTime;
  }
  return population;
};

var calculateSevereCases = function calculateSevereCases(infections) {
  return Math.floor(infections * 0.15);
};

// Function used to calculate number of requested beds
var calculcateRequestedBeds = function calculcateRequestedBeds(severeCases, hospitalBeds) {
  var availableBeds = Math.floor(hospitalBeds * 0.35);
  return availableBeds - severeCases;
};

var calculatecasesForICU = function calculatecasesForICU(infectionsByRequestedTime) {
  return infectionsByRequestedTime * 0.05;
};

var calculateVentilatorCases = function calculateVentilatorCases(ICUCases) {
  return ICUCases * 0.02;
};

var calculateDollarsInFlight = function calculateDollarsInFlight(periodType, time, avgPopulation, avIncome, infectionsByRequestedTime) {
  var totalDays = periodToDaysConvertor(periodType, time);
  return infectionsByRequestedTime * avgPopulation * avIncome * totalDays;
};

var covid19ImpactEstimator = function covid19ImpactEstimator(data) {
  // Object that will hold response data
  var responseObj = {
    data: data,
    impact: {},
    severeImpact: {}
  };
  responseObj.impact.currentlyInfected = responseObj.data.reportedCases * 10;
  responseObj.severeImpact.currentlyInfected = responseObj.data.reportedCases * 50;
  responseObj.impact.infectionsByRequestedTime = calculateInfectionsByTime(responseObj.data.periodType, responseObj.data.timeToElapse, responseObj.data.population, responseObj.impact.currentlyInfected);
  responseObj.severeImpact.infectionsByRequestedTime = calculateInfectionsByTime(responseObj.data.periodType, responseObj.data.timeToElapse, responseObj.data.population, responseObj.severeImpact.currentlyInfected);
  responseObj.impact.severeCasesByRequestedTime = calculateSevereCases(responseObj.impact.infectionsByRequestedTime);
  responseObj.severeImpact.severeCasesByRequestedTime = calculateSevereCases(responseObj.severeImpact.infectionsByRequestedTime);
  responseObj.impact.hospitalBedsByRequestedTime = calculcateRequestedBeds(responseObj.impact.severeCasesByRequestedTime, data.totalHospitalBeds);
  responseObj.severeImpact.hospitalBedsByRequestedTime = calculcateRequestedBeds(responseObj.severeImpact.severeCasesByRequestedTime, data.totalHospitalBeds);
  responseObj.impact.casesForICUByRequestedTime = calculatecasesForICU(responseObj.impact.infectionsByRequestedTime);
  responseObj.severeImpact.casesForICUByRequestedTime = calculatecasesForICU(responseObj.severeImpact.infectionsByRequestedTime);
  responseObj.impact.casesForVentilatorsByRequestedTime = calculateVentilatorCases(responseObj.impact.casesForICUByRequestedTime);
  responseObj.severeImpact.casesForVentilatorsByRequestedTime = calculateVentilatorCases(responseObj.severeImpact.casesForICUByRequestedTime);
  responseObj.impact.dollarsInFlight = calculateDollarsInFlight(responseObj.data.periodType, responseObj.data.timeToElapse, responseObj.data.region.avgDailyIncomePopulation, responseObj.data.region.avgDailyIncomeInUSD, responseObj.impact.infectionsByRequestedTime);
  responseObj.severeImpact.dollarsInFlight = calculateDollarsInFlight(responseObj.data.periodType, responseObj.data.timeToElapse, responseObj.data.region.avgDailyIncomePopulation, responseObj.data.region.avgDailyIncomeInUSD, responseObj.severeImpact.infectionsByRequestedTime);

  console.log('running' + JSON.stringify(responseObj));
  return responseObj;
};

var createTable = function createTable(responseObj) {
  var table = document.createElement('table');
  table.setAttribute('class', 'table');
  table.setAttribute('class', 'table-striped');
  var tHead = document.createElement('thead');
  var tableRow = document.createElement('tr');
  var textHeader = document.createElement('th');
  textHeader.setAttribute('scope', 'col');
  textHeader.innerHTML = 'Label';
  var dataHeader = document.createElement('th');
  dataHeader.setAttribute('scope', 'col');
  dataHeader.innerHTML = 'Value';
  tableRow.appendChild(textHeader);
  tableRow.appendChild(dataHeader);
  tHead.appendChild(tableRow);
  table.appendChild(tHead);
  var dataKeys = Object.keys(responseObj);
  console.log(dataKeys);
  var data = responseObj.data,
      impact = responseObj.impact,
      severeImpact = responseObj.severeImpact;

  var tBody = document.createElement('tbody');
  createTd(data.region, tBody);
  createTd(impact, tBody);
  createTd(severeImpact, tBody);
  table.appendChild(tBody);
  table.setAttribute("id", "data-table");
  return table;
};

var createTd = function createTd(input, tdBody) {
  // eslint-disable-next-line no-plusplus
  var respData = Object.keys(input);
  for (var i = 0; i < respData.length; i++) {
    var tdRow = document.createElement('tr');
    var dtLabel = document.createElement('td');
    dtLabel.innerHTML = respData[i];
    var dtValue = document.createElement('td');
    dtValue.innerHTML = input[respData[i]];
    tdRow.appendChild(dtLabel);
    tdRow.appendChild(dtValue);
    tdBody.appendChild(tdRow);
  }
};

// export default covid19ImpactEstimator;