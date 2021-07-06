import { startInterval } from './singleday_query';
import { token_holder_query_main } from './anc_holder_query';
import { anc_borrower_query_main } from './anc_borrower_query';

startInterval();

token_holder_query_main();

anc_borrower_query_main(100, 'results.txt');

