/*

Retrieve historical data from a set date back to a certain date, 
separate the data into every single days. 
1. transactions (for borrows and deposits)
    {
        sender
        execute_msg
        action
        amount
    }
2. frequency of each transaction types 
3. total amount of deposits/borrows 

*/

import { getUniqueSenders } from './singleday_query';
import fetch from 'node-fetch';
import { createNoSubstitutionTemplateLiteral } from 'typescript';

// gloabl variables
const address = 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s';
const chainId_main = 'columbus-4';

async function FCDHelper(array, next, limit, account, chainId, final_date, record_frequency, record_amount, end_of_day) {
  console.log('in FCDHelper, array lengths: ', array[0].length, ", ", array[1].length, record_amount.total_deposit);

  // fetch
  var url = `https://fcd.terra.dev/v1/txs?offset=${next}&limit=${limit}&account=${account}&chainId=${chainId}`;
  // iterate transactions, check for ending condition
  const data = await fetch(url);
  const response = await data.json();

  const this_next = next; 

  next = response['next'];

  const txs = response['txs'];

  for (let i in txs) {
    let entry = txs[i];

    // most recent transactions come first
    const timestamp = entry['timestamp'];
    const timestamp_obj = new Date(timestamp);
    

    // check whether final date is met, return next: null to stop FCD query
    if (timestamp_obj < final_date) {
      // should be changed to Docker logger
      console.log('function stopped');
      console.log('final_date: ', final_date);
      console.log('timestamp: ', timestamp_obj);
      console.log('should stop');

      const data = {
        next: null, 
        end_of_day: null,
        array: array, 
        record_frequency: record_frequency,
        record_amount: record_amount
      }

      console.log('last day data: ', data);

      return data;
    }

    // if end of a single day, store this day's data and the next value 
    if (timestamp_obj < end_of_day) {
      console.log('end of day reached');
      console.log('end_of_day: ', end_of_day);
      console.log('stopped before: ', timestamp_obj);
      console.log('should continue querying')

      // update end_of_day variable to previous day
      end_of_day = new Date(Date.UTC(end_of_day.getFullYear(), end_of_day.getMonth(),
      end_of_day.getDate() - 1, 0, 0, 0, 0));

      console.log('new end_of_day: ', end_of_day);

      // single-day-data to be used 
      const data = {
        array: array,
        record_frequency: record_frequency,
        record_amount: record_amount 
      }
      console.log('array[0].length', data.array[0].length)
      console.log('array[1].length', data.array[1].length)
      console.log('data.record_frequency', data.record_frequency);
      console.log('data.record_amount', data.record_amount);

      const rm_duplicates_depositors = getUniqueSenders(array[0]);
      const rm_duplicates_borrowers = getUniqueSenders(array[1]); 

      console.log('after getUniqueSenders'); 
      console.log('rm duplicates depositors', rm_duplicates_depositors.length);
      console.log('rm duplicates borrowers', rm_duplicates_borrowers.length);

      // reset data log when end_of_day is reached 
      record_frequency.number_of_deposits = 0;
      record_frequency.number_of_borrows = 0;
      record_frequency.number_of_repays = 0;
      record_frequency.number_of_claims = 0;
      record_frequency.number_of_claims = 0;
      record_frequency.number_of_withdraws = 0;
      record_amount.total_deposit = 0;
      record_amount.total_borrows = 0;
      array[0] = [];
      array[1] = []; 

    }

    // parse data if timestamp_obj is past start_time
      const tx = entry['tx'];
      const value = tx['value'];
      const msg = value['msg'];
      const value2 = msg[0]['value'];
      const sender = value2['sender'];
      const execute_msg = value2['execute_msg'];
  
      // deposit, borrow, claim, repay, withdraw
      // count number for each action
      // push borrow transactions + amount
      const json_msg = JSON.parse(Buffer.from(execute_msg, 'base64').toString());
  
      var action;
      if (json_msg.deposit_stable) {
        action = 'deposit';
        record_frequency.number_of_deposits++;
  
        const coins = value2['coins'][0];
        const deposit_amount = coins['amount'];
  
        record_amount.total_deposit =
          record_amount.total_deposit + Number(deposit_amount);
  
        array[0].push({
          sender: sender,
          execute_msg: execute_msg,
          action: action,
          amount: deposit_amount,
        });
      }
      if (json_msg.borrow_stable) {
        action = 'borrow';
        record_frequency.number_of_borrows++;
        const borrow_amount = json_msg.borrow_stable.borrow_amount;
  
        record_amount.total_borrows =
          record_amount.total_borrows + Number(borrow_amount);
  
        array[1].push({
          sender: sender,
          execute_msg: execute_msg,
          action: action,
          amount: borrow_amount,
        });
      }
      if (json_msg.withdraw) {
        action = 'withdraw';
        record_frequency.number_of_withdraws++;
      }
      if (json_msg.claim_rewards) {
        action = 'claim';
        record_frequency.number_of_claims++;
      }
      if (json_msg.repay_stable) {
        action = 'repay';
        record_frequency.number_of_repays++;
      }
      //console.log(action);
  }

  // if the entirety of this FCD response was iterated without meeting the final date nor the end of day
  return {
    next: next,
    end_of_day: end_of_day,
    array: array,
    record_amount: record_amount,
    record_frequency: record_frequency
  }
}

export async function FCDRunner(
  limit,
  account,
  chainId,
  final_date,
  end_of_day,
) {
  // records the number of different interactions
  let record_frequency = {
    number_of_deposits: 0,
    number_of_borrows: 0,
    number_of_repays: 0,
    number_of_claims: 0,
    number_of_withdraws: 0,
  };
      
  let record_amount = {
    total_deposit: 0,
    total_borrows: 0,
  };

  // array[0]: depositors, array[1]: borrowers
  let array = [];
  let d_array = [];
  let b_array = [];
  array.push(d_array);
  array.push(b_array);

  var next = 0; 
  
  while (next != null) {
      
    var data = await FCDHelper(array, next, limit, account, chainId, final_date, record_frequency, record_amount, end_of_day);
    
    next = data.next;
    end_of_day = data.end_of_day;
    record_amount = data.record_amount;
    record_frequency = data.record_frequency;

  }
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
  const txs = response['txs'];
  let first_entry = txs[0];

  // most recent transactions come first
  const first_timestamp = first_entry['timestamp'];
  const first_timestamp_obj = new Date(first_timestamp);

  console.log("Most recent transaction timestamp: ", first_timestamp_obj);


  // beginning of current day
  // params: year, month, date, hour, minute, second, milisecond
  const year = 2021;
  const month = 7;
  const day = 3;
  const final_time = new Date(Date.UTC(year, month-1, day, 0, 0, 0, 0));
  console.log('final_date for this script: ', final_time);


  let end_of_day = new Date(Date.UTC(first_timestamp_obj.getFullYear(), 
    first_timestamp_obj.getMonth(), first_timestamp_obj.getDate(), 0, 0, 0, 0));
  console.log('first end_of_day: ', end_of_day);

  await FCDRunner(
    limit,
    account,
    chainId_main,
    final_time,
    end_of_day
  );
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
