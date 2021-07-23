#!/bin/expect -f

set cid "[lindex $argv 0]"
set duration "[lindex $argv 1]"
set miner "[lindex $argv 2]"

log_user 0
spawn lotus client deal

expect -re "Data CID (from lotus client import):"
send "$cid\n"

expect -re "Deal duration (days):"
send "$duration\n"

expect -re "Make this a verified deal? (yes/no):"
send "yes\n"

expect -re "Miner Addresses (f0.. f0..), none to find:"
send "$miner\n"

expect -re "Accept (yes/no):"
send "yes\n"
log_user 1

expect eof
