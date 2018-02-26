#!/bin/bash -e

# http://wiki.bash-hackers.org/howto/getopts_tutorial
function help () {
  cat << EOF
usage: ./url_start.sh [--help] [--purge] [--interfacce NIC]

Wrapper script for launching the "Let's Talk!" application with docker-compose on Linux.

optional arguments:
  -h, --help            show this help message and exit
  -p, --purge           delete the MySQL database before starting, a new one will be created.
  -i, --interface NIC   specify the network interface for private IP address (default: enp3s0)
EOF
  exit
}

clean=0;
interface=enp3s0

ARGS=$(getopt -o "hpi:" -l "help,purge,interface:" -n "url_start.sh" -- "$@")

if [ $? -ne 0 ];
then
  help
fi

eval set -- "$ARGS";

while true; do
  case "$1" in
    -h | --help )       shift; help      ;;
    -p | --purge )      shift; clean="1" ;;
    -i | --interface )  shift;
      if [ -n "$1" ]; then
        interface="$1"
        shift
      fi                                 ;;
    -- )                shift; break;    ;;
  esac
done


db=database/sql
mkdir -p $db

if [ "$clean" = "1" ]; then
  set -x
  sudo rm -r $db
  mkdir $db
  set +x
fi

NODE_PORT=${PORT:-8080}
[[ $NODE_PORT = 80 ]] && disp_port="" || disp_port=":$NODE_PORT"

private_ip=$(ip addr show $interface | awk '/inet / {sub(/\/.*/, "", $2); print $2}')

dim=$'\e[2m'
reset=$'\e[0m'
bold=$'\e[1m'
underline=$'\e[4m'

space=28
strf="%-${space}s%s\n"

prefix='http://'

printf $strf "${dim}Local:${reset}" "${bold}${underline}${prefix}localhost${disp_port}/${reset}"
systemctl is-active --quiet avahi-daemon && \
printf $strf "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local${disp_port}/${reset}"
[[ $private_ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]] && \
printf $strf "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}${disp_port}/${reset}"


set +e
systemctl is-active --quiet docker
if [ "$?" -ne "0" ]; then
  set -x
  systemctl start docker
  set +x
fi

PORT=$NODE_PORT docker-compose up
