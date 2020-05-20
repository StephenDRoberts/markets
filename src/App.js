import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import axios from 'axios';
import { Line } from 'react-chartjs-2';
import share_history_dtg from './data/SHARE_HISTORY_DTG.json'
import epsHistory from './data/EPS_HISTORY.json'


function App() {
  //Full Data
  const [sharePriceData, setSharePriceData] = useState()
  const [epsHistoryData, setEPSHistoryData] = useState()  
  
  //Manipulated Data for charts
  const [sharePricePoints, setSharePricePoints] = useState()
  const [epsHistoryDataPoints, setEPSHistoryDataPoints] = useState()
  const [chartLabels, setChartLabels] = useState()

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const result = await axios({
  //       url: "https://morningstar1.p.rapidapi.com/convenient/keyratios?Mic=XLON&Ticker=DTG",
  //       method: 'GET',
  //       "headers": {
  //       "x-rapidapi-host": "morningstar1.p.rapidapi.com",
  //       "x-rapidapi-key": "c3227ce7eamsh7075430617e8949p19bfeajsnad94f474c3a6",
  //       "accept": "string"
  //       }
  //     }).then(response => {
  //       console.log(response.data);
  //     })
  //     .catch(err => {
  //       console.log(err);
  //     });
  //   }; 
  //   fetchData();
  // }, []);

  // useEffect(()=>{
  //   const updateAnnualData = () => {
  //     setAnnualData(dummyDataAnnual.results)
  //     let dataPoints = []

  //     dummyDataAnnual.results.forEach((value, index, array) => {  
  //       if(index==0){
  //         dataPoints.push(value.incomeStatement.netIncomeAvailableToCommonShareholders)
  //       } else {
  //          const startingNetIncome = array[index-1].incomeStatement.netIncomeAvailableToCommonShareholders
           
  //          const endingNetIncome = value.incomeStatement.netIncomeAvailableToCommonShareholders
           
  //          const startDate = new Date(value.startDate)
  //          const endDate = new Date(value.endDate)
  //          const daysBetween = (endDate - startDate) / (24*60*60*1000) + 1

  //          const linearIncrement = (endingNetIncome - startingNetIncome) / daysBetween
  //          for(var i=1; i<=daysBetween; i++) {
  //            dataPoints.push(startingNetIncome + linearIncrement * (i/daysBetween))
  //          }
  //       }
  //     })
  //     setEarningsData(dataPoints)
  //   }
    
  //   const updateSharePriceData = () => {
  //     setSharePriceData(share_history_dtg.results)

  //     const sharePriceDataPoints = share_history_dtg.results.map(result => {
  //       return result.last
  //     })
  //     setSharePricePoints(sharePriceDataPoints)

  //   }

  //   updateAnnualData()
  //   updateSharePriceData()
  // }, []);
  
  useEffect(()=>{
    const updateEPSHistoryData = () => {
      setEPSHistoryData(epsHistory.results)
    }
    
    const updateSharePriceData = () => {
      setSharePriceData(share_history_dtg.results)
    }
      
    const updateChartData = () => {
      const minDateForEPS = findMinDate(epsHistory.results, "endDate") 
      const minDateForShareData = findMinDate(share_history_dtg.results, "date")

      let overallMinDate
      if(minDateForShareData > minDateForEPS){
        overallMinDate = new Date(minDateForEPS.getFullYear() + 1, minDateForEPS.getMonth(), minDateForEPS.getDate())
      } else {
        overallMinDate = minDateForEPS
      }

      const filteredSharePriceData = filterDataByDate(share_history_dtg.results, overallMinDate, "date")
      const hydratedSharePriceData = []
      for(var i=0; i<filteredSharePriceData.length; i++){
        if(i==0){
          hydratedSharePriceData.push(filteredSharePriceData[0])
        } else {
          const currentDate = new Date(filteredSharePriceData[i].date)
          const previousDate = new Date(filteredSharePriceData[i-1].date)
          const currentPrice = filteredSharePriceData[i].last
          const daysMissing = (currentDate - previousDate)/(24*60*60*1000)

          if(daysMissing > 1){
            for(var j = 1; j<daysMissing; j++){
              hydratedSharePriceData.push({
                "date": addDays(currentDate,j),
                "last": currentPrice
              })
            }
          } else {
              hydratedSharePriceData.push(filteredSharePriceData[i])
            }
          } 
        }
       console.log(hydratedSharePriceData.length)
      const filteredSharePriceDataPoints = filteredSharePriceData.map(result => {
        return result.last
      })

      const dates = filteredSharePriceData.map(result => {
        return result.date
      })
      
      const initialFilteredEPSData = filterDataByDate(epsHistory.results, overallMinDate, "endDate")
      const filteredEPSData = hydrateEPSData(initialFilteredEPSData)
      
      console.log(dates)
      const filteredEPSDataPoints = filteredEPSData.filter(result => {
        console.log(result)
        
        return dates.indexOf(result.date) > -1;
        // dates.includes(new Date(result.date))
      }).map(result => {
        
        return result.eps
      });

      const chartLabels = generateChartLabels(filteredSharePriceData)

      setChartLabels(chartLabels)
      setSharePricePoints(filteredSharePriceDataPoints)
      setEPSHistoryDataPoints(filteredEPSDataPoints)
    }

    updateEPSHistoryData()
    updateSharePriceData()
    updateChartData()

  }, []);

  const hydrateEPSData = (results) => {
    let dataPoints = [];
    
    results.forEach((value, index, array) => {  
      
      if(index==0){
        dataPoints.push(
          {
          "date" : value.endDate,
          "eps": value.keyRatioFinancialsSection.earningsPerShare
      })
      } else {
         const startingEPS = array[index-1].keyRatioFinancialsSection.earningsPerShare
         const endingEPS = value.keyRatioFinancialsSection.earningsPerShare
         
         const startDate = new Date(value.startDate)
         const endDate = new Date(value.endDate)
         const daysBetween = (endDate - startDate) / (24*60*60*1000) + 1         
         const linearIncrement = (endingEPS - startingEPS) / daysBetween
        
         for(var i=1; i<=daysBetween; i++) {
          const date = addDays(startDate,i)
          const month = ("0" + (date.getMonth() + 1)).slice(-2); 
          const day = ("0" + date.getDate()).slice(-2); 
          const simpleDate = `${date.getFullYear()}-${month}-${day}`
          dataPoints.push({
             "date": simpleDate,
             "eps": startingEPS + linearIncrement * i
            })
         }
      }
    })
    return dataPoints
  }

const addDays = (currentDate, daysToAdd, ) => {
    var date = new Date(currentDate);
    date.setDate(date.getDate() + daysToAdd);
    return date;
};

const generateChartLabels = (resultSet) => {
  return resultSet.map(result => {
    const date = new Date(result.date)
    return new Intl.DateTimeFormat('en-GB').format(date)

  })
};

  const findMinDate = (resultsArray, dateLabel) => {
    const dates = getListOfDates(resultsArray, dateLabel)
    return new Date(Math.min.apply(null,dates));
  }


  const filterDataByDate = (results, minDate, dateLabel) => {
    let filteredData = results.filter((a) => {
      return new Date(a[dateLabel]) > minDate
  });
  return filteredData
  };


  

  const getListOfDates = (resultsArray, dateLabel) => {
    return resultsArray.map(result => {     
      return new Date(result[dateLabel])
    })
  }

  



  if(epsHistoryDataPoints){
    const options = {
      scales: {
        xAxes: [{
          // type: 'time',
          ticks: {
              autoSkip: true,
              min: chartLabels[0],
              interval: 1
              // maxTicksLimit: 9.5
          }
      }],
      yAxes: [
        {
        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
        display: true,
        position: 'left',
        id: 'y-axis-1'
      },
       {
        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
        display: true,
        position: 'right',
        id: 'y-axis-2',
        // grid line settings
        gridLines: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      }
    ]
    }
  }

    const data = {
      labels: chartLabels,
      datasets: [
        {
          label: 'EPS',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: epsHistoryDataPoints,
          yAxisID: 'y-axis-1'
        },
        {
          label: 'Price',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(192,75,81,0.4)',
          borderColor: 'rgba(192,75,81,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(192,75,81,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(192,75,81,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: sharePricePoints,
          yAxisID: 'y-axis-2'
        }
      ]
    };
    
  
  return (
    <div className="App">
      <header className="App-header">
        <Line
        data={data}
        options={options}
        width={100}
        height={50}
        />
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
} else return null
} 
export default App;
