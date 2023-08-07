import express from 'express'
import {dirname} from "path"
import {fileURLToPath} from "url"
import {test,updateHoldOrder,generatePin,createOrder,searchByPin,closeHold,calculateHoldPrice, 
  getAllActiveTransActions,sendEmailNotification,setTransToActive,cancelHold, getHourlyPrice,sendMassReminder} from './custom_functions.js'
import http from 'https'
import ejs from 'ejs'



const app = express()
const port = 3000

const __dirname = dirname(fileURLToPath(import.meta.url));




import bodyParser from 'body-parser'


app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');

app.get('/', (req, res) => {
  let hourlyPrice = getHourlyPrice();
  res.render("main_page",{hourlyPrice : hourlyPrice});
   
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


app.get('/Create-Order',(req,res)=>{
  res.render('./partials/create-hold.ejs');
})


app.post('/request',(req,res)=>{

    let order = {
        d_fname : req.body['d_fname'],
        d_lname : req.body['d_lname'],
        d_tel : req.body['d_tel'],
        d_email : req.body['d_email'],
        r_fname : req.body['r_fname'],
        r_lname : req.body['r_lname'],
        r_tel : req.body['d_tel'],
        r_email : req.body['r_email'],
        package : req.body['package_description'],
        hold_time : req.body['h_hours']*60,
        order_pin : generatePin(),
        cost_of_hold : calculateHoldPrice(req.body['h_hours']*60)       
    }

    createOrder(order);
    const order_summary_url = '/search/'+order.order_pin;
    res.redirect(order_summary_url);
})


app.post('/activate_hold/:pin',(req,res)=>{
  setTransToActive(req.params.pin,req.body['email_dropper'],req.body['email_reciever'],req.body['fname_r']);
  const order_summary_url = '/search/'+req.params.pin;
    res.redirect(order_summary_url);

})



app.post('/search',(req,res)=>{
         searchByPin(req.body['search-bar']).then(result =>{
          res.render('./pages/hold_info.ejs',{
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
            final_hold_time: Math.floor(result[0].end_time_hold/60),
            actual_cost_of_hold: result[0].actual_cost_of_hold

          });

         }).catch(err =>{
          res.send("Looks like we dont a have hold for that!");
          
          console.log(err);
         })
})




app.get('/search/:pin',(req,res)=>{

  searchByPin(req.params.pin).then(result =>{

    console.log(result);
   res.render('./pages/hold_info.ejs',{
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

   });

  }).catch(err =>{
   res.send("Looks like we dont a have hold for that!");
   
   console.log(err);
  })
})


app.post('/cancelHold/:pin',(req,res)=>{
  const pin = req.params.pin;
  cancelHold(pin).then((value)=>{
    res.render('./pages/canceledPage.ejs');
  }).catch(err =>{
    console.log(err);
  })
})

app.post('/editHold/:pin',(req,res)=>{

  searchByPin(req.params.pin).then(result =>{

    res.render('./pages/edit-hold.ejs',{
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
      order_pin : req.params.pin,
      hold_status: result[0].hold_status,
      cost_of_hold: Math.floor(result[0].cost_of_hold),
      actual_cost_of_hold: Math.floor(result[0].actual_cost_of_hold),
      final_hold_time: Math.floor(result[0].end_time_hold/60)
 
    });
 
   }).catch(err =>{
    res.send("Looks like we dont a have hold for that!");
    
    console.log(err);
   })

})

app.post('/updateHold',(req,res)=>{
  let order = {
    d_fname : req.body['d_fname'],
    d_lname : req.body['d_lname'],
    d_tel : req.body['d_tel'],
    d_email : req.body['d_email'],
    r_fname : req.body['r_fname'],
    r_lname : req.body['r_lname'],
    r_tel : req.body['d_tel'],
    r_email : req.body['r_email'],
    package : req.body['package_description'],
    hold_time : req.body['h_hours']*60,
    pin : req.body['pin'],
          
}

      updateHoldOrder(order).then(result =>{
        const order_summary_url = '/search/'+order.pin;
    res.redirect(order_summary_url);
      }).catch(err =>{
        res.send("Looks like there was a problem");
      });
})

app.get('/self-hold',(req,res)=>{
  res.render('./pages/self-hold.ejs');
})

app.post('/create-self-hold',(req,res)=>{
  let order = {
    d_fname : req.body['d_fname'],
    d_lname : req.body['d_lname'],
    d_tel : req.body['d_tel'],
    d_email : req.body['d_email'],
    r_fname : req.body['d_fname'],
    r_lname : req.body['d_lname'],
    r_tel : req.body['d_tel'],
    r_email : req.body['d_email'],
    package : req.body['package_description'],
    hold_time : req.body['h_hours']*60,
    order_pin : generatePin(),
    cost_of_hold : calculateHoldPrice(req.body['h_hours']*60)       
}

console.log(order);

createOrder(order);
const order_summary_url = '/search/'+order.order_pin;
res.redirect(order_summary_url);
})



app.post('/close_hold',(req,res)=>{
  closeHold(req.body['hold_pin']);
  const order_summary_url = '/search/'+req.body['hold_pin'];
  res.redirect(order_summary_url);
})



app.get('/active-holds',(req,res)=>{


getAllActiveTransActions().then(result=>{
  res.render("./pages/active-holds.ejs",{result : result});
}).catch(err =>{
  console.log(err);
  res.send("Looks like there is a problem!");
})

  
})

app.get('/sendMassReminder',(req,res)=>{
  sendMassReminder();

})


app.get('/hold-calculator',(req,res)=>{
  
  res.render("./pages/hold-calculator.ejs",);
})


