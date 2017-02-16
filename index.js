#!/usr/bin/env node

var geoip = require('geoip-lite');
var active = require('./active_con');
var trace = require('./trace');

var EventEmitter = require('events');
var emitter = new EventEmitter();

var express = require('express')
var app = express()
var expressWs = require('express-ws')(app);
app.use(express.static('static'))

app.ws('/com', function(ws, req) 
{
    // TODO: Handle closing
    ws.on('message', function(msg)
    {
        if(msg == "refresh")
        {
            ws.send(JSON.stringify({type: 'refresh', payload: output}));
        }
        else if(msg == "update")
        {
            emitter.on('add', function(elem, positions)
            {
                ws.send(JSON.stringify({type: 'add', elem: elem, coords: positions}));
            });
            emitter.on('remove', function(elem, no_retry)
            {
                ws.send(JSON.stringify({type: 'remove', elem: elem}));
            });
        }
        else
        {
            ws.send(JSON.stringify({type: "PONG", payload: msg}));
        }
    });
});

app.listen(3000, function () 
{
    console.log('Example app listening on port 3000!')
});

emitter.on('add', function(elem, positions)
{
    output[elem] = positions;
    console.log("Connections", Object.keys(output).length, "(add)");
});

emitter.on('remove', function(elem, no_retry)
{
    delete output[elem];
    var remove_type = (no_retry ? "(delayed remove)" : "(remove)");
    console.log("Connections", Object.keys(output).length, remove_type);
});

var trace_and_add_element = function(elem)
{
    trace(elem, function(err, hops)
    {
        var geoips = hops.map(function(elem)
        {
            return geoip.lookup(elem);
        });
        var positions = geoips.map(function(elem)
        {
            if(elem && elem.ll)
                return elem.ll;
            else
                return [null, null];
        });

        emitter.emit('add', elem, positions);
    });
}

var remove_element = function(elem, no_retry)
{
    if(output[elem])
    {
        emitter.emit('remove', elem, no_retry);
    }
    else
    {
        console.warn(elem, ":", "Not found in output");
        if(no_retry)
        {
            console.error("Error:");
            console.error(elem, ":", "Delayed removal failed!");
        }
        else
        {
            console.warn("Trying delayed removal, removing in 60 seconds...");
            setTimeout(function()
            {
                remove_element(elem, true);
            }, 60 * 1000);
        }
    }
}

active.emitter.on("add", trace_and_add_element);

active.emitter.on("remove", remove_element);

active.emitter.on("error", function(err)
{
    console.error("Error:");
    console.error(err);
});

var output = {};

active.start(10000, function(err, cons)
{
    if(err)
    {
        process.exit(1);
    }

    console.log("Initial connections:");
    console.log("--------------------");
    console.log(cons);

    cons.forEach(function(elem)
    {
        trace_and_add_element(elem);
    });
});
