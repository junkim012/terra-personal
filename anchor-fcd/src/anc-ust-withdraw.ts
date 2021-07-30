/*
Read the json data in the .txt files and parse it into data
*/

var fs = require("fs");

type data = {

    // time stamp, msgtype, 


}

type withdraw_liquidity_tx = {
    time_stamp: string,
    msg_type: string,
    sender: string,
    offer_token: string,
    offer_token_amount: string, 
    ask_native_token: string, 
    ask_native_token_amount: string
    ask_token: string
    ask_token_amount: string
}

type withdraw_liquidity_data = withdraw_liquidity_tx[];


type action_data = {
    send: number,
    increase_allowance: number,
    swap: number, 
    provide_liquidity: number
    other: number
}


export function read(file_number: number, file: string, pl_data: withdraw_liquidity_data, action_data: action_data, token_rs: number, native_token_rs: number) {
    // in a single .txt file
    var text = fs.readFileSync(file, 'utf-8');
    // console.log(text);
    var tx_array: [] = JSON.parse(text)
    // console.log(tx_array);

    for (var i = tx_array.length - 1; i >= 0; i--) {
        let entry = tx_array[i];

        const time_stamp = entry['timestamp'];

        const tx = entry['tx'];
        const value = tx['value'];
        const msg = value['msg'];

        const value2 = msg[0]['value'];
        const sender = value2['sender'];
        const execute_msg = value2['execute_msg'];

        const json_msg = JSON.parse(Buffer.from(execute_msg, 'base64').toString());
        //console.log(json_msg);

        if (json_msg.send.msg.withdraw_liquidity) {
            console.log('withdraw_liquidity');

            pl_data.push({
                time_stamp: time_stamp,
                sender: sender,
                msg_type: 'withdraw_liquidity',
                offer_token: 'ANC-UST-LP',
                offer_token_amount: json_msg.send.amount,
           
                ask_native_token: '',
                ask_native_token_amount: '',
                // native_token_amount_running_sum: native_token_rs.toString()
                ask_token: '',
                ask_token_amount: ''
            })

        }

        if (json_msg.send) {
              action_data.send = action_data.send + 1;
        }

        // if (json_msg.increase_allowance) {
        //     // increase allowance + provide liquidity

        //     action_data.increase_allowance = action_data.increase_allowance + 1;

        //     if (msg[1]) {
        //         const value = msg[1]['value'];
        //         const sender = value['sender'];
        //         const execute_msg = value['execute_msg']; 
        //         const json_msg = JSON.parse(Buffer.from(execute_msg, 'base64').toString());
        //         if (json_msg.provide_liquidity) {

        //             action_data.provide_liquidity = action_data.provide_liquidity + 1;
                    

        //             // sometimes native_token is asset[0].info.native_token and token is asset[1].info.token
        //             let t: number
        //             let n: number
        //             if (json_msg.provide_liquidity.assets[0].info.token) {                  
        //                 t = 0;
        //                 n = 1;
        //             }
        //             if (json_msg.provide_liquidity.assets[0].info.native_token) {
        //                 t = 1;
        //                 n = 0; 
        //             }

        //             const token = json_msg.provide_liquidity.assets[t].info.token.contract_addr;
        //             const token_amount = json_msg.provide_liquidity.assets[t].amount;
        //             const native_token = json_msg.provide_liquidity.assets[n].info.native_token.denom;
        //             const native_token_amount = json_msg.provide_liquidity.assets[n].amount;

        //             token_rs = token_rs + Number(token_amount);
        //             native_token_rs = native_token_rs + Number(native_token_amount);

        //             //console.log(token_amount)

        //             // console.log(entry);

        //             let mint_amount: number

        //             if (entry['logs']) {
        //                 const logs = entry['logs']; 
        //                 //console.log('logs: ', logs);
        //                 const log = logs[1];
        //                 //console.log('log: ', log);
        //                 const events = log['events'];
        //                 //console.log('events: ', events);
        //                 const event = events[1];
        //                 //console.log('event: ', event);
        //                 const attributes: [] = event['attributes'];
        //                 //console.log('attributes: ', attributes);

        //                 for (let i = 0; i < attributes.length; i++) {
        //                     if (attributes[i]["value"] == "mint") {
        //                         // console.log('i: ', i);
        //                         const object: object = attributes[i+2];
        //                         // console.log(object);
        //                         mint_amount = object['value'];
        //                     }
        //                 }
        //             } else {
        //                 console.log("entry did not have the 'logs' field")
        //                 //console.log(entry);
        //                 //console.log(entry['log']);
        //                 mint_amount = 0;
        //             }
                  
        //             // const attributes: [] = entry['logs'][1]['events'][1]['attributes'];
        //             console.log('mint_amount: ', mint_amount);
                    



        //             pl_data.push(
        //                 {
        //                     time_stamp: time_stamp,
        //                     sender: sender,
        //                     msg_type: 'provide_liquidity',
        //                     offer_token: token,
        //                     offer_token_amount: token_amount,
        //                     //token_amount_running_sum: token_rs.toString(),
        //                     offer_native_token: native_token,
        //                     offer_native_token_amount: native_token_amount,
        //                     // native_token_amount_running_sum: native_token_rs.toString()
        //                     ask_lp_token: mint_amount.toString()
        //                 }
        //             )

        //         }
                
        //     }
        // } 

        // if (json_msg.swap) {
        //     action_data.swap = action_data.swap + 1;
        // }

        // if (json_msg.provide_liquidity) {
        //     action_data.provide_liquidity = action_data.provide_liquidity + 1;
        // }
    
    }

    // tx_array.forEach((object) => {
    //     const tx = object['tx'];
    //     const value = tx['value'];
    //     const msg = value['msg'];
    //     const value2 = msg[0]['value'];
    //     const sender = value2['sender'];
    //     const execute_msg = value2['execute_msg'];

    //     const json_msg = JSON.parse(Buffer.from(execute_msg, 'base64').toString());
    //     // console.log(json_msg);
    //     if (json_msg.increase_allowance) {

    //         const token = json_msg.provide_liquidity.assets[0].info.token.contract_addr;
    //         const token_amount = json_msg.provide_liquidity.assets[0].info.amount;
    //         const native_token = json_msg.provide_liquidity.assets[1].info.native_token.denom;
    //         const native_token_amount = json_msg.provide_liquidity.assets[1].info.amount;
                
    //         data.push(
    //             {
    //                 token: token,
    //                 token_amount: token_amount,
    //                 native_token: native_token,
    //                 native_token_amount: native_token_amount
    //             }
    //         )
    //     }
    // })

    // fs.readFile(file, function(text) {
    //     var tx_array = JSON.parse(text)
    //     console.log(tx_array);
    //     tx_array.forEach((tx) => {
    //         const value = tx['value'];
    //         const msg = value['msg'];
    //         const value2 = msg[0]['value'];
    //         const sender = value2['sender'];
    //         const execute_msg = value2['execute_msg'];

    //         const json_msg = JSON.parse(Buffer.from(execute_msg, 'base64').toString());
    //         console.log(json_msg);
    //     })
    // })
}

export function loop() {
    const wl_data: withdraw_liquidity_data = [];
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
        var file = `anc-ust-results-${i}.txt`;
        console.log('reading: ', file);
        read(i, file, wl_data, action_data, token_rs, native_token_rs);
    }

    console.log(wl_data);
    console.log(action_data);

    // write pl_data to .txt 
    JSON.stringify(wl_data);
    fs.writeFile(`anc-ust-history.json`, JSON.stringify(wl_data),
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