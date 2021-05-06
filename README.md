# WATCHDOG FOR FLUXNODE
<b>How install watchdog:</b>   
```bash -i <(curl -s https://raw.githubusercontent.com/XK4MiLX/zelnode/master/multitoolbox.sh)```  

![screen2](https://raw.githubusercontent.com/XK4MiLX/zelnode/master/image/w_menu.jpg)

* Use option "2" for new installation diuring install process anser yes when will ask about watchdog install
* For existing node installation use option "4"

<b>Watchdog config file:</b>

```
Update settings:
zelflux_update, zelcash_update, zelbench_update
0 - option disabled, 1 - option enabled

Discord alert:
0 - disabled
url set endabled ( ex. https://discord.com/api/webhooks/824918255701614100/6h58eHyqGOUMqc3EXe7u4l-mE2ViJKV2_2IzUQw3u5QziVqx3wmBvqWMSpVr8_PIQ0E5 )
```
<b>Sample config::</b>
```
module.exports = {
    tier_eps_min: '300',
    zelflux_update: '0',
    zelcash_update: '1',
    zelbench_update: '0',
    web_hook_url: 'https://discord.com/api/webhooks/844918252704614100/6hB8eHyqGOUMqc3EBe7u4l-sE2ViJKV2_2IzUQw3u0QziVqx3gmBvqWMSpVr8_PIQ0E5'
}
```
<b>Watchdog options:</b>
* Auto restart daemon when crash  
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

