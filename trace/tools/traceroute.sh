#!/bin/bash

traceroute -m 50 $1 | awk '{print $3}' | tr -d '(' | tr -d ')' | grep -Eo '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}'
