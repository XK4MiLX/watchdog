const shell = require('shelljs');
const sleep = require('sleep');
const moment = require('moment');
const fs = require('fs');
global.paid_local_time="N/A";
var zelcashd_counter=0;
var zelbench_counter=0;
global.expiried_time="N/A";
global.watchdog_sleep="N/A";

function getFilesizeInBytes(filename) {
  try {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
  } catch {
    return 0;
  }
}


function error(args) {
  try {
    //console.error(args);
    // write to file
    const filepath = `watchdog_error.log`;
    const size = getFilesizeInBytes(filepath);
    let flag = 'a+';
    if (size > (25 * 1000 * 1000)) { // 25MB
      flag = 'w'; // rewrite file
    }
    const data_error = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    const stream = fs.createWriteStream(filepath, { flags: flag });
    stream.write(`${data_error} => ${args}\n`);
    stream.end();
  } catch (err) {
    console.error('This shall not have happened');
    console.error(err);
  }
}


sleep.sleep(12);
console.log('Watchdog v3.5.0 Starting...');
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

  const service_inactive = shell.exec("systemctl list-units --full -all | grep 'zelcash' | grep -o 'inactive'",{ silent: true }).stdout;
  const data_time_utc = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  const stillUtc = moment.utc(data_time_utc).toDate();
  const local = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');

  console.log('UTC: '+data_time_utc+' | LOCAL: '+local );
  console.log('=================================================================');


var  update_info = shell.exec("ps aux | grep 'apt' | wc -l",{ silent: true }).stdout;

// console.log(update_info);

if ( update_info > 2 ) {
  console.log('Update detected...');
  console.log('Watchdog in sleep mode => \x1b[34m'+data_time_utc+'\x1b[0m');
  console.log('=================================================================');
  sleep.sleep(300);
  return;
}

if ( service_inactive.trim() == "inactive" ) {
  console.log('Zelcash service status: \x1b[31minactive\x1b[0m');
  console.log('Watchdog in sleep mode => \x1b[34m'+data_time_utc+'\x1b[0m');
  console.log('=================================================================');
  return;
}


if ( zelbench_counter > 2 || zelcashd_counter > 2 ){

  try{
    var  zelcash_getinfo_info = JSON.parse(shell.exec("zelcash-cli getinfo",{ silent: true }).stdout);
    var zelcash_check = zelcash_getinfo_info.version;
  } catch {

         }

   if (watchdog_sleep != "1"){
      watchdog_sleep="1";
      error('Watchdog in sleep mode!..Zelcash status: \x1b[31mnot responding\x1b[0m');
   }

   if (typeof zelcash_check !== "undefined" ){
     zelcashd_counter=0;
     zelbench_counter=0;
     watchdog_sleep="N/A" }
   else {

     console.log('Zelcash status: \x1b[31mnot responding\x1b[0m');
     console.log('Watchdog in sleep mode => \x1b[34m'+data_time_utc+'\x1b[0m');
     console.log('=================================================================');
     return;
   }
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

    if (expiried_time != "1"){
    expiried_time="1";
    error('Zelnode expired => UTC: '+data_time_utc+' | LOCAL: '+local);
    }

   }
  else {
   expiried_time="N/A";
   console.log('Zelnode status =\x1b[34m',zelcash_node_status, '\x1b[0m');
   }
}

if (zelback_status == "" || typeof zelback_status == "undefined"){
  console.log('Zelback status = \x1b[31mdead\x1b[0m');
} else {

  if (zelback_status == "disconnected"){
    console.log('Zelback status =\x1b[31m',zelback_status,'\x1b[0m');
    error('ZelBack disconnected!');
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
  const time_left = moment(end_date.diff(start_date)).format("mm:ss");
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
  error('Zelcash crash detected!');
}

if ( zelbench_benchmark_status == "toaster" || zelbench_benchmark_status == "failed" ){
  ++zelbench_counter;
  shell.exec("zelbench-cli restartnodebenchmarks",{ silent: true });
  console.log(data_time_utc+' => \x1b[35mZelbench restarting...\x1b[0m');
  error('Benchmark problem detected!');
}
else{
zelbench_counter=0;
}

if (mongod_check == ""){
  console.log('MongoDB status = \x1b[31mdead\x1b[0m');
  console.log(data_time_utc+' => \x1b[35mMongoDB restarting...\x1b[0m');
  shell.exec("sudo systemctl restart mongod",{ silent: true })
  error('MongodDB crash detected!');

 }
console.log('============================================================[\x1b[36m'+zelbench_counter+'/'+zelcashd_counter+'\x1b[0m]');
}
setInterval(zeldaemon_check, 170000);
setInterval(auto_update, 10800000);
