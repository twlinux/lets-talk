#!/bin/bash -e

NODE_PORT=${1:-8080}
interface="enp3s0"
private_ip=$(ip addr show $interface | awk '/inet / {sub(/\/.*/, "", $2); print $2}')

dim=$'\e[2m'
reset=$'\e[0m'
bold=$'\e[1m'
underline=$'\e[4m'

space=28

prefix='http://'

printf "%-${space}s%s\n" "${dim}Local:${reset}" "${bold}${underline}${prefix}localhost:$NODE_PORT/${reset}"
printf "%-${space}s%s\n" "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local:$NODE_PORT/${reset}"
printf "%-${space}s%s\n" "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}:$NODE_PORT/${reset}"

NODE_PORT=$NODE_PORT docker-compose up
