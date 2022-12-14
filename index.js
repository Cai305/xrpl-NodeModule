const express = require('express');
const xrpl = require("xrpl"); //importing xrp Ledger
const dotenv = require('dotenv');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

// support parsing of application/json type post data
app.use(bodyParser.json());


//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use(express.urlencoded({
    extended: true
  }))

let url = process.env.TestNet || "wss://s.altnet.rippletest.net:51233" ;
const PORT = process.env.PORT || 3000 ;

// const wallet = new xrpl.Wallet(process.env.PUBLICKEY1, process.env.PRIVATEKEY1);
const client = new xrpl.Client(url);

app.use('/sign_blob', async (req, res)=>{
    const {signed_tx_blob} = req.body;
    await client.submitAndWait(signed_tx_blob)
    .then((tx)=>{
        res.send(tx.json());
    }).catch(
        (err)=>{
            res.send(err);
        })

})

app.use('/get_Wallet_Using_Seed' ,async (req, res) => {

        const {seed} = req.body;
    //if you already have a seed encoded in base58, you can instantiate a Wallet from it like this:

       const test_wallet = xrpl.Wallet.fromSeed(seed) // Test secret; don't use for real
 // Test secret; don't use for real
       res.send(test_wallet.json());
  
})

app.use('/ledger_events',async (req,res)=>{

    client.request({
                   "command": "subscribe",
                   "streams": ["ledger"]
                 })
                 client.on("ledgerClosed", async (ledger) => {
                //    console.log(`Ledger #${ledger.ledger_index} validated with ${ledger.txn_count} transactions!`)

                   res.send({"Ledger":ledger.ledger_index ,"validated" : ledger.txn_count }.JSON())
                 })
})

app.post('/signing_Transaction', async (req, res) => {

    const { prepared ,publicKey ,privateKey } = req.body;
    // console.log(prepared ,publicKey ,privateKey)
    const wallet = new xrpl.Wallet(publicKey, privateKey);
    //Sign prepared instructions ------------------------------------------------
    const signed_blob = wallet.sign(prepared);  
    res.send(signed_blob)

})

app.use('/check_Transaction_Status', async (req, res) => {
    const { tx } = req.body;
    await client.submitAndWait(signed_tx_blob)
    .then((res)=>{
        console.log("Transaction result:", tx.result.meta.TransactionResult)
        console.log("Balance changes:", JSON.stringify(xrpl.getBalanceChanges(tx.result.meta), null, 2))
        .then((err)=>{
        }).
        catch((err)=>res.send(err))
    }).catch(err=>res.send(err));
  
   
})

app.post('/send', async (req, res) => {
    const { sender_Wallet_Address,receiver_Wallet_Address,xrp_Amount_To_Drop } = req.body;
    // console.log('sender_Wallet_Address :',sender_Wallet_Address , "receiver_Wallet_Address :",receiver_Wallet_Address , "  xrp_Amount_To_Drop :",xrp_Amount_To_Drop )
    await client.autofill({
           "TransactionType": "Payment",
           "Account": `${sender_Wallet_Address}`,
           "Amount": xrpl.xrpToDrops(`${xrp_Amount_To_Drop}`),
           "Destination": `${receiver_Wallet_Address}`
             }).then((response) => {
                res.send(response)
             }).catch((err) => {res.send(err)})
})

app.post('/get_funded_wallet_info', async (req, res) => {
   const { classic_Address } = req.body;
         await client.request({
            "command": "account_info",
            "account": classic_Address,
            "ledger_index": "validated"
          })
          .then((wallet_Info) => { 
            res.send(wallet_Info);
        })
       
    
})
    
app.use('/genFundWallet', async (req, res) => {
     await client.fundWallet().then((result) => {
        res.send(result);
    })
})

//  If you just want to generate keys, you can create a new Wallet instance like this:
app.use('/new_Wallet_Instance', async (req, res) => {
    const test_wallet = xrpl.Wallet.generate();
    res.send(test_wallet);
})

app.use('/disconnect', async (req, res) => {
    let isConnected;
    client.disconnect()
    .then(() => { 
        isConnected = false ;
        res.send({connected:isConnected});
        }).catch(
            err => console.log(err)
        )
})

app.use('/connect', async (req, res) => {
   let isConnected;
       return await client.connect()
        .then(() =>{ 
           console.log("Xrp Ledger connected Successfully..!");
             isConnected = true ;
             res.send({"connected":isConnected});
            })
        .catch(err => {
           console.log(err)
           isConnected = false ;
           res.send({connected:isConnected});
       })
})
  
app.get('/', async (req, res) => {
   res.send("XRP Ledger is ready to use...!")
 })

app.listen(PORT,() => {
    console.log('Running on:' , "http//:localhost:",PORT)
})