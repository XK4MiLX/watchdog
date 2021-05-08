const shell = require('shelljs');
const sleep = require('sleep');
const moment = require('moment');
const webhook = require("webhook-discord")
const fs = require('fs');


sleep.sleep(15);
console.log('Watchdog v5.0.1 Starting...');
console.log('=================================================================');

const path = 'config.js';
var sync_lock = 0;
var tire_lock=0;
var lock_zelback=0;
var zelcashd_counter=0;
var zelbench_counter=0;
var inactive_counter=0;
var mongod_counter=0;
var paid_local_time="N/A";
var expiried_time="N/A";
var watchdog_sleep="N/A";


async function Myip(){

  const check_list = ['ifconfig.me', 'api4.my-ip.io/ip', 'checkip.amazonaws.com' , 'api.ipify.org'];
  var MyIP = null;

  for (const [index, val] of check_list.entries()) {

     MyIP = await shell.exec(`curl -sk -m 5 https://${val} | tr -dc '[:alnum:].'`,{ silent: true }).stdout;

     if ( MyIP.length > 5){
        break;
     }

  }
return MyIP; 
}


async function discord_hook(node_error,web_hook_url,ping) {

  if ( typeof web_hook_url !== "undefined" && web_hook_url !== "0" ) {

      if ( typeof ping == "undefined" || ping == "0") {
          var node_ip = await Myip();
          const Hook = new webhook.Webhook(`${web_hook_url}`);
          const msg = new webhook.MessageBuilder()
          .setName("Flux Watchdog")
          .setTitle(':loudspeaker: **FluxNode Alert**')
          .addField('URL:', `http://${node_ip}:16126`)
          .addField('Error:', node_error)
          .setColor('#ea1414')
          .setThumbnail('https://fluxnodeservice.com/favicon.png');
          Hook.send(msg);
      } else {
          var node_ip = await Myip();
          const Hook = new webhook.Webhook(`${web_hook_url}`);
          const msg = new webhook.MessageBuilder()
          .setName("Flux Watchdog")
          .setTitle(':loudspeaker: **FluxNode Alert**')
          .addField('URL:', `http://${node_ip}:16126`)
          .addField('Error:', node_error)
          .setColor('#ea1414')
          .setThumbnail('https://fluxnodeservice.com/favicon.png')
          .setText(`Ping: <@${ping}>`);
           Hook.send(msg);
      }

   }

 }


function max() {
    var args = Array.prototype.slice.call(arguments);
    return Math.max.apply(Math, args.filter(function(val) {
       return !isNaN(val);
    }));
}


async function Check_Sync(height) {

  var exec_comment1=`curl -sk -m 8 https://explorer.flux.zelcore.io/api/status?q=getInfo | jq '.info.blocks'`
  var exec_comment2=`curl -sk -m 8 https://explorer.runonflux.io/api/status?q=getInfo | jq '.info.blocks'`
  var exec_comment3=`curl -sk -m 8 https://explorer.zelcash.online/api/status?q=getInfo | jq '.info.blocks'`
  var explorer_block_height_01 = await shell.exec(`${exec_comment1}`,{ silent: true }).stdout;
  var explorer_block_height_02 = await shell.exec(`${exec_comment2}`,{ silent: true }).stdout;
  var explorer_block_height_03 = await shell.exec(`${exec_comment3}`,{ silent: true }).stdout;
  var explorer_block_height = max(explorer_block_height_01,explorer_block_height_02,explorer_block_height_03);
  var height_diff = Math.abs(explorer_block_height-height);

  if ( height_diff < 10 && sync_lock == 0 ) {
    console.log(`Flux daemon is synced (${height}, diff: ${height_diff})`);
    sync_lock = 0;
  } else {
    
    console.log(`Flux daemon is not synced (${height}, diff: ${height_diff})`);
    if ( sync_lock == 0 ) {
       discord_hook(`Flux daemon is not synced!\nDaemon height: **${height}**\nNetwork height: **${explorer_block_height}**\nDiff: **${height_diff}**`,web_hook_url,ping);
       sync_lock = 1;
    }
    
  }
}


if (fs.existsSync(path)) {

  var  home_dir = shell.exec("echo $HOME",{ silent: true }).stdout;
  var  zelcash_path = `${home_dir.trim()}/.zelcash/zelcash.conf`;
  var daemon_cli='zelcash-cli';
  var daemon_package_name='zelcash';

  if (!fs.existsSync(zelcash_path)) {
     zelcash_path = `${home_dir.trim()}/.flux/flux.conf`;
     daemon_cli='flux-cli';
     daemon_package_name='flux';
   }


  if (fs.existsSync(`/usr/local/bin/fluxbenchd`)) {
     bench_cli='fluxbench-cli';
     bench_package_name='fluxbench';
   } else {
     bench_cli='zelbench-cli';
     bench_package_name='zelbench';
   }


  if (fs.existsSync(zelcash_path)) {
   var tx_hash = shell.exec("grep -w zelnodeoutpoint "+zelcash_path+" | sed -e 's/zelnodeoutpoint=//'",{ silent: true }).stdout;
   var exec_comment = `${daemon_cli} decoderawtransaction $(${daemon_cli} getrawtransaction ${tx_hash} ) | jq '.vout[].value' | egrep '10000|25000|100000'`
   var type = shell.exec(`${exec_comment}`,{ silent: true }).stdout;

   switch(Number(type.trim())){
       case 10000:
       var  tire_name="CUMULUS";
       break;

       case 25000:
       var  tire_name="NIMBUS";
       break;

       case 100000:
       var  tire_name="STRATUS";
       break;

       default:
       var  tire_name="UNKNOW";

  }

} else {

    var  tire_name="UNKNOW";
  }


var config = require('./config.js');
var eps_limit=config.tier_eps_min;
var web_hook_url=config.web_hook_url;
var action=config.action;
var ping=config.ping;

console.log('Config file:');
console.log(`Tier: ${tire_name}`);
console.log(`Minimum eps: ${eps_limit}`);
if (typeof action == "undefined" || action == "1" )
{
console.log('Fix action:  enabled');
} else {
console.log('Fix action:  disabled');
}

if (typeof web_hook_url !== "undefined" && web_hook_url !== "0" )
{
console.log('Discord alert:  enabled');

if (typeof ping !== "undefined" && ping !== "0" ){
console.log('Discord ping:  enabled');
} else {
console.log('Discord ping:  disabled');
}



} else {
console.log('Discord alert:  disabled');
}
console.log(`Update settings:`);
if ( config.zelcash_update == "1" ) {
console.log('=> Flux daemon:  enabled');
} else {
console.log('=> Flux daemon:  disabled');
}
if ( config.zelbench_update == "1" ) {
console.log('=> Fluxbench: enabled');
} else {
console.log('=> Fluxbench: disabled');
}
if ( config.zelflux_update == "1" ) {
console.log('=> FluxOS:  enabled');
} else {
console.log('=> FluxOS:  disabled');
}
console.log('=================================================================');
} else {

  var  home_dir = shell.exec("echo $HOME",{ silent: true }).stdout;
  var  zelcash_path = `${home_dir.trim()}/.zelcash/zelcash.conf`;
  var daemon_cli='zelcash-cli';
  var daemon_package_name='zelcash';

  if (!fs.existsSync(zelcash_path)) {
     zelcash_path = `${home_dir.trim()}/.flux/flux.conf`;
     daemon_cli='flux-cli';
     daemon_package_name='flux';
   }


  if (fs.existsSync(`/usr/local/bin/fluxbenchd`)) {
     bench_cli='fluxbench-cli';
     bench_package_name='fluxbench';
   } else {
     bench_cli='zelbench-cli';
     bench_package_name='zelbench';
   }


  if (fs.existsSync(zelcash_path)) {
   var tx_hash = shell.exec("grep -w zelnodeoutpoint "+zelcash_path+" | sed -e 's/zelnodeoutpoint=//'",{ silent: true }).stdout;
   var exec_comment = `${daemon_cli} decoderawtransaction $(${daemon_cli} getrawtransaction ${tx_hash} ) | jq '.vout[].value' | egrep '10000|25000|100000'`
   var type = shell.exec(`${exec_comment}`,{ silent: true }).stdout;

   switch(Number(type.trim())){
       case 10000:
       var  tire_name="CUMULUS";
       var eps_limit = 90;
       break;

       case 25000:
       var  tire_name="NIMBUS";
       var eps_limit = 180
       break;

       case 100000:
       var  tire_name="STRATUS";
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
    zelbench_update: '0',
    action: '1',
    ping: '0';
    web_hook_url: '0'
}`;

console.log('Creating config file...');
console.log("========================");

 const userconfig = fs.createWriteStream(path);
      userconfig.once('open', () => {
      userconfig.write(dataToWrite);
      userconfig.end();
    });

sleep.sleep(3);
var config = require('./config.js');
var web_hook_url=config.web_hook_url;
var action=config.action;
var ping=config.ping;

console.log('Config file:');
console.log(`Tier: ${tire_name}`);
console.log(`Minimum eps: ${eps_limit}`);
if (typeof action == "undefined" || action == "1" )
{
console.log('Fix action:  enabled');
} else {
console.log('Fix action:  disabled');
}

if (typeof web_hook_url !== "undefined" && web_hook_url !== "0" )
{
console.log('Discord alert:  enabled');

if (typeof ping !== "undefined" && ping !== "0" ) {
console.log('Discord ping:  enabled');
} else {
console.log('Discord ping:  disabled');
}


} else {
console.log('Discord alert:  disabled');
}
console.log(`Update settings:`);
if ( config.zelcash_update == "1" ) {
console.log('=> Flux daemon:  enabled');
} else {
console.log('=> Flux daemon:  disabled');
}
if ( config.zelbench_update == "1" ) {
console.log('=> Fluxbench: enabled');
} else {
console.log('=> Fluxbench: disabled');
}
if ( config.zelflux_update == "1" ) {
console.log('=> FluxOS:  enabled');
} else {
console.log('=> FluxOS:  disabled');
}
console.log('=================================================================');

}



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
 var remote_version = shell.exec("curl -sS https://raw.githubusercontent.com/RunOnFlux/fluxnode-watchdog/master/package.json | jq -r '.version'",{ silent: true }).stdout;
 var local_version = shell.exec("jq -r '.version' package.json",{ silent: true }).stdout;

console.log(' UPDATE CHECKING....');
console.log('=================================================================');

console.log(`Watchdog current: ${remote_version.trim()} installed: ${local_version.trim()}`);

if ( remote_version.trim() != "" && local_version.trim() != "" ){
 if ( remote_version.trim() !== local_version.trim()){
   console.log('New watchdog version detected:');
   console.log('=================================================================');
   console.log('Local version: '+local_version.trim());
   console.log('Remote version: '+remote_version.trim());
   console.log('=================================================================');
   shell.exec("cd /home/$USER/watchdog && git pull",{ silent: true }).stdout;

   var local_ver = shell.exec("jq -r '.version' package.json",{ silent: true }).stdout;
   if ( local_ver.trim() == remote_version.trim() ){
      console.log('Update successfully.');
      sleep.sleep(2);
   }

   console.log(' ');

  }
}

if (config.zelflux_update == "1") {

   var zelflux_remote_version = shell.exec("curl -sS https://raw.githubusercontent.com/zelcash/zelflux/master/package.json | jq -r '.version'",{ silent: true }).stdout;
   var zelflux_local_version = shell.exec("jq -r '.version' /home/$USER/zelflux/package.json",{ silent: true }).stdout;

   console.log(`FluxOS current: ${zelflux_remote_version.trim()} installed: ${zelflux_local_version.trim()}`);
   if ( zelflux_remote_version.trim() != "" && zelflux_local_version.trim() != "" ){

     if ( zelflux_remote_version.trim() !== zelflux_local_version.trim() ){
       console.log('New FluxOS version detected:');
       console.log('=================================================================');
       console.log('Local version: '+zelflux_local_version.trim());
       console.log('Remote version: '+zelflux_remote_version.trim());
       console.log('=================================================================');
       shell.exec("cd /home/$USER/zelflux && git pull",{ silent: true }).stdout;
       var zelflux_lv = shell.exec("jq -r '.version' /home/$USER/zelflux/package.json",{ silent: true }).stdout;
       if ( zelflux_remote_version.trim() == zelflux_lv.trim() ) {
          console.log('Update successfully.');
          sleep.sleep(2);
        }
       console.log(' ');
    }
   }
  }

if (config.zelcash_update == "1") {

   var zelcash_remote_version = shell.exec("curl -s -m 5 https://apt.runonflux.io/pool/main/f/flux/ | grep -o '[0-9].[0-9].[0-9]' | head -n1",{ silent: true }).stdout;
   var zelcash_local_version = shell.exec(`dpkg -l flux | grep -w flux | awk '{print $3}'`,{ silent: true }).stdout;


console.log(`Flux daemon current: ${zelcash_remote_version.trim()} installed: ${zelcash_local_version.trim()}`);


 if ( zelcash_remote_version.trim() != "" && zelcash_local_version.trim() != "" ){

   if ( zelcash_remote_version.trim() !== zelcash_local_version.trim() ){
     console.log('New Flux daemon version detected:');
     console.log('=================================================================');
     console.log('Local version: '+zelcash_local_version.trim());
     console.log('Remote version: '+zelcash_remote_version.trim());

     var  update_info = shell.exec("ps aux | grep 'apt' | wc -l",{ silent: true }).stdout;

      if ( update_info > 2 ) {

        shell.exec("sudo killall apt",{ silent: true }).stdout;
        shell.exec("sudo killall apt-get",{ silent: true }).stdout;
        shell.exec("sudo dpkg --configure -a",{ silent: true }).stdout;

      }

     var zelcash_dpkg_version_before = shell.exec(`dpkg -l flux | grep -w flux | awk '{print $3}'`,{ silent: true }).stdout;
     shell.exec("sudo systemctl stop zelcash",{ silent: true })
     shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
     shell.exec("sudo apt-get update",{ silent: true })
     shell.exec("sudo apt-get install flux -y",{ silent: true })
     var zelcash_dpkg_version_after = shell.exec(`dpkg -l flux | grep -w flux | awk '{print $3}'`,{ silent: true }).stdout;
     sleep.sleep(2);
     shell.exec("sudo systemctl start zelcash",{ silent: true })

       if ( (zelcash_dpkg_version_before !== zelcash_dpkg_version_after) && zelcash_dpkg_version_after != "" ){
          console.log('Update successfully.');
          console.log(' ');
          sleep.sleep(2);
       } else {
         console.log('Script called.');
         console.log(' ');
          sleep.sleep(2);
       }

   }
  }
 }

if (config.zelbench_update == "1") {

 var zelbench_remote_version = shell.exec("curl -s -m 5 https://apt.runonflux.io/pool/main/f/fluxbench/ | grep -o '[0-9].[0-9].[0-9]' | head -n1",{ silent: true }).stdout;
 var zelbench_local_version = shell.exec("dpkg -l fluxbench | grep -w fluxbench | awk '{print $3}'",{ silent: true }).stdout;


 console.log(`Fluxbench current: ${zelbench_remote_version.trim()} installed: ${zelbench_local_version.trim()}`);

  if ( zelbench_remote_version.trim() != "" && zelbench_local_version.trim() != "" ){

    if ( zelbench_remote_version.trim() !== zelbench_local_version.trim() ){
     console.log('New Fluxbench version detected:');
     console.log('=================================================================');
     console.log('Local version: '+zelbench_local_version.trim());
     console.log('Remote version: '+zelbench_remote_version.trim());
     console.log('=================================================================');

      if ( update_info > 2 ) {

      shell.exec("sudo killall apt",{ silent: true }).stdout;
      shell.exec("sudo killall apt-get",{ silent: true }).stdout;
      shell.exec("sudo dpkg --configure -a",{ silent: true }).stdout;

     }


   var zelbench_dpkg_version_before = shell.exec(`dpkg -l fluxbench | grep -w fluxbench | awk '{print $3}'`,{ silent: true }).stdout;
   shell.exec("sudo systemctl stop zelcash",{ silent: true })
   shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
   shell.exec("sudo apt-get update",{ silent: true })
   shell.exec("sudo apt-get install fluxbench -y",{ silent: true })
   sleep.sleep(2);
   shell.exec("sudo systemctl start zelcash",{ silent: true })

   var zelbench_dpkg_version_after = shell.exec(`dpkg -l fluxbench | grep -w fluxbench | awk '{print $3}'`,{ silent: true }).stdout;

     if ( (zelbench_dpkg_version_before !== zelbench_dpkg_version_after) && zelbench_dpkg_version_after != "" ){
        console.log('Update successfully.');
        console.log(' ');
        sleep.sleep(2);
     } else {
        console.log('Script called.');
        console.log(' ');
        sleep.sleep(2);
     }


  }
 }
}
console.log('=================================================================');

}


async function zeldaemon_check() {

  delete require.cache[require.resolve('./config.js')];
  var config = require('./config.js');
  web_hook_url = config.web_hook_url;
  action = config.action;
  ping=config.ping;

  const service_inactive = shell.exec("systemctl list-units --full -all | grep 'zelcash' | grep -o 'inactive'",{ silent: true }).stdout;
  const data_time_utc = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  const stillUtc = moment.utc(data_time_utc).toDate();
  const local = moment(stillUtc).local().format('YYYY-MM-DD HH:mm:ss');

  console.log('UTC: '+data_time_utc+' | LOCAL: '+local );
  console.log('=================================================================');

var  update_info = shell.exec("ps aux | grep 'apt' | wc -l",{ silent: true }).stdout;

if ( update_info > 2 ) {
  console.log('Update detected...');
  console.log('Watchdog in sleep mode => '+data_time_utc);
  console.log('=================================================================');
  return;
}

if ( service_inactive.trim() == "inactive" ) {
  console.log('Flux daemon service status: inactive');
  console.log('Watchdog in sleep mode => '+data_time_utc);
  ++inactive_counter;
  console.log('============================================================['+inactive_counter+']');
  if ( inactive_counter > 6 ) {
     shell.exec("sudo fuser -k 16125/tcp",{ silent: true })
     shell.exec("sudo systemctl start zelcash",{ silent: true })
     inactive_counter=0;
   } else {
    return;
   }
}


if ( zelbench_counter > 2 || zelcashd_counter > 2 ){

  try{
    var  zelcash_getinfo_info = JSON.parse(shell.exec(`${daemon_cli} getinfo`,{ silent: true }).stdout);
    var zelcash_check = zelcash_getinfo_info.version;
    var zelbench_getstatus_info = JSON.parse(shell.exec(`${bench_cli} getstatus`,{ silent: true }).stdout);
    var zelbench_benchmark_status = zelbench_getstatus_info.benchmarking;
  } catch {

  }

   if (watchdog_sleep != "1"){

      watchdog_sleep="1";

     if ( zelcashd_counter > 2 ) {
       error('Watchdog in sleep mode! Flux daemon status: not responding');
      } else {
       error('Watchdog in sleep mode! Fluxbench status: '+zelbench_benchmark_status);
      }

   }

   if (typeof zelcash_check !== "undefined" && zelbench_benchmark_status != "toaster" && zelbench_benchmark_status != "failed"  && typeof zelbench_benchmark_status !== "undefined"){
          zelcashd_counter=0;
          zelbench_counter=0;
          watchdog_sleep="N/A"
   } else {

        console.log('Watchdog in sleep mode => '+data_time_utc);
        console.log('=================================================================');
        return;
   }
 }

try{

    var zelbench_getstatus_info = JSON.parse(shell.exec(`${bench_cli} getstatus`,{ silent: true }).stdout);
    var zelbench_status = zelbench_getstatus_info.status;
    var zelback_status = zelbench_getstatus_info.zelback;
    if ( typeof zelback_status  == "undefined" ){
      zelback_status = zelbench_getstatus_info.flux;
    }
    var zelbench_benchmark_status = zelbench_getstatus_info.benchmarking;

 }catch {

}

 try{
    var zelbench_getbenchmarks_info = JSON.parse(shell.exec(`${bench_cli} getbenchmarks`,{ silent: true }).stdout);
  //  var zelbench_ddwrite = zelbench_getbenchmarks_info.ddwrite;
    var zelbench_eps = zelbench_getbenchmarks_info.eps;
    var zelbench_time = zelbench_getbenchmarks_info.time;
 }catch {

}

 try{
    var  zelcash_getinfo_info = JSON.parse(shell.exec(`${daemon_cli} getinfo`,{ silent: true }).stdout);
    var zelcash_check = zelcash_getinfo_info.version;
    var zelcash_height = zelcash_getinfo_info.blocks;
 }catch {

}

 try{
    var zelcash_getzelnodestatus_info = JSON.parse(shell.exec(`${daemon_cli} getzelnodestatus`,{ silent: true }).stdout);
    var zelcash_node_status = zelcash_getzelnodestatus_info.status
    var zelcash_last_paid_height = zelcash_getzelnodestatus_info.last_paid_height
    var activesince = zelcash_getzelnodestatus_info.activesince
    var lastpaid = zelcash_getzelnodestatus_info.lastpaid
 }catch {

}

const mongod_check = shell.exec("pgrep mongod",{ silent: true }).stdout;

if (zelcash_node_status == "" || typeof zelcash_node_status == "undefined" ){
   console.log('Fluxnode status = dead');
} else {
  if ( zelcash_node_status == "expired"){
    console.log('Fluxnode status = '+zelcash_node_status);

    if (expiried_time != "1"){
    expiried_time="1";
    error('Fluxnode expired => UTC: '+data_time_utc+' | LOCAL: '+local);
    await discord_hook('Fluxnode expired\nUTC: '+data_time_utc+'\nLOCAL: '+local,web_hook_url,ping);
    }

   }
  else {
   expiried_time="N/A";
   console.log('Fluxnode status = '+zelcash_node_status);
   }
}

if (zelback_status == "" || typeof zelback_status == "undefined"){
  console.log('Fluxback status = dead');
} else {

  if (zelback_status == "disconnected"){
    console.log('FluxOS status = '+zelback_status);
    if ( lock_zelback != "1" ) {
    error('FluxOS disconnected!');
    await discord_hook("FluxOS disconnected!",web_hook_url,ping);
    lock_zelback=1;
    }
  } else {
    console.log('FluxOS status = '+zelback_status);
    lock_zelback=0;
  }
}

 if (zelbench_status == "" || typeof zelbench_status == "undefined"){
console.log('Fluxbench status = dead');
} else {

  if (zelbench_status  == "online"){
    console.log('Fluxbench status = '+zelbench_status);
  } else {
    console.log('Fluxbench status = '+zelbench_status);
  }

}

if (zelbench_benchmark_status == "" || typeof zelbench_benchmark_status == "undefined"){
  console.log('Fluxbench status = dead');
} else {

  if (zelbench_benchmark_status == "toaster" || zelbench_benchmark_status  == "failed" ){
    console.log('Benchmark status = '+zelbench_benchmark_status);
    await  discord_hook('Benchmark '+zelbench_benchmark_status,web_hook_url,ping);
  } else {
    console.log('Benchmark status = '+zelbench_benchmark_status);
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
  console.log('Last benchmark time = '+bench_local_time);
  console.log('Next benchmark time = '+next_benchmark_time+' (left: '+time_left+')');
}

if (zelcash_last_paid_height  == "null" || zelcash_last_paid_height == "" || typeof zelcash_last_paid_height == "undefined"){
} else{
  console.log('Last paid hight = '+zelcash_last_paid_height);
}

if (lastpaid == "null" || lastpaid == "" || typeof lastpaid == "undefined"){
console.log('Last paid time = '+paid_local_time);
} else{
  var timestamp_paid = moment.unix(Number(lastpaid));
  paid_local_time = timestamp_paid.format("DD/MM/YYYY HH:mm:ss")
  console.log('Last paid time = '+paid_local_time);
}

if (activesince  == "null" || activesince == "" || typeof activesince == "undefined"){
} else{
  const timestamp_active = moment.unix(Number(activesince));
  const active_local_time = timestamp_active.format("DD/MM/YYYY HH:mm:ss")
  console.log('Active since = '+active_local_time);
}

//if (zelbench_ddwrite == "" || typeof zelbench_ddwrite == "undefined"){
//} else{
 // console.log('Disk write speed = '+Number(zelbench_ddwrite).toFixed(2));
//}

if (typeof zelcash_check !== "undefined" ){
  zelcashd_counter=0;
  console.log('Flux daemon status = running');
}
else {

  ++zelcashd_counter;
  console.log('Flux daemon status = dead');

   if ( zelcashd_counter == "1" ){
      error('Flux daemon crash detected!');
     await discord_hook("Flux daemon crash detected!",web_hook_url,ping);
   }

   if ( typeof action  == "undefined" || action == "1" ){
      shell.exec("sudo systemctl stop zelcash",{ silent: true });
      sleep.sleep(2);
      shell.exec("sudo fuser -k 16125/tcp",{ silent: true });
      shell.exec("sudo systemctl start zelcash",{ silent: true });
      console.log(data_time_utc+' => Flux daemon restarting...');
   }

}

if ( zelbench_benchmark_status == "toaster" || zelbench_benchmark_status == "failed" ){
  ++zelbench_counter;
  var error_line=shell.exec("egrep -a --color 'Failed' /home/$USER/.fluxbenchmark/debug.log | tail -1 | sed 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}.[0-9]\{2\}.[0-9]\{2\}.[0-9]\{2\}.//'",{ silent: true });
  error('Benchmark problem detected! Fluxbench status: '+zelbench_benchmark_status);
  error('Reason: '+error_line.trim());
  console.log('Benchmark problem detected! Fluxbench status: '+zelbench_benchmark_status);
  console.log('Reason: '+error_line.trim());
  if ( typeof action  == "undefined" || action == "1" ){
    console.log(data_time_utc+' => Fluxbench restarting...');
    shell.exec(`${bench_cli} restartnodebenchmarks`,{ silent: true });
  }
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
console.log('Benchmark problem detected!');
console.log('CPU eps under minimum limit for '+tire_name+'('+eps_limit+'), current eps: '+zelbench_eps.toFixed(2));
  if ( typeof action  == "undefined" || action == "1" ){
    console.log(data_time_utc+' => Fluxbench restarting...');
    shell.exec(`${bench_cli} restartnodebenchmarks`,{ silent: true });
  }
}

} else {
tire_lock=0;
}

if (mongod_check == ""){

  ++mongod_counter;
  console.log('MongoDB status = dead');

  if (mongod_counter < 4){
      if ( typeof action  == "undefined" || action == "1" ){
          console.log(data_time_utc+' => MongoDB restarting...');
          shell.exec("sudo systemctl restart mongod",{ silent: true })
      }
  }

  if ( mongod_counter == "1" ){
  error('MongoDB crash detected!');
  await discord_hook("MongoDB crash detected!",web_hook_url,ping);
  }

} else {
 mongod_counter=0;
}

 if ( zelcash_height != "" && typeof zelcash_height != "undefined" ){
  await Check_Sync(zelcash_height);
 }


console.log('============================================================['+zelbench_counter+'/'+zelcashd_counter+']');

}
setInterval(zeldaemon_check, 3*60*1000);
setInterval(auto_update, 120*60*1000);
