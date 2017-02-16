#!/usr/bin/env node

const exec = require('child_process').exec;
const traceroute_script = __dirname + '/tools/traceroute.sh';

var get_traceroute = function(ip, callback)
{
    exec(traceroute_script + " " + ip, function(error, stdout, stderr)
    {
        if(error) {
            console.error("exec error:", error);
            callback(error);
        }
        var hops = stdout.split('\n');
        hops = hops.filter(function(elem)
        {
            // Filter these specific values
            return ! (elem == "" || elem == "127.0.0.1" || elem == "0.0.0.0");
        });
        callback(undefined, hops);
    });
}

module.exports = get_traceroute;
