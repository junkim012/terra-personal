/*
   Records Historical # of depositors/borrowers per 24 hours
   Returns an array of depositors and borrowers (and borrowing amounts)
   Returns an array of unique depositor and borrower addresses 
   
   Time logic
   1. get current time, set script start time, calculate amount of time left til start time. 
   2. Wait until the start time, then call main function that repeats in 24 hour intervals
   3. each call of main function finishes its iteration at 00.00.000 on the same day  
   (all times are in UTC, 9 hours ahead of KST) 

*/

//import { DynamoDB } from "aws-sdk";
import fetch from 'node-fetch';

// gloabl variables
const address = 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s';
const chainId_main = 'columbus-4';

// records the number of different interactions
const record_frequency = {
  number_of_deposits: 0,
  number_of_borrows: 0,
  number_of_repays: 0,
  number_of_claims: 0,
  number_of_withdraws: 0,
};

const record_amount = {
  total_deposit: 0,
  total_borrows: 0,
};

async function FCDHelper(array, next, limit, account, chainId, final_date, record_frequency, record_amount) {
  console.log('in FCDHelper');
  // fetch
  var url = `https://fcd.terra.dev/v1/txs?offset=${next}&limit=${limit}&account=${account}&chainId=${chainId}`;
  // iterate transactions, check for ending condition
  const data = await fetch(url);
  const response = await data.json();

  next = response['next'];

  const txs = response['txs'];

  for (let i in txs) {
    let entry = txs[i];

    // most recent transactions come first
    const timestamp = entry['timestamp'];
    const timestamp_obj = new Date(timestamp);
    console.log('timestamp_obj: ', timestamp_obj);
    if (timestamp_obj < final_date) {
      // should be changed to Docker logger
      console.log('function stopped');
      console.log('final_date: ', final_date);
      console.log('timestamp: ', timestamp_obj);
      console.log('should stop');

      // if end condition met
      return null;
    }

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

  // if end condition not met
  return next;
}

export async function FCDRunner(
  array,
  next = 0,
  limit,
  account,
  chainId,
  final_date,
  record_frequency,
  record_amount
) {
  while (next != null) {
    next = await FCDHelper(array, next, limit, account, chainId, final_date, record_frequency, record_amount);
  }

  return array;
}

export function getUniqueSenders(array): [] {
  // given javascript object with two fields, only keep unique addresses
  // entry: objects, index: 0~5, self: array itself
  // creates new array without duplicate senderes
  var sortedArray = array.filter(
    (entry, index, self) =>
      index === self.findIndex((ent) => ent.sender === entry.sender),
  );
  return sortedArray;
}

// times are measured in UTC
export async function singleday_query_main() {
  console.log('main function called');

  // beginning of current day
  const now = new Date();
  console.log('start time for this iteration: ', now);
  // params: year, month, date, hour, minute, second, milisecond
  const final_date = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 1),
  );
  console.log('final_date for this iteration: ', final_date);

  // records the number of different interactions
  const record_frequency = {
    number_of_deposits: 0,
    number_of_borrows: 0,
    number_of_repays: 0,
    number_of_claims: 0,
    number_of_withdraws: 0,
  };

  const record_amount = {
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
  var limit = 100;
  var account = address;

  array = await FCDRunner(
    array,
    next,
    limit,
    account,
    chainId_main,
    final_date,
    record_frequency,
    record_amount
  );
  const depositor_results = array[0];
  const borrower_results = array[1];
  const unique_depositor_senders = getUniqueSenders(depositor_results);
  const unique_borrower_senders = getUniqueSenders(borrower_results);

  // printing results
  console.log('depositor results array: ', depositor_results);
  console.log('borrower results array: ', borrower_results);

  console.log('unique depositor senders', unique_depositor_senders);
  console.log('unique borrower senders', unique_borrower_senders);

  console.log('total number of depositors: ', depositor_results.length);
  console.log('total number of borrowers: ', borrower_results.length);
  console.log('number of unique depositors: ', unique_depositor_senders.length);
  console.log('number of unique borrowers: ', unique_borrower_senders.length);

  console.log('record_frequency: ', record_frequency);
  console.log('record_amount: ', record_amount);
}

// 24 hours = 86,400,000
export const runWithInterval = (
  interval: number,
  callback: () => Promise<void>,
): void => {
  void Promise.resolve()
    .then(callback)
    .then(() =>
      setTimeout(() => runWithInterval(interval, callback), interval),
    );
};

export function startInterval() {
  // starting at a certain time
  var now = new Date();
  //var target_time = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 11, 59, 59, 0));
  var target_time = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds() + 5,
    0,
  );
  var time_til_target = target_time.getTime() - now.getTime();
  console.log('now: ', now);
  console.log('target_time: ', target_time);
  console.log('time_til_target: ', time_til_target);

  setTimeout(function () {
    console.log('target time reached');
    // start 24 hours intervals
    runWithInterval(86400000, singleday_query_main);
  }, time_til_target);
}

// Start
// startInterval();
singleday_query_main();