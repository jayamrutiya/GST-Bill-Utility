var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var path = require('path');
var fs = require('fs');
var pdfkit = require('pdfkit');
var blobStream  = require('blob-stream');

//connecte to database
var connection = mysql.createConnection({
  host : 'localhost',
  user : 'root',
  password : '',
  database : 'GST'
});
connection.connect(function(err){
  if(!err){
    console.log('Database Connected');
  }else{
    console.log('Error to connecte database');
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  connection.query("SELECT * FROM companyinformation",function(err,result){
    if(err){throw err;}else{
      res.render('index', { title: 'GST Bill Utility', companyinfo:result});
    }
  })
});


router.get('/home', function(req, res, next){
  if(req.session.companysess){
    connection.query("SELECT companyname FROM companyinformation WHERE companyid = ?",req.session.companysess,function(err,result){
      if(err) throw err;
      res.render('home', { title: 'GST Bill Utility', companyinfo:result[0].companyname});
    })
    //console.log(result)
  }else{
    res.redirect('/')
  }
});

router.get('/sendid/:id', function(req, res){
  //console.log(req.params.id);
  //console.log(company)
  req.session.companysess = req.params.id;
  res.redirect('/home');
});

//GET customer
router.get('/customer', function(req, res, next) {
  //console.log(path.join(__filename))
  if(req.session.companysess){
    var company = req.session.companysess;
    //console.log(result)
    connection.query('SELECT * FROM customerinformation WHERE companyid = ?',company,function(err,customer){
      if(err) throw err;
      //console.log(customer.reverse())
      res.render('customer', {title:'GST Bill Utility', customerinfo:customer.reverse(), duplicatecustomername:'', duplicatecustomergstinno:''});
    })
  }else{
    res.redirect('/')
  }
});

//customer ADD
router.post('/customeradd', function(req, res, next) {
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query('SELECT * FROM customerinformation WHERE companyid = ?',company,function(err,result){
      if(err) throw err;
      if(result.length == 0){
        var customerid = 'c'+Math.floor(Math.random()*(999999999-100+1)+100);
        const customerdata = {
          companyid: company,
          customerid: customerid,
          customername: req.body.customername,
          contactpersonname: req.body.contactpersonname,
          customeraddress: req.body.customeraddress,
          customerphonenumber: req.body.customerphonenumber,
          customeremailid: req.body.customeremailid,
          customerpincode: req.body.customerpincode,
          customerstate: req.body.customerstate,
          customerstatecode: req.body.customerstatecode,
          customergstinno: req.body.customergstinno
        }
        connection.query("INSERT INTO customerinformation set ?",customerdata,function(err,result){
          if(err) {throw err;}else{
          res.redirect('/customer');}
        })
      }else{
        const matchid = [];
      const matchcustomername = [];
      const matchcontactpersonname = [];
      const matchcustomergstinno =[];
      //console.log(result.length)
      for(i=0;i<result.length;i++){
        matchid.push(result[i].customerid)
        matchcustomername.push(result[i].customername)
        matchcontactpersonname.push(result[i].contactpersonname)
        matchcustomergstinno.push(result[i].customergstinno)
      }
      //console.log(matchid)
      do{
        var customerid = 'c'+Math.floor(Math.random()*(999999999-100+1)+100);
      }while(matchid.includes(customerid))
      //console.log(matchid.includes(customerid))
      //console.log(customerid)
      const customerdata = {
        companyid: company,
        customerid: customerid,
        customername: req.body.customername,
        contactpersonname: req.body.contactpersonname,
        customeraddress: req.body.customeraddress,
        customerphonenumber: req.body.customerphonenumber,
        customeremailid: req.body.customeremailid,
        customerpincode: req.body.customerpincode,
        customerstate: req.body.customerstate,
        customerstatecode: req.body.customerstatecode,
        customergstinno: req.body.customergstinno
      }
      connection.query("SELECT companyid,customername,contactpersonname FROM customerinformation WHERE companyid = ? AND customername = ? AND contactpersonname = ?",[company,customerdata.customername,customerdata.contactpersonname],function(err,duplicatedata){
        connection.query("SELECT customergstinno FROM customerinformation WHERE customergstinno = ? AND companyid = ?",[customerdata.customergstinno,company],function(err,duplicategstin){
        if(duplicatedata.length > 0){
          res.render('customer', {title:'GST Bill Utility', customerinfo:result.reverse(), duplicatecustomername:'!!In this Company Customername and Contact Person Name Both are alredy EXIST!!', duplicatecustomergstinno:''});
        }else if(duplicategstin.length > 0){
          res.render('customer', {title:'GST Bill Utility', customerinfo:result.reverse(), duplicatecustomername:'', duplicatecustomergstinno:'!!Customer GSTIN alredy EXIST!!'});
        } else{
          connection.query("INSERT INTO customerinformation set ?",customerdata,function(err,result){
            if(err) {throw err;}else{
            res.redirect('/customer');}
          })
        }
      })
      })
      }
    })
  }else{
    res.redirect('/');
  }
});

//serch for code
router.post('/serchforstate/:id',function(req, res){
  connection.query("SELECT * FROM stateandcode WHERE statecode = ?",[req.params.id],function(err,result){
    if(err) throw err;
    console.log(result);
    res.send(result);
  })
});

//customer EDIT
router.post('/customeredit', function(req, res, next){
  //console.log(req.body.customerid)
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT * FROM customerinformation WHERE companyid = ?",company,function(err,result){
      if(err) throw err;
      connection.query("SELECT customerid FROM customerinformation WHERE companyid = ? AND customername = ? AND contactpersonname = ?",[company,req.body.customername,req.body.contactpersonname],function(err,response){
        if(err){throw err;}else{
          if(response.length > 0){
            res.render('customer', {title:'GST Bill Utility', customerinfo:result.reverse(), duplicatecustomername:'!!In this company Customername and Contact Person Name Both are alredy EXIST!!', duplicatecustomergstinno:''});
          }else{
            connection.query("UPDATE customerinformation SET customerid = ?, customername = ?, contactpersonname = ?, customeraddress = ?, customerphonenumber = ?, customeremailid = ?, customerpincode = ?, customerstate = ?, customerstatecode = ?, customergstinno = ? WHERE companyid = ? AND customerid = ?",
            [req.body.customerid,req.body.customername,req.body.contactpersonname,req.body.customeraddress,req.body.customerphonenumber,req.body.customeremailid,req.body.customerpincode,req.body.customerstate,req.body.customerstatecode,req.body.customergstinno,company,req.body.customerid],
            function(err,result){
              if(err){throw err;}else{res.redirect('/customer');}
            })
          }
        }
      })
    })
  }else{
    res.redirect('/');
  }
});

//customer DELETE
router.post('/customerdelete', function(req, res, next){
  //console.log(req.body.customerid);
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("DELETE FROM customerinformation WHERE companyid = ? AND customerid = ?",[company,req.body.customerid],function(err,result){
      if(err){throw err;}else{res.redirect('/customer');}
    })
  }else{
    res.redirect('/')
  }
});

//GET product
router.get('/product', function(req, res, next) {
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT * FROM products WHERE companyid = ?",company,function(err,product){
      res.render('product', {title:'GST Bill Utility', productinfo:product.reverse(), duplicateproductname:''});
    })
  }else{
    res.redirect('/')
  }
});

//product ADD
router.post('/productadd', function(req, res, next){
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT * FROM products WHERE companyid = ?",company,function(err,result){
      if(err) throw err;
      if(result.length == 0){
        var productid = 'p'+Math.floor(Math.random()*(999999999-100+1)+100);
        const productdata = {
          companyid: company,
          productid: productid,
          productname: req.body.productname,
          productsize: req.body.productsize,
          producthsn: req.body.producthsn,
          productuom: req.body.productuom,
          producttax: req.body.producttax,
          productrate: req.body.productrate
        }
        connection.query("INSERT INTO products SET ?",productdata,function(err,result){
          if(err){throw err;}else{res.redirect('/product');}
        })
      }else{
        const matchid = [];
        const matchproductname = [];
        const matchproductsize = [];
        //console.log(result.length)
        for(i=0;i<result.length;i++){
          matchid.push(result[i].productid)
          matchproductname.push(result[i].productname)
          matchproductsize.push(result[i].productsize)
        }
        //console.log(matchid)
        do{
          var productid = 'p'+Math.floor(Math.random()*(999999999-100+1)+100);
        }while(matchid.includes(productid))
        //console.log(matchid.includes(customerid))
        //console.log(customerid)
        const productdata = {
          companyid: company,
          productid: productid,
          productname: req.body.productname,
          productsize: req.body.productsize,
          producthsn: req.body.producthsn,
          productuom: req.body.productuom,
          producttax: req.body.producttax,
          productrate: req.body.productrate
        }
        connection.query("SELECT productname,productsize FROM products WHERE companyid = ? AND productname = ? AND productsize = ?",[company,productdata.productname,productdata.productsize],function(err,response){
        if(response.length > 0){
          res.render('product', {title:'GST Bill Utility', productinfo:result.reverse(), duplicateproductname:'!!In this company Productname and Product Size Both are alredy EXIST!!', duplicatecustomergstinno:''});
        }else{
          connection.query("INSERT INTO products set ?",productdata,function(err,result){
            if(err) {throw err;}else{
            res.redirect('/product');}
          })
        }
      })
      }
    })
  }else{
    res.redirect('/');
  }
});

//product EDIT
router.post('/productedit', function(req, res, next){
  //console.log(req.body.customerid)
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT * FROM products where companyid = ?",company,function(err,result){
      if(err) throw err;
      connection.query("SELECT productid FROM products WHERE companyid = ? AND productname = ? AND productsize = ?",[company,req.body.productname,req.body.productsize],function(err,response){
        if(err){throw err;}else{
          if(response.length >= 2){
            res.render('product', {title:'GST Bill Utility', productinfo:result.reverse(), duplicateproductname:'!!In this company Productname and Product Size Both are alredy EXIST!!'});
          }else{
            connection.query("UPDATE products SET productid = ?, productname = ?, productsize = ?, producthsn = ?, productuom = ?, producttax = ?, productrate = ? WHERE companyid = ? AND productid = ?",
            [req.body.productid,req.body.productname,req.body.productsize,req.body.producthsn,req.body.productuom,req.body.producttax,req.body.productrate,company,req.body.productid],
            function(err,result){
              if(err){throw err;}else{res.redirect('/product');}
            })
          }
        }
      })
    })
  }else{
    res.redirect('/')
  }
});

//product DELETE
router.post('/productdelete', function(req, res, next){
  //console.log(req.body.productid);
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("DELETE FROM products WHERE companyid = ? AND productid = ?",[company,req.body.productid],function(err,result){
      if(err){throw err;}else{res.redirect('/product');}
    })
  }else{
    res.redirect('/');
  }
});

//GET uom
router.get('/uom', function(req, res, next) {
  res.render('uom');
});

//GET invoice
router.get('/allinvoice', function(req, res, next){
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT * FROM companyinformation WHERE companyid = ?",company,function(err,result){
      if(err){throw err;}else{
        connection.query("SELECT MAX(invoiceno) AS no FROM invoicedetail WHERE companyid = ?",company,function(err,inno){
          if(err){throw err;}else{
            connection.query("SELECT customerid,customername FROM customerinformation WHERE companyid = ?",company,function(err,cname){
            connection.query("SELECT * FROM products WHERE companyid = ?",company,function(err,proinfo){
            connection.query("SELECT invoicedetail.invoicedetailid, invoicedetail.companyid, invoicedetail.invoiceno, invoicedetail.invoicedate, invoicedetail.customerid, invoicedetail.customername, invoicetotal.invoicetotalid, invoicetotal.invoicetotalamount FROM invoicetotal INNER JOIN invoicedetail ON invoicedetail.companyid = invoicetotal.companyid AND invoicedetail.invoicedetailid = invoicetotal.invoicedetailid WHERE invoicedetail.companyid = ? AND invoicetotal.companyid = ? ORDER BY invoiceno",[company,company],function(err,invoicedata){
            //connection.query("SELECT * FROM invoicetotal WHERE companyid = ?",[company],function(err,invoicetotaldata){
              //console.log(inno[0].no)
              //console.log(invoicedata)
              //console.log(invoicetotaldata)
            if(inno[0].no == null){
              res.render('allinvoice', {title: 'GST Bill Utility', companyinfo:result, invoiceno:1, customerinfo:cname, productinfo:proinfo, invoiceinfo:invoicedata})
            }else{
              var innumber = parseInt(inno[0].no) + parseInt(1);
              res.render('allinvoice', {title: 'GST Bill Utility', companyinfo:result, invoiceno:innumber, customerinfo:cname, productinfo:proinfo, invoiceinfo:invoicedata})
            }
          //})
          })
          })
          })
          }
        })
      }
    })
  }else{
    res.redirect('/');
  }
});


// search for customerdata in Invoice
router.post('/serchfordata/:id', function(req, res){
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT * FROM customerinformation WHERE companyid = ? AND customerid = ?",[company,req.params.id],function(err,cpn){
      if(err){throw err;}else{
        res.send(cpn)
      }
    })
  }else{
    res.redirect('/');
  }
});

// search for productdata in invoice
router.post('/serchforproductdata/:id', function(req, res){
  //console.log(req.params.id)
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT * FROM products WHERE companyid = ? AND productid = ?",[company,req.params.id],function(err,prodata){
      if(err){throw err;}else{
        res.send(prodata)
      }
    })
  }else{
    res.redirect('/')
  }
});


// POST Invoice
router.post('/allinvoice', function(req, res){
  if(req.session.companysess){
    var company = req.session.companysess;
    const invoicepdf = {
      companyinfo: {
        name: req.body.companyname,
        address: req.body.companyaddress,
        mobileno: req.body.companymobileno,
        emailid: req.body.companyemailid,
        gstin: req.body.companygstinno
      },
      generalinfo: {
        no: req.body.invoiceno,
        date: req.body.invoicedate
      },
      customerinfo: {
        name: req.body.customername,
        address: req.body.customeraddress,
        mobileno: req.body.customerphonenumber,
        emailid: req.body.customeremailid,
        state: req.body.customerstate +'-'+ req.body.customerstatecode,
        pincode: req.body.customerpincode,
        gstin: req.body.customergstinno
      },
      iteams: {
        name: req.body.productname,
        hsncode: req.body.producthsn,
        rate: req.body.productrate,
        qty: req.body.productqty,
        discount: req.body.productdiscount,
        actualamount: req.body.productactualamount,
        tax: req.body.producttax,
        taxamount: req.body.producttaxamount,
        netamount: req.body.productnetamount,
        totalamount: req.body.invoicetotalamount
      }
    };
  console.log(invoicepdf)

  function createInvoice(invoicepdf, patha) {
    let doc = new pdfkit({ margin: 15 });
    generateVr(10, doc)
    generateHr(doc, 15)
    generateHr(doc, 780)
    generateVr(600, doc)
    generateHeader(doc);
    generateCustomerInformation(doc, invoicepdf);
    generateInvoice(doc, invoicepdf);
    generateFooter(doc, "Grand Total", invoicepdf.iteams.totalamount);
  
    //doc.write(path.resolve(".")+'/PDF/'+patha);
    doc.end();
    doc.pipe(fs.createWriteStream(company+'/'+patha));
  }

  function generateHeader(doc) {
    doc
      .image("./logo.jpg", 15, 20, { width: 150 })
      .fillColor("#444444")
      // .fontSize(20)
      // .text(invoicepdf.companyinfo.name, 200, 57)
      .font("Times-Bold")
      .fontSize(10)
      .text(invoicepdf.companyinfo.name, 200, 25, { align: "right" })
      .font("Times-Roman")
      .text(invoicepdf.companyinfo.address, 200, 40, { align: "right", lineGap: 1.5 })
      .text(invoicepdf.companyinfo.mobileno +', '+invoicepdf.companyinfo.emailid, 200, 65, { align: "right" })
      .text(invoicepdf.companyinfo.gstin, 200, 80, { align: "right" })
      .moveDown();
  }

  function generateCustomerInformation(doc, invoicepdf){
    generateHr(doc, 105)
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Customer Information", 15, 110)
      .font("Times-Roman")
      
      .text("Name", 25, 130)
      .text(": "+invoicepdf.customerinfo.name, 100, 130)

      .text("Address", 25, 145)
      .text(": "+invoicepdf.customerinfo.address, 100, 145)

      .text("Ph", 25, 160)
      .text(": "+invoicepdf.customerinfo.mobileno, 100, 160)

      .text("Email", 25, 175)
      .text(": "+invoicepdf.customerinfo.emailid, 100, 175)

      .text("Pincode", 25, 190)
      .text(": "+invoicepdf.customerinfo.pincode, 100, 190)

      .text("State", 25, 205)
      .text(": "+invoicepdf.customerinfo.state, 100, 205)

      .text("GSTIN", 25, 220)
      .text(": "+invoicepdf.customerinfo.gstin, 100, 220)

      .font("Helvetica-Bold")
      .text("General Details", 350, 110)
      .font("Times-Roman")

      .text("Invoice No", 360, 130)
      .text(": "+invoicepdf.generalinfo.no, 435, 130)

      .text("Date", 360, 145)
      .text(": "+invoicepdf.generalinfo.date, 435, 145)

      .moveDown();
  }

  function generateInvoice(doc, invoicepdf){
      generateHr(doc, 235)
      doc.font("Times-Bold")
      generateInvoiceTable(doc, "Sr", "No.", "Products", "HSN", "Code", "Rate", "Qty.", "Discount", "Actual", "Amount", "Tax & Amount", "Tax", "Amount", "Net Amount", "Grand Total");
      generateHr(doc, 270)
      let i;
      const a = 270;
      doc.fontSize(8)
      doc.font("Times-Roman")
      for(i=0; i<req.body.totalproduct; i++){
        const position = a + (i+1) * 10;
        if(req.body.totalproduct > 1){
          generateProductList(doc, position, i+1, invoicepdf.iteams.name[i], invoicepdf.iteams.hsncode[i], invoicepdf.iteams.rate[i], invoicepdf.iteams.qty[i], invoicepdf.iteams.discount[i], invoicepdf.iteams.actualamount[i], invoicepdf.iteams.tax[i], invoicepdf.iteams.taxamount[i], invoicepdf.iteams.netamount[i])
        }
        if(req.body.totalproduct == 1){
          generateProductList(doc, position, i+1, invoicepdf.iteams.name, invoicepdf.iteams.hsncode, invoicepdf.iteams.rate, invoicepdf.iteams.qty, invoicepdf.iteams.discount, invoicepdf.iteams.actualamount, invoicepdf.iteams.tax, invoicepdf.iteams.taxamount, invoicepdf.iteams.netamount)
        }
      }
      
  }
  
  function generateFooter(doc, grandtotal, totalamount) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(10, 760)
      .lineTo(600, 760)
      .stroke()
      .font("Times-Bold")
      .fontSize(10)
      .text(grandtotal, 445, 765)
      .text(totalamount, 525, 765)
  }

  function generateInvoiceTable(doc, sr, no, products, hsn, code, rate, qty, discount, actual, aamount, taxamount, tax, amount, netamount){
    doc
      .fontSize(10)
      .text(sr, 15, 240)
      .text(no, 15, 255)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(30, 235)
      .lineTo(30, 760)
      .stroke()
      .text(products, 105, 240)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(250, 235)
      .lineTo(250, 760)
      .stroke()
      .text(hsn, 255, 240)
      .text(code, 255, 255)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(280, 235)
      .lineTo(280, 760)
      .stroke()
      .text(rate, 285, 240)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(315, 235)
      .lineTo(315, 760)
      .stroke()
      .text(qty, 320, 240)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(350, 105)
      .lineTo(350, 760)
      .stroke()
      .text(discount, 355, 240)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(395, 235)
      .lineTo(395, 760)
      .stroke()
      .text(actual, 400, 240)
      .text(aamount, 400, 255)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(440, 235)
      .lineTo(440, 760)
      .stroke()
      .text(taxamount, 450, 240)
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(520, 235)
      .lineTo(520, 780)
      .stroke()

      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(440, 250)
      .lineTo(520, 250)
      .stroke()

      .text(tax, 445, 255)

      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(480, 250)
      .lineTo(480, 760)
      .stroke()

      .text(amount, 483.5, 255)
      .text(netamount, 525, 240)
  }

  function generateProductList(doc, y, srno, products, hsncode, rate, qty, discount, actualamount, tax, amount, netamount){
    doc
      .text(srno, 15, y)
      .text(products, 35, y)
      .text(hsncode, 255, y)
      .text(rate, 285, y)
      .text(qty, 320, y)
      .text(discount+"%", 355, y)
      .text(actualamount, 400, y)
      .text(tax+"%", 445, y)
      .text(amount, 483.5, y)
      .text(netamount, 525, y)
  }

  function generateHr(doc, y) {
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(10, y)
      .lineTo(600, y)
      .stroke();
  }

  function generateVr(x, doc){
    doc 
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(x, 15)
      .lineTo(x, 780)
      .stroke();
  }

  createInvoice(invoicepdf, invoicepdf.generalinfo.date+" "+invoicepdf.customerinfo.name+".pdf");

  //res.redirect('/')
  connection.query("SELECT * FROM invoicedetail",function(err,idid){
    if(err) throw err;
    const matchidid = []
    for(let k = 0; k < idid.length; k++){
      matchidid.push(idid[k].invoicedetailid)
    }
    do{
      var invoicedetailid = 'id'+Math.floor(Math.random()*(999999999-100+1)+100);
    }while(matchidid.includes(invoicedetailid))
    // connection.query("SELECT customername FROM customerinformation WHERE customerid = ? AND companyid = ?",[req.body.customerid,company],function(err,cusname){
    //   if(err) throw err;
    
    const invoicedetaildata = {
      invoicedetailid: invoicedetailid,
      companyid: company,
      invoiceno: req.body.invoiceno,
      invoicedate: req.body.invoicedate,
      customerid: req.body.customerid,
      customername: req.body.customername,
      totalproduct: req.body.totalproduct
    }
    connection.query("INSERT INTO invoicedetail SET ?",[invoicedetaildata],function(err,idresult){
      if(err) throw err;
    })
 // })

  var end = req.body.totalproduct;
  //console.log(req.body.productname[0])
  if(end > 1){
  for (let i = 0; i < end; i++) {
    connection.query("SELECT * FROM invoiceiteam",function(err,id){
      if(err) throw err;
      //console.log(id)
      const matchid = []
      for(let j = 0; j < id.length; j++){
        matchid.push(id[j].invoiceiteamid)
      }
      //console.log(matchid)
      do{
        var invoiceiteamid = 'ii'+Math.floor(Math.random()*(999999999-100+1)+100);
      }while(matchid.includes(invoiceiteamid))
      // connection.query("SELECT * FROM products WHERE companyid = ? AND productid = ?",[company,req.body.productid[i]],function(err,productdata){
      //   if(err) throw err;
      //   var pro = '';
      //   for(let q = 0; q < productdata.length; q++){
      //     pro = productdata[q].productsize+''+productdata[q].productuom + ' ' + productdata[q].productname;
      //   }
    const invoiceiteamdata = {
      invoiceiteamid: invoiceiteamid,
      invoicedetailid: invoicedetailid,
      companyid: company,
      productid: req.body.productid[i],
      productname: req.body.productname[i],
      producthsn: req.body.producthsn[i],
      productrate: req.body.productrate[i],
      productqty: req.body.productqty[i],
      productdiscount: req.body.productdiscount[i],
      productactualamount: req.body.productactualamount[i],
      producttax: req.body.producttax[i],
      producttaxamount: req.body.producttaxamount[i],
      productnetamount: req.body.productnetamount[i]
    }
    //console.log(invoiceiteamdata)
    connection.query("INSERT INTO invoiceiteam SET ?",[invoiceiteamdata],function(err,iiresult){
      if(err) throw err;
    })
  //})
  })
  }
  }if(end == 1){
    connection.query("SELECT * FROM invoiceiteam",function(err,id){
      if(err) throw err;
      //console.log(id)
      const matchid = []
      for(let j = 0; j < id.length; j++){
        matchid.push(id[j].invoiceiteamid)
      }
      //console.log(matchid)
      do{
        var invoiceiteamid = 'ii'+Math.floor(Math.random()*(999999999-100+1)+100);
      }while(matchid.includes(invoiceiteamid))
      // connection.query("SELECT * FROM products WHERE companyid = ? AND productid = ?",[company,req.body.productid],function(err,productdata){
      //   if(err) throw err;
      //   var pro = '';
      //   for(let q = 0; q < productdata.length; q++){
      //     pro = productdata[q].productsize+''+productdata[q].productuom + ' ' + productdata[q].productname;
      //   }
    const invoiceiteamdata = {
      invoiceiteamid: invoiceiteamid,
      invoicedetailid: invoicedetailid,
      companyid: company,
      productid: req.body.productid,
      productname: req.body.productname,
      producthsn: req.body.producthsn,
      productrate: req.body.productrate,
      productqty: req.body.productqty,
      productdiscount: req.body.productdiscount,
      productactualamount: req.body.productactualamount,
      producttax: req.body.producttax,
      producttaxamount: req.body.producttaxamount,
      productnetamount: req.body.productnetamount
    }
    //console.log(invoiceiteamdata)
    connection.query("INSERT INTO invoiceiteam SET ?",[invoiceiteamdata],function(err,iiresult){
      if(err) throw err;
    })
  //})
  })
  }

  connection.query("SELECT * FROM invoicetotal",function(err,itid){
    if(err) throw err;
    const matchitid = []
    for(let p = 0; p < itid.length; p++){
      matchitid.push(itid[p].invoicetotalid)
    }
    do{
      var invoicetotalid = 'it'+Math.floor(Math.random()*(999999999-100+1)+100);
    }while(matchitid.includes(invoicetotalid))
    const invoicetotaldata = {
      invoicetotalid: invoicetotalid,
      invoicedetailid: invoicedetailid,
      companyid: company,
      invoicetotalamount: req.body.invoicetotalamount
    }
    connection.query("INSERT INTO invoicetotal SET ?",[invoicetotaldata],function(err,itresult){
      if(err) throw err;
    })
  })
  res.redirect('allinvoice')
  })
}
});



//GET editinvoice
router.get('/editinvoice', function(req, res, next){
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT * FROM companyinformation WHERE companyid = ?",company,function(err,companyinfo){
      if(err) throw err;
      res.render('editinvoice', {title: 'GST Bill Utility', companyinfo:companyinfo});
    })
  }else{
    res.redirect('/')
  }
});

// for edit data
router.post('/editinvoice', function(req, res){
  if(req.session.companysess){
    var company = req.session.companysess;
    //console.log(req.body.hdinvoicedetailid)
    //console.log(req.body.hdcustomerid)
    connection.query("SELECT * FROM companyinformation WHERE companyid = ?",[company],function(err,cominfo){
      if(err) throw err;
      connection.query("SELECT * FROM customerinformation WHERE companyid = ?",[company],function(err,custinfo){
        if(err) throw err;
        connection.query("SELECT * FROM products WHERE companyid = ?",[company],function(err,proinfo){
          if(err) throw err;
      connection.query("SELECT invoicedetail.invoicedetailid, invoicedetail.companyid, invoicedetail.invoiceno, invoicedetail.invoicedate, invoicedetail.customerid, customerinformation.customername, customerinformation.contactpersonname, customerinformation.customeraddress, customerinformation.customerphonenumber, customerinformation.customeremailid, customerinformation.customerpincode, customerinformation.customerstate, customerinformation.customerstatecode, customerinformation.customergstinno, invoiceiteam.invoiceiteamid, invoiceiteam.productid, invoiceiteam.productname, invoiceiteam.producthsn, invoiceiteam.productrate, invoiceiteam.productqty, invoiceiteam.productdiscount, invoiceiteam.productactualamount, invoiceiteam.producttax, invoiceiteam.producttaxamount, invoiceiteam.productnetamount, invoicetotal.invoicetotalid, invoicetotal.invoicetotalamount FROM (((invoicedetail INNER JOIN invoiceiteam ON invoicedetail.invoicedetailid = invoiceiteam.invoicedetailid) INNER JOIN invoicetotal ON invoicedetail.invoicedetailid = invoicetotal.invoicedetailid) INNER JOIN customerinformation ON invoicedetail.customerid = customerinformation.customerid) WHERE invoicedetail.invoicedetailid = ? AND invoicedetail.companyid = ?",[req.body.hdinvoicedetailid,company],function(err,billinfo){
        if(err) throw err;
        res.render('editinvoice', {title:'GST Bill Utility', invoiceinfo:billinfo, companyinfo:cominfo, customerinfo:custinfo, productinfo:proinfo})
      })
    })
  })
  })
  }else{
    res.redirect('/')
  }
});

//POST addinvoice
router.post('/invoiceedit', function(req, res){
  //console.log(req.body);
  if(req.session.companysess){
    var company = req.session.companysess;
    connection.query("SELECT totalproduct FROM invoicedetail WHERE companyid = ? AND invoicedetailid = ?",[company,req.body.invoicedetailid],function(err,totalpro){
      if(err) throw err;
      if(req.body.totalproduct == totalpro[0].totalproduct){
        const invoicedetaildata = {
          invoiceno: req.body.invoiceno,
          invoicedate: req.body.invoicedate,
          customerid: req.body.customerid,
          customername: req.body.customername
        }
        connection.query("UPDATE invoicedetail SET ? WHERE invoicedetailid = ? AND companyid = ?",[invoicedetaildata,req.body.invoicedetailid,company],function(err,response){
          if(err) throw err;
        })
        if(req.body.totalproduct > 1){
          for(let i=0; i<req.body.totalproduct; i++){
            const invoiceiteamdata = {
              productid: req.body.productid[i],
              productname: req.body.productname[i],
              producthsn: req.body.producthsn[i],
              productrate: req.body.productrate[i],
              productqty: req.body.productqty[i],
              productdiscount: req.body.productdiscount[i],
              productactualamount: req.body.productactualamount[i],
              producttax: req.body.producttax[i],
              producttaxamount: req.body.producttaxamount[i],
              productnetamount: req.body.productnetamount[i]
            }
            connection.query("UPDATE invoiceiteam SET ? WHERE invoiceiteamid = ? AND invoicedetailid = ? AND companyid = ?",[invoiceiteamdata,req.body.invoiceiteamid[i],req.body.invoicedetailid,company],function(err,response){
              if(err) throw err;
              //res.redirect('/allinvoice')
            })
          }
        }else{
          const invoiceiteamdata = {
            productid: req.body.productid,
            productname: req.body.productname,
            producthsn: req.body.producthsn,
            productrate: req.body.productrate,
            productqty: req.body.productqty,
            productdiscount: req.body.productdiscount,
            productactualamount: req.body.productactualamount,
            producttax: req.body.producttax,
            producttaxamount: req.body.producttaxamount,
            productnetamount: req.body.productnetamount
          }
          connection.query("UPDATE invoiceiteam SET ? WHERE invoiceiteamid = ? AND invoicedetailid = ? AND companyid = ?",[invoiceiteamdata,req.body.invoiceiteamid,req.body.invoicedetailid,company],function(err,response){
            if(err) throw err;
            //res.redirect('/allinvoice')
          })
        }
        const invoicetotaldata = {
          invoicetotalamount: req.body.invoicetotalamount
        }
        connection.query("UPDATE invoicetotal SET ? WHERE invoicetotalid = ? AND invoicedetailid = ? AND companyid = ?",[invoicetotaldata,req.body.invoicetotalid,req.body.invoicedetailid,company],function(err,response){
          if(err) throw err;
          //res.redirect('/allinvoice')
        })
      }
      if(req.body.totalproduct < totalpro[0].totalproduct){
        const invoicedetaildata = {
          invoiceno: req.body.invoiceno,
          invoicedate: req.body.invoicedate,
          customerid: req.body.customerid,
          customername: req.body.customername,
          totalproduct: req.body.totalproduct
        }
        connection.query("UPDATE invoicedetail SET ? WHERE invoicedetailid = ? AND companyid = ?",[invoicedetaildata,req.body.invoicedetailid,company],function(err,response){
          if(err) throw err;
        })
        //if(req.body.totalproduct >= 1){
          connection.query("SELECT invoiceiteamid FROM invoiceiteam WHERE invoicedetailid = ? AND companyid = ?",[req.body.invoicedetailid,company],function(err,iteamid){
            if(err) throw err;
            //const productid = req.body.productid;
            //console.log(iteamid)
            const removeiteamid = []
            //  console.log(iteamid[0].invoiceiteamid)
            for(let j=0; j<iteamid.length; j++){
              if(!req.body.invoiceiteamid.includes(iteamid[j].invoiceiteamid)){
                //console.log(iteamid[j].invoiceiteamid)
                removeiteamid.push(iteamid[j].invoiceiteamid);
                //console.log(iteamid[j].invoiceiteamid)
              }
            }
            console.log(removeiteamid)
            for(let k=0; k<removeiteamid.length; k++){
            connection.query("DELETE FROM invoiceiteam WHERE invoiceiteamid = ? AND invoicedetailid = ? AND companyid = ?",[removeiteamid[k],req.body.invoicedetailid,company],function(err,respo){
              if(err) throw err;
            })
            }
            })
            for(let i=0; i<req.body.totalproduct; i++){
              const invoiceiteamdata = {
                productid: req.body.productid[i],
                productname: req.body.productname[i],
                producthsn: req.body.producthsn[i],
                productrate: req.body.productrate[i],
                productqty: req.body.productqty[i],
                productdiscount: req.body.productdiscount[i],
                productactualamount: req.body.productactualamount[i],
                producttax: req.body.producttax[i],
                producttaxamount: req.body.producttaxamount[i],
                productnetamount: req.body.productnetamount[i]
              }
              connection.query("UPDATE invoiceiteam SET ? WHERE invoiceiteamid = ? AND invoicedetailid = ? AND companyid = ?",[invoiceiteamdata,req.body.invoiceiteamid[i],req.body.invoicedetailid,company],function(err,response){
                if(err) throw err;
                //res.redirect('/allinvoice')
              })
            }
            //res.redirect('/allinvoice')
            const invoicetotaldata = {
              invoicetotalamount: req.body.invoicetotalamount
            }
            connection.query("UPDATE invoicetotal SET ? WHERE invoicetotalid = ? AND invoicedetailid = ? AND companyid = ?",[invoicetotaldata,req.body.invoicetotalid,req.body.invoicedetailid,company],function(err,response){
              if(err) throw err;
              //res.redirect('/allinvoice')
            })
        //}
      }
      if(req.body.totalproduct > totalpro[0].totalproduct){
        const invoicedetaildata = {
          invoiceno: req.body.invoiceno,
          invoicedate: req.body.invoicedate,
          customerid: req.body.customerid,
          customername: req.body.customername,
          totalproduct: req.body.totalproduct
        }
        connection.query("UPDATE invoicedetail SET ? WHERE invoicedetailid = ? AND companyid = ?",[invoicedetaildata,req.body.invoicedetailid,company],function(err,response){
          if(err) throw err;
        })
        connection.query("SELECT invoiceiteamid FROM invoiceiteam WHERE invoicedetailid = ? AND companyid = ?",[req.body.invoicedetailid,company],function(err,iteamid){
          if(err) throw err;
          const productid = req.body.productid;
          console.log(iteamid)
          const additeamid = []
          const additeamidindex = []
          const initeamid = []
          for(let c=0; c<iteamid.length; c++){
            initeamid.push(iteamid[c].invoiceiteamid)
          }
          console.log(req.body.invoiceiteamid)
          for(let j=0; j<productid.length; j++){
            if(!initeamid.includes(req.body.invoiceiteamid[j])){
              //console.log(iteamid[j].invoiceiteamid)
              additeamid.push(req.body.invoiceiteamid[j]);
              additeamidindex.push(j);
              //console.log(iteamid[j].invoiceiteamid)
            }
          }
          // console.log(additeamid);
          // console.log(additeamidindex);
          for(let i=additeamidindex[0]; i<req.body.totalproduct; i++){
            const invoiceiteamdata = {
              invoiceiteamid: req.body.invoiceiteamid[i],
              invoicedetailid: req.body.invoicedetailid,
              companyid: company,
              productid: req.body.productid[i],
              productname: req.body.productname[i],
              producthsn: req.body.producthsn[i],
              productrate: req.body.productrate[i],
              productqty: req.body.productqty[i],
              productdiscount: req.body.productdiscount[i],
              productactualamount: req.body.productactualamount[i],
              producttax: req.body.producttax[i],
              producttaxamount: req.body.producttaxamount[i],
              productnetamount: req.body.productnetamount[i]
            }
            connection.query("INSERT INTO invoiceiteam SET ?",[invoiceiteamdata],function(err,response){
              if(err) throw err;
              //res.redirect('/allinvoice')
            })
          }
          })
          for(let i=0; i<req.body.totalproduct; i++){
            const invoiceiteamdata = {
              productid: req.body.productid[i],
              productname: req.body.productname[i],
              producthsn: req.body.producthsn[i],
              productrate: req.body.productrate[i],
              productqty: req.body.productqty[i],
              productdiscount: req.body.productdiscount[i],
              productactualamount: req.body.productactualamount[i],
              producttax: req.body.producttax[i],
              producttaxamount: req.body.producttaxamount[i],
              productnetamount: req.body.productnetamount[i]
            }
            connection.query("UPDATE invoiceiteam SET ? WHERE invoiceiteamid = ? AND invoicedetailid = ? AND companyid = ?",[invoiceiteamdata,req.body.invoiceiteamid[i],req.body.invoicedetailid,company],function(err,response){
              if(err) throw err;
              //res.redirect('/allinvoice')
            })
          }
          const invoicetotaldata = {
            invoicetotalamount: req.body.invoicetotalamount
          }
          connection.query("UPDATE invoicetotal SET ? WHERE invoicetotalid = ? AND invoicedetailid = ? AND companyid = ?",[invoicetotaldata,req.body.invoicetotalid,req.body.invoicedetailid,company],function(err,response){
            if(err) throw err;
            //res.redirect('/allinvoice')
          })
        //console.log(req.body)
      }
      res.redirect('/allinvoice')
    })
  }else{
    res.redirect('/')
  }
});

router.post('/getinvoiceiteamid', function(req, res, next){
  connection.query("SELECT * FROM invoiceiteam",function(err,id){
    if(err) throw err;
    //console.log(id)
    const matchid = []
    for(let j = 0; j < id.length; j++){
      matchid.push(id[j].invoiceiteamid)
    }
    //console.log(matchid)
    do{
      var invoiceiteamid = 'ii'+Math.floor(Math.random()*(9999-100+1)+100);
    }while(matchid.includes(invoiceiteamid))
    res.send(invoiceiteamid);
})
});

router.post('/deleteinvoice', function(req, res, next){
  if(req.session.companysess){
    const company = req.session.companysess;
    connection.query("DELETE FROM invoicedetail WHERE invoicedetailid = ? AND companyid = ?",[req.body.hdinvoicedetailid,company],function(err,resforid){
      if(err) throw err;
      connection.query("DELETE FROM invoiceiteam WHERE invoicedetailid = ? AND companyid = ?",[req.body.hdinvoicedetailid,company],function(err,resforid){
        if(err) throw err;
        connection.query("DELETE FROM invoicetotal WHERE invoicedetailid = ? AND companyid = ?",[req.body.hdinvoicedetailid,company],function(err,resforid){
          if(err) throw err;
          res.redirect('/allinvoice')
        })
      })     
    })
  }else{
    res.redirect('/')
  }
});

//GET allinvoice
// router.get('/allinvoice', function(req, res, next){
//   if(req.session.companysess){
//     connection.query("SELECT * FROM companyinformation WHERE companyid = ?",req.session.companysess,function(err,result){
//       if(err) throw err;
//       res.render('allinvoice', {title: 'GST Bill Utility', companyinfo:result[0].companyname})
//     })
//   }
// });

module.exports = router;
