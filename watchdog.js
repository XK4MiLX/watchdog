var shell = require('shelljs');
var sleep = require('sleep');
var moment = require('moment');
var zelcashd_counter=0;
var zelbench_counter=0;
global.paid_local_time="N/A";


sleep.sleep(15);
console.log('Watchdog v3.0.5 Starting...');
console.log('=================================================================');

function auto_update() {
 var remote_version = shell.exec("curl -sS https://raw.githubusercontent.com/XK4MiLX/watchdog/master/package.json | jq -r '.version'",{ silent: true }).stdout;
 var local_version = shell.exec("jq -r '.version' package.json",{ silent: true }).stdout;
  
  if ( remote_version.trim() !== local_version.trim() && remote_version != "" ){ 
   
   console.log('\x1b[34mNew version detected:\x1b[0m');
   console.log('=================================================================');
   console.log('Local version: \x1b[34m'+local_version.trim()+'\x1b[0m');
   console.log('Remote version: \x1b[32m'+remote_version.trim()+'\x1b[0m');
   console.log('\x1b[32mUpdating...\x1b[0m');
   console.log('=================================================================');
   shell.exec("git pull",{ silent: true }).stdout;    
  }
}

function zeldaemon_check() {

  date = new Date();
  data_time= new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().
  replace(/T/, ' ').
  replace(/\..+/, '');

console.log('Summary Report / Time: '+data_time );
console.log('=================================================================');
 
var zelbench_getstatus_info = JSON.parse(shell.exec("zelbench-cli getstatus",{ silent: true }).stdout);
var zelbench_getbenchmarks_info = JSON.parse(shell.exec("zelbench-cli getbenchmarks",{ silent: true }).stdout);
var zelcash_getinfo_info = JSON.parse(shell.exec("zelcash-cli getinfo",{ silent: true }).stdout);  
var zelcash_getzelnodestatus_info = JSON.parse(shell.exec("zelcash-cli getzelnodestatus",{ silent: true }).stdout);
 
var zelbench_status = zelbench_getstatus_info.status;
var zelback_status = zelbench_getstatus_info.zelback;
var zelbench_benchmark_status = zelbench_getstatus_info.benchmarking; 
var  zelbench_ddwrite = zelbench_getbenchmarks_info.ddwrite;
var zelbench_time = zelbench_getbenchmarks_info.time;
var zelcash_check = zelcash_getinfo_info.version;
var zelcash_node_status = zelcash_getzelnodestatus_info.status
var zelcash_last_paid_height = zelcash_getzelnodestatus_info.last_paid_height
var activesince = zelcash_getzelnodestatus_info.activesince
var lastpaid = zelcash_getzelnodestatus_info.lastpaid  
var mongod_check = shell.exec("pgrep mongod",{ silent: true }).stdout;
  
  
  if ( zelbench_counter > 3 || zelcashd_counter > 3 ){
    console.log('\x1b[34mWatchdog shutdowning....\x1b[0m');
    console.log('\x1b[34mReason: Failed more then 4 time in rows.\x1b[0m');
    console.log('=================================================================');
    shell.exec("pm2 stop watchdog",{ silent: true });
    process.exit(1);
  } 
  
if (zelcash_node_status == "" || zelcash_node_status == "undefined" ){
  console.log('Zelnode status = \x1b[31mdead\x1b[0m');  
} else {  
  if ( zelcash_node_status.trim() == "expired"){
    console.log('Zelnode status =\x1b[31m',zelcash_node_status.trim(), '\x1b[0m');
   }
  else {
   console.log('Zelnode status =\x1b[34m',zelcash_node_status.trim(), '\x1b[0m');
   }   
}
  
if (zelback_status == "" || zelback_status == "undefined"){
console.log('Zelback status = \x1b[31mdead\x1b[0m');
} else {
  
  if (zelback_status.trim() == "disconnected"){
    console.log('Zelback status =\x1b[31m',zelback_status.trim(),'\x1b[0m');    
  } else {    
    console.log('Zelback status =\x1b[34m',zelback_status.trim(),'\x1b[0m');
  } 
}
 
 if (zelbench_status == "" || zelbench_status == "undefined"){
console.log('Zelbench status = \x1b[31mdead\x1b[0m');
} else {
  
  if (zelbench_status.trim() == "online"){
    console.log('Zelbench status =\x1b[32m',zelbench_status.trim(),'\x1b[0m');  
  } else {    
    console.log('Zelbench status =\x1b[31m',zelbench_status.trim(),'\x1b[0m');
  } 
 
} 
 
  
if (zelbench_benchmark_status == "" || zelbench_benchmark_status == "undefined"){
console.log('Zelbench benchmark status = \x1b[31mdead\x1b[0m');
} else {
  
  if (zelbench_status.trim() == "toaster" || zelbench_status.trim() == "failed"){
    console.log('Benchmark status =\x1b[31m',zelbench_benchmark_status.trim(),'\x1b[0m');  
  } else {    
    console.log('Benchmark status =\x1b[34m',zelbench_benchmark_status.trim(),'\x1b[0m');
  } 
} 
  
if (zelcash_check !== "" ){
zelcashd_counter=0; 
console.log('Zelcash status = \x1b[34m"running"\x1b[0m');
}
else {
++zelcashd_counter;   
console.log('Zelcash status = \x1b[31mdead\x1b[0m');
shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
shell.exec("sudo systemctl start zelcash",{ silent: true })
console.log('\x1b[35mZelcash restarting...\x1b[0m'); 
}
 
if ( zelbench_benchmark_status.trim() == "toaster" || zelbench_benchmark_status.trim() == "failed" ){
++zelbench_counter;
shell.exec("zelbench-cli restartnodebenchmarks",{ silent: true });
console.log('\x1b[35mZelbench restarting...\x1b[0m'); 
}
else{
zelbench_counter=0;
}
  
if (zelbench_time.trim() == "null" || zelbench_time == "" || zelbench_time == "undefined"){
} else{
const durationInMinutes = '30';
var timestamp = moment.unix(Number(zelbench_time.trim()));  
var bench_local_time = timestamp.format("DD/MM/YYYY HH:mm:ss")  
console.log('Last benchmark time = \x1b[33m'+bench_local_time+'\x1b[0m');
var next_benchmark_time = moment(timestamp, 'DD/MM/YYYY HH:mm:ss').add(durationInMinutes, 'minutes').format('DD/MM/YYYY HH:mm:ss');
console.log('Next benchmark time = \x1b[33m'+next_benchmark_time+'\x1b[0m');
} 
  
if (zelcash_last_paid_height.trim() == "null" || zelcash_last_paid_height == "" || zelcash_last_paid_height == "undefined"){
} else{
console.log('Last paid hight = \x1b[33m'+zelcash_last_paid_height.trim()+'\x1b[0m');
} 
 

if (lastpaid.trim() == "null" || lastpaid == "" || lastpaid == "undefined"){
console.log('Last paid time = \x1b[33m'+paid_local_time+'\x1b[0m');
} else{
var timestamp_paid = moment.unix(Number(lastpaid.trim()));  
paid_local_time = timestamp_paid.format("DD/MM/YYYY HH:mm:ss")  
console.log('Last paid time = \x1b[33m'+paid_local_time+'\x1b[0m');
}  
 
if (activesince.trim() == "null" || activesince == "" || activesince == "undefined"){
} else{
var timestamp_active = moment.unix(Number(activesince.trim()));  
var active_local_time = timestamp_active.format("DD/MM/YYYY HH:mm:ss")  
console.log('Active since = \x1b[33m'+active_local_time+'\x1b[0m');
}  
 

if (zelbench_ddwrite == "" || zelbench_ddwrite == "undefined"){
} else{
console.log('Disk write speed =  \x1b[33m'+Number(zelbench_ddwrite.trim()).toFixed(2)+'\x1b[0m');
} 
if (mongod_check == ""){       
       console.log('MongoDB status = \x1b[31mdead\x1b[0m'); 
       console.log('\x1b[35mMongoDB restarting...\x1b[0m');   
       shell.exec("sudo systemctl restart mongod",{ silent: true })      
 }  
console.log('============================================================[\x1b[36m'+zelbench_counter+'/'+zelcashd_counter+'\x1b[0m]');
}
setInterval(zeldaemon_check, 170000);
setInterval(auto_update, 10800000);
