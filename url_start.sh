#!/bin/bash -e

NODE_PORT=${PORT:-8080}
[[ $NODE_PORT = 80 ]] && disp_port="" || disp_port=":$NODE_PORT"

interface=${1:-"enp3s0"}
private_ip=$(ip addr show $interface | awk '/inet / {sub(/\/.*/, "", $2); print $2}')

dim=$'\e[2m'
reset=$'\e[0m'
bold=$'\e[1m'
underline=$'\e[4m'

space=28

prefix='http://'

printf "%-${space}s%s\n" "${dim}Local:${reset}" "${bold}${underline}${prefix}localhost${disp_port}/${reset}"
printf "%-${space}s%s\n" "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local${disp_port}/${reset}"
printf "%-${space}s%s\n" "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}${disp_port}/${reset}"

NODE_PORT=$NODE_PORT docker-compose up
