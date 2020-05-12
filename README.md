# Watchdog for ZelNode
<b>How install watchdog:</b> 
```bash -i <(curl -s https://raw.githubusercontent.com/XK4MiLX/zelnode/master/multitoolbox.sh)```  

![screen2](https://raw.githubusercontent.com/XK4MiLX/zelnode/master/image/watchdog01.jpg)

* Use option "2" for new installation diuring install process anser yes when will ask about watchdog install
* For existing node installation use option "4"

<b>Watchdog options:</b>
* Auto restart zelcash daemon when crash  
* Auto restart benchmark when "failed" or "taoster"
* Auto restart when eps drop belown minim. limit for tier
* Auto restart MongoDB when crash
* Auto-update supported
* Logs in real time => type "pm2 monit" and select "watchdog"  
* Log file with error events (~/watchdog/watchdog_error.log)

<b>How correct start, stop, restart watchdog</b>
* Start -> pm2 start watchdog <b>--watch</b> 
* Stop -> pm2 stop watchdog  
* Restart -> pm2 reload watchdog <b>--watch</b>  
  
<b>Any donations are welcomed and appreciated. Thanks.</b>  
```
CruxID: k4mil@zel.crux  
ZEL: t1f66kBo9xzpgPJV6wvzT7MY6unpm42kvST  
BTC: 1NDVjrP1zg35nfSD1WBKyYSBf8dgJ8AKay  
ETH: 0xf515e0e2ba9347c208418c88a7d75bee3288a010  
LTC: LgST14gr5LH93U8NBeAdFZVwsLzxTBRTq8
```

