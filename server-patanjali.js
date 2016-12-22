'use strict';
var http = require('http');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var rp = require('request-promise');
var port = 3000;
var app = express();
const server = new http.Server(app);

//database configuration
//-----------------------------------
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'medicine_database'
});
//-----------------------------------
connection.connect();
var insertProductQuery = `INSERT INTO product(	pr_name,
												pr_price_str,
												pr_price_int,
												pr_other_info,
												pr_category,
												pr_1mg_id
											 )
												values(?,?,?,?,?,?)`;

app.get('/scrape',function scrape(req,res){
	var options = {
		uri:'https://www.1mg.com/categories/patanjali-1',
		transform:function(body){
			return cheerio.load(body);
		}
	};
	var allPromises = [];
	var productList;
	var productArray = new Array();
	var productName,productPrice,productImagePath,otherInfo,product_1mg_id;
	rp(options)
		.then(function($){
			var apiUrl;
			for(let i=1;i<=6;i++){
				apiUrl = 'https://www.1mg.com/api/v3/getMoreOTC/1?pageNumber='+i+'&pageSize=20&_=1482329607613';
				allPromises.push(rp(apiUrl).then(function(htmlbody){
					$('.main-content > .content > .container-fluid:nth-child(2)').find('div.sku-list').append(htmlbody);
					productList = $('.main-content > .content > .container-fluid:nth-child(2)').find('div.sku-list').find('div.dia-sku');						
				}));
			}
			Promise.all(allPromises)
				.then(function(){
					productList.each(function(index,elm){
						productName =  $(this).find('.sku-container > .content-wrap > a > .sku-name').text();
						productPrice = $(this).find('.sku-container > .content-wrap > .sku-price > .sku-offer').text();
						otherInfo = $(this).find('.sku-container > .content-wrap > .sku-pack').text();
						product_1mg_id = $(this).find('.sku-container > .content-wrap > a').attr('href');
 						//productArray.push({productName:productName,productPrice:productPrice,otherInfo:otherInfo});
						connection.query({
							sql: insertProductQuery, 
							values : [productName,productPrice,0,otherInfo,'patanjali',product_1mg_id]
						},
						function(error,results,fields){
							console.log(error);
							console.log(results);
							console.log(fields);
						});
					});

				});
		})
		.catch(function(error){
			console.log(error);
		});
});

server.listen(port,function(req,res){
	console.log(`Server started to listen at ${port}`);
});





//write into file
/*fs.writeFile('output.txt',JSON.stringify(productArray),function(err){
	if(err) throw err;
	console.log('File has been created and saved');
});*/