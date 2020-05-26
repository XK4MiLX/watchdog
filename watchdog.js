const shell = require('shelljs');
const sleep = require('sleep');
const moment = require('moment');
const fs = require('fs');

sleep.sleep(15);
console.log('Watchdog v4.0.2 Starting...');
console.log('=================================================================');

const path = './config.js';

if (fs.existsSync(path)) {

  var  home_dir = shell.exec("echo $HOME",{ silent: true }).stdout;
  var  zelcash_path = `${home_dir.trim()}/.zelcash/zelcash.conf`;

  if (fs.existsSync(zelcash_path)) {
   var tx_hash = shell.exec("grep -w zelnodeoutpoint "+zelcash_path+" | sed -e 's/zelnodeoutpoint=//'",{ silent: true }).stdout;
   var exec_comment = `zelcash-cli decoderawtransaction $(zelcash-cli getrawtransaction ${tx_hash} ) | jq '.vout[].value' | egrep '10000|25000|100000'`
   var type = shell.exec(`${exec_comment}`,{ silent: true }).stdout;

   switch(Number(type.trim())){
       case 10000:
       var  tire_name="BASIC";
       break;

       case 25000:
       var  tire_name="SUPER";
       break;

       case 100000:
       var  tire_name="BAMF";
       break;

       default:
       var  tire_name="UNKNOW";

  }

} else {

    var  tire_name="UNKNOW";
  }


var config = require('./config.js');
var eps_limit=config.tier_eps_min;

console.log('Config file:');
console.log(`Tier: ${tire_name}`);
console.log(`Minimum eps: ${eps_limit}`);
console.log(`Update settings:`);
if ( config.zelcash_update == "1" ) {
console.log('=> Zelcash:  \x1b[32menabled\x1b[0m');
} else {
console.log('=> Zelcash:  \x1b[31mdisabled\x1b[0m');
}
if ( config.zelbench_update == "1" ) {
console.log('=> Zelbench: \x1b[32menabled\x1b[0m');
} else {
console.log('=> Zelbench: \x1b[31mdisabled\x1b[0m');
}
if ( config.zelflux_update == "1" ) {
console.log('=> Zelflux:  \x1b[32menabled\x1b[0m');
} else {
console.log('=> Zelflux:  \x1b[31mdisabled\x1b[0m');
}
console.log('=================================================================');
} else {

  var  home_dir = shell.exec("echo $HOME",{ silent: true }).stdout;
  var  zelcash_path = `${home_dir.trim()}/.zelcash/zelcash.conf`;

  if (fs.existsSync(zelcash_path)) {
   var tx_hash = shell.exec("grep -w zelnodeoutpoint "+zelcash_path+" | sed -e 's/zelnodeoutpoint=//'",{ silent: true }).stdout;
   var exec_comment = `zelcash-cli decoderawtransaction $(zelcash-cli getrawtransaction ${tx_hash} ) | jq '.vout[].value' | egrep '10000|25000|100000'`
   var type = shell.exec(`${exec_comment}`,{ silent: true }).stdout;

   switch(Number(type.trim())){
       case 10000:
       var  tire_name="BASIC";
       var eps_limit = 90;
       break;

       case 25000:
       var  tire_name="SUPER";
       var eps_limit = 180
       break;

       case 100000:
       var  tire_name="BAMF";
       var eps_limit = 300
       break;

       default:
       var  tire_name="UNKNOW";
       var eps_limit = 0;

  }

} else {
    var eps_limit = 0;
    var  tire_name="UNKNOW";
  }


  const dataToWrite = `module.exports = {
    tier_eps_min: '${eps_limit}',
    zelflux_update: '0',
    zelcash_update: '0',
    zelbench_update: '0'
}`;

console.log('Creating config file...');
console.log("========================");

 const userconfig = fs.createWriteStream(path);
      userconfig.once('open', () => {
      userconfig.write(dataToWrite);
      userconfig.end();
    });


var config = require('./config.js');

console.log('Config file:');
console.log(`Tier: ${tire_name}`);
console.log(`Minimum eps: ${eps_limit}`);
console.log(`Update settings:`);
if ( config.zelcash_update == "1" ) {
console.log('=> Zelcash:  \x1b[32menabled\x1b[0m');
} else {
console.log('=> Zelcash:  \x1b[31mdisabled\x1b[0m');
}
if ( config.zelbench_update == "1" ) {
console.log('=> Zelbench: \x1b[32menabled\x1b[0m');
} else {
console.log('=> Zelbench: \x1b[31mdisabled\x1b[0m');
}
if ( config.zelflux_update == "1" ) {
console.log('=> Zelflux:  \x1b[32menabled\x1b[0m');
} else {
console.log('=> Zelflux:  \x1b[31mdisabled\x1b[0m');
}
console.log('=================================================================');

}

var tire_lock=0;
var lock_zelback=0;
var zelcashd_counter=0;
var zelbench_counter=0;
var inactive_counter=0;
var mongod_counter=0;
var paid_local_time="N/A";
var expiried_time="N/A";
var watchdog_sleep="N/A";


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


function auto_update() {

 delete require.cache[require.resolve('./config.js')];
 var config = require('./config.js');
 var remote_version = shell.exec("curl -sS https://raw.githubusercontent.com/XK4MiLX/watchdog/master/package.json | jq -r '.version'",{ silent: true }).stdout;
 var local_version = shell.exec("jq -r '.version' package.json",{ silent: true }).stdout;

console.log(' UPDATE CHECKING....');
console.log('=================================================================');

console.log(`Watchdog current: \x1b[34m${remote_version.trim()}\x1b[0m installed: \x1b[32m${local_version.trim()}\x1b[0m`);

if ( remote_version.trim() != "" && local_version.trim() != "" ){
 if ( remote_version.trim() !== local_version.trim()){
   console.log('\x1b[34mNew watchdog version detected:\x1b[0m');
   console.log('=================================================================');
   console.log('Local version: \x1b[34m'+local_version.trim()+'\x1b[0m');
   console.log('Remote version: \x1b[32m'+remote_version.trim()+'\x1b[0m');
   console.log('=================================================================');
   shell.exec("cd /home/$USER/watchdog && git pull",{ silent: true }).stdout;
   
   var local_ver = shell.exec("jq -r '.version' package.json",{ silent: true }).stdout;
   if ( local_ver.trim() == remote_version.trim() ){
      console.log('\x1b[32mUpdate successfully.\x1b[0m');
   }
   
   console.log(' ');
   
  }
}

if (config.zelflux_update == "1") {

   var zelflux_remote_version = shell.exec("curl -sS https://raw.githubusercontent.com/zelcash/zelflux/master/package.json | jq -r '.version'",{ silent: true }).stdout;
   var zelflux_local_version = shell.exec("jq -r '.version' /home/$USER/zelflux/package.json",{ silent: true }).stdout;

   console.log(`Zelflux current: \x1b[34m${zelflux_remote_version.trim()}\x1b[0m installed: \x1b[32m${zelflux_local_version.trim()}\x1b[0m`);
   if ( zelflux_remote_version.trim() != "" && zelflux_local_version.trim() != "" ){

     if ( zelflux_remote_version.trim() !== zelflux_local_version.trim() ){
       console.log('\x1b[34mNew zelflux version detected:\x1b[0m');
       console.log('=================================================================');
       console.log('Local version: \x1b[34m'+zelflux_local_version.trim()+'\x1b[0m');
       console.log('Remote version: \x1b[32m'+zelflux_remote_version.trim()+'\x1b[0m');
       console.log('=================================================================');
       shell.exec("cd /home/$USER/zelflux && git pull",{ silent: true }).stdout;
       var zelflux_lv = shell.exec("jq -r '.version' /home/$USER/zelflux/package.json",{ silent: true }).stdout;
       if ( zelflux_remote_version.trim() == zelflux_lv.trim() ) {
          console.log('\x1b[32mUpdate successfully.\x1b[0m');
          sleep.sleep(2);
        }
       console.log(' ');
    }
   }
  }

if (config.zelcash_update == "1") {

   var zelcash_remote_version = shell.exec("curl -sS https://zelcore.io/zelflux/zelcashinfo.php | jq -r '.version'",{ silent: true }).stdout;
   var zelcash_local_version = shell.exec("zelcash-cli getinfo | jq -r '.version'",{ silent: true }).stdout;


console.log(`Zelcash current: \x1b[34m${zelcash_remote_version.trim()}\x1b[0m installed: \x1b[32m${zelcash_local_version.trim()}\x1b[0m`);


 if ( zelcash_remote_version.trim() != "" && zelcash_local_version.trim() != "" ){

   if ( zelcash_remote_version.trim() !== zelcash_local_version.trim() ){
     console.log('\x1b[34mNew zelcash version detected:\x1b[0m');
     console.log('=================================================================');
     console.log('Local version: \x1b[34m'+zelcash_local_version.trim()+'\x1b[0m');
     console.log('Remote version: \x1b[32m'+zelcash_remote_version.trim()+'\x1b[0m');

     var  update_info = shell.exec("ps aux | grep 'apt' | wc -l",{ silent: true }).stdout;

      if ( update_info > 2 ) {

        shell.exec("sudo killall apt",{ silent: true }).stdout;
        shell.exec("sudo killall apt-get",{ silent: true }).stdout;
        shell.exec("sudo dpkg --configure -a",{ silent: true }).stdout;

      }


     var zelcash_dpkg_version_before = shell.exec("dpkg -l zelcash | grep -w 'zelcash' | awk '{print $3}'",{ silent: true }).stdout;
     shell.exec("sudo systemctl stop zelcash",{ silent: true })
     shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
     shell.exec("sudo apt-get update",{ silent: true })
     shell.exec("sudo apt-get install zelcash -y",{ silent: true })
     var zelcash_dpkg_version_after = shell.exec("dpkg -l zelcash | grep -w 'zelcash' | awk '{print $3}'",{ silent: true }).stdout;
     sleep.sleep(2);
     shell.exec("sudo systemctl start zelcash",{ silent: true })

       if ( (zelcash_dpkg_version_before !== zelcash_dpkg_version_after) && zelcash_dpkg_version_after != "" ){
          console.log('\x1b[32mUpdate successfully.\x1b[0m');
          console.log(' ');
          sleep.sleep(2);
       } else {
          //shell.exec("./home/$USER/update_zelcash.sh",{ silent: true }).stdout;
         console.log('\x1b[32mScript called.\x1b[0m');
         // console.log('\x1b[32mUpdate successfully.\x1b[0m');
         console.log(' ');
          sleep.sleep(2);
       }

   }
  }
 }

if (config.zelbench_update == "1") {

 var zelbench_remote_version = shell.exec("curl -sS https://zelcore.io/zelflux/zelbenchinfo.php | jq -r '.version'",{ silent: true }).stdout;
 var zelbench_local_version = shell.exec("zelbench-cli getinfo | jq -r '.version'",{ silent: true }).stdout;

 console.log(`Zelbench current: \x1b[34m${zelbench_remote_version.trim()}\x1b[0m installed: \x1b[32m${zelbench_local_version.trim()}\x1b[0m`);

  if ( zelbench_remote_version.trim() != "" && zelbench_local_version.trim() != "" ){

    if ( zelbench_remote_version.trim() !== zelbench_local_version.trim() ){
     console.log('\x1b[34mNew zelbench version detected:\x1b[0m');
     console.log('=================================================================');
     console.log('Local version: \x1b[34m'+zelbench_local_version.trim()+'\x1b[0m');
     console.log('Remote version: \x1b[32m'+zelbench_remote_version.trim()+'\x1b[0m');
     console.log('=================================================================');

      if ( update_info > 2 ) {

      shell.exec("sudo killall apt",{ silent: true }).stdout;
      shell.exec("sudo killall apt-get",{ silent: true }).stdout;
      shell.exec("sudo dpkg --configure -a",{ silent: true }).stdout;

     }


   var zelbench_dpkg_version_before = shell.exec("dpkg -l zelbench | grep -w 'zelbench' | awk '{print $3}'",{ silent: true }).stdout;
   shell.exec("sudo systemctl stop zelcash",{ silent: true })
   shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
   shell.exec("sudo apt-get update",{ silent: true })
   shell.exec("sudo apt-get install zelbench -y",{ silent: true })
   sleep.sleep(2);
   shell.exec("sudo systemctl start zelcash",{ silent: true })   
      
   var zelbench_dpkg_version_after = shell.exec("dpkg -l zelbench | grep -w 'zelbench' | awk '{print $3}'",{ silent: true }).stdout;

     if ( (zelbench_dpkg_version_before !== zelbench_dpkg_version_after) && zelbench_dpkg_version_after != "" ){
        console.log('\x1b[32mUpdate successfully.\x1b[0m');
        console.log(' ');
        sleep.sleep(2);
     } else {
        // shell.exec("./home/$USER/update_zelbench.sh",{ silent: true }).stdout;
        console.log('\x1b[32mScript called.\x1b[0m');
       // console.log('\x1b[32mUpdate successfully.\x1b[0m');
        console.log(' ');
        sleep.sleep(2);
     }


  }
 }
}
console.log('=================================================================');

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
  return;
}

if ( service_inactive.trim() == "inactive" ) {
  console.log('Zelcash service status: \x1b[31minactive\x1b[0m');
  console.log('Watchdog in sleep mode => \x1b[34m'+data_time_utc+'\x1b[0m');
  ++inactive_counter;
  console.log('============================================================[\x1b[36m'+inactive_counter+'/3\x1b[0m]');
  if ( inactive_counter > 2 ) {
     shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
     shell.exec("sudo systemctl start zelcash",{ silent: true })
     inactive_counter=0;
   } else {
    return;
   }
}


if ( zelbench_counter > 2 || zelcashd_counter > 2 ){

  try{
    var  zelcash_getinfo_info = JSON.parse(shell.exec("zelcash-cli getinfo",{ silent: true }).stdout);
    var zelcash_check = zelcash_getinfo_info.version;
    var zelbench_getstatus_info = JSON.parse(shell.exec("zelbench-cli getstatus",{ silent: true }).stdout);
    var zelbench_benchmark_status = zelbench_getstatus_info.benchmarking;
  } catch {

  }

   if (watchdog_sleep != "1"){
     
      watchdog_sleep="1";
     
     if ( zelcashd_counter > 2 ) { 
       error('Watchdog in sleep mode! Zelcash status: \x1b[31mnot responding\x1b[0m');
      } else { 
       error('Watchdog in sleep mode! Zelbench status: \x1b[31m'+zelbench_benchmark_status+'\x1b[0m');   
      }
     
   }   
  
   if (typeof zelcash_check !== "undefined" && zelbench_benchmark_status != "toaster" && zelbench_benchmark_status != "failed"  && typeof zelbench_benchmark_status !== "undefined"){
          zelcashd_counter=0;
          zelbench_counter=0;
          watchdog_sleep="N/A" 
   } else {
  
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
    var zelbench_eps = zelbench_getbenchmarks_info.eps;
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
    if ( lock_zelback != "1" ) {
    error('ZelBack disconnected!');
    lock_zelback=1;
    }
  } else {
    console.log('Zelback status =\x1b[34m',zelback_status,'\x1b[0m');
    lock_zelback=0;
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

  if (zelbench_benchmark_status == "toaster" || zelbench_benchmark_status  == "failed" ){
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
  var error_line=shell.exec("egrep -a --color 'Failed' /home/$USER/.zelbenchmark/debug.log | tail -1 | sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}.[0-9]\{2\}.[0-9]\{2\}.[0-9]\{2\}.//'",{ silent: true });
  error('Benchmark problem detected! Zelbench status: '+zelbench_benchmark_status);
  error('Reason: '+error_line);
  console.log('\x1b[35mBenchmark problem detected! Zelbench status: '+zelbench_benchmark_status+'\x1b[0m');
  console.log('\x1b[35mReason: '+error_line+'\x1b[0m');
  console.log(data_time_utc+' => \x1b[35mZelbench restarting...\x1b[0m');
  shell.exec("zelbench-cli restartnodebenchmarks",{ silent: true });
}
else{
zelbench_counter=0;
}

delete require.cache[require.resolve('./config.js')];
var config = require('./config.js');

if (config.tier_eps_min != "" && config.tier_eps_min != "0" && zelbench_eps != "" && zelbench_eps < config.tier_eps_min ){
++tire_lock;
if ( tire_lock < 4 ) {
error('Benchmark problem detected! CPU eps under minimum limit for '+tire_name+'('+eps_limit+'), current eps: '+zelbench_eps.toFixed(2));
console.log('\x1b[35mBenchmark problem detected!\x1b[0m');
console.log('\x1b[35mCPU eps under minimum limit for '+tire_name+'('+eps_limit+'), current eps: '+zelbench_eps.toFixed(2)+'\x1b[0m');
console.log(data_time_utc+' => \x1b[35mZelbench restarting...\x1b[0m');
shell.exec("zelbench-cli restartnodebenchmarks",{ silent: true });
}
  
} else {
tire_lock=0;
}

if (mongod_check == ""){

  ++mongod_counter;
  console.log('MongoDB status = \x1b[31mdead\x1b[0m');

  if (mongod_counter < 4){
  console.log(data_time_utc+' => \x1b[35mMongoDB restarting...\x1b[0m');
  shell.exec("sudo systemctl restart mongod",{ silent: true })
  }

  if ( mongod_counter == "1" ){
  error('MongodDB crash detected!');
  }

} else {
 mongod_counter=0;
}

console.log('============================================================[\x1b[36m'+zelbench_counter+'/'+zelcashd_counter+'\x1b[0m]');
}
setInterval(zeldaemon_check, 170000);
setInterval(auto_update, 10800000);
