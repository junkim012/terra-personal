// ANC-UST pool

/*
Get all FCD responses from now to March 17th
*/

// more than 129,000 transaction objects 

import fetch from 'node-fetch';
const fs = require('fs');

// gloabl variables
// Terrapswap ANC-UST LP Token
const address = 'terra1gecs98vcuktyfkrve9czrpgtg0m3aq586x6gzm';
const chainId_main = 'columbus-4';

type transaction =   {
  id: number,
  chainId: string,
  tx: {
    type: string,
    value: Object
  },
  logs: [],
  height: string,
  txhash: string,
  raw_log: string
}
type result_array = transaction[]

async function FCDHelper(
  txs_array: result_array,
  next,
  limit,
  account,
  chainId,
  file_number,
  count
) {
  count++; 

  console.log('in FCDHelper, next: ', next, 'length: ', txs_array.length, 'count: ', count);

  // fetch
  var url = `https://fcd.terra.dev/v1/txs?offset=${next}&limit=${limit}&account=${account}&chainId=${chainId}`;
  // iterate transactions, check for ending condition
  const fetch_data = await fetch(url); 
  const response = await fetch_data.json();

  const previous_next = next; 

  try {
    next = response['next'];

    // maybe the next value is null or stays the same as previous if there is no more data left to be requested
    if (next == null) {
      console.log('request finished because next == null');
      return {
        next: null,
        txs_array: txs_array
      }
    }
    if (previous_next === next) {
      console.log('request finished because previous_next === next');
      return {
        next: null,
        txs_array: txs_array
      }
    }
  } catch { // if response no longer has a next field 
    return {
      next: null,
      txs_array: txs_array
    }
  }

  const txs: [] = response['txs']; // txs is an array of objects that represent each transaction
  console.log('txs length: ', txs.length);
  txs_array = txs_array.concat(txs); // concatenate this txs to existing arrays

  if (count % 10 == 0) {
    // after 10 requests, write the array to file and reset the array
    console.log(`wrote to file: ${file_number}`)
    console.log('txs_array length: ', txs_array.length);
    fs.writeFile(`../fcd-data/anc-ust-lp/anc-ust-lp-results-${file_number}.txt`, JSON.stringify(txs_array),
    function(err) {
      if (err) {
        console.error('error');
      }
    })
    file_number++;

    return {
      next: next,
      txs_array: [],
      file_number: file_number,
      count: count
    }
  }

  // write each object in the txs array 'object' + ' ,'

  // write to file
  // txs.forEach((object, index) => {
  //   count++;
    
  //   if (count % 500 == 0) {
  //     // end of the file: do not put a comma at the end, instead put a bracket 
      
  //     fs.appendFile(`anc-ust-results-${file_number}.txt`, JSON.stringify(object) + "]", function(err) {
  //       if (err) throw err;
  //       console.log(`count: ${count} IS WRITTEN AT THE END of ${file_number}`);
  //     })
  //   }
  //   if (count % 500 == 1) {
  //     // start of the file: put a bracket in the beginning
  //     // write to a new file
      
  //     file_number++;
  //     fs.appendFile(`anc-ust-results-${file_number}.txt`, "[" + JSON.stringify(object) + ", ", function(err) {
  //       if (err) throw err;
  //       console.log(`count: ${count} IS WRITTEN AT THE START of ${file_number}`);
  //     })
  //   }

  //   if (count % 500 != 0 && count % 500 != 1) {
  //     fs.appendFile(`anc-ust-results-${file_number}.txt`, JSON.stringify(object) + ", ", function(err) {
  //       if (err) throw err;
  //       console.log(`count: ${count} IS WRITTEN to ${file_number}`)
  //     });
  //   }
  
  // });


  //txs_array = txs_array.concat(txs); // concatenate this txs to existing arrays
  //console.log('txs_array length: ', txs_array.length);

  return {
    next: next,
    txs_array: txs_array,
    file_number: file_number,
    count: count
  }
}

export async function FCDRunner(
  txs_array: result_array, 
  limit,
  account,
  chainId
) {

  var next = 0;
  var file_number = 1;
  var count = 0;

  while (next != null) {
    var data = await FCDHelper(
      txs_array,
      next,
      limit,
      account,
      chainId,
      file_number,
      count
    );

    next = data.next;
    txs_array = data.txs_array;
    file_number = data.file_number;
    count = data.count;
  }

  return txs_array;

}

async function main() {
  console.log('main function called');

  // one fcd request to retrieve the most recent time stamp
  const first_next = 0;
  var limit = 100;
  var account = address;

  var url = `https://fcd.terra.dev/v1/txs?offset=${first_next}&limit=${limit}&account=${account}&chainId=${chainId_main}`;
  // iterate transactions, check for ending condition
  const data = await fetch(url);
  const response = await data.json();
  const first_txs_array: result_array = response['txs'];

  let first_entry = first_txs_array[0];

  // most recent transactions come first
  const first_timestamp = first_entry['timestamp'];
  const first_timestamp_obj = new Date(first_timestamp);

  console.log('Most recent transaction timestamp: ', first_timestamp_obj);

  // beginning of current day
  // params: year, month, date, hour, minute, second, milisecond
  // const year = 2021;
  // const month = 7;
  // const day = 3;
  // const final_time = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  // console.log('final_date for this script: ', final_time);

  // let end_of_day = new Date(
  //   Date.UTC(
  //     first_timestamp_obj.getFullYear(),
  //     first_timestamp_obj.getMonth(),
  //     first_timestamp_obj.getDate(),
  //     0,
  //     0,
  //     0,
  //     0,
  //   ),
  // );
  // console.log('first end_of_day: ', end_of_day);

  const txs_array: result_array = []
  const final_txs_array: result_array = await FCDRunner(txs_array, limit, account, chainId_main);
  // write to text
  // const json_string = JSON.stringify(final_txs_array);
  // fs.writeFile('anc-ust-results.txt', json_string, (err) => {
  //   if (err) throw err;
  // });


  // const depositor_results = array[0];
  // const borrower_results = array[1];

  // const unique_depositor_senders = getUniqueSenders(depositor_results);
  // const unique_borrower_senders = getUniqueSenders(borrower_results);

  // // printing results
  // console.log('depositor results array: ', depositor_results);
  // console.log('borrower results array: ', borrower_results);

  // console.log('unique depositor senders', unique_depositor_senders);
  // console.log('unique borrower senders', unique_borrower_senders);

  // console.log('total number of depositors: ', depositor_results.length);
  // console.log('total number of borrowers: ', borrower_results.length);

  // console.log('number of unique depositors: ', unique_depositor_senders.length);
  // console.log('number of unique borrowers: ', unique_borrower_senders.length);
}

main();


