#!/bin/bash

netstat -natp 2>/dev/null | awk '{print $5}' | grep -Eo '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | sort | uniq
