// Function used to normalize multiplier based on days, weeks or months
const calculateEstimateForTime = (periodType, time) => {
    let totalDays = periodToDaysConvertor(periodType, time);
    return Math.pow(2, Math.round(totalDays/3));
}

const periodToDaysConvertor= (periodType, time) =>{
    if(periodType === "weeks"){
        return time*7;
    } else if(periodType === "months"){
        return time*30;
    } else {
        return time;
    }
}

//Function used to calculate the requestedInfections and check if they surpass the population
const calculateInfectionsByTime = (periodType, timeToElapse, population, currentlyInfected) => {
    let multiplier = calculateEstimateForTime(periodType, timeToElapse);
    let infectionsByTime = currentlyInfected * multiplier;
    if(infectionsByTime < population) {
        return infectionsByTime;
    } else {
        return population;
    }
}

const calculateSevereCases = (infections) => Math.floor(infections * 0.15);

//Function used to calculate number of requested beds
const calculcateRequestedBeds = (severeCases, hospitalBeds) => {
    let availableBeds = Math.floor(hospitalBeds*.35);
    return availableBeds - severeCases;
}

const calculatecasesForICU = (infectionsByRequestedTime) => infectionsByRequestedTime * 0.05;

const calculateVentilatorCases = (ICUCases) => ICUCases * 0.02;

const calculateDollarsInFlight = (periodType, time, avgPopulation, avIncome, infectionsByRequestedTime) =>{
    console.log(arguments[3]);
    let totalDays = periodToDaysConvertor(periodType, time);
    return (infectionsByRequestedTime * avgPopulation) * avIncome * totalDays;
}

const covid19ImpactEstimator = (data) => {
    // Object that will hold response data
  const responseObj = {
    data,
    impact: {},
    severeImpact:{}
  };
  responseObj.impact.currentlyInfected = (data.reportedCases * 10);
  responseObj.severeImpact.currentlyInfected = (data.reportedCases * 50);
  responseObj.impact.infectionsByRequestedTime = calculateInfectionsByTime(data.periodType, data.timeToElapse, data.population, responseObj.impact.currentlyInfected);
  responseObj.severeImpact.infectionsByRequestedTime = calculateInfectionsByTime(data.periodType, data.timeToElapse, data.population, responseObj.severeImpact.currentlyInfected);
  responseObj.impact.severeCasesByRequestedTime = calculateSevereCases(responseObj.impact.infectionsByRequestedTime);
  responseObj.severeImpact.severeCasesByRequestedTime = calculateSevereCases(responseObj.severeImpact.infectionsByRequestedTime);
  responseObj.impact.hospitalBedsByRequestedTime = calculcateRequestedBeds(responseObj.impact.severeCasesByRequestedTime, data.totalHospitalBeds);
  responseObj.severeImpact.hospitalBedsByRequestedTime = calculcateRequestedBeds(responseObj.severeImpact.severeCasesByRequestedTime, data.totalHospitalBeds);
  responseObj.impact.casesForICUByRequestedTime = calculatecasesForICU(responseObj.impact.infectionsByRequestedTime);
  responseObj.severeImpact.casesForICUByRequestedTime = calculatecasesForICU(responseObj.severeImpact.infectionsByRequestedTime);
  responseObj.impact.casesForVentilatorsByRequestedTime = calculateVentilatorCases(responseObj.impact.casesForICUByRequestedTime);
  responseObj.severeImpact.casesForVentilatorsByRequestedTime = calculateVentilatorCases(responseObj.severeImpact.casesForICUByRequestedTime);
  responseObj.impact.dollarsInFlight = calculateDollarsInFlight(data.periodType, data.timeToElapse, data.region.avgDailyIncomePopulation, data.region.avgDailyIncomeInUSD, responseObj.impact.infectionsByRequestedTime);
  responseObj.severeImpact.dollarsInFlight = calculateDollarsInFlight(data.periodType, data.timeToElapse, data.region.avgDailyIncomePopulation, data.region.avgDailyIncomeInUSD, responseObj.severeImpact.infectionsByRequestedTime);

  console.log('running');
  return responseObj;
};

const data = {
	"region": {
		"name": "Africa",
		"avgAge": 19.7,
		"avgDailyIncomeInUSD": 5,
		"avgDailyIncomePopulation": 0.71
	},
	"periodType": "days",
	"timeToElapse": 58,
	"reportedCases": 674,
	"population": 66622705,
	"totalHospitalBeds": 1380614
};

console.log(covid19ImpactEstimator(data));
//export default covid19ImpactEstimator;
