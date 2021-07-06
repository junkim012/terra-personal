import { LCDClient, Int , Dec} from '@terra-money/terra.js';
const fs = require('fs');
/*

continuously queries the smart contract to retrieve all ANC holders + balances and pushes them to an array 

*/

const terra = new LCDClient({
  URL: 'https://lcd.terra.dev',
  chainID: 'columbus-4',
});

const contract_addresses = {
  ANC: 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76',
};

async function sendHolderQuery(start_after = null, array, contract_address, start_time) {
  let query;
  if (start_after == null) {
    query = { all_accounts: {} };
  } else {
    query = {
      all_accounts: {
        start_after: start_after,
      },
    };
  }

  try {
    let response = await terra.wasm.contractQuery(contract_address, query);
    //console.log(response);

    if (
      response['accounts'].length === 0
    ) {
      // if called from the last account, returns: { accounts: [] }
      // return null if response is empty
      console.log(
        "end: response[account] has no more accounts",
      );
      console.log('response[accounts]: ', response['accounts']);
      console.log('response[accounts].length: ', response['accounts'].length);
      console.log('!response.hasOwnProperty(accounts): ', !response.hasOwnProperty('accounts'));
      return null;
    }

    let last_index = response['accounts'].length - 1;
    let tenth_address = response['accounts'][last_index];
    console.log("tenth_address: ", tenth_address);
    console.log("response length: ", response['accounts'].length);

    // for each account, query its balances
    for (const account of response['accounts']) {
      let balance_query = {
        balance: {
          address: account,
        },
      };

      let balance_response = await terra.wasm.contractQuery(
        contract_address,
        balance_query,
      );

      array.push({
        address: account,
        balance: new Dec(balance_response['balance']).div(1000000).toFixed(6),
      });
    }

    return tenth_address;
  } catch (e) {
    console.log(e);
  }
}

async function getHolderInfo(max_number) {
  var array = [];

  const start_time = new Date().getTime()
  
  // initial sendQuery
  let tenth_address = await sendHolderQuery(
    null,
    array,
    contract_addresses.ANC,
    start_time
  );

  var i = 5;
  while (true) {
    console.time('sendHolderQuery');
    // continuous count
    if (array.length > i) {
      console.log('current length: ', array.length, 'i: ', i);
      i = i + 200;
    }

    tenth_address = await sendHolderQuery(
      tenth_address,
      array,
      contract_addresses.ANC,
      start_time
    );
    if (array.length === max_number) break;
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (tenth_address == null) {
      // no more accounts left
      break;
    }
    console.timeEnd('sendHolderQuery');
  }

  array.sort((a, b) => {
    return b.balance - a.balance;
  });

  return array;
}

// function to write array of objects to csv
function arrayToCsv(array, file_name) {
  const csvString = [
    ['address', 'balance', 'time'],
    ...array.map((entries) => [entries.address, entries.balance, entries.time]),
  ]
    .map((e) => e.join(', '))
    .join('\n');

  // write csvString to file
  fs.writeFile(file_name, csvString, (err) => {
    if (err) throw err;
  });
}

export async function token_holder_query_main() {
  // (balance is given in micro ANC)
  const array = await getHolderInfo(100000000);
  console.log(array);
  arrayToCsv(array, 'anc_holder_query_results.txt')
  
  //const json = JSON.stringify(array);
  //return json;
}

token_holder_query_main();
