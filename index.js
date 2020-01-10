// development only
const nameAccount = "eosandrewvv1"
const provider = 'http://jungle2.cryptolions.io:8888'
const providerHistory = 'https://junglehistory.cryptolions.io';
// const nameAccount = "hitbtcpayout";
const publicKeyOwner = "EOS6hB22JB3vBm8YdjTCTucxar4E2wvYdfjUesXvUPTEKxgX6QtKX"
const privateKeyOwner = "5JmzYnQhq9AbzvgFHd4FT8TTdbPSDdEsJmKidcbMw4HNBhSjcCf"
const publicKeyActive = "EOS53PyaRQ8bDxYU6wwds2iQM5Tjyzjx52z7dehMwkVXrkVwT3e3i"
const privateKeyActive = "5K1FibAhERHAsED8FstMJCWYxqhxx9zZSNy1XgtCX19Bdxk5bL9"

const ecc = require('eosjs-ecc')
const fetch = require('node-fetch');
const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');      // development only
const { TextEncoder, TextDecoder } = require('util');

const signatureProvider = new JsSignatureProvider([privateKeyActive]);
const rpc = new JsonRpc(provider, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

class EosLib {
	constructor(){
		// this.getBalance(nameAccount, "EOS")  // ticker name of token
        // this.sendTx('lioninjungle', 0.0001, "test123", "JUNGLE")
        this.getTxInfo(nameAccount)
    }
    
    generateAccount(){
		return new Promise(async(resolve,reject)=>{
    	    try{
    	    	let privateKey = await ecc.randomKey()
				let data = {
					publicKey: ecc.privateToPublic(privateKey),
					privateKey: privateKey
				}
                console.log(data)
				return resolve(data)
			}catch(e){
    	        return reject(e);
			}
		})
    }

    privKeyFromSeed(seed){
        let privKey = ecc.seedPrivate(seed)
        console.log(privKey)
        return privKey
    }

    getBalance(account, ticker="EOS"){
    	return new Promise(async(resolve,reject)=>{
    	    try{
                let balance = await api.rpc.get_currency_balance("eosio.token", account, ticker)
				balance = parseFloat(balance)
				console.log(balance)
				return resolve(balance)
    	    }catch(e){
    	        return reject(e);
    	    }
		})
    }

    sendTx(to, amount, memo, asset="EOS"){
    	return new Promise(async(resolve,reject)=>{
    	    try{
 				let result = await api.transact({
 				   	actions: [{
 				    	account: 'eosio.token',
 				    	name: 'transfer',
 				    	authorization: [{
 				    		actor: nameAccount,
 				    		permission: 'active',
 				    	}],
 				     	data: {
 				    		from: nameAccount,
 				    		to: to,
 				    		quantity: `${amount} ${asset}`,
 				    		memo: memo,
 				    	},
 					}]
 				}, {
 				   blocksBehind: 3,
 				   expireSeconds: 30,
                })
                let txHash = result.transaction_id
  				console.log(txHash);
				return resolve(txHash)
    	    }catch(e){
    	        return reject(e);
    	    }
		})
    }
    
    async getTxInfo(account){
		let result = [];
		let url = `${providerHistory}/v2/history/get_actions?account=${account}`
		let allTx = await fetch(url)
			.then(res => {
				return res.json()
			})
		allTx = allTx.actions;
		for(let txKey in allTx){
			let tx = allTx[txKey];
			let hash = tx.trx_id;
			let amount = tx.act.data.amount;
			let symbol = tx.act.data.symbol
			let memo = tx.act.data.memo;
			let from = tx.act.data.from;
			let to = tx.act.data.to;
			let typeOperation = tx.act.name;
			let timestamp = tx["@timestamp"];
			let blockNumber = tx.block_num;
			let txData = this.formatTxData(hash, amount, symbol, memo, from, to, typeOperation, timestamp, blockNumber);
			result.push(txData)
		}
		console.log(result)
        return result
	}
	
	formatTxData(hash, amount, symbol, memo, from, to, typeOperation, timestamp, blockNumber){
		let txData = {
			txHash: hash,
			amount,
			ticker: symbol, 
			memo,
			from,
			to,
			typeOperation,
			timestamp,
			blockNumber
		};
		return txData;
	}
}

module.exports = EosLib;
let eosLib = new EosLib() 