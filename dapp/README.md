## Setup Dapp

### To properly configure the Dapp, it is necessary to create an .env file in the dapp/src folder.

```
// The app option values are three numbers chosen by the developer to represent each option in the "move"
// This must match the hashes of the 'options' array from the get_blend_numbers function in the Casper-implemented contract.
// Example: if we take 3 values. 111, 222, 333.
// I have to form all the possible combinations to represent each possible combination of 3 options.
// 111111111
// 222111111
// 333111111
// As shown above, then each combination of this is put through a SHA3_256 hash.
// Obtained this hash, the first 10 characters are those that form the vector options of the get_blend_numbers functionin the contract.

REACT_APP_VALUES_OPTION1=number option
REACT_APP_VALUES_OPTION2=number option
REACT_APP_VALUES_OPTION3=number option

REACT_APP_CONTRACT_HASH_TESTNET=<contract hash mainnet>
REACT_APP_CONTRACT_HASH_MAINNET=<contract hash mainnet>
REACT_APP_MOVES_SEED_UREF=<seed uref state of contract>
REACT_APP_NODE_URL=<api node url, on this format: http://65.21.235.219:7777/rpc>
```
### We can then clone the repository, create the .env file mentioned above, and run the dapp.
```bash
git clone https://github.com/en0c-026/gawibawibo-casper
cd dapp
yarn install
yarn start
```