/*
Read the json data in the .txt files and parse it into data

3 different formats

execute_msg -> parse -> swap -> 
execute_msg -> parse -> send -> parse msg -> msg.swap and msg.execute_swap_operations

*/

var fs = require("fs");

type data = {

    // time stamp, msgtype, 


}

type swap_tx = {
    time_stamp: string,
    msg_type: string,
    sender: string,
    offer_asset: string,
    offer_amount: string, 
    ask_asset: string, 
    ask_amount: string
}

type action_data = {
    send: number,
    increase_allowance: number,
    swap: number, 
    provide_liquidity: number
    other: number
}

type swap_data = swap_tx[];

export function read(file_number: number, file: string, anc_ust_data: swap_data, ust_anc_data: swap_data, action_data: action_data) {
    // in a single .txt file
    var text = fs.readFileSync(file, 'utf-8');
    var tx_array: [] = JSON.parse(text)

    for (var i = tx_array.length - 1; i >= 0; i = i - 1) {
        console.log('i: ', i);
        let entry = tx_array[i];

        const time_stamp = entry['timestamp'];
        const txhash = entry['txhash']

        const tx = entry['tx'];
        const value = tx['value'];
        const msg = value['msg'];

        const value2 = msg[0]['value'];
        const sender = value2['sender'];
        console.log('sender: ', sender);
        const execute_msg = value2['execute_msg'];

        const json_msg = JSON.parse(Buffer.from(execute_msg, 'base64').toString());
        // console.log(json_msg);
        if (json_msg.send) {
            console.log('json_msg.send');
            action_data.send = action_data.send + 1;
            const msg = JSON.parse(Buffer.from(json_msg.send.msg, 'base64').toString());

            if (msg.swap || msg.execute_swap_operations) {
                console.log('is swap');
                if (entry['logs']) {
                    console.log('inside entry[logs');
                    const from_contract = entry['logs'][0]['events'][1];
                    const attributes: [] = from_contract['attributes']
    
                    let offer_asset; 
                    let ask_asset;
                    let offer_amount;
                    let ask_amount;
                    for (let i = 0; i < attributes.length; i++) {
                        if (attributes[i]["key"] == "offer_asset") {
                            offer_asset = attributes[i]["value"];  
                        }
                        if (attributes[i]["key"] == "ask_asset") {
                            ask_asset = attributes[i]["value"];
                        }
                        if (attributes[i]["key"] == "offer_amount") {
                            offer_amount = attributes[i]["value"];
                        }
                        if (attributes[i]["key"] == "return_amount") {
                            ask_amount = attributes[i]["value"]; 
                        }
                    }
    
                    if (offer_asset == "uusd") {
                        // uusd to anc 
                        console.log('pushing to ust_anc_data');
                        console.log(txhash);
                        ust_anc_data.push(
                            {
                                time_stamp: time_stamp,
                                sender: sender,
                                msg_type: 'swap',
                                offer_asset: "uusd",
                                offer_amount: offer_amount,
                                ask_asset: "uanc",
                                ask_amount: ask_amount
                            }
                        )
                    } 
    
                    if (offer_asset == "terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76") {
                        // anc to uusd
                        console.log('pushing to anc_ust_data');
                        anc_ust_data.push(
                            {
                                time_stamp: time_stamp,
                                sender: sender,
                                msg_type: 'swap',
                                offer_asset: "uanc",
                                offer_amount: offer_amount,
                                ask_asset: "uusd",
                                ask_amount: ask_amount
                            }
                        )
                    }

                } else {
                    console.log("entry[logs] doesn't exist: ", tx);
                }
                
            } else {
                console.log("no msg.swap: ", msg);
            }
        } else {
            // console.log("no json_msg.send, json_msg: ", json_msg.swap);
            // no json_msg.send, json_msg:  {
            //     swap: {
            //       belief_price: '7.638222814322813',
            //       max_spread: '0.01',
            //       offer_asset: { amount: '7300051926', info: [Object] }
            //     }
            // }
        }

        if (json_msg.swap) {
            // handle these cases separately 
            console.log('json_msg.swap');
            if (entry['logs']) {
                console.log('inside entry[logs]');
                const from_contract = entry['logs'][0]['events'][1];
                const attributes: [] = from_contract['attributes']

                let offer_asset; 
                let ask_asset;
                let offer_amount;
                let ask_amount;
                for (let i = 0; i < attributes.length; i++) {
                    if (attributes[i]["key"] == "offer_asset") {
                        offer_asset = attributes[i]["value"];  
                    }
                    if (attributes[i]["key"] == "ask_asset") {
                        ask_asset = attributes[i]["value"];
                    }
                    if (attributes[i]["key"] == "offer_amount") {
                        offer_amount = attributes[i]["value"];
                    }
                    if (attributes[i]["key"] == "return_amount") {
                        ask_amount = attributes[i]["value"]; 
                    }
                }

                if (offer_asset == "uusd") {
                    // uusd to anc 
                    console.log('pushing to ust_anc_data');
                    console.log(txhash);
                    const to_push = {
                        time_stamp: time_stamp,
                        sender: sender,
                        msg_type: 'swap',
                        offer_asset: "uusd",
                        offer_amount: offer_amount,
                        ask_asset: "uanc",
                        ask_amount: ask_amount
                    }
                    ust_anc_data.push(
                        to_push
                    )

                    // console.log(to_push);
                } 

                if (offer_asset == "terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76") {
                    // anc to uusd
                    console.log('pushing to anc_ust_data');
                    const to_push = {
                        time_stamp: time_stamp,
                        sender: sender,
                        msg_type: 'swap',
                        offer_asset: "uanc",
                        offer_amount: offer_amount,
                        ask_asset: "uusd",
                        ask_amount: ask_amount
                    }
                    anc_ust_data.push(
                        to_push
                    )
                    // console.log(to_push);
                }
            } else {
                console.log('no entry[logs] because failed execution');
            }
        }
    }
}

export function loop() {
    const anc_ust_data: swap_data = [];
    const ust_anc_data: swap_data = []; 

    const action_data: action_data = {
        send: 0,
        increase_allowance: 0,
        swap: 0,
        provide_liquidity: 0,
        other: 0
    };

    const token_rs = 0;
    const native_token_rs = 0; 

    for (let i = 162; i > 0; i--) {
        var file = `../fcd-data/anc-ust-pair/anc-ust-results-${i}.txt`;
        console.log('reading: ', file);
        read(i, file, anc_ust_data, ust_anc_data, action_data);
    }

    console.log(anc_ust_data);
    console.log(ust_anc_data);
    console.log(action_data);
    console.log('anc_ust_data length: ', anc_ust_data.length);
    console.log('ust_anc_data length: ', ust_anc_data.length);
    
    let offer_anc_sum = 0;
    anc_ust_data.forEach((entry) => {
        offer_anc_sum += Number(entry.offer_amount); 
    })

    let offer_ust_sum = 0;




    // write pl_data to .txt 
    JSON.stringify(anc_ust_data);
    fs.writeFile(`../results/anc-ust-swap-history.json`, JSON.stringify(anc_ust_data),
    function(err) {
      if (err) {
        console.error('error');
      }
    })



}

loop();


// starting from 163 
// console.log(json_msg.provide_liquidity.assets[0]);
// console.log(json_msg.provide_liquidity.assets[1]);
// { amount: '4000000000', info: { native_token: { denom: 'uusd' } } }
// {
//   amount: '689032412',
//   info: {
//     token: { contract_addr: 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76' }
//   }
// }

// // starting from 1
// {
//     info: {
//       token: { contract_addr: 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76' }
//     },
//     amount: '281339705'
//   }
//   { info: { native_token: { denom: 'uusd' } }, amount: '490000000' }