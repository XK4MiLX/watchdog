var shell = require('shelljs');
var sleep = require('sleep');
var moment = require('moment');
var zelcashd_counter=0;
var zelbench_counter=0;


sleep.sleep(10);
console.log('Watchdog v2.0.3 Starting...');
console.log('=================================================================');
function zeldaemon_check() {

  date = new Date();
  data_time= new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().
  replace(/T/, ' ').
  replace(/\..+/, '');

console.log('Summary Raport / Time: '+data_time );
console.log('=================================================================');
var zelbench_status = shell.exec("zelbench-cli getstatus | jq '.benchmarking'",{ silent: true }).stdout;
var zelback_status = shell.exec("zelbench-cli getstatus | jq '.zelback'",{ silent: true }).stdout;
var zelcash_check = shell.exec("zelcash-cli getinfo | jq '.version'",{ silent: true }).stdout;
var zelcash_node_status = shell.exec("zelcash-cli getzelnodestatus | jq '.status'",{ silent: true }).stdout;
var zelbench_ddwrite = shell.exec("zelbench-cli getbenchmarks | jq '.ddwrite'",{ silent: true }).stdout;
var zelbench_time = shell.exec("zelbench-cli getbenchmarks | jq '.time'",{ silent: true }).stdout;  
var zelcash_last_paid_height = shell.exec("zelcash-cli getzelnodestatus | jq '.last_paid_height'",{ silent: true }).stdout;
  
  
if (zelcash_node_status == ""){
} else{
console.log('Zelnode status = '+zelcash_node_status.trim());
}
if (zelback_status == ""){
console.log('Zelback status = dead');
} else{
console.log('Zelback status = '+zelback_status.trim());
}
if (zelbench_status == ""){
console.log('Zelbench status = dead');
} else{
console.log('Zelbench status = '+zelbench_status.trim());
}
if (zelcash_check !== "" ){
zelcashd_counter=0; 
console.log('Zelcash status =  "running"');
}
else {
++zelcashd_counter;   
console.log('Zelcash status =  dead');
shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
shell.exec("sudo systemctl start zelcash",{ silent: true })
console.log('Zelcash restarting...'); 
}
if ( zelbench_status.trim() == '"toaster"' || zelbench_status.trim() == '"failed"' )
{
++zelbench_counter;
shell.exec("zelbench-cli restartnodebenchmarks",{ silent: true });
console.log('Zelbench restarting...');
}
else{
zelbench_counter=0;
}
  
if (zelbench_time == ""){
} else{
var timestamp = moment.unix(Number(zelbench_time.trim()));  
var bench_local_time = timestamp.format("DD/MM/YYYY HH:mm:ss")  
console.log('Last benchmark time = '+bench_local_time);
} 
  
if (zelcash_last_paid_height == ""){
} else{
console.log('Last paid hight = '+zelcash_last_paid_height.trim());
} 
  
if (zelbench_ddwrite == ""){
} else{
console.log('Disk write speed = '+Number(zelbench_ddwrite.trim()).toFixed(2));
  
  
} 
 
  if ( zelbench_counter > 3 || zelcashd_counter > 3 ){
    console.log('Watchdog shutdowning....');
    console.log('Reason: Failed more then 4 time in rows...');
    shell.exec("pm2 stop watchdog",{ silent: true });
    process.exit(1);
  }
console.log("============================================================["+zelbench_counter+"/"+zelcashd_counter+"]");
}
setInterval(zeldaemon_check, 170000);
