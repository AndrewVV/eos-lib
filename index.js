// development only
const nameAccount = "eosandrewvv1"
const provider = "https://1.rpc.node.abbcnet.io";
const providerHistory = 'https://1.rpc.node.abbcnet.io';
const publicKeyOwner = "EOS5QGbdzSXa39ZQUp29yjvJwdRcYWndHTpdG2zFfU3H3kxfJnQir"
const privateKeyOwner = "5JDA4AwDLLYVCbGcnakCM5HsQMFjVtZveBq2XY9BrxC6YQRj9UK"
const publicKeyActive = "EOS7P15kRJmnwZkExvWHJUiMKtbvLHhqFkFrfXcLR2YTv51kUk6E3"
const privateKeyActive = "5JYiRg9npCDUEHH7c7FvXU8PDboMB25xkpc9y5ZBezyUJwswdSU"

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
		this.getBalance(nameAccount, "ABBC")  // ticker name of token
        // this.sendTx('address', "0.00000003", "test", "ABBC")
		// this.getTxInfo(nameAccount)
		// this.publicKeyFromPrivKey(privateKeyActive)
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

    sendTx(to, amount, memo, asset){
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
		let url = `${providerHistory}/v1/history/get_actions`
		let body = {
			"account_name": account
		}
		let allTx = await this.postMethod(url, body)
		allTx = allTx.actions;
		for(let txKey in allTx){
			let tx = allTx[txKey].action_trace;
			let hash = tx.trx_id;
			let quantity = tx.act.data.quantity.split(' ')
			let amount = quantity[0];
			let symbol = quantity[1]
			let memo = tx.act.data.memo;
			let from = tx.act.data.from;
			let to = tx.act.data.to;
			let typeOperation = tx.act.name;
			let timestamp = tx["block_time"];
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

	postMethod(url, body={}){
		return new Promise(async(resolve,reject)=>{
			try{
				let options= {
					method: 'POST',
                	body: JSON.stringify(body),
                	headers: {
						"Content-Type": "application/json"
					}
            	};
				let result = await fetch(url, options)
					.then(res => {
						return res.json()
					})
				return resolve(result);
			}catch(e){
    	    	return reject(e);
			}
		})
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