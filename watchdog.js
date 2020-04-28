var shell = require('shelljs');
var sleep = require('sleep');
var moment = require('moment');
var zelcashd_counter=0;
var zelbench_counter=0;
global.paid_local_time="N/A";

sleep.sleep(12);
console.log('Watchdog v3.2.0 Starting...');
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


const data_time_utc = moment.utc().format('YYYY-MM-DD HH:mm:ss');
const stillUtc = moment.utc(data_time_utc).toDate();
const local = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');

console.log('UTC: '+data_time_utc+' | LOCAL: '+local );
console.log('=================================================================');


 if ( zelbench_counter > 3 || zelcashd_counter > 3 ){
    console.log('\x1b[34mWatchdog shutdowning....\x1b[0m');
    console.log('\x1b[34mReason: Failed more then 4 time in rows.\x1b[0m');
    console.log('=================================================================');
    shell.exec("pm2 stop watchdog",{ silent: true });
    process.exit(1);
 }

try{
    var zelbench_getstatus_info = JSON.parse(shell.exec("zelbench-cli getstatus",{ silent: true }).stdout);
    var zelbench_status = zelbench_getstatus_info.status;
    var zelback_status = zelbench_getstatus_info.zelback;
    var zelbench_benchmark_status = zelbench_getstatus_info.benchmarking;

}catch {

}

 try{
    var zelbench_getbenchmarks_info = JSON.parse(shell.exec("zelbench-cli getbenchmarks",{ silent: true }).stdout);
    var zelbench_ddwrite = zelbench_getbenchmarks_info.ddwrite;
    var zelbench_time = zelbench_getbenchmarks_info.time;
}catch {

}

 try{
    var  zelcash_getinfo_info = JSON.parse(shell.exec("zelcash-cli getinfo",{ silent: true }).stdout);
    var zelcash_check = zelcash_getinfo_info.version;
}catch {

}

 try{
    var zelcash_getzelnodestatus_info = JSON.parse(shell.exec("zelcash-cli getzelnodestatus",{ silent: true }).stdout);
    var zelcash_node_status = zelcash_getzelnodestatus_info.status
    var zelcash_last_paid_height = zelcash_getzelnodestatus_info.last_paid_height
    var activesince = zelcash_getzelnodestatus_info.activesince
    var lastpaid = zelcash_getzelnodestatus_info.lastpaid
}catch {

}

const mongod_check = shell.exec("pgrep mongod",{ silent: true }).stdout;

if (zelcash_node_status == "" || typeof zelcash_node_status == "undefined" ){
  console.log('Zelnode status = \x1b[31mdead\x1b[0m');
} else {
  if ( zelcash_node_status == "expired"){
    console.log('Zelnode status =\x1b[31m',zelcash_node_status, '\x1b[0m');
   }
  else {
   console.log('Zelnode status =\x1b[34m',zelcash_node_status, '\x1b[0m');
   }
}

if (zelback_status == "" || typeof zelback_status == "undefined"){
console.log('Zelback status = \x1b[31mdead\x1b[0m');
} else {

  if (zelback_status == "disconnected"){
    console.log('Zelback status =\x1b[31m',zelback_status,'\x1b[0m');
  } else {
    console.log('Zelback status =\x1b[34m',zelback_status,'\x1b[0m');
  }
}

 if (zelbench_status == "" || typeof zelbench_status == "undefined"){
console.log('Zelbench status = \x1b[31mdead\x1b[0m');
} else {

  if (zelbench_status  == "online"){
    console.log('Zelbench status =\x1b[32m',zelbench_status,'\x1b[0m');
  } else {
    console.log('Zelbench status =\x1b[31m',zelbench_status,'\x1b[0m');
  }

}

if (zelbench_benchmark_status == "" || typeof zelbench_benchmark_status == "undefined"){
console.log('Zelbench benchmark status = \x1b[31mdead\x1b[0m');
} else {

  if (zelbench_status == "toaster" || zelbench_status  == "failed"){
    console.log('Benchmark status =\x1b[31m',zelbench_benchmark_status,'\x1b[0m');
  } else {
    console.log('Benchmark status =\x1b[34m',zelbench_benchmark_status,'\x1b[0m');
  }
}

if (zelbench_time  == "null" || zelbench_time == "" || typeof zelbench_time == "undefined"){
} else{
const durationInMinutes = '30';
const timestamp = moment.unix(Number(zelbench_time));
const bench_local_time = timestamp.format("DD/MM/YYYY HH:mm:ss")
const next_benchmark_time = moment(timestamp, 'DD/MM/YYYY HH:mm:ss').add(durationInMinutes, 'minutes').format('DD/MM/YYYY HH:mm:ss');
const start_date = moment(data_time_utc, 'YYYY-MM-DD HH:mm:ss');
const end_date = moment(next_benchmark_time, 'YYYY-MM-DD HH:mm:ss');
const time_left = moment(end_date.diff(start_date)).format("mm:ss")

console.log('Last benchmark time = \x1b[33m'+bench_local_time+'\x1b[0m');
console.log('Next benchmark time = \x1b[33m'+next_benchmark_time+' (left: '+time_left+')\x1b[0m');
}

if (zelcash_last_paid_height  == "null" || zelcash_last_paid_height == "" || typeof zelcash_last_paid_height == "undefined"){
} else{
console.log('Last paid hight = \x1b[33m'+zelcash_last_paid_height+'\x1b[0m');
}

if (lastpaid == "null" || lastpaid == "" || typeof lastpaid == "undefined"){
console.log('Last paid time = \x1b[33m'+paid_local_time+'\x1b[0m');
} else{
var timestamp_paid = moment.unix(Number(lastpaid));
paid_local_time = timestamp_paid.format("DD/MM/YYYY HH:mm:ss")
console.log('Last paid time = \x1b[33m'+paid_local_time+'\x1b[0m');
}

if (activesince  == "null" || activesince == "" || typeof activesince == "undefined"){
} else{
const timestamp_active = moment.unix(Number(activesince));
const active_local_time = timestamp_active.format("DD/MM/YYYY HH:mm:ss")
console.log('Active since = \x1b[33m'+active_local_time+'\x1b[0m');
}

if (zelbench_ddwrite == "" || typeof zelbench_ddwrite == "undefined"){
} else{
console.log('Disk write speed = \x1b[33m'+Number(zelbench_ddwrite).toFixed(2)+'\x1b[0m');
}

if (typeof zelcash_check !== "undefined" ){
zelcashd_counter=0;
console.log('Zelcash status = \x1b[32mrunning\x1b[0m');
}
else {
++zelcashd_counter;
console.log('Zelcash status = \x1b[31mdead\x1b[0m');

shell.exec("sudo systemctl stop zelcash",{ silent: true })
sleep.sleep(2);
shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
shell.exec("sudo systemctl start zelcash",{ silent: true })
console.log(data_time_utc+' => \x1b[35mZelcash restarting...\x1b[0m');
}

if ( zelbench_benchmark_status == "toaster" || zelbench_benchmark_status == "failed" ){
++zelbench_counter;
shell.exec("zelbench-cli restartnodebenchmarks",{ silent: true });
console.log(data_time_utc+' => \x1b[35mZelbench restarting...\x1b[0m');
}
else{
zelbench_counter=0;
}

if (mongod_check == ""){
       console.log('MongoDB status = \x1b[31mdead\x1b[0m');
       console.log(data_time_utc+' => \x1b[35mMongoDB restarting...\x1b[0m');
       shell.exec("sudo systemctl restart mongod",{ silent: true })
 }
console.log('============================================================[\x1b[36m'+zelbench_counter+'/'+zelcashd_counter+'\x1b[0m]');
}
setInterval(zeldaemon_check, 170000);
setInterval(auto_update, 10800000);
