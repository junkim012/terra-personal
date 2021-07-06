import { LCDClient } from '@terra-money/terra.js';
const fs = require('fs');

/*
    Gets all the borrowers and their borrow amount from the ANC smart contract 
    Sort the accounts from highest balance to lowest
*/

// currently test address, switch to real
// const mmCustory_contract_address_test = "terra1ltnkx0mv7lf2rca9f8w740ashu93ujughy4s7p"
const mmCustody_contract_address_main =
  'terra1ptjp2vfjrwh0j0faj9r6katm640kgjxnwwq9kn';

const contract_address = mmCustody_contract_address_main;

// specifying how many accounts to query
const number_to_query = 100;

const terra = new LCDClient({
  URL: 'https://lcd.terra.dev',
  chainID: 'columbus-4',
});

async function sendQuery(start_after = null, array) {
  let query;
  if (start_after == null) {
    query = {
      borrowers: {
        limit: 10,
      },
    };
  } else {
    query = {
      borrowers: {
        start_after: start_after,
        limit: 10,
      },
    };
  }

  try {
    let response = await terra.wasm.contractQuery(contract_address, query);
    let last_index = response['borrowers'].length - 1;
    let tenth_address = response['borrowers'][last_index]['borrower'];

    for (const entries of response['borrowers']) {
      let borrower_data = entries['borrower'];
      let balance_data = entries['balance'];

      array.push({
        borrower: borrower_data,
        balance: balance_data,
      });
    }

    return tenth_address;
  } catch (e) {
    console.log(e);
  }
}

// automatically stops if the max_number of accounts are queried, returns array
async function getCustodyInfo(max_number) {
  var array = [];

  // initial sendQuery
  let tenth_address = await sendQuery(null, array);

  while (true) {
    tenth_address = await sendQuery(tenth_address, array);
    if (array.length === max_number) break;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  array.sort((a, b) => {
    return b.balance - a.balance;
  });

  return array;
}

// function to write array of objects to csv
function arrayToCsv(array, file_name) {
  const csvString = [
    ['Borrower', 'Balance'],
    ...array.map((entries) => [entries.borrower, entries.balance]),
  ]
    .map((e) => e.join(', '))
    .join('\n');

  // write csvString to file
  fs.writeFile(file_name, csvString, (err) => {
    if (err) throw err;
  });
}

export async function anc_borrower_query_main(max_number, file_name) {
  // get borrowers
  const array = await getCustodyInfo(max_number);
  const json = JSON.stringify(array);
  // write csv
  arrayToCsv(array, file_name);

  return json;
}

anc_borrower_query_main(number_to_query, 'results.txt');
