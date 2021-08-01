/*
Read the json data in the .txt files and parse it into data

FCD Request on this address: terra1vg0qyq92ky9z9dp0j9fv5rmr2s80sg605dah6f (ANC-UST LP)

cases: 
1. execute_msg has 'send' field, 'send' field has 'msg' filed with 'withdraw_liquidity' field

*/

var fs = require("fs");

type withdraw_liquidity_tx = {
    time_stamp: string,
    msg_type: string,
    sender: string,
    offer_token: string, // lp token 
    offer_token_amount: string, // lp token amount
    ask_native_token: string, // uusd 
    ask_native_token_amount: string // uusd amount
    ask_token: string // uanc
    ask_token_amount: string // uanc amount
}

type withdraw_liquidity_data = withdraw_liquidity_tx[];


type action_data = {
    send: number,
    increase_allowance: number,
    swap: number, 
    provide_liquidity: number,
    withdraw_liquidity: number, 
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

        const txhash = entry['txhash']; 
        const time_stamp = entry['timestamp'];

        const tx = entry['tx'];
        const value = tx['value'];
        const msg = value['msg'];

        const value2 = msg[0]['value'];
        const sender = value2['sender'];
        const execute_msg = value2['execute_msg'];

        const json_msg = JSON.parse(Buffer.from(execute_msg, 'base64').toString());

        if (json_msg.send) {
            if (json_msg.send.msg) {
                console.log(json_msg.send.msg);
                let send_msg; 
                try {
                    send_msg = JSON.parse(Buffer.from(json_msg.send.msg, 'base64').toString()); 
                    if (send_msg.withdraw_liquidity) {
                        console.log('has send_msg.withdraw_liquidity, ', send_msg);
                        if (entry['logs']) {
                            const from_contract = entry['logs'][0]['events'][1];
                            // console.log(from_contract);
                            const attributes: [] = from_contract["attributes"];
        
                            let offer_token_amount;
                            let refund_assets;
                            attributes.forEach((obj) => {
                                if (obj["key"] == "withdrawn_share") {
                                    offer_token_amount = obj["value"];
                                }
                                if (obj["key"] == "refund_assets") {
                                    refund_assets = obj["value"]; 
                                }
                            })
        
                            let uanc = refund_assets.split(',')[0];
                            let uusd = refund_assets.split(',')[1];
                            uusd = uusd.substring(0, uusd.length - 4);
                            uanc = uanc.substring(0, uanc.length - 44);
        
                            action_data.withdraw_liquidity++;
                            pl_data.push({
                                time_stamp: time_stamp,
                                sender: sender,
                                msg_type: 'withdraw_liquidity',
                                offer_token: 'ANC-UST-LP',
                                offer_token_amount: offer_token_amount,
                           
                                ask_native_token: 'uusd',
                                ask_native_token_amount: uusd,
                                // native_token_amount_running_sum: native_token_rs.toString()
                                ask_token: 'uanc',
                                ask_token_amount: uanc
                            })
        
                        } else {
                            console.log("entry['logs'] does not exist"); 
                            console.log(entry); // erroneous transactions
                        }
                }
                } catch {
                    console.log('try catch error');
                    console.log(entry); // erroneous transactions
                }

            

            }

        }
    }
}


export function loop() {
    const wl_data: withdraw_liquidity_data = [];
    const action_data: action_data = {
        send: 0,
        increase_allowance: 0,
        swap: 0,
        provide_liquidity: 0,
        withdraw_liquidity: 0,
        other: 0
    };

    const token_rs = 0;
    const native_token_rs = 0; 

    for (let i = 106; i > 0; i--) {
        var file = `../fcd-data/anc-ust-lp/anc-ust-lp-results-${i}.txt`;
        console.log('reading: ', file);
        read(i, file, wl_data, action_data, token_rs, native_token_rs);
    }

    console.log(wl_data);
    console.log(action_data);

    // write wl_data to .txt 
    JSON.stringify(wl_data);
    fs.writeFile(`../results/anc-ust-wl-history.json`, JSON.stringify(wl_data),
    function(err) {
      if (err) {
        console.error('error');
      }
    })

}

loop();