const fs = require('fs');

var next = 10
var previous_next = next; 
next = 20; 
console.log(previous_next);

const txs = [{
    id: 1
}, {
    id: 2
}, {
    id: 3
}]

const object = {
    transactions: txs
}

console.log(object["transactions"]);

const array1 = [1, 2, 3]; 
const array2 = [4, 5, 6];

const joined = array1.concat(array2);
console.log(joined);


for (let i = 0; i < 5; i++) {
    fs.appendFile("file.txt", 'Text', function(err) {
        if (err) throw err;
        console.log('IS WRITTEN')
      });
}
