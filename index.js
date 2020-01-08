// development only
const nameAccount = "eosandrewvv1"
const provider = 'http://jungle2.cryptolions.io:8888'
const publicKeyOwner = "EOS6hB22JB3vBm8YdjTCTucxar4E2wvYdfjUesXvUPTEKxgX6QtKX"
const privateKeyOwner = "5JmzYnQhq9AbzvgFHd4FT8TTdbPSDdEsJmKidcbMw4HNBhSjcCf"
const publicKeyActive = "EOS53PyaRQ8bDxYU6wwds2iQM5Tjyzjx52z7dehMwkVXrkVwT3e3i"
const privateKeyActive = "5K1FibAhERHAsED8FstMJCWYxqhxx9zZSNy1XgtCX19Bdxk5bL9"

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
		this.sendTx('lioninjungle', 0.0001, "test123", "JUNGLE")
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
    	    	let data = {
    	    		"code" : "eosio.token",
					"account" : account,
					"symbol": ticker
    	    	}
                let url = `${provider}/v1/chain/get_currency_balance`
    	    	let options = {
                	body: JSON.stringify(data),
                	method: 'POST',
                	headers: {"Content-Type": "application/json"}
                };
                let balance = await fetch(url, options)
                    .then(res => {
					    return res.json()
				    })
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
}

module.exports = EosLib;
let eosLib = new EosLib() 