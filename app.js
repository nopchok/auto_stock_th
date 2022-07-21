//pkg -t node10 app.js --out-path build
const VERSION = '1.0.0';
const http = require('https');
const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const locateChrome = require('locate-chrome');
const fs = require('fs');

let config = require(process.cwd()+'/config.json');



const axios = require('axios');
var sendtelegram = (c) => {
	let headers = {
		'Content-Type': 'application/json'
	};
	let body = {
		chat_id: config.telegram_chat_id,
		text: c
	}
	
	axios.post('https://api.telegram.org/bot'+config.telegram_api+'/sendMessage', JSON.stringify(body), {headers: headers})
	.then( function(res){
	}).catch( function(err){
	});
}
sendtelegram('Start SET TH');





const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36';
const HEADLESS = !config.show_browser;
const PORT = config.port;
const web = 'settrade';

let FIRST_WEB = {};
FIRST_WEB.settrade = require(process.cwd()+'/url.json').url;

let SESSION = '';
let ok_ticker = {};
let old_ok_ticker = {};

let old_ticker = {};
let dologin = {};
let checkPage = {};
let error = {};

let CASH = config.cash;
let trade_data = {};
let new_order = {};
let done_order = {};



const SET50 = ["ADVANC","AOT","AWC","BANPU","BBL","BDMS","BEM","BGRIM","BH","BTS","CBG","COM7","CPALL","CPF","CPN","CRC","DTAC","EA","EGCO","GLOBAL","GPSC","GULF","HMPRO","INTUCH","IRPC","IVL","KBANK","KCE","KTB","KTC","LH","MINT","MTC","OR","OSP","PTT","PTTEP","PTTGC","RATCH","SAWAD","SCB","SCC","SCGP","STGT","TIDLOR","TISCO","TOP","TRUE","TTB","TU"];
const SET100 = ["ACE","ADVANC","AEONTS","AMATA","AOT","AP","AWC","BAM","BANPU","BBL","BCH","BCP","BCPG","BDMS","BEC","BEM","BGRIM","BH","BLA","BPP","BTS","CBG","CENTEL","CHG","CK","CKP","COM7","CPALL","CPF","CPN","CRC","DOHOME","DTAC","EA","EGCO","EPG","ESSO","GLOBAL","GPSC","GULF","GUNKUL","HANA","HMPRO","INTUCH","IRPC","IVL","JMART","JMT","KBANK","KCE","KEX","KKP","KTB","KTC","LH","MAJOR","MEGA","MINT","MTC","OR","ORI","OSP","PLANB","PTG","PTT","PTTEP","PTTGC","QH","RATCH","RBF","RCL","RS","SAWAD","SCB","SCC","SCGP","SINGER","SIRI","SPALI","SPRC","STA","STARK","STEC","STGT","SUPER","SYNEX","TASCO","TCAP","THANI","TIDLOR","TISCO","TOP","TQM","TRUE","TTA","TTB","TU","TVO","VGI","WHA"];

async function page_evaluate(str, ...args){
    let f = typeof str == 'string' ? eval(str) : str;
    
    if( args == undefined ){
        return await page.evaluate(f);
    }else{
        return await page.evaluate(f, ...args);
    }
}

function get_chrome(){
	return new Promise((resolve, reject) => {
		try{
			locateChrome(function(l) {
				resolve(l);
			});
		}catch(e){
			reject(e);
		}
	});
}

const restart_node = () => {
    fs.writeFileSync( './run.txt' , new Date().toString() );
}
const gracefulShutdown = () => {
	browser = (function(){})();
	page = (function(){})();
    restart_node();
	setTimeout(() => {
        launchBrowser()
	}, 5 * 1000)
}

let waitForAnySelector = (page, selectors) => new Promise((resolve, reject) => {
	let hasFound = false
	selectors.forEach(selector => {
		page.waitForTimeout(selector,{timeout:60000})
		.then(() => {
			if (!hasFound) {
				hasFound = true
				resolve(selector)
			}
		})
		.catch((error) => {})
	})
})


function save_jsonbase(name, key, data){
    axios.put('https://jsonbase.com/'+name+'/'+key, JSON.stringify(data), { headers: {'Content-Type': 'application/json'} }).then(response => {
    });
}






/////////////// SETTRADE ///////////////
/////////////// SETTRADE ///////////////
/////////////// SETTRADE ///////////////

let old_hour = 0;
let old_minute = 0;
async function check_hour(){
    let new_hour = new Date().getHours();
    let new_minute = new Date().getMinutes();
    
    if( new_hour == 8 && old_hour == 7 ){
        restart_node();
    }
    old_hour = new_hour;
    old_minute = new_minute;
}
async function get_order(){
    let r = await page_evaluate(`(d) => {
        return new Promise((resolve, reject) => {
            fetch(d.url, {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-GB,en;q=0.9,th-TH;q=0.8,th;q=0.7,en-US;q=0.6,pt;q=0.5",
                    "sec-ch-ua": " Not A;Brand;v=99, Chromium;v=101, Google Chrome;v=101",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "Windows",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site"
                },
                "referrer": "https://wmd1.settrade.com/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "include"
            }).then( function(r){
                return r.json();
            }).then( function(res){
                resolve(res);
                // res.forEach( function(j){
                    // console.log(j.symbol, j.side, j.price, j.vol);
                // });
            }).catch( function(err){
                reject(err);
            });
        });
    }`, {username: config.username, url: config.settrade_url+config.username+"7/orders"});
    return r;
}
async function get_port(){
    let r = await page_evaluate(`(d) => {
        return new Promise((resolve, reject) => {
            let empty_port = [];
            fetch(d.url, {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-GB,en;q=0.9,th-TH;q=0.8,th;q=0.7,en-US;q=0.6,pt;q=0.5",
                    "sec-ch-ua": " Not A;Brand;v=99, Chromium;v=101, Google Chrome;v=101",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "Windows",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site"
                },
                "referrer": "https://wmc2.settrade.com/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors",
                "credentials": "include"
            }).then( function(r){
                return r.json();
            }).then( function(res){
                resolve(res);
                // if( res.portfolioList == undefined ) return;
                // res.portfolioList.forEach( function(j){
                    // empty_port.push( j.currentVolume == 0 );
                    // if(j.currentVolume == 0) return;
                    // console.log( j.symbol, 'SELL', j.currentVolume, 0, 'ATC' );
                // });
            }).catch( function(err){
                reject(err);
            });
        });
    }`, {username: config.username, url: config.settrade_url+config.username+"7/portfolios?accountType=CASH_BALANCE"});
    return r;
}
const check_4column = async function(){
    let r = await page_evaluate(`() => {
        let is_4col = false;
        document.querySelectorAll('[class*="dropdown-active "]').forEach(function(j){
            let t = j.innerText
            if(t.includes('Show ')){
                is_4col = j.innerText.includes('4');
                if( !is_4col ) j.setAttribute('id', 'my_sel_4col');
            }
        });
        if( !is_4col ){
            document.querySelectorAll('[class*="z-index-dropdown"]').forEach( function(j){
                if( j.innerText.trim() == 'Show 3 ColumnsShow 4 Columns' ){
                    j.querySelectorAll('li')[1].setAttribute('id', 'my_4col');
                }
            } );
        }
        return is_4col;
    }`);
    if( !r ){
        try{
            await page.waitForSelector('[id="my_4col"]', {timeout: 100});
            await page.click('[id="my_sel_4col"]');
            await page.waitForTimeout(1000);
            await page.click('[id="my_4col"]');
        }catch(e){}
    }
    return r;
}
const click_ticker = async function(){
    await page_evaluate(`() => {
		if( document.querySelectorAll('nav').length > 0 ){
			if( document.querySelectorAll('nav')[0].querySelectorAll('button[class*="active"]')[0].innerText.trim() != 'Ticker' ){
				document.querySelectorAll('nav')[0].querySelectorAll('button').forEach(function(j){
					if(j.innerText.trim() == 'Ticker') j.click();
				});
			}else{
			}
		}else{
		}
    }`);
}
const check_socket = async function(){
    await page_evaluate(`() => {
        if( document.querySelectorAll('[class*="connection-status-text"]').length == 1 ){
            if( document.querySelector('[class*="connection-status-text"]').innerText != 'Connected' ) location.reload();
        }
    }`);
}
const get_body_content = async function(){
    return await page_evaluate(`() => {
        return document.querySelector('body').innerText.trim();
    }`);
}
const login_sbito = async function(){
    try{
        await page.goto('https://www.sbito.co.th/', {waitUntil: 'load', timeout: 0});
        await page.waitForSelector('[name="p"]', {timeout: 30000});
        await page_evaluate(`(d) => {
            console.log(d);
            document.querySelector('[name="u"]').value = d.username;
            document.querySelector('[name="p"]').value = d.password;
            document.querySelector('[id="login-nav"]').submit();
        }`, {username: config.username, password: config.password});
        
        await page.waitForSelector('[id="myInput"]', {timeout: 30000});
        
        FIRST_WEB.settrade = await page_evaluate(`() => {
            return document.querySelectorAll('section')[0].querySelector('a').getAttribute('href');
        }`);
        
        await fs.writeFileSync('./url.json', JSON.stringify({'url': FIRST_WEB.settrade}));
    }catch(e){
        console.log(e);
    }
    
    await page.goto(FIRST_WEB[web], {waitUntil: 'load', timeout: 0});
}
const get_session = async function(){
    return await page_evaluate(`() => {
        let tt = '';
        document.querySelectorAll('div').forEach( function(j){ if(j.innerText.trim() == 'SET:') tt = (j.parentNode.querySelectorAll('div')[1].innerText.trim());});
        return tt;
    }`);
}
const save_ticker = function(ticker){
    if( JSON.stringify(old_ticker) != JSON.stringify(ticker) ) save_jsonbase(SESSION, SESSION, ticker);
    old_ticker = ticker;
}
const get_ticker = async function(){
    return await page_evaluate(`() => {
        let tickers = document.querySelectorAll('[class*="cursor-pointer white-space-nowrap display-block"]');
        let data = {}
        let summary = {
            highest_by_count: {count: 0, symbol: ''},
            count: 0,
            now: 0,
            unix: 0,
        }
        tickers.forEach( function(j){
            let _data = Array.from(j.querySelectorAll('div')).map(jj=>jj.innerText);
            //console.log(_data);
            if( _data.length < 5 ) return;
            if( _data.join('') == '' ) return;
            if( _data[1] == '' ) return;
            
            let symbol = _data[0];
            let side = _data[1];
            let volume = 1 * (_data[2].replace(/[^0-9\.]+/g,''));
            let price = _data[3].replace(/[^0-9\.]+/g,'');
            // let key = [symbol, side, price].join('|');
            if( data[symbol] == undefined ){
                data[symbol] = {
                    B: {},
                    S: {}
                }
            }

            if( data[symbol][side] == undefined ) data[symbol][side] = {}
            if( data[symbol][side][price] == undefined ) data[symbol][side][price] = {count: 0, sum_volume: 0, highest_volume: 0};

            data[symbol][side][price].count++;
            data[symbol][side][price].sum_volume += volume;
            data[symbol][side][price].sum_value = data[symbol][side][price].sum_volume * price;
            if( volume > data[symbol][side][price].highest_volume ) data[symbol][side][price].highest_volume = volume;
        });
        return data
    }`);
}
const sbito_error = ['Warning !!! Invalid UserID', 'Accessor not found', 'Warning !!! Missing some parameter refer(null) userid(null) tokenkey(null) vendorID(null) lang(null) directpage(null)'];
checkPage.settrade = async function(){
	try{
        await check_hour();
		if( !browser ) throw 'browser';
		[page] = await browser.pages();
		
		let c_url = await page.url();
		
        let body_content = await get_body_content();
        
        if( sbito_error.includes(body_content) ) await login_sbito();
        if(c_url.includes('UnauthorizedAccess')) await login_sbito();
        
        if(!c_url.includes('streaming7/StreamingPage.jsp')) throw 'loading';
        
        await click_ticker();
        if( await check_4column() == false ) throw '4column';
        
        await check_socket();
        
        let session = await get_session();
        
        if( session == 'Closed' ) throw 'session';
        SESSION = (new Date().toJSON().split(/-|T/g).slice(0,3).join('')) + '_' + session;
        
        if( ok_ticker[SESSION] == undefined ) await load_ok_ticker();
        if( trade_data[SESSION] == undefined ) await load_trade_data();
        if( new_order[SESSION] == undefined ) new_order[SESSION] = [];
        
        let ticker = await get_ticker();
        
        // save_ticker(ticker);
        
        
        trade_condition(ticker);
        
        make_order();
        
        // console.log(new Date(), SESSION, ticker);
	}catch(e){
        if( typeof e != 'string') console.log('checkPage.settrade' , e);
	}
    // Loop
	setTimeout( checkPage.settrade , 0 );
}

function my_minus(a, b){
    a = a.toFixed(2);
    b = b.toFixed(2);
    a = a.split('.');
    b = b.split('.');
    let c = ((a[0]*100) + (a[1]*1)) - ((b[0]*100) + (b[1]*1))
    return c/100;
}
const SPREAD = [
    [0,2,0.01],
    [2,5,0.02],
    [5,10,0.05],
    [10,25,0.1],
    [25,100,0.25],
    [100,200,0.5],
    [200,400,1],
]
function get_spread(p){
	let s = 0;
	SPREAD.forEach( j=>{
		if( p>=j[0] && p<j[1] ) s = j[2];
	});
	return s;
}
function make_order(){
	let _trade_d = {};
	let his_data = JSON.parse( JSON.stringify(ok_ticker[SESSION]) );
	his_data.reverse();
	his_data.map(j=>{
		if( j.symbol == undefined ) return;

		let symbol = j.symbol;
		let price = j.price;
        let spread = get_spread(price);
		if( _trade_d[symbol] == undefined ) _trade_d[symbol] = {count:0, 'price+1':Math.floor((price+spread)*100)/100, 'price-1':my_minus(price,spread)};
		_trade_d[symbol].count++;
        
        let local_trade_data = !trade_data[SESSION].map(j=>j.symbol).includes(symbol);
        
		if( _trade_d[symbol].count == 2 && (local_trade_data) ){
			if( price == _trade_d[symbol]['price+1'] ){ j.price_spread = '+1'; }else
			if ( price > _trade_d[symbol]['price+1'] ){ j.price_spread = '++'; }else
			if( price == _trade_d[symbol]['price-1'] ){ j.price_spread = '-1'; }else
			if ( price < _trade_d[symbol]['price-1'] ){ j.price_spread = '--'; }

			trade_data[SESSION].push(j);
            
            let volume = Math.floor((CASH/price)/100)*100;
            let check_final = volume > 0;
            check_final &= SET50.includes(symbol);
            check_final &= j.price_spread.includes('-');
            if( check_final ){
                console.log( symbol, 'BUY', volume, price, 'MP' );
                sendtelegram([symbol, 'BUY', volume, price, 'MP'].join('|'));
                new_order[SESSION].push( [symbol, 'BUY', volume, price, 'MP'].join('|') );
            }
		}
	});
	//console.log('trade_data', trade_data);
}

async function handle_order(){
    if( new_order[SESSION].length > 0 ){
        let this_order = new_order[SESSION].shift(0);
        let sp = this_order.split(/|/g);
        
        let done = false;
        let res = await send_order(sp[0], sp[1], sp[2], sp[3], sp[4]);
        if( res.orderNo != undefined ) done = true;
        
        if( done ){
            //
        }else{
            new_order[SESSION].push( this_order );
        }
    }
    setTimeout(handle_order, 0);
}
async function send_order(symbol, side, volume, price, market_type){
	if( volume == 0 ) return;
    let data = {
        "side": side,
        "symbol": symbol,
        "trusteeIdType": "LOCAL",
        "volume": volume,
        "price": price,
        "priceType": market_type,
        "validityType": "DAY",
        "bypassWarning": true,
        "pin": config.pin
    }
    let r = await page_evaluate(`(d) => {
        return new Promise((resolve, reject) => {
            fetch(d.url, {
                "headers": {
                    "accept": "application/json, text/plain, */*",
                    "accept-language": "en-GB,en;q=0.9,th-TH;q=0.8,th;q=0.7,en-US;q=0.6,pt;q=0.5",
                    "content-type": "application/json",
                    "sec-ch-ua": " Not A;Brand;v=99, Chromium;v=101, Google Chrome;v=101",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "Windows",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "terminal": "streaming"
                },
                "referrer": "https://wmb1.settrade.com/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": JSON.stringify(d.data),
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }).then( function(r){
                return r.json();
            }).then( function(res){
                resolve(res);
            }).catch( function(err){
                reject(err);
            });
        })
    }`, {data: data, username: config.username, url: config.settrade_url+config.username+"7/orders"});
    // r = { orderNo: 74741885 }
    return r;
}

const load_trade_data = async function(){
    try{
        trade_data[SESSION] = require(process.cwd()+'/trade_data'+SESSION+'.json');
    }catch(e){
        trade_data[SESSION] = [];
    }
}
const load_ok_ticker = async function(){
    console.log('load_ok_ticker', SESSION)
	return new Promise((resolve, reject) => {
		try{
			axios.get('https://jsonbase.com/ok_ticker_'+SESSION+'/ok_ticker_'+SESSION)
            .then( function(response){
                console.log(response.status);
                ok_ticker[SESSION] = response.data;
                console.log(ok_ticker[SESSION]);
                resolve(1);
            }).catch( function(err){
                console.log(err.response.status);
                if(err.response.status==404){
                    ok_ticker[SESSION] = [];
                    resolve(1);
                }
            })
		}catch(e){
            console.log(e);
			reject(e);
		}
	});
}



function trade_condition(scrape_data){
	let summary_data = {};
	summary_data = {
		count: 0,
		highest_volume: 0,
		price: 0,
		side: 0,
		sum_value: 0,
		sum_volume: 0,
		symbol: "",
	}
	// if( localStorage.summary_data != undefined ) summary_data = JSON.parse(localStorage.summary_data)

	for( let symbol in scrape_data ){
		for( let side in scrape_data[symbol] ){
			for( let price in scrape_data[symbol][side] ){
				summary_data = scrape_data[symbol][side][price];
				summary_data.price = price*1;
				summary_data.side = side;
				summary_data.symbol = symbol;
				summary_data.now = new Date().toLocaleTimeString();
				summary_data.unix = +new Date();
				check_condition(summary_data);
			}
		}
	}
}
function check_condition(summary){
	let _app_config = {};
    _app_config.condition = 'count > 10 && side=="B"';
    
	let side = summary.side;
	let count = summary.count;
	let volume = summary.sum_volume;
	let value = summary.sum_value; //.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	let price = summary.price;
	let symbol = summary.symbol;

	let _condition = _app_config.condition != '' ? eval( _app_config.condition ) : true;
	//console.log('_condition', _condition );

	if( _condition ){
		let _json = JSON.stringify(summary, '&nbsp', 2);
		let save_data = {time:+new Date(), symbol:symbol, price:price, value:value};
        
		let is_exist = ok_ticker[SESSION].map( function(j){
			if( j.symbol == undefined ) return false;

			return symbol == j.symbol && j.price == price;
			let ss = j.split('\t');
			return ss[0] == symbol && ss[1] == price;
			//return JSON.stringify(summary[look_key], '&nbsp', 2) == JSON.stringify(JSON.parse(j.split('\r\n')[1]).highest_by_count, '&nbsp', 2)
		}).includes(true);
		// is_exist = false;
		if( !is_exist ){
			ok_ticker[SESSION].unshift(save_data);
            let _key = 'ok_ticker_' + SESSION;
            console.log(new Date(), _key);
            save_jsonbase(_key, _key, ok_ticker[SESSION]);
		}
	}
}


/////////////// SETTRADE ///////////////
/////////////// SETTRADE ///////////////
/////////////// SETTRADE ///////////////



async function launchBrowser(){
	try{
		chromiumExecutablePath = await get_chrome();
		
		if( browser ) throw '';
		let w_ = 1280;
		let h_ = 580;
		browser = await puppeteer.launch({
			args: [
			'--window-size='+(w_+16)+','+(h_+89+44),
            // "--disable-infobars",
			'--incognito',
            // '--app=data:text/html,Hello World',
			],
            // ignoreDefaultArgs: ["--enable-automation"],
            defaultViewport: {
                width:w_,
                height:h_
            },
			headless: HEADLESS,
			executablePath: chromiumExecutablePath
		});
		
		[page] = await browser.pages();
        
        if( FIRST_WEB[web] == '' ){
            await login_sbito();
        }else{
            await page.goto(FIRST_WEB[web], {waitUntil: 'load', timeout: 0});
        }
		
		browser.on("targetcreated", async (target)=>{
			
		});

		browser.on('disconnected', async function(){
			gracefulShutdown();
		});
		
	}catch(e){
		console.log('launchBrowser', e);
	}
}






const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
	console.log('index');
	res.status(200).send('ok');
	res.end();
});
app.get('/restart', function(req, res) {
	restart_node();
	res.status(200).send('ok');
	res.end();
});
app.get('/data', async function(req, res) {
	console.log('data');
    let order = await get_order();
    let portfolio = await get_port();
	res.status(200).send(JSON.stringify({order:order, portfolio:portfolio}));
	res.end();
});
app.post('/signal', function(req, res) {
	let user_data = req.body;
	
	console.log( new Date(), user_data );
	
	res.status(200).send('ok');
	res.end();
});
app.listen(PORT);





let postdone = [];
let data_post = [];
let browser;
let page;
let chromiumExecutablePath;
let cookie_ct0 = '';
(async ()=>{
    await launchBrowser();
    
    checkPage[web]();
})();