#!/usr/bin/env node

const exec = require('child_process').exec;
const active_con_script = __dirname + '/tools/active_connections.sh';

const EventEmitter = require('events');

var get_active_connections = function(callback)
{
    exec(active_con_script, function(error, stdout, stderr)
    {
        if(error) {
            console.error("exec error:", error);
            callback(error);
            return;
        }
        var connections = stdout.split('\n');
        connections = connections.filter(function(elem)
        {
            // Filter these specific values
            return ! (elem == "" || elem == "127.0.0.1" || elem == "0.0.0.0");
        });
        callback(undefined, connections);
    });
}

var emitter = new EventEmitter();

var start = function(frequency, callback)
{
    var old = [];

    var fire_events = function(olds, news)
    {
        var i=0;
        var j=0;
        while(true)
        {
            if(i >= olds.length)
            {
                for(; j < news.length; j++)
                {
                    emitter.emit("add", news[j]);
                }
                break;
            }
            if(j >= news.length)
            {
                for(; i < olds.length; i++)
                {
                    emitter.emit("remove", olds[i]);
                }
                break;
            }

            if(olds[i] == news[j])
            {
                i++; j++;
            }
            else if(olds[i] < news[j])
            {
                emitter.emit("remove", olds[i]);
                i++;
            }
            else if(olds[i] > news[j])
            {
                emitter.emit("add", news[j]);
                j++;
            }
        }
    }

    var start_refresher = function()
    {
        var handler = function()
        {
            get_active_connections(function(err, cons)
            {
                if(err)
                {
                    emitter.emit('error', err);
                    return;
                }

                cons.sort();
                fire_events(old, cons);

                old = cons;

                setTimeout(handler, frequency);
            });
        }

        setTimeout(handler, frequency);
    }

    get_active_connections(function(err, cons)
    {
        if(err)
        {
            emitter.emit('error', err);
            callback(err);
            return;
        }

        cons.sort();
        old = cons;
        start_refresher();

        callback(undefined, cons);
    });
}

module.exports = {
    start: start,
    emitter: emitter
}
