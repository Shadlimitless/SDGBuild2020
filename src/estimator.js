// Function used to normalize multiplier based on days, weeks or months
const calculateEstimateForTime = (periodType, time) => {
  let multiplier;
  switch (periodType){
    case "days":
      multiplier = Math.pow(2, Math.round(time/3));
      break;
    case "weeks":
      const numOfDays = time*7;
      multiplier = Math.pow(2, Math.round(numOfDays/3));
      break;
    case "months":
      const totalDays = time*30;
      multiplier = Math.pow(2, Math.round(totalDays/3));
      break;
  }
  return multiplier;
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

const calculateSevereCases = infections => Math.floor(infections * 0.15);

//Function used to calculate number of requested beds
const calculcateRequestedBeds = (severeCases, hospitalBeds) => {
    let availableBeds = Math.floor(hospitalBeds*.35);
    return availableBeds - severeCases;
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
  responseObj.impact.casesForICUByRequestedTime = responseObj.impact.infectionsByRequestedTime * 0.05;
  responseObj.severeImpact.casesForICUByRequestedTime = responseObj.severeImpact.infectionsByRequestedTime * 0.05;
  responseObj.impact.casesForVentilatorsByRequestedTime = responseObj.impact.casesForICUByRequestedTime * 0.02;
  responseObj.severeImpact.casesForVentilatorsByRequestedTime = responseObj.severeImpact.casesForICUByRequestedTime * 0.02;
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
