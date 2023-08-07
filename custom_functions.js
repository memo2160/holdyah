import mysql from 'mysql'
import nodemailer from 'nodemailer'

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'holdyahbz@gmail.com',
    pass: 'gtxfqtoxhzhgywpd'
    },
  tls: {
        rejectUnauthorized: false
    }
});

const senderEmail = 'salgueroguillermo917@gmail.com';


export function sendEmailNotification(email,msg,subj){

  var mailOptions = {
    from: senderEmail,
    to: email,
    subject: subj,
    text: msg
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}


export function test(req){
    console.log(req);
}



var sql_connection = mysql.createConnection({
    host: "db4free.net",
    user: "holdyah",
    password: "Snowtiger2017!",
    database: "holdyah_bz_db"
});


sql_connection.connect(function(err){
    if(err) throw err;
    console.log("Connected!");
})



export function generatePin(){
    // Generate a random number between 10000 (inclusive) and 100000 (exclusive)
    console.log("Generating pin!");

 

    const randomNumber = Math.floor(Math.random() * 90000) + 10000;

         let results = checkDuplicatePin(randomNumber);

        if(!checkDuplicatePin(randomNumber)){
            console.log("Pin is Good!");
            return randomNumber;
        }else{
            console.log("This PIN is no good, regenerating!");
            generatePin();
        }
  }


export function createOrder(order){
    
        insertHoldRecord(order);
       
        console.log("Hold order has been created!");

  }


  export function updateHoldOrder(order){

   let hold_cost = Math.floor(calculateHoldPrice(order['hold_time']));

    let sql = "UPDATE holdyah_transaction SET\
     d_fname = '"+order['d_fname']+"',\
     d_lname = '"+order['d_lname']+"',\
     r_fname = '"+order['r_fname']+"',\
     r_lname = '"+order['r_lname']+"',\
     d_phone_num = '"+order['d_tel']+"',\
     r_phone_num = '"+order['r_tel']+"',\
     d_email = '"+order['d_email']+"',\
     r_email = '"+order['r_email']+"',\
    package_description = '"+order['package']+"',\
     proposed_time_hold = '"+order['hold_time']+"',\
     cost_of_hold = '"+hold_cost+"'\
    WHERE pin = '"+order['pin']+"';"


    return new Promise((resolve, reject)=>{
      sql_connection.query(sql, function (err, result) {
        if(err){
          return reject(err);
      }
      resolve(result);
      });  
   });

  }


  export function setTransToActive(pin){
    let sql = "UPDATE holdyah_transaction\
    SET hold_status = 'Active', time_stamp_drop = '"+Date.now()+"' WHERE pin = '"+pin+"';"

    return new Promise((resolve, reject)=>{
      sql_connection.query(sql, function (err, result) {
        if(err){
          return reject(err);
      }
          notifyCreationOfHold(pin);
          resolve(result);
      });  
   });
  }




function checkDuplicatePin(pin){


        let sql = "SELECT * FROM holdyah_transaction\
        WHERE pin = '"+pin+"';"

        sql_connection.query(sql, function (err, result) {
          if (err) throw err;

          if (result  && result.length > 0){
            return true;
          }else{
            return false;
          }
        
        });

        
}

function getAllTransactions(){
    sql_connection.connect(function(err) {
        if (err) throw err;
        sql_connection.query("SELECT * FROM holdyah_transaction", function (err, result, fields) {
          if (err) throw err;
          console.log(result);
        });
      });

      
}

export function getAllActiveTransActions(){
  let sql = "select pin,d_fname,d_lname ,r_fname ,r_lname ,package_description,proposed_time_hold from holdyah_transaction ht where hold_status = 'Active'"
  return new Promise((resolve, reject)=>{
    sql_connection.query(sql, function (err, result) {
      if(err){
        return reject(err);
    }
    resolve(result);
    });
    
 });

}

function insertHoldRecord(order){
    
        let sql = "INSERT INTO holdyah_transaction (d_fname, d_lname,r_fname,r_lname,d_phone_num,r_phone_num,d_email,r_email,package_description,proposed_time_hold,end_time_hold,pin,hold_status,cost_of_hold)\
            VALUES ('"+order['d_fname']+"','"+order['d_lname']+"','"+order['r_fname']+"','"+order['r_lname']+"','"+order['d_tel']+"','"+order['r_tel']+"','"+order['d_email']+"','"+order['r_email']+"','"+order['package']+"','"+order['hold_time']+"','0','"+order['order_pin']+"','estimate','"+order['cost_of_hold']+"')";

        sql_connection.query(sql, function (err, result) {
          if (err) throw err
        });
        
    

}



export function searchByPin(pin){
  console.log("Entering search by pin");
  console.log(pin);
  let sql = "SELECT * FROM holdyah_transaction\
        WHERE pin = '"+pin+"';"

        return new Promise((resolve, reject)=>{
          sql_connection.query(sql, function (err, result) {
            if(err){
              return reject(err);
          }
          resolve(result);
          });
          
       });
   }


   export function closeHold(pin){
    
    
    getDropOffTime(pin).then(result =>{
      const currentTime = Date.now();
      const dropOffTime = result[0].time_stamp_drop;
      const timeDiff = (Math.floor((currentTime-dropOffTime)/ 1000))/60;
     console.log("Current Time is: "+currentTime+" Drop off time is:"+dropOffTime+ " Time Diff is: "+timeDiff);
      let finalPrice = calculateHoldPrice(timeDiff);
      endHoldTransaction(pin,finalPrice,currentTime,timeDiff);
      notifyEndOfHold(pin);
    });

   }

   function endHoldTransaction(pin,final_price,currentTime,timeDiff){
    let sql = "UPDATE holdyah_transaction\
    SET hold_status = 'done', time_stamp_pickup = '"+currentTime+"',end_time_hold ='"+timeDiff+"', actual_cost_of_hold = '"+final_price+"'\
    WHERE pin = '"+pin+"';"

    return new Promise((resolve, reject)=>{
      sql_connection.query(sql, function (err, result) {
        if(err){
          return reject(err);
      }
      resolve(result);
      });  
   });

   }

   export function calculateHoldPrice(holdTime){
   
    const hourstoHold = holdTime/60;
    let hold_time_price = (getHourlyPrice())*hourstoHold;
    console.log((getHourlyPrice())*hourstoHold);
    return hold_time_price;
   }


   export function getHourlyPrice(){
    const hoursInMonth = 730;
    const rent = 1000;
    
    const hour_rate = rent/hoursInMonth;
    return hour_rate;
   }

  
   function getDropOffTime(pin){

    let sql = "SELECT time_stamp_drop FROM holdyah_transaction WHERE pin = '"+pin+"';"

    return new Promise((resolve, reject)=>{
      sql_connection.query(sql, function (err, result) {
        if(err){
          return reject(err);
      }
      resolve(result);
      });  
   });

   }


  
function notifyCreationOfHold(pin){

  searchByPin(pin).then(result =>{

    let hold_order = {
      d_fname : result[0].d_fname,
      d_lname : result[0].d_lname,
      d_tel : result[0].d_phone_num,
      d_email : result[0].d_email,
      r_fname : result[0].r_fname,
      r_lname : result[0].r_lname,
      r_tel : result[0].r_phone_num,
      r_email : result[0].r_email,
      package_des : result[0].package_description,
      hold_time : Math.floor(result[0].proposed_time_hold/60),
      order_pin : result[0].pin,
      hold_status: result[0].hold_status,
      cost_of_hold: Math.floor(result[0].cost_of_hold),
      actual_cost_of_hold: Math.floor(result[0].actual_cost_of_hold),
      final_hold_time: Math.floor(result[0].end_time_hold/60)
    }
    let msg= 'You have a package waiting for you from '+hold_order.d_fname+''+" "+''+hold_order.d_lname+',\
     your secret pin is: '+hold_order.order_pin+'\
     \n \n \n Below is the summary of your hold order \n Reciever: '+hold_order.r_fname+' '+hold_order.r_lname+'\
     \n Dropper: '+hold_order.d_fname+' '+hold_order.d_lname+'\
     \n Dropper Tel:'+hold_order.d_tel+'\
     \n Dropper E-mail: '+hold_order.d_email+'\
     \n Hours Paid For: '+hold_order.hold_time+'\
     \n \n \n We advise to please pickup package ON TIME to avoid any additional charges.';
    let subj = 'You Have A Package Waiting!';

    sendEmailNotification(hold_order.r_email,msg,subj);
    let msg_d = 'Your hold order was succesfully created! '+hold_order.r_fname+' has been notified. The pin for this hold is: '+hold_order.order_pin+'\
   \n \n \n Below is the summary of your hold order \n Dropper: '+hold_order.d_fname+' '+hold_order.d_lname+'\
   \n Reciever: '+hold_order.r_fname+' '+hold_order.r_lname+'\
   \n Reciever Tel:'+hold_order.r_tel+'\
   \n Reciever E-mail: '+hold_order.r_email+'\
   \n Hours Paid For: '+hold_order.hold_time+'\
   \n Total Paid: $'+hold_order.cost_of_hold;

    let subj_d = 'Your Hold Order Has Been Created!';
    sendEmailNotification(hold_order.d_email,msg_d,subj_d);
 
   }).catch(err =>{
    console.log(err);
   })
   
}


function notifyEndOfHold(pin){

  searchByPin(pin).then(result =>{

    let hold_order = {
      d_fname : result[0].d_fname,
      d_lname : result[0].d_lname,
      d_tel : result[0].d_phone_num,
      d_email : result[0].d_email,
      r_fname : result[0].r_fname,
      r_lname : result[0].r_lname,
      r_tel : result[0].r_phone_num,
      r_email : result[0].r_email,
      package_des : result[0].package_description,
      hold_time : Math.floor(result[0].proposed_time_hold/60),
      order_pin : result[0].pin,
      hold_status: result[0].hold_status,
      cost_of_hold: Math.floor(result[0].cost_of_hold),
      actual_cost_of_hold: Math.floor(result[0].actual_cost_of_hold),
      final_hold_time: Math.floor(result[0].end_time_hold/60)
    }
    let msg= 'Your picked up your package from '+hold_order.d_fname+''+" "+''+hold_order.d_lname+',\
     the secret pin was: '+hold_order.order_pin+'\
     \n \n \n Below is the summary of your hold order \n Reciever: '+hold_order.r_fname+' '+hold_order.r_lname+'\
     \n Dropper: '+hold_order.d_fname+' '+hold_order.d_lname+'\
     \n Dropper Tel:'+hold_order.d_tel+'\
     \n Dropper E-mail: '+hold_order.d_email+'\
     \n Hours Paid For: '+hold_order.hold_time+'\
     \n \n \n We advise to please pickup package ON TIME to avoid any additional charges.';
    let subj = 'You Picked Up Your Package!';

    sendEmailNotification(hold_order.r_email,msg,subj);
    let msg_d = 'The Package was picked up by '+hold_order.r_fname+'. The pin for this hold was: '+hold_order.order_pin+'\
   \n \n \n Below is the summary of your hold order \n Dropper: '+hold_order.d_fname+' '+hold_order.d_lname+'\
   \n Reciever: '+hold_order.r_fname+' '+hold_order.r_lname+'\
   \n Reciever Tel:'+hold_order.r_tel+'\
   \n Reciever E-mail: '+hold_order.r_email+'\
   \n Hours Paid For: '+hold_order.hold_time+'\
   \n Total Paid: $'+hold_order.cost_of_hold;

    let subj_d = 'Your Hold Order Has Been Completed!';
    sendEmailNotification(hold_order.d_email,msg_d,subj_d);
 
   }).catch(err =>{
    console.log(err);
   })
}

export function cancelHold(pin){
  let sql = "DELETE FROM holdyah_transaction WHERE pin = '"+pin+"' AND hold_status='estimate';"

  return new Promise((resolve, reject)=>{
    sql_connection.query(sql, function (err, result) {
      if(err){
        return reject(err);
    }
    console.log(result);
    resolve(result);
    });  
 });
}

export function sendMassReminder(){
  getAllActiveTransActions().then(result=>{
    for(let i = 0; i < result.length;i++){
      notifyCreationOfHold(result[i].pin);
    }
  }).catch(err=>{
    console.log(err);
  })
}