#!/bin/bash -e

# Define help function
function help () {
  echo "url_start.sh - Wrapper for launching the \"Let's Talk!\" application with docker-compose"
  echo "Usage example:"
  echo "./url_start.sh [(-h|--help)] [(-c|--clean)] [(-i|--interface) string]"
  echo "Options:"
  echo "-h or --help: Displays this information."
  echo "-c or --clean: Purge MySQL database before starting."
  echo "-i or --interface string: Network device interface name."
  exit 1
}

# Declare vars. Flags initalizing to 0.
clean=0;

# Execute getopt
ARGS=$(getopt -o "hci:" -l "help,clean,interface:" -n "url_start.sh" -- "$@");

#Bad arguments
if [ $? -ne 0 ];
then
  help;
fi

eval set -- "$ARGS";

while true; do
  case "$1" in
    -h|--help)
      shift;
      help;
      ;;
    -c|--clean)
      shift;
          clean="1";
      ;;
    -i|--interface)
      shift;
          if [ -n "$1" ]; 
          then
            interface="$1";
            shift;
          fi
      ;;

    --)
      shift;
      break;
      ;;
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

unset db

NODE_PORT=${PORT:-8080}
[[ $NODE_PORT = 80 ]] && disp_port="" || disp_port=":$NODE_PORT"

interface=${interface:-"enp3s0"}
private_ip=$(ip addr show $interface | awk '/inet / {sub(/\/.*/, "", $2); print $2}')

dim=$'\e[2m'
reset=$'\e[0m'
bold=$'\e[1m'
underline=$'\e[4m'

space=28

prefix='http://'

printf "%-${space}s%s\n" "${dim}Local:${reset}" "${bold}${underline}${prefix}localhost${disp_port}/${reset}"

systemctl is-active --quiet avahi-daemon && \
printf "%-${space}s%s\n" "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local${disp_port}/${reset}"

printf "%-${space}s%s\n" "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}${disp_port}/${reset}"


set +e
systemctl is-active --quiet docker
if [ "$?" -ne "0" ]; then
  set -x
  systemctl start docker
  set +x
fi

PORT=$NODE_PORT docker-compose up
