// development only
require('dotenv').config();
const nameAccount = "eosandrewvv1" // your name account
const provider = 'http://jungle2.cryptolions.io:8888'
const providerHistory = 'https://junglehistory.cryptolions.io';
const privateKeyActive = process.env.privateKeyActive
const ecc = require('eosjs-ecc')
const fetch = require('node-fetch');
const { Api, JsonRpc, RpcError } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');      // development only
const { TextEncoder, TextDecoder } = require('util');

const signatureProvider = new JsSignatureProvider([privateKeyActive]);
const rpc = new JsonRpc(provider, { fetch });
const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

class EosLib {
	constructor(){
		this.getBalance(nameAccount, "EOS")  // ticker name of token
        // this.sendTx('lioninjungle', "0.0010", "", "EOS")
		// this.getTxInfo(nameAccount)
		// this.buyCpu()
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
	
	publicKeyFromPrivKey(privKey){
        let publicKey = ecc.privateToPublic(privKey)
        console.log(publicKey)
        return publicKey
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

	createNewAccount = async (newAccount) => {
    	return new Promise(async(resolve,reject)=>{
    	    try{
				let ownerKey = await this.generateAccount();
				let activeKey = await this.generateAccount();
				let result = await api.transact({
					actions: [{
					  	account: 'eosio',
					  	name: 'newaccount',
						authorization: [{
							actor: nameAccount,
							permission: 'active',
						}],
						data: {
							creator: nameAccount,
							name: newAccount,
							owner: {
								threshold: 1,
								keys: [{
									key: ownerKey.publicKey,
									weight: 1
								}],
								accounts: [],
								waits: []
							},
							active: {
								threshold: 1,
								keys: [{
									key: activeKey.publicKey,
									weight: 1
								}],
								accounts: [],
								waits: []
							},
						},
					},
					{
						account: 'eosio',
						name: 'buyrambytes',
						authorization: [{
						actor: nameAccount,
						permission: 'active',
					}],
						data: {
							payer: nameAccount,
							receiver: newAccount,
							bytes: 4096, // 8192,
						},
					},
					{
						account: 'eosio',
						name: 'delegatebw',
						authorization: [{
							actor: nameAccount,
							permission: 'active',
						}],
						data: {
							from: nameAccount,
							receiver: newAccount,
							stake_net_quantity: '1.0000 EOS',
							stake_cpu_quantity: '1.0000 EOS',
							transfer: false,
						}
					}]
				}, {
					blocksBehind: 3,
					expireSeconds: 30,
				});
				let txHash = result.transaction_id
  				console.log(txHash);
				return resolve(txHash)
			}catch(e){
    	        return reject(e);
    	    }
		})
	}

	buyCpu(){
    	return new Promise(async(resolve,reject)=>{
    	    try{
 				let result = await api.transact({
 				   	actions: [					{
						account: 'eosio',
						name: 'delegatebw',
						authorization: [{
							actor: nameAccount,
							permission: 'active',
						}],
						data: {
							from: nameAccount,
							receiver: nameAccount,
							stake_net_quantity: '1.0000 EOS',
							stake_cpu_quantity: '1.0000 EOS',
							transfer: false,
						}
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

	buyRam(){
		return new Promise(async(resolve,reject)=>{
			try{
				let result = await api.transact({
					actions: [{
					  	account: 'eosio',
					  	name: 'buyrambytes',
					  	authorization: [{
							actor: nameAccount,
							permission: 'active',
						}],
						data: {
							payer: nameAccount,
							receiver: nameAccount,
							bytes: 8192,
						},
					}]
				}, {
					blocksBehind: 3,
					expireSeconds: 30,
				});
				let txHash = result.transaction_id
  				console.log(txHash);
				return resolve(txHash)
			}catch(e){
				return reject(e)
			}
		})
	}
}

module.exports = EosLib;
let eosLib = new EosLib() 