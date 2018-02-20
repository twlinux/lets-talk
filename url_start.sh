#!/bin/bash -e

# Define help function
function help(){
  echo "lets-talk - script to start lets-talk";
  echo "Usage example:";
  echo "lets-talk [(-c|--clean)] [(-i|--interface) string]";
  echo "Options:";
  echo "-c or --clean: delete the database before starting MySQL.";
  echo "-i or --interface string: network interface name.";
  exit 1;
}

# Declare vars. Flags initalizing to 0.
clean=0;

# Execute getopt
ARGS=$(getopt -o "ci:" -l "clean,interface:" -n "lets-talk" -- "$@");

#Bad arguments
if [ $? -ne 0 ];
then
  help;
fi

eval set -- "$ARGS";

while true; do
  case "$1" in
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

# Check required arguments


if [ "$clean" = "1" ]; then
  db=database/sql
  sudo rm -r $db
  mkdir $db
  unset db
fi

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
printf "%-${space}s%s\n" "${dim}Avahi mDNS:${reset}" "${bold}${underline}${prefix}$(hostname).local${disp_port}/${reset}"
printf "%-${space}s%s\n" "${dim}Private IP (LAN):${reset}" "${bold}${underline}${prefix}${private_ip}${disp_port}/${reset}"

NODE_PORT=$NODE_PORT docker-compose up
