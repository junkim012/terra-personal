import {
    MsgStoreCode,
    MsgExecuteContract,
    MsgInstantiateContract,
    LocalTerra,
    isTxError,
    Wallet,
    StdFee,
    LCDClient,
    Coins,
    Int,
    Coin,
    Key,
    MnemonicKey,
    MsgSend,
    Denom
} from '@terra-money/terra.js';

const lt = new LocalTerra();
const terra = new LCDClient({
    URL: 'https://tequila-lcd.terra.dev',
    chainID: 'tequila-0004',
});

const mk = new MnemonicKey({
    mnemonic: `remove piece float crazy path target verify dice game expect march hire duty seven office multiply level hungry coyote wrap boost position noble slide`
});

export const deployer: Wallet = terra.wallet(mk);


